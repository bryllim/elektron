import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, join, weld, prune } from "@gltf-transform/functions";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const records = [];
for (const [name, slug] of [
  ["cooling-tower", "cooling-tower-005ae63b"],
  ["heat-exchanger", "shell-and-tube-heat-exchanger-69685a9a"],
]) {
  const path = `simulation/assets/innerscene/${name}.glb`;
  const doc = await io.read(path);
  await doc.transform(dedup(), join(), weld(), prune());
  await io.write(`public/models/innerscene/${name}.glb`, doc);
  records.push({
    name,
    source: `https://www.innerscene.com/tools/library/3d-parts/${slug}`,
    download: `https://www.innerscene.com/api/library/${slug}/download`,
    license: "CC0-1.0",
    sha256: createHash("sha256")
      .update(await fs.readFile(path))
      .digest("hex"),
  });
}
records.push({
  name: "wind-turbine",
  source:
    "https://www.innerscene.com/tools/library/3d-parts/wind-turbine-d67dce35",
  download:
    "https://www.innerscene.com/api/library/wind-turbine-d67dce35/download",
  license: "CC0-1.0",
  sha256: createHash("sha256")
    .update(await fs.readFile("simulation/assets/innerscene/wind-turbine.3dm"))
    .digest("hex"),
});
await fs.writeFile(
  "public/models/innerscene/plant-assets-sources.json",
  JSON.stringify(records, null, 2),
);
