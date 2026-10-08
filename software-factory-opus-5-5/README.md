# The Software Factory Moment

A 6:55 executive-briefing video, with no voiceover and an original score. It argues that the diffusion curve that turned coding agents from "they just don't work" into a budget line in about five months is now starting again for **software factories**: fleets of agents running the whole delivery line. It also asks why **Claude Opus 5.5** fits that factory floor.

The **video** is `dist/software-factory-moment.mp4`.

## What's inside
| Path | What |
|---|---|
| `docs/verdict.md` | The honest answer to "is Opus 5.5 really good for a software factory?" (go, with caveats) |
| `docs/script.md` | The exact on-screen text of every scene, extracted from the final build |
| `docs/storyboard.md` | The original plan: structure, copy and pacing rules |
| `docs/sources.md` | Every on-screen number and quote, with its URL and fact-check status |
| `docs/BUILDING.md` | How scenes are built (the engine contract, layout and pacing rules) |
| `src/` | The video itself, as a deterministic HTML/GSAP timeline (`engine.js`, `lib*.js`, `scenes/*.js`) |
| `audio/compose.py` | The original ambient score, synthesized from scratch and locked to the scene cues |
| `render/` | Frame-accurate capture (Playwright → ffmpeg), still-frame review and the full build script |

## Story (one dot per chapter)
0. **The bottom line.**
   - Coding agents went from "they just don't work" to a budget line in under six months.
   - The software factory is the next curve.
   - Its bottleneck is orchestration and interfaces, where Opus 5.5 does well at 40% lower cost than Opus 5.
1. **The last wave.** Skeptics → capability (Opus 4.5, Nov 24 2025) → practitioners (+5 wks) → press (+8) → markets (+10) → budgets (+19).
2. **The software factory.** A 57-year-old idea whose work was always done by people. Now agents run the line and humans move to the edges.
3. **The architecture.** Graph for control, hierarchy for coherence, swarm for throughput. Rule of thumb: parallelize reading, one writer per change.
4. **The interfaces.** A coding agent mostly works in one place: the repo. A factory works everywhere.
5. **The model.** Opus 5.5 is not Anthropic's most capable model. It is the best fit for the factory floor, and the scorecard includes the partial rows.
6. **The next wave.** The same ladder, climbed a second time. If Opus 5.5 is this wave's trigger, budgets land in early 2027.

## Build
```bash
npm install                      # gsap + fonts
pip install numpy scipy          # score synthesis
./render/build.sh                # → dist/software-factory-moment.mp4
node render/stills.mjs --every 5 # review frames → dist/stills/
```
Requires Node 20+, Python 3.10+, ffmpeg, and Playwright's Chromium.

## How it was made
Built from one human brief by a small software factory of **Claude Opus 5.5** agents, using the graph + hierarchy + swarm pattern the video recommends:

| Station | Crew | Pattern |
|---|---|---|
| Research | 8 researchers, one per topic | swarm (parallel, read-only) |
| Fact-check | 8 adversarial verifiers, re-opening every cited source | swarm |
| Script | 1 planner (the orchestrating session), the single writer of the story | hierarchy |
| Build | 6 parallel scene builders, each rendering and inspecting its own frames | hierarchy |
| Critique → fix | 9 critics (visual, story/pacing, facts) × 3 chapter groups, then 8 fixers working under one set of lead decisions | swarm → hierarchy |
| Render | deterministic frame capture + synthesized score | graph |

Workflow scripts (research → verify → build → review → fix) are in `.workflows/`, numbered in run order. The research changed the thesis in several places, and `docs/verdict.md` records how. For example, the "coding is solved" moment was **Opus 4.5** (Nov 2025), not 4.6, and Opus 5.5's real edge is **orchestration at lower cost**, not "best at every interface".
