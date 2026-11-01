import { test } from "node:test";
import assert from "node:assert/strict";
import { operationalBrief } from "../lib/operations";
import {
  scriptedInvestigation,
  ToolContext,
  executeTool,
  incidentText,
} from "../lib/agent-tools";
import { Scenario } from "../lib/simulation";
const context = (scenario: Scenario, siteId = "silangan"): ToolContext => ({
  minute: 822,
  scenario,
  siteId,
  evidence: [],
  actions: [],
  activity: [],
});

test("triage separates localized faults, weather reduction, missing data and nighttime standby", () => {
  const fault = operationalBrief(822, "derating");
  assert.equal(fault.findings[0].siteId, "silangan");
  assert.equal(fault.equipmentIssues, 1);
  assert.equal(fault.weatherReductionMW, 0);
  const rain = operationalBrief(822, "rain");
  assert.equal(rain.equipmentIssues, 0);
  assert.ok(rain.weatherReductionMW > 0);
  assert.equal(
    rain.findings.find((f) => f.siteId === "silangan")?.category,
    "weather",
  );
  const missing = operationalBrief(822, "telemetry");
  assert.equal(missing.findings[0].actualMW, null);
  assert.equal(missing.findings[0].gapMW, null);
  assert.equal(missing.unknownSites, 1);
  assert.equal(operationalBrief(120, "normal").attention, 0);
});

test("fleet questions rank the fleet without unexpectedly opening a solar asset", () => {
  const ctx = context("typhoon");
  const answer = scriptedInvestigation("Which sites need attention?", ctx);
  assert.match(answer, /Fleet triage/);
  assert.equal(ctx.actions.length, 0);
  assert.equal(ctx.evidence[0].metric, "operational triage");
  assert.equal(
    (ctx.evidence[0].data as ReturnType<typeof operationalBrief>).findings
      .length,
    7,
  );
});

test("wind and geothermal investigations stay on the named site", () => {
  for (const [name, id] of [
    ["Amihan Wind", "amihan"],
    ["Bukal Geothermal", "bukal"],
  ]) {
    const ctx = context("derating");
    const answer = scriptedInvestigation(`Investigate ${name}`, ctx);
    assert.match(answer, new RegExp(name));
    assert.equal(ctx.siteId, id);
    assert.ok(!ctx.actions.some((a) => a.type === "focus"));
    assert.doesNotMatch(incidentText(ctx), /INV-07 is thermally derated/);
  }
});

test("weather fallback does not misclassify rain as localized derating", () => {
  const ctx = context("rain");
  assert.match(
    scriptedInvestigation("Why did Silangan output drop?", ctx),
    /weather-driven reduction/,
  );
});

test("operational brief tool and interface share the exact same snapshot", () => {
  const ctx = context("derating");
  const result = executeTool(
    "get_operational_brief",
    { timeRange: { start: 762, end: 822 } },
    ctx,
  ) as { data: unknown };
  assert.deepEqual(result.data, operationalBrief(822, "derating"));
  assert.throws(() =>
    executeTool(
      "get_operational_brief",
      { timeRange: { start: 822, end: 823 } },
      ctx,
    ),
  );
});

test("weather priorities rank by modeled resource reduction rather than routine equipment losses", () => {
  const rows = operationalBrief(822, "typhoon").findings.filter(
    (f) => f.category === "weather",
  );
  for (let i = 1; i < rows.length; i++)
    assert.ok(rows[i - 1].weatherReductionMW >= rows[i].weatherReductionMW);
});

test("storm playbook distinguishes wind cut-out from normal nighttime standby", async () => {
  const { DEMO_CASES } = await import("../lib/operations");
  const { siteMeasurement } = await import("../lib/simulation");
  const c = DEMO_CASES.find((c) => c.id === "typhoon")!;
  assert.equal(
    operationalBrief(c.minute, c.scenario).findings[0].category,
    "wind-limit",
  );
  assert.equal(
    siteMeasurement("amihan", c.minute, c.scenario).status,
    "Wind cut-out",
  );
  assert.equal(
    siteMeasurement("silangan", c.minute, c.scenario).status,
    "Standby",
  );
});
