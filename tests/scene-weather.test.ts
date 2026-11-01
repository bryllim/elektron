import test from "node:test";
import assert from "node:assert/strict";
import {
  sceneWeather,
  rotorRpm,
  weatherScenario,
  weatherModeForScenario,
  type WeatherMode,
} from "../lib/scene-weather";
import {
  siteMeasurement,
  assetMeasurement,
  fleetMeasurement,
  integrateEnergy,
  series,
  windPowerFraction,
  weather,
  SITES,
  ASSETS,
  SCENARIOS,
} from "../lib/simulation";
import { agentRequestSchema } from "../lib/agent-tools";
import { terrainHeight } from "../lib/terrain";
import { readFile } from "node:fs/promises";
test("weather controls select the shared scenario consumed by generation and agent tools", () => {
  for (const mode of [
    "clear",
    "cloudy",
    "rain",
    "windy",
    "calm",
    "storm",
  ] as WeatherMode[]) {
    const scenario = weatherScenario(mode, "derating");
    assert.equal(weatherModeForScenario(scenario), mode);
    assert.ok(SCENARIOS.some((s) => s.id === scenario));
    assert.ok(
      agentRequestSchema.safeParse({
        question: "Output?",
        minute: 822,
        scenario,
        siteId: "amihan",
      }).success,
    );
    for (const id of ["silangan", "amihan", "bukal"]) {
      const w = sceneWeather(id, 822, scenario);
      assert.equal(w.wind, weather(id, 822, scenario).wind);
      assert.equal(w.irradiance, weather(id, 822, scenario).irradiance);
    }
  }
});
test("clouds and rain reduce each solar inverter, site power and integrated energy", () => {
  for (const asset of ASSETS) {
    const clear = assetMeasurement(asset.id, 822, "normal").actual!;
    const cloudy = assetMeasurement(asset.id, 822, "overcast").actual!;
    const rain = assetMeasurement(asset.id, 822, "rain").actual!;
    assert.ok(clear > cloudy && cloudy > rain && rain > 0);
  }
  for (const site of SITES.filter((s) => s.technology === "Solar")) {
    assert.ok(
      siteMeasurement(site.id, 822, "rain").actual! <
        siteMeasurement(site.id, 822, "normal").actual!,
    );
    assert.ok(
      integrateEnergy(site.id, 600, 900, "rain").mwh <
        integrateEnergy(site.id, 600, 900, "normal").mwh,
    );
    assert.equal(siteMeasurement(site.id, 120, "rain").actual, 0);
  }
});
test("wind power and rotor share cut-in, rated and storm shutdown behavior", () => {
  for (const v of [-1, 0, 3, 25, 28, NaN]) {
    assert.equal(windPowerFraction(v), 0);
    assert.equal(rotorRpm(v), 0);
  }
  let previous = 0;
  for (let v = 3; v < 25; v += 0.25) {
    const power = windPowerFraction(v);
    assert.ok(power >= previous && power <= 1);
    previous = power;
  }
  assert.equal(windPowerFraction(12), 1);
  for (const site of SITES.filter((s) => s.technology === "Wind")) {
    assert.equal(siteMeasurement(site.id, 822, "calm").actual, 0);
    assert.equal(
      siteMeasurement(site.id, 822, "typhoon").actual,
      site.rating *
        windPowerFraction(weather(site.id, 822, "typhoon").wind) *
        0.985,
    );
    assert.equal(
      siteMeasurement(site.id, 822, "windy").actual,
      site.rating * 0.985,
    );
    assert.ok(
      siteMeasurement(site.id, 822, "rain").actual! <
        siteMeasurement(site.id, 822, "windy").actual!,
    );
  }
  assert.ok(rotorRpm(12) > rotorRpm(8));
});
test("weather-driven fleet totals and chart endpoints reconcile to site power", () => {
  for (const scenario of [
    "overcast",
    "rain",
    "calm",
    "windy",
    "storm",
    "typhoon",
  ] as const) {
    const fleet = fleetMeasurement(822, scenario);
    const total = fleet.sites
      .filter((s) => s.technology !== "Storage")
      .reduce((sum, s) => sum + s.actual!, 0);
    assert.equal(fleet.generation, total);
    assert.equal(series("fleet", 762, 822, scenario).at(-1)!.actual, total);
    const solar = ASSETS.reduce(
      (sum, a) => sum + assetMeasurement(a.id, 822, scenario).actual!,
      0,
    );
    assert.equal(siteMeasurement("silangan", 822, scenario).actual, solar);
    assert.equal(
      siteMeasurement("bukal", 822, scenario).actual,
      siteMeasurement("bukal", 822, "normal").actual,
    );
  }
});
test("mountains preserve equipment pads and default camera clearance", () => {
  for (const x of [-240, -180, -60, 60, 180, 240])
    for (const z of [-90, 90]) assert.equal(terrainHeight(x, z, "wind"), 0);
  for (const x of [-20, 0, 20])
    for (const z of [-15, 0, 15])
      assert.equal(terrainHeight(x, z, "geothermal"), 0);
  assert.ok(terrainHeight(-600, -450, "wind") > 50);
  assert.ok(terrainHeight(-96, -72, "geothermal") > 8);
  assert.ok(terrainHeight(450, 460, "wind") < 260);
  assert.ok(terrainHeight(48, 48, "geothermal") < 36);
});
test("sourced turbine rotor contains blades and hub but never the tower", async () => {
  const b = await readFile("public/models/innerscene/wind-turbine.glb");
  const gltf = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString());
  const rotor = gltf.nodes.find((n: { name: string }) => n.name === "Rotor");
  assert.deepEqual(rotor.translation, [-4.4, 61.9, 0]);
  assert.deepEqual(
    rotor.children.map((i: number) => gltf.nodes[i].name),
    ["Hub and spinner", "Blade 1", "Blade 2", "Blade 3"],
  );
});
