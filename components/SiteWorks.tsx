"use client";
import { useMemo } from "react";
import { MODEL_PATHS, SourcedInstances, type Placement } from "./SourcedModels";
import GroundMaterial from "./GroundMaterial";

/** Representative access and switchyard layout using existing credited industrial assets. */
export default function SiteWorks({
  windPlant,
  wet,
}: {
  windPlant: boolean;
  wet: boolean;
}) {
  const fences = useMemo<Placement[]>(() => {
    const halfX = windPlant ? 42 : 23,
      nearZ = windPlant ? 144 : -20,
      farZ = windPlant ? 180 : 20;
    const sections: Placement[] = [];
    for (let x = -halfX; x < halfX; x += 2) {
      sections.push({ position: [x, 0, nearZ] });
      if (x < 3 || x > 13) sections.push({ position: [x, 0, farZ] });
    }
    for (let z = nearZ; z < farZ; z += 2)
      for (const x of [-halfX, halfX])
        sections.push({ position: [x, 0, z], rotation: [0, Math.PI / 2, 0] });
    return sections;
  }, [windPlant]);
  return (
    <>
      <SourcedInstances
        path={MODEL_PATHS.fence}
        select="modular_chainlink_fence_double"
        placements={fences}
      />
      <SourcedInstances
        path={MODEL_PATHS.pole}
        select="preset_01_*"
        placements={
          windPlant
            ? [{ position: [36, 0, 147] }, { position: [36, 0, 175] }]
            : [{ position: [-22, 0, -15] }, { position: [-22, 0, 12] }]
        }
      />
      <SourcedInstances
        path={MODEL_PATHS.barrier}
        placements={Array.from({ length: windPlant ? 10 : 6 }, (_, i) => ({
          position: [
            (windPlant ? 16 : -16) + i * 1.23,
            0,
            windPlant ? 170 : 15,
          ] as [number, number, number],
        }))}
      />
      {windPlant && (
        <>
          <mesh
            position={[0, -0.02, 162]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[82, 34]} />
            <GroundMaterial repeat={15} wet={wet} color="#777d7e" />
          </mesh>
          <SourcedInstances
            path={MODEL_PATHS.switchboard}
            placements={[
              { position: [16, 0, 158] },
              { position: [18, 0, 158] },
              { position: [20, 0, 158] },
            ]}
          />
          <SourcedInstances
            path={MODEL_PATHS.terminal}
            placements={[{ position: [27, 0, 166], rotation: [0, Math.PI, 0] }]}
          />
          <mesh
            position={[-230, 0.025, 36]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[9, 258]} />
            <GroundMaterial repeat={[2, 55]} wet={wet} color="#777d7e" />
          </mesh>
          <mesh
            position={[-137, 0.03, 160]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[195, 9]} />
            <GroundMaterial repeat={[42, 2]} wet={wet} color="#777d7e" />
          </mesh>
        </>
      )}
      {!windPlant && (
        <mesh
          position={[8, 0.015, 30]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[8, 26]} />
          <GroundMaterial repeat={[2, 6]} wet={wet} color="#777d7e" />
        </mesh>
      )}
    </>
  );
}
