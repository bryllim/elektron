import test from "node:test";
import assert from "node:assert/strict";
import { insideServiceArea, landscapePlacements } from "../lib/site-landscape";
import { terrainHeight } from "../lib/terrain";

test("landscape assets stay grounded and clear of operational pads and access routes", () => {
  for (const kind of ["solar", "wind", "geothermal"] as const) {
    for (const layer of ["trees", "ferns", "rocks"] as const) {
      const placements = landscapePlacements(kind, layer);
      assert.ok(
        placements.length >= 30,
        `${kind} ${layer} landscape populated`,
      );
      assert.deepEqual(placements, landscapePlacements(kind, layer));
      for (const {
        position: [x, y, z],
        scale,
      } of placements) {
        assert.ok(
          !insideServiceArea(x, z, kind),
          `${kind} ${layer} must leave service areas clear`,
        );
        assert.ok(
          Math.abs(y - terrainHeight(x, z, kind)) < 0.1,
          "roots rest at terrain surface",
        );
        assert.ok([x, y, z, ...scale].every(Number.isFinite));
        assert.ok(scale.every((v) => v > 0));
      }
    }
    const trees = landscapePlacements(kind, "trees");
    for (const rock of landscapePlacements(kind, "rocks")) {
      assert.ok(
        !trees.some(
          (tree) =>
            tree.position[0] === rock.position[0] &&
            tree.position[2] === rock.position[2],
        ),
        "independent layers must not stack at identical points",
      );
    }
  }
});

test("solar terrain keeps the full equipment foundation flat", () => {
  for (const x of [-63, 0, 63])
    for (const z of [-48, 0, 48])
      assert.equal(terrainHeight(x, z, "solar"), -1.8);
  assert.ok(terrainHeight(-240, -160, "solar") > 10);
});
