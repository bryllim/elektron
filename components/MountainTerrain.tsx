"use client";
import { useMemo, useEffect } from "react";
import * as THREE from "three";
import GroundMaterial from "./GroundMaterial";
import { terrainHeight, terrainNoise, type TerrainKind } from "@/lib/terrain";
export default function MountainTerrain({
  kind,
  wet,
}: {
  kind: TerrainKind;
  wet: boolean;
}) {
  const geometry = useMemo(() => {
    const span = kind === "wind" ? 3200 : kind === "solar" ? 1800 : 512;
    const g = new THREE.PlaneGeometry(span, span, 256, 256);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position,
      colors = new Float32Array(p.count * 3),
      color = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i),
        h = terrainHeight(x, z, kind);
      p.setY(i, h - 0.04);
      const altitude = h / (kind === "wind" ? 260 : kind === "solar" ? 95 : 42);
      const scale = kind === "wind" ? 1 : kind === "solar" ? 0.36 : 0.16;
      const patch = terrainNoise((x / scale) * 0.019, (z / scale) * 0.019);
      const slope =
        Math.hypot(
          terrainHeight(x + scale, z, kind) - h,
          terrainHeight(x, z + scale, kind) - h,
        ) / scale;
      const grain = (patch - 0.5) * 0.17 + Math.min(0.12, slope * 0.13);
      color.setRGB(
        0.52 + altitude * 0.13 + grain,
        0.56 + altitude * 0.14 + grain,
        0.53 + altitude * 0.15 + grain,
      );
      color.toArray(colors, i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [kind]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <GroundMaterial
        variant="forest"
        vertexColors
        repeat={kind === "wind" ? 230 : kind === "solar" ? 180 : 85}
        wet={wet}
        color="#bbc2bc"
      />
    </mesh>
  );
}
