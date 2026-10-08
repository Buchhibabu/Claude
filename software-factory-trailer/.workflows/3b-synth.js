export const meta = {
  name: 'trailer-synth',
  description: 'Lock the final cut: merge the winning treatment with the judges\' steals/fixes into docs/shotlist.json, validated',
  phases: [{ title: 'Synthesize', detail: 'director-editor writes + validates the locked shot list' }],
}

const P = '/home/user/claude/software-factory-trailer'

const SHOT_FORMAT = `docs/shotlist.json format (one JSON object):
{
  "title", "logline",
  "world": "visual world bible — palette per act (hex), materials (brass = emissive seams/edge lines, NOT glass/transmission), light, fog, the hall's architecture with dimensions, recurring set pieces with exact construction (pillars, stations, card towers, gates, light banks, the foreman), motif rules, type rules (classes/colors), angle grammar",
  "motifs": [..], "music_plan": "...",
  "acts": [{name, start, end, purpose, grade, letterbox}],
  "shared": [{"name": "e.g. hallSet", "spec": "set pieces / camera functions that several shots MUST reuse (mirrors, bookends, recalls) — exact construction + coordinates"}],
  "shots": [{
    "n": 1, "id": "c-rail-streak" (kebab, unique), "act": "COLD|I|MID|II|DROP|III|TITLE|BUTTON|END",
    "start": 0.0, "dur": 0.5, "bpm": 120,
    "camera": "angle/height, lens mm (14/18/24/35/50/85/135/200), start→end position or framing, move + ease",
    "visual": "exactly what is in frame (object types from the kit, counts, colors/hex, emissive k, positions/scale) and how it animates over the shot — concrete enough to code without guessing",
    "text": "exact on-screen text, '' if none ('/' separates stacked cards/lines)",
    "type": "class + color + entrance + position + local time (or '')",
    "fx": [{"at": 0.0, "kind": "hit|flash|glitch|bars|fade|shake", "tier": "S|A|B", "d": 0.1, "px": 138}],
    "sfx": [{"at": 0.0, "kind": "impact|braam|sub_drop|boom|riser|reverse_swell|roll|whoosh|glitch|tick|bell|heartbeat|chirps|shimmer|silence|tape_stop|stutter|sting", "dur": 1.0, "root": "D1", "gain": 0}],
    "music": {"section": "cold|act1|act2|turn|act3|peak|end", "chord": "Dm|Bb|Gm|F|C|A|Am|Dsus|D|Bbmaj", "div": 4|8|16|32, "energy": 0.0-1.0, "add": [], "drop": []},
    "grade": "bloom/threshold/sat/tint/exposure hints", "motif": "...", "shared": ["hallSet", ...], "transition": "..."
  }],
  "runtime": 133.6, "checks": "self-audit text"
}`

