export const meta = {
  name: 'sf-research-shard',
  description: 'Research + adversarially verify a subset of briefing topics (shard)',
  phases: [
    { title: 'Research', detail: '8 parallel researchers, one per topic' },
    { title: 'Verify', detail: 'independent fact-checker per topic re-opens sources' },
  ],
}

const PREAMBLE = `Today is 2026-10-07. Your training data may be stale or missing recent events — rely on LIVE web research.
Load web tools first: call ToolSearch with query "select:WebSearch,WebFetch" (max_results 2).
Use WebSearch mode "standard" first; use "extended" for very recent (2026) or niche facts. Run several searches per turn in parallel.
Prefer primary sources (official announcements, model cards/system cards, papers, company engineering blogs) and reputable press.
Every claim MUST carry a source URL you actually saw. Mark confidence honestly. NEVER invent numbers, dates or quotes; quotes must be verbatim and <=25 words.
If you cannot find something, put it in open_questions rather than guessing.

CONTEXT: We are producing a 5–7 minute, no-voiceover executive-briefing video for a technically strong engineering leader (AI + software architecture literate). Story:
 (1) the "coding is solved" moment around Claude Opus 4.5 / 4.6 and how long it took (~5–6 months?) to diffuse into broad corporate adoption;
 (2) what a "software factory" is;
 (3) which agent architecture a software factory needs — hierarchical multi-agent system vs graph/workflow engineering vs swarm of agents (or a hybrid);
 (4) whether Claude Opus 5.5 — claimed to be exceptionally good at operating many interfaces (terminal, browser, GUI/computer use, APIs, MCP, other agents) — is the model that makes software factories practical, i.e. the next diffusion wave.
We only make the video if the thesis has real backing, so be rigorous and include counter-evidence you encounter.
We need precise, citable, MEMORABLE data points (numbers, dates, short quotes) that can go on screen.`

