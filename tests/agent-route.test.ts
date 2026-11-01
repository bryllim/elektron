import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/agent/route";
const body = {
  question: "Why did output drop?",
  minute: 822,
  scenario: "derating",
  siteId: "silangan",
};
function request(value: unknown = body, signal?: AbortSignal) {
  return new Request("http://localhost/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
    signal,
  });
}
test("agent route rejects malformed requests before running tools", async () => {
  for (const value of [
    { ...body, siteId: "real-plant" },
    { ...body, minute: 99999 },
    { ...body, question: "" },
    { ...body, scenario: "live" },
  ]) {
    const r = await POST(request(value));
    assert.equal(r.status, 400);
  }
});
test("credential-free route returns explicitly labeled grounded demo evidence", async () => {
  const saved = process.env.META_API_KEY;
  delete process.env.META_API_KEY;
  try {
    const r = await POST(request());
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.mode, "Scripted demo agent");
    assert.ok(d.evidence.length >= 5);
    assert.ok(d.actions.some((a: { type: string }) => a.type === "focus"));
    assert.match(d.answer, /322 kW/);
  } finally {
    if (saved) process.env.META_API_KEY = saved;
  }
});
test("rate-limit and provider errors remain usable with a visible fallback notice", async () => {
  const saved = process.env.META_API_KEY,
    fetcher = globalThis.fetch;
  process.env.META_API_KEY = "test-only-not-a-real-key";
  globalThis.fetch = async () => new Response("{}", { status: 429 });
  try {
    const r = await POST(request());
    const d = await r.json();
    assert.equal(r.status, 200);
    assert.equal(d.mode, "Scripted demo agent");
    assert.match(d.notice, /unavailable/);
    assert.ok(d.evidence.length > 0);
  } finally {
    globalThis.fetch = fetcher;
    if (saved) process.env.META_API_KEY = saved;
    else delete process.env.META_API_KEY;
  }
});
test("bounded model loop rejects malformed tools and falls back rather than applying them", async () => {
  const saved = process.env.META_API_KEY,
    fetcher = globalThis.fetch;
  let calls = 0;
  process.env.META_API_KEY = "test-only-not-a-real-key";
  globalThis.fetch = async () => {
    calls++;
    return Response.json({
      output: [
        {
          type: "function_call",
          call_id: "call1",
          name: "focus_asset",
          arguments: '{"assetId":"INV-99"}',
        },
      ],
    });
  };
  try {
    const r = await POST(request());
    const d = await r.json();
    assert.equal(d.mode, "Scripted demo agent");
    assert.ok(calls <= 7);
    assert.ok(
      !d.actions.some((a: { assetId?: string }) => a.assetId === "INV-99"),
    );
  } finally {
    globalThis.fetch = fetcher;
    if (saved) process.env.META_API_KEY = saved;
    else delete process.env.META_API_KEY;
  }
});
test("a cancelled provider investigation cannot return late viewer actions", async () => {
  const saved = process.env.META_API_KEY;
  process.env.META_API_KEY = "test-only-not-a-real-key";
  try {
    const c = new AbortController();
    c.abort();
    const r = await POST(request(body, c.signal));
    assert.equal(r.status, 499);
    assert.equal(await r.text(), "");
  } finally {
    if (saved) process.env.META_API_KEY = saved;
    else delete process.env.META_API_KEY;
  }
});

test("Meta tool loop replays reasoning and evidence and returns model provenance", async () => {
  const saved = process.env.META_API_KEY,
    fetcher = globalThis.fetch;
  process.env.META_API_KEY = "test-only-not-a-real-key";
  let count = 0;
  globalThis.fetch = async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.store, false);
    assert.ok(
      payload.tools.some(
        (t: { name: string }) => t.name === "get_operational_brief",
      ),
    );
    if (++count === 1)
      return Response.json({
        output: [
          { type: "reasoning", encrypted_content: "opaque-test-reasoning" },
          {
            type: "function_call",
            call_id: "brief-1",
            name: "get_operational_brief",
            arguments: '{"timeRange":{"start":762,"end":822}}',
          },
        ],
      });
    assert.ok(
      payload.input.some((i: { type: string }) => i.type === "reasoning"),
    );
    const result = payload.input.find(
      (i: { type: string }) => i.type === "function_call_output",
    );
    assert.equal(result.call_id, "brief-1");
    assert.equal(JSON.parse(result.output).id, "EV-001");
    return Response.json({
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: "Silangan has a localized derating flag [EV-001]. Review peer output before planning maintenance.",
            },
          ],
        },
      ],
    });
  };
  try {
    const response = await POST(request());
    const data = await response.json();
    assert.equal(data.mode, "Muse · Meta Model API");
    assert.ok(data.model);
    assert.ok(data.elapsedMs >= 0);
    assert.equal(data.evidence.length, 1);
    assert.equal(count, 2);
  } finally {
    globalThis.fetch = fetcher;
    if (saved) process.env.META_API_KEY = saved;
    else delete process.env.META_API_KEY;
  }
});

test("unknown model citations trigger an explicitly labeled fallback", async () => {
  const saved = process.env.META_API_KEY,
    fetcher = globalThis.fetch;
  process.env.META_API_KEY = "test-only-not-a-real-key";
  let count = 0;
  globalThis.fetch = async () =>
    ++count === 1
      ? Response.json({
          output: [
            {
              type: "function_call",
              call_id: "brief-1",
              name: "get_operational_brief",
              arguments: '{"timeRange":{"start":762,"end":822}}',
            },
          ],
        })
      : Response.json({
          output: [
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text: "Confirmed cooling failure [EV-999].",
                },
              ],
            },
          ],
        });
  try {
    const data = await (await POST(request())).json();
    assert.equal(data.mode, "Scripted demo agent");
    assert.match(data.notice, /unavailable/);
    assert.doesNotMatch(data.answer, /EV-999/);
  } finally {
    globalThis.fetch = fetcher;
    if (saved) process.env.META_API_KEY = saved;
    else delete process.env.META_API_KEY;
  }
});
