"use client";
import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const neutralGround: THREE.Material["onBeforeCompile"] = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    "#include <map_fragment>\n diffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722))), diffuseColor.rgb, 0.16);",
  );
};

/** Local CC0 Poly Haven maps. Clone sampler settings; never mutate the shared cache. */
export default function GroundMaterial({
  repeat = 32,
  variant = "gravel",
  wet = false,
  vertexColors = false,
  color = "#666d70",
}: {
  repeat?: number | [number, number];
  variant?: "gravel" | "forest";
  wet?: boolean;
  vertexColors?: boolean;
  color?: string;
}) {
  const folder = variant === "forest" ? "forest-ground" : "gravelly-sand";
  const source = useTexture([
    `/textures/${folder}/diffuse.jpg`,
    `/textures/${folder}/normal.jpg`,
    `/textures/${folder}/roughness.jpg`,
  ]);
  const gl = useThree((s) => s.gl);
  const repeatX = typeof repeat === "number" ? repeat : repeat[0];
  const repeatY = typeof repeat === "number" ? repeat : repeat[1];
  const maps = useMemo(
    () =>
      source.map((texture, index) => {
        const map = texture.clone();
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(repeatX, repeatY);
        map.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        map.colorSpace =
          index === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        map.needsUpdate = true;
        return map;
      }),
    [source, repeatX, repeatY, gl],
  );
  useEffect(() => () => maps.forEach((map) => map.dispose()), [maps]);
  return (
    <meshStandardMaterial
      map={maps[0]}
      normalMap={maps[1]}
      roughnessMap={maps[2]}
      normalScale={new THREE.Vector2(0.5, 0.5)}
      color={color}
      vertexColors={vertexColors}
      roughness={wet ? 0.48 : 0.95}
      metalness={wet ? 0.08 : 0}
      onBeforeCompile={neutralGround}
      customProgramCacheKey={() => "elektron-neutral-ground-v1"}
    />
  );
}
