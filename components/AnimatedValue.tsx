"use client";
import { useEffect, useRef, useState } from "react";
/** Interpolates presentation only; telemetry always retains its frozen numeric value. */
export default function AnimatedValue({ value }: { value: string }) {
  const number = Number(value.replace(/,/g, "")),
    previous = useRef(0),
    [display, setDisplay] = useState(value);
  useEffect(() => {
    if (
      !Number.isFinite(number) ||
      document.documentElement.dataset.motion === "reduced" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      previous.current = number;
      return;
    }
    const start = performance.now(),
      from = Number.isFinite(previous.current) ? previous.current : 0,
      decimals = value.includes(".") ? value.split(".")[1].length : 0;
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / 850);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(
        (from + (number - from) * eased).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }),
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previous.current = number;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, number]);
  return (
    <span className="animated-value" aria-label={value}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
