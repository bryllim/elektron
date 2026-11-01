"use client";
import { useMemo, useState } from "react";
import {
  FlaskConical,
  ArrowRight,
  RotateCcw,
  Check,
  TriangleAlert,
} from "lucide-react";
import {
  ASSETS,
  Branch,
  Scenario,
  fmt,
  whatIf,
  timeLabel,
} from "@/lib/simulation";
import Chart from "./Chart";
export default function SimulationModal({
  minute,
  scenario,
  initial,
}: {
  minute: number;
  scenario: Scenario;
  initial?: Branch;
}) {
  const [kind, setKind] = useState<Branch["kind"]>(initial?.kind ?? "outage"),
    [assetId, setAsset] = useState(initial?.assetId ?? "INV-07"),
    [duration, setDuration] = useState(initial?.duration ?? 30),
    [reduction, setReduction] = useState(initial?.reduction ?? 30),
    [branch, setBranch] = useState<Branch | null>(initial ?? null);
  const result = useMemo(
    () => (branch ? whatIf("silangan", minute, scenario, branch) : null),
    [branch, minute, scenario],
  );
  return (
    <div className="simulation-modal">
      <div className="modal-symbol">
        <FlaskConical size={23} />
      </div>
      <span className="eyebrow">ISOLATED SIMULATION BRANCH</span>
      <h2>What-if scenario analysis</h2>
      <p>
        Silangan Solar · Evaluate an isolated change against the frozen
        baseline.
      </p>
      <div className="segmented">
        <button
          className={kind === "outage" ? "active" : ""}
          onClick={() => setKind("outage")}
        >
          Inverter outage
        </button>
        <button
          className={kind === "irradiance" ? "active" : ""}
          onClick={() => setKind("irradiance")}
        >
          Reduced irradiance
        </button>
      </div>
      <div className="simulation-fields">
        {kind === "outage" ? (
          <label>
            Affected equipment
            <select value={assetId} onChange={(e) => setAsset(e.target.value)}>
              {ASSETS.map((a) => (
                <option key={a.id}>{a.id}</option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Irradiance reduction
            <select
              value={reduction}
              onChange={(e) => setReduction(+e.target.value)}
            >
              {[10, 20, 30, 50, 75].map((n) => (
                <option key={n} value={n}>
                  {n}% reduction
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Duration
          <select
            value={duration}
            onChange={(e) => setDuration(+e.target.value)}
          >
            {[15, 30, 60, 90, 120, 180].map((n) => (
              <option key={n} value={n}>
                {n} minutes
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        className="button primary full"
        onClick={() => setBranch({ kind, assetId, duration, reduction })}
      >
        <FlaskConical size={15} />{" "}
        {branch ? "Recalculate branch" : "Run what-if simulation"}
        <ArrowRight size={15} />
      </button>
      {result && (
        <div className="branch-result">
          <div className="branch-status">
            <span className="status-pill blue">
              <i /> Branch · {timeLabel(minute)}–
              {timeLabel(minute + result.branch.duration)}
            </span>
            <button className="text-button" onClick={() => setBranch(null)}>
              <RotateCcw size={12} /> Discard
            </button>
          </div>
          {!result.complete ? (
            <div className="provider-notice">
              <TriangleAlert size={15} /> Incomplete baseline telemetry. Energy
              totals are unknown.
            </div>
          ) : (
            <div className="branch-stats">
              <div>
                <span>Baseline energy</span>
                <strong>
                  {fmt(result.baseline, 3)}
                  <small> MWh</small>
                </strong>
              </div>
              <div>
                <span>Scenario energy</span>
                <strong>
                  {fmt(result.alternative, 3)}
                  <small> MWh</small>
                </strong>
              </div>
              <div>
                <span>Estimated difference</span>
                <strong className="warning-text">
                  −{fmt(result.difference, 3)}
                  <small> MWh</small>
                </strong>
              </div>
            </div>
          )}
          <Chart
            points={result.points}
            height={140}
            color="#cba879"
            actualLabel="What-if"
            expectedLabel="Baseline"
          />
          <div className="chart-legend">
            <span>
              <i className="legend-line amber-line" /> What-if output
            </span>
            <span>
              <i className="legend-line dashed" /> Preserved baseline
            </span>
          </div>
          <div className="branch-assumptions">
            <strong>Assumptions & limitations</strong>
            <p>
              {result.branch.kind === "outage"
                ? `${result.branch.assetId} output is removed for the full interval, with no compensating dispatch.`
                : `Output is scaled by a ${result.branch.reduction}% reduction in POA irradiance, holding temperature and efficiency constant.`}{" "}
              Synthetic weather and current derating continue. Energy uses
              1-minute trapezoidal integration. This is a simplified simulation,
              not a validated forecast.
            </p>
          </div>
        </div>
      )}
      <div className="simulation-note">
        <Check size={13} /> Baseline measurements remain unchanged.
      </div>
    </div>
  );
}
