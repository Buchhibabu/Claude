export const meta = {
  name: 'trailer-craft-research',
  description: 'Study how great trailers work (structure, editing, sound, aesthetics, camera, retention) as executable technique',
  phases: [{ title: 'Research', detail: 'one researcher per craft angle' }],
}

const PREAMBLE = `You are researching TRAILER CRAFT so we can make a 2:00–2:30 launch-trailer-style video. Today is 2026-10-08.
CLIENT BRIEF (verbatim spirit): "Make it like a launch trailer: grand aesthetics, bam-bam-bam energy, problem statement then solution, real storytelling, top angle / bottom angle, so visual that nobody can take their eyes off it. The first version was far too slow." The subject: the "software factory" (fleets of AI agents running the whole software delivery line) and why Claude Opus 5.5 fits it; told as a story (the coding-agent wave took ~5 months from capability to budget; the factory is the next wave).
PRODUCTION CONSTRAINTS: no voiceover; music + sound design + on-screen kinetic typography only. Everything is generated in code: Three.js (WebGL 3D scenes, bloom, fog, particles, camera moves), HTML/SVG/GSAP for typography and 2D motion graphics, deterministic frame-by-frame capture at 30 fps (so motion blur, flashes, shakes, speed ramps, glitches are all doable). Audio is synthesized in Python/numpy (no samples): we must synthesize braams, hits, risers, whooshes, pulses, etc.
METHOD: Load web tools with ToolSearch("select:WebSearch,WebFetch"). A shared search quota exists: use at most ~15 WebSearch calls; prefer fetching specific known pages (breakdowns, interviews with trailer editors, YouTube essay transcripts, articles). Combine with your own deep knowledge. Cite sources where you used them.
OUTPUT: concrete, executable craft — numbers (seconds, frames, BPM, dB, Hz, easing curves), named techniques, step-by-step recipes, named reference trailers with what to steal from each (timestamps if known), and pitfalls. Write for an engineer-director who will implement every technique in code.`

const TOPICS = {
  structure: `ANGLE: STORY ARCHITECTURE OF TRAILERS. The three-act trailer structure (setup / escalation / climax + "button"), cold opens and hooks in the first 3 seconds, open loops and curiosity gaps, the "rule of three", problem → stakes → turn → reveal → payoff, how tech/product launch trailers differ from movie trailers (Apple reveal films, Nothing, Tesla/SpaceX, OpenAI/Anthropic/Google model launch videos, Vercel Ship, Linear, Arc), how to tell an argument with data as a story without narration (text cards as dialogue), the role of the title drop and the post-title "button". Give a beat-by-beat template for a 2:15 tech launch trailer with second marks.`,
  editing: `ANGLE: EDITING RHYTHM & TRANSITIONS. Average shot lengths in modern trailers by act, acceleration curves (how cut frequency ramps), cutting on the beat vs off-beat, montage sequences, smash cuts, match cuts, whip pans, speed ramps, flash/white frames, black-frame "breaths", the silence-before-the-drop, text card timing (how long a 3-word card holds), "stutter" edits, glitch transitions, impact frames. Give numeric rules (frames/seconds) and a cut-density chart for a 2:15 trailer.`,
  sound: `ANGLE: TRAILER MUSIC & SOUND DESIGN, AND HOW TO SYNTHESIZE IT. Anatomy: pulses/ostinatos, risers (noise sweeps, Shepard tones, string swells), braams (Inception-style low brass), hits/impacts (sub drop + transient + tail), whooshes/swishes, reverse swells, ticking clocks, heartbeat, glitch stutters, the drop, silence, the final sting. Tempo choices (typical BPM), key/harmony choices for "epic tech" (minor modes, pedal tones), loudness/dynamics (LUFS for web trailers, headroom for hits). For EACH sound give a concrete numpy synthesis recipe (oscillators, detune, filter cutoffs/envelopes, distortion/waveshaping, pitch envelopes, reverb tail lengths, layering) so a programmer can generate it convincingly without samples.`,
  aesthetics: `ANGLE: VISUAL AESTHETICS OF PREMIUM TECH LAUNCH FILMS. Typography (huge display type, tight tracking, kinetic type behaviors: slam-in, scale-down-from-giant, mask reveals, per-letter staggers, blur-to-sharp), color grading & palettes (deep blacks, one hot accent, light sweeps, metallic gradients), lighting language (rim light, volumetric beams, lens flares, bloom), abstract 3D motifs (particles, grids, wireframes, glass, light trails, data streams), logo/title reveals and stings, letterboxing, film grain, chromatic aberration. Reference: Apple product films, Nothing, Linear, Vercel, Stripe Sessions, Anthropic/OpenAI launch videos, game trailers (cinematic UI), sci-fi title sequences (e.g. Westworld, Tron Legacy). What makes it feel "grand" and "exclusive" rather than cheap?`,
  camera: `ANGLE: CAMERA LANGUAGE FOR 3D/MOTION GRAPHICS. Low angle (power, monumentality), high/top-down (system, overview, the "god view"), dolly-in/push-in (tension), dolly-out/reveal (scale), orbit, crane up, tracking along a line, fly-through, Dutch tilt, rack focus/depth of field, parallax layers, scale contrast (tiny human vs huge system), macro details. For each: when to use emotionally, typical durations, easing curves (e.g. expo.inOut), and how to implement in Three.js (camera paths, CatmullRom curves, lookAt targets, FOV changes/dolly-zoom, camera shake on impacts with decay, motion blur via sub-frame accumulation). Also: how to make abstract concepts (agents, pipelines, interfaces, swarms, hierarchies, graphs) look physical and cinematic in 3D.`,
  retention: `ANGLE: ATTENTION RETENTION. What the research and practitioners say about keeping viewers watching: hooks in the first 1–3 s, pattern interrupts every 2–5 s, curiosity gaps and payoffs, escalation, emotional arc, novelty, "show don't tell", density of information vs comprehension (how many words per card an exec can absorb at speed), retention-editing practices from top YouTube creators and B2B launch videos, and how to keep it intelligent for a technical executive audience (not cheap hype). Give a checklist we can audit a cut against, with measurable criteria.`,
}

const SCHEMA = {
  type: 'object',
  properties: {
    angle: { type: 'string' },
    principles: { type: 'array', items: { type: 'string' } },
    techniques: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          when: { type: 'string' },
          how: { type: 'string', description: 'concrete, executable recipe with numbers' },
          example: { type: 'string', description: 'named reference (trailer/film/launch) and what to steal' },
        },
        required: ['name', 'when', 'how'],
      },
    },
    template_or_recipes: { type: 'string', description: 'beat template / numeric rules / synthesis recipes as appropriate for this angle' },
    pitfalls: { type: 'array', items: { type: 'string' } },
    sources: { type: 'array', items: { type: 'string' } },
  },
  required: ['angle', 'principles', 'techniques', 'template_or_recipes', 'pitfalls'],
}

const keys = Array.isArray(args) ? args : Object.keys(TOPICS)
phase('Research')
const out = await parallel(keys.map((k) => () => agent(`${PREAMBLE}\n\n${TOPICS[k]}`, { label: `craft:${k}`, phase: 'Research', schema: SCHEMA }).then((r) => r && { key: k, ...r })))
return out.filter(Boolean)
