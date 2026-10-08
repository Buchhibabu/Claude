# Trailer engine: capabilities and shot contract

The film is a deterministic timeline of **shots**, hard-cut back to back. Each frame is a pure function of time.

- **Rendering:** Three.js (WebGL via SwiftShader), with one shared post chain: bloom, grade, chromatic aberration (CA), vignette.
- **2D layer:** HTML/SVG + GSAP for kinetic type.
- **Global FX:** flash, impact shake, letterbox bars, glitch, fade to black, animated grain.
- **Capture:** 30 fps with 2 sub-frames each (motion blur). The 3D layer renders at 0.75× and the type layer at full 1080p.
- **Music grid:** 120 BPM (beat = 0.5 s = 15 frames; bar = 2 s). Use `beats(n)` for durations, or `beats(n, 150)` in 150 BPM sections. A tempo lift to 150 BPM is allowed per section (beat = 0.4 s = 12 frames). Shot cuts land on beats.

## Shot contract (`src/shots/NN-name.js`, ES module)
```js
import { shot, beats, kf, ease, camFX, rand, clamp, lerp } from '../engine.js';
import * as G from '../kit/gl.js';
shot({
  id: 'a1-cursor', dur: beats(4), act: 'I',
  three(ctx) {                       // optional 3D; return the scene/camera/update
    const { scene, camera } = G.stage({ fog: 0.02 });
    // build objects (seeded randomness only)
    return {
      scene, camera,
      bloom: { strength: 1.0, radius: 0.5, threshold: 0.7 },   // per shot
      sat: 1.0, tint: [1, 1, 1], lift: 0, vignette: 0.45, exposure: 1.0, ca: 0.0008,
      update(lt, u) {                // lt = seconds into shot, u = 0..1. Pose everything from lt only.
        G.look(camera, kf(lt, [[0, [0, 2, 10]], [2, [0, 1, 6], ease.expoOut]]), [0, 1, 0], 31.4);
        camFX(camera, ctx.shot.start + lt, 31.4);   // applies impact shake + FOV kick from hits
      },
    };
  },
  ui(root, tl, K, ctx) {             // optional 2D type on this shot's timeline (local seconds)
    const t = K.text(root, { y: 540, cls: 'mega', html: '5 MONTHS.' });
    K.slam(tl, t, 0.1);
    ctx.fx.hit(0.1, 'A');            // tiered impact: 'S' | 'A' | 'B' (shake 2D + 3D, exposure flash, CA spike)
    ctx.sfx(0.1, 'impact', { gain: 1 });   // sound cue (see audio kinds below)
  },
});
```

**Context helpers:**
- `ctx.fx.flash(at, d, {color, peak})`: a full-frame flash. Use sparingly; no more than 10 in the whole film.
- `ctx.fx.shake(at, px, d, rotDeg)`: 2D shake only.
- `ctx.fx.glitch(at, d, amp)`: RGB split plus jitter on the type layer, and CA on the 3D layer.
- `ctx.fx.bars(at, px, d=0)`: letterbox height. 138 px gives 2.39:1, 0 is full frame. With `d=0` the change is a hard cut; with `d>0` the bars animate there over `d` seconds. The value persists until the next `bars()` call. **Every shot sets its own bars at local 0**, so shots render correctly in isolation.
- `ctx.fx.fade(at, d, from, to)`: black overlay.
- `ctx.fx.hit(at, tier)`: an impact, as defined above.

## Type kit (`K`)
- **Layout:** `K.text(root, {x, y, w, cls, html, align})` places a block centered at (x, y).
  - Classes: `mega` (300 px, Inter Tight 900), `slam` (150 px, 800), `cond` (Anton caps, 220 px), `title` (thin, wide-tracked caps), `kicker` (26 px tracked clay caps), `line` (56 px), `serif`, `mono`.
  - Colors: `hot` (clay), `gold`, `ice`, `danger`, `dim`.
- **Entrances:**
  - `K.slam` blurs from big to sharp.
  - `K.giant` scales down from 4×.
  - `K.maskUp` makes lines rise out of a mask; use `<br>` for lines.
  - `K.letters` staggers per character.
  - `K.tracking` collapses wide tracking to tight.
  - `K.glitch` does an RGB-split settle.
  - `K.fadeIn` is a plain fade.
  - `K.cutIn` / `K.cutOut` are hard cuts.
  - `K.push` adds a slow scale drift while held.
  - `K.decode(tl, el, at, {d})` resolves scrambled glyphs left to right (a tech label or title reveal).
  - `K.stamp(tl, el, at)` is a hard cut-in at 1.18× that snaps to 1× in 3 frames, for punching a card on a hit.
  - `K.wipe(tl, el, at, {d, dir:'right'|'left'|'up'|'down'|'center'})` is a hard-edged clip reveal; `center` suits the light-line title.
  - `K.blowOut(tl, el, at)` makes the card blow past the camera on exit. Use it rarely; hard cuts are the default.
- **Data:**
  - `K.roll` is a rolling counter.
  - `K.typewriter` types text out.
