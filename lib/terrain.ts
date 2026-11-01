export type TerrainKind = "wind" | "geothermal" | "solar";
const smooth = (value: number, low: number, high: number) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};
export const terrainRandom = (seed: number) => {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};
/** Continuous seeded noise avoids repeating sinusoidal mountain silhouettes. */
export function terrainNoise(x: number, z: number) {
  const ix = Math.floor(x),
    iz = Math.floor(z);
  const fx = smooth(x - ix, 0, 1),
    fz = smooth(z - iz, 0, 1);
  const a = terrainRandom(ix + iz * 157),
    b = terrainRandom(ix + 1 + iz * 157);
  const c = terrainRandom(ix + (iz + 1) * 157),
    d = terrainRandom(ix + 1 + (iz + 1) * 157);
  return (a + (b - a) * fx) * (1 - fz) + (c + (d - c) * fx) * fz;
}
/** Representative terrain, not survey data. Flat operational pads are exact. */
export function terrainHeight(x: number, z: number, kind: TerrainKind) {
  const scale = kind === "wind" ? 1 : kind === "solar" ? 0.36 : 0.16;
  const nx = x / scale,
    nz = z / scale,
    r = Math.hypot(nx, nz);
  const pad = kind === "solar" ? 95 / scale : kind === "wind" ? 305 : 300;
  const edge = smooth(r, pad, 650);
  const distantFalloff = 1 - smooth(r, 1200, 1600);
  const opening = smooth((nx + nz) / (Math.max(r, 1) * Math.SQRT2), 0.25, 0.85);
  const ridge =
    0.65 + Math.pow(1 - Math.abs(Math.sin(nx * 0.0036 + nz * 0.0021)), 2) * 1.1;
  const relief =
    (terrainNoise(nx * 0.007, nz * 0.007) - 0.5) * 0.9 +
    (terrainNoise(nx * 0.018 + 7, nz * 0.018) - 0.5) * 0.35 +
    (terrainNoise(nx * 0.049, nz * 0.049 + 11) - 0.5) * 0.13;
  const height =
    Math.max(0, ridge + relief) *
    115 *
    scale *
    edge *
    distantFalloff *
    (1 - opening * 0.88);
  return height - (kind === "solar" ? 1.8 : 0);
}
