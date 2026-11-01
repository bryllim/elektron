"use client";
import { useEffect, useRef } from "react";
import {
  satelliteFrameMinute,
  stormField,
  stormState,
  stormTrack,
} from "@/lib/typhoon";
import { timeLabel } from "@/lib/simulation";
export type SatelliteBand = "infrared" | "wind";
const project = (lon: number, lat: number) => [
  (lon - 115.5) * 48,
  (21 - lat) * 32,
];
export default function SatelliteLayer({
  minute,
  band,
}: {
  minute: number;
  band: SatelliteBand;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    frame = satelliteFrameMinute(minute);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const w = 410,
      h = 275,
      pixels = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const field = stormField(
            115.5 + (x * 2) / 48,
            21 - (y * 2) / 32,
            frame,
          ),
          i = (y * w + x) * 4;
        const v =
          band === "infrared" ? field.cloud : Math.min(1, field.wind / 46);
        const texture =
          0.94 +
          0.06 *
            Math.sin(x * 0.53 + Math.sin(y * 0.32) * 3) *
            Math.cos(y * 0.61);
        const hot = Math.max(0, (v - 0.65) / 0.35);
        pixels.data[i] =
          (band === "wind" ? 65 + 185 * v : 160 + 80 * hot) * texture;
        pixels.data[i + 1] =
          (band === "wind" ? 130 + 45 * v : 185 - 35 * hot) * texture;
        pixels.data[i + 2] =
          (band === "wind" ? 170 - 105 * v : 198 - 100 * hot) * texture;
        pixels.data[i + 3] =
          Math.max(0, v - (band === "wind" ? 0.12 : 0.06)) * 235;
      }
    ctx.putImageData(pixels, 0, 0);
  }, [frame, band]);
  const eye = stormState(frame),
    [x, y] = project(eye.lon, eye.lat);
  const labelX = Math.min(x + 17, 680);
  const track = stormTrack
    .map((p) => project(p.lon, p.lat).join(","))
    .join(" ");
  const passed = stormTrack
    .filter((p) => p.minute < frame)
    .concat(eye)
    .map((p) => project(p.lon, p.lat).join(","))
    .join(" ");
  return (
    <g className="satellite-overlay" pointerEvents="none">
      <foreignObject x="0" y="0" width="820" height="550">
        <canvas
          ref={canvas}
          width={410}
          height={275}
          style={{ width: "100%", height: "100%" }}
          aria-hidden="true"
        />
      </foreignObject>
      <polyline
        points={track}
        fill="none"
        stroke="#d9ba84"
        strokeWidth="1.3"
        strokeDasharray="5 6"
        opacity=".7"
      />
      <polyline points={passed} fill="none" stroke="#f0d8a9" strokeWidth="2" />
      {stormTrack.map((p, i) => {
        const [px, py] = project(p.lon, p.lat);
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r="2.5"
            fill="#181c1e"
            stroke="#d9ba84"
          />
        );
      })}
      <ellipse
        cx={x}
        cy={y}
        rx={(eye.radius / 111 / Math.cos((eye.lat * Math.PI) / 180)) * 48}
        ry={(eye.radius / 111) * 32}
        stroke="#d9ba84"
        strokeDasharray="2 6"
        fill="none"
        opacity=".35"
      />
      <circle
        cx={x}
        cy={y}
        r="9"
        stroke="#fff2d7"
        fill="#101516"
        strokeWidth="1.5"
      />
      <path
        d={`M${x - 15} ${y}h8 M${x + 7} ${y}h8 M${x} ${y - 15}v8 M${x} ${y + 7}v8`}
        stroke="#fff2d7"
      />
      <rect
        x={labelX}
        y={y - 32}
        width="124"
        height="33"
        rx="3"
        fill="#0d1218"
        opacity=".9"
      />
      <text
        x={labelX + 7}
        y={y - 19}
        fill="#e8d6b3"
        fontSize="8"
        fontFamily="monospace"
      >
        SIM-01 · {timeLabel(frame)}
      </text>
      <text
        x={labelX + 7}
        y={y - 7}
        fill="#a7b1b8"
        fontSize="7"
        fontFamily="monospace"
      >
        SYNTHETIC STORM CENTER
      </text>
    </g>
  );
}