const TOPICS = [
  { key: 'coding-moment-opus45', prompt: `TOPIC: The "coding is solved" moment around Claude Opus 4.5.
- Exact release date of Claude Opus 4.5 and the official headline claims (SWE-bench Verified score, the internal performance-engineering take-home exam claim, pricing change, effort parameter).
- Practitioner + media reaction Nov 2025 – Jan 2026: the "Claude Code moment" over the 2025 holidays; Andrej Karpathy's posts (e.g. feeling behind as a programmer); notable "coding is (basically) solved"/"humans won't write code" statements (e.g. Boris Cherny, Ryan Dahl, Linus/others); mainstream press (NYT, WSJ, FT, The Verge, Axios, The Atlantic, etc.) declaring a turning point. Give exact dates, verbatim short quotes, URLs.
- When did mainstream/business press (not just tech Twitter) pick it up? Build a dated timeline of reaction.` },
  { key: 'opus46-and-codex', prompt: `TOPIC: Claude Opus 4.6 and the competitive wave (Dec 2025 – Apr 2026).
- Exact release date of Claude Opus 4.6 and headline features (agent teams in Claude Code, 1M context, benchmarks like Terminal-Bench, OSWorld, SWE-bench, ARC-AGI-2, GDPval).
- Anthropic engineering post where ~16 parallel Claude agents built a C compiler that compiles the Linux kernel (numbers: agents, sessions, cost, lines of code).
- OpenAI Codex timeline: GPT-5.1-Codex-Max, GPT-5.2-Codex, GPT-5.3-Codex, the Codex desktop app, GPT-5.4 etc. — exact dates, Dec 2025–Apr 2026.
- The Feb 2026 "SaaSpocalypse": software-stock sell-off attributed to Claude Cowork plugins / agentic AI — dates, magnitude (index or company drops).
- FACT-CHECK the user's recollection: they believe "Opus 4.6 came in November [2025]" and "Codex came this March [2026]". State precisely what actually happened when.` },
  { key: 'diffusion-data', prompt: `TOPIC: Quantitative diffusion of coding agents into companies, Nov 2025 → Oct 2026.
- Anthropic annualized run-rate revenue milestones with dates (e.g. ~$1B Jan 2025 → ... → 2026 figures); Claude Code run-rate revenue / user milestones with dates; OpenAI Codex weekly active users milestones; Cursor ARR milestones.
- Share of public GitHub commits authored by Claude Code (e.g. SemiAnalysis estimate) and its trend.
- Enterprise surveys / reports in 2026 measuring coding-agent adoption (e.g. Menlo Ventures, a16z, Gartner, McKinsey, Stack Overflow 2026 survey, The Pragmatic Engineer survey, Jellyfish/DX data) — with dates.
- Big-company statements on % of code written by AI or engineers no longer hand-writing code (e.g. Spotify, Google, Microsoft, Meta, Anthropic itself, Goldman Sachs/banks), with dates.
- Key question: is there data supporting a ~5–6 month lag between the capability moment (Nov 2025–Feb 2026) and broad corporate adoption (~Apr–Jun 2026)? Provide the best monthly/quarterly series you can find to draw a capability-vs-adoption curve, or evidence refuting that lag.` },
  { key: 'opus55', prompt: `TOPIC: Claude Opus 5.5 and the Claude 5 family.
- Release dates and lineage: Claude Opus 5, Opus 5.5, Sonnet 5.5, "Fable 5.1", Haiku — whatever exists. Official Anthropic announcement claims for Opus 5.5.
- Benchmark tables, especially for operating INTERFACES: computer use (OSWorld / OSWorld-Verified), browser (BrowseComp, WebArena, Online-Mind2Web), tool use (tau2-bench, MCP-Atlas, Toolathlon), terminal (Terminal-Bench 2.x), SWE-bench Pro/Verified, long-horizon (METR 50% time horizon, Vending-Bench), multi-agent / orchestration features, agentic search. Give exact numbers with comparison to Opus 4.5/4.6 and competitor frontier models (GPT-5.x, Gemini 3.x, etc.).
- System card highlights; third-party evaluations (METR, Epoch AI, Artificial Analysis, LMArena, Vals); practitioner and press reaction ("taste", design/UI quality, long-running autonomy).
- Collect evidence FOR and AGAINST the claim "Opus 5.5 is exceptionally good at using many different interfaces to get real jobs done", and whether it is the best model for orchestrating many agents.` },
  { key: 'software-factory-definition', prompt: `TOPIC: What is a "software factory"? History and the 2026 meaning.
- History: Hitachi's software factory (1969) and Toshiba/NEC/Fujitsu; Michael Cusumano's book "Japan's Software Factories" (1991); Microsoft "Software Factories" (Greenfield & Short, 2004); US Air Force Kessel Run (2017), Platform One and the DoD software-factory network; manufacturing "lights-out"/"dark factory" (e.g. FANUC robots building robots). Key dates and one-line takeaways.
- The 2026 AI meaning: StrongDM's AI "Software Factory" (rules like "code must not be written by humans" / "must not be reviewed by humans", scenarios as holdout tests, Digital Twin Universe, token spend per engineer), Dan Shapiro's "five levels" of AI-assisted programming culminating in the "dark factory", Simon Willison's coverage, Steve Yegge's Gas Town, Factory.ai Droids, 8090's Software Factory, GitHub Agent HQ / Copilot coding agent, AWS Kiro, OpenAI/Anthropic enterprise offerings; any enterprises publicly running AI software factories in 2026 (banks, consultancies, big tech) with outcomes.
- Produce: (a) a crisp 1–2 sentence executive definition; (b) the anatomy of a modern AI software factory as stations/stages (e.g. intent → spec → plan → build → verify → ship → operate → feedback) and where humans sit; (c) the 3–5 hardest unsolved problems (verification, context, cost, security...).` },
  { key: 'architecture-evidence', prompt: `TOPIC: Which agent architecture should a software factory use — graph/workflow engineering, hierarchical multi-agent (orchestrator-worker), or swarm (many peer agents)?
- Definitions with canonical references: Anthropic "Building effective agents" (workflows vs agents, Dec 2024); LangGraph-style graphs/state machines; Anthropic "How we built our multi-agent research system" (performance gain %, token multiplier, token usage explaining variance); OpenAI Swarm / Agents SDK handoffs; Moonshot Kimi K2.5 "Agent Swarm" (number of sub-agents, speedups); Claude Code agent teams; Gas Town; claude-flow.
- EMPIRICAL evidence (exact numbers): Google Research/DeepMind/MIT "Towards a Science of Scaling Agent Systems" (Dec 2025: gains on parallelizable tasks, losses on sequential tasks, error amplification for independent vs centralized topologies); Cognition "Don't Build Multi-Agents" (Jun 2025) and any 2026 follow-up; UC Berkeley MAST "Why Do Multi-Agent LLM Systems Fail?"; Cursor "Scaling long-running autonomous coding" (Jan 2026 — flat/equal agents with locking failed, optimistic concurrency failed, planner/worker/judge worked; the browser built by hundreds of agents; lines of code; duration); Anthropic C compiler with 16 parallel agents; any 2026 papers or engineering posts comparing topologies for software engineering.
- Output an evidence-backed recommendation: what a software factory needs (likely a hybrid — say exactly which layer uses which pattern and why), with the 3–4 most persuasive numbers.` },
  { key: 'interfaces', prompt: `TOPIC: Interfaces as the bottleneck for agents (why "can operate any interface" matters for a factory).
- MCP adoption statistics over time (number of public MCP servers, monthly SDK downloads, adoption by OpenAI/Google/Microsoft, donation to the Linux Foundation's Agentic AI Foundation in Dec 2025), A2A protocol status, Agent Skills open standard, computer-use APIs.
- Computer-use progression: OSWorld (and OSWorld-Verified) scores by model and date — Claude 3.5 Sonnet computer use (Oct 2024), Sonnet 3.7, Sonnet 4, Sonnet 4.5, Opus 4.5, Opus 4.6, Claude 5.x — plus the human baseline (~72%?). Also competitors' best scores. Build a dated series suitable for a chart.
- METR 50%-time-horizon progression for Claude models (Opus 4.5, Opus 4.6, any 5.x) and the doubling time estimate; any 2026 updates.
- Evidence that real enterprise work requires crossing many interfaces (ticketing, CI, cloud consoles, observability, legacy GUIs) and that interface breadth/reliability — not raw coding — is the current bottleneck for autonomous software delivery.` },
  { key: 'skeptic', prompt: `TOPIC: Devil's advocate. Find the STRONGEST evidence AGAINST our thesis.
- Failures / limits of autonomous agent teams and software factories in 2026: cost blowups, quality/"slop", security incidents caused by agents, comprehension/verification debt, outages; critiques of StrongDM-style dark factories; critiques of multi-agent swarms.
- METR's developer productivity RCT (July 2025, ~19% slowdown) and any 2026 follow-up results; other rigorous productivity studies in 2026.
- Weaknesses, regressions, pricing or reliability complaints about Claude Opus 5.5; areas where competitor models beat it (especially computer use / tool use / orchestration).
- Evidence the corporate diffusion of coding agents was much faster or slower than ~6 months, or that adoption is shallower than headlines suggest.
- Conclude: how should a fair briefing caveat the thesis?` },
]

const RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    summary: { type: 'string', description: '5-10 sentence synthesis of what you found' },
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'short slug' },
          claim: { type: 'string' },
          value: { type: 'string', description: 'the number / date / quote, exactly' },
          date: { type: 'string', description: 'date of the event or publication (YYYY-MM-DD if known)' },
          source_name: { type: 'string' },
          source_url: { type: 'string' },
          quote: { type: 'string', description: 'verbatim supporting text if any, <=25 words' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          video_relevance: { type: 'integer', description: '1-5: how useful on screen in the briefing' },
        },
        required: ['id', 'claim', 'value', 'source_url', 'confidence', 'video_relevance'],
      },
    },
    corrections_to_user_assumptions: { type: 'array', items: { type: 'string' } },
    open_questions: { type: 'array', items: { type: 'string' } },
  },
  required: ['topic', 'summary', 'claims', 'open_questions'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          verdict: { type: 'string', enum: ['verified', 'partially_verified', 'refuted', 'unverifiable'] },
          corrected_value: { type: 'string', description: 'the correct number/date/quote if different, else same' },
          best_source_url: { type: 'string' },
          independent_source_url: { type: 'string', description: 'a second independent source if found' },
          note: { type: 'string' },
        },
        required: ['id', 'verdict', 'corrected_value', 'best_source_url', 'note'],
      },
    },
    missed_important_facts: { type: 'array', items: { type: 'string' }, description: 'important facts the researcher missed, each with a URL' },
  },
  required: ['topic', 'verdicts'],
}

phase('Research')
const keys = Array.isArray(args) ? args : [args]
const mine = TOPICS.filter(t => keys.includes(t.key))
const results = await pipeline(
  mine,
  t => agent(`${PREAMBLE}\n\n${t.prompt}\n\nReturn 12–30 claims, ranked by video_relevance. Be exhaustive in searching, terse in writing.`, {
    label: `research:${t.key}`, phase: 'Research', schema: RESEARCH_SCHEMA,
  }),
  (r, t) => {
    if (!r) return null
    const top = [...r.claims].sort((a, b) => (b.video_relevance || 0) - (a.video_relevance || 0)).slice(0, 14)
    return agent(`${PREAMBLE}\n\nYou are an ADVERSARIAL FACT-CHECKER. A researcher produced the claims below for topic "${t.key}". For EACH claim: open the cited URL (WebFetch) and confirm the exact value/date/quote; then search for an independent second source. Default to "unverifiable" if you cannot confirm; mark "refuted" and give the corrected value if wrong. Be strict about exact numbers, dates and verbatim quotes. Also list any important facts the researcher missed (with URLs).\n\nCLAIMS:\n${JSON.stringify(top, null, 1)}`, {
      label: `verify:${t.key}`, phase: 'Verify', schema: VERIFY_SCHEMA,
    }).then(v => ({ key: t.key, research: r, verification: v }))
  },
)
return { topics: results.filter(Boolean) }
