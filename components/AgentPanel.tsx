"use client";
import { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowUp,
  ArrowUpRight,
  Check,
  Square,
  RotateCcw,
  FileText,
  ArrowRight,
  Clock3,
  ScanLine,
} from "lucide-react";
import type { Action, Evidence } from "@/lib/agent-tools";
import { Scenario, timeLabel, fmt } from "@/lib/simulation";
import { download } from "@/lib/download";
export type AgentResult = {
  answer: string;
  actions: Action[];
  evidence: Evidence[];
  activity: string[];
  minute: number;
  scenario: Scenario;
  mode: string;
  model?: string;
  elapsedMs?: number;
  siteId?: string;
  notice?: string;
  analysisMode?: "triage" | "deep";
  usage?: { input_tokens: number; output_tokens: number };
};
type Message = {
  role: "user" | "assistant";
  text: string;
  result?: AgentResult;
  cancelled?: boolean;
};
const examples = [
  { label: "Check fleet status", question: "Which sites need attention?" },
  {
    label: "Explain an output drop",
    question: "Why did Silangan’s output drop?",
  },
  {
    label: "Review storm exposure",
    question: "What is the typhoon exposure at this site?",
  },
  {
    label: "Summarize today’s energy",
    question: "How much energy did this site export today?",
  },
];
export default function AgentPanel({
  open,
  onClose,
  request,
  minute,
  scenario,
  siteId,
  onStart,
  onResult,
  onEvidence,
  onIntegrations,
}: {
  open: boolean;
  onClose: () => void;
  request: { id: number; q: string } | null;
  minute: number;
  scenario: Scenario;
  siteId: string | null;
  onStart: () => void;
  onResult: (r: AgentResult) => void;
  onEvidence: (e: Evidence) => void;
  onIntegrations: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [mode, setMode] = useState("Scripted demo agent"),
    [lastQ, setLastQ] = useState("");
  const [analysisMode, setAnalysisMode] = useState<"triage" | "deep">("triage");
  const abort = useRef<AbortController | null>(null),
    run = useRef(0),
    bottom = useRef<HTMLDivElement>(null);
  const latest = useRef({ minute, scenario, siteId, onStart, onResult });
  latest.current = { minute, scenario, siteId, onStart, onResult };
  useEffect(() => {
    fetch("/api/agent")
      .then((r) => r.json())
      .then((d) => setMode(d.mode))
      .catch(() => {});
  }, []);
  async function ask(q: string) {
    if (!q.trim()) return;
    abort.current?.abort();
    const id = ++run.current,
      controller = new AbortController();
    abort.current = controller;
    const state = latest.current;
    state.onStart();
    setBusy(true);
    setError("");
    setLastQ(q);
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          minute: state.minute,
          scenario: state.scenario,
          siteId: state.siteId ?? "silangan",
          analysisMode,
        }),
        signal: controller.signal,
      });
      if (!res.ok)
        throw new Error("The investigation could not finish. Please retry.");
      const result: AgentResult = await res.json();
      if (id !== run.current || controller.signal.aborted) return;
      setMode(result.mode);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: result.answer, result },
      ]);
      state.onResult(result);
    } catch (e) {
      if ((e as Error).name !== "AbortError" && id === run.current)
        setError((e as Error).message);
    } finally {
      if (id === run.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (request?.q) void ask(request.q);
  }, [request?.id]); // A request captures one frozen snapshot.
  useEffect(() => {
    if (abort.current) {
      abort.current.abort();
      run.current++;
      setBusy(false);
    }
  }, [scenario, minute, siteId]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    bottom.current?.scrollIntoView({
      behavior:
        document.documentElement.dataset.motion === "reduced" ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      block: "nearest",
    });
  }, [messages, busy]);
  function cancel() {
    abort.current?.abort();
    run.current++;
    setBusy(false);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: "Investigation cancelled. No pending viewer actions will be applied.",
        cancelled: true,
      },
    ]);
  }
  const renderText = (text: string, evidence: Evidence[]) =>
    text.split(/(\[EV-\d{3}(?:, EV-\d{3})*\])/g).map((chunk, i) =>
      chunk.startsWith("[EV-") ? (
        <span key={i} className="evidence-inline">
          {(chunk.match(/EV-\d{3}/g) ?? []).map((id) => (
            <button
              key={id}
              onClick={() => {
                const e = evidence.find((e) => e.id === id);
                if (e) onEvidence(e);
              }}
            >
              {id}
              <ArrowUpRight size={10} />
            </button>
          ))}
        </span>
      ) : (
        chunk
      ),
    );
  return (
    <aside
      className={`agent-panel ${open ? "is-open" : ""}`}
      id="elektron-agent"
      aria-label="Elektron Agent"
      aria-hidden={!open}
      inert={!open}
    >
      <div className="agent-heading">
        <div>
          <h2>Elektron Agent</h2>
          <p>
            <span className="tiny-dot blue" />
            {mode}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            className="icon-button agent-new"
            aria-label="New investigation"
            title="New investigation"
            onClick={() => {
              abort.current?.abort();
              run.current++;
              setBusy(false);
              setMessages([]);
              setError("");
              setInput("");
            }}
          >
            <RotateCcw size={15} />
          </button>
        )}
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close agent"
        >
          <X size={18} />
        </button>
      </div>
      <div className="agent-snapshot">
        <Clock3 size={12} /> Frozen snapshot · {timeLabel(minute)} PHT{" "}
        <span>Simulated</span>
      </div>
      <div className="agent-model-controls">
        <select
          aria-label="Investigation model"
          value={analysisMode}
          disabled={busy}
          onChange={(e) => setAnalysisMode(e.target.value as "triage" | "deep")}
        >
          <option value="triage">Quick · Muse Spark</option>
          <option value="deep">Deep · Muse Wonder</option>
        </select>
        <button onClick={onIntegrations}>
          <ScanLine size={13} /> Models & vision
        </button>
      </div>
      <div className={`agent-messages ${!messages.length ? "is-empty" : ""}`}>
        {!messages.length && (
          <div className="agent-welcome">
            <h3>What should we do?</h3>
            <div
              className="agent-example-pills"
              role="group"
              aria-label="Example questions"
            >
              {examples.map((example) => (
                <button
                  key={example.label}
                  disabled={busy}
                  onClick={() => ask(example.question)}
                >
                  {example.label}
                  <ArrowUpRight size={12} />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            {m.role === "assistant" && (
              <div className="message-author">
                ELEKTRON AGENT
                {m.result && <span>{timeLabel(m.result.minute)} PHT</span>}
              </div>
            )}
            {m.result && (
              <div className="answer-provenance">
                <span>
                  {m.result.model
                    ? `Meta · ${m.result.model}`
                    : "Scripted demonstration"}
                </span>
                <span>
                  {m.result.evidence.length} sources
                  {m.result.elapsedMs
                    ? ` · ${(m.result.elapsedMs / 1000).toFixed(1)}s`
                    : ""}
                </span>
              </div>
            )}
            {m.result &&
              (m.result.minute !== minute ||
                m.result.scenario !== scenario) && (
                <div className="answer-stale">
                  Earlier snapshot · ask again to investigate the current
                  conditions.
                </div>
              )}
            {m.result?.notice && (
              <div className="provider-notice">{m.result.notice}</div>
            )}
            {m.result?.activity && (
              <details className="tool-activity">
                <summary>
                  <Check size={12} />
                  {m.result.activity.length} tool actions completed
                  <Chevron />
                </summary>
                <div>
                  {m.result.activity.map((t, j) => (
                    <span key={j}>
                      <Check size={11} />
                      {t}
                    </span>
                  ))}
                </div>
              </details>
            )}
            <div className="message-text">
              {renderText(m.text, m.result?.evidence ?? [])}
            </div>
            {!!m.result?.evidence.length && (
              <div className="evidence-cards">
                {m.result.evidence.slice(0, 4).map((e) => (
                  <button key={e.id} onClick={() => onEvidence(e)}>
                    <span className="evidence-icon">
                      <FileText size={13} />
                    </span>
                    <span>
                      <strong>{e.title}</strong>
                      <small>
                        {e.id} · {e.mode} · {e.quality}
                      </small>
                    </span>
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            )}
            {m.result && (
              <div className="agent-followups">
                {m.result.evidence.some((e) => e.assetId) &&
                  m.result.minute === minute &&
                  m.result.scenario === scenario &&
                  (siteId === "silangan" || !siteId) && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        ask("Simulate INV-07 being unavailable for 30 minutes.")
                      }
                    >
                      <ArrowRight size={13} /> Try a 30-min outage
                    </button>
                  )}
                <button
                  onClick={() => {
                    const text = m.result!.actions.find(
                      (a) => a.type === "incident",
                    );
                    if (text?.type === "incident")
                      download("elektron-incident-summary.txt", text.text);
                    else
                      download(
                        "elektron-shift-handover.txt",
                        `ELEKTRON · SHIFT HANDOVER\nSimulated operations\n${timeLabel(m.result!.minute)} PHT · ${m.result!.scenario}\n${m.result!.mode}\n\n${m.text}\n\nSUPPORTING EVIDENCE\n${JSON.stringify(m.result!.evidence, null, 2)}\n\nNo physical equipment commands issued.`,
                      );
                  }}
                >
                  <FileText size={13} />{" "}
                  {m.result.actions.some((a) => a.type === "incident")
                    ? "Download summary"
                    : "Download handover"}
                </button>
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="agent-busy" role="status">
            <span className="busy-orb" />
            <div>
              <strong>Investigating your snapshot</strong>
              <p>Retrieving measurements and supporting evidence…</p>
            </div>
          </div>
        )}
        {error && (
          <div className="agent-error" role="alert">
            {error}
            <button onClick={() => ask(lastQ)}>
              <RotateCcw size={13} /> Retry
            </button>
          </div>
        )}
        <div ref={bottom} />
      </div>
      <form
        className="agent-composer"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <label className="sr-only" htmlFor="agent-question">
          Ask Elektron Agent
        </label>
        <textarea
          id="agent-question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your operations…"
          rows={2}
          maxLength={2000}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
        />
        <div>
          <span>Evidence behind every finding</span>
          {busy ? (
            <button
              type="button"
              className="send-button"
              aria-label="Cancel investigation"
              onClick={cancel}
            >
              <Square size={13} />
            </button>
          ) : (
            <button
              type="submit"
              className="send-button"
              disabled={!input.trim()}
              aria-label="Send question"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>
      </form>
      <p className="agent-disclaimer">
        {mode.startsWith("Scripted")
          ? "Deterministic demo · No live model inference"
          : mode.includes("Ready")
            ? "Meta configured · connection checked on investigation"
            : "Powered by Muse · Meta Model API"}
        <br />
        Simulated findings. Engineering review required for real operations.
      </p>
    </aside>
  );
}
function Chevron() {
  return <span style={{ marginLeft: "auto", fontSize: 12 }}>⌄</span>;
}
