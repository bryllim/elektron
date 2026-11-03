"use client";
import { useContext, useEffect, useState, type ReactNode } from "react";
import { TourNav, TourPill } from "./WorkspaceTour";
import { setVisitorKey, visitorKey } from "@/lib/visitor-key";
import { MuseMark } from "./StoryMarks";
import { ArrowRight, KeyRound, Lock, Zap, HardHat, MapPin, Check, Box, CloudLightning, CloudRain, Copy, FileText, Link2, Search, Sun, TriangleAlert, Users, WifiOff, ZapOff } from "lucide-react";

/** One simple illustration per guided-tour card. Static and decorative. */
const ink = "#0b0c0a", lime = "#c8f03a", orange = "#f07d1a", blue = "#2f6bff", grey = "#a3a8a2";

function Frame({ children, photo = false }: { children: ReactNode; photo?: boolean }) {
  return <div className={`ws-vis ${photo ? "photo" : ""}`} aria-hidden="true">{children}</div>;
}

/** Expected output vs an actual line that falls away (or, with gap, a baseline vs a what-if branch). */
function DropChart({ gap = false }: { gap?: boolean }) {
  const expected = "M0 80 C60 72 90 30 160 24 C230 18 270 40 320 72";
  const actual = gap ? "M0 80 C60 72 90 30 150 25 C190 22 220 22 250 30 C280 40 300 56 320 72" : "M0 80 C60 72 90 30 140 26 C160 25 168 60 200 62 C240 64 280 68 320 76";
  const stroke = gap ? blue : orange, id = gap ? "vis-fill-b" : "vis-fill-o";
  return (
    <svg viewBox="0 0 320 100" width="100%" height={96} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={stroke} stopOpacity="0.22" /><stop offset="1" stopColor={stroke} stopOpacity="0" /></linearGradient>
      </defs>
      <path d={`${actual} L320 100 L0 100 Z`} fill={`url(#${id})`} />
      {!gap && <path d={expected} fill="none" stroke={ink} strokeOpacity="0.5" strokeWidth="1.6" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />}
      {gap && <path d="M150 25 C190 22 220 22 250 30 L250 64 C220 60 190 60 150 58 Z" fill={lime} opacity="0.6" />}
      <path d={actual} fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {gap && <path d="M150 58 C190 60 220 60 250 64" fill="none" stroke={orange} strokeWidth="2.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

/** A row of large icons, used where the step names a few things side by side. */
function IconRow({ items }: { items: readonly (readonly [typeof Sun, string])[] }) {
  return <div className="ws-vis-icons">{items.map(([I, color], i) => <I key={i} size={30} color={color} strokeWidth={1.6} />)}</div>;
}

export function VisWelcome() {
  return (
    <Frame>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ws-vis-map" src="/story/v4/ph-map.svg" alt="" />
    </Frame>
  );
}
export const VisJob = () => <Frame><DropChart /></Frame>;
export const VisCauses = () => <Frame><IconRow items={[[ZapOff, orange], [CloudRain, blue], [WifiOff, grey]]} /></Frame>;
export function VisAlert() {
  return (
    <Frame>
      <div className="ws-vis-alert">
        <TriangleAlert size={20} color={orange} />
        <div><strong>Silangan Solar</strong><span>INV-07 · output below expected</span></div>
        <b>−54%</b>
      </div>
    </Frame>
  );
}
export function VisPlant() {
  return (
    <Frame photo>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ws-vis-photo" src="/story/v4/solar-aerial.webp" alt="" />
    </Frame>
  );
}
export function VisNumbers() {
  return (
    <Frame>
      <div className="ws-vis-bars">
        <div><span>Expected</span><i style={{ width: "100%", background: ink }} /><b>699 kW</b></div>
        <div><span>Actual</span><i style={{ width: "46%", background: orange }} /><b>322 kW</b></div>
      </div>
    </Frame>
  );
}
export const VisTools = () => <Frame><IconRow items={[[Users, blue], [Sun, orange], [FileText, "#16a34a"]]} /></Frame>;
export function VisEvidence() {
  return (
    <Frame>
      <p className="ws-vis-answer">INV-07 overheated and cut its own output <em><Link2 size={10} />EV-001</em></p>
    </Frame>
  );
}
export const VisWhatIf = () => <Frame><DropChart gap /></Frame>;
export const VisCases = () => <Frame><IconRow items={[[CloudRain, blue], [WifiOff, grey], [CloudLightning, "#e5484d"]]} /></Frame>;
export function VisLoop() {
  const steps = [TriangleAlert, Box, Search, Link2, Copy];
  return (
    <Frame>
      <div className="ws-vis-loop">{steps.map((I, i) => <span key={i}><b><I size={16} /></b>{i < steps.length - 1 && <i />}</span>)}</div>
    </Frame>
  );
}

/** iMessage-style hello: one bubble at a time, a second apart; each new bubble enters at the bottom and pushes the
 * earlier ones up, the way a chat thread scrolls. */
export function VisHello() {
  const pi = { size: 11, strokeWidth: 2.4 };
  const bryl = { who: "Bryl", photo: "/story/team/bryl.webp" }, howard = { who: "Engr. Howard", photo: "/story/team/howard.webp" };
  const items: { from: typeof bryl; line: ReactNode }[] = [
    { from: bryl, line: <>Hi, <strong>I&apos;m Bryl!</strong> We&apos;re so excited to show you <TourPill tone="k" icon={<Zap {...pi} />}>Elektron</TourPill></> },
    { from: bryl, line: <>We&apos;ve been running it with Meta&apos;s <TourPill tone="b" icon={<MuseMark size={11} />}>Muse</TourPill> models, and honestly, it&apos;s <TourPill tone="g">so good</TourPill></> },
    { from: howard, line: <>I&apos;m an <TourPill tone="o" icon={<HardHat {...pi} />}>electrical engineer</TourPill> in the <TourPill tone="g" icon={<MapPin {...pi} />}>Philippines</TourPill>, working with power plants every day.</> },
    { from: howard, line: <>We know these errors <TourPill tone="r" icon={<TriangleAlert {...pi} />}>first hand</TourPill>, and Elektron has been <TourPill tone="g" icon={<Check {...pi} />}>genuinely useful</TourPill></> },
  ];
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(items.length); setDone(true); return; }
    const gap = 1700, start = 450;
    const timers = items.map((_, i) => window.setTimeout(() => setShown(i + 1), start + i * gap));
    // reveal the tour's buttons once the last bubble has settled
    timers.push(window.setTimeout(() => setDone(true), start + (items.length - 1) * gap + 900));
    return () => timers.forEach(clearTimeout);
    // the script is fixed; run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const visible = items.slice(0, shown);
  return (
    <div className={`ws-chat ${done ? "done" : ""}`} data-shown={shown}>
      {visible.map((item, i) => {
        const first = i === 0 || visible[i - 1].from !== item.from;
        const last = i === visible.length - 1 || visible[i + 1].from !== item.from;
        return (
          <div key={i} className={`ws-chat-row ${first ? "first" : ""}`}>
            <div className="ws-chat-row-inner">
              {first && <span className="ws-chat-name">{item.from.who}</span>}
              <div className="ws-chat-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {last ? <img className={first ? "enter" : undefined} src={item.from.photo} alt="" width={30} height={30} /> : <span className="ws-chat-avatar-gap" />}
                <p className={last ? "tail" : ""}>{item.line}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Optional step: paste a Meta Model API key (kept in this browser only) or continue with simulated data. */
export function TourKeyStep() {
  const nav = useContext(TourNav);
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(!!visitorKey()); }, []);
  const save = () => { if (!value.trim()) return; setVisitorKey(value); setValue(""); setSaved(true); nav.next(); };
  return (
    <div className="ws-key">
      {saved ? (
        <div className="ws-key-saved">
          <Check size={15} /> A key is saved in this browser.
          <button type="button" onClick={() => { setVisitorKey(""); setSaved(false); }}>Remove</button>
        </div>
      ) : (
        <form className="ws-key-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <KeyRound size={16} />
          <input type="password" autoComplete="off" spellCheck={false} placeholder="Paste your Meta Model API key" aria-label="Meta Model API key"
            value={value} onChange={(e) => setValue(e.target.value)} />
        </form>
      )}
      <p className="ws-key-note"><Lock size={12} /> Stored only in this browser and sent only with your own requests to Elektron. Never saved on our server.</p>
      <div className="ws-key-actions">
        <button type="button" className="ws-key-skip" onClick={nav.next}>Continue with simulated data</button>
        {saved
          ? <button type="button" className="ws-tour-next" onClick={nav.next}>Continue <ArrowRight size={15} /></button>
          : <button type="button" className="ws-tour-next" onClick={save} disabled={!value.trim()}>Save key &amp; continue <ArrowRight size={15} /></button>}
      </div>
    </div>
  );
}
