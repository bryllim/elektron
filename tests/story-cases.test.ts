import test from "node:test";
import assert from "node:assert/strict";
import { storyCases } from "../lib/story-cases";
import { DEMO_CASES } from "../lib/operations";

test("public story displays the incident in kW, with the chart and headline agreeing", () => {
  const equipment = storyCases()[0];
  assert.equal(Math.round(equipment.reading.actual!), 322);
  assert.equal(Math.round(equipment.reading.expected), 699);
  assert.equal(equipment.reading.temperature, 74.3);
  assert.equal(equipment.points.at(-1)?.actual, equipment.reading.actual);
  assert.equal(equipment.points.at(-1)?.expected, equipment.reading.expected);
});
test("story scenarios preserve weather expectations and missing values, and all link to real demo cases", () => {
  const cases = storyCases();
  const rain = cases[1],
    missing = cases[2];
  assert.ok(rain.reading.expected < cases[0].reading.expected);
  assert.ok(rain.reading.actual! / rain.reading.expected > 0.95);
  assert.equal(missing.reading.actual, null);
  assert.equal(missing.points.at(-1)?.actual, null);
  assert.ok(missing.points.some((point) => point.actual !== null));
  for (const item of cases)
    assert.ok(
      DEMO_CASES.some(
        (demo) => demo.id === item.id && demo.siteId === "silangan",
      ),
    );
});
