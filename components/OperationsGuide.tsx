"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Activity, Check, Link2 } from "lucide-react";
import { DEMO_CASES } from "@/lib/operations";

export default function OperationsGuide({
  onLaunch,
}: {
  onLaunch: (id: string) => void;
}) {
  const [status, setStatus] = useState<{
    configured: boolean;
    model: string;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/agent", { signal: controller.signal })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return (
    <div className="operations-guide">
      <span className="eyebrow">
        <Activity size={13} /> ELEKTRON / OPERATIONS PLAYBOOK
      </span>
      <h2>
        Less time finding the problem.
        <br />
        <span>More confidence in the next step.</span>
      </h2>
      <p>
        For renewable fleet operators juggling weather, alarms and equipment
        data. Investigate a change in generation, locate its cause in the twin,
        and test an isolated response before preparing a shift handover.
      </p>
      <ol className="guide-workflow">
        {[
          "Detect a deviation",
          "Verify the evidence",
          "Test a response",
          "Hand over findings",
        ].map((step, i) => (
          <li key={step}>
            <span>0{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <div className="guide-cases">
        {DEMO_CASES.map((c) => (
          <button key={c.id} onClick={() => onLaunch(c.id)}>
            <span className="guide-case-label">
              <span>
                {c.number} / {c.label}
              </span>
              <ArrowUpRight size={17} />
            </span>
            <strong>{c.title}</strong>
            <p>{c.description}</p>
            <small>{c.proof}</small>
          </button>
        ))}
      </div>
      <div className="guide-model">
        <Link2 size={19} />
        <div>
          <strong>Meta Muse · evidence-driven investigation</strong>
          <p>
            Muse selects validated tools to inspect telemetry, compare peers,
            check weather, focus the 3D twin and calculate a what-if. Every
            finding can be traced to its source snapshot.
          </p>
        </div>
        <span className={status?.configured ? "positive" : "muted"}>
          {status ? (
            status.configured ? (
              <>
                <Check size={12} /> Key configured · inference verified per
                answer
              </>
            ) : (
              "Demo mode · Meta key not configured"
            )
          ) : (
            "Checking connection…"
          )}
        </span>
      </div>
      <p className="guide-note">
        Cases load a paused, reproducible snapshot. All plants and weather are
        simulated. The model investigates; it cannot control physical equipment.
      </p>
    </div>
  );
}
