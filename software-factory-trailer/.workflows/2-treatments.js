export const meta = {
  name: 'trailer-treatments',
  description: 'Competing trailer treatments (beat-locked shot lists) from different creative directions',
  phases: [{ title: 'Write', detail: 'one treatment writer per direction' }],
}

const P = '/home/user/claude/software-factory-trailer'
const BRIEF = `You are a top trailer director/editor writing a TREATMENT + BEAT-LOCKED SHOT LIST for a ~2:15 launch trailer (hard ceiling 2:30).
CLIENT: technically sharp executive audience. Their words: "Make it like a launch trailer — grand aesthetics, bam bam bam energy, problem statement then solution, real storytelling; top angle, bottom angle, different ways to explain; extremely visual; nobody should be able to take their eyes off it. The first version (a calm 7-minute slideshow) was far too slow." No voiceover: music + sound design + kinetic type only.
THE STORY TO TELL (substance): the coding-agent wave went from "they just don't work" to a budget line in ≈5 months (Opus 4.5, Nov 2025 → budgets by Apr 2026). But code is only 16% of the job — the rest of the delivery line still runs at human speed, and "more agents" alone fails (flat swarms amplify errors). The answer is the SOFTWARE FACTORY: agents running the whole line with structure (graph for control, hierarchy for coherence, swarms only for parallel work). Claude Opus 5.5 (Sep 22, 2026) is the model built for that floor: self-organizing 100-agent teams, one session directing a dozen, 18-hour unattended runs, Fable-level work at 40% lower cost. The next wave has started — if the pattern holds, budgets follow in early 2027.
READ FIRST (use the Read tool): ${P}/docs/facts.md (the ONLY claims allowed on screen; shorten but never strengthen), ${P}/docs/ENGINE.md (what the engine can render and its budget), ${P}/docs/research-bible.md (craft research: structure, editing, sound, aesthetics, camera, retention — follow its numeric rules).
DELIVERABLE RULES: 100–130 shots; cuts on the beat grid (120 BPM = 0.5 s/beat; a lift to 150 BPM = 0.4 s/beat in the final act is encouraged); ASL per act per the research; ≤7 words per card, ≤140 on-screen words total; every card is ALSO a visual event; a motif system (2–3 motifs that evolve); top/bottom/macro angle contrast; 3 braams, ≤3 silence drops, ≤10 flashes; peak at 80–88% of runtime, then false stop, end title ≤5 s, button. Every shot must be buildable with the engine (Three.js primitives, particles, glow boxes, lines, text planes, beams; no photoreal humans — silhouettes are fine). Be concrete: camera height/lens/move, what's in frame, what animates, exact text, exact SFX.`

const DIRECTIONS = {
  wave: `CREATIVE DIRECTION "THE SECOND WAVE": the story is told as a physical wave. Act I: a single light (the coding agent) becomes a swell that rolls over a city of desks (the first wave, 5 months). The turn steals Interstellar's "those aren't mountains — they're waves": what looked like the horizon is a far bigger wave — the factory wave. Monumental scale, ocean-of-particles imagery, telephoto and worm's-eye contrast.`,
  machine: `CREATIVE DIRECTION "LIGHTS ON": industrial-cathedral epic. Act I: the cursor / single station glowing in a vast dark hall. Act II: the jammed line — queues of work cards piling into towers under red alarm pinpoints, a tiny human silhouette dwarfed; flat swarms collide and fail. The turn: silence, then the factory's lights switch on bank by bank; graph, hierarchy and swarm click into place; Opus 5.5 revealed as the foreman — low-angle monument. Blade Runner 2049 / Dune scale, mirror callbacks (jammed station → flowing station).`,
  signal: `CREATIVE DIRECTION "THE CURSOR": tech-thriller built on one evolving motif — the blinking cursor block ▮. One cursor → a city of cursors (the coding wave) → cursors hitting walls (review, test, deploy, on-call) → the cursor becomes a conductor of a thousand agents → cursors assemble into the factory → final shot the single cursor again (button). Tron Legacy / Westworld title-sequence precision, data streams, decode captions, match cuts on shape.`,
}

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    logline: { type: 'string' },
    spine: { type: 'array', items: { type: 'string' }, description: 'story beats as a BUT/THEREFORE chain' },
    motifs: { type: 'array', items: { type: 'string' } },
    music_plan: { type: 'string', description: 'sections with start times, BPM, layers, braams, silences, risers, final sting' },
    acts: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' }, purpose: { type: 'string' }, grade: { type: 'string' }, letterbox: { type: 'string' } }, required: ['name', 'start', 'end', 'purpose'] } },
    shots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'integer' },
          act: { type: 'string' },
          start: { type: 'number', description: 'seconds' },
          dur: { type: 'number', description: 'seconds (multiple of the beat)' },
          camera: { type: 'string', description: 'angle/height, lens mm, move + ease' },
          visual: { type: 'string', description: 'what is in frame and how it animates (3D/2D)' },
          text: { type: 'string', description: 'exact on-screen text or empty' },
          type_style: { type: 'string', description: 'mega/slam/cond/title/kicker/mono + entrance' },
          sound: { type: 'string', description: 'music/SFX cue at this shot' },
          hit: { type: 'string', description: 'S/A/B/none' },
          transition: { type: 'string' },
        },
        required: ['n', 'act', 'start', 'dur', 'camera', 'visual', 'text', 'sound'],
      },
    },
    runtime: { type: 'number' },
    why_it_works: { type: 'string' },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'logline', 'spine', 'motifs', 'music_plan', 'acts', 'shots', 'runtime', 'why_it_works'],
}

const keys = Array.isArray(args) ? args : Object.keys(DIRECTIONS)
phase('Write')
const out = await parallel(keys.map((k) => () => agent(`${BRIEF}\n\n${DIRECTIONS[k]}\n\nWrite the complete treatment and shot list now. Verify every on-screen claim against facts.md.`, { label: `treatment:${k}`, phase: 'Write', schema: SCHEMA }).then((r) => r && { key: k, ...r })))
return out.filter(Boolean)
