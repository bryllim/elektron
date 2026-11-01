"use client";
import { Satellite, ChevronLeft, ChevronRight, X } from "lucide-react";
import { stormState, stormField, satelliteFrameMinute } from "@/lib/typhoon";
import { SITES, siteMeasurement, timeLabel, fmt } from "@/lib/simulation";
import type { SatelliteBand } from "./SatelliteLayer";
export default function TyphoonPanel({
  minute,
  band,
  onBand,
  onTime,
  onExit,
  onSelect,
}: {
  minute: number;
  band: SatelliteBand;
  onBand: (band: SatelliteBand) => void;
  onTime: (minute: number) => void;
  onExit: () => void;
  onSelect: (id: string) => void;
}) {
  const frame = satelliteFrameMinute(minute),
    eye = stormState(frame);
  const exposed = SITES.filter((s) => s.technology !== "Storage")
    .map((s) => ({
      ...s,
      ...stormField(s.lon, s.lat, minute),
      power: siteMeasurement(s.id, minute, "typhoon").actual,
    }))
    .sort((a, b) => b.wind - a.wind)
    .slice(0, 3);
  return (
    <section
      className="storm-console surface"
      aria-label="Typhoon simulation and synthetic satellite data"
    >
      <header>
        <div className="storm-title">
          <Satellite size={19} />
          <div>
            <span className="eyebrow">SYNTHETIC SATELLITE / SIM-01</span>
            <h2>Typhoon exposure</h2>
          </div>
          <span className="storm-sim-label">SIMULATED</span>
        </div>
        <button
          className="icon-button"
          aria-label="Exit typhoon simulation"
          onClick={onExit}
        >
          <X size={16} />
        </button>
      </header>
      <div className="storm-summary">
        <div>
          <span>Storm intensity</span>
          <strong>
            {fmt(eye.wind, 1)} <small>m/s</small>
          </strong>
          <small>Modeled peak sustained wind</small>
        </div>
        <div>
          <span>Central pressure</span>
          <strong>
            {fmt(eye.pressure, 0)} <small>hPa</small>
          </strong>
          <small>Synthetic storm profile</small>
        </div>
        <div>
          <span>Eye position</span>
          <strong>{fmt(eye.lat, 2)}° N</strong>
          <small>{fmt(eye.lon, 2)}° E · west-northwest</small>
        </div>
        <div>
          <span>Satellite frame</span>
          <strong>
            {timeLabel(frame)} <small>PHT</small>
          </strong>
          <small>15-minute synthetic cadence</small>
        </div>
      </div>
      <div className="storm-controls">
        <div role="group" aria-label="Satellite display band">
          <button
            aria-pressed={band === "infrared"}
            onClick={() => onBand("infrared")}
          >
            Infrared cloud tops
          </button>
          <button aria-pressed={band === "wind"} onClick={() => onBand("wind")}>
            Surface wind field
          </button>
        </div>
        <div className="storm-frame-controls">
          <button
            aria-label="Previous satellite frame"
            disabled={frame <= 0}
            onClick={() => onTime(Math.max(0, frame - 15))}
          >
            <ChevronLeft size={14} />
          </button>
          <span>{timeLabel(frame)} / 30 OCT</span>
          <button
            aria-label="Next satellite frame"
            disabled={frame >= 1425}
            onClick={() => onTime(Math.min(1439, frame + 15))}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="storm-exposure">
        {exposed.map((s) => (
          <button key={s.id} onClick={() => onSelect(s.id)}>
            <span>
              {s.name}
              <small>
                {s.technology === "Wind" && s.wind >= 25
                  ? "TURBINES PARKED"
                  : s.technology === "Solar" && s.cloud > 0.4
                    ? "REDUCED SOLAR INPUT"
                    : "MODELED EXPOSURE"}
              </small>
            </span>
            <span>
              {fmt(s.wind, 1)} m/s
              <small>
                {fmt(s.rain, 1)} mm/h · {fmt(s.power)} MW
              </small>
            </span>
          </button>
        ))}
      </div>
      <footer>
        Generated satellite-style data, not observations or an official
        forecast. Replay moves the storm and updates local plant output. Frame
        held for 15 minutes; site readings follow the replay clock.
      </footer>
    </section>
  );
}
