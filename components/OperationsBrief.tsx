"use client";
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  Radio,
  CloudSun,
  ShieldCheck,
} from "lucide-react";
import { operationalBrief } from "@/lib/operations";
import { Scenario, timeLabel } from "@/lib/simulation";

export default function OperationsBrief({
  minute,
  scenario,
  onAgent,
}: {
  minute: number;
  scenario: Scenario;
  onAgent: (q: string) => void;
}) {
  const brief = operationalBrief(minute, scenario);
  const lead = brief.findings[0];
  const flagged = brief.findings.filter((f) => f.category !== "normal").length;
  return (
    <section className="operations-brief" aria-label="Operations brief">
      <div className="brief-purpose">
        <span className="eyebrow">
          <Activity size={12} /> OPERATIONS BRIEF{" "}
          <span>{timeLabel(minute)} PHT</span>
        </span>
        <h2>
          {flagged === 0
            ? "All sites within expected output"
            : `${flagged} ${flagged === 1 ? "finding needs" : "findings need"} review`}
        </h2>
      </div>
      <div className="brief-priority">
        <div className="brief-priority-heading">
          <span className={`brief-category ${lead.category}`}>
            {lead.category === "equipment"
              ? "INVESTIGATE"
              : lead.category === "telemetry"
                ? "VERIFY DATA"
                : lead.category === "normal"
                  ? "MONITOR"
                  : "WEATHER WATCH"}
          </span>
          <span>RULE-BASED TRIAGE</span>
        </div>
        <small>{lead.site}</small>
        <h3>{lead.title}</h3>
        <p>{lead.nextStep}</p>
        <div className="brief-facts">
          <span>
            <strong>
              {lead.actualMW === null
                ? "Unknown"
                : `${lead.actualMW.toFixed(2)} MW`}
            </strong>
            Actual output
          </span>
          <span>
            <strong>{lead.expectedMW.toFixed(2)} MW</strong>Weather-adjusted
            expected
          </span>
          <button
            onClick={() =>
              onAgent(
                `Investigate ${lead.site}. ${lead.title}. Compare actual output, expected output, weather and alarms; separate observations from uncertainty.`,
              )
            }
          >
            Investigate <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      <div className="brief-signals">
        <div>
          <ShieldCheck size={15} />
          <span>Equipment flags</span>
          <strong>{brief.equipmentIssues}</strong>
        </div>
        <div>
          <Radio size={15} />
          <span>Unknown output</span>
          <strong>{brief.unknownSites}</strong>
        </div>
        <div>
          <CloudSun size={15} />
          <span>
            Weather reduction<small>vs. same-time normal scenario</small>
          </span>
          <strong>
            {brief.weatherReductionMW.toFixed(1)} <small>MW</small>
          </strong>
        </div>
      </div>
    </section>
  );
}
