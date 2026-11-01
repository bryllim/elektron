import { z } from "zod";
import { operationalBrief } from "./operations";
import {
  SITES,
  ASSETS,
  Scenario,
  BASE_MINUTE,
  assetMeasurement,
  assetSeries,
  siteMeasurement,
  fleetMeasurement,
  integrateEnergy,
  alarms,
  weather,
  whatIf,
  timestamp,
  minuteFromTimestamp,
  Overlay,
} from "./simulation";
const siteId = z.enum(SITES.map((s) => s.id) as [string, ...string[]]);
const assetId = z.enum(ASSETS.map((a) => a.id) as [string, ...string[]]);
const timeRange = z
  .object({
    start: z.number().min(0).max(1439),
    end: z.number().min(0).max(1439),
  })
  .strict()
  .refine(
    (v) => v.end >= v.start && v.end - v.start <= 1440,
    "Invalid time window",
  );
const tools = {
  get_operational_brief: z.object({ timeRange }).strict(),
  get_fleet_summary: z.object({ timeRange }).strict(),
  get_site_summary: z.object({ siteId, timeRange }).strict(),
  get_asset_measurements: z
    .object({
      assetIds: z.array(assetId).min(1).max(12),
      metrics: z
        .array(
          z.enum(["actual", "expected", "deviation", "temperature", "quality"]),
        )
        .min(1)
        .max(5),
      timeRange,
    })
    .strict(),
  get_alarm_events: z.object({ siteId, timeRange }).strict(),
  get_weather_context: z.object({ siteId, timeRange }).strict(),
  compare_peer_assets: z.object({ assetId, timeRange }).strict(),
  calculate_energy: z.object({ siteId, timeRange }).strict(),
  focus_asset: z.object({ assetId }).strict(),
  set_scene_overlay: z
    .object({
      overlay: z.enum(["natural", "actual", "relative", "deviation", "flow"]),
    })
    .strict(),
  set_view_time: z.object({ timestamp: z.iso.datetime() }).strict(),
  run_what_if: z
    .object({
      siteId,
      scenarioParameters: z
        .object({
          kind: z.enum(["outage", "irradiance"]),
          assetId,
          duration: z.number().int().min(5).max(180),
          reduction: z.number().min(0).max(100),
        })
        .strict(),
    })
    .strict(),
  create_incident_summary: z
    .object({
      evidenceIds: z
        .array(z.string().regex(/^EV-\d{3}$/))
        .min(1)
        .max(30),
    })
    .strict(),
};
export type ToolName = keyof typeof tools;
export type Evidence = {
  id: string;
  title: string;
  siteId: string;
  assetId?: string;
  metric: string;
  unit: string;
  start: number;
  end: number;
  timestamp: string;
  mode: "Simulated";
  scenario: Scenario;
  quality: string;
  data: unknown;
};
export type Action =
  | { type: "focus"; assetId: string }
  | { type: "overlay"; overlay: Overlay }
  | { type: "time"; minute: number }
  | {
      type: "whatif";
      assetId: string;
      duration: number;
      kind: "outage" | "irradiance";
      reduction: number;
    }
  | { type: "incident"; text: string };
