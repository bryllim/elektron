import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SITES,
  ASSETS,
  BASE_MINUTE,
  assetMeasurement,
  siteMeasurement,
  fleetMeasurement,
  integrateEnergy,
  whatIf,
  weather,
  timestamp,
  minuteFromTimestamp,
  Scenario,
} from "../lib/simulation";
import {
  validateTool,
  executeTool,
  scriptedInvestigation,
  ToolContext,
} from "../lib/agent-tools";
const close = (a: number, b: number, tolerance = 1e-9) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
const ctx = (scenario: Scenario = "derating"): ToolContext => ({
  minute: BASE_MINUTE,
  scenario,
  siteId: "silangan",
  evidence: [],
  actions: [],
  activity: [],
});
test("fleet totals reconcile to site generation; storage dispatch is separate", () => {
  const f = fleetMeasurement(BASE_MINUTE, "derating");
  close(
    f.generation!,
    f.sites
      .filter((s) => s.technology !== "Storage")
      .reduce((n, s) => n + s.actual!, 0),
  );
  close(
    f.net!,
    f.sites.reduce((n, s) => n + s.net!, 0),
  );
  assert.equal(f.capacity, 136);
});
test("twelve inverter ratings reconcile to 12 MWp DC and 10 MW AC", () => {
  close(
    ASSETS.reduce((n, a) => n + a.rating, 0),
    10,
  );
  close(
    ASSETS.reduce((n, a) => n + a.dc, 0),
    12,
  );
  const actual = ASSETS.reduce(
    (n, a) => n + assetMeasurement(a.id, BASE_MINUTE, "derating").actual!,
    0,
  );
  close(actual, siteMeasurement("silangan", BASE_MINUTE, "derating").actual!);
});
test("solar output follows documented POA and loss equation and respects AC rating", () => {
  const w = weather("silangan", BASE_MINUTE, "normal");
  const temp = w.ambient + w.irradiance * 0.028;
  const expected = Math.min(
    10 / 12,
    (w.irradiance / 1000) *
      Math.max(0.7, 1 - 0.0035 * (temp - 25)) *
      0.96 *
      0.98,
  );
  close(assetMeasurement("INV-01", BASE_MINUTE, "normal").expected, expected);
  for (let m = 0; m < 1440; m += 15)
    for (const s of SITES.filter((s) => s.technology !== "Storage"))
      assert.ok(siteMeasurement(s.id, m, "normal").actual! <= s.rating);
});
test("nighttime is standby with zero solar generation, not a fault", () => {
  for (const id of ASSETS.map((a) => a.id)) {
    const a = assetMeasurement(id, 120, "normal");
    assert.equal(a.actual, 0);
    assert.equal(a.deviation, 0);
    assert.equal(a.state, "Standby");
    assert.equal(a.quality, "good");
  }
});
test("seeded derating affects INV-07 alone with corroborating temperature", () => {
  const before = assetMeasurement("INV-07", 794, "derating"),
    after = assetMeasurement("INV-07", 795, "derating");
  assert.ok(before.deviation! > -3);
  close(after.deviation!, -54, 1e-8);
  assert.equal(after.temperature, 74.3);
  assert.ok(assetMeasurement("INV-08", 795, "derating").deviation! > -3);
  assert.deepEqual(after, assetMeasurement("INV-07", 795, "derating"));
});
test("missing telemetry propagates as unknown and energy gaps are excluded", () => {
  assert.equal(
    assetMeasurement("INV-04", BASE_MINUTE, "telemetry").actual,
    null,
  );
  assert.equal(
    siteMeasurement("silangan", BASE_MINUTE, "telemetry").actual,
    null,
  );
  assert.equal(fleetMeasurement(BASE_MINUTE, "telemetry").generation, null);
  const e = integrateEnergy("silangan", 0, BASE_MINUTE, "telemetry");
  assert.equal(e.complete, false);
  assert.ok(e.missingMinutes > 0);
  assert.ok(e.mwh > 0);
});
test("energy is trapezoidal power integration in MWh", () => {
  const expected = 22 * 0.94 * 0.99 * 2;
  close(integrateEnergy("bukal", 600, 720, "normal").mwh, expected, 1e-8);
  close(
    integrateEnergy("bukal", 600, 720, "normal", "net").mwh,
    (22 * 0.94 * 0.99 * 0.982 - 0.025) * 2,
    1e-8,
  );
});
test("cloud passage reduces irradiance and multiple solar zones together", () => {
  assert.ok(
    weather("silangan", 810, "cloud").irradiance <
      weather("silangan", 810, "normal").irradiance * 0.5,
  );
  for (const a of ASSETS)
    assert.ok(
      assetMeasurement(a.id, 810, "cloud").actual! <
        assetMeasurement(a.id, 810, "normal").actual! * 0.6,
    );
});
test("storage SOC is bounded and agrees with 32 MWh energy dispatch", () => {
  for (let m = 0; m < 1439; m += 5) {
    const a = siteMeasurement("isla", m, "normal"),
      b = siteMeasurement("isla", m + 0.01, "normal");
    assert.ok(a.soc! >= 0 && a.soc! <= 100);
    const powerFromSoc = (((-(b.soc! - a.soc!) / 100) * 32) / 0.01) * 60;
    close(powerFromSoc, a.actual!, 0.0001);
  }
});
test("hydro remains within rating in every reproducible scenario", () => {
  for (const scenario of [
    "normal",
    "cloud",
    "derating",
    "telemetry",
    "typhoon",
  ] as const)
    for (let m = 0; m < 1440; m += 30)
      assert.ok(siteMeasurement("agos", m, scenario).actual! <= 16);
});
test("30-minute outage has a positive energy difference and preserves baseline", () => {
  const before = siteMeasurement("silangan", BASE_MINUTE, "derating");
  const b = whatIf("silangan", BASE_MINUTE, "derating", {
    kind: "outage",
    assetId: "INV-07",
    duration: 30,
    reduction: 0,
  });
  assert.equal(b.complete, true);
  assert.ok(b.difference > 0);
  close(b.baseline - b.alternative, b.difference);
  assert.deepEqual(
    before,
    siteMeasurement("silangan", BASE_MINUTE, "derating"),
  );
  close(b.points[0].expected!, before.actual!);
});
test("reduced irradiance branch scales energy; gaps produce incomplete branch", () => {
  const b = whatIf("silangan", BASE_MINUTE, "normal", {
    kind: "irradiance",
    assetId: "INV-07",
    duration: 30,
    reduction: 30,
  });
  close(b.alternative, b.baseline * 0.7, 1e-8);
  assert.equal(
    whatIf("silangan", BASE_MINUTE, "telemetry", {
      kind: "outage",
      assetId: "INV-04",
      duration: 30,
      reduction: 0,
    }).complete,
    false,
  );
});
test("timestamps round-trip in UTC with Manila local minute convention", () => {
  assert.equal(timestamp(BASE_MINUTE), "2026-10-30T05:42:00.000Z");
  assert.equal(minuteFromTimestamp(timestamp(BASE_MINUTE)), BASE_MINUTE);
});
test("tools reject unknown operations, assets, metrics, windows, and numeric bounds", () => {
  for (const [name, args] of [
    ["shell", {}],
    ["focus_asset", { assetId: "INV-99" }],
    [
      "get_asset_measurements",
      {
        assetIds: ["INV-07"],
        metrics: ["password"],
        timeRange: { start: 0, end: 800 },
      },
    ],
    [
      "get_site_summary",
      { siteId: "silangan", timeRange: { start: 900, end: 800 } },
    ],
    [
      "run_what_if",
      {
        siteId: "silangan",
        scenarioParameters: {
          kind: "outage",
          assetId: "INV-07",
          duration: 999,
          reduction: 0,
        },
      },
    ],
  ] as const)
    assert.throws(() => validateTool(name, args));
  assert.throws(() =>
    executeTool(
      "get_site_summary",
      { siteId: "silangan", timeRange: { start: 800, end: 900 } },
      ctx(),
    ),
  );
  assert.throws(() =>
    executeTool("create_incident_summary", { evidenceIds: ["EV-999"] }, ctx()),
  );
});
test("scripted incident quantitatives come from traceable frozen tool evidence", () => {
  const c = ctx();
  const answer = scriptedInvestigation("Why did output drop?", c);
  assert.ok(answer.includes("322 kW"));
  assert.ok(answer.includes("54.0%"));
  assert.ok(c.evidence.length >= 5);
  for (const e of c.evidence) {
    assert.equal(e.timestamp, timestamp(BASE_MINUTE));
    assert.equal(e.mode, "Simulated");
    assert.equal(e.scenario, "derating");
    assert.ok(e.quality);
  }
  for (const id of answer.match(/EV-\d{3}/g) ?? [])
    assert.ok(c.evidence.some((e) => e.id === id));
  assert.ok(
    c.actions.some((a) => a.type === "focus" && a.assetId === "INV-07"),
  );
});
test("scripted missing-data conclusion does not assert equipment failure", () => {
  const c = ctx("telemetry");
  const answer = scriptedInvestigation("Why did output drop?", c);
  assert.ok(answer.includes("not a confirmed inverter failure"));
  assert.ok(answer.includes("unknown"));
});
