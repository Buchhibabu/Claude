export const meta = {
  name: 'trailer-judge-synth',
  description: 'Judge the competing trailer treatments, then synthesize one final beat-locked, build-ready shot list',
  phases: [{ title: 'Judge', detail: 'three lenses score every treatment' }, { title: 'Synthesize', detail: 'one final build-ready shot list' }],
}

const P = '/home/user/claude/software-factory-trailer'
const CTX = `PROJECT: a ~2:15 music-only launch trailer (no voiceover) for a technically sharp executive audience. Subject: the coding-agent wave (≈5 months from "they just don't work" to budgets), why coding agents alone are not enough (code is 16% of the job; flat swarms amplify errors), the SOFTWARE FACTORY (agents running the whole delivery line with structure: graph for control, hierarchy for coherence, swarms only for parallel work), and Claude Opus 5.5 as the model built for that floor; the next wave has started.
The client rejected a calm 7-minute slideshow: "very slow… I want a launch trailer: grand aesthetics, bam bam bam energy, problem then solution, actual storytelling, top angle, bottom angle, different ways to explain, extremely visual, I don't want to take my eyes off it."
FILES (Read them): treatments in ${P}/docs/treatments/*.json (each has title, logline, spine, motifs, music_plan, acts, shots); allowed claims ${P}/docs/facts.md (shorten, never strengthen); engine capabilities ${P}/docs/ENGINE.md; craft rules ${P}/docs/research-bible.md (large — use Grep/partial reads for the rules you need: structure, ASL per act, peak at 80–88%, braams, silences, flashes, type ≤7 words/card, read-or-watch, escalation on several axes, motif evolution, match cuts).`

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    scores: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, total: { type: 'number', description: '0-100' }, breakdown: { type: 'string' }, fatal_flaws: { type: 'array', items: { type: 'string' } } }, required: ['key', 'total', 'breakdown'] } },
    winner: { type: 'string' },
    steal: { type: 'array', items: { type: 'string' }, description: 'specific shots/ideas (cite treatment key + shot n) the final cut must take from ANY treatment' },
    cut: { type: 'array', items: { type: 'string' }, description: 'things that must not survive (weak, unclear, unbuildable, inaccurate)' },
    fact_problems: { type: 'array', items: { type: 'string' } },
  },
  required: ['scores', 'winner', 'steal', 'cut'],
}

const LENSES = {
  editor: `You are a veteran theatrical trailer EDITOR (Marvel/Nolan/Apple-keynote sizzle). Judge each treatment on: hook strength in the first 3 s; energy curve and escalation on several axes; rhythm (variety of hit spacing, silences landing, peak at 80–88%); shot-angle variety (top/bottom/macro/wide); motif evolution and match cuts; whether a viewer could look away anywhere (name the sag points); whether the type cards are bam-bam punchy and readable at the given durations.`,
  exec: `You are the CLIENT'S MANAGER: a technically strong executive. Judge each treatment on: is the story clear with zero narration (could you retell problem → why naive fixes fail → the answer → why Opus 5.5 → what happens next)? Is the problem visceral, does the solution feel inevitable, are the claims credible and accurate to facts.md (flag any strengthened or invented claim), does it avoid hype that would embarrass the sender, is the architecture point (graph/hierarchy/swarm, "parallelize reading, one writer per change") shown rather than told?`,
  vfx: `You are the VFX SUPERVISOR for this engine (Three.js in software GL, instanced meshes, particles, glow boxes, fat lines, text planes, beams, canvas panels, human silhouettes; bloom/grade/CA post; GSAP kinetic type; ~0.7 s per 3D frame render). Judge each treatment on: which shots will look GRAND and premium with these tools (scale, light, contrast, mostly-black frames with HDR emissives) vs which will look cheap or unreadable; buildability within the per-shot budget; visual coherence of the world; how strong the hero images are (the 4–6 frames people will remember).`,
}

