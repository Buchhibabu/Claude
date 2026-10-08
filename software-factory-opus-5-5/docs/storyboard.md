# The Software Factory Moment: storyboard

> **This is the original plan.** The final on-screen copy changed after two fact-check passes and a nine-critic review (visual, story/pacing and facts lenses). For the exact text that ships, see [`script.md`](script.md). For the reasoning, see [`verdict.md`](verdict.md).

**Format:** 1920×1080, 30 fps, about 6.5 minutes. There's no voiceover; an original ambient score carries the mood. The audience is a technically strong engineering executive.
**Structure:** executive briefing. The bottom line comes first, then context, then evidence, then implications, then the ask.
**Spine (the dots we connect):** Coding wave → Software factory → Architecture → Interfaces → Opus 5.5 → Next wave.
A persistent "thread" at the bottom of the frame lights one dot per chapter, so the viewer always sees where they are in the argument.

**Central idea:** *capability arrives first; belief follows, and the gap between them is where advantage lives.*

---

## Pacing rules (from the brief: "don't make it fast; connect the dots")

- Every transition has about 1 s of air: the outgoing element fades over ~0.9 s, then the next one rises in over ~1.2 s. Nothing cuts.
- Reading time is 2 s plus 0.3 s per word, at minimum, before anything leaves the screen.
- One idea per screen. Headlines run 12 words or fewer; supporting lines run 20 or fewer.
- Each chapter ends with a **bridge line**: a question or tension that the next chapter answers.
- Recurring visuals carry continuity: the factory line from Ch02 comes back in Ch03 and Ch06, and the diffusion ladder from Ch01 comes back in Ch06.

---

## 00 · Title (12 s)
Black. A single clay dot breathes in. Title, set word by word: **The Software Factory Moment**.
Sub: *What the coding-agent wave tells us about the next one.* Small: *An executive briefing · October 2026*.

## 01 · Bottom line (26 s)
Kicker: **The bottom line**. Three numbered claims appear one at a time, each holding about 6 s:
1. **We've seen this curve.** Coding agents went from "they just don't work" to a budget line in about five months.
2. **The next curve is the software factory:** agents running the whole delivery line, not just the editor.
3. **Its bottleneck isn't code. It's orchestration and interfaces,** and that is exactly where Opus 5.5 is built to be good.

Closing beat: *Here's the evidence.* The thread appears.

## Ch01 · The last wave
### 10 · Diffusion ladder (≈52 s)
Real date axis, Oct 2025 → May 2026. A staircase climbs while a caption deck tells each rung's story:
- **Consensus**, Oct 17: "They just don't work." (Karpathy, on agents)
- **Capability**, Nov 24: Claude Opus 4.5 ships. Press coverage is routine.
- **Practitioners**, +5 wks: "I've never felt this much behind as a programmer." (Karpathy, Dec 26)
- **Press**, +8 wks: The Atlantic, WSJ ("Claude-pilled"), Bloomberg, NYT.
- **Markets**, +10 wks: a $285B software rout (Bloomberg, Feb 3), the "SaaSpocalypse".
- **Budgets**, +19 wks: Anthropic-reported run-rate goes from $9B to $30B+, and Ramp reports Anthropic passing OpenAI in business adoption (April data).

Bracket: **≈ 5 months from capability to budget.** Headline: *Capability arrived in November. Belief arrived in April.*

### 11 · Evidence (≈26 s)
Ramp AI Index monthly S-curve (Oct 2025 → Aug 2026), with an Opus 4.5 marker, the steepest climb (months 2–5) shaded, and the method change after April marked.
Stats: **51.9%** of code AI-authored in Q2 2026 (DX) · **75%** of Google's new code (Apr 2026) · **18% → 39%** of professional devs using Claude Code at work (JetBrains).
Takeaway: *Individuals flipped in weeks. Organizations took two quarters.*

### 12 · Bridge → factory (≈12 s)
"Yet only **~2 in 10** organizations are scaling coding agents." (McKinsey, Aug 2026)
"Because code is **16%** of a developer's week." (Atlassian, 2025)
→ *Automate the code, and the rest of the line still moves at human speed.*

## Ch02 · The software factory
### 20 · History (≈22 s)
"The software factory is 57 years old." Timeline: 1969 Hitachi → 2001 FANUC lights-out plant → 2004 Microsoft Software Factories → 2017 Kessel Run (people) → 2026 the dark factory ("Code must not be written by humans").
*Every era built the line. None had the worker.* → *Agents are the worker.*

### 21 · The line (≈30 s)
Six stations (Intent · Spec · Build · Verify · Ship · Operate). First *The coding agent automated one station* (Build lit), then *The factory automates the line*. Work items flow and turn green after Verify. Humans move to the edges, and a production-feedback loop closes the line.
Definition: *A governed production line: humans supply intent and acceptance; fleets of agents plan, build, verify, ship and operate.*

