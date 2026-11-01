/** Rounded axis bounds preserve zero and negative storage dispatch. */
export function chartScale(values: number[], intervals = 4) {
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const raw = (high - low || 1) / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / magnitude;
  const step =
    ([1, 2, 2.5, 5, 10].find((n) => n >= fraction / 1.15) ?? 10) * magnitude;
  const min = Math.floor(low / step) * step;
  const max = Math.max(min + step, Math.ceil(high / step) * step);
  const ticks = Array.from(
    { length: Math.round((max - min) / step) + 1 },
    (_, i) => Number((min + i * step).toPrecision(12)),
  );
  return {
    min,
    max,
    ticks,
    decimals:
      Math.max(0, -Math.floor(Math.log10(step))) +
      (step < 1 && step / magnitude === 2.5 ? 1 : 0),
  };
}

/** A null reading breaks the path; it is never treated as zero or interpolated. */
export function chartSegments<T>(
  points: T[],
  value: (p: T) => number | null | undefined,
) {
  const segments: { point: T; index: number }[][] = [];
  let current: { point: T; index: number }[] = [];
  points.forEach((point, index) => {
    if (value(point) == null) {
      if (current.length) segments.push(current);
      current = [];
    } else current.push({ point, index });
  });
  if (current.length) segments.push(current);
  return segments;
}
