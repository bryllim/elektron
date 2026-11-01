"use client";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Wind,
  Sun,
  Flame,
  Droplets,
  BatteryCharging,
  ChevronDown,
  MapPin,
  CloudSun,
  TriangleAlert,
  Activity,
  Layers3,
  Maximize2,
} from "lucide-react";
import {
  SITES,
  TECH_COLORS,
  Scenario,
  fleetMeasurement,
  fleetEnergy,
  fmt,
  series,
  Technology,
  alarms,
  siteMeasurement,
} from "@/lib/simulation";
import Chart from "./Chart";
import GenerationMix from "./GenerationMix";
import AnimatedValue from "./AnimatedValue";
import FleetMap from "./FleetMap";
import TyphoonPanel from "./TyphoonPanel";
import OperationsBrief from "./OperationsBrief";
import type { SatelliteBand } from "./SatelliteLayer";
export const TechIcon = ({
  tech,
  size = 16,
}: {
  tech: Technology;
  size?: number;
}) => {
  const I = {
    Wind,
    Solar: Sun,
    Geothermal: Flame,
    Storage: BatteryCharging,
    Hydro: Droplets,
  }[tech];
  return <I size={size} />;
};
export default function FleetOverview({
  minute,
  scenario,
  onSelect,
  onAgent,
  range,
  onScenario,
  onTime,
  onCases,
}: {
  onCases: () => void;
  minute: number;
  scenario: Scenario;
  onSelect: (id: string) => void;
  onAgent: (q?: string) => void;
  range: number;
  onScenario: (scenario: Scenario) => void;
  onTime: (minute: number) => void;
}) {
  const [satelliteBand, setSatelliteBand] = useState<SatelliteBand>("infrared");
  const [region, setRegion] = useState("All regions");
  const [filter, setFilter] = useState("All technologies");
  const [mapFull, setMapFull] = useState(false);
  const fleet = fleetMeasurement(minute, scenario);
  const alarm = alarms(minute, scenario);
  const parked = fleet.sites.filter((s) => s.status === "Wind cut-out").length;
  const energy = useMemo(
    () => fleetEnergy(minute, scenario),
    [minute, scenario],
  );
  const mix = Object.entries(TECH_COLORS)
    .filter(([t]) => t !== "Storage")
    .map(([technology, color]) => ({
      technology,
      color,
      value: fleet.sites
        .filter((s) => s.technology === technology)
        .reduce((v, s) => v + (s.actual ?? 0), 0),
    }));
  const total = mix.reduce((n, m) => n + m.value, 0);
  const listed = fleet.sites.filter(
    (s) =>
      (region === "All regions" || s.region === region) &&
      (filter === "All technologies" || s.technology === filter),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="tiny-dot green" /> SITUATIONAL OVERVIEW /
            PHILIPPINES
          </div>
          <h1>Fleet operations</h1>
          <p>136 MW generation · 8 MW storage · 3 island groups</p>
        </div>
        <div className="fleet-heading-actions">
          <button
            className={`button ${scenario === "typhoon" ? "active" : ""}`}
            onClick={() =>
              onScenario(scenario === "typhoon" ? "normal" : "typhoon")
            }
          >
            <CloudSun size={15} />
            {scenario === "typhoon" ? "Exit typhoon" : "Typhoon simulation"}
          </button>
          <button
            className="button white"
            onClick={() => onAgent("Which sites need attention?")}
          >
            <Activity size={15} /> Investigate fleet <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      <OperationsBrief
        minute={minute}
        scenario={scenario}
        onAgent={onAgent}
        onCases={onCases}
      />
      <div className="stat-row">
        <Stat
          title="Fleet generation"
          value={fmt(fleet.generation)}
          unit="MW"
          icon={<Activity size={16} />}
        >
          <span className="positive">
            {fmt((total / fleet.capacity) * 100, 1)}%
          </span>{" "}
          of {fleet.capacity} MW installed
        </Stat>
        <Stat
          title="Net fleet export"
          value={fmt(fleet.net)}
          unit="MW"
          icon={<ArrowUpRight size={16} />}
        >
          <span className="status-dot" /> Includes storage dispatch
        </Stat>
        <Stat
          title="Energy today"
          value={fmt(energy, 1)}
          unit="MWh"
          icon={<Sun size={16} />}
        >
          <span className="muted">
            {fleet.reporting < 8 ? "Partial · " : ""}00:00 –{" "}
            {Math.floor(minute / 60)
              .toString()
              .padStart(2, "0")}
            :
            {Math.round(minute % 60)
              .toString()
              .padStart(2, "0")}{" "}
            PHT
          </span>
        </Stat>
        <Stat
          title="Sites reporting"
          value={`${fleet.reporting}`}
          unit={`/ ${SITES.length}`}
          icon={<Layers3 size={16} />}
        >
          <span
            className={alarm.length || parked ? "warning-text" : "positive"}
          >
            {alarm.length
              ? `${alarm.length} active warning`
              : parked
                ? `${parked} wind site parked`
                : "No active controller warnings"}
          </span>
          <span className="muted"> · 0 critical</span>
        </Stat>
      </div>
      <div
        className={`fleet-grid ${mapFull ? "map-expanded" : ""} ${scenario === "typhoon" ? "typhoon-active" : ""}`}
      >
        <section className="surface map-panel">
          <div className="panel-heading">
            <div>
              <h2>
                {scenario === "typhoon"
                  ? "Satellite overview"
                  : "Geospatial overview"}{" "}
                <span className="count">8 sites</span>
              </h2>
              <p>
                {scenario === "typhoon"
                  ? "Synthetic storm field · Solid: replayed track · Dashed: scenario path"
                  : "Philippines · WGS 84 · Logical fleet topology"}
              </p>
            </div>
            <div className="inline-actions">
              <select
                aria-label="Filter map by region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option>All regions</option>
                <option>Luzon</option>
                <option>Visayas</option>
                <option>Mindanao</option>
              </select>
              <button
                className="icon-button"
                aria-label={mapFull ? "Restore map size" : "Expand map"}
                onClick={() => setMapFull(!mapFull)}
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>
          <FleetMap
            minute={minute}
            scenario={scenario}
            onSelect={onSelect}
            region={region}
            satelliteBand={satelliteBand}
          />
          <div className="map-bottom">
            <div>
              <span className="tiny-dot green" /> Operational{" "}
              <span className="tiny-dot amber" /> Needs attention
            </div>
            <span>
              Select facility to inspect <ArrowUpRight size={12} />
            </span>
          </div>
        </section>
        <div className="fleet-right">
          {scenario === "typhoon" && (
            <TyphoonPanel
              minute={minute}
              band={satelliteBand}
              onBand={setSatelliteBand}
              onTime={onTime}
              onExit={() => onScenario("normal")}
              onSelect={onSelect}
            />
          )}

          <section className="surface mix-panel">
            <div className="panel-heading">
              <div>
                <h2>Generation mix</h2>
                <p>
                  Instantaneous output · {Math.floor(minute / 60)}:
                  {Math.round(minute % 60)
                    .toString()
                    .padStart(2, "0")}{" "}
                  PHT
                </p>
              </div>
              <span className="small-tag">MW</span>
            </div>
            <GenerationMix mix={mix} complete={fleet.generation !== null} />
            <div className="storage-strip">
              <BatteryCharging size={16} />
              <span>Isla Storage</span>
              <strong>
                {fmt(fleet.sites.find((s) => s.id === "isla")!.actual, 1)} MW
              </strong>
              <span className="positive">
                {(fleet.sites.find((s) => s.id === "isla")!.actual ?? 0) >= 0
                  ? "Discharging"
                  : "Charging"}
              </span>
            </div>
          </section>
          <section className="surface fleet-output">
            <div className="panel-heading">
              <div>
                <h2>Fleet output</h2>
                <p>
                  Generation over the last{" "}
                  {range === 1440
                    ? "24 hours"
                    : range === 360
                      ? "6 hours"
                      : "hour"}
                </p>
              </div>
              <span className="small-tag">MW</span>
            </div>
            <Chart
              points={series(
                "fleet",
                Math.max(0, minute - range),
                minute,
                scenario,
              )}
              height={156}
            />
            <div className="chart-legend">
              <span>
                <i className="legend-line blue" /> Actual generation
              </span>
              <span>
                <i className="legend-line dashed" /> Expected
              </span>
            </div>
          </section>
          <section
            className={`attention-banner ${alarm.length ? "" : "healthy"}`}
          >
            <div className="attention-icon">
              {alarm.length ? (
                <TriangleAlert size={19} />
              ) : (
                <CloudSun size={19} />
              )}
            </div>
            <div>
              <h3>
                {alarm.length
                  ? "Active operational alert"
                  : "Fleet operating normally"}
              </h3>
              <p>
                {alarm.length
                  ? `Silangan Solar · ${alarm[0]?.assetId} ${scenario === "telemetry" ? "communication lost" : "underperformance"}`
                  : "All sites within their expected operating range."}
              </p>
            </div>
            <button
              className="icon-button"
              aria-label="Investigate fleet conditions"
              onClick={() => onAgent("Which sites need attention?")}
            >
              <ArrowUpRight size={19} />
            </button>
          </section>
        </div>
      </div>
      <section className="surface sites-section">
        <div className="panel-heading">
          <div>
            <h2>
              Asset register <span className="count">{listed.length}</span>
            </h2>
            <p>Reporting facilities · Select a site to inspect equipment</p>
          </div>
          <select
            aria-label="Filter sites by technology"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All technologies</option>
            {Object.keys(TECH_COLORS).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table className="sites-table">
            <thead>
              <tr>
                <th>FACILITY</th>
                <th>STATUS</th>
                <th>OUTPUT</th>
                <th>UTILIZATION</th>
                <th>LAST 6 HOURS</th>
                <th aria-label="Open site" />
              </tr>
            </thead>
            <tbody>
              {listed.map((site) => (
                <tr key={site.id} onClick={() => onSelect(site.id)}>
                  <td>
                    <div className="site-cell">
                      <span
                        className="tech-icon"
                        style={{
                          color: TECH_COLORS[site.technology],
                          background: `${TECH_COLORS[site.technology]}14`,
                        }}
                      >
                        <TechIcon tech={site.technology} />
                      </span>
                      <div>
                        <button
                          className="text-button site-name"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(site.id);
                          }}
                        >
                          {site.name}
                        </button>
                        <span>
                          {site.province} · {site.technology}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${["Attention", "Wind cut-out"].includes(site.status) ? "amber" : "green"}`}
                    >
                      <i />
                      {site.status === "Attention"
                        ? "Needs attention"
                        : site.status}
                    </span>
                  </td>
                  <td>
                    <strong className="numeric">{fmt(site.actual)}</strong>
                    <span className="cell-unit"> MW</span>
                  </td>
                  <td>
                    <div className="utilization">
                      <span>
                        {site.actual === null
                          ? "—"
                          : fmt((Math.abs(site.actual) / site.rating) * 100, 1)}
                        %
                      </span>
                      <div>
                        <i
                          style={{
                            width: `${(Math.abs(site.actual ?? 0) / site.rating) * 100}%`,
                            background: TECH_COLORS[site.technology],
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="sparkline">
                    <Chart
                      points={series(
                        site.id,
                        Math.max(0, minute - 360),
                        minute,
                        scenario,
                        30,
                      )}
                      compact
                      height={30}
                      expected={false}
                      color={TECH_COLORS[site.technology]}
                    />
                  </td>
                  <td>
                    <ArrowUpRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!listed.length && (
            <div className="empty-state">No sites match these filters.</div>
          )}
        </div>
      </section>
    </>
  );
}
export function Stat({
  title,
  value,
  unit,
  icon,
  children,
}: {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="stat">
      <div className="stat-title">
        {title}
        {icon}
      </div>
      <div className="stat-value">
        <AnimatedValue value={value} />
        <span>{unit}</span>
      </div>
      <div className="stat-foot">{children}</div>
    </section>
  );
}
