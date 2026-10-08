# WORLD — shared set library (`src/shots/lib/world.js`)

```js
import { shot, beats, kf, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';          // W.THREE and W.G (kit/gl.js) are re-exported
```
Showcase of every piece in use: `src/shots/_world.js` (29 look-dev shots). Everything is deterministic: pose all parts from `lt`
inside `update()`. Pass **global** time `t = ctx.shot.start + lt` to anything beat-locked (blinks, pulses, flows) so it locks to the music grid.

## 0. Conventions
- Units: 1u ≈ 1 m (human 1.8u). y up. Work flows +x (left → right on screen). Floor y=0, x −300..300, z −290..90.
- Layout constants: `W.LINE {x0:-70,x1:70,y:1.2,z:0,len:140}`; `W.STATIONS[i] {i,name,x0,x1,cx,w}` (PLAN, DESIGN, CODE, REVIEW, TEST, DEPLOY, OPERATE; CODE = x −30.8..−8.4, 16% of the line); `W.ST.CODE` etc.;
  `W.BANK_X` (−70+20i, y 60); `W.GATE_X` [−250,−210,−180,−155,−135]; `W.SUBLEAD_X` (−66+12j);
  `W.POS` { codeTop [−19.6,3,0], reviewBase [1.4,3,0], testBase [21,3,0], deployBase [40.6,3,0], screen [−19.6,2.5,5.2], cursor [−19.6,2.5,5.3],
  foreman [0,0,−200], core [0,150,−195], crest [0,196,−200], engraving [0,64,−172.8], humanI [−19.6,0,6], humanII [1.4,0,6], humanIII [0,0,−134], brief [0.25,1.55,−133.8], ledger [−19.6,36,14] }.
