import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clipboard,
  Code2,
  Cpu,
  FileText,
  LoaderCircle,
  MessageSquareText,
  Play,
  Sparkles,
  Terminal,
  WandSparkles,
  X,
} from "lucide-react";

const API_BASE = "https://flowforge-ai-yuq5.onrender.com/api";

const agents = [
  { name: "Drafter", role: "AGENT 01", icon: FileText, color: "cyan" },
  { name: "Critic", role: "AGENT 02", icon: MessageSquareText, color: "pink" },
  { name: "Refiner", role: "AGENT 03", icon: Sparkles, color: "green" },
];

const outputCards = [
  {
    key: "draftV1",
    number: "01",
    eyebrow: "FIRST PASS",
    title: "Initial draft",
    agent: "DRAFTER",
    Icon: FileText,
    tone: "cyan",
  },
  {
    key: "criticReview",
    number: "02",
    eyebrow: "QUALITY CHECK",
    title: "Critic review",
    agent: "CRITIC",
    Icon: MessageSquareText,
    tone: "pink",
  },
  {
    key: "finalOutputV2",
    number: "03",
    eyebrow: "FINAL DELIVERABLE",
    title: "Polished output",
    agent: "REFINER",
    Icon: Sparkles,
    tone: "green",
  },
];

const pipelineVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

