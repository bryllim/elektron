"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
const ModelLibrary = dynamic(() => import("./ModelLibrary"), {
  ssr: false,
  loading: () => <p>Loading asset library…</p>,
});
import {
  Zap,
  LayoutDashboard,
  Box,
  ChartNoAxesCombined,
  Radio,
  ChevronsUpDown,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Bell,
  ArrowUpRight,
  ArrowRight,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Clock3,
  Wind,
  FlaskConical,
  Download,
  Menu,
  X,
  FileText,
  Link2,
  Check,
  ExternalLink,
  Building2,
  TriangleAlert,
  Command,
  MapPin,
  Activity,
  Layers3,
} from "lucide-react";
import FleetOverview, { TechIcon } from "./FleetOverview";
import MissionWorkspace from "./MissionWorkspace";
import PlantWorkspace from "./PlantWorkspace";
import SiteWorkspace, { View } from "./SiteWorkspace";
import FloatingTimeline from "./FloatingTimeline";
import OperationsGuide from "./OperationsGuide";
import { DEMO_CASES } from "@/lib/operations";
import AgentPanel, { AgentResult } from "./AgentPanel";
import MetaIntegration from "./MetaIntegration";
import SimulationModal from "./SimulationModal";
import Modal from "./Modal";
import Chart from "./Chart";
import {
  SITES,
  ASSETS,
  SCENARIOS,
  BASE_MINUTE,
  Scenario,
  Overlay,
  Branch,
  timeLabel,
  fmt,
  alarms,
  assetSeries,
  series,
  assetMeasurement,
  TECH_COLORS,
  timestamp,
} from "@/lib/simulation";
import type { Evidence } from "@/lib/agent-tools";
import { download, exportMeasurements } from "@/lib/download";
const NAV = [
  { id: "overview", label: "Fleet overview", Icon: LayoutDashboard },
  { id: "twin", label: "Digital twin", Icon: Box },
  { id: "trends", label: "Performance", Icon: ChartNoAxesCombined },
  { id: "events", label: "Events & alarms", Icon: Radio },
] as const;
export default function Workspace({
  initialCaseId,
}: {
  initialCaseId?: string;
}) {
  const initialCase = DEMO_CASES.find((item) => item.id === initialCaseId);
  const [siteId, setSiteId] = useState<string | null>(
      initialCase?.siteId ?? null,
    ),
    [view, setView] = useState<View>(initialCase?.siteId ? "twin" : "overview"),
    [minute, setMinute] = useState(initialCase?.minute ?? BASE_MINUTE),
    [scenario, setScenario] = useState<Scenario>(
      initialCase?.scenario ?? "derating",
    ),
    [playing, setPlaying] = useState(false),
    [timelineMinimized, setTimelineMinimized] = useState(false),
    [speed, setSpeed] = useState(1),
    [range, setRange] = useState(360),
    [selected, setSelected] = useState<string | null>(
      initialCase?.scenario === "telemetry" ? "INV-04" : "INV-07",
    ),
    [overlay, setOverlay] = useState<Overlay>(
      initialCase ? "deviation" : "flow",
    ),
    [focusKey, setFocus] = useState(0),
    [motion, setMotion] = useState(true),
    [agentOpen, setAgentOpen] = useState(false),
    [agentRequest, setAgentRequest] = useState<{
      id: number;
      q: string;
    } | null>(null),
    [modal, setModal] = useState<
      | "about"
      | "guide"
      | "models"
      | "meta"
      | "simulation"
      | "evidence"
      | "search"
      | null
    >(null),
    [evidence, setEvidence] = useState<Evidence | null>(null),
    [branch, setBranch] = useState<Branch | undefined>(),
    [search, setSearch] = useState(""),
    [mobileMenu, setMobileMenu] = useState(false),
    [companyOpen, setCompanyOpen] = useState(false),
    [toast, setToast] = useState("");
  const dark = true;
  const immersive =
    ["silangan", "amihan", "habagat", "bukal"].includes(siteId ?? "") &&
    view === "twin";
  const site = SITES.find((s) => s.id === siteId);
  const alarm = alarms(minute, scenario);
  const requestId = useRef(0);
  const agentToggle = useRef<HTMLButtonElement>(null);
  function closeAgent() {
    agentToggle.current?.focus({ preventScroll: true });
    setAgentOpen(false);
  }
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    document.documentElement.dataset.motion = motion ? "full" : "reduced";
  }, [motion]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) setMotion(false);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setMinute((m) => {
          if (m + speed >= 1439) {
            setPlaying(false);
            return 1439;
          }
          return m + speed;
        }),
      1000,
    );
    return () => clearInterval(timer);
  }, [playing, speed]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModal((m) => (m === "search" ? null : "search"));
      }
      if (e.key === "Escape") {
        setMobileMenu(false);
        setCompanyOpen(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  function openSite(id: string) {
    setSiteId(id);
    setView(
      ["silangan", "amihan", "habagat", "bukal"].includes(id)
        ? "twin"
        : "overview",
    );
    setMobileMenu(false);
    setModal(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function back() {
    setSiteId(null);
    setView("overview");
    setMobileMenu(false);
  }
  function nav(v: View) {
    if (v === "overview") {
      back();
      return;
    }
    if (!siteId) setSiteId("silangan");
    setView(v);
    setMobileMenu(false);
  }
  function openAgent(q?: string) {
    setAgentOpen(true);
    if (q) {
      setPlaying(false);
      setAgentRequest({ id: ++requestId.current, q });
    }
  }
  function applyResult(result: AgentResult) {
    setPlaying(false);
    for (const a of result.actions) {
      if (a.type === "focus") {
        setSiteId("silangan");
        setView("twin");
        setSelected(a.assetId);
        setFocus((n) => n + 1);
      }
      if (a.type === "overlay") setOverlay(a.overlay);
      if (a.type === "time") setMinute(a.minute);
      if (a.type === "whatif") {
        setBranch({
          kind: a.kind,
          assetId: a.assetId,
          duration: a.duration,
          reduction: a.reduction,
        });
        setModal("simulation");
      }
      if (a.type === "incident")
        setToast("Shift summary is ready to download in the agent.");
    }
  }
  function scenarioChange(s: Scenario) {
    setScenario(s);
    setPlaying(false);
    setMinute(BASE_MINUTE);
    setBranch(undefined);
  }
  function changeWeather(s: Scenario) {
    setScenario(s);
    setPlaying(false);
    setBranch(undefined);
  }
  function launchCase(id: string) {
    const item = DEMO_CASES.find((c) => c.id === id);
    if (!item) return;
    setSiteId(item.siteId);
    setView(item.siteId ? "twin" : "overview");
    setScenario(item.scenario);
    setMinute(item.minute);
    setPlaying(false);
    setBranch(undefined);
    setSelected(item.scenario === "telemetry" ? "INV-04" : "INV-07");
    setOverlay("deviation");
    setModal(null);
    setAgentOpen(false);
    setToast("Case loaded. Investigate the snapshot to verify the cause.");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function simulation() {
    setPlaying(false);
    setBranch(undefined);
    setModal("simulation");
  }
  function showEvidence(e: Evidence) {
    setEvidence(e);
    setModal("evidence");
  }
  return (
    <div
      className={`app-shell ${agentOpen ? "with-agent" : ""} ${timelineMinimized ? "timeline-minimized" : ""}`}
    >
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <a className="brand" href="/" aria-label="Elektron home">
          <span className="brand-icon">
            <Zap size={20} fill="currentColor" strokeWidth={1.5} />
          </span>
          <span>
            elektron<span className="brand-dot">.</span>
          </span>
        </a>
        <button
          aria-label="Hiraya Renewables company selector"
          className="company-switch"
          onClick={() => setCompanyOpen(!companyOpen)}
          aria-expanded={companyOpen}
        >
          <span className="company-avatar">
            <Wind size={18} />
          </span>
          <span>
            <strong>Hiraya Renewables</strong>
            <small>Operations workspace</small>
          </span>
          <ChevronsUpDown size={13} />
        </button>
        {companyOpen && (
          <div className="company-popover">
            <Check size={14} />
            <span>
              Hiraya Renewables<small>Fictional demo company</small>
            </span>
          </div>
        )}
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              aria-label={label}
              className={`nav-item ${(id === "overview" && !siteId) || (view === id && siteId && id !== "overview") ? "active" : ""}`}
              onClick={() => nav(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "events" && alarm.length > 0 && (
                <span className="nav-count">{alarm.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-section-label sites-label">
          PINNED SITES <span>3</span>
        </div>
        <div className="sidebar-sites">
          {["silangan", "amihan", "bukal"].map((id) => {
            const s = SITES.find((s) => s.id === id)!;
            return (
              <button
                key={id}
                className={siteId === id ? "selected" : ""}
                onClick={() => openSite(id)}
              >
                <span
                  className="sidebar-site-icon"
                  style={{ color: TECH_COLORS[s.technology] }}
                >
                  <TechIcon tech={s.technology} size={15} />
                </span>
                {s.name}
                <span
                  className={`tiny-dot ${id === "silangan" && alarm.length ? "amber" : "green"}`}
                />
              </button>
            );
          })}
          <button className="all-sites" onClick={back}>
            View all sites <ArrowRight size={13} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-agent">
            <h3>
              Less searching.
              <br />
              More understanding.
            </h3>
            <p>
              Your fleet has a story.
              <br />
              Let Elektron connect the dots.
            </p>
            <button onClick={() => openAgent()}>
              Ask Elektron Agent <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className="help-button"
            onClick={() => setModal("models")}
            title="Sourced 3D asset library"
          >
            <Box size={17} /> 3D asset library <ArrowUpRight size={13} />
          </button>
          <button className="help-button" onClick={() => setModal("about")}>
            <HelpCircle size={17} /> About this workspace{" "}
            <ArrowUpRight size={13} />
          </button>
          <div className="user-profile">
            <span className="user-avatar">BL</span>
            <div>
              <strong>Bryl Lim</strong>
              <small>Workspace administrator</small>
            </div>
            <span className="profile-online" />
          </div>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span className="console-wordmark">
              ELEKTRON<span> / </span>
            </span>
            <span className="breadcrumb-home">
              <Layers3 size={15} /> HIRAYA RENEWABLES
            </span>
            <ChevronRight size={13} />
            <button onClick={back}>
              {siteId ? "Fleet" : "Fleet overview"}
            </button>
            {siteId && (
              <>
                <ChevronRight size={13} />
                <span>{site?.name}</span>
              </>
            )}
          </div>
          <div className="topbar-actions">
            <span className="console-mode">
              <span className="tiny-dot green" />
              SIMULATED ENVIRONMENT
            </span>
            <button
              className="playbook-toggle"
              onClick={() => setModal("guide")}
            >
              <FileText size={14} />
              <span>Playbook</span>
            </button>
            <button
              className="search-button icon-button"
              aria-label="Search workspace"
              onClick={() => setModal("search")}
            >
              <Search size={16} />
              <kbd>⌘ K</kbd>
            </button>
            <select
              className="global-range"
              value={range}
              aria-label="Global chart time range"
              onChange={(e) => setRange(+e.target.value)}
            >
              <option value={60}>Last hour</option>
              <option value={360}>Last 6 hours</option>
              <option value={1440}>Today</option>
            </select>
            <button
              className={`motion-toggle ${motion ? "active" : ""}`}
              aria-label={
                motion
                  ? "Pause interface animations"
                  : "Enable interface animations"
              }
              title={motion ? "Pause motion" : "Enable motion"}
              onClick={() => setMotion(!motion)}
            >
              <Activity size={15} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label={`Open alarms: ${alarm.length} active`}
              onClick={() => {
                setSiteId("silangan");
                setView("events");
              }}
            >
              <Bell size={17} />
              {alarm.length > 0 && <i />}
            </button>
            <button
              ref={agentToggle}
              className={`agent-toggle ${agentOpen ? "active" : ""}`}
              aria-expanded={agentOpen}
              aria-controls="elektron-agent"
              onClick={() => (agentOpen ? closeAgent() : setAgentOpen(true))}
            >
              <span>Agent</span>
            </button>
          </div>
        </header>
        <main
          className={`main-content ${immersive ? "immersive-content" : ""}`}
          id="main-content"
        >
          {!siteId ? (
            <FleetOverview
              minute={minute}
              scenario={scenario}
              onSelect={openSite}
              onAgent={openAgent}
              onCases={() => setModal("guide")}
              range={range}
              onScenario={changeWeather}
              onTime={(m) => {
                setMinute(m);
                setPlaying(false);
                setBranch(undefined);
              }}
            />
          ) : immersive && siteId !== "silangan" ? (
            <PlantWorkspace
              key={siteId}
              siteId={siteId}
              minute={minute}
              scenario={scenario}
              onWeatherScenario={changeWeather}
              motion={motion}
              onBack={back}
              onSimulation={simulation}
            />
          ) : immersive ? (
            <MissionWorkspace
              onWeatherScenario={changeWeather}
              minute={minute}
              scenario={scenario}
              selected={selected}
              onSelect={setSelected}
              overlay={overlay}
              onOverlay={setOverlay}
              focusKey={focusKey}
              onFocus={() => setFocus((n) => n + 1)}
              onAgent={openAgent}
              onSimulation={simulation}
              onBack={back}
              onView={setView}
              dark={dark}
              motion={motion}
            />
          ) : (
            <SiteWorkspace
              key={siteId}
              siteId={siteId}
              minute={minute}
              scenario={scenario}
              view={view}
              onView={setView}
              onBack={back}
              onAgent={openAgent}
              onSimulation={simulation}
              selected={selected}
              onSelect={setSelected}
              overlay={overlay}
              onOverlay={setOverlay}
              focusKey={focusKey}
              onFocus={() => setFocus((n) => n + 1)}
              range={range}
              dark={dark}
              motion={motion}
            />
          )}
          <footer className="app-footer">
            <span>
              <span className="tiny-dot green" /> Fictional company · Simulated
              operations
            </span>
            <button onClick={() => setModal("about")}>
              Built by Bryl Lim with Engr. Will Delos Reyes{" "}
              <ArrowUpRight size={11} />
            </button>
          </footer>
        </main>
        <FloatingTimeline minimized={timelineMinimized}>
          <div className="playback-controls">
            <button
              className="play-button"
              aria-label={playing ? "Pause simulation" : "Play simulation"}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? (
                <Pause size={15} fill="currentColor" />
              ) : (
                <Play size={15} fill="currentColor" />
              )}
            </button>
            <div className="playback-time">
              <strong>
                {timeLabel(minute)}
                <span> PHT</span>
              </strong>
              <small>30 OCT 2026</small>
            </div>
          </div>
          <div
            id="simulation-timeline"
            className="playback-expanded"
            hidden={timelineMinimized}
          >
            <div className="timeline">
              <div className="timeline-labels">
                <span>00:00</span>
                <span className="replay-label">
                  <span className="tiny-dot blue" />
                  {playing ? "SIMULATED · PLAYING" : "SIMULATED · PAUSED"}
                </span>
                <span>23:59</span>
              </div>
              <input
                type="range"
                aria-label="Simulation time in minutes since midnight"
                min={0}
                max={1439}
                value={minute}
                onChange={(e) => {
                  setPlaying(false);
                  setMinute(+e.target.value);
                }}
                style={{
                  background: `linear-gradient(to right,var(--blue) 0%,var(--blue) ${(minute / 1439) * 100}%,var(--track) ${(minute / 1439) * 100}%,var(--track) 100%)`,
                }}
              />
            </div>
            <div className="playback-settings">
              <select
                aria-label="Playback speed"
                value={speed}
                onChange={(e) => setSpeed(+e.target.value)}
              >
                <option value={1}>1×</option>
                <option value={5}>5×</option>
                <option value={15}>15×</option>
              </select>
              <button
                className="icon-button"
                aria-label="Return to current simulation time"
                title="Return to 13:42 simulation snapshot"
                onClick={() => {
                  setMinute(BASE_MINUTE);
                  setPlaying(false);
                }}
              >
                <SkipForward size={16} />
              </button>
              <span className="playback-divider" />
              <div className="scenario-picker">
                <FlaskConical size={14} />
                <select
                  aria-label="Simulation scenario"
                  value={scenario}
                  onChange={(e) => scenarioChange(e.target.value as Scenario)}
                >
                  {SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="icon-button"
                aria-label="Reset scenario"
                title="Reset scenario"
                onClick={() => {
                  setMinute(scenario === "derating" ? 780 : BASE_MINUTE);
                  setPlaying(false);
                  setBranch(undefined);
                }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
          <button
            className="timeline-toggle"
            aria-label={
              timelineMinimized
                ? "Expand simulation timeline"
                : "Minimize simulation timeline"
            }
            aria-expanded={!timelineMinimized}
            aria-controls="simulation-timeline"
            onClick={() => setTimelineMinimized((v) => !v)}
            title={timelineMinimized ? "Expand timeline" : "Minimize timeline"}
          >
            {timelineMinimized && (
              <span>
                Timeline <small>{playing ? "PLAYING" : "PAUSED"}</small>
              </span>
            )}
            {timelineMinimized ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
          </button>
        </FloatingTimeline>
      </div>
      <AgentPanel
        open={agentOpen}
        onClose={closeAgent}
        request={agentRequest}
        minute={minute}
        scenario={scenario}
        siteId={siteId}
        onStart={() => setPlaying(false)}
        onResult={applyResult}
        onEvidence={showEvidence}
        onIntegrations={() => setModal("meta")}
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {modal === "guide" && (
        <Modal onClose={() => setModal(null)} title="Operations playbook" wide>
          <OperationsGuide onLaunch={launchCase} />
        </Modal>
      )}
      {modal === "meta" && (
        <Modal
          onClose={() => setModal(null)}
          title="Meta models and visual inspection"
          wide
        >
          <MetaIntegration />
        </Modal>
      )}
      {modal === "simulation" && (
        <Modal onClose={() => setModal(null)} title="What-if simulation" wide>
          <SimulationModal
            minute={minute}
            scenario={scenario}
            initial={branch}
          />
        </Modal>
      )}
      {modal === "models" && (
        <Modal
          onClose={() => setModal(null)}
          title="Sourced 3D asset library"
          wide
        >
          <ModelLibrary />
        </Modal>
      )}
      {modal === "about" && (
        <Modal onClose={() => setModal(null)} title="About Elektron">
          <div className="about-panel">
            <span className="brand-icon large">
              <Zap size={29} fill="currentColor" />
            </span>
            <span className="eyebrow">BUILT FOR YOUR WORLD</span>
            <h2>
              Renewable energy
              <br />
              operations intelligence.
            </h2>
            <p>
              Elektron connects fleet monitoring, an interactive 3D digital
              twin, and evidence-backed investigations in one operations
              workspace.
            </p>
            <div className="about-credit">
              Built by Bryl Lim with Engr. Will Delos Reyes
            </div>
            <div className="about-facts">
              <div>
                <span>Demo operator</span>
                <strong>Hiraya Renewables</strong>
              </div>
              <div>
                <span>Operations</span>
                <strong>Fictional · Simulated</strong>
              </div>
              <div>
                <span>AI without credentials</span>
                <strong>Scripted demo agent</strong>
              </div>
              <div>
                <span>3D assets</span>
                <strong>NVIDIA · Poly Haven · Innerscene · Grab3D</strong>
              </div>
            </div>
            <p className="about-limits">
              A simulated digital twin demonstration. No real facility
              connection, formal engineering certification, or external
              validation is claimed. Muse inference requires a server-side Meta
              API key. NVIDIA SimReady geometry is converted for browser
              viewing; no NVIDIA physics runtime is connected. Solar, shading
              and inverter-temperature behavior require separate simulation
              models.
            </p>
            <button className="button full" onClick={() => setModal("models")}>
              <Box size={15} /> Inspect 3D assets & credits
            </button>
            <button
              className="button primary full"
              onClick={() => {
                setModal(null);
                openSite("silangan");
                scenarioChange("derating");
              }}
            >
              Explore the solar twin <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "evidence" && evidence && (
        <Modal
          onClose={() => setModal(null)}
          title={`Evidence ${evidence.id}`}
          wide
        >
          <div className="evidence-modal">
            <span className="eyebrow">
              <Link2 size={12} /> {evidence.id} · SUPPORTING EVIDENCE
            </span>
            <h2>{evidence.title}</h2>
            <p>
              {evidence.assetId ??
                SITES.find((s) => s.id === evidence.siteId)?.name}{" "}
              · {timeLabel(evidence.start)}–{timeLabel(evidence.end)} PHT
            </p>
            <div className="evidence-metadata">
              <span>
                Source <strong>{evidence.mode}</strong>
              </span>
              <span>
                Quality <strong>{evidence.quality}</strong>
              </span>
              <span>
                Units <strong>{evidence.unit}</strong>
              </span>
            </div>
            {evidence.metric.includes("actual") ||
            evidence.metric === "generation" ? (
              <Chart
                points={
                  evidence.assetId
                    ? assetSeries(
                        evidence.assetId,
                        evidence.start,
                        evidence.end,
                        evidence.scenario,
                      )
                    : series(
                        evidence.metric === "generation"
                          ? "fleet"
                          : evidence.siteId,
                        evidence.start,
                        evidence.end,
                        evidence.scenario,
                      )
                }
                height={230}
              />
            ) : null}
            <details className="raw-evidence" open>
              <summary>Tool result · {evidence.metric}</summary>
              <pre>{JSON.stringify(evidence.data, null, 2)}</pre>
            </details>
            <button
              className="button white"
              onClick={() =>
                download(
                  `elektron-${evidence.id}.json`,
                  JSON.stringify(evidence, null, 2),
                  "application/json",
                )
              }
            >
              <Download size={14} /> Download evidence
            </button>
          </div>
        </Modal>
      )}
      {modal === "search" && (
        <Modal onClose={() => setModal(null)} title="Search workspace">
          <div className="search-modal">
            <div className="search-input">
              <Search size={20} />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a site or equipment…"
                aria-label="Search sites and equipment"
              />
              <kbd>ESC</kbd>
            </div>
            <span className="eyebrow">SITES & EQUIPMENT</span>
            <div className="search-results">
              {SITES.filter((s) =>
                `${s.name} ${s.province} ${s.technology}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              ).map((s) => (
                <button key={s.id} onClick={() => openSite(s.id)}>
                  <span
                    className="tech-icon"
                    style={{ color: TECH_COLORS[s.technology] }}
                  >
                    <TechIcon tech={s.technology} />
                  </span>
                  <span>
                    <strong>{s.name}</strong>
                    <small>
                      {s.province} · {s.technology}
                    </small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
              {search.length > 1 &&
                ASSETS.filter((a) =>
                  a.id.toLowerCase().includes(search.toLowerCase()),
                ).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      openSite("silangan");
                      setSelected(a.id);
                      setFocus((n) => n + 1);
                    }}
                  >
                    <Box size={17} />
                    <span>
                      <strong>{a.id}</strong>
                      <small>Silangan Solar · {a.group}</small>
                    </span>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
            </div>
            <p className="search-hint">
              <Command size={12} /> K to open search anytime
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
