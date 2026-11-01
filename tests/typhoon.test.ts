import test from "node:test";
import assert from "node:assert/strict";
import { stormState, stormField, satelliteFrameMinute } from "../lib/typhoon";
import {
  SITES,
  weather,
  siteMeasurement,
  windPowerFraction,
  integrateEnergy,
} from "../lib/simulation";
import { rotorRpm } from "../lib/scene-weather";
test("satellite frames remain bounded and never claim a future observation", () => {
  for (let t = 0; t < 1440; t++) {
    const frame = satelliteFrameMinute(t);
    assert.ok(frame <= t && t - frame < 15);
    assert.equal(frame % 15, 0);
  }
  assert.equal(satelliteFrameMinute(-5), 0);
  assert.equal(satelliteFrameMinute(1500), 1425);
  assert.ok(stormState(1200).lon < stormState(600).lon);
  assert.ok(stormState(1200).lat > stormState(600).lat);
});
test("synthetic satellite fields have an eye, eyewall and bounded measurements", () => {
  const eye = stormState(720),
    center = stormField(eye.lon, eye.lat, 720),
    wall = stormField(eye.lon + 0.65, eye.lat, 720),
    far = stormField(eye.lon + 8, eye.lat, 720);
  assert.ok(wall.cloud > center.cloud && wall.cloud > far.cloud);
  assert.ok(wall.brightnessTemperature < center.brightnessTemperature);
  assert.ok(wall.wind > center.wind && wall.wind > far.wind);
  for (let t = 0; t < 1440; t += 60)
    for (const s of SITES) {
      const f = stormField(s.lon, s.lat, t);
      assert.ok(f.wind >= 0 && f.wind <= 46);
      assert.ok(f.rain >= 0 && f.rain <= 44);
      assert.ok(
        f.brightnessTemperature >= -74 && f.brightnessTemperature <= 24,
      );
      assert.ok(f.cloudTransmission >= 0.12 && f.cloudTransmission <= 1);
      const w = weather(s.id, t, "typhoon");
      assert.equal(w.wind, f.wind);
      assert.equal(w.rain, f.rain);
      assert.equal(w.cloudTransmission, f.cloudTransmission);
    }
});
test("moving storm changes local generation and parks only exposed wind farms", () => {
  let parked = 0,
    operating = 0;
  for (let t = 0; t < 1440; t += 15)
    for (const s of SITES.filter((s) => s.technology === "Wind")) {
      const w = weather(s.id, t, "typhoon"),
        p = siteMeasurement(s.id, t, "typhoon");
      assert.equal(p.actual, s.rating * windPowerFraction(w.wind) * 0.985);
      if (w.wind >= 25) {
        parked++;
        assert.equal(p.actual, 0);
        assert.equal(rotorRpm(w.wind), 0);
      } else operating++;
    }
  assert.ok(parked > 0 && operating > 0);
  assert.notEqual(
    weather("amihan", 822, "typhoon").wind,
    weather("habagat", 822, "typhoon").wind,
  );
  assert.notEqual(
    siteMeasurement("amihan", 600, "typhoon").actual,
    siteMeasurement("amihan", 1200, "typhoon").actual,
  );
  for (const s of SITES.filter((s) => s.technology === "Solar"))
    assert.ok(
      integrateEnergy(s.id, 360, 1080, "typhoon").mwh <
        integrateEnergy(s.id, 360, 1080, "normal").mwh,
    );
});
