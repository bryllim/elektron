"use client";
import { useState } from "react";
import {
  CloudRain,
  Radio,
  Thermometer,
  ArrowRight,
} from "lucide-react";
import Chart from "./Chart";
import type { StoryCase } from "@/lib/story-cases";

export default function StoryInvestigation({ cases }: { cases: StoryCase[] }) {
  const [index, setIndex] = useState(0);
  const current = cases[index];
  const icons = [Thermometer, CloudRain, Radio];
  return (
    <div className="story-investigation">
      <div
        className="story-case-switch"
        role="group"
        aria-label="Choose an anomaly explanation"
      >
        {cases.map((item, i) => {
          const Icon = icons[i];
          return (
            <button
              key={item.id}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
            >
              <Icon size={16} strokeWidth={1.5} />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="story-case-content" key={current.id}>
        <div className="story-case-explanation" aria-live="polite">
          <span className="story-kicker">
            Read the evidence
          </span>
          <h3>{current.heading.replace(/\.$/, "")}</h3>
          <p>{current.explanation}</p>
          <div className="story-decision">
            <span>Next step</span>
            <strong>{current.finding}</strong>
            <p>{current.next}</p>
          </div>
          <a href={`/workspace?case=${current.id}`} className="story-text-link">
            Open this investigation <ArrowRight size={16} strokeWidth={1.5} />
          </a>
        </div>
        <div className="story-evidence-panel">
          <div className="story-plot-heading">
            <span>
              Silangan Solar / {current.asset}
            </span>
            <span>Simulated · 13:42 PHT</span>
          </div>
          <div className="story-readings">
            <div>
              <span>Actual power</span>
              <strong>
                {current.reading.actual === null
                  ? "Unknown"
                  : Math.round(current.reading.actual)}
                {current.reading.actual !== null && <small> kW</small>}
              </strong>
            </div>
            <div>
              <span>Expected in this weather</span>
              <strong>
                {Math.round(current.reading.expected)}
                <small> kW</small>
              </strong>
            </div>
          </div>
          <Chart
            points={current.points}
            height={200}
            unit="kW"
            color="#7a9bff"
            actualLabel="Simulated output"
            expectedLabel="Weather-adjusted"
          />
          <div className="story-plot-legend">
            <span>
              <i />
              Actual
            </span>
            <span>
              <i />
              Expected
            </span>
            <span>Last 60 minutes</span>
          </div>
          <p className="story-evidence-limit">{current.limit}</p>
          <small className="story-unit-note">
            kW describes the rate of power production. Energy is that power
            accumulated over time.
          </small>
        </div>
      </div>
    </div>
  );
}