- **Raw elements:** `K.svg(root)` returns an SVG layer and `K.el(tag, attrs, parent)` builds an element.

## 3D kit (`G`)
- **Scene:** `stage({fov, fog, bg})` returns a scene with a key and rim light.
- **Particles and grid:**
  - `particles({count, spread, center, color, size, seed})` returns a points object plus its position arrays, which you can animate yourself.
  - `grid({y, cell, color, fade})` is an infinite fading floor grid.
- **Objects:**
  - `glowBox({w, h, d, emissive, intensity, edges})`: emissive intensity drives bloom; 2–20 is HDR.
  - `orb({r, color, intensity})` is an agent.
  - `fatLine(points, {color, width})` and `line(a, b)`.
  - `textPlane(text, {font, width, color, glow})` is a 3D type plane (canvas texture).
  - `beam({...})` is a volumetric light shaft.
- **Crowds and props:**
  - `instanced({count, geometry, basic, color})` returns `I`. `I.set(i, {p, s, r, c, k})` sets position, scale, rotation, color and brightness (`k > 1` blooms with `basic:true`); `I.hide(i)`; `I.commit()` after updates. Use it for thousands of cards, desks, agents or towers.
  - `human({h, color, pose:'stand'|'sit'})` is a faceless silhouette (black by default; put light behind it).
  - `flow({curves, count, speed, size, color})` returns particles streaming along splines. Call `.update(lt, gate)` every frame; `gate` (0..1) shows that fraction of them.
  - `canvasPlane({w, h, px, glow, draw(g,w,h,t)})` is an in-world screen or panel. Call `mesh.userData.redraw(lt)` every frame if it animates.
  - `drawCode(g, w, h, {seed, lines, reveal, bg, t})` draws stylized code (colored token bars plus a cursor) into a 2D context.
  - `ring({r, tube, color, k, arc})` is a glowing torus.
  - `hdr(color, k)` is a basic HDR material for bloom.
- **Camera:**
  - `look(camera, pos, target, fov)`.
  - `spline(points)` for paths: use `.getPointAt(u)` for constant speed.
- `THREE` is exported for anything else.

## Lens map (vertical fov)
| mm | 14 | 18 | 24 | 35 | 50 | 85 | 135 | 200 |
|---|---|---|---|---|---|---|---|---|
| fov | 70.2 | 57.3 | 44.6 | 31.4 | 22.3 | 13.2 | 8.3 | 5.6 |

For a top-down camera, set `camera.up.set(0,0,-1)` before `lookAt`.

## Audio cue kinds (`ctx.sfx(at, kind, opts)`)
- **Impacts and blasts:** `impact`, `braam` (`{root:'A1'}`), `sub_drop`, `sting` (final), `bell`.
- **Swells:** `riser` (`{dur}`, which ends exactly at `at + dur`), `reverse_swell` (`{dur}`, which ends at `at + dur`).
- **Transitions:** `whoosh` and `glitch`.
- **Rhythm:** `tick` and `heartbeat`.
- **Silence:** `silence` (`{dur}`) is a true air pocket. It hard-mutes the music, and also the tails of every SFX that started earlier.
- **More cues:**
  - `boom` is a taiko-style low drum.
  - `roll` (`{dur}`) is a drum roll accelerating from 8ths to 32nds, starting at `at`.
  - `chirps` are data blips; `shimmer` is a warm logo bell chord.
- **Music-bus tricks:**
  - `tape_stop` (`{dur}`) winds the music down.
  - `stutter` (`{dur}`) is a buffer-repeat roll of the music.
- **Hit families:** `impact`, `braam`, `sting` and `boom` get an automatic pre-hit music dip and a sidechain duck.

Music beds come from the per-shot `music` field (rendered by `audio/score.py`):
```js
{ section, bpm, chord, div, energy, add, drop }
```
- **`section`:** `'cold'|'act1'|'act2'|'turn'|'act3'|'peak'|'end'`.
- **`chord`:** `'Dm'|'Bb'|'Gm'|'F'|'C'|'A'|'Am'|'Dsus'|'D'|'Bbmaj'`.
- **`div`:** drum subdivision per bar: `4|8|16|32`.
- **`energy`:** `0..1`.
- **`add` / `drop`:** add or remove layers.

Available layers: `drone pad pulse ostinato kick drums strings piano hats heart ticks`.

**Review:** `SF_QUERY=glscale=0.5 node render/stills.mjs --review --sheet --every 0.25 --only a.js,b.js --out dist/review-x` writes one contact sheet per shot (`<id>.jpg`, numbered frames) plus the individual PNGs.

## Performance budget
- **Render cost** is about 0.7 s per 3D frame at 0.75× scale, so a 2:15 film takes about 1.5 hours. Pure-type shots on black are about 10× cheaper.
- **Per-shot limits:** up to about 30k particles and 2,000 instanced meshes.
- **Avoid:** `MeshPhysicalMaterial` transmission and DOF passes, since they're expensive in software GL. Fake depth with fog and blur.
- **Determinism:** no `Math.random`, `Date` or `performance.now`. Use `rand(seed)`, and compute everything from `lt`.
