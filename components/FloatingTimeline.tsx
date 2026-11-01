"use client";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent,
  type KeyboardEvent,
} from "react";
import { GripVertical } from "lucide-react";

type Position = { x: number; y: number };
type Drag = {
  id: number;
  x: number;
  y: number;
  offset: Position;
  left: number;
  top: number;
  width: number;
  height: number;
  bounds: { left: number; top: number; right: number; bottom: number };
};

/** Move only the transport, without rendering the simulation on every pointer move. */
export default function FloatingTimeline({
  minimized,
  children,
}: {
  minimized: boolean;
  children: ReactNode;
}) {
  const dock = useRef<HTMLDivElement>(null),
    bar = useRef<HTMLDivElement>(null);
  const offset = useRef<Position>({ x: 0, y: 0 }),
    drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState(false);
  function bounds() {
    const agent = document.querySelector<HTMLElement>(".agent-panel.is-open");
    const sidebar = document.querySelector<HTMLElement>(".sidebar");
    const agentLeft =
      agent && getComputedStyle(agent).display !== "none"
        ? innerWidth - agent.offsetWidth
        : innerWidth;
    return {
      left: Math.max(8, sidebar?.getBoundingClientRect().right ?? 8) + 8,
      top: 8,
      right:
        innerWidth > 640 ? Math.min(innerWidth, agentLeft) - 8 : innerWidth - 8,
      bottom: innerHeight - 8,
    };
  }
  function apply(next: Position) {
    offset.current = next;
    if (dock.current)
      dock.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
  }
  function clamp() {
    if (!bar.current || drag.current) return;
    const rect = bar.current.getBoundingClientRect(),
      b = bounds();
    const left = Math.max(b.left, Math.min(rect.left, b.right - rect.width));
    const top = Math.max(b.top, Math.min(rect.top, b.bottom - rect.height));
    apply({
      x: offset.current.x + left - rect.left,
      y: offset.current.y + top - rect.top,
    });
  }
  useLayoutEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(clamp);
    };
    const observer = new ResizeObserver(schedule);
    if (bar.current) observer.observe(bar.current);
    if (dock.current) observer.observe(dock.current);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  function start(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 || !bar.current) return;
    const r = bar.current.getBoundingClientRect();
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      offset: { ...offset.current },
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      bounds: bounds(),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const b = d.bounds;
    const dx = Math.max(
      b.left - d.left,
      Math.min(e.clientX - d.x, b.right - d.left - d.width),
    );
    const dy = Math.max(
      b.top - d.top,
      Math.min(e.clientY - d.y, b.bottom - d.top - d.height),
    );
    apply({ x: d.offset.x + dx, y: d.offset.y + dy });
  }
  function stop() {
    drag.current = null;
    setDragging(false);
    clamp();
  }
  function keyboard(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Home") {
      e.preventDefault();
      apply({ x: 0, y: 0 });
      clamp();
      return;
    }
    const directions: Record<string, Position> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const direction = directions[e.key];
    if (!direction) return;
    e.preventDefault();
    const step = e.shiftKey ? 40 : 10;
    apply({
      x: offset.current.x + direction.x * step,
      y: offset.current.y + direction.y * step,
    });
    clamp();
  }
  return (
    <div
      ref={dock}
      className={`playback-dock ${dragging ? "is-dragging" : ""}`}
    >
      <div
        ref={bar}
        className={`playback-bar ${minimized ? "is-minimized" : ""}`}
        aria-label="Simulation playback"
      >
        <button
          className="timeline-drag-handle"
          aria-label="Move simulation timeline"
          title="Drag to move. Arrow keys to nudge. Double-click or Home to reset."
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          onKeyDown={keyboard}
          onDoubleClick={() => {
            apply({ x: 0, y: 0 });
            clamp();
          }}
        >
          <GripVertical size={15} />
        </button>
        {children}
      </div>
    </div>
  );
}
