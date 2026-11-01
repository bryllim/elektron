"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Wind,
  Flame,
  MapPin,
  RotateCcw,
  Scan,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  CloudRain,
  Download,
  FlaskConical,
} from "lucide-react";
import {
  SITES,
  siteMeasurement,
  series,
  fmt,
  timeLabel,
  type Scenario,
} from "@/lib/simulation";
import {
  rotorRpm,
  sceneWeather,
  weatherModeForScenario,
  weatherScenario,
} from "@/lib/scene-weather";
import { exportMeasurements } from "@/lib/download";
import Chart from "./Chart";
import AnimatedValue from "./AnimatedValue";
import WeatherControl from "./WeatherControl";
const PlantScene = dynamic(() => import("./PlantScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">Loading sourced plant geometry…</div>
  ),
});
const THERMAL_NAMES = ["Cooling train", "Heat exchange", "Grid connection"];
export default function PlantWorkspace({
  siteId,
  minute,
  scenario,
  motion,
  onBack,
  onSimulation,
  onWeatherScenario,
}: {
  siteId: string;
  minute: number;
  scenario: Scenario;
  motion: boolean;
  onBack: () => void;
  onSimulation: () => void;
  onWeatherScenario: (scenario: Scenario) => void;
}) {
  const [sceneOnly, setSceneOnly] = useState(false);
  const [selected, setSelected] = useState(0),
    [labels, setLabels] = useState(false),
    [reset, setReset] = useState(0),
    [focus, setFocus] = useState(0);
  const weatherMode = weatherModeForScenario(scenario);
  const site = SITES.find((s) => s.id === siteId)!,
    m = siteMeasurement(siteId, minute, scenario),
    windPlant = site.technology === "Wind",
    wx = sceneWeather(siteId, minute, scenario),
    rpm = rotorRpm(wx.wind),
    count = siteId === "habagat" ? 6 : 8;
  const equipment = windPlant
    ? Array.from(
        { length: count },
        (_, i) => `WTG-${String(i + 1).padStart(2, "0")}`,
      )
    : THERMAL_NAMES;
  return (
    <div
      className={`mission-workspace multi-plant-workspace ${sceneOnly ? "scene-only" : ""}`}
    >
      <div className="mission-scene">
        <PlantScene
          siteId={siteId}
          windPlant={windPlant}
          minute={minute}
          scenario={scenario}
          motion={motion}
          selected={selected}
          onSelect={setSelected}
          labels={labels}
          reset={reset}
          focus={focus}
        />
      </div>
      <div className="mission-atmosphere" />
      <div className="mission-header">
        <div>
          <button className="mission-back" onClick={onBack}>
            <ArrowLeft size={11} /> HIRAYA / PHILIPPINE FLEET
          </button>
          <h1>
            {site.name}
            <span className="mission-site-code">
              {windPlant ? "WIND GENERATION" : "THERMAL GENERATION"}
            </span>
          </h1>
          <p>
            <MapPin size={10} /> {site.province}, {site.region}
            <span>
              {site.lat.toFixed(4)}° N · {site.lon.toFixed(4)}° E
            </span>
          </p>
        </div>
        <div className="mission-header-actions">
          <WeatherControl
            value={weatherMode}
            onChange={(mode) =>
              onWeatherScenario(weatherScenario(mode, scenario))
            }
          />
          <button
            className="button glass-button"
            aria-label="Export measurements"
            onClick={() => exportMeasurements(siteId, minute, scenario)}
          >
            <Download size={13} />
          </button>
          <button className="button glass-button" onClick={onSimulation}>
            <FlaskConical size={12} />
            What-if
          </button>
        </div>
      </div>
      <div className="mission-left">
        <section className="mission-panel system-panel">
          <div className="plant-panel-heading">
            <span>PLANT SYSTEM STATUS</span>
            <span>SIMULATED</span>
          </div>
          <div className="system-subtitle">
            {windPlant
              ? "WIND GENERATION & COLLECTION"
              : "GEOTHERMAL HEAT & POWER"}
          </div>
          <div className="system-capacity">
            <div>
              <span>AC OUTPUT</span>
              <strong>
                <AnimatedValue value={fmt(m.actual)} />
                <small> MW</small>
              </strong>
            </div>
            <div>
              <span>INSTALLED</span>
              <strong>
                {site.rating}
                <small> MW</small>
              </strong>
            </div>
          </div>
          <div className="plant-status-line">
            <i className="tiny-dot green" />
            {windPlant && rpm === 0
              ? wx.wind >= 25
                ? "HIGH WIND / PARKED"
                : "LOW WIND / STANDBY"
              : "SYSTEMS NOMINAL"}
          </div>
          <dl className="plant-readings">
            <div>
              <dt>Net export</dt>
              <dd>{fmt(m.net)} MW</dd>
            </div>
            <div>
              <dt>Capacity utilization</dt>
              <dd>{fmt(((m.actual ?? 0) / site.rating) * 100, 1)}%</dd>
            </div>
            <div>
              <dt>Scene equipment</dt>
              <dd>{windPlant ? `${count} turbines` : "3 process areas"}</dd>
            </div>
            <div>
              <dt>Snapshot</dt>
              <dd>{timeLabel(minute)} PHT</dd>
            </div>
          </dl>
        </section>
      </div>
      <div className="mission-right">
        <section className="mission-panel">
          <div className="plant-panel-heading">
            <span>EQUIPMENT INSPECTOR</span>
            {windPlant ? <Wind size={13} /> : <Flame size={13} />}
          </div>
          <h2 className="plant-selected-name">{equipment[selected]}</h2>
          <span className="plant-status-line">
            <i className="tiny-dot green" />
            {windPlant
              ? rpm
                ? "ROTOR ACTIVE"
                : "ROTOR PARKED"
              : "THERMAL LOOP ACTIVE"}
          </span>
          <dl className="plant-readings">
            {windPlant ? (
              <>
                <div>
                  <dt>Modeled rotor speed</dt>
                  <dd>{rpm.toFixed(1)} rpm</dd>
                </div>
                <div>
                  <dt>Modeled wind</dt>
                  <dd>{wx.wind.toFixed(1)} m/s</dd>
                </div>
                <div>
                  <dt>Hub height</dt>
                  <dd>61.9 m</dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt>Equipment</dt>
                  <dd>
                    {selected === 0
                      ? "Counterflow towers"
                      : selected === 1
                        ? "Shell-and-tube"
                        : "Transformer / switchgear"}
                  </dd>
                </div>
                <div>
                  <dt>Visible process</dt>
                  <dd>
                    {selected === 0
                      ? "Cooling vapor"
                      : selected === 1
                        ? "Heat transfer"
                        : "Electrical export"}
                  </dd>
                </div>
              </>
            )}
          </dl>
          <button
            className="button glass-button full"
            onClick={() => setFocus((n) => n + 1)}
          >
            <Scan size={12} />
            Focus equipment
          </button>
          <p className="plant-disclaimer">
            Sourced CAD · representative layout.
            <br />
            {windPlant
              ? "Generic power curve; rotor motion follows modeled wind."
              : "Cooling vapor is illustrative."}{" "}
            Site output is simulated.
          </p>
        </section>
      </div>
      <div className="mission-scene-controls">
        <button
          className="icon-button"
          aria-label={sceneOnly ? "Show operations panels" : "Expand 3D scene"}
          aria-pressed={sceneOnly}
          title={sceneOnly ? "Show operations panels" : "Expand 3D scene"}
          onClick={() => setSceneOnly(!sceneOnly)}
        >
          {sceneOnly ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          className="icon-button"
          aria-label="Reset 3D view"
          onClick={() => {
            setFocus(0);
            setReset((n) => n + 1);
          }}
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Toggle equipment labels"
          onClick={() => setLabels(!labels)}
        >
          {labels ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
      <div className="plant-scene-caption">
        <span className="tiny-dot green" />
        {windPlant
          ? "WIND FIELD / DIGITAL TWIN"
          : "THERMAL ISLAND / DIGITAL TWIN"}
        <small>Drag to orbit · Scroll to zoom · Select equipment</small>
      </div>
      <div className="plant-bottom">
        <section className="mission-panel">
          <div className="plant-panel-heading">
            <span>{windPlant ? "TURBINE REGISTER" : "PROCESS AREAS"}</span>
            <span>{equipment.length} IN SCENE</span>
          </div>
          <div className={`plant-equipment-grid ${windPlant ? "" : "thermal"}`}>
            {equipment.map((name, i) => (
              <button
                key={name}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <span className="tiny-dot green" />
                {name}
                <small>
                  {windPlant
                    ? `${rpm.toFixed(1)} rpm`
                    : ["Heat rejection", "Thermal exchange", "Grid export"][i]}
                </small>
              </button>
            ))}
          </div>
          <p className="plant-disclaimer">
            Select a unit to inspect its 3D geometry.
          </p>
        </section>
        <section className="mission-panel">
          <div className="plant-panel-heading">
            <span>SIMULATED WEATHER</span>
            <CloudRain size={13} />
          </div>
          <div className="plant-weather-title">{wx.label}</div>
          <dl className="plant-readings">
            <div>
              <dt>Rainfall</dt>
              <dd>{wx.rain.toFixed(1)} mm/h</dd>
            </div>
            <div>
              <dt>Modeled wind</dt>
              <dd>{wx.wind.toFixed(1)} m/s</dd>
            </div>
          </dl>
          <p className="plant-disclaimer">
            Weather drives generation across the fleet. This scenario applies to
            the full replay window.
          </p>
        </section>
        <section className="mission-panel">
          <div className="plant-panel-heading">
            <span>PLANT OUTPUT</span>
            <span>60 MIN / MW</span>
          </div>
          <Chart
            points={series(siteId, Math.max(0, minute - 60), minute, scenario)}
            height={100}
            unit="MW"
            color="#afcba4"
          />
          <div className="plant-chart-legend">
            <i />
            Actual <i />
            Expected
          </div>
        </section>
      </div>
    </div>
  );
}
