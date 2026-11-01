import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  Zap,
  Check,
  Plus,
  Menu,
} from "lucide-react";
import StoryInvestigation from "@/components/StoryInvestigation";
import StoryMotion from "@/components/StoryMotion";
import StoryHero from "@/components/StoryHero";
import StoryFilm from "@/components/StoryFilm";
import { storyCases } from "@/lib/story-cases";
import "./story.css";
export const metadata: Metadata = {
  title: "Elektron — When power drops, find the reason",
  description:
    "An electrical engineering team’s approach to investigating renewable energy anomalies with Meta Muse, evidence and a digital twin. Explore the project and its public simulation.",
};
export default function Page() {
  const cases = storyCases();
  const inverter = cases[0].reading;
  return (
    <div className="project-story">
      <StoryMotion />
      <a className="story-skip" href="#the-story">
        Skip to the project story
      </a>
      <header className="story-header">
        <a href="/" className="story-brand" aria-label="Elektron project home">
          <Zap size={16} strokeWidth={1.5} fill="currentColor" />
          ELEKTRON
        </a>
        <nav aria-label="Project navigation">
          <a href="#the-story">The story</a>
          <a href="#muse">The intelligence</a>
          <a href="#engineering">Under the hood</a>
        </nav>
        <div className="story-nav-actions">
          <a href="/workspace" className="story-launch">Try the demo <ArrowUpRight size={16} strokeWidth={1.5} /></a>
          <details className="story-mobile-nav">
            <summary aria-label="Open project navigation"><Menu size={16} strokeWidth={1.5} /></summary>
            <nav aria-label="Mobile project navigation">
              <a href="#the-story">The story</a><a href="#investigation">The investigation</a><a href="#muse">The intelligence</a><a href="#engineering">Under the hood</a>
            </nav>
          </details>
        </div>
      </header>
      <main>
        <section className="story-hero" aria-labelledby="project-title">
          <div className="story-hero-copy">
            <h1 id="project-title">The power drops<br /><span>Follow the evidence</span></h1>
            <p className="story-hero-description">A cloud, a hot inverter, or a missing reading. Investigate what changed at the plant—and what to do next—with Meta Muse.</p>
            <div className="story-hero-actions">
              <a href="#investigation" className="story-primary">Follow an investigation <ArrowRight size={16} strokeWidth={1.5} /></a>
              <StoryFilm />
            </div>
          </div>
          <StoryHero />
        </section>

        <section
          className="story-section story-origin"
          id="the-story"
        >
          <div className="story-section-label">
            <span>Why we built it</span>
          </div>
          <div className="story-editorial-grid">
            <h2>
              We know the work
              <br />
              behind the warning
            </h2>
            <div className="story-prose">
              <p className="story-lead">
                We’re a team of electrical engineers. Our starting point is the
                work of understanding what a power plant is actually doing.
              </p>
              <p>
                A drop in generation starts an investigation: check the weather,
                compare neighboring equipment, read the controller’s events, and
                work out whether the data itself is trustworthy. Each answer can
                live in a different view. The operator has to put them together
                before choosing a response.
              </p>
              <p>
                We use Elektron in our electrical engineering workflow to bring
                that investigation into one place: observe a deviation, gather
                the evidence, test a response, and leave a clear handover for
                the next person. This public version recreates that workflow
                with replaced identities and simulated operating data.
              </p>
              <div className="story-signature">
                <span>BL / WDR</span>
                <div>
                  <strong>Bryl Lim & Engr. Will Delos Reyes</strong>
                  <small>Electrical engineering team · Elektron</small>
                </div>
              </div>
            </div>
          </div>
          <aside className="story-privacy">
            <div>
              <strong>
                An operating workflow, with identities protected
              </strong>
              <p>
                Identifying operator and plant names are replaced in this
                walkthrough. Hiraya Renewables and its sites are fictional
                stand-ins; the public measurements, incidents and satellite
                fields are simulated. You can explore the investigation without
                exposing private operational data.
              </p>
            </div>
          </aside>
        </section>

        <section className="story-section" id="investigation">
          <div className="story-section-label">
            <span>The problem</span>
          </div>
          <div className="story-section-intro">
            <h2>
              Low output
              <br />
              Three different stories
            </h2>
            <p>
              An anomaly is simply a reading that needs an explanation. Select a
              case to see why the same instinct—“something must be broken”—can
              lead to the wrong response.
            </p>
          </div>
          <StoryInvestigation cases={cases} />
        </section>

        <section
          className="story-section story-case-study"
          id="evidence"
        >
          <div className="story-section-label">
            <span>An investigation, step by step</span>
          </div>
          <div className="story-editorial-grid">
            <div>
              <h2>
                Follow the clues
                <br />
                Keep the uncertainty
              </h2>
              <p className="story-margin-note">
                This is a reproducible simulated incident. The equipment can be
                selected and inspected in the demo.
              </p>
            </div>
            <ol className="story-investigation-steps">
              <li>
                <span>01</span>
                <div>
                  <h3>Notice the difference</h3>
                  <p>
                    One inverter produces{" "}
                    <strong>{Math.round(inverter.actual!)} kW</strong> against a
                    weather-adjusted expectation of{" "}
                    <strong>{Math.round(inverter.expected)} kW</strong>. That
                    gap tells us where to look.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Ask what else agrees</h3>
                  <p>
                    Neighboring units are behaving normally. This unit reports{" "}
                    <strong>{inverter.temperature?.toFixed(1)} °C</strong>,
                    alongside a controller event limiting its power. Together,
                    these signals support a local equipment investigation.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Test a possible response</h3>
                  <p>
                    Compare a 30-minute maintenance outage with the current
                    baseline in a separate simulation. See the energy tradeoff
                    before choosing a plan.
                  </p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <h3>Hand over something another engineer can check</h3>
                  <p>
                    Keep the readings, timestamps, assumptions and evidence with
                    the conclusion. “Inspect the cooling system” is a next step;
                    “the fan has failed” would still need verification.
                  </p>
                </div>
              </li>
            </ol>
          </div>
          <div className="story-case-bottom">
            <span>
              <Check size={16} strokeWidth={1.5} /> Calculations come from the same engine as the
              demo.
            </span>
            <a href="/workspace?case=derating" className="story-text-link">
              Open the case file <ArrowUpRight size={16} strokeWidth={1.5} />
            </a>
          </div>
        </section>

        <section className="story-section story-muse" id="muse">
          <div className="story-section-label">
            <span>Powered by Meta</span>
          </div>
          <div className="story-section-intro">
            <h2>
              Muse asks the next
              <br />
              useful question
            </h2>
            <p>
              The operator asks in plain language. Muse chooses which tools to
              consult, follows the evidence and explains what it found.
              Numerical calculations stay in the simulation engine.
            </p>
          </div>
          <div className="story-system-flow">
            <div>
              <span>The operator</span>
              <p>“Why did this plant’s output drop?”</p>
            </div>
            <ArrowRight size={16} strokeWidth={1.5} />
            <div>
              <span>Muse + validated tools</span>
              <p>Weather → peers → events → energy</p>
            </div>
            <ArrowRight size={16} strokeWidth={1.5} />
            <div>
              <span>The engineer</span>
              <p>Review evidence. Choose the next step.</p>
            </div>
          </div>
          <div className="story-model-rows">
            <article>
              <div>
                <h3>Muse Spark</h3>
                <small>Quick investigation & image understanding</small>
              </div>
              <p>
                Brings the right measurements into the conversation. Compares
                the weather, equipment and alarms, then explains the finding
                with links to its evidence.
              </p>
              <span className="story-model-tag">Investigate</span>
            </article>
            <article>
              <div>
                <h3>Muse Wonder</h3>
                <small>Deeper analysis</small>
              </div>
              <p>
                Uses the same tools with more room for complex review. When
                asked, it can request a what-if calculation and explain the
                resulting tradeoff.
              </p>
              <span className="story-model-tag">Reason</span>
            </article>
            <article>
              <div>
                <h3>SAM 3.1 + Spark</h3>
                <small>Visual inspection</small>
              </div>
              <p>
                SAM outlines objects in an inspection image. Spark reviews the
                image and object locations. An outline identifies where
                something is; an engineer still verifies its condition.
              </p>
              <span className="story-model-tag">Locate</span>
            </article>
          </div>
          <div className="story-ai-boundary">
            <span>
              <Check size={16} strokeWidth={1.5} /> Sources travel with the answer
            </span>
            <span>
              <Check size={16} strokeWidth={1.5} /> The engine owns the numbers
            </span>
            <span>
              <Check size={16} strokeWidth={1.5} /> The operator owns the decision
            </span>
          </div>
          <p className="story-small-print">
            The demo labels each answer’s provenance. Live Meta inference
            requires configured API access; without it, investigations are
            explicitly scripted. Visual inference is disabled until a key is
            supplied.{" "}
            <a
              href="https://dev.meta.ai/docs/models"
              target="_blank"
              rel="noreferrer"
            >
              Meta model reference ↗
            </a>
          </p>
        </section>

        <section
          className="story-section story-value"
          id="why-it-matters"
        >
          <div className="story-section-label">
            <span>Why it matters</span>
          </div>
          <div className="story-editorial-grid">
            <h2>
              A stronger decision
              <br />
              at the end of the screen
            </h2>
            <div className="story-prose">
              <p className="story-lead">
                The value is in what happens after an alert.
              </p>
              <p>
                A weather-driven drop calls for a different response from an
                overheating unit. A missing reading calls for a data check.
                Elektron makes those distinctions visible, explainable and
                testable in the same workspace.
              </p>
              <p>
                That is our case for this hackathon: electrical-engineering
                context, useful model reasoning, and a working way to inspect
                the result.
              </p>
            </div>
          </div>
          <div className="story-value-rows">
            <article>
              <span>Engineering context</span>
              <h3>The problem comes first</h3>
              <p>
                Weather-adjusted expectations, equipment peers and data quality
                shape the investigation.
              </p>
            </article>
            <article>
              <span>Model reasoning</span>
              <h3>The model has a job to do</h3>
              <p>
                Muse gathers evidence through bounded tools, explains the
                pattern and helps compare a response.
              </p>
            </article>
            <article>
              <span>Checkable results</span>
              <h3>Test the claim yourself</h3>
              <p>
                Switch the scenario, follow the sources, inspect the twin and
                reproduce the calculation.
              </p>
            </article>
          </div>
          <p className="story-impact-note">
            The intended benefit: less manual cross-checking, better-targeted
            inspections and clearer handovers. Measured time savings and
            recovered energy require validation in real operations; we do not
            claim them here.
          </p>
          <a
            href="https://cerebralvalley.ai/e/meta-ai-developer-hackathon"
            target="_blank"
            rel="noreferrer"
            className="story-text-link"
          >
            Built for Your World / Push the Frontier <ArrowUpRight size={16} strokeWidth={1.5} />
          </a>
        </section>

        <section
          className="story-section story-engineering"
          id="engineering"
        >
          <div className="story-section-label">
            <span>Under the hood</span>
          </div>
          <div className="story-section-intro">
            <h2>
              Simple to follow
              <br />
              Open to scrutiny
            </h2>
            <p>
              You don’t need a power-systems background to use the demo. These
              details explain the assumptions behind what you see.
            </p>
          </div>
          <div className="story-technical-notes">
            <details>
              <summary>
                <span>01</span>What does the digital twin actually simulate?
                <Plus size={16} strokeWidth={1.5} />
              </summary>
              <div>
                <p>
                  A digital twin is a digital representation of a physical
                  system. Here, the 3D layout helps you locate equipment while a
                  separate calculation model produces its operating readings.
                  Solar, wind and geothermal scenes use sourced equipment
                  geometry.
                </p>
                <p>
                  The public layout is representative, not a surveyed facility.
                  Imported NVIDIA SimReady assets supply some geometry; this
                  browser demo does not run NVIDIA Omniverse or a certified
                  physics solver. Visual shadows are not a calibrated shading
                  calculation.
                </p>
              </div>
            </details>
            <details>
              <summary>
                <span>02</span>How are power and energy calculated?
                <Plus size={16} strokeWidth={1.5} />
              </summary>
              <div>
                <p>
                  Solar expectation depends on sunlight reaching the panel
                  plane, panel temperature, installed DC capacity and modeled
                  conversion losses, capped at the inverter’s AC rating. A
                  simulated controller event applies the separate derating
                  factor.
                </p>
                <code>
                  Expected AC ≈ min(AC rating, DC capacity × sunlight factor ×
                  temperature factor × losses)
                </code>
                <p>
                  Power is a rate (kW or MW). Energy is power accumulated over
                  time (kWh or MWh), calculated by trapezoidal integration
                  between samples. Gaps remain incomplete. What-if branches
                  compare with the same starting snapshot and do not modify the
                  baseline.
                </p>
              </div>
            </details>
            <details>
              <summary>
                <span>03</span>How do weather and the typhoon affect generation?
                <Plus size={16} strokeWidth={1.5} />
              </summary>
              <div>
                <p>
                  Clouds and rain reduce modeled solar irradiance. Wind power
                  follows a simplified curve with cut-in, rated and cut-out
                  speeds; rotors park above the modeled cut-out threshold.
                  Expected output already reflects these weather conditions.
                </p>
                <p>
                  The typhoon track and satellite field are synthetic. They
                  change local simulated weather and generation, but are not
                  observations, forecasts or official warnings. Hydro, storage
                  and geothermal behavior also use documented simplified
                  assumptions.
                </p>
                <a href="/workspace?case=typhoon">Explore the storm case ↗</a>
              </div>
            </details>
            <details>
              <summary>
                <span>04</span>What keeps a plausible AI answer checkable?
                <Plus size={16} strokeWidth={1.5} />
              </summary>
              <div>
                <p>
                  Muse can call 13 validated tools against a frozen snapshot.
                  Identifiers and time windows are checked. Model answers must
                  cite returned evidence IDs. Missing measurements stay unknown,
                  and the model has no tool for commanding physical equipment.
                </p>
                <p>
                  Checking that a citation exists is not proof that every
                  sentence is correct. Engineers still review the
                  interpretation. Tool budgets, deadlines and cancellation bound
                  the run; provider failures visibly switch investigations to a
                  scripted fallback. Keys stay on the server.
                </p>
                <p>
                  SAM returns locations, masks and model confidence. A mask does
                  not establish damage, electrical safety, shading loss or a
                  temperature. The image’s source label is supplied by the
                  operator.
                </p>
              </div>
            </details>
            <details>
              <summary>
                <span>05</span>What is real, and what has been replaced for this
                demo?
                <Plus size={16} strokeWidth={1.5} />
              </summary>
              <div>
                <p>
                  The team’s electrical-engineering perspective and the problem
                  being addressed are the project’s context. Operator and plant
                  identities are withheld. Hiraya Renewables, the site names,
                  layouts, measurements and incidents used in this public
                  walkthrough are fictional or simulated.
                </p>
                <p>
                  The numerical engine, interactive 3D viewer, evidence tools
                  and Meta API integrations are working software. Live inference
                  requires an authorized key. This public instance has no live
                  plant connection and issues no equipment commands. The
                  walkthrough demonstrates the investigation process; it does
                  not establish measured operational savings.
                </p>
              </div>
            </details>
          </div>
          <div className="story-downloads">
            <a
              href="/story/engineering-notes.md"
              target="_blank"
              rel="noreferrer"
            >
              Full simulation assumptions <ArrowUpRight size={16} strokeWidth={1.5} />
            </a>
            <a
              href="/story/meta-integration.md"
              target="_blank"
              rel="noreferrer"
            >
              Meta integration notes <ArrowUpRight size={16} strokeWidth={1.5} />
            </a>
            <a href="/story/asset-sources.md" target="_blank" rel="noreferrer">
              3D asset provenance <ArrowUpRight size={16} strokeWidth={1.5} />
            </a>
          </div>
        </section>

        <section className="story-closing">
          <span className="story-kicker">
            From understanding to action
          </span>
          <h2>
            A better next move
            <br />
            starts with why
          </h2>
          <div>
            <a href="/workspace?case=derating" className="story-primary">
              Investigate the power drop <ArrowUpRight size={16} strokeWidth={1.5} />
            </a>
            <a href="/workspace" className="story-text-link">
              Explore the full workspace <ArrowRight size={16} strokeWidth={1.5} />
            </a>
          </div>
          <p>Public simulation · No physical equipment controls</p>
        </section>
      </main>
      <footer className="story-footer">
        <a href="#" className="story-brand">
          <Zap size={16} strokeWidth={1.5} fill="currentColor" /> ELEKTRON
        </a>
        <span>
          Bryl Lim & Engr. Will Delos Reyes
          <br />
          Electrical engineering × applied AI
        </span>
        <span>
          Meta AI Developer Hackathon / 2026
          <br />
          Names replaced. Public data simulated.
        </span>
      </footer>
    </div>
  );
}
