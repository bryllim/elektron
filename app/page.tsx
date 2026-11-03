import type { Metadata } from "next";
import { Children, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from "react";
import {
  ArrowRight, ArrowUpRight, Check, Menu, TrendingDown, MapPin, ZapOff, CloudRain, WifiOff, Truck, Box,
  Zap, Sun, FileText, Thermometer, Flame, Activity, Clock, Copy, Lock, CloudLightning, Wind, HelpCircle,
  Wrench, LayoutGrid, ShieldCheck,
} from "lucide-react";
import StoryInvestigation from "@/components/StoryInvestigation";
import StoryMotion from "@/components/StoryMotion";
import StoryHero from "@/components/StoryHero";
import StoryFilm from "@/components/StoryFilm";
import StoryLoop from "@/components/StoryLoop";
import { ElektronMark, MuseMark, NvidiaMark } from "@/components/StoryMarks";
import { storyCases } from "@/lib/story-cases";
import "./story.css";

export const metadata: Metadata = {
  title: "Elektron — Find the cause. Test the fix.",
  description:
    "Built alongside electrical engineers and power plants in the Philippines, Elektron investigates renewable power drops with Muse, evidence and a 3D digital twin. Official entry, Meta Global AI Developer Hackathon. Fictional fleet, simulated operations.",
};

type Tone = "o" | "b" | "g" | "r" | "n" | "k" | "nv";
function Pill({ tone, icon, children, tail }: { tone: Tone; icon?: ReactNode; children: ReactNode; tail?: string }) {
  const pill = <span className={`story-pill ${tone}`}>{icon}{children}</span>;
  // keep trailing punctuation on the same line as its pill
  return tail ? <span className="story-nowrap">{pill}{tail}</span> : pill;
}
const I = { size: 16, strokeWidth: 2.2 } as const;

/** Film-style word-by-word blur fade: split text into .story-w words (pills and other components stay one word);
 * plain HTML wrappers such as <span className="story-mut"> are kept and their text split too. --w orders the words. */
function blurWords(node: ReactNode, n = { i: 0 }): ReactNode {
  return Children.map(node, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      return String(child).split(/(\s+)/).map((part, k) => (!part || /^\s+$/.test(part) ? part : <span key={k} className="story-w" style={{ "--w": n.i++ } as CSSProperties}>{part}</span>));
    }
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<{ children?: ReactNode }>;
    if (element.type === "br") return element;
    if (typeof element.type === "string") return cloneElement(element, undefined, blurWords(element.props.children, n));
    return <span className="story-w" style={{ "--w": n.i++ } as CSSProperties}>{element}</span>;
  });
}
function K({ children }: { children: ReactNode }) { return <>{blurWords(children)}</>; }

/* Scroll effects (see StoryMotion + story.css):
 * data-reveal="up|left|right|zoom|tilt|rise|clip|wipe" animates a block in once it scrolls into view;
 * data-stagger staggers its direct children; data-count counts a number up; .story-draw paths draw. */
