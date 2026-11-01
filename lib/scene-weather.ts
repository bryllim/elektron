import { weather, WIND_CURVE, type Scenario } from "./simulation";
export type WeatherMode =
  | "scenario"
  | "clear"
  | "cloudy"
  | "rain"
  | "windy"
  | "calm"
  | "storm"
  | "typhoon";
export function weatherScenario(
  mode: WeatherMode,
  current: Scenario,
): Scenario {
  return (
    {
      scenario: current,
      clear: "normal",
      cloudy: "overcast",
      rain: "rain",
      windy: "windy",
      calm: "calm",
      storm: "storm",
      typhoon: "typhoon",
    } as const
  )[mode];
}
export function weatherModeForScenario(scenario: Scenario): WeatherMode {
  const modes: Partial<Record<Scenario, WeatherMode>> = {
    normal: "clear",
    overcast: "cloudy",
    rain: "rain",
    windy: "windy",
    calm: "calm",
    storm: "storm",
    typhoon: "typhoon",
  };
  return modes[scenario] ?? "scenario";
}
/** Scene effects read the same conditions as generation; no visual-only overrides. */
export function sceneWeather(
  siteId: string,
  minute: number,
  scenario: Scenario,
) {
  const w = weather(siteId, minute, scenario);
  return {
    ...w,
    cloudy: w.cloudTransmission < 0.9,
    label:
      w.rain >= 12
        ? "Heavy rain"
        : w.rain > 0
          ? "Rain showers"
          : w.cloudTransmission < 0.9
            ? "Cloud cover"
            : w.wind < WIND_CURVE.cutIn
              ? "Calm & clear"
              : w.wind >= 12
                ? "Strong wind"
                : "Clear",
  };
}
/** Rotor animation shares the generation model's operating thresholds. */
export function rotorRpm(wind: number) {
  return !Number.isFinite(wind) ||
    wind <= WIND_CURVE.cutIn ||
    wind >= WIND_CURVE.cutOut
    ? 0
    : Math.min(15, 5 + (wind - WIND_CURVE.cutIn) * 0.8);
}
