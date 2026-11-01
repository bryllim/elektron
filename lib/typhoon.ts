/** Deterministic fictional storm. No observed satellite or warning data. */
export const satelliteFrameMinute = (minute: number) =>
  Math.floor(Math.max(0, Math.min(1439, minute)) / 15) * 15;
export function stormState(minute: number) {
  const t = Math.max(0, Math.min(1439, minute)) / 1439;
  return {
    lon: 131 - 11 * t,
    lat: 12.8 + 5.5 * t,
    wind: 39 + 7 * Math.sin(Math.PI * t),
    pressure: 970 - 15 * Math.sin(Math.PI * t),
    radius: 280,
    minute,
  };
}
export function stormField(lon: number, lat: number, minute: number) {
  const eye = stormState(minute);
  const dx = (lon - eye.lon) * 111 * Math.cos((eye.lat * Math.PI) / 180),
    dy = (lat - eye.lat) * 111;
  const distance = Math.hypot(dx, dy),
    angle = Math.atan2(dy, dx);
  const ring = Math.exp(-Math.pow((distance - 70) / 85, 2));
  const envelope = Math.exp(-Math.pow(distance / 340, 1.5));
  const spiral =
    (1 + Math.sin(angle * 3 + distance * 0.025 - minute / 160)) / 2;
  const eyeMask = 1 - Math.exp(-Math.pow(distance / 28, 2));
  const cloud = Math.min(
    1,
    eyeMask * (0.45 * envelope + 0.5 * ring + 0.35 * envelope * spiral),
  );
  const wind =
    4 +
    (eye.wind - 4) *
      (1 - Math.exp(-distance / 20)) *
      Math.exp(-Math.max(0, distance - 65) / 210);
  const rain = Math.max(0, (32 * ring + 12 * envelope * spiral) * eyeMask);
  return {
    distance,
    wind,
    rain: rain < 0.1 ? 0 : rain,
    cloud,
    cloudTransmission: Math.max(0.12, 1 - cloud * 0.88),
    brightnessTemperature: 24 - 98 * cloud,
  };
}
export const stormTrack = Array.from({ length: 9 }, (_, i) =>
  stormState((i * 1439) / 8),
);
