"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { playSfx, setSfxMuted, sfxMuted, SFX_EVENT } from "@/lib/sfx";
import {
  Zap,
  Volume2,
  VolumeX,
  MessageSquare,
  PanelLeftOpen,
  PanelLeftClose,
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
  Compass,
  TrendingDown,
  ZapOff,
  CloudRain,
  WifiOff,
  Thermometer,
  Users,
  Sun,
  Lock,
  Copy,
  Flame,
  Box as BoxIcon,
} from "lucide-react";
import FleetOverview, { TechIcon } from "./FleetOverview";
import MissionWorkspace from "./MissionWorkspace";
import PlantWorkspace from "./PlantWorkspace";
import SiteWorkspace, { View } from "./SiteWorkspace";
import FloatingTimeline from "./FloatingTimeline";
import { DEMO_CASES } from "@/lib/operations";
import AgentPanel, { AgentResult } from "./AgentPanel";
import MetaIntegration from "./MetaIntegration";
import SimulationModal from "./SimulationModal";
import Modal from "./Modal";
import { TourKeyStep, VisHello, VisWelcome, VisJob, VisCauses, VisAlert, VisPlant, VisNumbers, VisTools, VisEvidence, VisWhatIf, VisCases, VisLoop } from "./TourVisuals";
import WorkspaceTour, { TourPill as P, type TourStep } from "./WorkspaceTour";
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
    [toast, setToast] = useState(""),
    [tourOpen, setTourOpen] = useState(false);
  const dark = true;
  const immersive =
    ["silangan", "amihan", "habagat", "bukal"].includes(siteId ?? "") &&
    view === "twin";
  const site = SITES.find((s) => s.id === siteId);
  const alarm = alarms(minute, scenario);
  const requestId = useRef(0);
  const agentToggle = useRef<HTMLButtonElement>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  useEffect(() => { setSidebarExpanded(localStorage.getItem("elektron-sidebar") !== "collapsed"); }, []);
  function closeAgent() {
    agentToggle.current?.focus({ preventScroll: true });
    setAgentOpen(false);
  }
  const agentMounted = useRef(false);
  useEffect(() => {
    if (!agentMounted.current) { agentMounted.current = true; return; }
    playSfx(agentOpen ? "open" : "close");
  }, [agentOpen]);
  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => {
    const sync = () => setSoundOn(!sfxMuted());
    sync();
    window.addEventListener(SFX_EVENT, sync);
    return () => window.removeEventListener(SFX_EVENT, sync);
  }, []);
  // a tap outside the agent panel minimizes it; drags (orbiting the 3D twin), dialogs, the tour and the click that opened it don't count
  const agentOpenedAt = useRef(0);
  useEffect(() => {
    if (!agentOpen || tourOpen || modal) return;
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 : false;
      if (moved || !target?.isConnected || performance.now() - agentOpenedAt.current < 400) return;
      if (target.closest("#elektron-agent, .agent-top, .ws-tour, .modal, .modal-backdrop, [role='dialog'], [role='listbox']")) return;
      setAgentOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("pointerdown", onDown, true); document.removeEventListener("click", onClick); };
  }, [agentOpen, tourOpen, modal]);
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
    // judges always start with the walkthrough; they can skip it from the first card
    setTourOpen(true);
  }, []);
  function closeTour() {
    localStorage.setItem("elektron-tour-seen", "1");
    setTourOpen(false);
  }
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
    agentOpenedAt.current = performance.now();
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

  function simulation() {
    setPlaying(false);
    setBranch(undefined);
    setModal("simulation");
  }
  function showEvidence(e: Evidence) {
    setEvidence(e);
    setModal("evidence");
  }
  // Guided tour for judges: the derating case end to end (alert → twin → evidence → Muse → what-if → other cases).
  function tourCase() {
    const item = DEMO_CASES.find((c) => c.id === "derating")!;
    setScenario(item.scenario);
    setMinute(item.minute);
    setPlaying(false);
  }
  function tourTwin() {
    tourCase();
    setModal(null);
    setSiteId("silangan");
    setView("twin");
    setSelected("INV-07");
    setOverlay("deviation");
    setFocus((n) => n + 1);
  }
  const pi = { size: 13, strokeWidth: 2.4 } as const;
  const tourSteps: TourStep[] = [
    { label: "Hello", screen: "overview", visual: <VisHello />, title: "A hello from Bryl and Engr. Howard", hideTitle: true, bare: true,
      body: null,
      enter: () => { tourCase(); setModal(null); setAgentOpen(false); back(); } },
    { label: "Welcome", screen: "overview", visual: <VisWelcome />, title: "Welcome to Elektron", hideTitle: true,
      body: <>
        <div className="ws-tour-note">
          <p><strong>Quick heads-up.</strong> We&apos;ve used Elektron on real plants.</p>
          <p>This hackathon version is a prototype on Meta&apos;s models. To keep plant data confidential, <strong>what you&apos;ll see here is a simulated recreation.</strong></p>
          <p>The plants are based on real solar, wind and geothermal sites we work with in the Philippines, with the names changed. Nothing here is connected to a real plant.</p>
        </div>
        This takes about <P tone="n" icon={<Clock3 {...pi} />}>two minutes</P>, and you <strong>don&apos;t need to know anything about power plants</strong>. We&apos;ll walk you through it.
      </>,
      enter: () => { tourCase(); setModal(null); setAgentOpen(false); back(); } },
    { label: "Live AI", screen: "overview", title: "Want Muse to answer live?",
      body: <>
        Paste a <P tone="b">Meta Model API key</P> and Elektron&apos;s questions go to <strong>Meta&apos;s Muse models for real</strong>. No key? No problem: <strong>everything still works on simulated data</strong> with a scripted agent.
        <TourKeyStep />
      </>,
      hideActions: true,
      enter: () => { tourCase(); setModal(null); setAgentOpen(false); back(); } },
    { label: "Picture this", screen: "overview", visual: <VisJob />, title: "Picture this",
      body: <>You look after a handful of power plants. One afternoon, one of them starts making <P tone="o" icon={<TrendingDown {...pi} />}>less power</P> than it should. Before you send a crew on a three-hour drive, you&apos;d really like to <strong>know why</strong>.</>,
      enter: () => { tourCase(); setModal(null); setAgentOpen(false); back(); } },
    { label: "The tricky part", screen: "overview", visual: <VisCauses />, title: "Here's the tricky part",
      body: <>On a chart, a <P tone="o" icon={<ZapOff {...pi} />}>broken inverter</P>, a <P tone="b" icon={<CloudRain {...pi} />}>passing cloud</P> and a <P tone="n" icon={<WifiOff {...pi} />}>sensor that went quiet</P> look <strong>exactly the same</strong>. Guess wrong, and the crew drives all that way <strong>for nothing</strong>. We&apos;ve been there.</>,
      enter: () => { tourCase(); setModal(null); setAgentOpen(false); back(); } },
    { label: "The alert", screen: "overview", visual: <VisAlert />, target: ".attention-banner", title: "Here's one happening right now",
      body: <>Elektron keeps an eye on <strong>eight plants</strong> across the Philippines, and it just flagged <P tone="o" icon={<TriangleAlert {...pi} />}>Silangan Solar</P>. One of its inverters is making <strong>far less than today&apos;s sunshine should allow</strong>.</>,
      enter: () => { tourCase(); setModal(null); setAgentOpen(false); back(); } },
    { label: "The plant", screen: "twin", visual: <VisPlant />, target: ".mission-scene", title: "Let's take a look",
      body: <>Here&apos;s Silangan Solar in 3D, built with <P tone="nv">NVIDIA SimReady</P> assets. Equipment that&apos;s <strong>falling behind lights up</strong>, and inverter <P tone="o">INV-07</P> is the one <strong>sticking out</strong>.</>,
      enter: () => { tourTwin(); setAgentOpen(false); } },
    { label: "The numbers", screen: "twin", visual: <VisNumbers />, target: ".asset-panel", title: "Something's off",
      body: <>INV-07 is making <P tone="r" icon={<TrendingDown {...pi} />}>322 kW</P> when it should be closer to <P tone="n">699 kW</P>. It&apos;s also running hot, at <P tone="r" icon={<Thermometer {...pi} />}>74.3 °C</P>. Suspicious, but <strong>is the heat really the cause?</strong></>,
      enter: () => { tourTwin(); setAgentOpen(false); } },
    { label: "Ask why", screen: "twin", visual: <VisTools />, target: "#elektron-agent", title: "So we ask Elektron",
      body: <>Elektron uses <P tone="b">Muse</P>, Meta&apos;s AI model, to <strong>do the legwork an engineer would</strong>: compare INV-07 with its <P tone="b" icon={<Users {...pi} />}>neighbors</P>, check the <P tone="o" icon={<Sun {...pi} />}>weather</P>, and dig through the <P tone="g" icon={<FileText {...pi} />}>alarm log</P>.</>,
      enter: () => { tourTwin(); openAgent("Why is INV-07 underperforming?"); } },
    { label: "The answer", screen: "twin", visual: <VisEvidence />, target: "#elektron-agent .evidence-cards", title: "And it shows its work",
      body: <><strong>The verdict:</strong> the inverter got too hot and turned itself down, while the weather and its neighbors are fine. <strong>Don&apos;t just take its word for it.</strong> Click <P tone="b" icon={<Link2 {...pi} />}>EV-001</P> to see the exact data behind it.</>,
      enter: () => setAgentOpen(true) },
    { label: "Test the fix", screen: "whatif", visual: <VisWhatIf />, target: ".modal", title: "Try the fix before the drive",
      body: <><strong>Before anyone gets in the truck</strong>, try the fix on a <P tone="k" icon={<Copy {...pi} />}>copy</P> of the plant. Letting INV-07 cool down for 30 minutes costs <P tone="r">0.156 MWh</P>, and <strong>the real plant stays untouched</strong>.</>,
      enter: () => { setAgentOpen(false); tourCase(); setBranch({ kind: "outage", assetId: "INV-07", duration: 30, reduction: 100 }); setModal("simulation"); } },
    { label: "More cases", screen: "twin", visual: <VisCases />, target: ".scenario-picker", title: "Not every dip is a problem",
      body: <>Want to see Elektron <strong>catch a false alarm</strong>? Pick a different situation here: <P tone="b" icon={<CloudRain {...pi} />}>rain</P>, a <P tone="n" icon={<WifiOff {...pi} />}>quiet sensor</P>, or a full-blown <P tone="r">typhoon</P>.</>,
      enter: () => setModal(null) },
    { label: "Done", screen: "twin", visual: <VisLoop />, title: "You're all set",
      body: <>That&apos;s the whole idea: <strong>spot the dip, see it in 3D, ask why, check the evidence, test the fix.</strong> Have a look around, and replay this anytime from <P tone="g">Guided tour</P> up top.</>,
      enter: () => setModal(null) },
  ];
  return (
    <div
      className={`app-shell ${sidebarExpanded ? "sidebar-expanded" : ""} ${agentOpen ? "with-agent" : ""} ${timelineMinimized ? "timeline-minimized" : ""}`}
    >
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <a className="brand" href="/" aria-label="Elektron home">
          <span className="brand-icon brand-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/story/v4/elektron-icon.png" alt="" />
          </span>
          <span className="brand-word">ELEKTRON</span>
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
          <button
            className="help-button sidebar-toggle"
            onClick={() => {
              const next = !sidebarExpanded;
              localStorage.setItem("elektron-sidebar", next ? "expanded" : "collapsed");
              setSidebarExpanded(next);
            }}
            aria-pressed={sidebarExpanded}
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarExpanded ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
            <span>{sidebarExpanded ? "Collapse" : "Expand"}</span>
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
            <button
              className="playbook-toggle tour-toggle"
              onClick={() => setTourOpen(true)}
            >
              <Compass size={14} />
              <span>Guided tour</span>
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
              className={`motion-toggle sound-toggle ${soundOn ? "active" : ""}`}
              aria-label={soundOn ? "Mute interface sounds" : "Turn on interface sounds"}
              title={soundOn ? "Mute sounds" : "Turn on sounds"}
              aria-pressed={soundOn}
              onClick={() => setSfxMuted(soundOn)}
            >
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
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
              className={`agent-top ${agentOpen ? "active" : ""}`}
              aria-expanded={agentOpen}
              aria-controls="elektron-agent"
              onClick={() => (agentOpen ? closeAgent() : openAgent())}
            >
              <MessageSquare size={15} strokeWidth={2.2} />
              <span>Ask Elektron</span>
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
      <WorkspaceTour steps={tourSteps} open={tourOpen} onClose={closeTour} />
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
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
      {modal === "about" && (
        <Modal onClose={() => setModal(null)} title="About Elektron">
          <div className="about-panel">
            <span className="brand-icon large">
              <Zap size={29} fill="currentColor" />
            </span>
            <h2>About Elektron</h2>
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
                <span>Built with</span>
                <strong>Muse Code</strong>
              </div>
              <div>
                <span>3D assets</span>
                <strong>NVIDIA · Poly Haven · Innerscene · Grab3D</strong>
              </div>
            </div>
            <p className="about-limits">
              We have used Elektron on real plants. This hackathon version is
              a prototype rebuilt on Meta&apos;s models and, to keep plant data
              confidential, it runs on a simulated recreation with no real
              facility connected. No formal engineering certification is
              claimed. Live Muse answers need a Meta API key, either on the
              server or pasted in the guided tour. NVIDIA SimReady geometry is converted for browser
              viewing; no NVIDIA physics runtime is connected. Solar, shading
              and inverter-temperature behavior require separate simulation
              models.
            </p>
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
