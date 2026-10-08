export const meta = {
  name: 'sf-build-scenes',
  description: 'Parallel scene builders for the software-factory briefing video (each renders + inspects its own stills)',
  phases: [{ title: 'Build', detail: 'one builder per scene group' }],
}

const ROOT = '/home/user/skills-introduction-to-github/software-factory-opus-5-5'
const COMMON = `You are building scenes for a calm, premium, no-voiceover executive-briefing video ("The Software Factory Moment") rendered from HTML/GSAP. Project root: ${ROOT}.
FIRST read ${ROOT}/docs/BUILDING.md and follow it exactly, then read the files it lists (engine, libs, styles, the four reference scenes, storyboard). Match the reference scenes' look and pacing — they set the bar.
Work only on your assigned files in ${ROOT}/src/scenes/. Do not edit any other file. Run commands from ${ROOT}.
Use the EXACT on-screen copy given below (you may add line breaks; do not change facts or numbers). Every number on screen gets a source via L.source(root, '...') faded in with tl.to(src, {opacity: 1, duration: 1}, t).
When done, render stills with --every 1.0 across your scene(s), inspect them carefully (contact sheets), fix every issue, and repeat until clean. Then return a short report: files, durations, deviations from spec, open concerns.`

const SPECS = {
  intro: `ASSIGNMENT: create three files.
(1) src/scenes/00-title.js — id 'title', duration 12, mood 'dark', chapter null.
  Black, calm. At 0.8s a small clay dot (r≈6, with soft glow) breathes in at center (y≈430) and gently pulses (L.loop). At 2.0s the title "The Software Factory Moment" (class display, centered, y≈470) reveals word by word (K.words). At 4.4s subtitle (body, muted, centered): "What the coding-agent wave tells us about the next one." At 6.0s small label (label class, centered, y≈700): "An executive briefing · October 2026". Hold. Everything fades out 10.4–11.6.
(2) src/scenes/01-bluf.js — id 'bluf', duration 26, mood 'calm', chapter null.
  Kicker (label, clay) "The bottom line" at top-left (x 160, y≈190). Three numbered rows stacked (y≈300, 470, 640), each: a big serif numeral ("01","02","03", clay, ~96px) at x 160 and text at x≈330, width ≈1300, serif ~46px, line-height 1.2. Bold/paper part first, rest muted:
   01  "<b>We've seen this curve.</b> Coding agents went from “they just don't work” to a budget line in about five months."
   02  "<b>The next curve is the software factory</b> — agents running the whole delivery line, not just the editor."
   03  "<b>Its bottleneck isn't code. It's orchestration and interfaces</b> — exactly what Opus 5.5 is built for."
  Reveal row 1 at 1.4s, row 2 at 7.6s, row 3 at 13.8s (each with its numeral first, then text). When a new row arrives, the previous rows dim to ~45% opacity so attention moves down. At 20.2s all three return to full opacity briefly, then at 21.0s rows fade out; at 22.0s a centered serif italic line "Here's the evidence." (h2, paper) rises in; fades out 24.6–25.6.
(3) src/scenes/12-bridge.js — id 'bridge', duration 12, mood 'calm', chapter { n: '01', title: 'The last wave', short: 'Coding' }.
  Two stats side by side (centers x≈620 and x≈1300, y≈330): left value "~2 in 10" (class num, ~150px, paper) with label (body) "organizations are scaling coding agents"; right value "16%" (num, gold) with label "of a developer's time is spent writing code". Sources via L.source: "McKinsey, Aug 2026 · Atlassian State of DevEx 2025". Left in at 0.6s, right in at 2.4s. At 5.6s a centered line (h2 serif, ~54px) word-reveals below them (y≈700): "Automate the code, and the rest of the line <em class=\\"clay\\">still moves at human speed.</em>" Everything out 10.4–11.6.`,

  arch: `ASSIGNMENT: create src/scenes/30-arch.js — id 'arch', duration 38, mood 'cool', chapter { n: '03', title: 'The architecture', short: 'Architecture' }, hits [13.0].
 Story: "Who runs the line?" Three schools of multi-agent architecture, then the evidence, then a one-word role for each.
 0.5s: heading (L.heading, kicker "The architecture", title 'Who runs the line? <em class="clay">Three schools.</em>', size h2) at top-left (x 160, y≈150).
 Three columns centered at x≈420, 960, 1500 (each ~440 wide). Each column: a diagram area (y≈300–540) with a live animated topology, then the name (serif ~52px), a one-liner (body ~24px, paper-2) and an example (small, muted):
  GRAPH — diagram: 6 nodes left→right as a DAG (two branches that merge), arrow edges, packets flowing in sequence (L.edge + L.packets). Name "Graph". One-liner "Predefined paths. Deterministic, auditable." Example "StrongDM's factory runs on DOT-graph pipelines".
  HIERARCHY — diagram: 1 planner node (clay, top), 2 sub-planners, 4 workers; edges; packets travel down and results back up. Name "Hierarchy". One-liner "A planner delegates. Workers execute." Example "Cursor's planners + workers · Claude Code agent teams".
  SWARM — diagram: ~22 small peer nodes drifting organically (L.loop with seeded sin/cos), with links drawn between nodes closer than a threshold (pool of ≤40 <line> elements updated per frame, opacity by distance). Name "Swarm". One-liner "Peers self-organize." Example "Anthropic's 16-agent C compiler · Kimi Agent Swarm".
 Reveal columns at 2.4s, 5.4s, 8.4s (diagram first, text 0.6s later). Diagrams keep animating for the whole scene.
 13.0s: evidence row (y≈720–900) — three cards appear one at a time (13.0, 18.0, 23.0), each: big number (num class, ~64px) + one sentence (body ~22px) + tiny source (src class):
   A "17.2× vs 4.4×" — "Error amplification: independent agents vs. a central coordinator." — Google Research, Jan 2026
   B "20 → 2–3" — "Twenty flat agents with locks did the work of two or three. Planners + workers then wrote 1M+ lines in a week." — Cursor, Jan 2026
   C "+81% / −39–70%" — "Multi-agent helps parallel work — and hurts sequential work." — Google Research, 2026
  (Make the cards full-width row under the three columns; they are general evidence, not per-column.) Also set L.source(root, 'Google Research, “Towards a Science of Scaling Agent Systems” (2026) · Cursor, “Scaling long-running autonomous coding” (Jan 2026)').
 29.0s: the evidence cards dim to ~35%; under each column's one-liner a role tag appears (label class, colored): Graph → "FOR CONTROL" (sky), Hierarchy → "FOR COHERENCE" (clay), Swarm → "FOR THROUGHPUT · PARALLEL WORK ONLY" (gold). Stagger 0.8s.
 36.4s–37.6s: everything fades out.`,

  synth: `ASSIGNMENT: create src/scenes/31-synthesis.js — id 'synthesis', duration 22, mood 'cool', chapter { n: '03', title: 'The architecture', short: 'Architecture' }.
 Story: the answer is layered, shown on the SAME factory line the viewer saw in chapter 02 (reuse Factory.build/Factory.run from src/lib-factory.js; position the line higher, around y≈420, so there is room below).
 0.5s: the line fades in already built (stations visible, agents orbiting, items flowing). Above the line, a label row: "GRAPH" tag (label, sky) + "the line itself: deterministic stations and gates" (small). Draw a thin sky bracket spanning the whole line.
 4.5s: under the BUILD station, a hierarchy unfolds downward: a planner node (clay, labeled "planner · single writer") ~120px below Build, then 4 worker nodes fanning out ~110px below the planner, edges drawn with K.draw, packets moving down/up. Tag "HIERARCHY" (label, clay) + "one planner keeps the work coherent" beside it.
 9.0s: around the VERIFY station, a swarm burst: ~16 small gold dots expand outward from Verify into a loose orbiting cloud (L.loop), some faint links. Tag "SWARM" (label, gold) + "parallel reviewers, testers, explorers" beside it.
 Keep all three labels readable and not overlapping the stations (stations are 168×120 with names above and subtitles below — check your stills).
 13.2s: centered headline (serif ~52px) word-reveals near the bottom (y≈840): "Graph for control. Hierarchy for coherence. Swarm for throughput." with the three key nouns colored sky / clay / gold.
 16.8s: below it, small line (body ~24px, muted): "Rule of thumb: parallelize reading, serialize writing. On SWE-bench, every multi-agent variant scored slightly below a single agent." Add L.source(root, 'Google Research, arXiv 2512.08296 v3 (Apr 2026) · Cognition (Apr 2026)').
 20.6–21.7: everything fades out.`,

  interfaces: `ASSIGNMENT: create two files.
(1) src/scenes/40-interfaces.js — id 'interfaces', duration 20, mood 'green', chapter { n: '04', title: 'The interfaces', short: 'Interfaces' }.
  Center: an agent node at (960, 600) — clay circle r≈34 with glow, label "agent" inside or below.
  0.5s: caption (h2 serif, left-aligned at x 160, y≈160): 'A coding agent needs one interface: <em class="clay">the repo.</em>' — and a single interface node "Repo" (pill) to the right at radius ≈300, connected with an edge and flowing packets.
  6.4s: caption swaps (fade out 0.8s, fade in) to 'A factory needs <em class="clay">all of them.</em>' and a ring of interface pills appears around the agent (radius ≈300, ellipse ok: rx≈520, ry≈290 to use the width), staggered 0.22s, each with an edge drawing in and packets: Terminal, Browser, Desktop apps, APIs, MCP tools, Tickets, CI/CD, Cloud console, Observability, Docs & chat, Other agents (plus the existing Repo — 12 total). Pills: dark fill, thin border, Inter 20px. Ring must stay inside y 300–930 and x 160–1760 and not collide with the caption.
  12.4s: a stat card at bottom-right (or top-right under the caption area if cleaner): value "~500M" (num ~72px, paper) + "MCP SDK downloads a month (Jul 2026) — the plumbing is being standardized." (body 22px). L.source(root, 'Model Context Protocol blog, Jul 28 2026').
  18.4–19.6: everything fades out.
(2) src/scenes/41-computer-use.js — id 'computer-use', duration 24, mood 'green', chapter { n: '04', title: 'The interfaces', short: 'Interfaces' }, hits [12.6].
  Phase 1 (0.4–11.6s): heading (h2 serif, x 160 y≈160): 'Computer use: <span class="muted">from 14.9% to</span> <em class="clay">human level</em> <span class="muted">in 16 months.</span>'. A line chart (x 200–1100, y 330–860), x-axis dated Oct 2024 → Mar 2026, y 0–100%. Points (OSWorld, original benchmark): 2024-10-22 14.9% "Claude 3.5 Sonnet"; 2025-05-22 42.2% "Sonnet 4"; 2025-09-29 61.4% "Sonnet 4.5"; 2025-11-24 66.3% "Opus 4.5"; 2026-02-05 72.7% "Opus 4.6". Human baseline: dashed horizontal line at 72.36% labeled "human baseline 72.4%". Line draws in over ~4s, dots + small model labels appear as reached; the last point glows when it touches the human line. Right side (x≈1220–1760) a short note: "Short desktop tasks: solved." (h3 serif) appearing at 8.0s.
  Phase 2 (12.0–22.8s): chart and phase-1 heading fade to ~15% (or out); new heading: 'So the bar moved. <span class="muted">OSWorld 2.0: 1.6-hour workflows, 318 tool calls on average.</span>' Three horizontal bars (strict pass rate, same harness): "Opus 5" 37.2%, "Fable 5.1" 42.8%, "Opus 5.5" 48.7% (clay, the others muted), bars grow with K.count-style labels, scale 0–100% with a faint 50% gridline. At 18.4s a caption (h3 serif): "Not solved. <em class=\\"clay\\">Climbing fast.</em>" L.source(root, 'Anthropic model announcements · OSWorld (Xie et al., 2024) · Claude Opus 5.5 System Card (Sep 2026)').
  22.6–23.7: fade out.`,

  model: `ASSIGNMENT: create src/scenes/50-opus55.js — id 'opus55', duration 32, mood 'bright', chapter { n: '05', title: 'The model', short: 'Opus 5.5' }, hits [1.0].
 0.5s: heading (L.heading at x 160, y≈150, size h2): kicker "Claude Opus 5.5 · September 22, 2026", title 'Not the biggest model. <em class="clay">The one built for the factory floor.</em>'.
 Scorecard (x 160–1760, y≈340–870), seven rows, each ~72px tall with a hairline separator: [status glyph] [CAPABILITY label, label class, ~200px column] [evidence sentence, body ~24px, paper-2, with the key number in paper] [source, src class, right-aligned]. Status glyph: full sage disc = strong; half disc (rose/gold outline + half fill) = partial. Rows reveal one by one starting 3.0s, every 2.3s:
  ● ORCHESTRATE — "100-agent teams ran for 24 hours — and chose their own structure: 12 sub-leads for proofs, flat for knowledge work." — System card
  ● DELEGATE — "One session directed a dozen more: 40 stacked pull requests, all green in CI." — Stripe
  ● ENDURE — "18+ hours unattended, across six repositories." — Clio
  ● TERMINAL — "#1 on Terminal-Bench 4.0." — Vals.ai, Oct 2026
  ◐ DESKTOP GUI — "Best strict OSWorld 2.0 score (48.7%) — still under half of long workflows." — System card
  ◐ MULTI-APP APIs — "40.0% on AutomationBench — a close second to GPT-6 Astra (41.4%)." — System card
  ● COST — "Fable 5.1-level work at 40% lower cost than Opus 5." — Anthropic
 Include a tiny legend under the table: "● strong   ◐ partial" (small, muted).
 L.source(root, 'Anthropic, Claude Opus 5.5 announcement + System Card (Sep 22 2026) · Vals.ai Terminal-Bench 4.0').
 24.4s: table dims to ~30%; centered bottom line (serif ~54px) word-reveals at y≈900 area (keep above 960): 'Opus 4.5 made the coding agent real. <em class="clay">Opus 5.5 makes the factory affordable to run.</em>' (two lines ok; move it up so it does not collide with the table — e.g. fade the table out entirely and center the line vertically if cleaner).
 30.4–31.6: everything fades out.`,

  finale: `ASSIGNMENT: create three files.
(1) src/scenes/60-ladder2.js — id 'ladder2', duration 36, mood 'warm', chapter { n: '06', title: 'The next wave', short: 'Next wave' }, hits [22.0].
  Same visual language as src/scenes/10-ladder.js (use Ladder.build / Ladder.step exactly like it) — this is the "same ladder, second climb" callback. Date axis from '2025-05-15' to '2027-04-15', axisY 870, top 470, ticks every quarter (e.g. JUL 2025, OCT, JAN 2026, APR, JUL, OCT, JAN 2027, APR). Rungs:
   0 date 2025-06-12 tag 'Consensus' when 'Jun 2025' muted, anchor 'start': kicker "June 2025 · on multi-agent systems", quote "Don't build multi-agents.", who '<b style="color:var(--paper)">Cognition</b> &nbsp;·&nbsp; the team behind Devin', size 84
   1 date 2026-02-06 tag 'Pioneers' when 'Feb 2026': kicker "February 2026", title "The first dark factories.", sub 'StrongDM\\'s rule: <em style="color:var(--paper)">“Code must not be reviewed by humans.”</em> Cursor runs hundreds of agents on one codebase.'
   2 date 2026-04-22 tag 'Converts' when 'Apr 2026': kicker "April 2026 · the skeptic converts", quote "Multi-agent systems work best today when writes stay single-threaded.", who '<b style="color:var(--paper)">Cognition</b> &nbsp;·&nbsp; ten months after “don\\'t build multi-agents”', size 56
   3 date 2026-09-15 tag 'Capital' when 'Sep 15' anchor 'end': kicker "September 15, 2026", title 'Factory raises at a <span class="clay">$5B</span> valuation.', sub '“We are seeing a move from individual coding agents to software factories.” <span style="color:var(--muted)">— Factory</span>'
   4 date 2026-09-22 tag 'Capability' when 'Sep 22' anchor 'start' glow 'gold': kicker "September 22, 2026", title "Claude Opus 5.5.", sub "Self-organizing 100-agent teams. Fable-level work at 40% lower cost."
   5 date 2027-02-22 tag 'Budgets?' when '+5 mo?' projected true anchor 'end': kicker "If the pattern holds", title 'Budgets follow — <span class="gold">early 2027.</span>', sub "Last wave, capability to budget took five months."
  Steps at 1.0, 7.0, 13.0, 19.0, 24.0, 29.0 (adjust if reading time needs it). Rungs 3 and 4 are only a week apart — use anchors end/start and different levels so tags never collide; check stills. Add a "WE ARE HERE" marker at 2026-10-07: a thin gold dashed vertical line from the axis up to just under the rung-4 level, with a small gold label, appearing at ~26.0s.
  Final beat 32.0s: deck fades; headline (h2 serif, top area) 'Last time, capability to budget took five months. <span class="muted">This time, the clock started on September 22.</span>'. L.source(root, 'Cognition (Jun 2025, Apr 2026) · StrongDM (Feb 2026) · Cursor (Jan 2026) · SiliconANGLE (Sep 15 2026) · Anthropic (Sep 22 2026)'). Everything out 34.6–35.7.
(2) src/scenes/61-moves.js — id 'moves', duration 28, mood 'calm', chapter { n: '06', title: 'The next wave', short: 'Next wave' }.
  Heading (L.heading kicker "What to do now", title "Three moves.", size h2) at 0.5s. Three cards (class card, ~470×330, x at 160 / 725 / 1290, y≈330) revealed at 2.0 / 5.6 / 9.2s, each: numeral (serif clay ~72px), title (h3 serif ~38px), body (~22px, paper-2):
   01 "Pick one product line." — "Run it as a factory pilot. Measure lead time, escaped defects and cost per change."
   02 "Build verification first." — "Scenarios, holdout tests, digital twins. Autonomy is a property of the repo, not the model."
   03 "Open interfaces — safely." — "MCP and APIs first, sandboxed computer use second. Scoped credentials; every action audited."
  15.6s: a strip below the cards (y≈760–900): label (rose) "What would make this wrong" + four chips (class chip) fading in staggered 0.5s: "Token cost: $1,000/day per engineer (StrongDM)", "Verification debt", "Prompt injection through GUIs", "No org-level proof yet". L.source(root, 'StrongDM Software Factory (Feb 2026) · Claude Opus 5.5 System Card').
  Everything out 26.4–27.6.
(3) src/scenes/62-close.js — id 'close', duration 22, mood 'bright', chapter null.
  The thread, completed: six dots across the middle (y≈480, x from 330 to 1590 evenly), labels above each (label class): CODING, FACTORY, ARCHITECTURE, INTERFACES, OPUS 5.5, NEXT WAVE. A clay line draws through them left→right (K.draw over ~5s from 0.8s), each dot lights (clay fill + ring pulse) as the line reaches it, and a short recap (small, muted, centered under each dot, 2 short lines max) fades in: "capability → budget in 5 months" / "agents run the whole line" / "graph · hierarchy · swarm" / "code is 16% of the job" / "the factory, affordable" / "the clock started Sep 22".
  8.0s: headline (h1 serif centered, y≈650): 'Capability arrives first. Belief follows. <em class="clay">The gap is the opportunity.</em>' word-reveal.
  13.6s: credit (small, muted, centered, y≈860): "Researched, fact-checked, scripted, scored and rendered by a small software factory of Claude agents." and beneath (src class) "Sources: docs/sources.md".
  18.8–21.6: everything fades out slowly to black (last 0.8s fully empty).`,
}

const keys = Array.isArray(args) ? args : [args]
phase('Build')
const out = await parallel(keys.map(k => () => agent(`${COMMON}\n\n${SPECS[k]}`, { label: `build:${k}`, phase: 'Build' })))
return out.map((r, i) => ({ key: keys[i], report: r }))
