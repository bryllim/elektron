import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { GET, POST as investigate } from "../app/api/agent/route";
import { POST as inspect } from "../app/api/inspection/route";
import { POST as check } from "../app/api/meta/check/route";
import { segmentImage, normalizeInspectionImage } from "../lib/meta-inspection";
import { readJson } from "../lib/meta";

function request(body: unknown, signal?: AbortSignal) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}
async function fixtureImage() {
  const png = await sharp({
    create: { width: 320, height: 334, channels: 3, background: "#303b35" },
  })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
// Official Meta parser README fixture: real wire grammar with a lossless object mask.
const samText =
  "<0f>0<|box;x1=211;y1=228;x2=270;y2=254;w=320;h=334;c=0.9|>" +
  "<|mask;x=0;y=0;c=0.9;data=27,60,~!!!!M!0c[0o91w?q1!pIH4pPRVp2B3'7`e.ioeAf6-k/#Xd8%dX9x(|>\n";
function samResponse(text = samText, complete = true) {
  const lane = { item_id: "sam-message", output_index: 0, content_index: 0 };
  const events = [
    { type: "response.output_text.delta", ...lane, delta: text.slice(0, 51) },
    { type: "response.output_text.delta", ...lane, delta: text.slice(51) },
    { type: "response.output_text.done", ...lane, text },
    ...(complete ? [{ type: "response.completed" }] : []),
  ];
  const bytes = new TextEncoder().encode(
    events.map((e) => `data: ${JSON.stringify(e)}\r\n\r\n`).join(""),
  );
  return new Response(
    new ReadableStream({
      start(controller) {
        // Network chunks deliberately split event boundaries, JSON and mask payloads.
        for (let i = 0; i < bytes.length; i += 17)
          controller.enqueue(bytes.slice(i, i + 17));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
}
async function withProvider(fetcher: typeof fetch, run: () => Promise<void>) {
  const saved = process.env.META_API_KEY,
    previous = globalThis.fetch;
  process.env.META_API_KEY = "test-key-never-real";
  globalThis.fetch = fetcher;
  try {
    await run();
  } finally {
    globalThis.fetch = previous;
    if (saved === undefined) delete process.env.META_API_KEY;
    else process.env.META_API_KEY = saved;
  }
}

test("Meta status publishes model profiles without exposing credentials or claiming verified inference", async () => {
  await withProvider(
    async () => {
      throw new Error("Status must not invoke a model");
    },
    async () => {
      const response = await GET();
      const data = await response.json();
      assert.equal(data.configured, true);
      assert.equal(data.models.deep, "muse-wonder-1.0");
      assert.equal(data.models.segmentation, "sam-3.1");
      assert.ok(!JSON.stringify(data).includes("test-key"));
      assert.ok(!("verified" in data));
      assert.equal(response.headers.get("Cache-Control"), "no-store");
    },
  );
});

test("deep investigations route to Wonder and retain encrypted reasoning and usage provenance", async () => {
  let calls = 0;
  await withProvider(
    async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.model, "muse-wonder-1.0");
      assert.equal(body.reasoning.effort, "high");
      if (++calls === 1)
        return Response.json({
          output: [
            { type: "reasoning", encrypted_content: "encrypted-fixture" },
            {
              type: "function_call",
              call_id: "brief1",
              name: "get_operational_brief",
              arguments: '{"timeRange":{"start":762,"end":822}}',
            },
          ],
          usage: { input_tokens: 100, output_tokens: 50 },
        });
      assert.deepEqual(
        body.input.find((i: { type: string }) => i.type === "reasoning")
          .summary,
        [],
      );
      return Response.json({
        id: "response-fixture",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "Review the localized derating [EV-001].",
              },
            ],
          },
        ],
        usage: { input_tokens: 200, output_tokens: 60 },
      });
    },
    async () => {
      const response = await investigate(
        request({
          question: "Investigate the fleet deeply",
          minute: 822,
          scenario: "derating",
          siteId: "silangan",
          analysisMode: "deep",
        }),
      );
      const data = await response.json();
      assert.equal(data.model, "muse-wonder-1.0");
      assert.equal(data.analysisMode, "deep");
      assert.deepEqual(data.usage, { input_tokens: 300, output_tokens: 110 });
      assert.equal(data.responseId, "response-fixture");
      assert.ok(!JSON.stringify(data).includes("encrypted-fixture"));
    },
  );
});

test("visual inspection requires a key and rejects arbitrary URL input", async () => {
  const saved = process.env.META_API_KEY;
  delete process.env.META_API_KEY;
  try {
    const body = {
      image: await fixtureImage(),
      target: "cooling towers",
      source: "simulated_scene",
    };
    assert.equal((await inspect(request(body))).status, 503);
    assert.equal(
      (
        await inspect(
          request({ ...body, image: "https://untrusted.example/private.jpg" }),
        )
      ).status,
      400,
    );
    assert.equal((await check(request({ profile: "deep" }))).status, 503);
  } finally {
    if (saved !== undefined) process.env.META_API_KEY = saved;
  }
});

