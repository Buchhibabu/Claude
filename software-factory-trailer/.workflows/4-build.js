export const meta = {
  name: 'trailer-build',
  description: 'Build trailer shots from the locked shot list (one builder per batch), each self-reviewed from rendered contact sheets',
  phases: [{ title: 'Build', detail: 'one builder per batch of shots' }],
}

const P = '/home/user/claude/software-factory-trailer'
const BRIEF = `You are a senior motion designer / real-time VFX artist building shots for a premium, high-energy launch trailer (think Apple keynote sizzle × Nolan/Villeneuve trailer). Music-only, no voiceover. The client hated a slow, calm, slideshow-looking first version — every frame you make must look GRAND, cinematic and alive: deep blacks, HDR emissive light that blooms, strong silhouettes, scale (tiny vs huge), purposeful camera motion (push-ins, crane, whip, orbit, crash zoom, worm's-eye, top-down), parallax, grain, letterbox. Nothing static, nothing flat, nothing "PowerPoint".

PROJECT: ${P} (Three.js 0.170 in headless Chromium with software GL; GSAP for 2D kinetic type).
READ FIRST:
- ${P}/docs/shotlist.json — the LOCKED final cut: world bible, motifs, acts, and every shot (id, start, dur, bpm, camera, visual, text, type, fx, sfx, music, grade). Your batch is listed below; also skim the shots just before and after yours for continuity (match cuts, motif states, palette).
- ${P}/docs/ENGINE.md — the shot contract and every API.
- ${P}/src/engine.js, ${P}/src/kit/gl.js, ${P}/src/kit/type.js, ${P}/src/styles.css — the actual code (APIs, type classes, colors).
- ${P}/docs/WORLD.md + ${P}/src/shots/lib/world.js — the SHARED WORLD LIBRARY (hall, stations, towers, banks, foreman, camera functions, act grades). USE IT for every set piece and every shot listed with "shared" entries so mirrors/recalls/bookends match exactly. ${P}/src/shots/_world.js shows it in use.
- ${P}/src/shots/_test.js and ${P}/src/shots/_test2.js — working examples.

RULES:
- One file per shot: ${P}/src/shots/NNN-<id>.js (NNN = shot n zero-padded to 3 digits). id, dur, act and music EXACTLY as in shotlist.json (copy the music object; dur must equal the shot's dur — use beats(n) at 120 BPM or beats(n, 150) at 150 BPM). Put every sfx in the shot via ctx.sfx(at, kind, opts) and every fx via ctx.fx.* at the listed local times. Every shot calls ctx.fx.bars(0, px) itself (its act's letterbox: 138 for 2.39:1, 0 for full frame) so it renders correctly in isolation.
- Text must be EXACTLY the shot list's text (it is fact-checked). Type must be big, crisp and readable for its on-screen time; never overlapping clutter; respect letterbox safe area (y 160–920 when bars are 138).
- DO NOT edit engine.js, kit/*, styles.css, index.html, main.js, manifest.js, lib/world.js, or other batches' files (wrap/extend world.js pieces in your batch helper instead). Shared helpers for your batch go in ${P}/src/shots/lib/<batch>.js (import with '../shots/lib/...' relative paths from your shot: './lib/<batch>.js'). Extra CSS: inline styles via K.text(..., {style:{...}}).
- Determinism: no Math.random / Date / performance.now; pose everything from lt (local seconds) in update(). Use rand(seed) for layouts at build time.
- Performance: keep each 3D frame ≤ ~1.0 s at glscale 0.75 (≤30k particles, ≤ a few thousand instances, no transmission/DOF). Pure-type shots should skip three() entirely when there is no 3D (cheaper).
- Bloom: deep blacks — keep bloom.threshold ≥ 0.6 for scenes with many emissives so the frame doesn't haze over; use HDR k 3–8 for hot accents; fog for depth.
- Always call camFX(camera, ctx.shot.start + lt, fov) at the end of update() so impacts shake the camera.

REVIEW LOOP (mandatory, at least 2 passes): render your batch's contact sheets:
  cd ${P} && SF_QUERY=glscale=0.5 node render/stills.mjs --review --sheet --every 0.25 --only <your files comma-separated, e.g. 012-a1-x.js,013-a1-y.js> --out dist/review-<batch>
then Read every <id>.jpg sheet (and full-size PNGs for type checks). Fix: blank/black frames, unreadable or clipped type, haze, flat lighting, wrong framing, boring motion, mismatch with the shot list, console ERRORS printed at the end. Judge each shot honestly against "would this hold an executive's eyes in a launch trailer?" and push it until yes. Time one 3D frame at glscale 0.75 (node render/stills.mjs <t> --only <file>) for your heaviest shot.`

const SCHEMA = {
  type: 'object',
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    helpers: { type: 'array', items: { type: 'string' } },
    heaviest_frame_ms: { type: 'number' },
    deviations: { type: 'array', items: { type: 'string' }, description: 'any place you deviated from the shot list and why' },
    weak_shots: { type: 'array', items: { type: 'string' }, description: 'shots you are not fully happy with and what would fix them' },
  },
  required: ['files', 'deviations', 'weak_shots'],
}

const batches = Array.isArray(args) ? args : [args]
phase('Build')
const out = await parallel(batches.map((b) => () =>
  agent(`${BRIEF}\n\nYOUR BATCH: "${b.name}" = shots n=${b.from}..${b.to} (inclusive) from shotlist.json. ${b.note || ''}\nBuild all of them, review, iterate, and report.`, { label: `build:${b.name}`, phase: 'Build', schema: SCHEMA }).then((r) => r && { batch: b.name, ...r })))
return out.filter(Boolean)
