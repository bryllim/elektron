"use client";
import { Environment } from "@react-three/drei";

/** Illustrative daylight follows the replay clock; not a surveyed solar ephemeris. */
export default function SceneLighting({
  minute,
  cloudy,
  extent,
}: {
  minute: number;
  cloudy: boolean;
  extent: number;
}) {
  const angle = ((minute - 360) / 720) * Math.PI;
  const daylight = Math.max(0, Math.sin(angle));
  return (
    <>
      <Environment
        files="/environments/studio_small_09_1k.hdr"
        environmentIntensity={0.16 + daylight * (cloudy ? 0.1 : 0.23)}
      />
      <ambientLight intensity={0.35 + daylight * 0.25} />
      <hemisphereLight args={["#d4dae0", "#292c2b", 0.55 + daylight * 0.4]} />
      <directionalLight
        position={[
          Math.cos(angle) * extent,
          Math.max(0.2, daylight) * extent * 1.6,
          -extent * 0.35,
        ]}
        intensity={daylight * (cloudy ? 0.65 : 2)}
        color={daylight < 0.3 ? "#e7c5a5" : "#e5e9e8"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={0.5}
        shadow-camera-far={extent * 5}
        shadow-normalBias={extent * 0.0002}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-extent, extent * 0.5, extent]}
        intensity={0.28}
        color="#a9bcc6"
      />
    </>
  );
}
