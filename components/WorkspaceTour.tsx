"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, createContext } from "react";
import { playSfx } from "@/lib/sfx";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

/** Lets a step's own content move the tour (e.g. a step with custom buttons). */
export const TourNav = createContext<{ next: () => void; prev: () => void; close: () => void }>({ next: () => {}, prev: () => {}, close: () => {} });

export type TourStep = {
  title: string;
  body: ReactNode;
  /** optional illustration shown above the title */
  visual?: ReactNode;
  /** CSS selector to spotlight; omitted = centered card */
  target?: string;
  /** puts the workspace into the state this step talks about */
  enter?: () => void;
  /** which screen the step shows; moving to a different screen fades through black */
  screen?: string;
  /** keep the title for screen readers only (the illustration carries the step) */
  hideTitle?: boolean;
  /** render without the card background, directly over the dimmed workspace */
  bare?: boolean;
  /** the step renders its own buttons (via TourNav) instead of the standard Skip / Back / Next row */
  hideActions?: boolean;
  /** a shorter label shown in the progress row */
  label: string;
};

/** Inline highlight pill for tour copy (same tones as the landing page: orange, blue, green, red, neutral, black, NVIDIA). */
export function TourPill({ tone, icon, children }: { tone: "o" | "b" | "g" | "r" | "n" | "k" | "nv"; icon?: ReactNode; children: ReactNode }) {
  return <span className={`ws-pill ${tone}`}>{icon}{children}</span>;
}

type Box = { top: number; left: number; width: number; height: number };

/** Guided walkthrough: each step drives the workspace into a state, spotlights the relevant UI and explains it. */
export default function WorkspaceTour({ steps, open, onClose }: { steps: TourStep[]; open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState({ w: 380, h: 220 });
  const step = steps[index];

  useEffect(() => { if (open) setIndex(0); }, [open]);
  // enter the step's state, then follow its target (it may mount a moment later, e.g. Muse's evidence)
  useEffect(() => {
    if (!open) return;
    playSfx("step");
    steps[index].enter?.();
    setBox(null);
    let frame = 0;
    const started = performance.now();
    const track = () => {
      const selector = steps[index].target;
      const element = selector ? document.querySelector<HTMLElement>(selector) : null;
      const rect = element?.getBoundingClientRect();
      if (rect && rect.width > 4 && rect.height > 4) {
        setBox((prev) => (prev && Math.abs(prev.top - rect.top) < 0.5 && Math.abs(prev.left - rect.left) < 0.5 && Math.abs(prev.width - rect.width) < 0.5 && Math.abs(prev.height - rect.height) < 0.5
          ? prev : { top: rect.top, left: rect.left, width: rect.width, height: rect.height }));
      } else if (performance.now() - started > 8000) setBox(null);
      frame = requestAnimationFrame(track);
    };
    frame = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frame);
    // steps are rebuilt every render; the index is what changes the step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);
  useLayoutEffect(() => {
    if (card.current) setCardSize({ w: card.current.offsetWidth, h: card.current.offsetHeight });
  }, [index, open, box === null]);

  const [fading, setFading] = useState(false);
  const fadeTimers = useRef<number[]>([]);
  useEffect(() => () => fadeTimers.current.forEach(clearTimeout), []);
  const go = useCallback((to: number) => {
    if (fading || to === index) return;
    const from = steps[index]?.screen, dest = steps[to]?.screen;
    if (!from || !dest || from === dest) { setIndex(to); return; }
    // fade to black, switch the workspace while hidden, then fade back in once it has settled
    setFading(true);
    playSfx("whoosh");
    fadeTimers.current.push(window.setTimeout(() => {
      setIndex(to);
      fadeTimers.current.push(window.setTimeout(() => setFading(false), 450));
    }, 340));
  }, [fading, index, steps]);
  const next = useCallback(() => (index < steps.length - 1 ? go(index + 1) : onClose()), [index, steps.length, onClose, go]);
  const prev = useCallback(() => go(Math.max(0, index - 1)), [index, go]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, next, prev, onClose]);
  // focus the card (not the Next button) so keyboard users land in the tour without a glowing ring on Next
  useEffect(() => { if (open) card.current?.focus({ preventScroll: true }); }, [open, index]);

  if (!open || !step) return null;
  const nav = { next, prev, close: onClose };
  const pad = 10, gap = 18, vw = typeof window === "undefined" ? 1440 : innerWidth, vh = typeof window === "undefined" ? 900 : innerHeight;
  const spot = step.target && box ? { top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2 } : null;
  // place the card beside the spotlight where it fits: right, left, below, above, else inside the bottom edge
  let pos: { top: number; left: number } = { top: (vh - cardSize.h) / 2, left: (vw - cardSize.w) / 2 };
  if (spot) {
    const midY = Math.min(Math.max(16, spot.top + spot.height / 2 - cardSize.h / 2), vh - cardSize.h - 16);
    const midX = Math.min(Math.max(16, spot.left + spot.width / 2 - cardSize.w / 2), vw - cardSize.w - 16);
    if (spot.left + spot.width + gap + cardSize.w < vw - 16) pos = { top: midY, left: spot.left + spot.width + gap };
    else if (spot.left - gap - cardSize.w > 16) pos = { top: midY, left: spot.left - gap - cardSize.w };
    else if (spot.top + spot.height + gap + cardSize.h < vh - 16) pos = { top: spot.top + spot.height + gap, left: midX };
    else if (spot.top - gap - cardSize.h > 16) pos = { top: spot.top - gap - cardSize.h, left: midX };
    else pos = { top: vh - cardSize.h - 24, left: midX };
  }
  return (
    <div className="ws-tour" role="dialog" aria-modal="false" aria-labelledby="ws-tour-title" aria-describedby="ws-tour-body">
      {spot ? <div className="ws-tour-spot" style={spot} /> : <div className="ws-tour-dim" />}
      <div className={`ws-tour-fade ${fading ? "on" : ""}`} aria-hidden="true" />
      <TourNav.Provider value={nav}>
      <div ref={card} tabIndex={-1} className={`ws-tour-card ${spot ? "" : "centered"} ${step.bare ? "bare" : ""}`} style={pos} key={index}>
        <div className="ws-tour-meta">
          <span className="mono">{String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")} · {step.label}</span>
          <button className="ws-tour-close" aria-label="End the guided tour" onClick={onClose}><X size={15} /></button>
        </div>
        {step.visual && <div className="ws-tour-visual">{step.visual}</div>}
        <h2 id="ws-tour-title" className={step.hideTitle ? "sr-only" : undefined}>{step.title}</h2>
        {step.body ? <div id="ws-tour-body" className="ws-tour-body">{step.body}</div> : null}
        <div className="ws-tour-progress" aria-hidden="true">{steps.map((_, i) => <i key={i} className={i === index ? "on" : i < index ? "done" : ""} />)}</div>
        {!step.hideActions && <div className="ws-tour-actions">
          <button className="ws-tour-skip" onClick={onClose}>{index === steps.length - 1 ? "Close" : "Skip tour"}</button>
          <span />
          {index > 0 && <button className="ws-tour-back" onClick={prev} aria-label="Previous step"><ArrowLeft size={15} /></button>}
          <button className="ws-tour-next" onClick={next}>{index === steps.length - 1 ? "Explore on your own" : index === 0 ? "Start the tour" : "Next"} <ArrowRight size={15} /></button>
        </div>}
      </div>
      </TourNav.Provider>
    </div>
  );
}
