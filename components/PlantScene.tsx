"use client";
import {
  Component,
  Suspense,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import * as THREE from "three";
import { MODEL_PATHS, SourcedInstances, type Placement } from "./SourcedModels";
import { SceneReady, SceneLoadingOverlay } from "./SceneLoading";
import { Rain, VaporPlumes, useSceneMotion } from "./SceneWeather";
import { rotorRpm, sceneWeather } from "@/lib/scene-weather";
import MountainTerrain from "./MountainTerrain";
import SiteSurroundings from "./SiteSurroundings";
import SiteWorks from "./SiteWorks";
import SceneLighting from "./SceneLighting";
import GroundMaterial from "./GroundMaterial";
import type { Scenario } from "@/lib/simulation";
export type PlantSceneProps = {
  siteId: string;
  windPlant: boolean;
  minute: number;
  scenario: Scenario;
  motion: boolean;
  selected: number;
  onSelect: (i: number) => void;
  labels: boolean;
  reset: number;
  focus: number;
};
export const WIND_POSITIONS: [number, number, number][] = Array.from(
  { length: 8 },
  (_, i) => [-180 + (i % 4) * 120, 1.5, -90 + Math.floor(i / 4) * 180],
);
export const COOLING_POSITIONS: [number, number, number][] = [
  [-13, 0, -9],
  [-8, 0, -9],
  [-3, 0, -9],
  [2, 0, -9],
  [7, 0, -9],
  [12, 0, -9],
];
export const THERMAL_UNITS = [
  {
    name: "Cooling train",
    detail: "Six sourced counterflow cooling units",
    position: [0, 0, -9],
  },
  {
    name: "Heat exchange",
    detail: "Four sourced shell-and-tube assemblies",
    position: [0, 0, 1],
  },
  {
    name: "Grid connection",
    detail: "Transformers and switchgear",
    position: [-13, 0, 12],
  },
] as const;
const COOLING: Placement[] = COOLING_POSITIONS.map((position) => ({
  position,
}));
const EXCHANGERS: Placement[] = [-9, -3, 3, 9].map((x) => ({
  position: [x, 0, 1],
}));
const PLUMES: [number, number, number][] = COOLING_POSITIONS.map(([x, , z]) => [
  x,
  3.1,
  z,
]);
function Label({
  text,
  position,
}: {
  text: string;
  position: [number, number, number];
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 80;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "rgba(15,24,24,.88)";
    ctx.fillRect(0, 0, 512, 80);
    ctx.fillStyle = "#c8dcd2";
    ctx.font = "500 27px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, 256, 50);
    return new THREE.CanvasTexture(c);
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={position} scale={[0.14, 0.021875, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        sizeAttenuation={false}
      />
    </sprite>
  );
}
function Turbine({
  index,
  rpm,
  motion,
  selected,
  onSelect,
  labels,
}: {
  index: number;
  rpm: number;
  motion: boolean;
  selected: boolean;
  onSelect: () => void;
  labels: boolean;
}) {
  const { scene } = useGLTF("/models/innerscene/wind-turbine.glb");
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);
  const rotor = useMemo(() => model.getObjectByName("Rotor")!, [model]);
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [motion, rpm, invalidate]);
  useFrame((_, delta) => {
    if (motion && rpm > 0) {
      rotor.rotation.x += (Math.min(delta, 0.08) * rpm * Math.PI) / 30;
      invalidate();
    }
  });
  return (
    <group
      position={WIND_POSITIONS[index]}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
      onClick={(e) => {
        if (e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      <primitive object={model} dispose={null} />
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
          <ringGeometry args={[8, 8.45, 80]} />
          <meshBasicMaterial
            color="#a8ddc4"
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      )}
      {(labels || selected) && (
        <Label
          text={`WTG-${String(index + 1).padStart(2, "0")} / ${rpm.toFixed(1)} RPM`}
          position={[0, 104, 0]}
        />
      )}
    </group>
  );
}
function ProcessFlow({ motion }: { motion: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null),
    elapsed = useRef(0),
    { invalidate } = useThree();
  const points = useMemo(
    () => [
      new THREE.Vector3(-13, 0.35, -5),
      new THREE.Vector3(13, 0.35, -5),
      new THREE.Vector3(13, 0.35, 6),
      new THREE.Vector3(-13, 0.35, 6),
      new THREE.Vector3(-13, 0.35, 12),
    ],
    [],
  );
  const curve = useMemo(() => {
    const c = new THREE.CurvePath<THREE.Vector3>();
    points
      .slice(1)
      .forEach((p, i) => c.add(new THREE.LineCurve3(points[i], p)));
    return c;
  }, [points]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pulseColor = useMemo(() => new THREE.Color(), []);
  useEffect(() => invalidate(), [motion, invalidate]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (motion) elapsed.current += Math.min(delta, 0.08);
    for (let i = 0; i < 5; i++) {
      const head = (elapsed.current * 0.025 + i / 5) % 1;
      const edge = THREE.MathUtils.smoothstep(
        Math.min(head, 1 - head),
        0,
        0.025,
      );
      for (let j = 0; j < 24; j++) {
        const phase = head - j * 0.0015;
        const fade = 1 - j / 24;
        dummy.position.copy(curve.getPoint(Math.max(0, phase)));
        dummy.scale.setScalar(
          phase < 0 ? 0 : (0.025 + 0.065 * Math.sqrt(fade)) * edge,
        );
        dummy.updateMatrix();
        ref.current.setMatrixAt(i * 24 + j, dummy.matrix);
        pulseColor.set("#c4ffe4").multiplyScalar(fade * edge);
        ref.current.setColorAt(i * 24 + j, pulseColor);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    if (motion) invalidate();
  });
  return (
    <>
      <Line
        points={points}
        color="#9bc8bb"
        transparent
        opacity={0.55}
        lineWidth={1.2}
        dashed
        dashSize={0.45}
        gapSize={0.3}
      />
      <instancedMesh
        ref={ref}
        args={[undefined, undefined, 120]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  );
}
function Camera({ p }: { p: PlantSceneProps }) {
  const ref = useRef<OrbitImpl>(null);
  const { camera, invalidate } = useThree();
  const active = useSceneMotion(p.motion);
  const moving = useRef(false);
  const goal = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  function move(
    position: [number, number, number],
    look: [number, number, number],
  ) {
    goal.current.set(...position);
    target.current.set(...look);
    moving.current = true;
    invalidate();
  }
  useEffect(() => {
    move(p.windPlant ? [450, 300, 520] : [48, 36, 48], [
      0,
      p.windPlant ? 25 : 1,
      0,
    ]);
  }, [p.reset, p.windPlant]);
  useEffect(() => {
    if (!p.focus) return;
    const point = p.windPlant
      ? WIND_POSITIONS[p.selected]
      : THERMAL_UNITS[p.selected]?.position;
    if (!point) return;
    move(
      [
        point[0] + (p.windPlant ? 120 : 16),
        p.windPlant ? 100 : 14,
        point[2] + (p.windPlant ? 140 : 18),
      ],
      [point[0], p.windPlant ? 45 : 2, point[2]],
    );
  }, [p.focus, p.selected, p.windPlant]);
  useEffect(() => invalidate(), [active, invalidate]);
  useFrame((_, delta) => {
    if (!moving.current || !ref.current) return;
    const blend = active ? 1 - Math.exp(-5.5 * Math.min(delta, 0.1)) : 1;
    camera.position.lerp(goal.current, blend);
    ref.current.target.lerp(target.current, blend);
    ref.current.update();
    if (
      camera.position.distanceTo(goal.current) < 0.02 &&
      ref.current.target.distanceTo(target.current) < 0.02
    ) {
      camera.position.copy(goal.current);
      ref.current.target.copy(target.current);
      moving.current = false;
    }
    invalidate();
  });
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enableDamping={active}
      dampingFactor={0.1}
      minDistance={p.windPlant ? 60 : 9}
      maxDistance={p.windPlant ? 1100 : 110}
      maxPolarAngle={Math.PI / 2.08}
      onStart={() => {
        moving.current = false;
      }}
    />
  );
}
function Scene(p: PlantSceneProps) {
  const wx = sceneWeather(p.siteId, p.minute, p.scenario),
    active = useSceneMotion(p.motion),
    rpm = rotorRpm(wx.wind);
  return (
    <>
      <color attach="background" args={[wx.cloudy ? "#181d20" : "#0a0d0f"]} />
      <fog
        attach="fog"
        args={[
          wx.cloudy ? "#181d20" : "#0a0d0f",
          p.windPlant ? 400 : 65,
          p.windPlant ? (wx.rain ? 1250 : 2200) : wx.rain ? 210 : 360,
        ]}
      />
      <SceneLighting
        minute={p.minute}
        cloudy={wx.cloudy}
        extent={p.windPlant ? 310 : 45}
      />
      <MountainTerrain
        kind={p.windPlant ? "wind" : "geothermal"}
        wet={wx.rain > 0}
      />
      <SiteSurroundings kind={p.windPlant ? "wind" : "geothermal"} />
      <SiteWorks windPlant={p.windPlant} wet={wx.rain > 0} />
      {p.windPlant ? (
        <>
          {WIND_POSITIONS.slice(0, p.siteId === "habagat" ? 6 : 8).map(
            (_, i) => (
              <Turbine
                key={i}
                index={i}
                rpm={rpm}
                motion={active}
                selected={p.selected === i}
                onSelect={() => p.onSelect(i)}
                labels={p.labels}
              />
            ),
          )}
          {[-90, 90].map((z) => (
            <mesh key={z} position={[0, 0, z]} receiveShadow>
              <boxGeometry args={[480, 0.1, 11]} />
              <meshStandardMaterial
                color="#424745"
                roughness={wx.rain ? 0.35 : 0.9}
              />
            </mesh>
          ))}
          <SourcedInstances
            path={MODEL_PATHS.container}
            placements={[{ position: [-30, 0, 160] }]}
          />
          <SourcedInstances
            path={MODEL_PATHS.transformer}
            placements={[-10, 0, 10].map((x) => ({ position: [x, 0, 160] }))}
          />
        </>
      ) : (
        <>
          <mesh position={[0, -0.06, 0]} receiveShadow>
            <boxGeometry args={[39, 0.2, 34]} />
            <GroundMaterial repeat={10} wet={wx.rain > 0} color="#555e61" />
          </mesh>
          <group
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = "auto"; }}
            onClick={(e) => {
              if (e.delta > 5) return;
              e.stopPropagation();
              p.onSelect(0);
            }}
          >
            <SourcedInstances
              path="/models/innerscene/cooling-tower.glb"
              placements={COOLING}
            />
          </group>
          <group
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = "auto"; }}
            onClick={(e) => {
              if (e.delta > 5) return;
              e.stopPropagation();
              p.onSelect(1);
            }}
          >
            <SourcedInstances
              path="/models/innerscene/heat-exchanger.glb"
              placements={EXCHANGERS}
            />
          </group>
          <group
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = "auto"; }}
            onClick={(e) => {
              if (e.delta > 5) return;
              e.stopPropagation();
              p.onSelect(2);
            }}
          >
            <SourcedInstances
              path={MODEL_PATHS.transformer}
              placements={[-15, -11].map((x) => ({ position: [x, 0, 12] }))}
            />
            <SourcedInstances
              path={MODEL_PATHS.switchboard}
              placements={[-7, -5].map((x) => ({ position: [x, 0, 12] }))}
            />
          </group>
          <SourcedInstances
            path={MODEL_PATHS.container}
            placements={[{ position: [7, 0, 12] }]}
          />
          <VaporPlumes origins={PLUMES} wind={wx.wind} motion={active} />
          <ProcessFlow motion={active} />
          {THERMAL_UNITS.map((unit, i) => (
            <group key={unit.name}>
              {(p.labels || p.selected === i) && (
                <Label
                  text={unit.name.toUpperCase()}
                  position={[
                    unit.position[0],
                    i === 0 ? 6 : 4,
                    unit.position[2],
                  ]}
                />
              )}
              {p.selected === i && (
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[unit.position[0], 0.08, unit.position[2]]}
                >
                  <ringGeometry args={[3.8, 3.88, 64]} />
                  <meshBasicMaterial
                    color="#a8ddc4"
                    transparent
                    opacity={0.65}
                  />
                </mesh>
              )}
            </group>
          ))}
        </>
      )}
      <Rain
        rain={wx.rain}
        wind={wx.wind}
        motion={active}
        span={p.windPlant ? 650 : 85}
        height={p.windPlant ? 180 : 45}
      />
      <Camera p={p} />
    </>
  );
}
class Boundary extends Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="scene-fallback">
        Unable to load the sourced plant models.{" "}
        <button
          className="button"
          onClick={() => this.setState({ error: false })}
        >
          Retry scene
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function PlantScene(p: PlantSceneProps) {
  const [ready, setReady] = useState(false);
  return (
    <Boundary>
      <Canvas
        shadows
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{
          position: p.windPlant ? [450, 300, 520] : [48, 36, 48],
          fov: 42,
          near: 0.1,
          far: 3000,
        }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        fallback={
          <div className="scene-fallback">
            3D is unavailable in this browser.
          </div>
        }
      >
        <Suspense fallback={null}>
          <Scene {...p} />
          <SceneReady onReady={setReady} />
        </Suspense>
      </Canvas>
      {!ready && <SceneLoadingOverlay />}
    </Boundary>
  );
}
