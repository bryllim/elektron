import test from "node:test";
import assert from "node:assert/strict";
import { chartScale, chartSegments } from "../lib/chart-geometry";

test("chart scale includes charging, discharging and the zero baseline", () => {
  const scale = chartScale([-2.8, 1.5]);
  assert.ok(scale.min <= -2.8);
  assert.ok(scale.max >= 1.5);
  assert.ok(scale.ticks.includes(0));
  assert.ok(scale.ticks.every(Number.isFinite));
});
test("zero and empty telemetry produce usable axes", () => {
  for (const values of [[], [0, 0]]) {
    const scale = chartScale(values);
    assert.equal(scale.min, 0);
    assert.ok(scale.max > 0);
  }
});
test("fleet scale stays readable just above a round boundary", () => {
  const scale = chartScale([0, 100.62]);
  assert.equal(scale.max, 125);
  assert.deepEqual(scale.ticks, [0, 25, 50, 75, 100, 125]);
});
test("missing readings split curves while measured zero remains plotted", () => {
  const points = [null, 4, 0, null, 3, null];
  const segments = chartSegments(points, (p) => p);
  assert.deepEqual(
    segments.map((s) => s.map((v) => v.index)),
    [[1, 2], [4]],
  );
});
