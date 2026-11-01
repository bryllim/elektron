import { z } from "zod";
import {
  metaConfig,
  metaRespond,
  metaFailure,
  readJson,
  responseText,
} from "@/lib/meta";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const parsed = z
      .object({ profile: z.enum(["triage", "deep", "vision"]) })
      .strict()
      .safeParse(await readJson(request));
    if (!parsed.success)
      return Response.json(
        { error: "Choose an available model profile." },
        { status: 400 },
      );
    const model = metaConfig().models[parsed.data.profile];
    const started = Date.now();
    const response = await metaRespond(
      {
        model,
        reasoning: { effort: "minimal" },
        max_output_tokens: 128,
        input:
          "Reply with the single word READY. This is an API connectivity check, not an operational request.",
      },
      AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
    );
    if (!responseText(response).trim()) throw new Error("Empty probe");
    return Response.json(
      {
        ok: true,
        model,
        checkedAt: new Date().toISOString(),
        elapsedMs: Date.now() - started,
        scope:
          "Text inference verified. Vision and segmentation are verified only by a successful image inspection.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    const failure = metaFailure(error);
    return Response.json(
      { error: failure.message, code: failure.code },
      { status: failure.status },
    );
  }
}
