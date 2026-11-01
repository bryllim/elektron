/** Server-only transport. Credentials and endpoint overrides never enter client bundles. */
export function metaConfig() {
  return {
    key: process.env.META_API_KEY?.trim() || "",
    baseUrl: (process.env.META_BASE_URL || "https://api.meta.ai/v1").replace(
      /\/$/,
      "",
    ),
    models: {
      triage: process.env.META_MODEL || "muse-spark-1.3",
      deep: process.env.META_DEEP_MODEL || "muse-wonder-1.0",
      vision: process.env.META_VISION_MODEL || "muse-spark-1.3",
      segmentation: process.env.META_SAM_MODEL || "sam-3.1",
    },
  };
}

export type MetaStatus = {
  configured: boolean;
  model: string;
  mode: string;
  models: ReturnType<typeof metaConfig>["models"];
};
export function metaStatus(): MetaStatus {
  const { key, models } = metaConfig();
  return {
    configured: !!key,
    model: models.triage,
    models,
    mode: key ? "Muse · Ready to investigate" : "Scripted demo agent",
  };
}

export class MetaError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}
export function metaFailure(error: unknown) {
  if (error instanceof MetaError) return error;
  if (error instanceof Error && /abort|timeout/i.test(error.name))
    return new MetaError(
      "timeout",
      "Meta did not finish in time. Please retry.",
      504,
    );
  return new MetaError(
    "provider_error",
    "Meta could not complete this request. Please retry.",
  );
}

export async function metaFetch(
  payload: Record<string, unknown>,
  signal: AbortSignal,
) {
  const config = metaConfig();
  if (!config.key)
    throw new MetaError(
      "key_required",
      "Add META_API_KEY to .env.local and restart the app to enable Meta inference.",
      503,
    );
  signal.throwIfAborted();
  const response = await fetch(`${config.baseUrl}/responses`, {
    method: "POST",
    signal,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.key}`,
    },
    body: JSON.stringify({ store: false, ...payload }),
  });
  if (!response.ok) {
    await response.body?.cancel();
    if ([401, 403].includes(response.status))
      throw new MetaError(
        "access_denied",
        "Meta rejected the key or model access. Check your project permissions.",
        502,
      );
    if (response.status === 429)
      throw new MetaError(
        "rate_limited",
        "Meta rate limit or quota reached. Check your credits, then retry.",
        429,
      );
    if (response.status === 404)
      throw new MetaError(
        "model_unavailable",
        "This Meta model is unavailable for the configured endpoint or project.",
      );
    throw new MetaError(
      "provider_error",
      `Meta could not complete the request (HTTP ${response.status}).`,
    );
  }
  return response;
}

export type MetaResponse = {
  id?: string;
  model?: string;
  status?: string;
  output: Array<Record<string, unknown>>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};
export async function metaRespond(
  payload: Record<string, unknown>,
  signal: AbortSignal,
): Promise<MetaResponse> {
  const response = await metaFetch(payload, signal);
  const data = await response.json();
  if (
    !Array.isArray(data.output) ||
    (data.status && data.status !== "completed")
  )
    throw new MetaError(
      "invalid_response",
      "Meta returned an incomplete response. Please retry.",
    );
  return data;
}
export function responseText(data: MetaResponse) {
  return data.output
    .filter((item) => item.type === "message" && item.phase !== "commentary")
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter(
      (part) => part.type === "output_text" && typeof part.text === "string",
    )
    .map((part) => part.text as string)
    .join("\n");
}

/** Size bounded JSON input, including callers without Content-Length. */
export async function readJson(
  request: Request,
  limit = 16_384,
): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader)
    throw new MetaError("invalid_request", "A request body is required.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new MetaError("too_large", "The request is too large.", 413);
      }
      chunks.push(value);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new MetaError(
        "invalid_request",
        "The request must contain valid JSON.",
        400,
      );
    }
  } finally {
    reader.releaseLock();
  }
}