const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    logline: { type: 'string' },
    world: { type: 'string', description: 'the visual world bible: palette per act, materials, light, recurring set pieces, motif rules, type rules' },
    motifs: { type: 'array', items: { type: 'string' } },
    music_plan: { type: 'string', description: 'sections with start times, BPM, chords, layers, subdivision ladder, braams, silences, risers, sting' },
    acts: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' }, purpose: { type: 'string' }, grade: { type: 'string' }, letterbox: { type: 'string' } }, required: ['name', 'start', 'end', 'purpose'] } },
    shots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'integer' },
          id: { type: 'string', description: 'kebab-case unique id, e.g. a1-lone-cursor' },
          act: { type: 'string', description: 'COLD | I | II | TURN | III | END' },
          start: { type: 'number' },
          dur: { type: 'number', description: 'seconds; an exact multiple of 0.5 (120 BPM) or 0.4 (150 BPM)' },
          bpm: { type: 'integer' },
          camera: { type: 'string', description: 'angle/height, lens mm (14/18/24/35/50/85/135/200), move with start/end positions or framing + ease' },
          visual: { type: 'string', description: 'exactly what is in frame (3D objects, counts, colors, lighting) and how it animates over the shot; concrete enough to code without guessing' },
          text: { type: 'string', description: 'exact on-screen text ("" if none)' },
          type: { type: 'string', description: 'class (mega/slam/cond/title/kicker/line/mono/serif) + color + entrance (slam/giant/maskUp/letters/tracking/glitch/cutIn/roll/typewriter) + position + when (local seconds)' },
          fx: { type: 'array', items: { type: 'object', properties: { at: { type: 'number', description: 'local seconds' }, kind: { type: 'string', description: 'hit | flash | glitch | bars | fade | shake' }, tier: { type: 'string' }, d: { type: 'number' }, px: { type: 'number' }, color: { type: 'string' } }, required: ['at', 'kind'] } },
          sfx: { type: 'array', items: { type: 'object', properties: { at: { type: 'number', description: 'local seconds' }, kind: { type: 'string', description: 'impact | braam | sub_drop | boom | riser | reverse_swell | roll | whoosh | glitch | tick | bell | heartbeat | chirps | shimmer | silence | tape_stop | stutter | sting' }, dur: { type: 'number' }, root: { type: 'string' }, gain: { type: 'number' } }, required: ['at', 'kind'] } },
          music: { type: 'object', description: '{section: cold|act1|act2|turn|act3|peak|end, chord: Dm|Bb|Gm|F|C|A|Am|Dsus|D|Bbmaj, div: 4|8|16|32, energy: 0..1, add?: [layers], drop?: [layers]}  layers: drone pad pulse ostinato kick drums strings piano hats heart ticks', properties: { section: { type: 'string' }, chord: { type: 'string' }, div: { type: 'integer' }, energy: { type: 'number' }, add: { type: 'array', items: { type: 'string' } }, drop: { type: 'array', items: { type: 'string' } } }, required: ['section', 'chord'] },
          grade: { type: 'string', description: 'bloom/sat/tint/exposure hints' },
          motif: { type: 'string' },
          transition: { type: 'string' },
        },
        required: ['n', 'id', 'act', 'start', 'dur', 'bpm', 'camera', 'visual', 'text', 'type', 'fx', 'sfx', 'music'],
      },
    },
    runtime: { type: 'number' },
    checks: { type: 'string', description: 'self-audit: shot count, ASL per act, total on-screen words, braams/silences/flashes/glitches counts, peak time and % of runtime, every claim traced to facts.md' },
  },
  required: ['title', 'logline', 'world', 'motifs', 'music_plan', 'acts', 'shots', 'runtime', 'checks'],
}

phase('Judge')
const judges = await parallel(Object.entries(LENSES).map(([k, lens]) => () =>
  agent(`${CTX}\n\n${lens}\n\nRead all treatments in full, then score each (0–100) with a candid breakdown, pick a winner, and list concrete shots/ideas to STEAL from any treatment and things to CUT.`, { label: `judge:${k}`, phase: 'Judge', schema: JUDGE_SCHEMA }).then((r) => r && { lens: k, ...r })))
const verdicts = judges.filter(Boolean)

phase('Synthesize')
const final = await agent(`${CTX}

THE JUDGES' VERDICTS (three lenses):
${JSON.stringify(verdicts, null, 1)}

You are now the DIRECTOR-EDITOR who locks the final cut. Build ONE final trailer from the winning treatment's spine, upgraded with every "steal" and with every "cut" and fact problem fixed. Requirements:
- 2:10–2:20 runtime; 105–125 shots; every cut on the beat grid (120 BPM = 0.5 s beats until the turn; 150 BPM = 0.4 s beats in Act III/peak). start of shot n+1 = start + dur of shot n exactly. Durations are exact multiples of the beat of their section.
- Cold open hook in the first 3 s (frame-0 transient); acts with the research ASL; Act III ASL 0.4–0.9 s with angle ping-pong; peak at 80–88% of runtime; false stop; end title ≤5 s; button.
- Claims: ONLY from facts.md, shortened never strengthened; label the projection ("If the pattern holds"); vendor claims attributed where needed; ≤7 words per card; ≤140 on-screen words total; read-or-watch.
- Effects budget for the whole film: 3–5 braams, ≤3 silence drops (12–30 frames each), ≤10 flashes, ≤6 glitches, ≤8 S/A shakes. Risers must end exactly where a silence or hit begins.
- Every shot is buildable with the engine (no photoreal humans; silhouettes ok); describe visuals concretely (object types, counts, colors, camera positions) so a builder can code it without guessing. Hero shots get the most detail.
- Fill music for EVERY shot (section/chord/div/energy) so the arranger can score it: the subdivision ladder must accelerate into hits (div 4→8→16→32), chords move in D minor until the turn, the factory reveal resolves to D major / Bbmaj warmth.
- Do the self-audit in "checks" honestly (count things, compute ASL per act and peak %), and fix violations before returning.`, { label: 'synthesize', phase: 'Synthesize', schema: FINAL_SCHEMA })

return { verdicts, final }
