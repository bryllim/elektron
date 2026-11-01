"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
export function useSceneMotion(motion: boolean) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(q.matches);
    const change = () => setReduce(q.matches);
    q.addEventListener("change", change);
    return () => q.removeEventListener("change", change);
  }, []);
  return motion && !reduce;
}
const seed = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
export function Rain({
  rain,
  wind,
  motion,
  span = 180,
  height = 65,
}: {
  rain: number;
  wind: number;
  motion: boolean;
  span?: number;
  height?: number;
}) {
  const active = useSceneMotion(motion),
    elapsed = useRef(0),
    { invalidate } = useThree();
  const count = rain >= 12 ? 1900 : 1100;
  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        phase: seed(i + 3),
        x: seed(i + 5),
        z: seed(i + 7),
        speed: 19 + seed(i + 10) * 8,
        length: 0.7 + seed(i + 9),
      })),
    [count],
  );
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(count * 6), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => invalidate(), [active, rain, wind, invalidate]);
  useFrame((_, delta) => {
    if (!rain) return;
    if (active) elapsed.current += Math.min(delta, 0.08);
    const a = geometry.attributes.position as THREE.BufferAttribute;
    const t = elapsed.current;
    for (let i = 0; i < count; i++) {
      const y =
        height - ((drops[i].phase * height + t * drops[i].speed) % height);
      const x = ((drops[i].x * span + t * wind * 0.4) % span) - span / 2;
      const z = drops[i].z * span - span / 2;
      const length = (span / 150) * drops[i].length;
      a.setXYZ(i * 2, x, y, z);
      a.setXYZ(i * 2 + 1, x - wind * 0.025 * length, y + length, z);
    }
    a.needsUpdate = true;
    if (active) invalidate();
  });
  return rain > 0 ? (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        color="#b3c9d2"
        transparent
        opacity={rain >= 12 ? 0.35 : 0.24}
        depthWrite={false}
      />
    </lineSegments>
  ) : null;
}
export function VaporPlumes({
  origins,
  wind,
  motion,
}: {
  origins: [number, number, number][];
  wind: number;
  motion: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null),
    elapsed = useRef(0),
    { invalidate } = useThree();
  const active = useSceneMotion(motion),
    dummy = useMemo(() => new THREE.Object3D(), []),
    color = useMemo(() => new THREE.Color(), []);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(215,225,228,.65)");
    g.addColorStop(0.35, "rgba(200,213,220,.3)");
    g.addColorStop(1, "rgba(200,213,220,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => invalidate(), [active, wind, invalidate]);
  useFrame(({ camera }, delta) => {
    if (!ref.current) return;
    if (active) elapsed.current += Math.min(delta, 0.08);
    origins.forEach(([x, y, z], n) => {
      for (let j = 0; j < 24; j++) {
        const phase = (j / 24 + elapsed.current * 0.11 + n * 0.073) % 1;
        dummy.position.set(
          x +
            phase * wind * 0.35 +
            Math.sin(j * 1.7 + elapsed.current * 0.4) * phase * 0.35,
          y + phase * 9,
          z + Math.cos(j * 2.1) * phase * 0.7,
        );
        dummy.quaternion.copy(camera.quaternion);
        dummy.scale.setScalar(0.7 + phase * 4.3);
        dummy.updateMatrix();
        ref.current!.setMatrixAt(n * 24 + j, dummy.matrix);
        color.setScalar(Math.sin(phase * Math.PI) * 0.6);
        ref.current!.setColorAt(n * 24 + j, color);
      }
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    if (active) invalidate();
  });
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, origins.length * 24]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{ vaporMap: { value: texture } }}
        vertexShader={`varying vec2 vUv; varying float vFade; void main(){vUv=uv; vFade=instanceColor.r; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`}
        fragmentShader={`uniform sampler2D vaporMap; varying vec2 vUv; varying float vFade; void main(){gl_FragColor=vec4(0.64,0.71,0.73,texture2D(vaporMap,vUv).a*vFade*0.34);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}
      />
    </instancedMesh>
  );
}
