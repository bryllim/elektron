"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useGLTF, useTexture } from "@react-three/drei";

/** Everything the workspace's 3D scenes and map request on first view. */
const MODELS = [
  "/models/innerscene/wall-inverter-parts.glb", "/models/innerscene/wall-inverter.glb", "/models/innerscene/wind-turbine.glb",
  "/models/innerscene/transformer.glb", "/models/innerscene/switchboard.glb", "/models/innerscene/heat-exchanger.glb",
  "/models/innerscene/cooling-tower.glb", "/models/innerscene/container.glb", "/models/grab3d/solar-panel.glb",
  "/models/nvidia/electrical_power_terminal_a01.glb", "/models/nvidia/barrier_fence_metal_a02.glb",
  "/models/polyhaven/rock_moss_set_01.glb", "/models/polyhaven/modular_electricity_poles.glb", "/models/polyhaven/modular_chainlink_fence.glb",
  "/models/polyhaven/island_tree_01.glb", "/models/polyhaven/fern_02.glb",
];
const TEXTURES = ["gravelly-sand", "forest-ground"].flatMap((folder) => ["diffuse", "normal", "roughness"].map((map) => `/textures/${folder}/${map}.jpg`));
const OTHER = ["/environments/studio_small_09_1k.hdr", "/philippines.json"];
const FILES = [...MODELS, ...TEXTURES, ...OTHER];
const CODE = [() => import("./TwinViewer"), () => import("./PlantScene")];

/** Download one file into the HTTP cache, reporting bytes as they stream in. */
async function fetchWithProgress(url: string, onBytes: (loaded: number, total: number) => void) {
  const response = await fetch(url);
  const total = Number(response.headers.get("content-length")) || 0;
  if (!response.body) { await response.arrayBuffer(); onBytes(total, total); return; }
  const reader = response.body.getReader();
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    loaded += value.length;
    onBytes(loaded, Math.max(total, loaded));
  }
  onBytes(loaded, Math.max(total, loaded));
}

/** Holds the workspace back until its 3D models, textures, environment map, map data and viewer code are loaded. */
export default function WorkspaceLoader({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("Preparing the digital twin");
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const loaded = new Map<string, number>(), totals = new Map<string, number>();
    let done = 0;
    const steps = FILES.length + CODE.length;
    const update = () => {
      const bytes = [...loaded.values()].reduce((a, b) => a + b, 0), total = [...totals.values()].reduce((a, b) => a + b, 0);
      // bytes for the files we know the size of, file count for the rest; never go backwards
      const value = Math.min(0.99, 0.15 * (done / steps) + 0.85 * (total ? bytes / total : 0));
      if (!cancelled) setProgress((p) => Math.max(p, value));
    };
    const started = performance.now();
    const work = [
      ...FILES.map((url) => fetchWithProgress(url, (l, t) => { loaded.set(url, l); totals.set(url, t); update(); })
        .catch(() => {}).finally(() => { done++; update(); if (!cancelled) setLabel(url.endsWith(".glb") ? "Loading 3D equipment" : url.endsWith(".hdr") ? "Lighting the scene" : "Loading plant data"); })),
      ...CODE.map((load) => load().catch(() => {}).finally(() => { done++; update(); })),
    ];
    // a slow network never strands judges behind the loader
    const safety = setTimeout(() => !cancelled && setReady(true), 45000);
    Promise.all(work).then(() => {
      // parse into drei's caches so the scenes mount without a second wait
      MODELS.forEach((url) => useGLTF.preload(url));
      useTexture.preload(TEXTURES);
      const wait = Math.max(0, 700 - (performance.now() - started));
      setTimeout(() => { if (!cancelled) { setProgress(1); setLabel("Ready"); setReady(true); } }, wait);
    });
    return () => { cancelled = true; clearTimeout(safety); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setGone(true), 650);
    return () => clearTimeout(t);
  }, [ready]);
  return (
    <>
      {ready && children}
      {!gone && (
        <div className={`ws-loader ${ready ? "is-done" : ""}`} role="progressbar" aria-label="Loading the Elektron workspace" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="ws-loader-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/story/v4/elektron-icon.png" alt="" width={72} height={72} />
            <strong>ELEKTRON</strong>
            <span>{label}</span>
            <div className="ws-loader-bar"><i style={{ width: `${Math.max(3, progress * 100)}%` }} /></div>
            <small className="mono">{Math.round(progress * 100)}% · fictional fleet · simulated operations</small>
          </div>
        </div>
      )}
    </>
  );
}
