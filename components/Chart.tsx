"use client";
import { useEffect, useId, useRef, useState } from "react";
import { fmt, timeLabel } from "@/lib/simulation";
import { chartScale, chartSegments } from "@/lib/chart-geometry";
export type Point = {
  minute: number;
  actual: number | null;
  expected?: number | null;
};
export default function Chart({
  points,
  height = 180,
  unit = "MW",
  color = "#a7c99c",
  expected = true,
  compact = false,
  actualLabel = "Actual",
  expectedLabel = "Expected",
  markers = [],
}: {
  points: Point[];
  height?: number;
  unit?: string;
  color?: string;
  expected?: boolean;
  compact?: boolean;
  actualLabel?: string;
  expectedLabel?: string;
  markers?: { minute: number; label: string }[];
}) {
  const id = useId().replace(/:/g, "");
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 400, height });
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height: measuredHeight } = entry.contentRect;
      if (width > 0 && measuredHeight > 0)
        setSize({ width, height: measuredHeight });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const W = size.width,
    H = size.height;
  const L = compact ? 3 : 36,
    R = compact ? 3 : 12,
    T = compact ? 4 : 14,
    B = compact ? 4 : 23;
  const scale = chartScale(
    points.flatMap((p) =>
      [p.actual, ...(expected ? [p.expected] : [])].filter(
        (v): v is number => v != null,
      ),
    ),
    H < 120 ? 2 : 4,
  );
  const firstMinute = points[0]?.minute ?? 0;
  const span = (points.at(-1)?.minute ?? firstMinute) - firstMinute;
  const x = (i: number) =>
    L + (span ? (points[i].minute - firstMinute) / span : 0.5) * (W - L - R);
  const y = (v: number) =>
    H - B - ((v - scale.min) / (scale.max - scale.min)) * (H - T - B);
  const segments = (key: "actual" | "expected") =>
    chartSegments(points, (p) => p[key]);
  const line = (
    segment: ReturnType<typeof segments>[number],
    key: "actual" | "expected",
  ) =>
    segment
      .map(
        ({ point, index }, i) =>
          `${i ? "L" : "M"}${x(index).toFixed(2)},${y(point[key]!).toFixed(2)}`,
      )
      .join(" ");
  const actualSegments = segments("actual");
  const active = hover === null ? null : Math.min(hover, points.length - 1);
  const point = active === null ? undefined : points[active];
  const latest = points.at(-1);
  const delta =
    point?.actual != null && point.expected != null
      ? point.actual - point.expected
      : null;
  // The tick count depends on actual available width, not a stretched SVG canvas.
  const tickCount = W < 320 ? 3 : 5;
  function inspect(clientX: number) {
    const box = container.current?.getBoundingClientRect();
    if (!box || !points.length) return;
    const fraction = Math.max(
      0,
      Math.min(1, (clientX - box.left - L) / (W - L - R)),
    );
    const target = firstMinute + fraction * span;
    let nearest = 0;
    points.forEach((p, i) => {
      if (
        Math.abs(p.minute - target) < Math.abs(points[nearest].minute - target)
      )
        nearest = i;
    });
    setHover(nearest);
  }
  return (
    <div
      ref={container}
      className={`chart precision-chart ${compact ? "compact" : ""}`}
      style={{ height, "--chart-color": color } as React.CSSProperties}
      role={compact ? undefined : "group"}
      tabIndex={compact || !points.length ? undefined : 0}
      aria-label={
        compact
          ? undefined
          : `${unit} output chart. Use left and right arrow keys to inspect readings.`
      }
      onFocus={() => {
        if (!compact && points.length) setHover(points.length - 1);
      }}
      onBlur={() => setHover(null)}
      onKeyDown={(e) => {
        if (
          !["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(e.key)
        )
          return;
        e.preventDefault();
        if (e.key === "Escape") {
          setHover(null);
          return;
        }
        setHover((i) =>
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? points.length - 1
              : Math.max(
                  0,
                  Math.min(
                    points.length - 1,
                    (i ?? points.length - 1) +
                      (e.key === "ArrowRight" ? 1 : -1),
                  ),
                ),
        );
      }}
      onPointerMove={compact ? undefined : (e) => inspect(e.clientX)}
      onPointerDown={compact ? undefined : (e) => inspect(e.clientX)}
      onPointerLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Output trend in ${unit}. Latest ${actualLabel.toLowerCase()} ${fmt(latest?.actual ?? null)} ${unit}${expected ? `; ${expectedLabel.toLowerCase()} ${fmt(latest?.expected ?? null)} ${unit}` : ""}.`}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".23" />
            <stop offset="1" stopColor={color} stopOpacity=".015" />
          </linearGradient>
          <pattern
            id={`${id}-gap`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(35)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="currentColor"
              strokeOpacity=".08"
            />
          </pattern>
          <clipPath id={`${id}-clip`}>
            <rect
              x={L - 2}
              y={T - 5}
              width={Math.max(1, W - L - R + 7)}
              height={Math.max(1, H - T - B + 10)}
            />
          </clipPath>
        </defs>
        {!compact && (
          <g className="chart-grid">
            {scale.ticks.map((v) => (
              <g key={v}>
                <line
                  x1={L}
                  x2={W - R}
                  y1={y(v)}
                  y2={y(v)}
                  className={v === 0 ? "chart-zero" : ""}
                />
                <text
                  x={L - 8}
                  y={y(v) + 3}
                  textAnchor="end"
                  className="axis-text"
                >
                  {fmt(v, scale.decimals)}
                </text>
              </g>
            ))}
            {[
              ...new Set(
                Array.from({ length: tickCount }, (_, i) =>
                  Math.round(((points.length - 1) * i) / (tickCount - 1)),
                ),
              ),
            ].map((index, i, indices) => {
              return points[index] ? (
                <g key={i}>
                  <line
                    x1={x(index)}
                    x2={x(index)}
                    y1={T}
                    y2={H - B}
                    className="chart-grid-vertical"
                  />
                  <text
                    x={x(index)}
                    y={H - 5}
                    textAnchor={
                      i === 0
                        ? "start"
                        : i === indices.length - 1
                          ? "end"
                          : "middle"
                    }
                    className="axis-text"
                  >
                    {timeLabel(points[index].minute)}
                  </text>
                </g>
              ) : null;
            })}
          </g>
        )}
        {!compact &&
          span > 0 &&
          markers
            .filter(
              (m) => m.minute >= firstMinute && m.minute <= firstMinute + span,
            )
            .map((m) => {
              const mx = L + ((m.minute - firstMinute) / span) * (W - L - R);
              return (
                <g key={`${m.minute}-${m.label}`} className="chart-event">
                  <title>
                    {`${m.label} · ${timeLabel(m.minute)} PHT`}
                  </title>
                  <line x1={mx} x2={mx} y1={T + 4} y2={H - B} />
                  <path
                    d={`M${mx - 3},${T - 5}L${mx + 3},${T - 5}L${mx},${T}Z`}
                  />
                  {H >= 160 && (
                    <text
                      x={mx > W - 100 ? mx - 7 : mx + 7}
                      y={T + 2}
                      textAnchor={mx > W - 100 ? "end" : "start"}
                    >
                      {m.label}
                    </text>
                  )}
                </g>
              );
            })}
        <g clipPath={`url(#${id}-clip)`} className="chart-plot">
          {chartSegments(points, (p) => (p.actual === null ? 1 : null)).map(
            (segment, i) => (
              <rect
                key={`gap-${i}`}
                x={x(segment[0].index)}
                y={T}
                width={Math.max(
                  2,
                  x(segment.at(-1)!.index) - x(segment[0].index),
                )}
                height={H - T - B}
                fill={`url(#${id}-gap)`}
              />
            ),
          )}
          {actualSegments.map((s, i) => (
            <path
              key={`area-${i}`}
              d={`${line(s, "actual")} L${x(s.at(-1)!.index)},${y(0)} L${x(s[0].index)},${y(0)} Z`}
              fill={`url(#${id}-fill)`}
            />
          ))}
          {expected &&
            segments("expected").map((s, i) => (
              <path
                key={`expected-${i}`}
                className="chart-expected"
                d={line(s, "expected")}
              />
            ))}
          {actualSegments.map((s, i) => (
            <path
              key={`actual-${i}`}
              className="chart-actual"
              d={line(s, "actual")}
              stroke={color}
            />
          ))}
          {latest?.actual != null && hover === null && (
            <g className="chart-endpoint">
              <circle
                cx={x(points.length - 1)}
                cy={y(latest.actual)}
                r={compact ? 2 : 7}
                fill={color}
                opacity=".13"
              />
              <circle
                cx={x(points.length - 1)}
                cy={y(latest.actual)}
                r={compact ? 1.5 : 2.8}
                fill={color}
              />
            </g>
          )}
          {point && active !== null && (
            <g className="chart-cursor">
              <line
                x1={x(active)}
                x2={x(active)}
                y1={T}
                y2={H - B}
                stroke={color}
                strokeDasharray="3 4"
                opacity=".55"
              />
              {expected && point.expected != null && (
                <circle
                  cx={x(active)}
                  cy={y(point.expected)}
                  r="3"
                  fill="#a5aca5"
                  stroke="#1a201b"
                  strokeWidth="2"
                />
              )}
              {point.actual !== null && (
                <>
                  <circle
                    cx={x(active)}
                    cy={y(point.actual)}
                    r="8"
                    fill={color}
                    opacity=".15"
                  />
                  <circle
                    cx={x(active)}
                    cy={y(point.actual)}
                    r="3.5"
                    fill={color}
                    stroke="#171e18"
                    strokeWidth="2"
                  />
                </>
              )}
            </g>
          )}
        </g>
        {!points.length && (
          <text x={W / 2} y={H / 2} textAnchor="middle" className="axis-text">
            No samples in this interval
          </text>
        )}
      </svg>
      {point && active !== null && !compact && (
        <div
          className={`chart-tooltip precision-tooltip ${x(active) > W / 2 ? "align-left" : "align-right"}`}
          style={{ left: Math.max(8, Math.min(W - 8, x(active))) }}
        >
          <div className="tooltip-time">
            {timeLabel(point.minute)} <span>PHT · SIMULATED</span>
          </div>
          <div>
            <span>
              <i style={{ background: color }} />
              {actualLabel}
            </span>
            <strong>
              {point.actual === null
                ? "No telemetry"
                : `${fmt(point.actual)} ${unit}`}
            </strong>
          </div>
          {expected && (
            <div>
              <span>
                <i className="expected-key" />
                {expectedLabel}
              </span>
              <strong>
                {point.expected == null
                  ? "—"
                  : `${fmt(point.expected)} ${unit}`}
              </strong>
            </div>
          )}
          {expected && delta !== null && (
            <div className="tooltip-delta">
              <span>Difference</span>
              <strong>
                {delta > 0 ? "+" : ""}
                {fmt(delta)} {unit}
              </strong>
            </div>
          )}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {point
          ? `${timeLabel(point.minute)}. ${actualLabel}: ${point.actual === null ? "No telemetry" : `${fmt(point.actual)} ${unit}`}.`
          : ""}
      </span>
    </div>
  );
}
