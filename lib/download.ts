import {
  SITES,
  Scenario,
  ASSETS,
  siteMeasurement,
  assetMeasurement,
  timestamp,
} from "./simulation";
export function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportMeasurements(
  siteId: string | null,
  minute: number,
  scenario: Scenario,
) {
  const rows = [
    [
      "timestamp_utc",
      "site_id",
      "asset_id",
      "actual_mw",
      "expected_mw",
      "net_export_mw",
      "quality",
      "source",
    ],
  ];
  for (let m = Math.max(0, minute - 360); m <= minute; m += 5) {
    for (const site of SITES.filter((s) => !siteId || s.id === siteId)) {
      const s = siteMeasurement(site.id, m, scenario);
      rows.push([
        timestamp(m),
        s.id,
        "",
        s.actual === null ? "" : s.actual.toFixed(6),
        s.expected.toFixed(6),
        s.net === null ? "" : s.net.toFixed(6),
        s.quality,
        "Simulated",
      ]);
      if (siteId === "silangan")
        for (const asset of ASSETS) {
          const a = assetMeasurement(asset.id, m, scenario);
          rows.push([
            timestamp(m),
            s.id,
            a.id,
            a.actual === null ? "" : a.actual.toFixed(6),
            a.expected.toFixed(6),
            "",
            a.quality,
            "Simulated",
          ]);
        }
    }
  }
  download(
    `elektron-${siteId ?? "fleet"}-measurements.csv`,
    rows.map((r) => r.join(",")).join("\n"),
    "text/csv",
  );
}