export default function Page() {
  const cases = storyCases();
  const inverter = cases[0].reading;
  const actual = Math.round(inverter.actual!), expected = Math.round(inverter.expected), temp = inverter.temperature?.toFixed(1);
  return (
    <div className="project-story">
      <StoryMotion />
      <div className="story-progress" aria-hidden="true" />
      <a className="story-skip" href="#the-story">Skip to the project story</a>
      <header className="story-header">
        <a href="/" className="story-brand" aria-label="Elektron project home"><ElektronMark size={26} />ELEKTRON</a>
        <nav aria-label="Project navigation">
          <a href="#the-story">The story</a>
          <a href="#investigation">The investigation</a>
          <a href="#twin">3D twin</a>
          <a href="#what-if">What-if</a>
        </nav>
        <div className="story-nav-actions">
          <a href="/workspace" className="story-launch">Try the demo <ArrowUpRight size={16} strokeWidth={1.5} /></a>
          <details className="story-mobile-nav">
            <summary aria-label="Open project navigation"><Menu size={16} strokeWidth={1.5} /></summary>
            <nav aria-label="Mobile project navigation">
              <a href="#the-story">The story</a><a href="#investigation">The investigation</a><a href="#twin">3D twin</a><a href="#what-if">What-if</a>
            </nav>
          </details>
        </div>
      </header>

      <main>
        {/* Hero: the film's black-and-lime-glow title card */}
        <section className="story-hero story-glow" aria-labelledby="project-title" data-scroll="glow">
          <div className="story-hero-copy" data-reveal="up" data-stagger>
            <h1 id="project-title" data-scroll="lift"><K>When output <Pill tone="o" icon={<TrendingDown {...I} />}>drops</Pill><span>know why before the truck rolls</span></K></h1>
            <p className="story-hero-description"><K>A failing inverter, a passing cloud and a dead sensor look the same on a chart. <Pill tone="b" icon={<MuseMark size={16} color="currentColor" />}>Muse</Pill> checks the weather, the neighbors and the controller log, names the cause with evidence, and tests the fix on a copy of the plant.</K></p>
            <div className="story-hero-actions">
              <a href="/workspace?case=derating" className="story-primary">Investigate the drop <ArrowRight size={16} strokeWidth={1.5} /></a>
              <StoryFilm />
            </div>
          </div>
          <a className="story-badge" data-reveal="up" href="https://cerebralvalley.ai/e/meta-ai-developer-hackathon" target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/sponsors/meta-mark.svg" alt="" width={22} height={14} />Official entry · Meta Global AI Developer Hackathon<ArrowUpRight size={14} strokeWidth={1.8} />
          </a>
          <div data-reveal="rise" data-scroll="grow"><StoryHero /></div>
          <ul className="story-sponsors" aria-label="Hackathon sponsors" data-reveal="up" data-stagger>
            {[["Meta", "meta", "https://www.meta.com/"], ["Baseten", "baseten", "https://www.baseten.co/"], ["Modal", "modal", "https://modal.com/"], ["Fireworks", "fireworks", "https://fireworks.ai/"]].map(([name, logo, url]) => (
              <li key={name}><a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${name} website`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/logos/sponsors/${logo}.svg`} alt={name} width={140} height={32} loading="lazy" />
              </a></li>
            ))}
          </ul>
        </section>

        {/* 1 · Who we are (white, map) */}
        <section className="story-scene story-paper" id="the-story">
          <div className="story-wrap story-split">
            <div data-reveal="left" data-stagger>
              <span className="story-label">Why we built it</span>
              <h2 data-scroll="drift"><K>We work with electrical engineers and power plants in the <Pill tone="g" icon={<MapPin {...I} />}>Philippines</Pill></K></h2>
              <p className="story-lead"><K>We keep renewable power plants running on regions across <Pill tone="g" icon={<MapPin {...I} />} tail=",">Luzon</Pill> <Pill tone="g" icon={<MapPin {...I} />} tail=",">Visayas</Pill> and <Pill tone="g" icon={<MapPin {...I} />} tail=".">Mindanao</Pill></K></p>
            </div>
            <figure className="story-map" data-reveal="zoom" data-scroll="float">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/story/v4/ph-map.svg" alt="Map of the Philippines with Elektron's eight simulated sites" />
              <figcaption><strong className="story-mono" data-count="136">136</strong><span>MW</span><em>8 sites · solar, wind, geothermal and hydro</em></figcaption>
            </figure>
          </div>
        </section>

        {/* 2 · The drop (black glow, live line) */}
        <section className="story-scene story-black story-glow" data-scroll="glow">
          <div className="story-wrap story-drop" data-reveal="up">
            <div className="story-drop-tag"><i />INV-07 · <Pill tone="g" icon={<Sun {...I} />}>Silangan Solar</Pill></div>
            <div className="story-drop-number" data-scroll="drift-r"><span className="story-mono" data-count={actual} data-from={expected}>{actual}</span><small>kW</small><em>expected {expected} kW</em></div>
            <svg data-scroll="grow" className="story-drop-chart" viewBox="0 0 1000 260" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 40 H1000" className="expected" />
              <path d="M0 44 C60 38 120 50 180 42 S300 36 360 46 S480 40 540 44 L560 44" className="before story-draw" pathLength={1} />
              <path d="M560 44 C574 44 578 190 600 196 S640 210 680 202 S800 200 860 206 S960 200 1000 204" className="after story-draw late" pathLength={1} />
              <circle cx="1000" cy="204" r="9" className="head" />
            </svg>
            <h2><K>Every day, something drops.<br /><span className="story-mut">And we have to find out why.</span></K></h2>
          </div>
        </section>

        {/* 3 · Three causes (white cards), then the interactive investigation */}
        <section className="story-scene story-paper" id="investigation">
          <div className="story-wrap">
            <h2 className="story-center" data-reveal="up" data-scroll="drift"><K>A drop like this has <Pill tone="o" icon={<HelpCircle {...I} />}>three possible causes</Pill></K></h2>
            <div className="story-causes" data-reveal="rise" data-stagger data-scroll="lift">
              {([["A failing inverter", ZapOff, "#ffb547", "#e07a00", "M20 40 H200 C220 40 222 110 240 110 H420"], ["Clouds or rain", CloudRain, "#4aa3ff", "#1f7ae0", "M20 40 H150 C200 40 220 110 260 110 C300 110 320 40 360 40 H420"], ["A sensor that went quiet", WifiOff, "#8b928c", "#5d635e", "M20 40 H190 M190 40 V122 H310 M310 40 H420"]] as const).map(([title, Icon, color, ink, path]) => (
                <article key={title} className="story-cause">
                  <span className="story-cause-icon" style={{ background: `${color}26`, color: ink }}><Icon size={26} strokeWidth={2.2} /></span>
                  <h3>{title}</h3>
                  <svg className="story-spark" viewBox="0 0 440 150" aria-hidden="true"><path d={path} stroke={color} className="story-draw" pathLength={1} /></svg>
                </article>
              ))}
            </div>
            <p className="story-center story-caption" data-reveal="up"><K>On a chart, they all look <Pill tone="n" icon={<Activity {...I} />}>the same</Pill>. Pick one to read the evidence.</K></p>
            <div className="story-investigation-wrap" data-reveal="tilt"><StoryInvestigation cases={cases} /></div>
          </div>
        </section>

        {/* 4 · Guess wrong (lime) */}
        <section className="story-scene story-lime">
          <div className="story-wrap">
            <h2 className="story-huge" data-reveal="clip" data-scroll="drift-far"><K>Guess wrong, and a crew <Pill tone="k" icon={<Truck {...I} />}>drives hours</Pill> to a site <span className="story-mut">where nothing is broken.</span></K></h2>
            <div className="story-road" data-reveal="wipe" aria-hidden="true"><i /><Truck size={36} strokeWidth={2} fill="#0b0c0a" /></div>
          </div>
        </section>

        {/* 5 · 3D twin (black bento of renders) */}
        <section className="story-scene story-black" id="twin">
          <div className="story-wrap">
            <div className="story-intro" data-reveal="up" data-stagger>
              <h2 data-scroll="drift"><K>Every plant becomes a <Pill tone="b" icon={<Box {...I} />}>live 3D twin</Pill></K></h2>
              <div><Pill tone="nv" icon={<NvidiaMark size={18} />}>Powered by NVIDIA SimReady</Pill></div>
            </div>
            <div className="story-render-grid" data-reveal="clip" data-stagger>
              <figure className="big" data-scroll="parallax"><StoryLoop src="/story/v4/wind-hero.mp4" poster="/story/v4/wind-hero.webp" label="3D wind turbine twin" /><figcaption><b>WTG-03</b><span className="story-mono">11.8 m/s · 2.4 MW</span></figcaption></figure>
              <figure data-scroll="parallax"><StoryLoop src="/story/v4/solar-aerial.mp4" poster="/story/v4/solar-aerial.webp" label="3D solar plant twin, aerial" /><figcaption><b>Silangan Solar</b><span className="story-mono">12 inverters</span></figcaption></figure>
              <figure data-scroll="parallax"><StoryLoop src="/story/v4/geo.mp4" poster="/story/v4/geo.webp" label="3D geothermal plant twin" /><figcaption><b>Bukal Geothermal</b><span className="story-mono">cooling towers · powerhouse</span></figcaption></figure>
            </div>
          </div>
        </section>

        {/* 6 · The alert (white, demo UI) */}
        <section className="story-scene story-paper">
          <div className="story-wrap">
            <div className="story-app" data-reveal="tilt" data-scroll="grow" aria-label="Elektron workspace, Silangan Solar inverter view (illustration)">
              <div className="story-app-top"><ElektronMark size={20} /><b>ELEKTRON</b><span>/ Hiraya Renewables /</span><span className="on">Silangan Solar</span><span className="spacer" /><span className="live"><i />Simulated · 13:42 PHT</span></div>
              <div className="story-app-body">
                <div className="story-app-head"><h3>Silangan Solar</h3><span>Nueva Ecija, Luzon · 12 inverters</span></div>
                <div className="story-app-zones">
                  <span className="story-app-label">Inverter zones · output vs expected</span>
                  <div className="bars" data-stagger>{Array.from({ length: 12 }, (_, i) => <div key={i} className={i === 6 ? "hot" : ""}><i style={{ height: i === 6 ? "46%" : `${92 + ((i * 37) % 7)}%` }} /><span>{String(i + 1).padStart(2, "0")}</span></div>)}</div>
                </div>
                <div className="story-app-line">
                  <span className="story-app-label">INV-07 output · kW</span>
                  <svg viewBox="0 0 600 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26 H600" className="exp" /><path d="M0 28 C40 24 80 32 120 27 S240 24 300 29 S340 27 372 28 L378 104" className="pre story-draw" pathLength={1} /><path d="M378 104 C420 100 460 108 500 102 S570 106 600 103" className="post story-draw late" pathLength={1} /></svg>
                </div>
                <div className="story-app-insp">
                  <span className="story-app-label">Equipment inspector</span>
                  <div className="story-mono id">INV-07</div>
                  <div className="state"><i />Derating</div>
                  <div className="story-mono kw"><span data-count={actual} data-from={expected}>{actual}</span><small>kW actual</small></div>
                  <dl>
                    <div><dt>Expected output</dt><dd>{expected} kW</dd></div>
                    <div><dt>Internal temperature</dt><dd className="warn">{temp} °C</dd></div>
                    <div><dt>Data quality</dt><dd>Good · current</dd></div>
                    <div><dt>Thermal derating event</dt><dd>13:15 PHT</dd></div>
                  </dl>
                  <a href="/workspace?case=derating" className="story-app-btn">Investigate cause <ArrowRight size={16} strokeWidth={2} /></a>
                </div>
              </div>
            </div>
            <h2 className="story-caption-lg" data-reveal="up" data-scroll="drift-r"><K>The alert: <Pill tone="o" icon={<Zap {...I} />}>INV-07</Pill> is making <Pill tone="r" icon={<TrendingDown {...I} />}>half the power</Pill> of the inverters next to it. <span className="story-mut">Same sun, same panels.</span></K></h2>
          </div>
        </section>

        {/* 7 · Take it apart (black, explode render) */}
        <section className="story-scene story-black" id="evidence">
          <div className="story-wrap story-split story-explode">
            <div data-reveal="left" data-stagger>
              <h2 data-scroll="drift"><K>Take it apart in 3D, and find the part that&apos;s <Pill tone="r" icon={<Flame {...I} />}>running hot</Pill></K></h2>
              <p className="story-lead"><K><Pill tone="r" icon={<Thermometer {...I} />}>{temp} °C</Pill> inside, output cut to <Pill tone="o" icon={<TrendingDown {...I} />} tail=".">{actual} kW</Pill></K></p>
              <ul className="story-parts" data-stagger>
                {["Cooling fans", "Copper busbars", "DC capacitors", "Control board", "Filter inductors"].map((part) => <li key={part}><i />{part}</li>)}
                <li className="hot"><i />Power module 2 <small>Running hot</small></li>
              </ul>
            </div>
            <figure className="story-render" data-reveal="right" data-scroll="parallax"><StoryLoop src="/story/v4/explode.mp4" poster="/story/v4/explode.webp" label="Exploded 3D view of the inverter; the middle power module glows hot" /></figure>
          </div>
        </section>

        {/* 8 · What-if (lime) */}
        <section className="story-scene story-lime" id="what-if">
          <div className="story-wrap story-whatif">
            <div data-reveal="left" data-stagger>
              <h2><K>Before we send anyone,<br />we <Pill tone="k" icon={<Activity {...I} />}>test the fix</Pill></K></h2>
              <p className="story-lead"><K>Cooling it down for <Pill tone="k" icon={<Clock {...I} />}>30 minutes</Pill> costs <Pill tone="k" icon={<TrendingDown {...I} />} tail=".">0.156 MWh</Pill> The test runs on a <Pill tone="k" icon={<Copy {...I} />} tail=".">copy</Pill> Live data stays <Pill tone="k" icon={<Lock {...I} />} tail=".">untouched</Pill></K></p>
            </div>
            <div className="story-whatif-ui" data-reveal="right" data-scroll="float">
              <div className="chart">
                <span className="btn">Try a 30-min outage</span>
                <svg viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true">
                  <rect x="270" y="10" width="90" height="280" className="win" />
                  <path d="M20 280 C120 120 220 40 270 36 L274 150 L356 150 L360 34 C400 44 480 120 580 280" className="alt story-draw late" pathLength={1} />
                  <path d="M20 280 C120 120 220 40 300 32 S480 120 580 280" className="base story-draw" pathLength={1} />
                </svg>
                <div className="ticks story-mono"><span>06:00</span><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div>
              </div>
              <div className="vals" data-stagger>
                <div><span>Baseline</span><b className="story-mono"><span data-count="3.832">3.832</span><small> MWh</small></b></div>
                <div><span>With outage</span><b className="story-mono"><span data-count="3.676">3.676</span><small> MWh</small></b></div>
                <div className="dark"><span>Difference</span><b className="story-mono"><span data-count="-0.156">−0.156</span><small> MWh</small></b></div>
              </div>
            </div>
          </div>
        </section>

        {/* 9 · Not every drop is a fault (white tiles) */}
        <section className="story-scene story-paper">
          <div className="story-wrap">
            <h2 className="story-center" data-reveal="up" data-scroll="drift"><K>Not every drop is a fault</K></h2>
            <div className="story-tiles" data-reveal="rise" data-stagger>
              <article>
                <figure data-scroll="parallax">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/story/v4/rain.webp" alt="3D solar plant in heavy rain" /><dl className="story-readout"><div><dt>Rain</dt><dd className="story-mono">18 mm/h</dd></div><div><dt>Sunlight</dt><dd className="story-mono">−31%</dd></div><div><dt>Equipment</dt><dd className="story-mono ok">normal</dd></div></dl></figure>
                <h3><K>Rain drops output too. Muse checks the <Pill tone="b" icon={<CloudRain {...I} />}>weather</Pill> first. <Pill tone="g" icon={<Check {...I} />}>Not a fault</Pill></K></h3>
              </article>
              <article>
                <figure className="story-gap"><span>INV-04 · output kW</span><svg viewBox="0 0 400 200" aria-hidden="true"><rect x="160" y="20" width="110" height="160" className="hole" /><path d="M10 90 C40 70 70 110 100 84 S150 96 160 92" className="line story-draw" pathLength={1} /><path d="M270 96 C300 80 330 110 360 88 S390 92 396 90" className="line story-draw late" pathLength={1} /><path d="M10 180 H396" className="zero" /><text x="172" y="60">No data</text><text x="172" y="80">unknown</text></svg></figure>
                <h3><K>When a sensor goes quiet, Elektron marks it <Pill tone="n" icon={<HelpCircle {...I} />} tail=",">unknown</Pill> not <Pill tone="r">zero</Pill></K></h3>
              </article>
              <article>
                <figure data-scroll="parallax"><StoryLoop src="/story/v4/storm-iso.mp4" poster="/story/v4/storm-iso.webp" label="Isometric 3D wind farm in a typhoon" /><ol className="story-rank"><li><span>Amihan Wind</span><b className="story-mono hit">39.6 m/s</b></li><li><span>Silangan Solar</span><b className="story-mono">23.5 m/s</b></li><li><span>Bukal Geothermal</span><b className="story-mono">13.2 m/s</b></li></ol></figure>
                <h3><K>Above <Pill tone="r" icon={<Wind {...I} />}>25 m/s</Pill> turbines park. Elektron replays the storm and ranks which sites get <Pill tone="r" icon={<CloudLightning {...I} />}>hit hardest</Pill></K></h3>
                <small>Simulated storm field · not an observation</small>
              </article>
            </div>
          </div>
        </section>

        {/* 10 · Handover (white doc) */}
        <section className="story-scene story-paper story-tight">
          <div className="story-wrap story-split story-handover">
            <h2 data-reveal="left" data-scroll="drift"><K>At shift change, the next engineer gets the <Pill tone="b" icon={<Check {...I} />} tail=",">answer</Pill> the <Pill tone="o" icon={<FileText {...I} />}>evidence</Pill> and the <Pill tone="g" icon={<Activity {...I} />}>test</Pill></K></h2>
            <div className="story-doc" data-reveal="rise" data-stagger data-scroll="spin">
              <div className="head"><ElektronMark size={38} /><b>Shift handover</b></div>
              {[["Summary", "INV-07 localized thermal derating"], ["Evidence", "EV-001 · EV-002 · EV-003 · EV-004"], ["What-if", "30-min outage · −0.156 MWh"], ["Next step", "Inspect ventilation before dispatch"], ["Status", "Simulated · operator review"]].map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}
              <a href="/workspace?case=derating" className="dl">Open the case file <ArrowUpRight size={16} strokeWidth={2} /></a>
            </div>
          </div>
        </section>

        {/* 11 · Bento (black) */}
        <section className="story-scene story-black">
          <div className="story-wrap">
            <div className="story-bento" data-reveal="zoom" data-stagger>
              <article className="muse" data-scroll="bob"><span className="story-muse-tile big"><MuseMark size={56} /></span><h3>Muse</h3><p>Spark for speed. Wonder for depth.</p></article>
              <article className="img" data-scroll="bob">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/story/v4/geo.webp" alt="" /><div><Box size={26} strokeWidth={1.8} /><h3>3D twins</h3><p>Solar, wind and geothermal on one clock</p></div></article>
              <article data-scroll="bob"><Wrench size={26} strokeWidth={1.8} /><h3 className="num" data-count="13">13</h3><p>read-only tools Muse can call</p><div className="grid">{Array.from({ length: 13 }, (_, i) => <i key={i} style={{ transitionDelay: `${600 + i * 70}ms` }} />)}</div></article>
              <article data-scroll="bob"><LayoutGrid size={26} strokeWidth={1.8} /><h3>Deterministic engine</h3><p>Calculates every number. The model never invents one.</p></article>
              <article data-scroll="bob"><FileText size={26} strokeWidth={1.8} /><h3>Evidence IDs</h3><p>Every claim links to its source</p><code>EV-001 INV-07 output {actual} kW</code></article>
              <article data-scroll="bob"><h3 className="num" data-count="18">18</h3><p>tool calls over 7 rounds</p></article>
              <article className="light" data-scroll="bob"><ShieldCheck size={26} strokeWidth={1.8} /><h3>No equipment controls</h3><p>It advises. People decide.</p></article>
            </div>
            <h2 className="story-caption-lg" data-reveal="up" data-scroll="drift-r"><K><Pill tone="b" icon={<MuseMark size={16} color="currentColor" />}>Muse</Pill> reasons. The <Pill tone="n" icon={<Activity {...I} />}>engine</Pill> calculates. <span className="story-mut">You decide.</span></K></h2>
          </div>
        </section>

        {/* End card (black glow, like the film) */}
        <section className="story-closing story-glow" data-scroll="glow">
          <div className="story-endmark" data-reveal="zoom" data-scroll="grow"><ElektronMark size={96} /><span>Elektron</span></div>
          <p className="story-endline" data-reveal="up"><K>Official entry · Meta Global AI Developer Hackathon</K></p>
          <div className="story-closing-actions" data-reveal="up">
            <a href="/workspace?case=derating" className="story-primary">Investigate the power drop <ArrowUpRight size={16} strokeWidth={1.5} /></a>
            <a href="/workspace" className="story-text-link">Explore the full workspace <ArrowRight size={16} strokeWidth={1.5} /></a>
          </div>
        </section>
      </main>
      <footer className="story-footer">
        <a href="#" className="story-brand"><ElektronMark size={22} /> ELEKTRON</a>
        <span>Fictional fleet · Simulated operations<br />Names replaced · No physical equipment controls</span>
        <span>Meta Global AI Developer Hackathon / 2026</span>
      </footer>
    </div>
  );
}
