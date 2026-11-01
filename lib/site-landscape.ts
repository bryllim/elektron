import {
  terrainHeight,
  terrainRandom as random,
  type TerrainKind,
} from "./terrain";
export type LandscapePlacement = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  tint?: string;
};
const centers = [
  [-320, -175],
  [-165, -245],
  [210, -220],
  [310, 45],
  [-310, 115],
  [145, 235],
  [-400, -340],
  [310, -345],
];
export function insideServiceArea(x: number, z: number, kind: TerrainKind) {
  if (kind === "solar") return Math.abs(x) < 68 && Math.abs(z) < 54;
  if (kind === "geothermal")
    return (
      (Math.abs(x) < 25 && Math.abs(z) < 24) ||
      (x > 1 && x < 15 && z > 18 && z < 46)
    );
  return (
    (Math.abs(x) < 250 && Math.abs(z) < 115) ||
    (x > -60 && x < 55 && z > 130 && z < 190) ||
    (x > -242 && x < -34 && z > 150 && z < 170) ||
    (Math.abs(x + 230) < 12 && z > -110 && z < 175)
  );
}
/** Clustered authored assets; deterministic placement, clear service areas and rooted bases. */
export function landscapePlacements(
  kind: TerrainKind,
  layer: "trees" | "ferns" | "rocks",
): LandscapePlacement[] {
  const spacing = kind === "wind" ? 1 : kind === "solar" ? 0.27 : 0.105;
  const count = layer === "trees" ? 42 : layer === "ferns" ? 140 : 34;
  const result: LandscapePlacement[] = [];
  const seed = layer === "trees" ? 0 : layer === "ferns" ? 1000 : 2000;
  for (let i = 0; i < count * 5 && result.length < count; i++) {
    const center = centers[i % centers.length];
    const spread = layer === "trees" ? 65 : 74;
    const x = (center[0] + (random(seed + i * 7 + 3) - 0.5) * spread) * spacing;
    const z = (center[1] + (random(seed + i * 7 + 4) - 0.5) * spread) * spacing;
    if (insideServiceArea(x, z, kind)) continue;
    const h = terrainHeight(x, z, kind);
    const slope = Math.hypot(
      terrainHeight(x + 1, z, kind) - h,
      terrainHeight(x, z + 1, kind) - h,
    );
    if (slope > 0.62) continue;
    const s =
      layer === "trees"
        ? (kind === "wind" ? 1.35 : 0.75) + random(i + 80) * 0.65
        : layer === "ferns"
          ? 0.5 + random(i + 20) * 0.65
          : 0.35 + random(i + 50) * (kind === "wind" ? 1.7 : 0.8);
    result.push({
      position: [x, h - 0.08, z],
      rotation: [0, random(i + 10) * Math.PI * 2, 0],
      scale: [
        s * (0.88 + random(i + 30) * 0.24),
        s,
        s * (0.88 + random(i + 40) * 0.24),
      ],
    });
  }
  return result;
}
