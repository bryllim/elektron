"use client";
import { CloudRain } from "lucide-react";
import type { WeatherMode } from "@/lib/scene-weather";
export default function WeatherControl({
  value,
  onChange,
}: {
  value: WeatherMode;
  onChange: (v: WeatherMode) => void;
}) {
  return (
    <label className="scene-weather-control">
      <CloudRain size={13} />
      <select
        aria-label="Simulated scene weather"
        value={value}
        onChange={(e) => onChange(e.target.value as WeatherMode)}
      >
        {value === "scenario" && (
          <option value="scenario" disabled>
            Current scenario
          </option>
        )}
        <option value="clear">Clear skies</option>
        <option value="cloudy">Overcast skies</option>
        <option value="calm">Calm · 1.5 m/s</option>
        <option value="windy">Strong wind · 12 m/s</option>
        <option value="rain">Rain showers</option>
        <option value="storm">Heavy rain & wind</option>
        <option value="typhoon">Typhoon · moving storm</option>
      </select>
      <span
        className="weather-preview-label"
        title="Weather drives fleet generation, charts and exports"
      >
        LINKED
      </span>
    </label>
  );
}
