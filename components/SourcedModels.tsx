"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export const MODEL_PATHS = {
  solar: "/models/grab3d/solar-panel.glb",
  inverter: "/models/innerscene/wall-inverter.glb",
  transformer: "/models/innerscene/transformer.glb",
  switchboard: "/models/innerscene/switchboard.glb",
  container: "/models/innerscene/container.glb",
  tree: "/models/polyhaven/island_tree_01.glb",
  fern: "/models/polyhaven/fern_02.glb",
  fence: "/models/polyhaven/modular_chainlink_fence.glb",
  pole: "/models/polyhaven/modular_electricity_poles.glb",
  rocks: "/models/polyhaven/rock_moss_set_01.glb",
  barrier: "/models/nvidia/barrier_fence_metal_a02.glb",
  terminal: "/models/nvidia/electrical_power_terminal_a01.glb",
} as const;
export type Placement = {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};
const ORIGIN: Placement[] = [{ position: [0, 0, 0] }];

/** Keep source materials/UVs; bake only placement transforms, then reuse GPU instances. */
export function SourcedInstances({
  path,
  placements = ORIGIN,
  select = "",
  tint = "#ffffff",
  foliage = false,
}: {
  path: string;
  placements?: Placement[];
  select?: string;
  tint?: string;
  foliage?: boolean;
}) {
  const { scene } = useGLTF(path);
  const meshes = useMemo(() => {
    scene.updateMatrixWorld(true);
    const selected: THREE.Mesh[] = [];
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      let match = !select;
      for (
        let parent: THREE.Object3D | null = o;
        parent && !match;
        parent = parent.parent
      ) {
        match =
          parent.name === select ||
          (select.endsWith("*") && parent.name.startsWith(select.slice(0, -1)));
      }
      if (match) selected.push(o);
    });
    if (!selected.length)
      throw new Error(`No source meshes selected: ${path} / ${select}`);
    const bounds = new THREE.Box3();
    for (const mesh of selected)
      bounds.union(new THREE.Box3().setFromObject(mesh));
    const center = bounds.getCenter(new THREE.Vector3());
    return selected.map((mesh) => ({
      geometry: mesh.geometry
        .clone()
        .applyMatrix4(mesh.matrixWorld)
        .translate(-center.x, -bounds.min.y, -center.z),
      material: foliage
        ? Array.isArray(mesh.material)
          ? mesh.material.map(foliageMaterial)
          : foliageMaterial(mesh.material)
        : mesh.material,
      name: mesh.name,
    }));
  }, [scene, path, select, foliage]);
  useEffect(
    () => () =>
      meshes.forEach((m) => {
        m.geometry.dispose();
        if (foliage)
          (Array.isArray(m.material) ? m.material : [m.material]).forEach(
            (material) => material.dispose(),
          );
      }),
    [meshes, foliage],
  );
  return (
    <group>
      {meshes.map((mesh, i) => (
        <SourceBatch
          key={`${path}-${select}-${i}`}
          {...mesh}
          placements={placements}
          tint={tint}
        />
      ))}
    </group>
  );
}
// Alpha-cutout leaves write depth correctly across GPU instances; blending cannot sort individual leaves.
function foliageMaterial(source: THREE.Material) {
  const material = source.clone();
  if (
    material instanceof THREE.MeshStandardMaterial &&
    (material.transparent || /leav|fern/i.test(material.name))
  ) {
    material.transparent = false;
    material.alphaTest = 0.38;
    material.alphaToCoverage = true;
    material.depthWrite = true;
    material.side = THREE.DoubleSide;
    material.roughness = Math.max(0.75, material.roughness);
  }
  return material;
}
function SourceBatch({
  geometry,
  material,
  name,
  placements,
  tint,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  name: string;
  placements: Placement[];
  tint: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const object = new THREE.Object3D();
    const color = new THREE.Color(tint);
    placements.forEach((p, i) => {
      object.position.set(...p.position);
      object.rotation.set(...(p.rotation ?? [0, 0, 0]));
      const s = p.scale ?? 1;
      if (typeof s === "number") object.scale.setScalar(s);
      else object.scale.set(...s);
      object.updateMatrix();
      mesh.setMatrixAt(i, object.matrix);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, tint]);
  return (
    <instancedMesh
      ref={ref}
      name={name}
      args={[geometry, material, placements.length]}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}

export const SOLAR_PLACEMENTS: Placement[] = Array.from(
  { length: 36 },
  (_, i) => ({
    position: [-9.25 + (i % 6) * 3.7, 0, -7 + Math.floor(i / 6) * 2.7],
  }),
);
const INVERTERS: Placement[] = [7, 8, 9].map((x) => ({
  position: [x, 0.18, 9],
}));
export function SourcedInverters() {
  return (
    <SourcedInstances path={MODEL_PATHS.inverter} placements={INVERTERS} />
  );
}
const TREES: Placement[] = Array.from({ length: 28 }, (_, i) => {
  const a = i * 2.399;
  const x =
    i % 2 === 0
      ? Math.sin(a) * 76
      : (i % 4 < 2 ? -1 : 1) * (70 + Math.sin(i) * 7);
  const z =
    i % 2 === 0
      ? (i % 4 < 2 ? -1 : 1) * (57 + Math.cos(i) * 8)
      : Math.cos(a) * 57;
  // The perimeter terrain is flat to 95 m, at -1.8 m; bury the root base slightly.
  const fit = Math.min(1, 90 / Math.hypot(x, z));
  return {
    position: [x * fit, -1.9, z * fit],
    rotation: [0, a, 0],
    scale: 0.8 + (i % 4) * 0.13,
  };
});
export function SourcedTrees() {
  return <SourcedInstances path={MODEL_PATHS.tree} placements={TREES} />;
}
const FENCE: Placement[] = [
  ...Array.from({ length: 61 }, (_, i) =>
    [-44, 46].map((z) => ({
      position: [-60 + i * 2, 0, z] as [number, number, number],
    })),
  ).flat(),
  ...Array.from({ length: 45 }, (_, i) =>
    [-61, 61].map((x) => ({
      position: [x, 0, -43 + i * 2] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
    })),
  ).flat(),
];
export function SourcedFence() {
  return (
    <SourcedInstances
      path={MODEL_PATHS.fence}
      select="modular_chainlink_fence_double"
      placements={FENCE}
    />
  );
}
const BARRIERS: Placement[] = Array.from({ length: 18 }, (_, i) => ({
  position: [-23 + i * 1.23, 0, 35],
}));
const TRANSFORMERS: Placement[] = [-19, -7].map((x) => ({
  position: [x, 0.18, 39],
}));
const TERMINALS: Placement[] = [
  { position: [16, 0, 40], rotation: [0, Math.PI, 0] },
];
const SWITCHBOARDS: Placement[] = [6, 8, 10].map((x) => ({
  position: [x, 0.18, 40],
}));
const CONTAINERS: Placement[] = [{ position: [29, 0.15, 40] }];
const POLES: Placement[] = [-33, -27].map((x) => ({
  position: [x, 0, 39],
  rotation: [0, Math.PI / 2, 0],
}));
// Use all six scanned shapes in small clusters outside the pad and access roads.
const ROCK_CLUSTERS = [
  [-72, -25],
  [72, 24],
  [-31, 59],
  [35, -58],
];
const ROCKS: Placement[][] = Array.from({ length: 6 }, (_, variant) =>
  ROCK_CLUSTERS.flatMap(([x, z], cluster) =>
    (variant + cluster) % 2 === 0
      ? [
          {
            position: [
              x + ((variant % 3) - 1) * 2.4,
              -1.95,
              z + Math.sin(variant * 2.4 + cluster) * 2.2,
            ] as [number, number, number],
            rotation: [0, variant * 2.399 + cluster, 0] as [
              number,
              number,
              number,
            ],
            scale: 0.65 + ((variant + cluster) % 3) * 0.2,
          },
        ]
      : [],
  ),
);
export function SourcedInfrastructure() {
  return (
    <>
      <SourcedInstances
        path={MODEL_PATHS.transformer}
        placements={TRANSFORMERS}
      />
      <SourcedInstances
        path={MODEL_PATHS.switchboard}
        placements={SWITCHBOARDS}
      />
      <SourcedInstances path={MODEL_PATHS.container} placements={CONTAINERS} />
      <SourcedInstances path={MODEL_PATHS.terminal} placements={TERMINALS} />
      <SourcedInstances path={MODEL_PATHS.barrier} placements={BARRIERS} />
      <SourcedInstances
        path={MODEL_PATHS.pole}
        select="preset_01_*"
        placements={POLES}
      />
      {ROCKS.map((placements, i) => (
        <SourcedInstances
          key={i}
          path={MODEL_PATHS.rocks}
          select={`rock_moss_set_01_rock0${i + 1}`}
          placements={placements}
        />
      ))}
    </>
  );
}