## Ch03 · The architecture
### 30 · Three schools + evidence (≈40 s)
Bridge question: *Who runs the line?* Three animated topologies:
- **Graph:** predefined paths, deterministic and auditable. (StrongDM's factory runs on DOT-graph pipelines.)
- **Hierarchy:** a planner delegates and workers execute. (Cursor; Claude Code agent teams.)
- **Swarm:** peers self-organize. (Anthropic's 16-agent C compiler; Kimi Agent Swarm.)

Evidence lands under each:
- **17.2× vs 4.4×** error amplification for independent vs centralized agents (Google Research, 2026).
- **20 → 2–3:** 20 flat agents with locks did the work of 2–3, while planners plus workers wrote 1M+ lines in a week (Cursor).
- **+81% / −39–70%:** multi-agent setups help parallel tasks and hurt sequential ones (Google Research).

### 31 · Synthesis (≈20 s)
The factory line comes back. The outer line is a **graph**. Zooming into Build shows a planner with workers (**hierarchy**). Around Verify, a burst of parallel reviewers and testers (**swarm**).
**Graph for control. Hierarchy for coherence. Swarm for throughput.** Rule of thumb: *parallelize reading, serialize writing.*

## Ch04 · The interfaces
### 40 · Every station is an interface (≈20 s)
An agent at the center. One lit interface reads *A coding agent needs one interface: the repo.* Then a ring of eleven lights up: terminal, browser, desktop apps, APIs, MCP tools, tickets, CI/CD, cloud console, observability, docs & chat, other agents. *A factory needs all of them.*
Stat: MCP reaches ~**500M** SDK downloads a month (Jul 2026).

### 41 · Computer use (≈22 s)
OSWorld rises from **14.9%** (Oct 2024) to **72.7%** (Feb 2026) and crosses the **72.4%** human baseline. *Short tasks: solved in 16 months.*
So the bar moved: OSWorld 2.0 is 1.6-hour workflows with hundreds of actions each. Strict pass rate: Opus 5 37.2% → Fable 5.1 42.8% → **Opus 5.5 48.7%**.
*Not solved. Climbing fast.*

## Ch05 · The model
### 50 · Opus 5.5 scorecard (≈32 s)
*Not the biggest model. The one built for the factory floor.*
- **Orchestrate:** 100-agent teams ran 24 h and chose their own structure: 12 sub-leads for proofs, flat for knowledge work.
- **Delegate:** one session directed a dozen more; 40 stacked PRs, all green in CI (Stripe).
- **Endure:** 18+ hours unattended across 6 repos (Clio).
- **Terminal:** top score on Terminal-Bench 4.0 (66.4%), with Sonnet 5.5 close behind.
- **GUI:** best strict OSWorld 2.0 (48.7%), but still under half (◐).
- **Multi-app APIs:** 42.5% on AutomationBench, while Gemini 4 Argon leads at 51.3% (◐).
- **Cost:** Fable-level work at 40% lower cost than Opus 5.

*Opus 4.5 made the coding agent real. Opus 5.5 makes the factory affordable to run.*

## Ch06 · The next wave
### 60 · Same ladder, second climb (≈34 s)
Date axis Jun 2025 → Apr 2027:
- **Consensus**, Jun 2025: "Don't build multi-agents." (Cognition)
- **Pioneers**, Feb 2026: StrongDM's dark factory ("Code must not be reviewed by humans").
- **Converts**, Apr 2026: Cognition, "multi-agent systems work best… when writes stay single-threaded."
- **Capital**, Sep 15: Factory raises at a $5B valuation, "a move from individual coding agents to software factories."
- **Capability**, Sep 22: Opus 5.5.
- **Budgets**: projected, dashed. *If the pattern holds: early 2027.*

"We are here" marker. Headline: *Last time, capability to budget took five months. This time, the clock started on September 22.*

### 61 · What to do now + what would make this wrong (≈30 s)
Three moves:
1. **Pick one product line.** Run it as a factory pilot, and measure lead time, escaped defects and cost per change.
2. **Build verification first.** Scenarios, holdout tests, digital twins: autonomy is a property of the repo.
3. **Open interfaces, safely.** MCP/APIs, sandboxed computer use, scoped credentials, a full audit trail.

What would make this wrong: token cost ($1,000/day per engineer at StrongDM), verification debt, prompt injection through GUIs, and no org-level proof yet.

### 62 · Close (≈20 s)
The thread completes and all six dots connect. Recap words fade in under each dot.
*Capability arrives first. Belief follows. The gap is the opportunity.*
Credit: *Researched, fact-checked, scripted, scored and rendered by a small software factory of Claude agents.*