test("SAM stream yields aligned boxes and decoded masks, then Spark interprets the same normalized image", async () => {
  let calls = 0,
    sentImage = "";
  await withProvider(
    async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.store, false);
      const content = body.input[0].content;
      if (++calls === 1) {
        assert.equal(body.model, "sam-3.1");
        assert.equal(body.stream, true);
        assert.equal(body.metadata.include_confidence, "true");
        sentImage = content[1].image_url;
        return samResponse();
      }
      assert.equal(body.model, "muse-spark-1.3");
      assert.equal(content[1].image_url, sentImage);
      assert.match(content[0].text, /simulated_scene/);
      return Response.json({
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "Observed: a simulated equipment rendering. Verify conditions using field inspection.",
              },
            ],
          },
        ],
      });
    },
    async () => {
      const response = await inspect(
        request({
          image: await fixtureImage(),
          target: "cooling towers",
          source: "simulated_scene",
        }),
      );
      const data = await response.json();
      assert.equal(response.status, 200, JSON.stringify(data));
      assert.equal(data.totalMatches, 1);
      assert.equal(data.width, 320);
      assert.equal(data.height, 334);
      assert.deepEqual(data.detections[0].box, {
        left: 211,
        top: 228,
        right: 271,
        bottom: 255,
      });
      assert.equal(data.detections[0].confidence, 0.9);
      assert.match(data.detections[0].mask.path, /^M/);
      assert.equal(data.detections[0].mask.x, 211);
      assert.equal(data.detections[0].mask.y, 228);
      assert.equal(data.detections[0].mask.scaleX, 1);
      assert.equal(data.detections[0].mask.scaleY, 1);
      assert.equal(data.models.vision, "muse-spark-1.3");
      assert.equal(calls, 2);
    },
  );
});

test("zero SAM matches are valid; incomplete streams and invalid bounds are never presented as success", async () => {
  const signal = new AbortController().signal;
  await withProvider(
    async () => samResponse(""),
    async () => {
      assert.deepEqual(
        await segmentImage("fixture", "trees", "sam-3.1", 320, 334, signal),
        { detections: [], totalMatches: 0 },
      );
    },
  );
  await withProvider(
    async () => samResponse(samText, false),
    async () => {
      await assert.rejects(
        segmentImage("fixture", "trees", "sam-3.1", 320, 334, signal),
        /incomplete/,
      );
    },
  );
  await withProvider(
    async () => samResponse(),
    async () => {
      await assert.rejects(
        segmentImage("fixture", "trees", "sam-3.1", 20, 20, signal),
        /outside/,
      );
    },
  );
});

test("vision failure preserves successful segmentation with explicit partial-result provenance", async () => {
  let calls = 0;
  await withProvider(
    async () =>
      ++calls === 1 ? samResponse() : new Response("{}", { status: 403 }),
    async () => {
      const response = await inspect(
        request({
          image: await fixtureImage(),
          target: "trees",
          source: "field_photo",
        }),
      );
      const data = await response.json();
      assert.equal(data.totalMatches, 1);
      assert.equal(data.models.vision, null);
      assert.equal(data.interpretation, "");
      assert.match(data.notice, /unavailable/);
    },
  );
});

test("image decoding and request size limits reject malformed or excessive inputs", async () => {
  await assert.rejects(
    normalizeInspectionImage("data:image/png;base64,bm90LWFuLWltYWdl"),
    /could not be decoded/,
  );
  await assert.rejects(
    readJson(request({ text: "x".repeat(200) }), 50),
    /too large/,
  );
});

test("connection probes verify a real text response and surface access errors without secrets", async () => {
  await withProvider(
    async () =>
      Response.json({
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: "READY" }],
          },
        ],
      }),
    async () => {
      const data = await (await check(request({ profile: "triage" }))).json();
      assert.equal(data.ok, true);
      assert.match(data.scope, /Text inference verified/);
      assert.ok(!JSON.stringify(data).includes("test-key"));
    },
  );
  await withProvider(
    async () => new Response("sensitive-provider-details", { status: 401 }),
    async () => {
      const response = await check(request({ profile: "deep" }));
      const data = await response.json();
      assert.equal(response.status, 502);
      assert.equal(data.code, "access_denied");
      assert.ok(!JSON.stringify(data).includes("sensitive-provider-details"));
    },
  );
});

test("cancelled image inspection cannot return late detections", async () => {
  await withProvider(
    async () => {
      throw new Error("Cancelled call must not reach provider");
    },
    async () => {
      const controller = new AbortController();
      controller.abort();
      const response = await inspect(
        request(
          {
            image: await fixtureImage(),
            target: "trees",
            source: "simulated_scene",
          },
          controller.signal,
        ),
      );
      assert.equal(response.status, 499);
      assert.equal(await response.text(), "");
    },
  );
});