const NOTES = `DIRECTOR'S NOTES (binding — these come from me, the director, after reading all three verdicts):
1. Base: the "machine" treatment (LIGHTS ON) — unanimous winner (editor 84, exec 86, vfx 85). Keep its spine, the refrain THE LINE WAITS. → THE LINE RUNS., the human silhouette scale anchor, the lights-on bank cascade, the 89.2-style turn frame (mirror + refrain flip + Dutch righting + letterbox snapping open + braam on one frame), light-before-sound reveal, the MONTH clock button.
2. FIX the editor's fatal flaws: (a) compress Act II — kill the ~9.5 s uniform 'more chaos' plateau; every Act II shot must add NEW information; Act II ≤ 30 s; (b) rhythm under Act I: a pulse/ostinato must enter by ~0:14–0:16 (Opus 4.5 ships = the music starts moving), not at 0:30/0:44; (c) the 16% card: light the CODE segment IN PLACE, sized at 16% of the line length (not a sweep from the line start).
3. FIX exec issues: the coordinator that cuts errors ×17.2 → ×4.4 is Google Research's finding — render it in neutral ivory/ice, NOT clay (clay = Claude); ×4.4 still shows residual red (errors reduced, not gone; no 'healing' chime). Use verbatim "PICKED THEIR OWN STRUCTURE" (not "self-organized"). The foreman must not imply one model directing thousands: show ~12 primary threads (one session → a dozen) with sub-threads as particle flow. End credit exactly: "MADE WITH CLAUDE OPUS 5.5 AGENTS" / "FROM ONE HUMAN BRIEF". Never say "best", "the next wave has started" (ask, don't claim), or anything not in facts.md.
4. STEAL: (a) wave's "those aren't mountains" plant — the dark, unlit foreman ziggurat/obelisk stands telephoto-compressed and fogged at the far end of the hall in 2–3 Act I/II shots, reading as architecture; at the reveal it lights radially from its core; (b) signal's button — after the 2027 card, the lone cursor stops blinking and stays ON (final image, flare); (c) signal's line "THAT WAS WAVE ONE." may replace a weaker cold-open card if it reads better; (d) the vfx judge's hero list — design the FOREMAN in detail (silhouette: stepped ziggurat/obelisk built from glowBox tiers with emissive brass seams, a clay core, beams descending to tiers) — it is the #1 hero frame.
5. VFX constraints: no glass/transmission, no DOF/rack focus (fake with fog and scale), no camera.up flips mid-move (approach −89.5°), cursor/orb crowds > 2,000 use particles not instances, thousands of threads = flow() particles or one LineSegments, never thousands of fatLines.
6. Type: ≤7 words per card, ≤140 on-screen words TOTAL (count every word incl. source tags like "· ATLASSIAN"), text on screen ≤ ~40% of runtime, hold ≥ (chars/15 + 0.5) s for any card that must be read (primed recalls may be shorter). Sentence-case lowercase only for the 'human voice' typed lines (they just don't work. / just add more agents. / who runs the line?); all claims in caps.
7. Grid: 120 BPM until the tempo lift, 150 BPM after (per-shot "bpm"), optional return to 120 for the button. Every dur is a positive multiple of an 8th note (0.25 s at 120, 0.2 s at 150); most cuts on beats; start[n+1] = start[n] + dur[n] exactly (round to 3 decimals). Runtime 2:10–2:20, 105–125 shots, peak at 80–88%.
8. Music per shot uses only the arranger's vocabulary (sections/chords/div/energy/layers listed in ENGINE.md). Silences are sfx {kind:'silence', dur 0.4–1.0}. Risers end exactly where a silence or hit begins (riser at = end − dur). Braams 3–5, silences ≤3, flashes ≤10, glitch fx ≤6.`

const SCHEMA = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    checker_output: { type: 'string', description: 'final output of python3 docs/check_shotlist.py' },
    summary: { type: 'string', description: 'act-by-act summary of the locked cut, hero frames, what was stolen/fixed' },
    deviations: { type: 'array', items: { type: 'string' } },
  },
  required: ['path', 'checker_output', 'summary'],
}

phase('Synthesize')
const r = await agent(`You are the DIRECTOR-EDITOR locking the final cut of a ~2:15 music-only launch trailer (no voiceover) for a technically sharp executive audience. The client rejected a calm 7-minute slideshow: "very slow… I want a launch trailer: grand aesthetics, bam bam bam energy, problem then solution, actual storytelling, top angle, bottom angle, different ways to explain, extremely visual, I don't want to take my eyes off it."

READ (Read tool): ${P}/docs/treatments/machine.json (the base — read ALL of it), ${P}/docs/treatments/signal.json and wave.json (for steals), the three verdicts ${P}/docs/treatments/verdict_editor.json, verdict_exec.json, verdict_vfx.json (read every steal/cut/fact problem), ${P}/docs/facts.md (ONLY allowed claims; shorten, never strengthen), ${P}/docs/ENGINE.md (engine + kit + audio vocabulary). Use Grep on ${P}/docs/research-bible.md for any rule you need.

${NOTES}

WRITE the locked cut to ${P}/docs/shotlist.json in this format:
${SHOT_FORMAT}
It is large: write it in parts if needed (e.g. Write the head + first acts, then Edit/append), but the final file must be one valid JSON object. Hero shots (cold-open frames, midpoint pull-back, human under the tower, lights-on banks, the turn frame, the factory top-down, the foreman reveal, title, button) get the most detailed visual specs; fill "shared" with the set pieces and camera functions that mirrors/bookends/recalls must reuse.

VALIDATE: run  cd ${P} && python3 docs/check_shotlist.py  and fix every problem it reports, re-running until it prints "0 problems". Also self-check by hand: claims vs facts.md word by word, word count, ASL per act (Act III < 0.6 × Act I), peak %, every riser ending on a silence/hit, mirror pairs reuse shared specs.

Return the path, the final checker output, an act-by-act summary, and any deviations from my notes (with reasons).`, { label: 'synthesize', phase: 'Synthesize', schema: SCHEMA })
return r
