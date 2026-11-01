"use client";
import { useEffect, useMemo, useState } from "react";
import {
  SITES,
  Scenario,
  siteMeasurement,
  fmt,
  timeLabel,
} from "@/lib/simulation";
import SatelliteLayer, { type SatelliteBand } from "./SatelliteLayer";
type Geometry = { type: string; coordinates: number[][][][] };
const offsets: Record<string, [number, number]> = {
  amihan: [20, -10],
  silangan: [-142, -12],
  bukal: [24, 9],
  habagat: [-140, -12],
  isla: [23, -10],
  sidlak: [-130, 29],
  tala: [-128, 33],
  agos: [25, 9],
};
const project = (lon: number, lat: number) => [
  (lon - 115.5) * 48,
  (21 - lat) * 32,
];
export default function FleetMap({
  minute,
  scenario,
  onSelect,
  region = "All regions",
  satelliteBand = "infrared",
}: {
  minute: number;
  scenario: Scenario;
  onSelect: (id: string) => void;
  region?: string;
  satelliteBand?: SatelliteBand;
}) {
  const [geometry, setGeometry] = useState<Geometry | null>(null),
    [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    const c = new AbortController();
    fetch("/philippines.json", { signal: c.signal })
      .then((r) => r.json())
      .then(setGeometry)
      .catch(() => {});
    return () => c.abort();
  }, []);
  const paths = useMemo(
    () =>
      geometry?.coordinates.map((poly) =>
        poly
          .map(
            (ring) =>
              ring
                .map(
                  (p, i) =>
                    `${i === 0 ? "M" : "L"}${project(p[0], p[1])
                      .map((v) => v.toFixed(2))
                      .join(",")}`,
                )
                .join(" ") + "Z",
          )
          .join(" "),
      ),
    [geometry],
  );
  const hub = project(121.08, 15.62);
  return (
    <div className="fleet-map">
      <div className="map-hud">
        <span>
          <i className="tiny-dot blue" />{" "}
          {scenario === "typhoon"
            ? "SYNTHETIC SATELLITE"
            : "REGIONAL OPERATIONS"}
        </span>
        <small>PHL / 08 ASSETS</small>
      </div>
      <svg
        viewBox={scenario === "typhoon" ? "0 0 820 550" : "0 0 660 550"}
        role="group"
        aria-label="Map of fictional Hiraya Renewables facilities in the Philippines"
      >
        <defs>
          <radialGradient id="map-glow">
            <stop stopColor="var(--map-glow)" stopOpacity=".55" />
            <stop offset="1" stopColor="var(--map-ocean)" stopOpacity="0" />
          </radialGradient>
          <filter id="site-glow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <ellipse cx="350" cy="270" rx="310" ry="270" fill="url(#map-glow)" />
        <g className="geographic-grid">
          {[5, 10, 15, 20].map((lat) => {
            const y = project(115.5, lat)[1];
            return (
              <g key={lat}>
                <path d={`M15 ${y} Q330 ${y - 22} 645 ${y}`} fill="none" />
                <text x="17" y={y - 6}>
                  {lat}°N
                </text>
              </g>
            );
          })}
          {[118, 122, 126].map((lon) => {
            const x = project(lon, 21)[0];
            return (
              <g key={lon}>
                <path d={`M${x} 20 Q${x - 16} 275 ${x} 530`} fill="none" />
                <text x={x + 5} y="532">
                  {lon}°E
                </text>
              </g>
            );
          })}
        </g>
        {paths?.map((d, i) => (
          <path key={i} d={d} className="map-land" />
        ))}
        {scenario === "typhoon" && (
          <SatelliteLayer minute={minute} band={satelliteBand} />
        )}
        <g className="network-paths" opacity={scenario === "typhoon" ? 0 : 1}>
          {SITES.filter((s) => s.id !== "silangan").map((s) => {
            const [x, y] = project(s.lon, s.lat);
            return (
              <path
                key={s.id}
                d={`M${hub[0]},${hub[1]} Q${(hub[0] + x) / 2 - 50},${(hub[1] + y) / 2} ${x},${y}`}
                fill="none"
                strokeDasharray="3 5"
              />
            );
          })}
        </g>
        <text x="422" y="163" className="map-sea">
          PHILIPPINE SEA
        </text>
        <text x="69" y="278" className="map-sea">
          WEST PHILIPPINE
        </text>
        <text x="106" y="295" className="map-sea">
          SEA
        </text>
        <text x="236" y="460" className="map-sea">
          SULU SEA
        </text>
        <text x="331" y="111" className="map-region">
          LUZON
        </text>
        <text x="304" y="329" className="map-region">
          VISAYAS
        </text>
        <text x="415" y="490" className="map-region">
          MINDANAO
        </text>
        {SITES.map((site) => {
          const [x, y] = project(site.lon, site.lat),
            [dx, dy] = offsets[site.id],
            p = siteMeasurement(site.id, minute, scenario),
            attention = p.status === "Attention" || p.status === "Wind cut-out",
            active = region === "All regions" || site.region === region;
          const color = attention ? "#d6a463" : "#7bb9ca";
          return (
            <g
              key={site.id}
              className="map-site"
              opacity={active ? 1 : 0.18}
              onMouseEnter={() => setHover(site.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(site.id)}
              role="button"
              tabIndex={0}
              aria-label={`${site.name}, ${site.province}, ${p.status}. Open site.`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(site.id);
                }
              }}
            >
              <path
                d={`M${x + (dx < 0 ? -8 : 8)} ${y} L${x + (dx < 0 ? -18 : 18)} ${y + dy - 4} L${x + dx + (dx < 0 ? 108 : -5)} ${y + dy - 4}`}
                stroke={color}
                opacity=".35"
                fill="none"
                strokeWidth=".6"
              />
              <circle
                cx={x}
                cy={y}
                r={hover === site.id ? 19 : 13}
                fill={color}
                opacity=".08"
              />
              <circle
                cx={x}
                cy={y}
                r={attention ? 15 : 9}
                stroke={color}
                strokeWidth=".7"
                opacity={attention ? 0.7 : 0.4}
                fill="none"
              />
              {attention && (
                <>
                  <circle
                    cx={x}
                    cy={y}
                    r="21"
                    fill="none"
                    stroke={color}
                    strokeWidth=".5"
                    opacity=".25"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="7"
                    fill={color}
                    filter="url(#site-glow)"
                    opacity=".4"
                  />
                </>
              )}
              <path
                d={`M${x - 3} ${y - 3}h6v6h-6z`}
                fill={color}
                transform={`rotate(45 ${x} ${y})`}
              />
              <g transform={`translate(${x + dx},${y + dy})`}>
                <rect
                  x="-7"
                  y="-14"
                  width={126}
                  height="38"
                  rx="2"
                  className={`map-label-bg ${hover === site.id ? "hovered" : ""}`}
                />
                <text className="map-site-name">{site.name}</text>
                <text
                  y="14"
                  className="map-site-reading"
                  fill={attention ? "#d6a463" : undefined}
                >
                  {fmt(p.actual, 2)} MW{" "}
                  <tspan className="map-site-state">
                    {" "}
                    /{" "}
                    {p.quality === "missing"
                      ? "NO DATA"
                      : p.status === "Wind cut-out"
                        ? "WIND CUT-OUT"
                        : p.status === "Standby"
                          ? "STANDBY"
                          : attention
                            ? "DERATING"
                            : "NOMINAL"}
                  </tspan>
                </text>
              </g>
            </g>
          );
        })}
        <g transform="translate(611 58)">
          <path d="M0 19 L5 0 L10 19 L5 14Z" fill="var(--map-muted)" />
          <text x="5" y="34" textAnchor="middle" className="map-north">
            N
          </text>
        </g>
        <g transform="translate(25 508)">
          <path
            d="M0 0v4h64v-4 M32 0v4"
            fill="none"
            stroke="var(--map-muted)"
            strokeWidth="1"
          />
          <text x="0" y="19" className="map-scale">
            0
          </text>
          <text x="43" y="19" className="map-scale">
            200 km
          </text>
        </g>
      </svg>
      {scenario === "typhoon" && (
        <div className="satellite-scale">
          <span>
            {satelliteBand === "infrared"
              ? "SIMULATED IR · CLOUD-TOP °C"
              : "SIMULATED SURFACE WIND · m/s"}
          </span>
          <i className={satelliteBand} />
          <div>
            <span>{satelliteBand === "infrared" ? "+24" : "0"}</span>
            <span>{satelliteBand === "infrared" ? "−25" : "23"}</span>
            <span>{satelliteBand === "infrared" ? "−74" : "46"}</span>
          </div>
        </div>
      )}
      <div className="map-coordinate">
        12.8797° N &nbsp; 121.7740° E <span>WGS 84</span>
      </div>
      <div className="map-attribution">
        Demo coordinates ·{" "}
        <a
          href="https://www.naturalearthdata.com/about/terms-of-use/"
          target="_blank"
          rel="noreferrer"
        >
          Natural Earth
        </a>
      </div>
    </div>
  );
}
