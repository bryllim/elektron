"use client";
import { useEffect, useRef, useState } from "react";
import { metaKeyHeaders } from "@/lib/visitor-key";
import {
  Check,
  ImagePlus,
  Link2,
  ScanLine,
  Download,
  Square,
} from "lucide-react";
import type { MetaStatus } from "@/lib/meta";
import type { InspectionResult } from "@/lib/meta-inspection";
import { download } from "@/lib/download";

const targets = [
  "solar panels",
  "wind turbines",
  "trees",
  "cooling towers",
  "water",
];
export default function MetaIntegration() {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [connection, setConnection] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState("");
  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [source, setSource] = useState<"simulated_scene" | "field_photo">(
    "simulated_scene",
  );
  const [target, setTarget] = useState("cooling towers");
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  const probe = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/agent", { signal: controller.signal, headers: metaKeyHeaders() })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
    return () => {
      controller.abort();
      abort.current?.abort();
      probe.current?.abort();
      generation.current++;
    };
  }, []);
  function resetResult() {
    abort.current?.abort();
    generation.current++;
    setBusy(false);
    setResult(null);
    setSelected(null);
    setError("");
  }
  async function check(profile: "triage" | "deep") {
    probe.current?.abort();
    const controller = new AbortController();
    probe.current = controller;
    setChecking(profile);
    try {
      const response = await fetch("/api/meta/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...metaKeyHeaders() },
        body: JSON.stringify({ profile }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (controller.signal.aborted) return;
      setConnection((c) => ({
        ...c,
        [profile]: response.ok
          ? `Text inference verified · ${(data.elapsedMs / 1000).toFixed(1)}s`
          : data.error,
      }));
    } catch {
      if (!controller.signal.aborted)
        setConnection((c) => ({
          ...c,
          [profile]: "Connection check failed. Please retry.",
        }));
    } finally {
      if (!controller.signal.aborted) setChecking("");
    }
  }
  async function loadFile(file: Blob, name: string, demo = false) {
    resetResult();
    const id = generation.current;
    if (!/image\/(jpeg|png|webp)/.test(file.type) || file.size > 4_000_000) {
      setError("Choose a JPEG, PNG or WebP under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (generation.current === id) {
        setImage(String(reader.result));
        setFileName(name);
        setSource(demo ? "simulated_scene" : "field_photo");
      }
    };
    reader.onerror = () => {
      if (generation.current === id) setError("Could not read this image.");
    };
    reader.readAsDataURL(file);
  }
  async function loadDemo() {
    resetResult();
    const id = generation.current;
    try {
      const response = await fetch("/demo/plant-inspection.jpg");
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (id === generation.current)
        await loadFile(blob, "Bukal · simulated 3D scene", true);
    } catch {
      if (id === generation.current) setError("The demo image could not load.");
    }
  }
  async function inspect() {
    resetResult();
    const id = generation.current;
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    try {
      const response = await fetch("/api/inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...metaKeyHeaders() },
        body: JSON.stringify({ image, source, target }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (controller.signal.aborted || id !== generation.current) return;
      if (!response.ok)
        throw new Error(data.error || "Inspection could not finish.");
      setResult(data);
      setSelected(data.detections[0]?.id ?? null);
    } catch (e) {
      if (!controller.signal.aborted && id === generation.current)
        setError((e as Error).message);
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }
  return (
    <section className="meta-integration">
      <span className="eyebrow">
        <Link2 size={13} /> META / OPERATIONS INTELLIGENCE
      </span>
      <h2>From evidence to action.</h2>
      <p className="meta-intro">
        Investigate generation with Muse. Locate equipment with SAM. Keep every
        model result separate from measured plant conditions.
      </p>
      <div className="meta-model-grid">
        {(["triage", "deep"] as const).map((profile) => (
          <article key={profile}>
            <span className="eyebrow">
              {profile === "triage"
                ? "01 / QUICK INVESTIGATION"
                : "02 / DEEP ANALYSIS"}
            </span>
            <h3>{profile === "triage" ? "Muse Spark" : "Muse Wonder"}</h3>
            <code>
              {status?.models[profile] ??
                (profile === "triage" ? "muse-spark-1.3" : "muse-wonder-1.0")}
            </code>
            <p>
              {profile === "triage"
                ? "Telemetry, weather and alarms. Also interprets inspection images."
                : "Deeper evidence review and operator-requested what-if analysis."}
            </p>
            <button
              disabled={!status?.configured || !!checking}
              onClick={() => check(profile)}
            >
              <Link2 size={12} />
              {checking === profile ? "Checking…" : "Test text connection"}
            </button>
            <small role="status">
              {connection[profile] ||
                (status?.configured
                  ? "Key configured · inference not yet checked"
                  : "Waiting for API key")}
            </small>
          </article>
        ))}
        <article>
          <span className="eyebrow">03 / VISUAL LOCALIZATION</span>
          <h3>SAM 3.1</h3>
          <code>{status?.models.segmentation ?? "sam-3.1"}</code>
          <p>
            Object masks and bounding boxes for inspection photos and simulated
            scenes.
          </p>
          <span className="meta-model-state">
            <ScanLine size={12} />
            {result
              ? "Segmentation verified"
              : "Run an image inspection to verify"}
          </span>
          <small>
            {status?.configured
              ? "Uses the same Meta API key"
              : "Waiting for API key"}
          </small>
        </article>
      </div>
      {!status?.configured && (
        <div className="meta-setup">
          <strong>
            {status ? "Ready for your Meta API key" : "Checking configuration…"}
          </strong>
          <span>
            Add <code>META_API_KEY</code> in <code>.env.local</code>, then
            restart the app. Image previews work locally while you set up the
            connection.
          </span>
        </div>
      )}
      <div className="inspection-heading">
        <div>
          <span className="eyebrow">VISUAL INSPECTION</span>
          <h3>Locate. Inspect. Verify.</h3>
        </div>
        <span>SAM 3.1 → Muse Spark</span>
      </div>
      <div className="inspection-layout">
        <div className="inspection-media">
          {image ? (
            <div className="inspection-image-wrap">
              {/* Local, in-memory image; no public upload or persistent storage. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result?.image ?? image} alt={fileName} />
              {result && (
                <svg
                  viewBox={`0 0 ${result.width} ${result.height}`}
                  aria-label="SAM object masks"
                  role="img"
                >
                  {result.detections.map((d) => (
                    <g
                      key={d.id}
                      className={selected === d.id ? "is-selected" : ""}
                    >
                      {d.mask && (
                        <path
                          d={d.mask.path}
                          transform={`translate(${d.mask.x} ${d.mask.y}) scale(${d.mask.scaleX} ${d.mask.scaleY})`}
                        />
                      )}
                      <rect
                        x={d.box.left}
                        y={d.box.top}
                        width={d.box.right - d.box.left}
                        height={d.box.bottom - d.box.top}
                      />
                    </g>
                  ))}
                </svg>
              )}
              <span className="inspection-source">
                {source === "simulated_scene"
                  ? "SIMULATED SCENE"
                  : "OPERATOR PHOTO · UNVERIFIED"}
              </span>
            </div>
          ) : (
            <div className="inspection-empty">
              <ScanLine size={32} strokeWidth={1} />
              <strong>Bring the site into the investigation.</strong>
              <span>
                Upload an inspection image or explore a rendered plant scene.
              </span>
            </div>
          )}
          <div className="inspection-files">
            <label>
              <ImagePlus size={14} /> Choose image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void loadFile(file, file.name);
                  e.target.value = "";
                }}
              />
            </label>
            <button onClick={loadDemo}>Load demo scene</button>
            <span>JPG / PNG / WEBP · 4 MB</span>
          </div>
        </div>
        <div className="inspection-controls">
          <label>
            Image source
            <select
              value={source}
              onChange={(e) => {
                resetResult();
                setSource(e.target.value as typeof source);
              }}
            >
              <option value="simulated_scene">Simulated scene</option>
              <option value="field_photo">
                Field photo · operator supplied
              </option>
            </select>
          </label>
          <label>
            Locate objects
            <select
              value={target}
              onChange={(e) => {
                resetResult();
                setTarget(e.target.value);
              }}
            >
              {targets.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <p>
            The selected image is sent to Meta only when you run inspection.
            Masks locate objects; they do not diagnose equipment health.
          </p>
          {busy ? (
            <button
              className="inspection-run"
              onClick={() => {
                abort.current?.abort();
                generation.current++;
                setBusy(false);
              }}
            >
              <Square size={13} />
              Cancel inspection
            </button>
          ) : (
            <button
              className="inspection-run"
              disabled={!image || !status?.configured}
              onClick={inspect}
            >
              <ScanLine size={14} />
              Run visual inspection
            </button>
          )}
          {busy && (
            <small role="status">
              Locating objects, then reviewing the scene…
            </small>
          )}
          {error && (
            <p role="alert" className="inspection-error">
              {error}
            </p>
          )}
          {!status?.configured && (
            <small>API key required to run inspection.</small>
          )}
        </div>
      </div>
      {result && (
        <div className="inspection-result">
          <div className="inspection-heading">
            <strong>
              <Check size={14} /> {result.totalMatches} model matches ·{" "}
              {(result.elapsedMs / 1000).toFixed(1)}s
            </strong>
            <button
              onClick={() =>
                download(
                  "elektron-visual-inspection.json",
                  JSON.stringify(
                    {
                      ...result,
                      image: undefined,
                      fileName,
                      exportedAt: new Date().toISOString(),
                      limitation:
                        "Model localization, not verified equipment condition or count. No physical control.",
                    },
                    null,
                    2,
                  ),
                )
              }
            >
              <Download size={13} /> Export report
            </button>
          </div>
          <div className="inspection-matches">
            {result.detections.map((d) => (
              <button
                key={d.id}
                aria-pressed={selected === d.id}
                onClick={() => setSelected(d.id)}
              >
                Object {d.id}
                {d.confidence !== undefined
                  ? ` · ${(d.confidence * 100).toFixed(0)}% model confidence`
                  : ""}
              </button>
            ))}
          </div>
          {result.totalMatches === 0 && (
            <p>
              No matching objects were returned. Try a different target or a
              clearer image; this does not establish absence.
            </p>
          )}
          {result.totalMatches > 40 && (
            <p>Showing the first 40 of {result.totalMatches} matches.</p>
          )}
          {result.notice && <p className="provider-notice">{result.notice}</p>}
          <p className="inspection-interpretation">{result.interpretation}</p>
          <small>
            {result.models.segmentation}
            {result.models.vision ? ` + ${result.models.vision}` : ""} · Image
            evidence only · Human review required
          </small>
        </div>
      )}
    </section>
  );
}
