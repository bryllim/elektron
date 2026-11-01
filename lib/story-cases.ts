import {
  assetMeasurement,
  assetSeries,
  BASE_MINUTE,
  type Scenario,
} from "./simulation";

const descriptions = [
  {
    id: "derating",
    label: "Equipment",
    heading: "One unit falls behind its neighbors.",
    asset: "INV-07",
    icon: "equipment",
    explanation:
      "An inverter turns a solar panel’s electricity into power the grid can use. Here, one inverter is running hot and its controller limits output, while neighboring units keep producing.",
    finding: "Investigate this unit",
    next: "Check temperature, the controller event and neighboring output. Inspect the cooling system before deciding on maintenance.",
    limit:
      "The simulation confirms a power-limiting event. It does not establish the physical cause of the overheating.",
  },
  {
    id: "rain",
    label: "Weather",
    heading: "Less sunlight changes what good looks like.",
    asset: "INV-07",
    icon: "weather",
    explanation:
      "Rain and clouds reduce the sunlight reaching the panels. Several units produce less together. Their output should be compared with what the current weather allows, rather than a sunny-day target.",
    finding: "Account for the weather",
    next: "Compare actual generation with the weather-adjusted expectation before dispatching someone to fix equipment.",
    limit:
      "The weather is simulated. This case shows why a low reading by itself is insufficient evidence of an equipment fault.",
  },
  {
    id: "telemetry",
    label: "Missing signal",
    heading: "An absent reading leaves a question open.",
    asset: "INV-04",
    icon: "signal",
    explanation:
      "Sometimes the equipment’s data connection stops reporting. The plant may still be generating. Treating that blank as zero would invent a shutdown that the evidence cannot establish.",
    finding: "Restore the evidence first",
    next: "Check the data link and the last valid reading. Keep generation unknown until a trustworthy measurement returns.",
    limit:
      "Missing readings stay missing in the charts and totals. Elektron does not fill gaps with a confident guess.",
  },
] as const;

/** The public explanation and workspace share their underlying calculation, not copied example numbers. */
export function storyCases() {
  return descriptions.map((item) => {
    const reading = assetMeasurement(
      item.asset,
      BASE_MINUTE,
      item.id as Scenario,
    );
    return {
      ...item,
      reading: {
        ...reading,
        actual: reading.actual === null ? null : reading.actual * 1000,
        expected: reading.expected * 1000,
      },
      points: assetSeries(
        item.asset,
        BASE_MINUTE - 60,
        BASE_MINUTE,
        item.id as Scenario,
      ).map((point) => ({
        ...point,
        actual: point.actual === null ? null : point.actual * 1000,
        expected: point.expected * 1000,
      })),
    };
  });
}
export type StoryCase = ReturnType<typeof storyCases>[number];
