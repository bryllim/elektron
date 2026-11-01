import { stormField } from "./typhoon";
export type Technology = "Wind" | "Solar" | "Geothermal" | "Storage" | "Hydro";
export type Scenario =
  | "normal"
  | "cloud"
  | "derating"
  | "telemetry"
  | "typhoon"
  | "overcast"
  | "rain"
  | "windy"
  | "calm"
  | "storm";
export type Quality = "good" | "missing" | "stale";
export type Overlay = "natural" | "actual" | "relative" | "deviation" | "flow";
export type Site = {
  id: string;
  name: string;
  province: string;
  region: string;
  technology: Technology;
  rating: number;
  dc?: number;
  lat: number;
  lon: number;
  commissioned: string;
};
export const SITES: Site[] = [
  {
    id: "amihan",
    name: "Amihan Wind",
    province: "Ilocos Norte",
    region: "Luzon",
    technology: "Wind",
    rating: 32,
    lat: 18.12,
    lon: 120.75,
    commissioned: "2022",
  },
  {
    id: "silangan",
    name: "Silangan Solar",
    province: "Nueva Ecija",
    region: "Luzon",
    technology: "Solar",
    rating: 10,
    dc: 12,
    lat: 15.62,
    lon: 121.08,
    commissioned: "2023",
  },
  {
    id: "bukal",
    name: "Bukal Geothermal",
    province: "Batangas",
    region: "Luzon",
    technology: "Geothermal",
    rating: 22,
    lat: 13.92,
    lon: 121.16,
    commissioned: "2021",
  },
  {
    id: "habagat",
    name: "Habagat Wind",
    province: "Aklan",
    region: "Visayas",
    technology: "Wind",
    rating: 24,
    lat: 11.6,
    lon: 122.27,
    commissioned: "2024",
  },
  {
    id: "isla",
    name: "Isla Storage",
    province: "Bohol",
    region: "Visayas",
    technology: "Storage",
    rating: 8,
    lat: 9.89,
    lon: 124.18,
    commissioned: "2024",
  },
  {
    id: "sidlak",
    name: "Sidlak Solar",
    province: "Negros Occidental",
    region: "Visayas",
    technology: "Solar",
    rating: 18,
    dc: 21.6,
    lat: 10.62,
    lon: 123.1,
    commissioned: "2023",
  },
  {
    id: "tala",
    name: "Tala Solar",
    province: "Bukidnon",
    region: "Mindanao",
    technology: "Solar",
    rating: 14,
    dc: 16.8,
    lat: 8.07,
    lon: 125.03,
    commissioned: "2024",
  },
  {
    id: "agos",
    name: "Agos Hydro",
    province: "Davao de Oro",
    region: "Mindanao",
    technology: "Hydro",
    rating: 16,
    lat: 7.6,
    lon: 126.05,
    commissioned: "2022",
  },
];
export const TECH_COLORS: Record<Technology, string> = {
  Wind: "#8eacb2",
  Solar: "#d4b478",
  Geothermal: "#ac98b5",
  Storage: "#6e9c9b",
  Hydro: "#8bbba6",
};
export const SCENARIOS: { id: Scenario; name: string; description: string }[] =
  [
    {
      id: "normal",
      name: "Normal operation",
      description:
        "Clear conditions. All inverter zones report within baseline variation.",
    },
    {
      id: "derating",
      name: "Inverter derating",
      description:
        "INV-07 thermally derates after 13:15. Irradiance remains stable.",
    },
    {
      id: "cloud",
      name: "Cloud passage",
      description:
        "A synthetic cloud crosses all solar zones from 13:00 to 14:00.",
    },
    {
      id: "telemetry",
      name: "Telemetry interruption",
      description:
        "INV-04 stops reporting at 13:00. Physical output is unconfirmed.",
    },
    {
      id: "typhoon",
      name: "Typhoon exposure",
      description:
        "Fictional moving storm: local wind, rain and cloud cover drive plant output. Not an official warning.",
    },
  ];