function AgentPipeline({ loading }) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      {agents.map((agent, index) => {
        const Icon = agent.icon;
        return (
          <div className="contents sm:flex sm:items-center sm:gap-3" key={agent.name}>
            <motion.div
              animate={
                loading
                  ? { opacity: [0.48, 1, 0.48], scale: [0.98, 1.035, 0.98] }
                  : { opacity: 1, scale: 1 }
              }
              transition={
                loading
                  ? {
                      duration: 1.35,
                      repeat: Infinity,
                      delay: index * 0.34,
                      ease: "easeInOut",
                    }
                  : { duration: 0.25 }
              }
              className={`agent-chip agent-${agent.color}`}
            >
              <span className="agent-icon">
                <Icon size={15} strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-semibold tracking-[0.16em] text-white/35">
                  {agent.role}
                </span>
                <span className="block text-xs font-medium text-white/80">{agent.name}</span>
              </span>
              <span className={`agent-indicator ${loading ? "agent-indicator-live" : ""}`} />
            </motion.div>
            {index < agents.length - 1 && (
              <>
                <ArrowRight
                  aria-hidden="true"
                  className="hidden text-white/20 sm:block"
                  size={15}
                />
                <ArrowDown
                  aria-hidden="true"
                  className="mx-auto text-white/20 sm:hidden"
                  size={14}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OutputCard({ card, content, onCopy, copied }) {
  const { Icon } = card;
  const isFinal = card.tone === "green";

  return (
    <motion.article
      variants={cardVariants}
      className={`output-card output-${card.tone} ${isFinal ? "output-final" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`output-icon output-icon-${card.tone}`}>
            <Icon size={17} strokeWidth={1.8} />
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className={`section-kicker kicker-${card.tone}`}>{card.eyebrow}</span>
              <span className="text-[9px] tracking-[0.13em] text-white/25">/ {card.agent}</span>
            </div>
            <h3 className="font-display text-lg font-semibold tracking-tight text-white/90">
              {card.title}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCopy(content, card.key)}
          aria-label={`Copy ${card.title}`}
          className="copy-button"
        >
          {copied ? <Check size={14} /> : <Clipboard size={14} />}
          <span>{copied ? "COPIED" : "COPY"}</span>
        </button>
      </div>

      <div className={`terminal-panel ${isFinal ? "terminal-panel-final" : ""}`}>
        <div className="terminal-chrome">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="terminal-dot bg-[#ff5f57]" />
            <span className="terminal-dot bg-[#febc2e]" />
            <span className="terminal-dot bg-[#28c840]" />
          </div>
          <span className="terminal-path">
            <Terminal size={12} />
            flowforge / output_{card.number}
          </span>
          <span className="terminal-live">UTF-8</span>
        </div>
        <pre className={`terminal-output ${isFinal ? "terminal-output-final" : ""}`}>
          <code>{content || "No output was returned for this stage."}</code>
        </pre>
      </div>
    </motion.article>
  );
}

export default function App() {
  const [taskType, setTaskType] = useState("code");
  const [workflowPrompt, setWorkflowPrompt] = useState("");
  const [workflowResult, setWorkflowResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  async function handleRunWorkflow(e) {
    e.preventDefault();
    if (!workflowPrompt) return alert("Please enter a prompt.");

    setLoading(true);
    setError("");
    setWorkflowResult(null);

    try {
      const response = await fetch(`${API_BASE}/run-workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType, userPrompt: workflowPrompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Workflow failed");

      setWorkflowResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(content, key) {
    try {
      await navigator.clipboard.writeText(content ?? "");
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 1600);
    } catch (copyError) {
      setError(`Could not copy output: ${copyError.message}`);
    }
  }

  return (
    <main className="app-shell min-h-screen overflow-hidden bg-[#0a0a0f] text-white">
      <div aria-hidden="true" className="ambient ambient-purple" />
      <div aria-hidden="true" className="ambient ambient-cyan" />

      <header className="relative z-10 border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="FlowForge AI home">
            <span className="brand-mark">
              <WandSparkles size={19} strokeWidth={1.8} />
            </span>
            <span className="font-display text-sm font-semibold tracking-tight text-white">
              FlowForge <span className="text-violet-300">AI</span>
            </span>
            <span className="hidden rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-medium tracking-[0.13em] text-white/35 sm:inline-flex">
              STUDIO / 01
            </span>
          </a>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-semibold tracking-[0.15em] text-emerald-300/80">
              SYSTEM READY
            </span>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <section className="mb-10 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.06] px-3 py-1.5 text-[10px] font-medium tracking-[0.12em] text-violet-200/80">
              <Cpu size={13} />
              MULTI-AGENT CONTENT & CODE STUDIO
            </div>
            <h1 className="font-display max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.045em] text-white sm:text-6xl">
              Ideas in.
              <span className="hero-gradient"> Intelligence out.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/45 sm:text-base">
              Three focused agents turn your prompt into a refined, ready-to-use result.
              Drafted, challenged, and forged to ship.
            </p>
          </div>
          <div className="hidden items-center gap-3 pb-1 text-[10px] tracking-[0.12em] text-white/35 lg:flex">
            <span className="font-mono text-white/60">01</span> PROMPT
            <span className="h-px w-8 bg-white/15" />
            <span className="font-mono text-white/60">02</span> PIPELINE
            <span className="h-px w-8 bg-white/15" />
            <span className="font-mono text-white/60">03</span> FORGE
          </div>
        </section>

        <section className="glass-panel mb-12 p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-5 border-b border-white/[0.07] pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-white/35">
                <span className="text-violet-300">01</span>
                AGENT ORCHESTRATION
              </div>
              <h2 className="font-display text-sm font-medium text-white/80">
                Your prompt, passed through the forge
              </h2>
            </div>
            <AgentPipeline loading={loading} />
          </div>

          <form onSubmit={handleRunWorkflow}>
            <div className="mb-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_230px]">
              <label className="block">
                <span className="mb-2 block text-[10px] font-semibold tracking-[0.13em] text-white/45">
                  WHAT SHOULD THE AGENTS BUILD?
                </span>
                <span className="relative block">
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="input-control w-full appearance-none pr-10"
                  >
                    <option value="code">Code module / function</option>
                    <option value="article">Technical article / blog post</option>
                    <option value="marketing">Product launch copy</option>
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    size={15}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
                  />
                </span>
              </label>
              <div className="flex items-end">
                <div className="flex h-[46px] w-full items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 px-4">
                  <span className="flex items-center gap-2 text-[10px] tracking-[0.11em] text-white/40">
                    <Circle size={7} className="fill-cyan-400 text-cyan-400" />
                    MODEL ROUTING
                  </span>
                  <span className="font-mono text-[10px] text-cyan-300/70">AUTO</span>
                </div>
              </div>
            </div>

            <label htmlFor="workflow-prompt" className="mb-2 block text-[10px] font-semibold tracking-[0.13em] text-white/45">
              YOUR INSTRUCTION
            </label>
            <div className="prompt-wrap">
              <textarea
                id="workflow-prompt"
                rows={4}
                placeholder="Describe what you want the agents to create..."
                value={workflowPrompt}
                onChange={(e) => setWorkflowPrompt(e.target.value)}
                className="prompt-input"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-3 py-3 sm:px-4">
                <div className="flex items-center gap-2 text-[10px] text-white/30">
                  <Code2 size={13} />
                  <span>Be specific. The agents will handle the rest.</span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="run-button group"
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      <span className="animate-pulse">Processing pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} fill="currentColor" />
                      <span>Run the pipeline</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200/90"
              >
                <X size={16} className="mt-0.5 shrink-0 text-rose-300" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                  className="text-rose-200/50 transition hover:text-rose-100"
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <AnimatePresence mode="wait">
          {workflowResult ? (
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-white/35">
                    <span className="text-emerald-300">02</span>
                    THE FORGE
                  </div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-white">
                    Pipeline results
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-1.5 text-[9px] font-semibold tracking-[0.12em] text-emerald-300/80">
                  <CheckCircle2 size={13} />
                  PIPELINE COMPLETE
                </div>
              </div>

              <motion.div
                variants={pipelineVariants}
                initial="hidden"
                animate="visible"
                className="relative"
              >
                <div
                  aria-hidden="true"
                  className="pipeline-rail absolute bottom-12 left-[22px] top-12 hidden w-px md:block"
                />
                <div className="relative grid gap-4">
                  {outputCards.map((card) => (
                    <div className="relative md:pl-[58px]" key={card.key}>
                      <div className={`pipeline-node node-${card.tone}`} aria-hidden="true">
                        {card.number}
                      </div>
                      <OutputCard
                        card={card}
                        content={workflowResult[card.key]}
                        onCopy={handleCopy}
                        copied={copiedKey === card.key}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.section>
          ) : (
            <motion.section
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="empty-forge"
            >
              <div className="empty-orbit">
                <div className="empty-orbit-inner">
                  <Terminal size={24} strokeWidth={1.5} />
                </div>
                <span className="orbit-dot orbit-dot-a" />
                <span className="orbit-dot orbit-dot-b" />
                <span className="orbit-dot orbit-dot-c" />
              </div>
              <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-white/30">
                <Sparkles size={12} className="text-violet-300/70" />
                OUTPUT SPACE
              </div>
              <p className="mt-2 text-sm text-white/35">
                Your three-stage output will appear here.
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-[9px] tracking-[0.12em] text-white/25">
          <span>FLOWFORGE AI <span className="text-white/15">/</span> MULTI-AGENT STUDIO</span>
          <span className="font-mono">DRAFT → CRITIQUE → REFINE</span>
        </footer>
      </div>
    </main>
  );
}