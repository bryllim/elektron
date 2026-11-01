"use client";
import { fmt } from "@/lib/simulation";
import AnimatedValue from "./AnimatedValue";
export default function UtilizationGauge({ value }: { value: number | null }) {
  const percent = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      className="utilization-gauge"
      role="img"
      aria-label={`AC utilization: ${value === null ? "Unknown" : `${fmt(value, 1)} percent`}`}
    >
      <svg viewBox="0 0 120 100" aria-hidden="true">
        <path
          d="M20.4 79.6 A48 48 0 1 1 99.6 79.6"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".2"
          strokeDasharray="1 5"
        />
        <path
          d="M27.2 74 A40 40 0 1 1 92.8 74"
          className="gauge-track"
          pathLength="100"
        />
        <path
          d="M27.2 74 A40 40 0 1 1 92.8 74"
          className="gauge-value"
          pathLength="100"
          strokeDasharray={`${percent} 100`}
        />
        <text x="18" y="92" className="gauge-tick">
          0
        </text>
        <text x="102" y="92" textAnchor="end" className="gauge-tick">
          100
        </text>
      </svg>
      <div>
        <strong>
          <AnimatedValue value={value === null ? "—" : fmt(value, 1)} />
          <small>%</small>
        </strong>
        <span>AC UTILIZATION</span>
      </div>
    </div>
  );
}