SCENARIOS.push(
  {
    id: "overcast",
    name: "Overcast skies",
    description:
      "Persistent cloud cover reduces incoming solar irradiance across the fleet.",
  },
  {
    id: "rain",
    name: "Rain showers",
    description:
      "Cloud cover and 6 mm/h rainfall reduce solar input; modeled wind is 8 m/s.",
  },
  {
    id: "windy",
    name: "Strong wind",
    description:
      "12 m/s modeled wind reaches the generic turbine's rated-power region.",
  },
  {
    id: "calm",
    name: "Calm conditions",
    description:
      "1.5 m/s wind is below turbine cut-in. Solar conditions remain clear.",
  },
  {
    id: "storm",
    name: "Heavy rain & wind",
    description:
      "18 mm/h rain and dense clouds reduce solar input; 19 m/s wind remains below cut-out.",
  },
);
export const WIND_CURVE = { cutIn: 3, rated: 12, cutOut: 25 } as const;
/** Generic normalized power curve; equipment-specific calibration is not implied. */
export function windPowerFraction(speed: number) {
  if (
    !Number.isFinite(speed) ||
    speed <= WIND_CURVE.cutIn ||
    speed >= WIND_CURVE.cutOut
  )
    return 0;
  if (speed >= WIND_CURVE.rated) return 1;
  return (
    (speed ** 3 - WIND_CURVE.cutIn ** 3) /
    (WIND_CURVE.rated ** 3 - WIND_CURVE.cutIn ** 3)
  );
}
export const BASE_MINUTE = 13 * 60 + 42;
export const DATE = "2026-10-30";
export const ASSETS = Array.from({ length: 12 }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(2, "0")}`,
  name: `Inverter ${String(i + 1).padStart(2, "0")}`,
  siteId: "silangan",
  group: i < 6 ? "COL-01" : "COL-02",
  dc: 1,
  rating: 10 / 12,
  index: i,
}));
export function timestamp(minute: number) {
  return new Date(
    Date.UTC(2026, 9, 30, 0, Math.round(minute) - 480),
  ).toISOString();
}
export function timeLabel(minute: number) {
  const m = Math.round(minute);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export function minuteFromTimestamp(iso: string) {
  return (Date.parse(iso) - Date.parse(timestamp(0))) / 60000;
}
export function solarDay(minute: number) {
  return Math.max(0, Math.sin((Math.PI * (minute - 360)) / 720));
}
export function weather(siteId: string, minute: number, scenario: Scenario) {
  const ix = SITES.findIndex((s) => s.id === siteId);
  const daylight = solarDay(minute);
  const passage =
    scenario === "cloud" && minute >= 780 && minute <= 840
      ? 1 - 0.58 * Math.sin((Math.PI * (minute - 780)) / 60)
      : 1;
  let cloudTransmission =
    scenario === "overcast"
      ? 0.42
      : scenario === "rain"
        ? 0.38
        : scenario === "storm"
          ? 0.24
          : scenario === "typhoon"
            ? 0.14
            : passage;
  let rain =
    scenario === "rain"
      ? 6
      : scenario === "storm"
        ? 18
        : scenario === "typhoon"
          ? 24
          : 0;
  const localStorm =
    scenario === "typhoon" && SITES[ix]
      ? stormField(SITES[ix].lon, SITES[ix].lat, minute)
      : null;
  if (localStorm) {
    cloudTransmission = localStorm.cloudTransmission;
    rain = localStorm.rain;
  }
  // Synthetic optical attenuation, applied once before the PV temperature/loss model.
  const rainTransmission = Math.exp(-0.012 * rain);
  const irradiance = Math.max(
    0,
    (910 + ix * 8) * daylight * cloudTransmission * rainTransmission,
  );
  const windSite = SITES[ix]?.technology === "Wind";
  let wind =
    scenario === "calm"
      ? 1.5
      : scenario === "windy"
        ? 12
        : scenario === "rain"
          ? 8
          : scenario === "storm"
            ? 19
            : scenario === "typhoon"
              ? 28
              : (windSite ? 9.5 : 4.4) + 2 * Math.sin(minute / 210 + ix);
  if (localStorm) wind = localStorm.wind;
  return {
    irradiance,
    ambient: 25 + 7 * daylight - (rain > 0 ? 3 : 0),
    wind,
    cloud:
      cloudTransmission < 0.9
        ? scenario === "cloud"
          ? "Cloud passage"
          : "Overcast"
        : "Mostly clear",
    cloudTransmission,
    rainTransmission,
    rain,
    timestamp: timestamp(minute),
    source: "Simulated",
    quality: "good" as Quality,
  };
}
export function assetMeasurement(
  id: string,
  minute: number,
  scenario: Scenario,
) {
  const a = ASSETS.find((a) => a.id === id);
  if (!a) throw new Error("Unknown asset");
  const w = weather("silangan", minute, scenario);
  const cellTemperature = w.ambient + w.irradiance * 0.028;
  const tempFactor = Math.max(0.7, 1 - 0.0035 * (cellTemperature - 25));
  const expected = Math.min(
    a.rating,
    ((a.dc * w.irradiance) / 1000) * tempFactor * 0.96 * 0.98,
  );
  const derated = scenario === "derating" && id === "INV-07" && minute >= 795;
  const quality: Quality =
    scenario === "telemetry" && id === "INV-04" && minute >= 780
      ? "missing"
      : "good";
  const ratio = derated
    ? 0.46
    : 0.987 + 0.009 * Math.sin(a.index * 2.7 + minute / 180);
  const actual = quality === "missing" ? null : expected * ratio;
  return {
    ...a,
    actual,
    expected,
    deviation:
      actual === null ? null : expected > 0 ? (actual / expected - 1) * 100 : 0,
    temperature:
      quality === "missing"
        ? null
        : derated
          ? 74.3
          : cellTemperature + Math.sin(a.index) * 1.2,
    quality,
    timestamp: timestamp(quality === "missing" ? 779 : minute),
    state:
      quality === "missing"
        ? "No telemetry"
        : expected === 0
          ? "Standby"
          : derated
            ? "Derating"
            : "Operating",
  };
}
export function siteMeasurement(
  id: string,
  minute: number,
  scenario: Scenario,
) {
  const site = SITES.find((s) => s.id === id);
  if (!site) throw new Error("Unknown site");
  const w = weather(id, minute, scenario);
  let actual: number | null = 0,
    expected = 0;
  if (id === "silangan") {
    const assets = ASSETS.map((a) => assetMeasurement(a.id, minute, scenario));
    expected = assets.reduce((s, a) => s + a.expected, 0);
    actual = assets.some((a) => a.actual === null)
      ? null
      : assets.reduce((s, a) => s + (a.actual ?? 0), 0);
  } else if (site.technology === "Solar") {
    const temp = 1 - 0.0035 * (w.ambient + w.irradiance * 0.028 - 25);
    expected = Math.min(
      site.rating,
      ((site.dc! * w.irradiance) / 1000) * temp * 0.96 * 0.98,
    );
    actual = expected * 0.99;
  } else if (site.technology === "Wind") {
    expected = site.rating * windPowerFraction(w.wind);
    actual = expected * 0.985;
  } else if (site.technology === "Geothermal") {
    expected = site.rating * 0.94;
    actual = expected * 0.99;
  } else if (site.technology === "Hydro") {
    expected = site.rating * (0.76 + 0.05 * Math.sin(minute / 240));
    actual = expected * 0.99;
  } else {
    expected = 2.8 * Math.sin((minute - 720) / 180);
    actual = expected;
  }
  const net =
    actual === null
      ? null
      : site.technology === "Storage"
        ? actual
        : Math.max(0, actual * 0.982 - (actual > 0 ? 0.025 : 0));
  return {
    ...site,
    actual,
    expected,
    net,
    quality: (actual === null ? "missing" : "good") as Quality,
    timestamp: timestamp(minute),
    soc:
      site.technology === "Storage"
        ? Math.max(
            10,
            Math.min(90, 50 + 26.25 * Math.cos((minute - 720) / 180)),
          )
        : null,
    status:
      id === "silangan" &&
      ((scenario === "derating" && minute >= 795) ||
        (scenario === "telemetry" && minute >= 780))
        ? "Attention"
        : site.technology === "Wind" && w.wind >= 25
          ? "Wind cut-out"
          : expected === 0 &&
              (site.technology === "Solar" || site.technology === "Wind")
            ? "Standby"
            : "Operational",
  };
}
export function fleetMeasurement(minute: number, scenario: Scenario) {
  const sites = SITES.map((s) => siteMeasurement(s.id, minute, scenario));
  const generators = sites.filter((s) => s.technology !== "Storage");
  return {
    sites,
    generation: generators.some((s) => s.actual === null)
      ? null
      : generators.reduce((v, s) => v + (s.actual ?? 0), 0),
    knownGeneration: generators.reduce((v, s) => v + (s.actual ?? 0), 0),
    net: sites.some((s) => s.net === null)
      ? null
      : sites.reduce((v, s) => v + (s.net ?? 0), 0),
    reporting: sites.filter((s) => s.quality === "good").length,
    capacity: generators.reduce((v, s) => v + s.rating, 0),
    timestamp: timestamp(minute),
  };
}
export function integrateEnergy(
  siteId: string,
  start: number,
  end: number,
  scenario: Scenario,
  metric: "actual" | "net" = "actual",
) {
  let mwh = 0,
    missingMinutes = 0;
  for (let m = start; m < end; m += 5) {
    const dt = Math.min(5, end - m);
    const p1 = siteMeasurement(siteId, m, scenario)[metric],
      p2 = siteMeasurement(siteId, m + dt, scenario)[metric];
    if (p1 === null || p2 === null) {
      missingMinutes += dt;
      continue;
    }
    mwh += (((p1 + p2) / 2) * dt) / 60;
  }
  return { mwh, missingMinutes, complete: missingMinutes === 0 };
}
export function fleetEnergy(minute: number, scenario: Scenario) {
  return SITES.filter((s) => s.technology !== "Storage").reduce(
    (sum, s) => sum + integrateEnergy(s.id, 0, minute, scenario).mwh,
    0,
  );
}
export function series(
  siteId: string | "fleet",
  start: number,
  end: number,
  scenario: Scenario,
  count = 64,
) {
  return Array.from({ length: count }, (_, i) => {
    const minute = start + ((end - start) * i) / (count - 1);
    const s =
      siteId === "fleet"
        ? fleetMeasurement(minute, scenario)
        : siteMeasurement(siteId, minute, scenario);
    return {
      minute,
      actual: "generation" in s ? s.generation : s.actual,
      expected:
        "generation" in s
          ? s.sites
              .filter((s) => s.technology !== "Storage")
              .reduce((n, s) => n + s.expected, 0)
          : s.expected,
    };
  });
}
export function assetSeries(
  id: string,
  start: number,
  end: number,
  scenario: Scenario,
  count = 48,
) {
  return Array.from({ length: count }, (_, i) => {
    const minute = start + ((end - start) * i) / (count - 1);
    const a = assetMeasurement(id, minute, scenario);
    return { minute, actual: a.actual, expected: a.expected };
  });
}
export function alarms(minute: number, scenario: Scenario, siteId?: string) {
  if (siteId && siteId !== "silangan") return [];
  if (scenario === "derating" && minute >= 795)
    return [
      {
        id: "ALM-007",
        assetId: "INV-07",
        siteId: "silangan",
        severity: "Warning",
        title: "Inverter thermal derating",
        description:
          "Elevated internal temperature; power limited by the simulated inverter controller.",
        minute: 795,
        code: "THM-021",
      },
    ];
  if (scenario === "telemetry" && minute >= 780)
    return [
      {
        id: "ALM-004",
        assetId: "INV-04",
        siteId: "silangan",
        severity: "Warning",
        title: "Telemetry communication lost",
        description:
          "No measurements since 12:59. Equipment failure has not been confirmed.",
        minute: 780,
        code: "COM-004",
      },
    ];
  return [];
}
export type Branch = {
  kind: "outage" | "irradiance";
  assetId: string;
  duration: number;
  reduction: number;
};
export function whatIf(
  siteId: string,
  minute: number,
  scenario: Scenario,
  branch: Branch,
) {
  let baseline = 0,
    alternative = 0;
  const points = Array.from({ length: branch.duration + 1 }, (_, i) => {
    const m = minute + i;
    const base = siteMeasurement(siteId, m, scenario).actual;
    let scenarioPower = base;
    if (base !== null) {
      if (branch.kind === "outage") {
        const p = assetMeasurement(branch.assetId, m, scenario).actual;
        scenarioPower = p === null ? null : Math.max(0, base - p);
      } else scenarioPower = base * (1 - branch.reduction / 100);
    }
    return { minute: m, actual: scenarioPower, expected: base };
  });
  let complete = true;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    if (
      a.expected === null ||
      b.expected === null ||
      a.actual === null ||
      b.actual === null
    ) {
      complete = false;
      continue;
    }
    baseline += (a.expected + b.expected) / 120;
    alternative += (a.actual + b.actual) / 120;
  }
  return {
    points,
    baseline,
    alternative,
    difference: baseline - alternative,
    complete,
    branch,
    siteId,
    timestamp: timestamp(minute),
  };
}
export type TelemetryAdapter = {
  readSite: typeof siteMeasurement;
  readAsset: typeof assetMeasurement;
};
export const simulatedTelemetry: TelemetryAdapter = {
  readSite: siteMeasurement,
  readAsset: assetMeasurement,
};
export function fmt(n: number | null, digits = 2) {
  return n === null
    ? "—"
    : n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
}
