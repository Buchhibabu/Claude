export const meta = {
  name: 'trailer-shared-world',
  description: 'Build the shared world library (set pieces + reusable camera functions) the shot builders all use',
  phases: [{ title: 'World', detail: 'shared set pieces, look-dev review' }],
}

const P = '/home/user/claude/software-factory-trailer'
const SCHEMA = {
  type: 'object',
  properties: {
    api: { type: 'string', description: 'the exported API of src/shots/lib/world.js with signatures, options, coordinate conventions and a usage example for each — builders will rely on this text alone' },
    lookdev_notes: { type: 'string', description: 'bloom/fog/exposure settings that make the set look premium, and pitfalls found' },
    frame_ms: { type: 'number', description: 'measured ms per frame at glscale 0.75 for the heaviest showcase view' },
  },
  required: ['api', 'lookdev_notes'],
}

phase('World')
const r = await agent(`You are the lead environment / look-dev artist for a premium, high-energy launch trailer rendered with Three.js 0.170 in headless Chromium (software GL). Your job: build the SHARED WORLD LIBRARY that ~6 shot builders will import, so every mirror, recall and bookend matches exactly and the world looks GRAND (cathedral scale, deep blacks, HDR emissive light blooming through fog, brass via emissive seams/edges — no glass/transmission, no DOF).

READ: ${P}/docs/shotlist.json (the locked cut — especially "world", "shared", "acts" and every hero shot), ${P}/docs/ENGINE.md, ${P}/src/engine.js, ${P}/src/kit/gl.js, ${P}/src/kit/type.js, examples ${P}/src/shots/_test.js and _test2.js.

BUILD ${P}/src/shots/lib/world.js (ES module; import { ... } from '../../engine.js' and * as G from '../../kit/gl.js'). Implement every entry in shotlist.json "shared" (set pieces AND camera functions) exactly to spec, as factory functions that return { group/objects, update(lt, params) } with deterministic, lt-driven animation and a small number of meaningful parameters (e.g. light-bank on/off levels per bank, tower height, card flow speed, red-alarm intensity, foreman ignition 0..1, cursor blink phase, warm/cold state for mirrors). Think about what the shots need: the hall (pillars, floor, fog), the line of stations with labels, conveyor rails, card queues/towers (instanced), red alarm pinpoints/beams, overhead light banks, MONTH gates, orbs/swarms (particles beyond ~2,000), the cursor block, the human silhouette placement, the foreman (the #1 hero object — design it with care: strong silhouette, tiers, emissive brass seams, a clay core, beams), the coordinator graph/hierarchy/swarm diagrams, error tendrils, light-line title forge if 3D. Also export camera helpers for repeated compositions (e.g. camHallAisle(lt), camTopDown(...)) and a preset grade/bloom per act (cold / red problem / warm factory).

Performance: ≤ ~1.0 s per frame at glscale 0.75 for any typical combination; share geometries/materials; instancing for ≤ a few thousand; particles beyond. Deterministic only (rand(seed), lt).

LOOK-DEV REVIEW (mandatory): write ${P}/src/shots/_world.js — a showcase shot list (several shots, e.g. 2 s each) exercising every set piece in its key states (dark hall + lone station; jammed red towers with human; lights-on; lit flowing line top-down; foreman low angle; graph/hierarchy/swarm). Render: cd ${P} && SF_QUERY=glscale=0.5 node render/stills.mjs --review --sheet --every 0.5 --only _world.js --out dist/review-world  and Read the sheets. Iterate until each view would hold up as a frame in a premium Villeneuve/Apple-grade trailer (composition, contrast, scale, light). Time one heavy frame at glscale 0.75 (node render/stills.mjs <t> --only _world.js). Do not edit engine.js / kit / styles.

Return the precise API documentation (builders will code against your text), look-dev notes and timing.`, { label: 'world-lib', phase: 'World', schema: SCHEMA })
return r
