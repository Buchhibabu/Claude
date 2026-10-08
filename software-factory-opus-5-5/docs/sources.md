# Sources and fact-check log

Every number and quote on screen is listed here, in scene order. Independent research agents found each one, and a separate adversarial fact-checker then re-opened the cited source.

**Status:** ✅ verified verbatim against the primary source · 🟡 partially verified (the caveat is noted, and the on-screen wording was adjusted to match)

Research date: 2026-10-07.

---

## Ch01 · The last wave (coding agents)

| On screen | Status | Source |
|---|---|---|
| "They just don't work." Karpathy on AI agents as interns or employees, Oct 17 2025 | ✅ | [Dwarkesh Podcast transcript](https://www.dwarkesh.com/p/andrej-karpathy) · [Simon Willison](https://simonwillison.net/2025/Oct/18/agi-is-still-a-decade-away/) |
| Claude Opus 4.5 ships Nov 24 2025; Anthropic says it outscored every human candidate on its 2-hour take-home | ✅ vendor claim (footnote: parallel test-time compute; with no time limit it matched the best-ever human candidate) | [Anthropic](https://www.anthropic.com/news/claude-opus-4-5) |
| "I've never felt this much behind as a programmer." Karpathy, Dec 26 2025 | ✅ | [X / @karpathy](https://x.com/karpathy/status/2004607146781278521) |
| Cherny: 259 PRs in 30 days, "Every single line was written by Claude Code + Opus 4.5", Dec 27 2025 (not shown on screen; background) | ✅ | [X / @bcherny](https://x.com/bcherny/status/2004887829252317325) · [Simon Willison](https://simonwillison.net/2025/Dec/27/boris-cherny/) |
| Press wave Jan 14–23 2026: The Atlantic, WSJ ("They call it getting 'Claude-pilled'", which reports existing usage rather than coining the term), Bloomberg, NYT | ✅ / 🟡 WSJ paywalled; lede confirmed via a brief | [The Atlantic](https://www.theatlantic.com/technology/2026/01/claude-code-ai-hype/685617/) · [WSJ via OODA Loop](https://oodaloop.com/briefs/technology/claude-is-taking-the-ai-world-by-storm-and-even-non-nerds-are-blown-away/) · [Bloomberg](https://www.bloomberg.com/news/articles/2026-01-19/why-the-tech-world-is-going-crazy-for-claude-code) · [NYT](https://www.nytimes.com/2026/01/23/technology/claude-code.html) |
| $285B rout across software, financial-services and asset-management stocks, Feb 3 2026, sparked by an Anthropic tool for lawyers; Jefferies' desk: "We call it the 'SaaSpocalypse'" | ✅ | [Bloomberg Law](https://news.bloomberglaw.com/ip-law/anthropics-move-into-legal-is-sinking-data-services-stocks-3) · [Gulf Times / Bloomberg](https://www.gulf-times.com/article/719895/business/get-me-out-traders-dump-software-stocks-as-ai-fears-erupt) |
| Anthropic-reported run-rate: ~$9B (end 2025) → $30B+ (Apr 6 2026) | ✅ self-reported | [Anthropic, Apr 6 2026](https://www.anthropic.com/news/google-broadcom-partnership-compute) |
| Ramp: Anthropic passes OpenAI in US business adoption, April data (34.4% vs 32.3%) | ✅ as reported (Ramp restated its method in June) | [Ramp AI Index, May 2026](https://ramp.com/data/ai-index-may-2026) |
| Ramp monthly series: 14.3 → 16.7 → 19.5 → 24.4 → 30.6 → 34.4 ‖ 41.0 → 42.4 → 43.5 → 43.8 | 🟡 method change after April; the chart marks the break | [Ramp Jun 2026](https://ramp.com/data/ai-index-june-2026) · [Ramp Sep 2026](https://ramp.com/data/ai-index-sept-2026) |
| *(background, not on screen)* 51.9% of coding work delegated to AI, Q2 2026 (from 27.4% in Q1) | ✅ developer self-reports, preliminary | [DX](https://getdx.com/blog/ai-authored-code-has-nearly-doubled/) |
| 75% of Google's new code AI-generated (Apr 2026) | ✅ | [Semafor](https://www.semafor.com/article/04/24/2026/google-ceo-says-75-of-companys-new-code-is-ai-generated) |
| Claude Code at work: 18% (Jan) → 39% (May–Jul 2026) | ✅ (instruments may differ) | [JetBrains Research](https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/) |
| ~2 in 10 organizations scaling coding agents (31% of large enterprises) | ✅ | [McKinsey via IDM](https://idm.net.au/node/15761) |
| Developers spend 16% of their time coding | ✅ | [Atlassian State of DevEx 2025](https://www.atlassian.com/blog/developer/developer-experience-report-2025) |

## Ch02 · The software factory

| On screen | Status | Source |
|---|---|---|
| Hitachi Software Works, 1969: the first "software factory" | ✅ | [Wikipedia: Software factory](https://en.wikipedia.org/wiki/Software_factory) |
| FANUC lights-out plant (since 2001) | ✅ (2003 reporting) | [Wikipedia: Lights out manufacturing](https://en.wikipedia.org/wiki/Lights_out_(manufacturing)) |
| Microsoft "Software Factories" (Greenfield & Short, 2004) | ✅ | [softwarefactories.com](https://softwarefactories.com/TheBook.html) |
| US Air Force Kessel Run (2017): human DevSecOps factories | ✅ | [Wikipedia: Kessel Run](https://en.wikipedia.org/wiki/Kessel_Run) |
| StrongDM: "Code must not be written by humans" / "must not be reviewed by humans"; $1,000/day per engineer in tokens | ✅ | [factory.strongdm.ai](https://factory.strongdm.ai/) · [Simon Willison](https://simonwillison.net/2026/Feb/7/software-factory/) |
| Dark-factory "Level 5": only "a handful" of teams (Jan 23 2026) | ✅ | [Dan Shapiro](https://www.danshapiro.com/blog/2026/01/the-five-levels-from-spicy-autocomplete-to-the-software-factory/) |

## Ch03 · The architecture

| On screen | Status | Source |
|---|---|---|
| 17.2× vs 4.4× error amplification (independent vs centralized agents) | ✅ | [Google Research blog, Jan 28 2026](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) |
| +80.9% on a parallelizable task **with centralized coordination**; every multi-agent variant −39% to −70% on sequential tasks | ✅ (+80.8% in arXiv v2) | same · [arXiv 2512.08296](https://arxiv.org/abs/2512.08296) |
| On SWE-bench Verified, every multi-agent architecture scored slightly below a single agent | ✅ | [arXiv 2512.08296 v3 (Apr 2026)](https://arxiv.org/abs/2512.08296v3) |
| Cursor (building a web browser with agents, an experiment): 20 flat agents with locks had the throughput of 2–3; planners + workers "ran for close to a week, writing over 1 million lines" (volume, not quality) | ✅ (the ~1,000 commits/hr figure was a peak, so it isn't shown) | [Cursor, Jan 14 2026](https://cursor.com/blog/scaling-agents) |
| StrongDM's factory runs on DOT-graph pipelines (Attractor) | ✅ | [strongdm/attractor spec](https://github.com/strongdm/attractor/blob/main/attractor-spec.md) |
| Anthropic's 16-agent C compiler: no orchestrator, ~2,000 sessions, <$20k, 100k lines, builds Linux 6.9 | ✅ | [Anthropic Engineering](https://www.anthropic.com/engineering/building-c-compiler) |
| Cognition: "multi-agent systems work best today when writes stay single-threaded"; unstructured swarms "mostly a distraction" | ✅ | [Cognition, Apr 22 2026](https://cognition.com/blog/multi-agents-working) |

## Ch04 · The interfaces

| On screen | Status | Source |
|---|---|---|
| OSWorld: 14.9% (Claude 3.5 Sonnet, Oct 2024) → 72.7% (Opus 4.6, Feb 2026) | ✅ (the later points are OSWorld-Verified) | [Anthropic Oct 2024](https://www.anthropic.com/news/3-5-models-and-computer-use) · [Sonnet 4.5](https://www.anthropic.com/news/claude-sonnet-4-5) · [Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6) |
| Human baseline 72.36% (original OSWorld) | ✅ | [OSWorld paper](https://arxiv.org/abs/2404.07972) |
| OSWorld 2.0: workflows with a median of 1.6 human-hours and hundreds of actions | ✅ | [OSWorld 2.0](https://osworld-v2.xlang.ai/) |
| OSWorld 2.0 strict pass: Opus 5 37.2% · Fable 5.1 42.8% · Opus 5.5 48.7% (same harness) | ✅ | [Claude Opus 5.5 System Card](https://www-cdn.anthropic.com/fc1b44717c85dc068bc6ba5024219938094694bd/Claude%20Opus%205.5%20System%20Card.pdf) |
| MCP: close to 500M SDK downloads a month (Tier 1 SDKs, Jul 2026) | ✅ | [MCP blog, Jul 28 2026](https://blog.modelcontextprotocol.io/posts/2026-07-28/) |

## Ch05 · The model: Claude Opus 5.5

*METR's "incremental improvement above Fable 5.1… rather than a discontinuous jump" ([METR](https://metr.org/blog/2026-09-22-claude-opus-5-5/)) is shown on screen as the scorecard caveat.*

| On screen | Status | Source |
|---|---|---|
| Released Sep 22 2026; Fable 5.1-level work at 40% lower cost than Opus 5 | ✅ | [Anthropic](https://www.anthropic.com/claude-opus-5-5) |
| 100-agent teams ran for 24h and chose their own structure: 12 sub-leads (proofs), flat (knowledge base) | ✅ | System Card §8.12.3 |
| One session directed a dozen more: 40 stacked PRs, all passing CI (Stripe) | ✅ | [Anthropic launch page](https://www.anthropic.com/claude-opus-5-5) |
| 18+ hours unattended across 6 repositories (Clio) | ✅ | same |
| Terminal-Bench 4.0: 66.4%, top of Anthropic's launch table; Sonnet 5.5 close behind on Vals | 🟡 Vals #1 at 65.15% before the fallback caveat (58.08% after) | [Vals.ai](https://www.vals.ai/benchmarks/terminal-bench-4) |
| AutomationBench: Opus 5.5 42.5%, behind Gemini 4 Argon at 51.3% | ✅ (live leaderboard, Oct 7) | Zapier AutomationBench leaderboard · System Card Table 8.1.A |

## Ch06 · The next wave

| On screen | Status | Source |
|---|---|---|
| "Don't build multi-agents." (Cognition, Jun 12 2025) | ✅ | [Cognition](https://cognition.com/blog/dont-build-multi-agents) |
| Factory (a coding-agent startup) raises $200M at a $5B valuation; "a move from individual coding agents to software factories" (Sep 15 2026) | ✅ | [SiliconANGLE](https://siliconangle.com/2026/09/15/factory-raises-200m-for-its-self-improving-software-development-platform/) |
| AWS Kiro: 1,000 PRs merged in 7 days (background) | ✅ | [Kiro blog](https://kiro.dev/blog/software-factory-1000-prs/) |
| Capability rung, Jan–Feb 2026: a browser (Cursor), a C compiler (Anthropic), a dark factory (StrongDM) | ✅ | see Ch03 rows |
| Cognition, Apr 22 2026: "multi-agent systems work best today when writes stay single-threaded" | ✅ | [Cognition](https://cognition.com/blog/multi-agents-working) |
| "If the pattern holds: budgets in early 2027": a projection, labeled as one; Opus 5.5 is treated as the economics step | n/a | Derived from the ~5-month lag in Ch01 |
| Coda: this video was produced by 8 research agents, 8 fact-checkers, 1 planner (the orchestrating session), 6 scene builders, 9 critics and 8 fixers, all running Claude Opus 5.5 | ✅ | Session metadata: configured and served model `claude-opus-5-5` |

## Caveats we chose to show (and why)
- **Opus 5.5 isn't Anthropic's most capable model.** Fable 5.1 and Mythos 5.1 rank above it. Its case is efficiency plus orchestration, not raw capability.
- **METR calls Opus 5.5 "an incremental improvement above Fable 5.1… rather than a discontinuous jump"** ([METR](https://metr.org/blog/2026-09-22-claude-opus-5-5/)).
- **Computer use isn't solved.** The OSWorld 2.0 strict pass rate is under 50%, and GUI is the weakest prompt-injection surface (2.8% vs 0.5% for coding; System Card).
- **Factories are expensive.** StrongDM's benchmark is $1,000/day per engineer, and Uber exhausted its 2026 AI budget early ([Ramp, May 2026](https://ramp.com/data/ai-index-may-2026)).
- **Org-level productivity proof is thin.** See METR's 2026 uplift update ([METR](https://metr.org/blog/2026-02-24-uplift-update/)) and Faros telemetry ([Faros](https://www.faros.ai/blog/ai-software-engineering)).
