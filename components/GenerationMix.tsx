"use client";
import { useState } from "react";
import { fmt } from "@/lib/simulation";
import AnimatedValue from "./AnimatedValue";
type Slice = { technology: string; color: string; value: number };
export default function GenerationMix({
  mix,
  complete,
}: {
  mix: Slice[];
  complete: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const active = hovered ?? selected;
  const total = mix.reduce((n, m) => n + m.value, 0);
  const current = mix.find((m) => m.technology === active);
  const circumference = 2 * Math.PI * 61;
  const slices = mix.map((m, i) => ({
    ...m,
    share: total ? m.value / total : 0,
    offset:
      mix.slice(0, i).reduce((n, s) => n + (total ? s.value / total : 0), 0) *
      circumference,
  }));
  return (
    <div className="generation-mix-v2">
      <div className="generation-dial" onPointerLeave={() => setHovered(null)}>
        <svg
          viewBox="0 0 160 160"
          role="img"
          aria-label={`${complete ? "Generation mix" : "Partial generation mix, known output only"}: ${mix.map((m) => `${m.technology} ${fmt(m.value)} MW`).join(", ")}`}
        >
          <circle
            cx="80"
            cy="80"
            r="75"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".16"
            strokeDasharray="1 6.85"
          />
          <circle
            cx="80"
            cy="80"
            r="47"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".08"
            strokeWidth=".7"
          />
          <circle
            cx="80"
            cy="80"
            r="61"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".045"
            strokeWidth="13"
          />
          {slices
            .filter((m) => m.share > 0)
            .map((m) => (
              <g
                key={m.technology}
                onPointerEnter={() => setHovered(m.technology)}
                onClick={() =>
                  setSelected(selected === m.technology ? null : m.technology)
                }
                className={`mix-arc ${active && active !== m.technology ? "dimmed" : ""}`}
              >
                <circle
                  cx="80"
                  cy="80"
                  r="61"
                  fill="none"
                  stroke={m.color}
                  strokeOpacity=".1"
                  strokeWidth="25"
                  strokeDasharray={`${Math.max(0, m.share * circumference - 5)} ${circumference - Math.max(0, m.share * circumference - 5)}`}
                  strokeDashoffset={-m.offset}
                  transform="rotate(-90 80 80)"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="61"
                  fill="none"
                  stroke={m.color}
                  strokeWidth={active === m.technology ? 17 : 12}
                  strokeDasharray={`${Math.max(0, m.share * circumference - 5)} ${circumference - Math.max(0, m.share * circumference - 5)}`}
                  strokeDashoffset={-m.offset}
                  transform="rotate(-90 80 80)"
                />
              </g>
            ))}
        </svg>
        <div className="generation-dial-label">
          <span className="generation-eyebrow">
            {current?.technology ?? (complete ? "TOTAL" : "KNOWN")}
          </span>
          <strong style={{ color: current?.color }}>
            <AnimatedValue
              value={fmt(
                current ? (current.value / (total || 1)) * 100 : total,
                1,
              )}
            />
            {current && <small>%</small>}
          </strong>
          <span>
            {current
              ? `${fmt(current.value, 1)} MW`
              : `${complete ? "" : "Partial · "}MW generation`}
          </span>
        </div>
      </div>
      <div className="generation-legend">
        <div className="generation-column-head">
          <span>SOURCE</span>
          <span>
            MW <span>/ SHARE</span>
          </span>
        </div>
        {slices.map((m) => (
          <button
            key={m.technology}
            className={active === m.technology ? "active" : ""}
            aria-label={`${m.technology}: ${fmt(m.value, 1)} MW, ${fmt(m.share * 100, 1)} percent of ${complete ? "fleet" : "known"} generation`}
            aria-pressed={selected === m.technology}
            onPointerEnter={() => setHovered(m.technology)}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(m.technology)}
            onBlur={() => setHovered(null)}
            onClick={() =>
              setSelected(selected === m.technology ? null : m.technology)
            }
          >
            <span className="generation-source">
              <i style={{ background: m.color }} />
              {m.technology}
            </span>
            <span className="generation-amount">
              <strong>{fmt(m.value, 1)}</strong>
              <small>{fmt(m.share * 100, 1)}%</small>
            </span>
            <span className="generation-meter">
              <i style={{ width: `${m.share * 100}%`, background: m.color }} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