export type ToolContext = {
  minute: number;
  scenario: Scenario;
  siteId: string;
  evidence: Evidence[];
  actions: Action[];
  activity: string[];
};
export const TOOL_LABELS: Record<ToolName, string> = {
  get_operational_brief:
    "Separating equipment, weather and telemetry priorities",
  get_fleet_summary: "Reading fleet generation",
  get_site_summary: "Reading site measurements",
  get_asset_measurements: "Reading inverter measurements",
  get_alarm_events: "Checking alarm events",
  get_weather_context: "Checking weather conditions",
  compare_peer_assets: "Comparing peer output",
  calculate_energy: "Integrating energy measurements",
  focus_asset: "Highlighting equipment",
  set_scene_overlay: "Updating performance overlay",
  set_view_time: "Updating replay time",
  run_what_if: "Calculating isolated what-if branch",
  create_incident_summary: "Preparing shift handover",
};
export function validateTool(name: string, args: unknown) {
  if (!Object.hasOwn(tools, name)) throw new Error("Unknown tool");
  return tools[name as ToolName].parse(args);
}
const TOOL_PURPOSES: Record<ToolName, string> = {
  get_operational_brief:
    "Start fleet triage here. Ranks generators by missing data, localized equipment derating, wind cut-out and weather reduction. Separates weather-adjusted expectation from same-time normal baseline; weather reduction is not recoverable energy.",
  get_fleet_summary:
    "Read all eight site measurements, reporting count, generation and storage-adjusted net export. Null fleet totals mean incomplete telemetry.",
  get_site_summary:
    "Read selected site actual, weather-adjusted expected, net output and quality at the snapshot. Ratings are not expected output.",
  get_asset_measurements:
    "Read Silangan inverter measurements and trends; asset IDs INV-01 through INV-12 belong only to Silangan. Missing readings are unknown, not zero.",
  get_alarm_events:
    "Read controller events for a site in the requested interval. Absence of events does not prove a site is safe.",
  get_weather_context:
    "Read seven aligned synthetic weather samples including wind, irradiance, rainfall and cloud transmission. All satellite and storm context is fictional.",
  compare_peer_assets:
    "Compare all twelve Silangan inverters to distinguish a localized defect from a resource-wide change. Includes expected output, temperature and data quality.",
  calculate_energy:
    "Integrate site net export over time in MWh. Distinguish complete and partial totals; instantaneous MW is not energy.",
  focus_asset:
    "Highlight a Silangan inverter in the 3D viewer. This changes presentation only, never equipment.",
  set_scene_overlay:
    "Change the 3D visualization; use deviation to reveal localized underperformance.",
  set_view_time:
    "Keep the viewer aligned to this frozen snapshot. Only the current snapshot timestamp is accepted.",
  run_what_if:
    "Calculate an isolated Silangan inverter outage or irradiance reduction branch, with baseline and alternative MWh. Does not change the baseline or control equipment. Simplified projection, not an engineering forecast.",
  create_incident_summary:
    "Prepare a downloadable handover from evidence already retrieved during this investigation. Pass only returned evidence IDs.",
};
export const toolDefinitions = Object.entries(tools).map(([name, schema]) => ({
  type: "function",
  name,
  description:
    TOOL_PURPOSES[name as ToolName] +
    " Uses frozen simulated snapshot. Time ranges are local minutes since 00:00 Asia/Manila on 2026-10-30.",
  parameters: z.toJSONSchema(schema, { unrepresentable: "any" }),
  strict: false,
}));
function evidence(
  ctx: ToolContext,
  title: string,
  metric: string,
  unit: string,
  data: unknown,
  options: {
    siteId?: string;
    assetId?: string;
    start?: number;
    end?: number;
    quality?: string;
  } = {},
) {
  const e: Evidence = {
    id: `EV-${String(ctx.evidence.length + 1).padStart(3, "0")}`,
    title,
    metric,
    unit,
    siteId: options.siteId ?? ctx.siteId,
    assetId: options.assetId,
    start: options.start ?? Math.max(0, ctx.minute - 60),
    end: options.end ?? ctx.minute,
    timestamp: timestamp(ctx.minute),
    mode: "Simulated",
    scenario: ctx.scenario,
    quality: options.quality ?? "good",
    data,
  };
  ctx.evidence.push(e);
  return e;
}
export function incidentText(ctx: ToolContext, ids?: string[]) {
  const selected = ctx.evidence.filter((e) => !ids || ids.includes(e.id));
  return `ELEKTRON · SHIFT HANDOVER\nFictional company · Simulated operations\nSnapshot: ${timestamp(ctx.minute)} (Asia/Manila display)\nScenario: ${ctx.scenario}\nSite: ${SITES.find((s) => s.id === ctx.siteId)?.name}\n\nEvidence\n${selected.map((e) => `${e.id} | ${e.title} | ${e.metric} (${e.unit}) | quality: ${e.quality}\n${JSON.stringify(e.data, null, 2)}`).join("\n\n")}\n\nAssessment\n${ctx.siteId === "silangan" && ctx.scenario === "derating" && ctx.minute >= 795 ? "INV-07 is thermally derated in the seeded simulation. Elevated temperature and a controller event corroborate localized underperformance. Internal root cause remains unverified; field inspection would be needed in a real plant." : ctx.siteId === "silangan" && ctx.scenario === "telemetry" && ctx.minute >= 780 ? "INV-04 telemetry is missing. A communication issue is observed; equipment failure is not confirmed." : "Review the attached measurements and events. No engineering certification is implied."}\n\nSuggested follow-up\nReview controller logs and maintenance history. Compare an isolated what-if branch before planning downtime. No physical equipment commands are available.\n\nBuilt by Bryl Lim with Engr. Will Delos Reyes\n`;
}
export function executeTool(
  name: string,
  raw: unknown,
  ctx: ToolContext,
): unknown {
  const a = validateTool(name, raw) as Record<string, unknown>;
  const r = (a.timeRange as { start: number; end: number } | undefined) ?? {
    start: Math.max(0, ctx.minute - 60),
    end: ctx.minute,
  };
  if (r.end > ctx.minute)
    throw new Error("Read tools cannot read beyond the frozen snapshot");
  ctx.activity.push(TOOL_LABELS[name as ToolName]);
  switch (name) {
    case "get_operational_brief":
      return evidence(
        ctx,
        "Operational priorities and uncertainty",
        "operational triage",
        "MW",
        operationalBrief(r.end, ctx.scenario),
        { start: r.start, end: r.end },
      );
    case "get_fleet_summary":
      return evidence(
        ctx,
        "Fleet generation and status",
        "generation",
        "MW",
        fleetMeasurement(r.end, ctx.scenario),
        { start: r.start, end: r.end },
      );
    case "get_site_summary": {
      const s = siteMeasurement(String(a.siteId), r.end, ctx.scenario);
      return evidence(ctx, `${s.name} output`, "actual / expected", "MW", s, {
        siteId: s.id,
        start: r.start,
        end: r.end,
        quality: s.quality,
      });
    }
    case "get_asset_measurements": {
      const data = (a.assetIds as string[]).map((id) => ({
        measurement: assetMeasurement(id, r.end, ctx.scenario),
        trend: assetSeries(id, r.start, r.end, ctx.scenario, 16),
      }));
      return evidence(
        ctx,
        "Inverter actual versus expected",
        "actual / expected",
        "MW",
        data,
        {
          siteId: "silangan",
          assetId: (a.assetIds as string[])[0],
          start: r.start,
          end: r.end,
          quality: data.some((d) => d.measurement.quality !== "good")
            ? "missing"
            : "good",
        },
      );
    }
    case "get_alarm_events":
      return evidence(
        ctx,
        "Controller alarm log",
        "alarm events",
        "events",
        alarms(r.end, ctx.scenario, String(a.siteId)).filter(
          (e) => e.minute >= r.start,
        ),
        { siteId: String(a.siteId), start: r.start, end: r.end },
      );
    case "get_weather_context":
      return evidence(
        ctx,
        "Aligned synthetic weather",
        "POA irradiance / ambient / wind",
        "W/m² / °C / m/s",
        Array.from({ length: 7 }, (_, i) =>
          weather(
            String(a.siteId),
            r.start + ((r.end - r.start) * i) / 6,
            ctx.scenario,
          ),
        ),
        { siteId: String(a.siteId), start: r.start, end: r.end },
      );
    case "compare_peer_assets": {
      const data = ASSETS.map((asset) =>
        assetMeasurement(asset.id, r.end, ctx.scenario),
      );
      return evidence(
        ctx,
        "Inverter peer comparison",
        "actual / expected / temperature",
        "MW / % / °C",
        data,
        {
          siteId: "silangan",
          assetId: String(a.assetId),
          start: r.start,
          end: r.end,
          quality: data.some((a) => a.quality !== "good") ? "partial" : "good",
        },
      );
    }
    case "calculate_energy":
      return evidence(
        ctx,
        "Integrated net export",
        "energy",
        "MWh",
        integrateEnergy(String(a.siteId), r.start, r.end, ctx.scenario, "net"),
        { siteId: String(a.siteId), start: r.start, end: r.end },
      );
    case "focus_asset":
      ctx.actions.push({ type: "focus", assetId: String(a.assetId) });
      return { ok: true, assetId: a.assetId };
    case "set_scene_overlay":
      ctx.actions.push({ type: "overlay", overlay: a.overlay as Overlay });
      return { ok: true, overlay: a.overlay };
    case "set_view_time": {
      const m = minuteFromTimestamp(String(a.timestamp));
      if (
        !Number.isFinite(m) ||
        m < 0 ||
        m > 1439 ||
        Math.abs(m - ctx.minute) > 0.01
      )
        throw new Error(
          "Keep viewer on the frozen snapshot for this investigation. Start a new investigation to change time.",
        );
      ctx.actions.push({ type: "time", minute: m });
      return { ok: true, timestamp: a.timestamp };
    }
    case "run_what_if": {
      if (a.siteId !== "silangan")
        throw new Error(
          "Equipment what-if is available for Silangan Solar only",
        );
      const b = a.scenarioParameters as {
        kind: "outage" | "irradiance";
        assetId: string;
        duration: number;
        reduction: number;
      };
      ctx.actions.push({ type: "whatif", ...b });
      const result = whatIf("silangan", ctx.minute, ctx.scenario, b);
      return evidence(
        ctx,
        "Isolated what-if energy comparison",
        "energy difference",
        "MWh",
        {
          baseline: result.baseline,
          alternative: result.alternative,
          difference: result.difference,
          complete: result.complete,
          parameters: b,
        },
        {
          siteId: "silangan",
          assetId: b.assetId,
          start: ctx.minute,
          end: ctx.minute + b.duration,
          quality: result.complete ? "modeled" : "incomplete",
        },
      );
    }
    case "create_incident_summary": {
      const ids = a.evidenceIds as string[];
      if (ids.some((id) => !ctx.evidence.some((e) => e.id === id)))
        throw new Error("Unknown evidence ID");
      const text = incidentText(ctx, ids);
      ctx.actions.push({ type: "incident", text });
      return { summary: text, evidenceIds: ids };
    }
  }
}
export function scriptedInvestigation(question: string, ctx: ToolContext) {
  const range = { start: Math.max(0, ctx.minute - 60), end: ctx.minute };
  const q = question.toLowerCase();
  const namedSite = SITES.find((s) =>
    q.includes(s.name.toLowerCase().split(" ")[0]),
  );
  if (namedSite) ctx.siteId = namedSite.id;
  let text = "";
  if (/fleet|which sites|prioriti|need attention/.test(q)) {
    const ev = executeTool(
      "get_operational_brief",
      { timeRange: range },
      ctx,
    ) as Evidence;
    const data = ev.data as ReturnType<typeof operationalBrief>;
    const fleet = executeTool(
      "get_fleet_summary",
      { timeRange: range },
      ctx,
    ) as Evidence;
    const findings = data.findings.filter((f) => f.category !== "normal");
    text =
      `Fleet triage · ${findings.length} generators to review [${ev.id}].\n\n` +
      (findings.length
        ? findings
            .map(
              (f) =>
                `${f.site}: ${f.title}. ${f.actualMW === null ? "Output is unknown." : `${f.actualMW.toFixed(2)} MW actual / ${f.expectedMW.toFixed(2)} MW weather-adjusted expected.`} ${f.nextStep} [${ev.id}]`,
            )
            .join("\n\n")
        : `All reporting generators track their modeled conditions; this is not a safety assessment [${ev.id}, ${fleet.id}].`) +
      `\n\nWeather reduction is a comparison with the normal scenario at this same time, not recoverable energy. This scripted triage is rule-based; it does not infer an unobserved failure [${ev.id}].`;
  } else if (/energy|export.*today|mwh/.test(q)) {
    const site =
      SITES.find((s) => q.includes(s.name.toLowerCase().split(" ")[0])) ??
      SITES.find((s) => s.id === ctx.siteId)!;
    const ev = executeTool(
      "calculate_energy",
      { siteId: site.id, timeRange: { start: 0, end: ctx.minute } },
      ctx,
    ) as Evidence;
    const data = ev.data as ReturnType<typeof integrateEnergy>;
    text = `${site.name} has exported ${data.mwh.toFixed(2)} MWh from midnight to this snapshot [${ev.id}]. ${data.complete ? "The 5-minute trapezoidal integration is complete." : "This is a partial total: telemetry gaps were excluded, so it is not a complete daily energy figure."}\n\nThis is simulated net export, after collection losses and auxiliary load.`;
  } else if (/typhoon/.test(q) || ctx.siteId !== "silangan") {
    const ev = executeTool(
      "get_weather_context",
      { siteId: ctx.siteId, timeRange: range },
      ctx,
    ) as Evidence;
    const site = executeTool(
      "get_site_summary",
      { siteId: ctx.siteId, timeRange: range },
      ctx,
    ) as Evidence;
    const triage = executeTool(
      "get_operational_brief",
      { timeRange: range },
      ctx,
    ) as Evidence;
    const finding = (
      triage.data as ReturnType<typeof operationalBrief>
    ).findings.find((f) => f.siteId === ctx.siteId);
    const reading = site.data as ReturnType<typeof siteMeasurement>;
    text = `${reading.name}: ${reading.actual === null ? "output unknown" : `${reading.actual.toFixed(2)} MW actual versus ${reading.expected.toFixed(2)} MW weather-adjusted expected`} [${site.id}].\n\n${finding ? `${finding.title}. ${finding.detail} ${finding.nextStep}` : "Storage dispatch is modeled separately from generation; review net export and state of charge."} [${triage.id}, ${site.id}].\n\nAligned weather measurements are available in [${ev.id}].${ctx.scenario === "typhoon" ? " The storm field is fictional. No official warning data is connected; track distance cannot establish operational safety." : " These are modeled observations, not a confirmed physical diagnosis."}`;
  } else {
    const site = executeTool(
      "get_site_summary",
      { siteId: "silangan", timeRange: range },
      ctx,
    ) as Evidence;
    const peers = executeTool(
      "compare_peer_assets",
      { assetId: "INV-07", timeRange: range },
      ctx,
    ) as Evidence;
    const wx = executeTool(
      "get_weather_context",
      { siteId: "silangan", timeRange: range },
      ctx,
    ) as Evidence;
    const events = executeTool(
      "get_alarm_events",
      { siteId: "silangan", timeRange: range },
      ctx,
    ) as Evidence;
    const readings = ASSETS.map((a) =>
      assetMeasurement(a.id, ctx.minute, ctx.scenario),
    );
    const requested = q.match(/inv[- ]?(\d{1,2})/);
    const requestedId = requested
      ? `INV-${requested[1].padStart(2, "0")}`
      : null;
    const suspect =
      readings.find((a) => a.id === requestedId) ??
      readings.find((a) => a.quality === "missing") ??
      [...readings].sort((a, b) => (a.deviation ?? 0) - (b.deviation ?? 0))[0];
    executeTool(
      "get_asset_measurements",
      {
        assetIds: [suspect.id],
        metrics: ["actual", "expected", "deviation", "temperature", "quality"],
        timeRange: range,
      },
      ctx,
    );
    executeTool("focus_asset", { assetId: suspect.id }, ctx);
    executeTool("set_scene_overlay", { overlay: "deviation" }, ctx);
    if (suspect.quality === "missing")
      text = `${suspect.id} has stopped reporting. Silangan's total output is unknown at this snapshot; missing telemetry is not zero generation [${site.id}, ${peers.id}].\n\nThe communication alarm supports a telemetry interruption, not a confirmed inverter failure [${events.id}]. Check the data link and controller logs before drawing an equipment conclusion.`;
    else if (suspect.state === "Derating")
      text = `Silangan's output drop is localized to ${suspect.id}. It is producing ${(suspect.actual! * 1000).toFixed(0)} kW against ${(suspect.expected * 1000).toFixed(0)} kW expected — ${Math.abs(suspect.deviation!).toFixed(1)}% below expectation [${peers.id}].\n\nThe inverter reports ${suspect.temperature!.toFixed(1)} °C and a thermal derating event began at 13:15 PHT [${peers.id}, ${events.id}]. Peers remain close to expected output, with comparable irradiance [${peers.id}, ${wx.id}].\n\nLikely cause: localized thermal derating. Clouds do not explain the peer difference. The underlying cooling fault is unverified; inspect ventilation and controller history before planning maintenance.`;
    else if (
      (["rain", "overcast", "storm", "typhoon"].includes(ctx.scenario) ||
        (ctx.scenario === "cloud" && ctx.minute >= 780 && ctx.minute <= 840)) &&
      suspect.expected > 0
    )
      text = `The reduction is broad across the solar zones rather than isolated to one inverter [${peers.id}]. Aligned synthetic weather shows reduced irradiance under the configured cloud or rain conditions [${wx.id}].\n\nThis supports a weather-driven reduction in the current scenario. Actual output tracks the weather-adjusted expectation; lower generation alone is not evidence of an equipment failure. There is no active controller derating alarm at this snapshot [${events.id}].`;
    else
      text = `${requestedId ? `${suspect.id} is` : "Silangan’s inverters are"} tracking expected output within the configured baseline variation at this snapshot [${site.id}, ${peers.id}]. ${suspect.expected === 0 ? "The plant is in nighttime standby. Zero generation is expected." : `No localized derating is indicated for ${requestedId ?? "these inverters"}.`}\n\nWeather and controller events are aligned to the same simulation time [${wx.id}, ${events.id}]. Select the inverter-derating scenario after 13:15 PHT to reproduce the demonstration incident.`;
  }
  if (
    /outage|unavailable|what.if/.test(q) &&
    ctx.siteId === "silangan" &&
    !/fleet|which sites/.test(q)
  ) {
    const match = q.match(/inv[- ]?(\d{1,2})/);
    const id = match ? `INV-${match[1].padStart(2, "0")}` : "INV-07";
    const minutes = q.match(/(\d+)\s*min/);
    const duration = Math.max(
      5,
      Math.min(180, minutes ? Number(minutes[1]) : 30),
    );
    const ev = executeTool(
      "run_what_if",
      {
        siteId: "silangan",
        scenarioParameters: {
          kind: "outage",
          assetId: id,
          duration,
          reduction: 30,
        },
      },
      ctx,
    ) as Evidence;
    const d = ev.data as { difference: number; complete: boolean };
    text += `\n\nAn isolated ${duration}-minute outage branch for ${id} ${d.complete ? `reduces modeled energy by ${d.difference.toFixed(3)} MWh` : "has incomplete telemetry; a reliable energy difference is unavailable"} [${ev.id}]. The baseline is preserved. This simplified branch is not a validated forecast.`;
  }
  if (/summari|summary|handover|shift|incident/.test(q)) {
    executeTool(
      "create_incident_summary",
      { evidenceIds: ctx.evidence.map((e) => e.id) },
      ctx,
    );
    text += "\n\nThe evidence-backed shift handover is ready to download.";
  }
  return text;
}
export const agentRequestSchema = z
  .object({
    question: z.string().min(1).max(2000),
    minute: z.number().min(0).max(1439),
    scenario: z.enum([
      "normal",
      "cloud",
      "derating",
      "telemetry",
      "typhoon",
      "overcast",
      "rain",
      "windy",
      "calm",
      "storm",
    ]),
    siteId,
    analysisMode: z.enum(["triage", "deep"]).default("triage"),
  })
  .strict();
