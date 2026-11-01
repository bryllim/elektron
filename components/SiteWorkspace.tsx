"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  ArrowUpRight,
  ArrowLeft,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  CloudSun,
  Clock3,
  TriangleAlert,
  RotateCcw,
  Scan,
  Eye,
  EyeOff,
  Layers3,
  Box,
  FlaskConical,
  ArrowRight,
  Check,
  Download,
  Expand,
  MapPin,
  PlugZap,
  Grid2X2,
} from "lucide-react";
import {
  SITES,
  ASSETS,
  TECH_COLORS,
  Scenario,
  Overlay,
  siteMeasurement,
  assetMeasurement,
  fmt,
  weather,
  integrateEnergy,
  series,
  assetSeries,
  timeLabel,
  alarms,
} from "@/lib/simulation";
import { exportMeasurements } from "@/lib/download";
import Chart from "./Chart";
import { Stat, TechIcon } from "./FleetOverview";
const TwinViewer = dynamic(() => import("./TwinViewer"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <span className="busy-orb" />
      <span>Preparing the Silangan digital twin…</span>
    </div>
  ),
});
export type View = "overview" | "twin" | "trends" | "events";
export default function SiteWorkspace({
  siteId,
  minute,
  scenario,
  view,
  onView,
  onBack,
  onAgent,
  onSimulation,
  selected,
  onSelect,
  overlay,
  onOverlay,
  focusKey,
  onFocus,
  range,
  dark,
  motion,
}: {
  siteId: string;
  minute: number;
  scenario: Scenario;
  view: View;
  onView: (v: View) => void;
  onBack: () => void;
  onAgent: (q?: string) => void;
  onSimulation: () => void;
  selected: string | null;
  onSelect: (id: string) => void;
  overlay: Overlay;
  onOverlay: (v: Overlay) => void;
  focusKey: number;
  onFocus: () => void;
  range: number;
  dark: boolean;
  motion: boolean;
}) {
  const site = SITES.find((s) => s.id === siteId)!;
  const s = siteMeasurement(siteId, minute, scenario),
    w = weather(siteId, minute, scenario),
    a = selected ? assetMeasurement(selected, minute, scenario) : null;
  const [labels, setLabels] = useState(true),
    [isolated, setIsolated] = useState(false),
    [exploded, setExploded] = useState(false),
    [reset, setReset] = useState(0),
    [chartAsset, setChartAsset] = useState("site"),
    [ack, setAck] = useState<string[]>([]),
    [onlyWarnings, setOnlyWarnings] = useState(false);
  const energy = useMemo(
    () => integrateEnergy(siteId, 0, minute, scenario, "net"),
    [siteId, minute, scenario],
  );
  const events = alarms(minute, scenario, siteId);
  const nav = [
    { id: "overview", label: "Overview" },
    { id: "twin", label: "Digital twin" },
    { id: "trends", label: "Trends" },
    { id: "events", label: "Events" },
  ] as const;
  function resetView() {
    setReset((n) => n + 1);
    setIsolated(false);
    setExploded(false);
  }
  return (
    <>
      <div className="site-heading">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={14} /> Back to fleet
        </button>
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <MapPin size={11} /> {site.province.toUpperCase()},{" "}
              {site.region.toUpperCase()}
            </div>
            <div className="site-title">
              <h1>{site.name}</h1>
              <span
                className={`status-pill ${["Attention", "Wind cut-out"].includes(s.status) ? "amber" : "green"}`}
              >
                <i />
                {s.status === "Attention" ? "Needs attention" : s.status}
              </span>
            </div>
            <p>
              <TechIcon tech={site.technology} size={13} />
              {site.technology} <span>·</span> {site.rating} MW AC{" "}
              {site.dc && (
                <>
                  <span>·</span>
                  {site.dc} MWp DC
                </>
              )}{" "}
              <span>·</span> Fictional facility
            </p>
          </div>
          <div className="inline-actions">
            <button
              className="button white"
              onClick={() => exportMeasurements(siteId, minute, scenario)}
            >
              <Download size={14} /> Export data
            </button>
            {siteId === "silangan" && (
              <button className="button primary" onClick={onSimulation}>
                <FlaskConical size={14} /> What-if simulation
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="stat-row">
        <Stat
          title="AC output"
          value={fmt(s.actual)}
          unit="MW"
          icon={<Activity size={16} />}
        >
          <span
            className={
              s.actual !== null && s.actual / s.expected < 0.96
                ? "warning-text"
                : "positive"
            }
          >
            {s.actual === null
              ? "Incomplete telemetry"
              : s.expected === 0
                ? "Nighttime standby"
                : `${fmt((s.actual / s.expected) * 100, 1)}% of expected`}
          </span>
        </Stat>
        <Stat
          title="Expected output"
          value={fmt(s.expected)}
          unit="MW"
          icon={<Sun size={16} />}
        >
          <span className="muted">Modeled from aligned weather</span>
        </Stat>
        <Stat
          title="Net energy today"
          value={fmt(energy.mwh, 1)}
          unit="MWh"
          icon={<PlugZap size={16} />}
        >
          <span className="muted">
            {energy.complete
              ? "Integrated since 00:00 PHT"
              : "Partial · unsupported gaps excluded"}
          </span>
        </Stat>
        <Stat
          title="Active alarms"
          value={`${events.length}`}
          unit="warning"
          icon={<TriangleAlert size={16} />}
        >
          <span className={events.length ? "warning-text" : "positive"}>
            {events.length
              ? events[0].assetId + " · " + events[0].code
              : "No active equipment alarms"}
          </span>
        </Stat>
      </div>
      <div
        className="workspace-tabs"
        role="tablist"
        aria-label="Site workspace"
      >
        {nav.map((n) => (
          <button
            key={n.id}
            role="tab"
            aria-selected={view === n.id}
            className={view === n.id ? "active" : ""}
            onClick={() => onView(n.id)}
          >
            {n.label}
            {n.id === "events" && events.length > 0 && (
              <span>{events.length}</span>
            )}
          </button>
        ))}
        <span>
          <span className="tiny-dot green" /> Snapshot {timeLabel(minute)} PHT
        </span>
      </div>
      {(view === "twin" || view === "overview") && siteId === "silangan" && (
        <>
          <div className="twin-workspace">
            <section className="surface twin-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {exploded ? "Inverter assembly" : "Silangan digital twin"}{" "}
                    <span className="small-tag">3D</span>
                  </h2>
                  <p>
                    {exploded
                      ? "Sourced CAD geometry · Illustrative component separation"
                      : "12 inverter zones · 2 collection groups · Grid connected"}
                  </p>
                </div>
                <select
                  aria-label="3D scene overlay"
                  value={overlay}
                  onChange={(e) => onOverlay(e.target.value as Overlay)}
                >
                  <option value="natural">Natural materials</option>
                  <option value="actual">Actual AC output</option>
                  <option value="relative">Output / rating</option>
                  <option value="deviation">Deviation from expected</option>
                  <option value="flow">Power flow</option>
                </select>
              </div>
              <div className="twin-canvas">
                <TwinViewer
                  dark={dark}
                  motion={motion}
                  minute={minute}
                  scenario={scenario}
                  selected={selected}
                  onSelect={onSelect}
                  overlay={overlay}
                  labels={labels}
                  isolated={isolated}
                  exploded={exploded}
                  focusKey={focusKey}
                  resetKey={reset}
                />
                <div className="scene-mode">
                  <span className="tiny-dot green" />
                  {exploded ? "ASSEMBLY EXPLORER" : "INTERACTIVE DIGITAL TWIN"}
                </div>
                <div className="scene-toolbar">
                  <button
                    className="icon-button"
                    aria-label="Reset 3D view"
                    title="Reset view / Show all"
                    onClick={resetView}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className={`icon-button ${labels ? "active" : ""}`}
                    aria-label="Toggle equipment labels"
                    title="Labels"
                    onClick={() => setLabels(!labels)}
                  >
                    {labels ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Focus selected equipment"
                    title="Focus selected"
                    onClick={onFocus}
                    disabled={!selected}
                  >
                    <Scan size={17} />
                  </button>
                  <button
                    className={`icon-button ${isolated ? "active" : ""}`}
                    aria-label="Isolate selected equipment"
                    title="Isolate equipment"
                    onClick={() => {
                      setIsolated(!isolated);
                      setExploded(false);
                      onFocus();
                    }}
                    disabled={!selected}
                  >
                    <Layers3 size={17} />
                  </button>
                  <button
                    className={`icon-button ${exploded ? "active" : ""}`}
                    aria-label={
                      exploded
                        ? "Reassemble inverter and show plant"
                        : "Inspect exploded inverter assembly"
                    }
                    title="Exploded assembly"
                    onClick={() => {
                      setExploded(!exploded);
                      setIsolated(false);
                    }}
                  >
                    <Box size={17} />
                  </button>
                </div>
                <div className="scene-help">
                  Drag to orbit <span>·</span> Scroll to zoom <span>·</span>{" "}
                  Click to inspect
                </div>
                {overlay !== "natural" && overlay !== "flow" && !exploded && (
                  <div className="heatmap-legend">
                    <strong>
                      {overlay === "deviation"
                        ? "Deviation from expected (%)"
                        : overlay === "actual"
                          ? "Actual AC output (kW)"
                          : "Output relative to rating (%)"}
                    </strong>
                    <div className={`heatmap-ramp ${overlay}`} />
                    <div>
                      <span>
                        {overlay === "deviation"
                          ? "−60%"
                          : overlay === "actual"
                            ? "0 kW"
                            : "0%"}
                      </span>
                      <span>
                        {overlay === "deviation"
                          ? "0%"
                          : overlay === "actual"
                            ? "833 kW"
                            : "100%"}
                      </span>
                    </div>
                    <small>
                      {timeLabel(minute)} PHT · Gray = missing · Standby at
                      night
                    </small>
                  </div>
                )}
                {exploded && (
                  <div className="assembly-info">
                    Sourced inverter assembly · Innerscene
                    <br />
                    <strong>26 CAD parts · Illustrative separation</strong>
                  </div>
                )}
              </div>
              <div className="twin-footer">
                <span>
                  <i className="tiny-dot blue" />{" "}
                  {isolated
                    ? "Isolated equipment"
                    : "Sourced models · NVIDIA / Poly Haven / Innerscene / Grab3D"}
                </span>
                <span>Simulated operations · {timeLabel(minute)} PHT</span>
              </div>
            </section>
            <section className="surface equipment-inspector">
              <div className="inspector-top">
                <span className="eyebrow">EQUIPMENT INSPECTOR</span>
                <span className="small-tag">{a?.group ?? "SITE"}</span>
              </div>
              {a ? (
                <>
                  <div className="asset-title">
                    <span className="asset-icon">
                      <PlugZap size={21} />
                    </span>
                    <div>
                      <h2>{a.id}</h2>
                      <span>
                        String inverter · {fmt(a.rating * 1000, 0)} kW AC
                      </span>
                    </div>
                  </div>
                  <span
                    className={`status-pill ${a.state === "Derating" || a.quality === "missing" ? "amber" : "green"}`}
                  >
                    <i />
                    {a.state}
                  </span>
                  <div className="inspector-output">
                    <span>Actual AC output</span>
                    <strong>
                      {fmt(a.actual === null ? null : a.actual * 1000, 0)}
                      <small> kW</small>
                    </strong>
                    <span>
                      Expected {fmt(a.expected * 1000, 0)} kW{" "}
                      <b
                        className={
                          a.deviation !== null && a.deviation < -20
                            ? "warning-text"
                            : "positive"
                        }
                      >
                        {a.deviation === null
                          ? "Unknown"
                          : `${fmt(a.deviation, 1)}%`}
                      </b>
                    </span>
                  </div>
                  <div className="inspector-measurements">
                    <div>
                      <Thermometer size={14} />
                      <span>Internal temperature</span>
                      <strong
                        className={
                          (a.temperature ?? 0) > 65 ? "warning-text" : ""
                        }
                      >
                        {fmt(a.temperature, 1)} °C
                      </strong>
                    </div>
                    <div>
                      <Clock3 size={14} />
                      <span>Data quality</span>
                      <strong>
                        {a.quality === "good" ? "Good · current" : "Missing"}
                      </strong>
                    </div>
                    <div>
                      <Activity size={14} />
                      <span>Collection group</span>
                      <strong>{a.group}</strong>
                    </div>
                  </div>
                  {events.some((e) => e.assetId === a.id) && (
                    <div className="asset-alarm">
                      <TriangleAlert size={15} />
                      <div>
                        <strong>{events[0].title}</strong>
                        <p>
                          Since {timeLabel(events[0].minute)} PHT ·{" "}
                          {events[0].code}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="inspector-trend">
                    <h3>
                      Actual vs. expected <span>Last 60 min · kW</span>
                    </h3>
                    <Chart
                      points={assetSeries(
                        a.id,
                        Math.max(0, minute - 60),
                        minute,
                        scenario,
                      ).map((p) => ({
                        ...p,
                        actual: p.actual === null ? null : p.actual * 1000,
                        expected: p.expected * 1000,
                      }))}
                      height={108}
                      unit="kW"
                      color={a.state === "Derating" ? "#c79646" : "#5d83d6"}
                    />
                  </div>
                  <button
                    className="button primary full"
                    onClick={() =>
                      onAgent(
                        `Why is ${a.id} ${a.state === "Derating" ? "underperforming" : "in its current state"}?`,
                      )
                    }
                  >
                    Investigate cause
                    <ArrowUpRight size={13} />
                  </button>
                  <p className="inspector-note">
                    Evidence-backed investigation · Demo fallback available
                  </p>
                </>
              ) : (
                <div className="inspector-empty">
                  <Scan size={32} />
                  <h3>A closer look starts here.</h3>
                  <p>
                    Select any inverter in the plant or equipment list to
                    inspect its operating state.
                  </p>
                </div>
              )}
            </section>
          </div>
          <div className="site-bottom-grid">
            <section className="surface equipment-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    Inverter performance <span className="count">12 zones</span>
                  </h2>
                  <p>Actual output relative to modeled expectation</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    onView("trends");
                    setChartAsset(selected ?? "site");
                  }}
                >
                  View trends <ArrowUpRight size={13} />
                </button>
              </div>
              <div className="equipment-grid">
                {ASSETS.map((asset) => {
                  const m = assetMeasurement(asset.id, minute, scenario);
                  return (
                    <button
                      key={asset.id}
                      className={`equipment-tile ${selected === asset.id ? "selected" : ""} ${m.state === "Derating" ? "warning" : ""}`}
                      onClick={() => onSelect(asset.id)}
                    >
                      <span>
                        {asset.id}
                        <i
                          className={`tiny-dot ${m.state === "Derating" || m.quality === "missing" ? "amber" : "green"}`}
                        />
                      </span>
                      <strong>
                        {fmt(m.actual === null ? null : m.actual * 1000, 0)}{" "}
                        <small>kW</small>
                      </strong>
                      <div className="equipment-bar">
                        <i
                          style={{
                            width: `${m.actual === null ? 0 : m.expected === 0 ? 0 : (m.actual / m.expected) * 100}%`,
                          }}
                        />
                      </div>
                      <small>
                        {m.quality === "missing"
                          ? "No telemetry"
                          : m.expected === 0
                            ? "Standby"
                            : `${fmt((m.actual! / m.expected) * 100, 1)}% of expected`}
                      </small>
                    </button>
                  );
                })}
              </div>
            </section>
            <WeatherCard minute={minute} scenario={scenario} siteId={siteId} />
          </div>
        </>
      )}
      {(view === "overview" || view === "twin") && siteId !== "silangan" && (
        <div className="secondary-grid">
          <section className="surface secondary-overview">
            <div
              className="secondary-hero"
              style={{
                background: `${TECH_COLORS[site.technology]}12`,
                color: TECH_COLORS[site.technology],
              }}
            >
              <TechIcon tech={site.technology} size={62} />
              <div>
                <span className="eyebrow">
                  {site.region.toUpperCase()} · {site.technology.toUpperCase()}
                </span>
                <h2>{site.name}</h2>
                <p>{site.province}, Philippines</p>
              </div>
            </div>
            <div className="panel-heading">
              <div>
                <h2>Site generation</h2>
                <p>
                  Actual and modeled output · Last {Math.round(range / 60)}{" "}
                  hours
                </p>
              </div>
              <span className="small-tag">MW</span>
            </div>
            <Chart
              points={series(
                siteId,
                Math.max(0, minute - range),
                minute,
                scenario,
              )}
              height={270}
              color={TECH_COLORS[site.technology]}
            />
            <div className="chart-legend">
              <span>
                <i className="legend-line blue" /> Actual output
              </span>
              <span>
                <i className="legend-line dashed" /> Expected
              </span>
            </div>
            <div className="site-details">
              <div>
                <span>Installed capacity</span>
                <strong>{site.rating} MW</strong>
              </div>
              <div>
                <span>Commissioned</span>
                <strong>{site.commissioned}</strong>
              </div>
              <div>
                <span>
                  {site.technology === "Storage"
                    ? "State of charge"
                    : "Net export"}
                </span>
                <strong>
                  {site.technology === "Storage"
                    ? `${fmt(s.soc, 1)}%`
                    : `${fmt(s.net)} MW`}
                </strong>
              </div>
            </div>
            <p className="secondary-note">
              {site.technology === "Storage"
                ? "Storage is separate from generation. Positive dispatch means discharging; negative means charging."
                : "Synthetic telemetry using a documented, technology-specific model."}{" "}
              Detailed equipment 3D is available at Silangan Solar.
            </p>
          </section>
          <WeatherCard minute={minute} scenario={scenario} siteId={siteId} />
        </div>
      )}
      {view === "trends" && (
        <section className="surface trends-panel">
          <div className="panel-heading">
            <div>
              <h2>
                {chartAsset === "site" ? site.name : chartAsset} · Output
                history
              </h2>
              <p>
                Shared simulation clock · Missing telemetry appears as a gap
              </p>
            </div>
            <div className="inline-actions">
              {siteId === "silangan" && (
                <select
                  aria-label="Trend equipment"
                  value={chartAsset}
                  onChange={(e) => setChartAsset(e.target.value)}
                >
                  <option value="site">Whole plant</option>
                  {ASSETS.map((a) => (
                    <option key={a.id}>{a.id}</option>
                  ))}
                </select>
              )}
              <button
                className="button subtle"
                onClick={() => exportMeasurements(siteId, minute, scenario)}
              >
                <Download size={14} /> CSV
              </button>
            </div>
          </div>
          <Chart
            points={
              chartAsset === "site" || siteId !== "silangan"
                ? series(siteId, Math.max(0, minute - range), minute, scenario)
                : assetSeries(
                    chartAsset,
                    Math.max(0, minute - range),
                    minute,
                    scenario,
                    100,
                  )
            }
            markers={events
              .filter((e) => chartAsset === "site" || e.assetId === chartAsset)
              .map((e) => ({ minute: e.minute, label: e.code }))}
            height={350}
          />
          <div className="chart-legend">
            <span>
              <i className="legend-line blue" /> Actual AC output (MW)
            </span>
            <span>
              <i className="legend-line dashed" /> Modeled expectation (MW)
            </span>
          </div>
          <div className="trend-callout">
            <Activity size={17} />
            <div>
              <strong>
                {events.length
                  ? `${events[0].title} at ${timeLabel(events[0].minute)} PHT`
                  : "No active anomalies in this scenario"}
              </strong>
              <p>
                {events.length
                  ? events[0].description
                  : "Compare actual output against the expected curve and aligned synthetic weather."}
              </p>
            </div>
            {events.length > 0 && (
              <button
                className="button white"
                onClick={() =>
                  onAgent("Was the drop caused by clouds or equipment?")
                }
              >
                Investigate <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </section>
      )}
      {view === "events" && (
        <section className="surface events-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Events & alarms{" "}
                <span className="count">{events.length} active</span>
              </h2>
              <p>Controller events from the shared simulation timeline</p>
            </div>
            <select
              aria-label="Filter events"
              value={onlyWarnings ? "warnings" : "all"}
              onChange={(e) => setOnlyWarnings(e.target.value === "warnings")}
            >
              <option value="all">All events</option>
              <option value="warnings">Warnings only</option>
            </select>
          </div>
          <div className="event-list">
            {[
              ...events,
              ...(onlyWarnings
                ? []
                : [
                    {
                      id: "SYNC",
                      assetId: "Site gateway",
                      siteId,
                      severity: "Info",
                      title: "Telemetry snapshot synchronized",
                      description:
                        "All available measurements aligned to the shared simulation clock.",
                      minute: Math.floor(minute / 15) * 15,
                      code: "SYS-001",
                    },
                    ...(minute >= 360
                      ? [
                          {
                            id: "DAY",
                            assetId: "Site controller",
                            siteId,
                            severity: "Info",
                            title: "Daytime operating window started",
                            description:
                              "Synthetic daylight model entered the generation window.",
                            minute: 360,
                            code: "SYS-002",
                          },
                        ]
                      : []),
                  ]),
            ]
              .sort((a, b) => b.minute - a.minute)
              .map((e) => (
                <div key={e.id} className="event-row">
                  <span
                    className={`event-symbol ${e.severity === "Warning" ? "warning" : ""}`}
                  >
                    {e.severity === "Warning" ? (
                      <TriangleAlert size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                  </span>
                  <div>
                    <h3>
                      {e.title}
                      <span
                        className={`status-pill ${e.severity === "Warning" ? "amber" : "blue"}`}
                      >
                        {e.severity}
                      </span>
                    </h3>
                    <p>{e.description}</p>
                    <small>
                      {e.assetId} · {e.code} · {timeLabel(e.minute)} PHT
                    </small>
                  </div>
                  {e.severity === "Warning" && (
                    <button
                      className={`button ${ack.includes(e.id) ? "subtle" : "white"}`}
                      onClick={() =>
                        setAck((v) => (v.includes(e.id) ? v : [...v, e.id]))
                      }
                      disabled={ack.includes(e.id)}
                    >
                      {ack.includes(e.id) ? (
                        <>
                          <Check size={13} /> Acknowledged locally
                        </>
                      ) : (
                        "Acknowledge"
                      )}
                    </button>
                  )}
                </div>
              ))}
            {onlyWarnings && !events.length && (
              <div className="empty-state">
                <Check size={24} />
                <h3>No active warnings</h3>
                <p>This site is within its expected operating range.</p>
              </div>
            )}
          </div>
          <p className="events-note">
            Acknowledgement is local to this demo and does not clear the
            underlying condition.
          </p>
        </section>
      )}
    </>
  );
}
export function WeatherCard({
  minute,
  scenario,
  siteId,
}: {
  minute: number;
  scenario: Scenario;
  siteId: string;
}) {
  const w = weather(siteId, minute, scenario);
  return (
    <section className="surface weather-panel">
      <div className="panel-heading">
        <div>
          <h2>Site weather</h2>
          <p>Synthetic · {timeLabel(minute)} PHT</p>
        </div>
        <CloudSun size={20} />
      </div>
      <div className="weather-hero">
        <Sun size={45} strokeWidth={1.3} />
        <div>
          <strong>
            {fmt(w.ambient, 1)}
            <span>°C</span>
          </strong>
          <p>{w.cloud}</p>
        </div>
      </div>
      <div className="weather-values">
        <div>
          <Sun size={15} />
          <span>POA irradiance</span>
          <strong>
            {fmt(w.irradiance, 0)} <small>W/m²</small>
          </strong>
        </div>
        <div>
          <Wind size={15} />
          <span>Wind speed</span>
          <strong>
            {fmt(w.wind, 1)} <small>m/s</small>
          </strong>
        </div>
        <div>
          <Droplets size={15} />
          <span>Rainfall</span>
          <strong>
            {fmt(w.rain, 1)} <small>mm/h</small>
          </strong>
        </div>
      </div>
      <div className="weather-note">
        Weather follows the simulation timeline.{" "}
        {scenario === "typhoon"
          ? "Fictional exposure scenario; not an official warning."
          : "No external weather feed is connected."}
      </div>
    </section>
  );
}
