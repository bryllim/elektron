"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { playSfx, unlockSfx } from "@/lib/sfx";

/** Everything the workspace's 3D scenes and map request on first view, grouped for the loader's status rows. */
const MODELS = [
  "/models/innerscene/wall-inverter-parts.glb", "/models/innerscene/wall-inverter.glb", "/models/innerscene/wind-turbine.glb",
  "/models/innerscene/transformer.glb", "/models/innerscene/switchboard.glb", "/models/innerscene/heat-exchanger.glb",
  "/models/innerscene/cooling-tower.glb", "/models/innerscene/container.glb", "/models/grab3d/solar-panel.glb",
  "/models/nvidia/electrical_power_terminal_a01.glb", "/models/nvidia/barrier_fence_metal_a02.glb",
  "/models/polyhaven/rock_moss_set_01.glb", "/models/polyhaven/modular_electricity_poles.glb", "/models/polyhaven/modular_chainlink_fence.glb",
  "/models/polyhaven/island_tree_01.glb", "/models/polyhaven/fern_02.glb",
];
const TEXTURES = ["gravelly-sand", "forest-ground"].flatMap((folder) => ["diffuse", "normal", "roughness"].map((map) => `/textures/${folder}/${map}.jpg`));
const GROUPS = [
  { id: "models", label: "3D equipment", files: MODELS },
  { id: "textures", label: "Terrain textures", files: TEXTURES },
  { id: "light", label: "Scene lighting", files: ["/environments/studio_small_09_1k.hdr"] },
  { id: "map", label: "Fleet map data", files: ["/philippines.json"] },
] as const;
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

/** Holds the workspace back until its 3D models, textures, environment map, map data and viewer code are loaded.
 * Presented as a segmented, HUD-style boot sequence. */
export default function WorkspaceLoader({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  // after loading, wait for a tap: it unlocks browser audio so the workspace can play its sounds
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const loaded = new Map<string, number>(), totals = new Map<string, number>();
    let done = 0;
    const steps = GROUPS.reduce((n, g) => n + g.files.length, 0) + CODE.length;
    const update = () => {
      const bytes = [...loaded.values()].reduce((a, b) => a + b, 0), total = [...totals.values()].reduce((a, b) => a + b, 0);
      const value = Math.min(0.99, 0.15 * (done / steps) + 0.85 * (total ? bytes / total : 0));
      if (cancelled) return;
      setProgress((p) => Math.max(p, value));
    };
    const bump = (id: string) => { done++; if (!cancelled) setCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })); update(); };
    const started = performance.now();
    const work = [
      ...GROUPS.flatMap((group) => group.files.map((url) => fetchWithProgress(url, (l, t) => { loaded.set(url, l); totals.set(url, t); update(); })
        .catch(() => {}).finally(() => bump(group.id)))),
      ...CODE.map((load) => load().catch(() => {}).finally(() => bump("code"))),
    ];
    // a slow network never strands judges behind the loader
    const safety = setTimeout(() => !cancelled && setReady(true), 45000);
    Promise.all(work).then(() => {
      // parse into drei's caches so the scenes mount without a second wait
      MODELS.forEach((url) => useGLTF.preload(url));
      useTexture.preload(TEXTURES);
      const wait = Math.max(0, 900 - (performance.now() - started));
      setTimeout(() => { if (!cancelled) { setProgress(1); setReady(true); } }, wait);
    });
    return () => { cancelled = true; clearTimeout(safety); };
  }, []);
  useEffect(() => {
    if (!entered) return;
    const t = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(t);
  }, [entered]);
  const enter = () => { if (!ready || entered) return; unlockSfx(); playSfx("boot"); setEntered(true); };
  const current = GROUPS.find((g) => (counts[g.id] ?? 0) < g.files.length);
  const status = ready ? "Ready" : current ? `Loading ${current.label.toLowerCase()}` : "Preparing the twin viewer";
  return (
    <>
      {entered && children}
      {!gone && (
        <div className={`ws-loader ${entered ? "is-done" : ""} ${ready ? "is-ready" : ""}`} onClick={enter}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") enter(); }} tabIndex={ready ? 0 : -1} role="progressbar" aria-label="Loading the Elektron workspace" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="ws-load">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/story/v4/elektron-icon.png" alt="" width={52} height={52} />
            <strong>ELEKTRON</strong>
            <div className="ws-load-bar"><i style={{ transform: `scaleX(${Math.max(0.02, progress)})` }} /></div>
            <div className="ws-load-meta"><span>{status}</span><span>{Math.round(progress * 100)}%</span></div>
            {ready && <button type="button" className="ws-load-tap" onClick={enter} autoFocus>Tap to continue</button>}
          </div>
        </div>
      )}
    </>
  );
}
