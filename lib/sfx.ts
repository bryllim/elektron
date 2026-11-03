/** Synthesized UI sounds (Web Audio, no files). Browsers only allow audio after a user gesture, so nothing plays
 * until unlockSfx() runs inside a tap or click. Muting is remembered in localStorage. */

type Sound = "hover" | "click" | "open" | "close" | "step" | "whoosh" | "pop" | "success" | "boot" | "receive";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let lastHover = 0;
const STORAGE = "elektron-sfx";
export const SFX_EVENT = "elektron-sfx";

if (typeof window !== "undefined") {
  try { muted = localStorage.getItem(STORAGE) === "off"; } catch {}
}

export function sfxMuted() { return muted; }
export function setSfxMuted(value: boolean) {
  muted = value;
  try { localStorage.setItem(STORAGE, value ? "off" : "on"); } catch {}
  window.dispatchEvent(new Event(SFX_EVENT));
}

/** Create or resume the audio context. Call from a user gesture. */
export function unlockSfx() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.32;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}
export function sfxReady() { return !!ctx && ctx.state === "running"; }

function tone(freq: number, dur: number, { type = "sine" as OscillatorType, gain = 0.2, attack = 0.004, to, delay = 0 }: { type?: OscillatorType; gain?: number; attack?: number; to?: number; delay?: number } = {}) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t); osc.stop(t + dur + 0.02);
}

function noise(dur: number, { gain = 0.12, from = 400, to = 2400, q = 0.9, delay = 0 } = {}) {
  if (!ctx || !master) return;
  const t = ctx.currentTime + delay;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buffer;
  filter.type = "bandpass"; filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
  filter.frequency.exponentialRampToValueAtTime(from * 0.8, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t); src.stop(t + dur + 0.02);
}

export function playSfx(sound: Sound) {
  if (muted || !ctx || ctx.state !== "running") return;
  switch (sound) {
    case "hover": {
      const now = performance.now();
      if (now - lastHover < 45) return;
      lastHover = now;
      tone(2400, 0.035, { gain: 0.035, attack: 0.002 });
      break;
    }
    case "click":
      tone(1250, 0.06, { type: "triangle", gain: 0.13, to: 720 });
      noise(0.03, { gain: 0.05, from: 3000, to: 5000, q: 2 });
      break;
    case "open":
      tone(660, 0.12, { type: "triangle", gain: 0.1 });
      tone(990, 0.16, { type: "triangle", gain: 0.09, delay: 0.06 });
      break;
    case "close":
      tone(880, 0.1, { type: "triangle", gain: 0.09 });
      tone(587, 0.14, { type: "triangle", gain: 0.08, delay: 0.05 });
      break;
    case "step":
      tone(784, 0.3, { gain: 0.09, attack: 0.008 });
      tone(1175, 0.36, { gain: 0.05, attack: 0.012, delay: 0.02 });
      break;
    case "whoosh":
      noise(0.42, { gain: 0.09, from: 300, to: 2200, q: 0.7 });
      break;
    case "pop":
      tone(520, 0.11, { gain: 0.16, to: 980, attack: 0.003 });
      tone(1960, 0.05, { gain: 0.03, delay: 0.02 });
      break;
    case "success":
      [523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.28, { type: "triangle", gain: 0.09, delay: i * 0.07 }));
      break;
    case "receive":
      tone(1046.5, 0.18, { gain: 0.07 });
      tone(1568, 0.26, { gain: 0.05, delay: 0.08 });
      break;
    case "boot":
      [261.63, 392, 523.25, 783.99].forEach((f, i) => tone(f, 0.9, { type: "sine", gain: 0.07, attack: 0.08, delay: i * 0.06 }));
      noise(0.6, { gain: 0.04, from: 600, to: 3200, q: 0.6 });
      break;
  }
}

const CLICKABLE = 'button, a[href], summary, select, label[for], [role="button"], [role="tab"], [role="option"], [role="switch"], input[type="checkbox"], input[type="radio"], .map-site';

/** Hover ticks and click sounds for every clickable element on the page. Returns a cleanup function. */
export function installSfx() {
  let hovered: Element | null = null;
  const clickable = (target: EventTarget | null) => {
    const el = (target as Element | null)?.closest?.(CLICKABLE) ?? null;
    if (!el || el.matches(":disabled, [aria-disabled='true']")) return null;
    return el;
  };
  const over = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const el = clickable(e.target);
    if (el && el !== hovered) playSfx("hover");
    hovered = el;
  };
  const down = (e: PointerEvent) => {
    unlockSfx();
    if (clickable(e.target)) playSfx("click");
  };
  const key = (e: KeyboardEvent) => {
    unlockSfx();
    if ((e.key === "Enter" || e.key === " ") && clickable(e.target)) playSfx("click");
  };
  document.addEventListener("pointerover", over, true);
  document.addEventListener("pointerdown", down, true);
  document.addEventListener("keydown", key, true);
  return () => {
    document.removeEventListener("pointerover", over, true);
    document.removeEventListener("pointerdown", down, true);
    document.removeEventListener("keydown", key, true);
  };
}
