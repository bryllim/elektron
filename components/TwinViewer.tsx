"use client";
import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  Component,
  Suspense,
} from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Line,
  ContactShadows,
  useGLTF,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import { SceneReady, SceneLoadingOverlay } from "./SceneLoading";
import { Rain } from "./SceneWeather";
import MountainTerrain from "./MountainTerrain";
import SiteSurroundings from "./SiteSurroundings";
import SceneLighting from "./SceneLighting";
import { sceneWeather } from "@/lib/scene-weather";
import {
  createFlowRoute,
  pointOnFlowRoute,
  type RoutePoint,
} from "@/lib/flow-route";
import {
  MODEL_PATHS,
  SOLAR_PLACEMENTS,
  SourcedInstances,
  SourcedInverters,
  SourcedFence,
  SourcedInfrastructure,
} from "./SourcedModels";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import {
  ASSETS,
  Scenario,
  Overlay,
  assetMeasurement,
  fmt,
} from "@/lib/simulation";
export type TwinProps = {
  immersive?: boolean;
  dark: boolean;
  motion: boolean;
  minute: number;
  scenario: Scenario;
  selected: string | null;
  onSelect: (id: string) => void;
  overlay: Overlay;
  labels: boolean;
  isolated: boolean;
  exploded: boolean;
  focusKey: number;
  resetKey: number;
};
const positions = ASSETS.map((a, i) => ({
  x: -42 + (i % 4) * 28,
  z: -29 + Math.floor(i / 4) * 24,
}));
const flowRoutes = positions.map(({ x, z }) => createFlowRoute(x, z));
function Box({
  position,
  size,
  color,
  rotation,
  metalness = 0.1,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: [number, number, number];
  metalness?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.75}
        metalness={metalness}
      />
    </mesh>
  );
}
function SceneLabel({
  text,
  position,
  selected = false,
  warning = false,
  width = 12,
  dark = true,
}: {
  text: string;
  position: [number, number, number];
  selected?: boolean;
  warning?: boolean;
  width?: number;
  dark?: boolean;
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 104;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = selected
      ? "#485b49"
      : warning
        ? "#443626"
        : dark
          ? "#262c27"
          : "#fcfdf6";
    ctx.beginPath();
    ctx.roundRect(2, 4, 508, 96, 3);
    ctx.fill();
    ctx.font =
      "500 38px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = selected
      ? "#e1efdf"
      : warning
        ? "#e3b772"
        : dark
          ? "#c1cec0"
          : "#607267";
    ctx.fillText(text, 256, 54, 474);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [text, selected, warning, dark]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={position} scale={[width, (width * 104) / 512, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}
function SolarZone({ index, props }: { index: number; props: TwinProps }) {
  const { x, z } = positions[index],
    asset = ASSETS[index],
    p = assetMeasurement(asset.id, props.minute, props.scenario);
  const selected = props.selected === asset.id;
  const [hover, setHover] = useState(false);
  const tint =
    p.quality === "missing"
      ? "#9ca3aa"
      : props.overlay === "deviation"
        ? p.deviation !== null && p.deviation < -20
          ? "#edb256"
          : "#7fc8aa"
        : props.overlay === "relative"
          ? p.actual === 0
            ? "#8793a1"
            : p.actual !== null && p.actual / p.rating < 0.5
              ? "#dba05d"
              : "#6fa9d3"
          : props.overlay === "actual"
            ? p.actual === null
              ? "#a2a7ae"
              : p.actual < 0.4
                ? "#c5a46e"
                : "#86bde6"
            : "#ffffff";
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 5) return;
    e.stopPropagation();
    props.onSelect(asset.id);
  };
  return (
    <group
      position={[x, 0, z]}
      userData={{ assetId: asset.id }}
      onClick={click}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "auto";
      }}
    >
      {selected && <SelectionBeacon motion={props.motion} />}
      {(selected || hover) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <planeGeometry args={[25, 20]} />
          <meshBasicMaterial
            color={selected ? "#6a9eef" : "#c3d9e5"}
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      )}
      <SourcedInstances
        path={MODEL_PATHS.solar}
        placements={SOLAR_PLACEMENTS}
        tint={tint}
      />
      <SourcedInverters />
      {(props.labels || selected) && (
        <SceneLabel
          text={`${asset.id}${selected || props.overlay !== "natural" ? ` · ${p.actual === null ? "No data" : `${fmt(p.actual * 1000, 0)} kW`}` : ""}`}
          position={[0, 2.9, 0]}
          selected={selected}
          warning={p.state === "Derating"}
          width={selected ? 13 : 8}
          dark={props.dark}
        />
      )}
    </group>
  );
}
function Exploded({
  explode,
  labels,
  motion,
}: {
  explode: boolean;
  labels: boolean;
  motion: boolean;
}) {
  const { scene } = useGLTF("/models/innerscene/wall-inverter-parts.glb");
  const assembly = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const name = o.name.toLowerCase();
      const offset =
        name.includes("front") ||
        name.includes("display") ||
        name.includes("pull")
          ? new THREE.Vector3(0, 0, 0.38)
          : name.includes("fin") || name.includes("heat")
            ? new THREE.Vector3(0, 0, -0.3)
            : name.includes("connector") || name.includes("gland")
              ? new THREE.Vector3(0, -0.18, 0)
              : new THREE.Vector3();
      o.userData.home = o.position.clone();
      o.userData.offset = offset;
    });
    return clone;
  }, [scene]);
  const { invalidate } = useThree();
  useEffect(() => invalidate(), [explode, motion, invalidate]);
  useFrame(() => {
    let moving = false;
    assembly.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const target = (o.userData.home as THREE.Vector3)
        .clone()
        .addScaledVector(o.userData.offset, explode ? 1 : 0);
      if (motion && o.position.distanceTo(target) > 0.0002) {
        o.position.lerp(target, 0.09);
        moving = true;
      } else o.position.copy(target);
    });
    if (moving) invalidate();
  });
  return (
    <group scale={32} position={[0, 0, 0]}>
      <primitive object={assembly} dispose={null} />
      {labels && (
        <SceneLabel
          text="Sourced inverter CAD · Innerscene"
          position={[0, 0.95, 0]}
          width={1.2}
        />
      )}
    </group>
  );
}
function CameraRig({ props }: { props: TwinProps }) {
  const controls = useRef<OrbitImpl>(null),
    moving = useRef(false);
  const goal = useRef(new THREE.Vector3(110, 105, 125)),
    target = useRef(new THREE.Vector3(0, 0, 0));
  const { camera, invalidate } = useThree();
  function move(
    position: [number, number, number],
    look: [number, number, number],
  ) {
    goal.current.set(...position);
    target.current.set(...look);
    if (!props.motion) {
      camera.position.copy(goal.current);
      controls.current?.target.copy(target.current);
      controls.current?.update();
      moving.current = false;
    } else moving.current = true;
    invalidate();
  }
  useEffect(() => {
    move([110, 105, 125], [0, 0, 0]);
  }, [props.resetKey]);
  useEffect(() => {
    if (!props.focusKey || !props.selected || props.exploded) return;
    const i = ASSETS.findIndex((a) => a.id === props.selected);
    if (i < 0) return;
    const p = positions[i];
    move([p.x + 32, 35, p.z + 38], [p.x, 0, p.z]);
  }, [props.focusKey, props.selected]);
  useEffect(() => {
    if (props.exploded) move([37, 28, 52], [0, 10, 0]);
    else move([110, 105, 125], [0, 0, 0]);
  }, [props.exploded]);
  useEffect(() => {
    if (!props.motion && moving.current) {
      camera.position.copy(goal.current);
      controls.current?.target.copy(target.current);
      controls.current?.update();
      moving.current = false;
      invalidate();
    }
  }, [props.motion]);
  useFrame((_, delta) => {
    if (!moving.current || !controls.current) return;
    const blend = 1 - Math.exp(-6 * Math.min(delta, 0.1));
    camera.position.lerp(goal.current, blend);
    controls.current.target.lerp(target.current, blend);
    controls.current.update();
    if (
      camera.position.distanceTo(goal.current) < 0.03 &&
      controls.current.target.distanceTo(target.current) < 0.03
    ) {
      camera.position.copy(goal.current);
      controls.current.target.copy(target.current);
      moving.current = false;
    }
    invalidate();
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minDistance={12}
      maxDistance={265}
      maxPolarAngle={Math.PI / 2.1}
      enableDamping={props.motion}
      dampingFactor={0.12}
      onStart={() => {
        moving.current = false;
      }}
    />
  );
}
function SelectionBeacon({ motion }: { motion: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const { invalidate } = useThree();
  useFrame(({ clock }) => {
    if (!mesh.current || !motion) return;
    const phase = (clock.elapsedTime * 0.35) % 1;
    mesh.current.scale.setScalar(1 + phase * 0.5);
    (mesh.current.material as THREE.MeshBasicMaterial).opacity =
      (1 - phase) * 0.24;
    invalidate();
  });
  return (
    <mesh ref={mesh} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[11.5, 11.56, 64]} />
      <meshBasicMaterial
        color="#afcca1"
        transparent
        opacity={0.2}
        depthWrite={false}
      />
    </mesh>
  );
}

function FlowCable({ points }: { points: RoutePoint[] }) {
  return (
    <group>
      <Line
        points={points}
        color="#668c80"
        lineWidth={0.75}
        transparent
        opacity={0.16}
        depthWrite={false}
      />
      <Line
        points={points}
        color="#a0cbb8"
        lineWidth={1.15}
        dashed
        dashSize={1.2}
        gapSize={0.8}
        transparent
        opacity={0.52}
        depthWrite={false}
      />
    </group>
  );
}

const PULSES_PER_ROUTE = 2;
const TRAIL_SAMPLES = 32;
function EnergyPulses({
  reduced,
  indices,
}: {
  reduced: boolean;
  indices: number[];
}) {
  const trails = useRef<THREE.InstancedMesh>(null);
  const halos = useRef<THREE.InstancedMesh>(null);
  const distance = useRef(0);
  const count = indices.length * PULSES_PER_ROUTE;
  const { invalidate } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const glow = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(232,255,245,0.95)");
    gradient.addColorStop(0.12, "rgba(181,246,215,0.75)");
    gradient.addColorStop(0.32, "rgba(126,224,181,0.3)");
    gradient.addColorStop(0.65, "rgba(105,208,166,0.06)");
    gradient.addColorStop(1, "rgba(105,208,166,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => glow.dispose(), [glow]);
  useEffect(() => {
    if (!trails.current) return;
    const color = new THREE.Color();
    for (let i = 0; i < count * TRAIL_SAMPLES; i++) {
      const fade = 1 - (i % TRAIL_SAMPLES) / TRAIL_SAMPLES;
      color.set("#d5ffeb").multiplyScalar(Math.pow(fade, 1.6));
      trails.current.setColorAt(i, color);
    }
    trails.current.instanceColor!.needsUpdate = true;
    invalidate();
  }, [count, invalidate]);
  useEffect(() => {
    invalidate();
  }, [reduced, invalidate]);
  useFrame(({ camera }, delta) => {
    if (!trails.current || !halos.current) return;
    if (!reduced) distance.current += Math.min(delta, 0.1) * 5.5;
    for (let i = 0; i < count; i++) {
      const routeIndex = indices[Math.floor(i / PULSES_PER_ROUTE)];
      const route = flowRoutes[routeIndex];
      // Stagger arrivals so the collection bus never becomes a clump of orbs.
      const phase =
        ((i % PULSES_PER_ROUTE) / PULSES_PER_ROUTE + routeIndex * 0.137) % 1;
      const head = (distance.current + phase * route.length) % route.length;
      const endFade = THREE.MathUtils.smoothstep(
        Math.min(head, route.length - head),
        0,
        1.4,
      );
      dummy.position.set(...pointOnFlowRoute(route, head));
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(2.8 * endFade);
      dummy.updateMatrix();
      halos.current.setMatrixAt(i, dummy.matrix);
      dummy.quaternion.identity();
      for (let j = 0; j < TRAIL_SAMPLES; j++) {
        const d = head - j * 0.11;
        const taper = 1 - j / TRAIL_SAMPLES;
        dummy.position.set(...pointOnFlowRoute(route, Math.max(0, d)));
        // Overlapping samples create a continuous tapered filament, even around elbows.
        dummy.scale.setScalar(
          d < 0
            ? 0
            : (j === 0 ? 0.22 : 0.04 + 0.14 * Math.sqrt(taper)) * endFade,
        );
        dummy.updateMatrix();
        trails.current.setMatrixAt(i * TRAIL_SAMPLES + j, dummy.matrix);
      }
    }
    trails.current.instanceMatrix.needsUpdate = true;
    halos.current.instanceMatrix.needsUpdate = true;
    if (!reduced) invalidate();
  });
  return (
    <group>
      <instancedMesh
        ref={trails}
        args={[undefined, undefined, count * TRAIL_SAMPLES]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh
        ref={halos}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glow}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
function Scene(props: TwinProps) {
  const wx = sceneWeather("silangan", props.minute, props.scenario);
  const [reduced, setReduced] = useState(true);
  const flowIndices = ASSETS.flatMap((a, i) =>
    !props.isolated || !props.selected || props.selected === a.id ? [i] : [],
  );
  const energizedIndices = flowIndices.filter(
    (i) =>
      (assetMeasurement(ASSETS[i].id, props.minute, props.scenario).actual ??
        0) > 0,
  );
  // Each column shares one cable; draw it once to preserve the dash gaps.
  const branchIndices = flowIndices.filter(
    (i, n) =>
      !flowIndices.slice(0, n).some((j) => positions[j].x === positions[i].x),
  );
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const change = () => setReduced(q.matches);
    q.addEventListener("change", change);
    return () => {
      q.removeEventListener("change", change);
    };
  }, []);
  return (
    <>
      <color attach="background" args={[props.dark ? "#08090b" : "#e8ede6"]} />
      <fog
        attach="fog"
        args={[
          props.dark ? "#08090b" : "#e8ede6",
          props.immersive ? 160 : 180,
          wx.rain ? 320 : props.immersive ? 700 : 390,
        ]}
      />
      <SceneLighting minute={props.minute} cloudy={wx.cloudy} extent={95} />
      {props.immersive ? (
        <MountainTerrain kind="solar" wet={wx.rain > 0} />
      ) : (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.8, 0]}
          receiveShadow
        >
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial
            color={props.dark ? "#252729" : "#e0e6da"}
            roughness={1}
          />
        </mesh>
      )}
      {props.exploded ? (
        <>
          <Exploded
            explode={props.exploded}
            labels={props.labels}
            motion={props.motion}
          />
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.28}
            scale={100}
            blur={2}
            far={55}
          />
        </>
      ) : (
        <>
          <Box
            position={[0, -0.7, 0]}
            size={[125, 1.4, 95]}
            color={props.dark ? "#252729" : "#b3bea0"}
          />
          <Box
            position={[0, -0.02, 0]}
            size={[122, 0.15, 92]}
            color={props.dark ? "#2b2e2c" : "#b9c4a5"}
          />
          <Box
            position={[0, 0.07, 32.5]}
            size={[120, 0.12, 5]}
            color={props.dark ? "#414342" : "#cbd0c3"}
          />
          <Box
            position={[0, 0.05, -40]}
            size={[120, 0.1, 3]}
            color={props.dark ? "#414342" : "#cbd0c3"}
          />
          <Box
            position={[0, 0.05, 44]}
            size={[120, 0.1, 3]}
            color={props.dark ? "#414342" : "#cbd0c3"}
          />
          {[-57, 0, 57].map((x) => (
            <Box
              key={x}
              position={[x, 0.05, 0]}
              size={[3, 0.1, 90]}
              color={props.dark ? "#414342" : "#cbd0c3"}
            />
          ))}
          {ASSETS.map((a, i) =>
            !props.isolated || !props.selected || props.selected === a.id ? (
              <SolarZone key={a.id} index={i} props={props} />
            ) : null,
          )}
          {!props.isolated && (
            <>
              <SiteSurroundings kind="solar" />
              <SourcedFence />
              <SourcedInfrastructure />
              {[-1, 0, 1].map((n) => (
                <Line
                  key={n}
                  points={[
                    [-33, 6.8, 39 + n * 1.5],
                    [-27, 6.8, 39 + n * 1.5],
                    [-70, 8, 52 + n * 1.5],
                  ]}
                  color="#61716b"
                  lineWidth={0.6}
                />
              ))}
              {props.labels && (
                <SceneLabel
                  text="STORAGE & GRID"
                  position={[28, 7, 39]}
                  width={16}
                />
              )}
            </>
          )}
          {props.overlay === "flow" && (
            <>
              {branchIndices.map((i) => (
                <FlowCable
                  key={ASSETS[i].id}
                  points={flowRoutes[i].points.slice(0, 2)}
                />
              ))}
              <FlowCable
                points={[
                  [
                    Math.min(
                      0,
                      ...flowIndices.map((i) => flowRoutes[i].points[1][0]),
                    ),
                    0.5,
                    32.5,
                  ],
                  [
                    Math.max(
                      0,
                      ...flowIndices.map((i) => flowRoutes[i].points[1][0]),
                    ),
                    0.5,
                    32.5,
                  ],
                ]}
              />
              <FlowCable
                points={[
                  [0, 0.5, 32.5],
                  [0, 0.5, 40],
                ]}
              />
              {energizedIndices.length > 0 && (
                <EnergyPulses
                  reduced={reduced || !props.motion}
                  indices={energizedIndices}
                />
              )}
            </>
          )}
        </>
      )}
      {!props.exploded && (
        <Rain rain={wx.rain} wind={wx.wind} motion={props.motion} />
      )}
      <CameraRig props={props} />
    </>
  );
}
class SceneBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        <strong>3D view unavailable</strong>
        <p>
          The model could not be loaded. Equipment monitoring remains available
          below.
        </p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload 3D view
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function TwinViewer(props: TwinProps) {
  const [ready, setReady] = useState(false);
  return (
    <SceneBoundary>
      <Canvas
        shadows
        dpr={[1, 1.6]}
        frameloop="demand"
        camera={{ position: [110, 105, 125], fov: 42, near: 0.1, far: 2000 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        fallback={
          <div className="scene-fallback">
            WebGL is unavailable. Equipment monitoring remains available below.
          </div>
        }
      >
        <Suspense fallback={null}>
          <Scene {...props} />
          <SceneReady onReady={setReady} />
        </Suspense>
      </Canvas>
      {!ready && <SceneLoadingOverlay />}
    </SceneBoundary>
  );
}
