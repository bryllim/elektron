export type RoutePoint = [number, number, number];

/** One route definition drives both the visible cable and its travelling pulses. */
export function createFlowRoute(x: number, z: number) {
  const points: RoutePoint[] = [
    [x + 8, 0.5, z + 9],
    [x + 8, 0.5, 32.5],
    [0, 0.5, 32.5],
    [0, 0.5, 40],
  ];
  const lengths = points.slice(1).map((point, i) =>
    Math.hypot(...point.map((value, axis) => value - points[i][axis])),
  );
  return { points, lengths, length: lengths.reduce((sum, value) => sum + value, 0) };
}

/** Sample by travelled distance so short legs do not slow the pulse down. */
export function pointOnFlowRoute(route: ReturnType<typeof createFlowRoute>, distance: number): RoutePoint {
  let remaining = Math.max(0, Math.min(distance, route.length));
  for (let i = 0; i < route.lengths.length; i++) {
    const length = route.lengths[i];
    if (remaining <= length && length > 0) {
      const start = route.points[i], end = route.points[i + 1];
      const t = remaining / length;
      return start.map((value, axis) => value + (end[axis] - value) * t) as RoutePoint;
    }
    remaining -= length;
  }
  return [...route.points[route.points.length - 1]];
}
