# Fact sheet: the only claims the trailer may put on screen

Every item here was researched and adversarially fact-checked for the first version. Sources are listed in `../software-factory-opus-5-5/docs/sources.md`.

**Wording rules:**
- You may shorten a claim.
- You may not strengthen it.
- Numbers keep their units.
- A vendor or self-reported claim must not be presented as independent.
- **Bold** marks the safe on-screen wording.

## Wave 1: the coding-agent moment
- Oct 17 2025: Andrej Karpathy on AI agents as interns or employees: **"They just don't work."**
- **Nov 24 2025: Claude Opus 4.5 ships.** Anthropic says it outscored every human candidate on its 2-hour engineering take-home. Launch press was routine.
- Dec 26 2025 (+5 weeks), Karpathy: **"I've never felt this much behind as a programmer."**
- Dec 27 2025, Boris Cherny (creator of Claude Code): 259 PRs in 30 days, **"Every single line was written by Claude Code + Opus 4.5."**
- Jan 14–23 2026 (+8 weeks): The Atlantic, WSJ, Bloomberg and NYT cover it. WSJ: **"They call it getting 'Claude-pilled.'"**
- Feb 3 2026 (+10 weeks): **a $285B stock rout**, across software, financial-services and asset-management stocks. It was sparked by an Anthropic tool for lawyers, not a coding release. Jefferies' desk called it the **"SaaSpocalypse."**
- Apr 6 2026 (+19 weeks), Anthropic-reported run-rate: **~$9B → $30B+** (end-2025 → Apr 2026).
- Ramp AI Index (as reported May 13): Anthropic passes OpenAI in US business adoption, April data.
- **≈5 months from capability to budget.**
- Google: **75% of new code is AI-generated** (Apr 2026, Pichai).
- JetBrains: **Claude Code used at work by 18% → ~39%** of professional devs (Jan → mid-2026).
- McKinsey (Aug 2026): **only ~2 in 10 organizations are scaling coding agents.**
- Atlassian (2025): **developers spend 16% of their time writing code.**

## The software factory
- **Hitachi Software Works, 1969** was the first company to adopt the term "software factory" (57 years ago).
- FANUC has run a lights-out robot plant since 2001; it is hardware, not software.
- StrongDM's dark factory (Feb 2026) set two rules: **"Code must not be written by humans." / "Code must not be reviewed by humans."** It benchmarks **$1,000/day per engineer in tokens**.
- Dan Shapiro, Jan 2026: Level 5 "dark factories" are run by **only "a handful" of teams** so far.
- **Factory (a coding-agent startup) raised at a $5B valuation**, Sep 15 2026, saying: **"A move from individual coding agents to software factories."**
- AWS Kiro: **1,000 PRs merged in 7 days** (Sep 2026).

## Architecture (what actually works)
- Google Research (Jan 2026): **independent agents amplify errors 17.2×; with a central coordinator, 4.4×.**
- The same study found that **on sequential tasks, every multi-agent setup lost 39–70%**, and that on parallel tasks a central coordinator gained up to 81%.
- Cursor (Jan 2026): **20 flat agents with locks had the throughput of 2–3.** With planners + workers, the system **ran close to a week and wrote 1M+ lines.** That is volume, not quality.
- Anthropic: **16 agents, no orchestrator, built a C compiler** (100k lines, about 2,000 sessions, under $20k; it builds Linux 6.9).
- Cognition, Jun 2025: **"Don't build multi-agents."** Apr 2026: **"Multi-agent systems work best today when writes stay single-threaded."**
- Rule of thumb: **parallelize reading; one writer per change.**

## Interfaces
- OSWorld computer use: **14.9% (Oct 2024) → 72.7% (Feb 2026)**, against a human baseline of 72.4%. That is OSWorld, then OSWorld-Verified.
- OSWorld 2.0 tests **1.6-hour workflows** with hundreds of actions. Strict pass rates: **Opus 5 37.2% → Fable 5.1 42.8% → Opus 5.5 48.7%**, all on the same harness. These are under half, and climbing.
- MCP: **nearly 500M SDK downloads a month** (Tier-1 SDKs, Jul 2026).

## Claude Opus 5.5 (released Sep 22 2026)
- **Fable 5.1-level work at 40% lower cost than Opus 5** (Anthropic).
- **100-agent teams ran 24 hours and picked their own structure**: 12 sub-leads for proofs, flat for a knowledge base (system card).
- Stripe: **one session directed a dozen more; 40 stacked PRs, all green in CI.**
- Clio: **18+ hours unattended across 6 repositories.**
- **Top score in Anthropic's launch table on Terminal-Bench 4.0 (66.4%)**; Sonnet 5.5 is close behind on Vals.
- Anthropic internally: **about 30,000 agents working at once** (Aug 2026, Anthropic Institute).
- It is NOT Anthropic's most capable model; Fable 5.1 and Mythos 5.1 sit above it. METR calls it "an incremental improvement… rather than a discontinuous jump." Gemini 4 Argon leads AutomationBench. Don't claim "best at everything".

## The next wave (projection; always label it)
- Last time, capability → budget took ≈5 months.
- **"If the pattern holds: budgets in early 2027."** This is a projection, not a fact.

## Credits (true)
- This trailer was researched, fact-checked, scripted, scored and rendered with Claude Opus 5.5 agents, from one human brief.
