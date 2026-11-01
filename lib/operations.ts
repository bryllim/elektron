import {
  SITES,
  ASSETS,
  Scenario,
  siteMeasurement,
  assetMeasurement,
  weather,
} from "./simulation";

export type OperationalFinding = {
  siteId: string;
  site: string;
  category: "telemetry" | "equipment" | "wind-limit" | "weather" | "normal";
  priority: number;
  title: string;
  detail: string;
  nextStep: string;
  actualMW: number | null;
  expectedMW: number;
  gapMW: number | null;
  weatherReductionMW: number;
};

// The UI and the agent use one diagnostic view of the same frozen snapshot.
// Weather impact is a same-time baseline comparison, never a recovery promise.
export function operationalBrief(minute: number, scenario: Scenario) {
  const findings: OperationalFinding[] = SITES.filter(
    (s) => s.technology !== "Storage",
  ).map((site) => {
    const reading = siteMeasurement(site.id, minute, scenario);
    const wx = weather(site.id, minute, scenario);
    const normal = siteMeasurement(site.id, minute, "normal");
    const base: OperationalFinding = {
      siteId: site.id,
      site: site.name,
      category: "normal",
      priority: 4,
      title:
        reading.expected === 0 && site.technology === "Solar"
          ? "Nighttime standby"
          : "Tracking weather-adjusted output",
      detail: "No material equipment deviation in this modeled snapshot.",
      nextStep: "Continue monitoring aligned output and weather.",
      actualMW: reading.actual,
      expectedMW: reading.expected,
      gapMW:
        reading.actual === null
          ? null
          : Math.max(0, reading.expected - reading.actual),
      weatherReductionMW: Math.max(0, normal.expected - reading.expected),
    };
    if (reading.actual === null)
      return {
        ...base,
        category: "telemetry",
        priority: 0,
        title: "Output unknown · data link interrupted",
        detail:
          "INV-04 is not reporting. The site total cannot be established; missing data is not zero generation.",
        nextStep: "Verify the telemetry link before diagnosing equipment.",
      };
    const derated =
      site.id === "silangan"
        ? ASSETS.map((a) => assetMeasurement(a.id, minute, scenario)).find(
            (a) => a.state === "Derating",
          )
        : undefined;
    if (derated)
      return {
        ...base,
        category: "equipment",
        priority: 1,
        title: `${derated.id} · localized thermal derating`,
        detail:
          "Controller event and elevated inverter temperature agree with the peer-output difference. The underlying fault is unverified.",
        nextStep:
          "Compare peers, inspect the event, then test a maintenance outage.",
      };
    if (site.technology === "Wind" && wx.wind >= 25)
      return {
        ...base,
        category: "wind-limit",
        priority: 2,
        title: "Wind above modeled cut-out",
        detail:
          "Turbines are parked by the simulation's wind-speed limit. Zero output here does not establish equipment failure.",
        nextStep: "Review the storm track and local wind evidence.",
      };
    if (base.weatherReductionMW > 0.1)
      return {
        ...base,
        category: "weather",
        priority: 3,
        title:
          site.technology === "Wind"
            ? "Wind resource below baseline"
            : "Weather-limited generation",
        detail:
          "The weather-adjusted expectation falls with the available resource; compare it with actual output before declaring a fault.",
        nextStep: "Check aligned weather and generation trends.",
      };
    return base;
  });
  findings.sort(
    (a, b) =>
      a.priority - b.priority ||
      (a.category === "weather"
        ? b.weatherReductionMW - a.weatherReductionMW
        : (b.gapMW ?? 0) - (a.gapMW ?? 0)),
  );
  return {
    minute,
    scenario,
    source: "Simulated",
    findings,
    attention: findings.filter((f) => f.category !== "normal").length,
    equipmentIssues: findings.filter((f) => f.category === "equipment").length,
    unknownSites: findings.filter((f) => f.category === "telemetry").length,
    weatherReductionMW: findings.reduce(
      (sum, f) => sum + f.weatherReductionMW,
      0,
    ),
    assumptions:
      "Rule-based triage, not a model-generated diagnosis. Expected output already includes current weather. Weather reduction compares with the normal scenario at the same time; it is not recoverable energy or a forecast. Storage is excluded from generator triage.",
  };
}

export const DEMO_CASES = [
  {
    id: "derating",
    number: "01",
    label: "Equipment or weather?",
    title: "One inverter. A fleet-wide question.",
    description:
      "Trace a solar output drop to INV-07, verify the evidence, and compare a maintenance outage.",
    siteId: "silangan",
    minute: 822,
    scenario: "derating" as Scenario,
    question:
      "Why did Silangan's output drop? Compare peers, weather and alarms, then recommend the next step.",
    proof: "Peer comparison → controller event → isolated what-if",
  },
  {
    id: "rain",
    number: "02",
    label: "Resource or failure?",
    title: "Rain changes the expected output.",
    description:
      "See rainfall and cloud cover reduce solar generation without falsely diagnosing an equipment fault.",
    siteId: "silangan",
    minute: 822,
    scenario: "rain" as Scenario,
    question:
      "Is Silangan's reduced output caused by weather or an equipment fault?",
    proof: "Weather-adjusted baseline → aligned generation",
  },
  {
    id: "telemetry",
    number: "03",
    label: "Zero or unknown?",
    title: "A missing signal is not a dead inverter.",
    description:
      "Interrupt telemetry and keep uncertain generation out of operational conclusions.",
    siteId: "silangan",
    minute: 822,
    scenario: "telemetry" as Scenario,
    question:
      "Investigate Silangan's missing telemetry. What can we conclude and what remains unknown?",
    proof: "Quality flags → incomplete totals → evidence handover",
  },
  {
    id: "typhoon",
    number: "04",
    label: "What is exposed?",
    title: "Follow a storm across the fleet.",
    description:
      "Replay a fictional satellite field and see an exposed wind farm park at its modeled cut-out speed.",
    siteId: null,
    minute: 1200,
    scenario: "typhoon" as Scenario,
    question:
      "Which sites need attention during this typhoon scenario? Separate equipment issues from weather exposure.",
    proof: "Synthetic satellite → local weather → fleet priorities",
  },
] as const;
