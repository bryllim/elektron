"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  ArrowLeft,
  Activity,
  Sun,
  Wind,
  Thermometer,
  PlugZap,
  TriangleAlert,
  Scan,
  RotateCcw,
  Eye,
  EyeOff,
  Layers3,
  Box,
  FlaskConical,
  Download,
  MapPin,
  Maximize2,
  Minimize2,
  ChevronRight,
  Settings2,
} from "lucide-react";
import {
  ASSETS,
  Scenario,
  Overlay,
  assetMeasurement,
  siteMeasurement,
  weather,
  integrateEnergy,
  assetSeries,
  series,
  fmt,
  timeLabel,
  alarms,
} from "@/lib/simulation";
import { exportMeasurements } from "@/lib/download";
import Chart from "./Chart";
import UtilizationGauge from "./UtilizationGauge";
import AnimatedValue from "./AnimatedValue";
import WeatherControl from "./WeatherControl";
import { weatherModeForScenario, weatherScenario } from "@/lib/scene-weather";
import type { View } from "./SiteWorkspace";
const TwinViewer = dynamic(() => import("./TwinViewer"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <span className="busy-orb" />
      <span>Initializing plant environment…</span>
    </div>
  ),
});
type Props = {
  minute: number;
  scenario: Scenario;
  onWeatherScenario: (scenario: Scenario) => void;
  selected: string | null;
  onSelect: (id: string) => void;
  overlay: Overlay;
  onOverlay: (v: Overlay) => void;
  focusKey: number;
  onFocus: () => void;
  onAgent: (q?: string) => void;
  onSimulation: () => void;
  onBack: () => void;
  onView: (v: View) => void;
  dark: boolean;
  motion: boolean;
};
export default function MissionWorkspace(p: Props) {
  const weatherMode = weatherModeForScenario(p.scenario);
  const [sceneOnly, setSceneOnly] = useState(false);
  const [labels, setLabels] = useState(false),
    [isolated, setIsolated] = useState(false),
    [exploded, setExploded] = useState(false),
    [reset, setReset] = useState(0);
  const site = siteMeasurement("silangan", p.minute, p.scenario),
    asset = assetMeasurement(p.selected ?? "INV-07", p.minute, p.scenario),
    wx = weather("silangan", p.minute, p.scenario),
    events = alarms(p.minute, p.scenario, "silangan");
  const assets = ASSETS.map((a) =>
    assetMeasurement(a.id, p.minute, p.scenario),
  );
  const energy = useMemo(
    () => integrateEnergy("silangan", 0, p.minute, p.scenario, "net"),
    [p.minute, p.scenario],
  );
  const deviation =
    site.actual === null
      ? null
      : site.expected
        ? 100 * (site.actual / site.expected - 1)
        : 0;
  function resetView() {
    setReset((v) => v + 1);
    setIsolated(false);
    setExploded(false);
  }
  return (
    <div className={`mission-workspace ${sceneOnly ? "scene-only" : ""}`}>
      <div className="mission-scene">
        <TwinViewer
          {...p}
          onSelect={p.onSelect}
          labels={labels}
          isolated={isolated}
          exploded={exploded}
          resetKey={reset}
          immersive
        />
      </div>
      <div className="mission-atmosphere" />
      <div className="mission-header">
        <div>
          <button className="mission-back" onClick={p.onBack}>
            <ArrowLeft size={11} /> HIRAYA / PHILIPPINE FLEET
          </button>
          <h1>
            Silangan Solar<span className="mission-site-code">PH-SOL-02</span>
          </h1>
          <p>
            <MapPin size={10} /> Nueva Ecija, Luzon{" "}
            <span>15.6200° N · 121.0800° E</span>
          </p>
        </div>
        <div className="mission-header-actions">
          <WeatherControl
            value={weatherMode}
            onChange={(mode) =>
              p.onWeatherScenario(weatherScenario(mode, p.scenario))
            }
          />
          <span className="mission-state">
            <i className={`tiny-dot ${events.length ? "amber" : "green"}`} />
            {events.length ? "ATTENTION REQUIRED" : "SYSTEMS NOMINAL"}
          </span>
          <button
            className="button glass-button"
            onClick={() => exportMeasurements("silangan", p.minute, p.scenario)}
            aria-label="Export measurements"
          >
            <Download size={13} />
          </button>
          <button className="button glass-button" onClick={p.onSimulation}>
            <FlaskConical size={12} /> What-if
          </button>
        </div>
      </div>
      <div className="mission-left">
        <section className="mission-panel system-panel">
          <PanelTitle title="Plant system status" suffix="SIMULATED" />
          <div className="system-subtitle">
            PHOTOVOLTAIC GENERATION & COLLECTION
          </div>
          <div className="system-capacity">
            <div>
              <span>AC OUTPUT</span>
              <strong>
                <AnimatedValue value={fmt(site.actual)} />
                <small> MW</small>
              </strong>
            </div>
            <div>
              <span>INSTALLED</span>
              <strong>
                10<small> MW AC</small>
              </strong>
            </div>
          </div>
          <div className="system-health">
            <span>INVERTER HEALTH</span>
            <strong>
              {
                assets.filter(
                  (a) => a.state === "Operating" || a.state === "Standby",
                ).length
              }{" "}
              / 12
            </strong>
          </div>
          <div className="health-cells">
            {assets.map((a) => (
              <button
                key={a.id}
                title={`${a.id} · ${a.state}`}
                aria-label={`Select ${a.id}, ${a.state}`}
                className={
                  a.quality === "missing"
                    ? "missing"
                    : a.state === "Derating"
                      ? "derated"
                      : ""
                }
                onClick={() => p.onSelect(a.id)}
              />
            ))}
          </div>
          <div className="system-status-rows">
            <div>
              <i className="tiny-dot green" />
              <span>COLLECTION NETWORK</span>
              <strong>2 groups</strong>
            </div>
            <div>
              <i className="tiny-dot green" />
              <span>DATA ACQUISITION</span>
              <strong>
                {assets.filter((a) => a.quality === "good").length}/12 reporting
              </strong>
            </div>
            <div>
              <i className={`tiny-dot ${events.length ? "amber" : "green"}`} />
              <span>CONTROLLER EVENTS</span>
              <strong className={events.length ? "warning-text" : ""}>
                {events.length} active
              </strong>
            </div>
          </div>
        </section>
        <section className="mission-panel condition-panel">
          <PanelTitle title="Performance envelope" suffix="MW AC" />
          <div className="envelope-values">
            <div>
              <span>Expected</span>
              <strong>{fmt(site.expected)}</strong>
            </div>
            <div>
              <span>Deviation</span>
              <strong
                className={
                  deviation !== null && deviation < -4 ? "warning-text" : ""
                }
              >
                {deviation === null ? "Unknown" : `${fmt(deviation, 1)}%`}
              </strong>
            </div>
          </div>
          <Chart
            points={series(
              "silangan",
              Math.max(0, p.minute - 90),
              p.minute,
              p.scenario,
              50,
            )}
            height={79}
            color="#91b99a"
          />
          <div className="mission-chart-caption">
            <span>
              <i /> Actual
            </span>
            <span>
              <i /> Expected
            </span>
            <button onClick={() => p.onView("trends")}>
              Open trends <ArrowUpRight size={10} />
            </button>
          </div>
        </section>
      </div>
      <div className="mission-right">
        <section className="mission-panel asset-panel">
          <PanelTitle title="Equipment inspector" suffix={asset.group} />
          <div className="mission-asset-heading">
            <span className="mission-asset-symbol">
              <PlugZap size={20} />
            </span>
            <div>
              <h2>{asset.id}</h2>
              <small>INVERTER ZONE / 833 kW AC</small>
            </div>
            <button
              className="icon-button"
              onClick={p.onFocus}
              aria-label="Focus selected equipment"
            >
              <Scan size={15} />
            </button>
          </div>
          <span
            className={`mission-asset-state ${asset.state === "Derating" || asset.quality === "missing" ? "warning-text" : ""}`}
          >
            <i
              className={`tiny-dot ${asset.state === "Derating" || asset.quality === "missing" ? "amber" : "green"}`}
            />
            {asset.state.toUpperCase()}
          </span>
          <div className="asset-main-metric">
            <strong>
              {fmt(asset.actual === null ? null : asset.actual * 1000, 0)}
              <small> kW</small>
            </strong>
            <span>ACTUAL AC OUTPUT</span>
          </div>
          <div className="mission-reading">
            <span>Expected output</span>
            <strong>
              {fmt(asset.expected * 1000, 0)} <small>kW</small>
            </strong>
          </div>
          <div className="mission-reading">
            <span>Internal temperature</span>
            <strong
              className={(asset.temperature ?? 0) > 65 ? "warning-text" : ""}
            >
              {fmt(asset.temperature, 1)} <small>°C</small>
            </strong>
          </div>
          <div className="mission-reading">
            <span>Quality / freshness</span>
            <strong>
              {asset.quality === "good" ? "GOOD / CURRENT" : "MISSING"}
            </strong>
          </div>
          {events.some((e) => e.assetId === asset.id) && (
            <button
              className="mission-alert"
              onClick={() => p.onView("events")}
            >
              <TriangleAlert size={12} />
              <span>
                {events[0].title}
                <small>
                  {events[0].code} / {timeLabel(events[0].minute)} PHT
                </small>
              </span>
              <ChevronRight size={12} />
            </button>
          )}
          <button
            className="mission-investigate"
            onClick={() =>
              p.onAgent(
                `Why is ${asset.id} ${asset.state === "Derating" ? "underperforming" : "in its current state"}?`,
              )
            }
          >
            Investigate cause <ArrowUpRight size={11} />
          </button>
        </section>
        <section className="mission-panel environment-panel">
          <PanelTitle title="Plant environment" suffix="SYNTHETIC" />
          <div className="environment-main">
            <Sun size={25} strokeWidth={1.2} />
            <strong>
              {fmt(wx.ambient, 1)}
              <span>°C</span>
            </strong>
            <div className="wind-bearing">
              <span>N</span>
              <Wind size={17} />
            </div>
          </div>
          <div className="mission-reading">
            <span>POA irradiance</span>
            <strong>
              {fmt(wx.irradiance, 0)} <small>W/m²</small>
            </strong>
          </div>
          <div className="mission-reading">
            <span>Wind speed</span>
            <strong>
              {fmt(wx.wind, 1)} <small>m/s</small>
            </strong>
          </div>
          <div className="mission-reading">
            <span>Cloud context</span>
            <strong>{wx.cloud}</strong>
          </div>
        </section>
      </div>
      <div className="mission-scene-controls">
        <button
          className="glass-control"
          aria-label={sceneOnly ? "Show operations panels" : "Expand 3D scene"}
          aria-pressed={sceneOnly}
          title={sceneOnly ? "Show operations panels" : "Expand 3D scene"}
          onClick={() => setSceneOnly(!sceneOnly)}
        >
          {sceneOnly ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
        <button
          className="glass-control"
          onClick={resetView}
          title="Reset view"
          aria-label="Reset 3D view"
        >
          <RotateCcw size={15} />
        </button>
        <button
          className={`glass-control ${labels ? "active" : ""}`}
          onClick={() => setLabels(!labels)}
          title="Toggle labels"
          aria-label="Toggle equipment labels"
        >
          {labels ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <button
          className={`glass-control ${isolated ? "active" : ""}`}
          onClick={() => {
            setIsolated(!isolated);
            setExploded(false);
            p.onFocus();
          }}
          title="Isolate selected"
          aria-label="Isolate selected equipment"
        >
          <Layers3 size={15} />
        </button>
        <button
          className={`glass-control ${exploded ? "active" : ""}`}
          onClick={() => {
            setExploded(!exploded);
            setIsolated(false);
          }}
          title="Exploded inverter"
          aria-label={
            exploded
              ? "Reassemble inverter and show plant"
              : "Inspect exploded inverter assembly"
          }
        >
          <Box size={15} />
        </button>
      </div>
      <div className="mission-scene-caption">
        <span className="mission-crosshair">+</span>
        {exploded ? (
          <>
            <strong>INVERTER ASSEMBLY</strong>
            <span>Innerscene CAD / 26 sourced parts</span>
          </>
        ) : (
          <>
            <strong>SILANGAN / DIGITAL TWIN</strong>
            <span>12 MWp DC · 10 MW AC · 12 inverter zones</span>
          </>
        )}
        <div>
          <i className="tiny-dot green" /> {timeLabel(p.minute)} PHT · SIMULATED
        </div>
      </div>
      <div className="mission-bottom">
        <section className="mission-panel energy-panel">
          <PanelTitle title="Energy & export" suffix="TODAY" />
          <div className="energy-panel-main">
            <div>
              <span>NET ENERGY EXPORTED</span>
              <strong>
                {fmt(energy.mwh, 1)}
                <small> MWh</small>
              </strong>
              <p>
                {energy.complete
                  ? "Complete integration"
                  : "Partial · gaps excluded"}
              </p>
            </div>
            <UtilizationGauge
              value={site.actual === null ? null : site.actual * 10}
            />
          </div>
          <div className="bottom-readings">
            <div>
              <span>NET EXPORT</span>
              <strong>
                {fmt(site.net)} <small>MW</small>
              </strong>
            </div>
            <div>
              <span>AC UTILIZATION</span>
              <strong>
                {site.actual === null ? "—" : fmt((site.actual / 10) * 100, 1)}
                <small>%</small>
              </strong>
            </div>
            <div>
              <span>SOURCE</span>
              <strong>Replay</strong>
            </div>
          </div>
        </section>
        <section className="mission-panel inverter-dock">
          <PanelTitle title="Inverter zones" suffix="OUTPUT / EXPECTED" />
          <div className="zone-reference">
            <span>100% reference</span>
            <strong>
              {asset.id}{" "}
              <b>
                {asset.actual === null
                  ? "NO DATA"
                  : asset.expected
                    ? `${fmt((asset.actual / asset.expected) * 100, 1)}%`
                    : "STANDBY"}
              </b>
            </strong>
          </div>
          <div className="zone-bars">
            {assets.map((a) => (
              <button
                key={a.id}
                className={`${p.selected === a.id ? "selected" : ""} ${a.state === "Derating" ? "warning" : ""}`}
                aria-label={`Select ${a.id} from equipment list`}
                aria-pressed={p.selected === a.id}
                data-missing={a.actual === null}
                title={`${a.id} · ${fmt(a.actual === null ? null : a.actual * 1000, 0)} kW / ${fmt(a.expected * 1000, 0)} kW expected · ${a.state}`}
                onClick={() => p.onSelect(a.id)}
              >
                <span className="zone-bar-track">
                  <span className="zone-reference-mark" />
                  <i
                    style={{
                      height: `${a.actual === null ? 0 : a.expected === 0 ? 0 : Math.min(100, (a.actual / a.expected) * 100)}%`,
                    }}
                  />
                </span>
                <span>{a.id.slice(4)}</span>
              </button>
            ))}
          </div>
          <div className="zone-dock-footer">
            <span>
              <i className="tiny-dot green" /> Operating
            </span>
            <span>
              <i className="tiny-dot amber" /> Derating
            </span>
            <select
              aria-label="3D scene overlay"
              value={p.overlay}
              onChange={(e) => p.onOverlay(e.target.value as Overlay)}
            >
              <option value="natural">Materials</option>
              <option value="actual">AC output</option>
              <option value="relative">Utilization</option>
              <option value="deviation">Deviation</option>
              <option value="flow">Power flow</option>
            </select>
          </div>
        </section>
        <section className="mission-panel output-dock">
          <PanelTitle title={`${asset.id} output`} suffix="60 MIN / kW" />
          <Chart
            points={assetSeries(
              asset.id,
              Math.max(0, p.minute - 60),
              p.minute,
              p.scenario,
            ).map((v) => ({
              ...v,
              actual: v.actual === null ? null : v.actual * 1000,
              expected: v.expected * 1000,
            }))}
            markers={events
              .filter((e) => e.assetId === asset.id)
              .map((e) => ({ minute: e.minute, label: e.code }))}
            height={104}
            unit="kW"
            color="#a2c593"
          />
          <div className="dock-chart-summary">
            <span className="dock-legend">
              <i className="legend-line blue" /> Actual{" "}
              <i className="legend-line dashed" /> Expected
            </span>
            <button onClick={() => p.onView("trends")}>
              Historical analysis <ArrowUpRight size={10} />
            </button>
          </div>
        </section>
      </div>
      <div className="mission-footnote">
        <span>Fictional company · Simulated operations</span>
      </div>
    </div>
  );
}
function PanelTitle({ title, suffix }: { title: string; suffix: string }) {
  return (
    <div className="mission-panel-title">
      <h2>{title}</h2>
      <span>{suffix}</span>
    </div>
  );
}
