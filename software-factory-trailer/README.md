# LIGHTS ON: a launch trailer for the software factory

A 2:16, music-only launch trailer (no voiceover). It is the high-energy rework of the calm executive briefing in [`../software-factory-opus-5-5/`](../software-factory-opus-5-5/), covering the same subject, the same facts and the same verdict.

**Video:** [`dist/software-factory-trailer.mp4`](dist/software-factory-trailer.mp4), 1080p, 30 fps, true motion blur, original score, −14 LUFS. A smaller 720p copy is at `dist/software-factory-trailer_preview.mp4`.

## The story in one breath
One clay cursor in a vast dark hall. "they just don't work." Then **Opus 4.5 ships**, the month gates race past, and **≈5 months** later capability is a budget line.

The camera pulls back. Code was one lit box on a dark line: **16% of dev time**. Work slams into REVIEW, TEST and DEPLOY, towers of cards rise, and **the line waits**. The reflex, "just add more agents.", makes it worse: **independent agents amplify errors ×17.2**.

Silence. "who runs the line?"

**Lights on**, bank by bank. **The line runs.** The software factory appears:
- **graph** for control;
- **hierarchy** for coherence;
- **swarm** for parallel work (many readers, one writer);
- **×4.4** errors with a coordinator.

The foreman lights up: **Claude Opus 5.5**. The proofs follow:
- 100-agent teams picked their own structure;
- one session directed a dozen;
- 18+ hours unattended;
- 40% lower cost than Opus 5.

The clock restarts at **MONTH 1**. *If the pattern holds: budgets in early 2027* (labelled **projection**).

Every on-screen claim comes from [`docs/facts.md`](docs/facts.md), shortened and never strengthened. Sources and the fact-check are in [`../software-factory-opus-5-5/docs/sources.md`](../software-factory-opus-5-5/docs/sources.md).

## How it was made: the software factory, applied to itself
One human brief ("make it a launch trailer: grand aesthetics, bam bam bam, problem then solution, top angle, bottom angle, I don't want to take my eyes off it") was run by a fleet of Claude Opus 5.5 agents:

| Station | Crew | What it produced |
|---|---|---|
| Research | 6 parallel researchers (trailer structure, editing, retention, aesthetics, camera, sound) | [`docs/research-bible.md`](docs/research-bible.md), numeric craft rules (ASL per act, peak at 80–88%, braam/silence budgets, LUFS arc…) |
| Treatments | 3 competing directors | [`docs/treatments/`](docs/treatments/): *The Second Wave*, *Lights On*, *The Cursor* |
| Judging | 3 judges (trailer editor, executive, VFX supervisor) | Unanimous pick: **Lights On** (84 / 86 / 85), plus steals and cuts from all three |
| Lock | 1 director-editor + validator | [`docs/shotlist.json`](docs/shotlist.json): 123 shots, beat-locked (120 → 150 BPM), checked by [`docs/check_shotlist.py`](docs/check_shotlist.py) |
| World | 1 look-dev artist | [`src/shots/lib/world.js`](src/shots/lib/world.js): the hall, line, towers, light banks and foreman, so every mirror and bookend matches |
| Build | 8 parallel shot builders, each rendering and inspecting its own contact sheets (5 relaunched after a usage-limit stop, rebuilding only the missing shots) | `src/shots/NNN-*.js` |
| Review → fix | whole-film contact-sheet pass | Legibility, blown highlights, mirrors and continuity fixed |
| Score | [`audio/score.py`](audio/score.py) arranging [`audio/trailer_sfx.py`](audio/trailer_sfx.py) from the engine's cue sheet | Synthesized from scratch, with no samples; −14 LUFS-I, true peak ≤ −1 dBTP |

## Engine
- **Picture.** Each frame is a pure function of time.
  - Three.js scenes (bloom, grade, chromatic aberration, ACES) under a GSAP kinetic-type layer, with tiered impact FX (camera shake, FOV kick, exposure punch), flash frames, letterbox and grain.
  - Captured with Playwright and headless Chromium. 2 sub-frames per frame are averaged for a 180° shutter.
- **Sound.**
  - **Arrangement:** cues are exported from the shots themselves, so every hit lands on its frame. Sustained beds render continuously per chord run, and rhythm sits on a bar-locked grid with a subdivision ladder.
  - **Mix:** risers end on hard silences, music ducks under impacts, and the loudness arc runs Act I −23 → Act II −18 → Act III −12 → peak −10 LUFS-S.
- **Docs:** [`docs/ENGINE.md`](docs/ENGINE.md) and [`docs/WORLD.md`](docs/WORLD.md).

## Build it
```bash
npm install                       # three, gsap, fonts
pip install numpy scipy           # score synthesis
render/final.sh                   # full render (≈3 h on 4 CPU cores in software GL) -> dist/software-factory-trailer.mp4
DRAFT=1 render/make.sh            # fast draft
node render/verify.mjs            # check the built film against the locked shot list
SF_QUERY=glscale=0.5 node render/stills.mjs --review --sheet --every 0.5 --only 042-ii-line-waits-2.js   # contact sheets
```
Requires Node 20+, Python 3.10+, ffmpeg, and Playwright's Chromium.