- Palette `W.C`: void, slate, graphite, steel, ice, clay, ember, amberRail (#FFB070), amber (#FFD2A0), bankOn, brassHi (#F3D9B1), brassMid, brassDark, brass (#E8B47A), deadBrass, ivory, card, red (#FF453A), green (#6EE7A0), obsidian, floor, grid, fog, fogWarm.
- **HDR calibration (read this):** every `k` in this API is the shot list's NOMINAL k (cursor 10, core 20, banks 12, seams 6, orbs 10…). The library renders
  surfaces/orbs/sprites at `k × W.KS (0.33)` and edges/lines at `k × W.KE (0.7)`, plus automatic **screen-size compensation** on glows (a cursor filling the frame
  is dimmed so it stays clay instead of clipping white; a sub-pixel spark is boosted up to 1.6×). Nominal k on numerous/large emitters otherwise washes the frame white
  at the shot list's bloom (0.8–1.6). For YOUR OWN emissives use `W.hdr(hex,k)` (MeshBasic, ×KS), `W.hdrLine(hex,k)` (Color, ×KE), `W.ko(k)` / `W.kl(k)`,
  `W.glowMesh`, `W.orbs`, `W.fat`, `W.glowSegs` — never raw `G.hdr(c, 10)` / `G.orb(...)` / `G.fatLine` (those are uncalibrated, hard-edged and will bloom-blotch).
  Crowds (>100 orbs in frame) should sit near nominal k ≤ 2–3 so only accents bloom.
- Colour helpers: `W.lin(hex,k)` → linear [r,g,b]×k (RAW, used for instanced edge/body triples); `W.hcol(hex,k)` → THREE.Color×k (RAW).
- Time helpers: `W.spb(bpm)`; `W.blink(t,{bpm=120,div=1,duty=0.5,origin=0})` → 1/0 (div 1 = quarter-note human speed, div 2 = 8ths after OPUS 4.5);
  `W.beatPulse(t,{bpm,div,decay=6})` → 1→0 decay per step; `W.ignite(dt)` → 0→1.3 in 2 f, settle to 1.0 over 6 f (dt = s since switch-on; 0 before);
  `W.strike(dt,seed)` fluorescent flicker-on; `W.fogKeep(dist, keep=0.8)` → FogExp2 density that keeps `keep` contrast at `dist`; `W.bloomHit(base, dtSinceHit,{peak=1.6,d=0.66})`.

## 1. Shot skeleton
```js
shot({ id: 'i-hall-wide', dur: beats(4), act: 'I', music: {...},
  three(ctx) {
    ctx.fx.bars(0, 138);
    const { scene, camera } = W.stage({ act: 'I' });                 // scene + fog + act lights
    const H = W.hall(scene, { state: 'dark', parts: { cursor: true } });
    return { scene, camera, ...W.grade('I'), update(lt) {
      const t = ctx.shot.start + lt;
      H.cursor.update(lt, { on: W.blink(t), k: 10 });
      H.update(lt);                                                    // ALWAYS LAST: gathers floor light pools/reflections
      camFX(camera, t, W.camHallWide(camera, lt, { dur: ctx.T, t, handheld: 0.3 }));
    } };
  } });
```

## 2. Stage and grades
- `W.stage({ act='I', fog, fogColor, fov=40, near=0.1, far=2400 })` → `{ scene, camera, lights:{amb,key,rim}, setFog(density, color?) }`. Act lighting: key 0.15 in COLD/I/MID/II (frame stays 70–85% black), 0.4 warm in III; fog per act (below). Background = fog colour.
- `W.grade(act, overrides)` → fresh `{ bloom:{strength,radius,threshold}, sat, tint, exposure, ca, vignette, lift, fog, fogColor }` to spread into the three() return. Overrides merge (`W.grade('III',{ bloom:{strength:1.4} })`).
  COLD: bloom 1.2/0.4/0.7, sat 0.9, tint [1.05,1,0.94], exposure 0.62, fog 0.01 #0B0907 · I: 0.8/0.4/0.8, sat 0.8, tint [0.96,1,1.06], exp 0.9, fog 0.005 · MID: 0.9/0.4/0.85, sat 0.7, exp 0.85, vig 0.6 ·
  II: 0.9/0.4/0.8, sat 0.75, tint [0.95,1,1.07], exp 0.95 · III: 1.1/0.45/0.75, sat 1.05, tint [1.04,1,0.95], exp 1.0, vig 0.4, fog 0.004 #0E0906 · TITLE: 1.5/0.4/0.7 · BUTTON: like I, sat 0.9.
- `W.bankGrade(i)` (i = 1..8) for iii-bank-1..8: tint/sat lerp cold→warm by i/8.

## 3. HALL — the one set
`const H = W.hall(scene, { state: 'cold'|'dark'|'alarm'|'lit', parts })` — adds itself to the scene. Default parts `{ atmosphere, floor, pillars, line, banks, foreman: true; cursor, tower, ledger, rails, gates, threads: false; towers: null | {review, test, deploy} (max cards each); human: null | 'I'|'II'|'III' }`.
Returns `H = { group, sky, floor, pillars, line, banks, foreman, cursor, tower, towers, rails, gates, ledger, threads, human, extra: [], update(lt, p) }`.
- State defaults: 'dark'/'alarm' = ice edges, banks off (alarm: banks red); 'lit'/'cold' = brass pillars, lit stations + strips, banks on ('lit' only). **The foreman is always built UNLIT** — drive `H.foreman.update(lt,{lit})` yourself (reveal is iii-foreman-hero).
- `H.update(lt, { lit 0..1 (pillar edges ice→brass + sky haze cold→warm), alarm 0..1, pillarK, sky (haze gain, default 1; use 2.5–4 for silhouettes against fog) })` — call LAST each frame.
- `H.extra.push({ p:[x,y,z], c:hex, k, pool:radius, poolK, refl, size })` adds your own floor light source (pool of light and/or a wet-floor streak reflection). Max 16 strongest sources are used.
- Hide anything per shot: `H.pillars.mesh.visible=false`, `H.foreman.group.visible=false`, `H.line.group.visible=false`, `H.banks.group.visible=false`, etc.

### Parts (each also usable standalone: `const X = W.part({...}); scene.add(X.group)`)
- **Floor** `W.floor({ rough=0.07, grid=true, cell=2, gridFade=220 })` → `{ mesh, setSources(list), setGrid(k) }`. Dark glossy slab, #1A2430 grid, light pools + analytic glossy reflections (cost-optimised; reflections skipped automatically in top-downs).
- **Pillars** `W.pillars({lit})` → `update(lt,{ lit 0..1, k, alarm })`: 40 slate 2×120×2 at z ±30, x −285+30i; edges ice k0.3 → brass k1.5, fade into fog with height.
- **Atmosphere** `W.atmosphere({fogColor, glow, k})`: sky dome = fog colour + horizon haze band (makes dark masses read as silhouettes).
- **Line** `W.lineStations({lit})` → `update(lt, { lit, strips, draw, red, scan, codeK=8, stripK=3, conveyorK, dim=0.4 })` (number or [7] per station): 7 boxes (seg−1.2)×3×10 at y 1.5; top strips (CODE clay, others amber) drawn from each segment's own left edge by `draw`; `scan` < 1 = wireframe→solid scan line rising (iii-bank-2/5); `red` = alarm edges; ivory conveyor hairline (0.35 dark / 2 lit).
  `H.line.label(i, 'REVIEW.', { color=C.red, k=4 (raw), height=1.6, flat=false })` → text plane on station i's front face (flat:true = lying on the floor in front, for DEPLOY.).
  m-sixteen: `H.line.update(lt,{ lit:0, dim:0.25, strips:[0,0,1,0,0,0,0], draw:[0,0,u,0,0,0,0], codeK:8 })` with `scene.fog.density = W.fogKeep(545,0.85)`.
- **Light banks** `W.lightBanks()` → `update(lt, { on: n|[8] (use W.ignite(dt)), alarm: n|[8], t, beam (opacity scale), relay: [8] 0..1 closed, dust 0..1, housing: true|false })`. 8 housings 16×0.8×12 at y 60 with a lamp-cell underside, a beam to the floor, 1,500 dust motes inside beams, a brass relay at (x, 60.6, 6) whose arm closes and filament burns (red in alarm, warm white on). Alarm breathes on quarter notes. **Top-downs above y 60: `housing:false`** or the housings cover the line.
- **Code tower** `W.codeTower()` → `update(lt, { count 0..1000 (fractional grows; 10 row / 100 tier / 1000 = 10 tiers 30u), k (nominal 10; 3 = dimmed), crest 0..1, t, pulse=0.2, hideFrom })`, `orbPos(i)`, `crest` (ring r9 at y34). Density-compensated so 1,000 orbs blaze without whiting out.
- **Cards** `W.cards({count, size=[3,0.5,2]})` → instanced boxes API (below). Colour triples: `W.CARD.edge(k)` ice, `CARD.body(k)` ivory, `CARD.amberEdge/amberBody` (lit), `CARD.greenEdge`, `CARD.redEdge`.
- **Card towers** `W.cardTowers({ towers:{review:1200, test:640, deploy:240} })` (total ≤ ~2,000) → `update(lt, { review:n, test:n, deploy:n (2 cards = 1u), lit 0..1, flow (u/s, 6), t, red 0..1, shake (u), tip:{review: rad} })`. Bases (1.4,3,0)/(21,3,0)/(40.6,3,0), seeded ±0.15 rad / ±0.3u jitter; red pinpoints every 12u on alternating corners blinking on 8ths (odd/even); `lit` → ordered amber rack whose levels slide +x at `flow` with green check lamps. `tip` topples toward +z about the base.
- **Deploy maze** `W.deployMaze()` → `update(lt, { cards 0..400, lit 0..1, t, flow })`: 14 branching strips over x 31..51, z −12..12, red stop lamps on 8ths → green/amber flow when lit.
- **Month gates** `W.monthGates({counters:true})` → `update(lt, { pips:[1,2,3,4,5], k=3, counterK=0.9 })`, `.gates[n].group`, `.rail`. Single gate: `W.gate({x,y,z,counter:'MONTH 1'})` → `update(lt,{ lit: pips 0..5, k, pipK=8, counterK, body })`. Pips on BOTH lintel faces (x ±0.7). Soft brass outlines.
- **Ledger** `W.ledgerRow()` → `update(lt, { fill 0..1 (cell 7, clay k10), seam (nominal edge k 3 → 10 flare), burst: s since stamp (<0 off) })`, `cellPos(i)`.
- **Rail network** `W.railNetwork({posts:true})` → `update(lt, { cascade: s since start (<0 off, 99 all on), rewind: s since rewind start (<0 none), k=6, flow (u/s dash speed; 0 steady), t, dim })`, `maxT` (cascade duration ≈1.6 s). 1,000 rails radiating from CODE at 160 u/s; lamp posts at z 41.5 every 10u (tips light with the cascade). Near rails auto-dim.
- **Cold rail** `W.coldRail()` → `update(lt, { k=12, x })`, `.orb`: brass rail at z 20 + sleepers + clay orb riding at 30 u/s from x −60 + 300 wake motes (pair with camColdRail).
- **Cursor** `W.cursorBlock({ screen:true, scale:1, pos })` → `update(lt, { on 0..1, k (10; 3 dimmed; 14 final), type 0..1 (current line typed), lines 0..1, screenK=0.4, flare 0..1, tint })`, `.cursor`, `.screen`. Block 0.6×1×0.15 on the 6×3.4 CODE screen (−19.6,2.5,5.2).
- **Human** `W.humanAnchor({ act, pos, facing (0 faces +z; Math.PI faces the foreman), brief:false })` → `update(lt, { rim:hex, rimK=3, raise 0..1, brief (card glow), briefHide })`, `cardWorld()`. Fresnel rim (ice in I–II, amber in III) + point light behind + floor pool. With `brief:true` the right arm holds the card at chest (`raise` lifts it overhead). ii-human-red: `rim: W.C.red`.
- **Foreman** `W.foreman()` (in hall) → `update(lt, { lit: s since ignition (≤0 unlit), seamK=6, core (override; default 0→26→20), beams 0..1, panel 0..1, crest 0..1, bounce, rimColor, rimK, sweep:{ s, k=12, len=6 }, engrave:{ k, x, width, gain }, hourRing 0..18, slotGlow })`, `corePos`, `sweepPath`/`sweepLen` (~120u), `coreMesh`, `engraving`, `beams`.
  Obsidian T1–T4 ziggurat + T5/T6 obelisk (3u slot on +z showing the core) + T7 pyramidion + crest ring; 42 brass seams with an anti-aliased glow layer that ignites radially from the core at 120 u/s (hot wavefront; full trace ≈1.6 s), then faint stone-course circuitry, cove wash under each seam, 4 crest beams forming a Λ light pyramid to the T1–T4 terrace corners, “5.5” engraving on T4 (0,64,−172.8), 18-lamp hour ring (r 94).
  **Unlit reads:** plants `rimColor: W.C.clay, rimK: 0.4` (Act I), red 0.5 (Act II); silhouettes need lit air behind them → `H.update(lt,{sky:2.5–4})`. Sweep for camForemanWorm: `sweep:{ s: 140*lt }` (with pull 38 use s = 40 + 140*lt so it is in frame). Engraving catching the sweep (iii-five-five): `engrave:{ k:0.6, x: lt/0.8, gain: 8 }`.
- **Foreman threads** `W.foremanThreads({ briefStart })` (in hall as `threads:true`) → `update(lt, { reveal 0..1|[12], k=2.2, leads 0..1|[12], flow 0..1 (6,000-particle gate), t, pulses 0..1, flare:[12] (extra k multiplier), brief 0..1 (mote along briefPath; <0 hidden), briefK })`, `leadPos`, `briefPath` (CatmullRom from the hand up the stepped face into the core). Exactly 12 fat lines; finer flow is particles.
- **Threads (generic)** `W.threads({ from, to:[...], ctrl:(j,to)=>[x,y,z], c0, c1, k=3, width=2.5 })` → `update({ reveal, k, flare })`, `.curves` (for pulses). Use for iii-stripe (session orb → 12 orbs on an arc).
- **Agents** `W.agents({count≤1000, r=0.35})` → orbs API; `W.AGENT` = { claude:[clay,10], swarm:[ice,4], neutral:[ivory,6], error:[red,12] }. Crowds > 2,000: `W.swarmHaze({ count, spread, center, color, k=2, size })` → G.particles API (animate `.positions`, then `.geometry.attributes.position.needsUpdate = true`).
- **Error map** `W.errorMap({ seed=172 })` → `update(lt, { grow 0..1, keep 17|4, retract 0..1, coord 0..1, spark 0..1|-1, t, orbColor, orbK=4, tendrilK=6 })`. Same 300 seeded orbs (≈62×30u around (1.4,3,0)) in master and mirror; 17 tendrils → `keep:4, retract:1, coord:1` leaves exactly 4 red, pulsing. Use with camErrorTop and `scene.fog.density = W.fogKeep(160,0.85)`.
- **Graph** `W.graphDiagram({ center:[0,2,0], radius:14 })` → `update(lt, { t (s since pulses start; <0 none), hop=4/30, k=3 })`: ivory hub + 12 workers in brass housings, 13 brass filaments (inlet + 12 spokes), pulse hops edge by edge, nodes flare on arrival.
- **Hierarchy** `W.hierarchy({ center, scale })` → `update(lt, { align 0..1|[workers, leads, apex], beams 0..1, k=3, links 0..1 })`: 16→4→1 on brass-seamed stepped plinths (44/26/10u wide, 4u tiers; use scale ~1.3 for the 24mm crane).
- **Swarm read** `W.swarmRead({ center:[20,2,0] })` → `update(lt, { fan, converge, write, t })`: 300 readers, 24 code docs, one read-beam LineSegments, one writer, card turns green at write=1.
- **Title forge** `W.titleForge()` + `W.camTitle(camera, lt, {dur})` → `update(lt, { grow 0..1, split (u; frame is 16u wide → 1u = 120 px), k=12, warm 0..1 (clay→ivory), embers 0..1, t })`.

## 4. Primitives
- `W.orbs({ count, r, seg })` → `I.set(i,{ p, s, c: hex|[r,g,b], k (nominal) }); I.hide(i); I.commit()` — instanced hot-core spheres with size compensation.
- `W.boxes({ count, size:[w,h,d], color, metal, rough, edgeW, fadeY, crowd })` → `I.set(i,{ p, r:[rx,ry,rz], s, edge:[r,g,b], body:[r,g,b] }); I.color(i,edge,body); I.hide(i); I.commit()` — edge/body are RAW: `W.lin(W.C.amber, W.kl(3))`.
- `W.edgeStd({...})` MeshStandard with screen-space emissive edges (`mat.setEdge(hex, rawK)`, `mat.setBody(hex, rawK)`).
- `W.glowMesh(geometry, hex, k, { shade:'sphere'|'box'|'flat', radius, ref, min, max })` → mesh with `userData.setGlow(k, hex?)`.
- `W.fat(points, { color, k, width (px @1080p), colors, soft=true })` → `userData.reveal(u)`, `userData.set(k, hex?)` (soft gaussian, additive, fogged).
- `W.glowSegs(pairs | flatArray, { color, k, width, colors })` → one-draw soft segments, `userData.set(k)`; `W.boxEdgePairs(centre, size)` → 12 edges for alias-free glowing outlines.
- `W.shaft({ rTop, rBot, h, color, k, opacity, apexFade })` + `W.aimShaft(mesh, apex, base)`; `userData.set(k, opacity)`, `userData.setColor(hex,k)`. Volumetric cone, fogged, fades near the lens.
- `W.flare({ color, k, size })` sprite (radial glow + thin anamorphic streak), `userData.set(k, hex?)`, size-compensated.
- `W.text3D(text, { height (cap, u), color, k (RAW: 0.9 crisp, 3–4 glowing), font })` → plane facing +z, `userData.set(k,hex)`, `userData.sweep(x01, width, gain)`.

## 5. Cameras (each poses the camera and RETURNS the base fov for camFX)
`W.FOV = {14:70.2, 18:57.3, 24:44.6, 35:31.4, 50:22.3, 85:13.2, 135:8.3, 200:5.6}` · `W.camLook(cam, pos, target, fov, { roll (deg), up })` · `W.handheld(cam, t, deg=0.3)` (Acts I–II only) ·
`W.camTop(cam, x, h, z, fov, yawDeg)` (straight down, up = (0,0,−1) rotated by yaw: +x right, foreman at top edge, never flips).
- `camHallWide(cam, lt, { dur, t, handheld })` 18mm (−180,1,6)→(−175,1,6), target (−19.6,29,0).
- `camReviewWorm(cam, lt, { dur, mirror, roll=−8, t, handheld })` 18mm (−6,0.5,18) creeping 5% → (1.4,14.1,0); mirror rights −8→0 over 12 f power3.out.
- `camHumanUnderTower(cam, lt, { dur, stutter, t, handheld })` 14mm (1.4,0.3,72)→(…,69.1), target (1.4,36,0); stutter = step-print on twos + zoom +3%/2 f. Fog 0.008.
- `camReviewSide(cam, lt, { dur, dir: −1 (R→L) | +1 (L→R), t, handheld })` 135mm (x,3,90), x −4↔−8.
- `camTestWorm(cam, lt, { dutch: 10|0, t, handheld })` 14mm (16,0.5,14)→(21,30,0).
- `camDeployTop(cam, lt, { yaw=6 })` 50mm (40.6,70,0) · `camErrorTop(cam)` 85mm (1.4,160,0) · `camWriterMacro(cam)` 85mm (−9,3.2,6)→(−9,2.6,0).
- `camLineTop(cam, lt, { dur, rot, h=545, descend=0.02 })` 135mm straight down (needs `scene.fog.density = W.fogKeep(545,0.85)`).
- `camColdRail(cam, lt)` 85mm (−60+24lt,0.38,20.8)→(−58+24lt,0.08,20) · `camColdCascade(cam, lt, { dur })` 35mm y = 40·3^expoIn → 120 at (−19.6,y,−0.7) · `camColdFPV(cam, lt)` 14mm (−150+40lt,0.5,40), roll 0→90° over 0.5 s ·
  `camForemanWorm(cam, lt, { pull=0 })` 14mm (0,0.5,−128+pull−2lt)→(0,42,−200) · `camGateFPV(cam, lt, n)` 14mm y 1 z 0, speeds 16×[1,1.3,1.7,2.2,3], passes gate n at [0.75,0.5,0.5,0.5,0.25] (gate 5 brakes).
- `camForemanHero(cam, lt, { dur=2.4, orbit=12, push=0.03, shift=0.24, pitch=8 })` 14mm at (0,2,−40) radius 160, pitch +8° with lens shift via `setViewOffset` (call `camera.clearViewOffset()` if you reuse that camera for another framing).
- `camStill(cam, lt, { dur })` 35mm (0,1.5,−60)→(0,40,−200) · `camAisle(cam, lt, { roll })` 14mm (−90,0.5,0)→(60,20,0) · `camCursorMacro(cam, lt, { dist=9, push=0.04, dur })` (cursor ≈ half frame height) ·
  `camPlant(cam, scene, pos, target, fov=135mm)` (also sets fog = 1.27 / distance to the foreman; `W.plantFog(pos)`) · `camTitle(cam, lt, { dur })`.

## 6. Known spec conflicts (and what the library does)
- i-karpathy / b-cursor-on macro (85mm at z 9) shows only 0.88u of height, smaller than the 1u cursor → use `camCursorMacro` or `cursorBlock({ scale: 0.35 })`.
- c-foreman-worm at z −128 sees only T1's face (T2–T4 hide behind its lip) → `camForemanWorm(cam, lt, { pull: 38 })` in both bookends; sky gain 3–4 for the silhouette.
- camWriterMacro's card (−9,2.6,0) sits in the CODE/REVIEW gap inside the station boxes' depth: hide `H.line.group` or move the card to z 5.5 and the camera target with it.
- Top-downs between y 0–60 (iii-factory-zoom) pass the bank housings → `H.banks.update(lt,{ housing:false })`; x 1.4 sits in the 4u gap between banks 3 and 4.
- c-rail-streak: at lt 0 the orb is level with the lens (fills frame once ahead); start it ~6u ahead (`coldRail.update(lt,{ x: -54 + 30*lt })`) for a composed frame 0.
- iii-foreman-hero: the sub-leads (z −12) are behind the camera (z −40), so the 12 threads fan UP out of frame top from the core (reads as a crown of rays).
- Month-gate pips "x+0.7" would face away from the approaching FPV → pips on both faces.
