import sharp from "sharp";
import {
  parseImageStream,
  recordsOfKind,
  decodeMaskToSVGPath,
  type ResponsesEvent,
} from "@meta-sam/parser";
import { z } from "zod";
import { metaFetch, MetaError } from "./meta";

export const inspectionSchema = z
  .object({
    image: z
      .string()
      .max(5_600_000)
      .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),
    target: z.enum([
      "solar panels",
      "wind turbines",
      "trees",
      "cooling towers",
      "water",
    ]),
    source: z.enum(["field_photo", "simulated_scene"]),
  })
  .strict();

export type Detection = {
  id: string;
  box: { left: number; top: number; right: number; bottom: number };
  confidence?: number;
  mask: {
    path: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
  } | null;
};
export type InspectionResult = {
  image: string;
  width: number;
  height: number;
  source: "field_photo" | "simulated_scene";
  target: string;
  detections: Detection[];
  totalMatches: number;
  interpretation: string;
  notice?: string;
  models: { segmentation: string; vision: string | null };
  elapsedMs: number;
};

export async function normalizeInspectionImage(dataUrl: string) {
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  if (bytes.length > 4_000_000)
    throw new MetaError("too_large", "Choose an image under 4 MB.", 413);
  try {
    // Rotate according to EXIF before segmentation, strip metadata and bound decoded pixels.
    const { data, info } = await sharp(bytes, { limitInputPixels: 20_000_000 })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
    return {
      image: `data:image/jpeg;base64,${data.toString("base64")}`,
      width: info.width,
      height: info.height,
    };
  } catch {
    throw new MetaError(
      "invalid_image",
      "This image could not be decoded. Choose a JPEG, PNG or WebP under 20 megapixels.",
      400,
    );
  }
}

/** Decode SSE on the server; never expose credentials or raw provider events to the browser. */
export async function* responseEvents(
  response: Response,
): AsyncGenerator<ResponsesEvent> {
  const reader = response.body?.getReader();
  if (!reader)
    throw new MetaError(
      "empty_stream",
      "Meta returned no segmentation stream.",
    );
  const decoder = new TextDecoder();
  let buffer = "",
    size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 12_000_000)
        throw new MetaError(
          "output_limit",
          "The image produced too much segmentation data. Try a smaller crop.",
        );
      buffer += decoder.decode(value, { stream: true });
      let end: RegExpExecArray | null;
      while ((end = /\r?\n\r?\n/.exec(buffer))) {
        const event = buffer.slice(0, end.index);
        buffer = buffer.slice(end.index + end[0].length);
        const data = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!data || data === "[DONE]") continue;
        yield JSON.parse(data) as ResponsesEvent;
      }
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

export async function segmentImage(
  image: string,
  target: string,
  model: string,
  width: number,
  height: number,
  signal: AbortSignal,
) {
  const response = await metaFetch(
    {
      model,
      stream: true,
      metadata: { mask_encoding: "one_bit", include_confidence: "true" },
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: target },
            { type: "input_image", image_url: image },
          ],
        },
      ],
    },
    signal,
  );
  const result = await parseImageStream(responseEvents(response)).finalResult;
  if (
    result.outcome.status !== "completed" ||
    result.diagnostics.length ||
    result.records.some(
      (record) => record.kind === "text" && record.text.trim(),
    )
  )
    throw new MetaError(
      "invalid_segmentation",
      "The segmentation response was incomplete or malformed. Please retry.",
    );
  const boxes = recordsOfKind(result.records, "box");
  const masks = recordsOfKind(result.records, "mask");
  const detections: Detection[] = boxes.slice(0, 40).map((box) => {
    if (
      box.left < 0 ||
      box.top < 0 ||
      box.right > width ||
      box.bottom > height ||
      box.right <= box.left ||
      box.bottom <= box.top
    )
      throw new MetaError(
        "invalid_bounds",
        "Meta returned object coordinates outside the image.",
      );
    const mask = masks.find((m) => m.objectId === box.objectId);
    if (
      mask &&
      (mask.mask.width * mask.mask.height > 2_560_000 ||
        mask.mask.width < 1 ||
        mask.mask.height < 1 ||
        mask.bounds.left < 0 ||
        mask.bounds.top < 0 ||
        mask.bounds.right > width ||
        mask.bounds.bottom > height ||
        mask.bounds.right <= mask.bounds.left ||
        mask.bounds.bottom <= mask.bounds.top)
    )
      throw new MetaError("invalid_mask", "Meta returned an oversized mask.");
    return {
      id: box.objectId,
      box: {
        left: box.left,
        top: box.top,
        right: box.right,
        bottom: box.bottom,
      },
      confidence: box.confidence,
      mask: mask
        ? {
            path: decodeMaskToSVGPath(mask.mask),
            x: mask.bounds.left,
            y: mask.bounds.top,
            scaleX: (mask.bounds.right - mask.bounds.left) / mask.mask.width,
            scaleY: (mask.bounds.bottom - mask.bounds.top) / mask.mask.height,
          }
        : null,
    };
  });
  return { detections, totalMatches: boxes.length };
}
