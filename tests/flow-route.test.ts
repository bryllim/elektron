import test from "node:test";
import assert from "node:assert/strict";
import { createFlowRoute, pointOnFlowRoute } from "../lib/flow-route";

test("flow pulses visit both cable elbows and the grid endpoint", () => {
  for (let i = 0; i < 12; i++) {
    const route = createFlowRoute(-42 + (i % 4) * 28, -29 + Math.floor(i / 4) * 24);
    let distance = 0;
    assert.deepEqual(pointOnFlowRoute(route, 0), route.points[0]);
    route.lengths.forEach((length, segment) => {
      const start = pointOnFlowRoute(route, distance + length * 0.25);
      const end = pointOnFlowRoute(route, distance + length * 0.75);
      assert.ok(Math.abs(Math.hypot(...end.map((v, axis) => v - start[axis])) - length / 2) < 1e-9);
      distance += length;
      assert.deepEqual(pointOnFlowRoute(route, distance), route.points[segment + 1]);
    });
    for (let d = 0; d <= route.length; d += 0.2) {
      const [x, y, z] = pointOnFlowRoute(route, d);
      assert.equal(y, 0.5);
      assert.ok(x === route.points[0][0] || z === 32.5 || x === 0, "pulse must remain on a cable segment");
    }
  }
});

test("zero-length legs and out-of-range distances remain on the route", () => {
  const route = createFlowRoute(-8, 23.5);
  assert.deepEqual(pointOnFlowRoute(route, -1), [0, 0.5, 32.5]);
  assert.deepEqual(pointOnFlowRoute(route, 3), [0, 0.5, 35.5]);
  assert.deepEqual(pointOnFlowRoute(route, 100), [0, 0.5, 40]);
});
