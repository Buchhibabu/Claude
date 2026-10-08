// iii-line-runs — THE TURN FRAME (hero). MIRROR of ii-line-waits-1 (camReviewWorm: identical 18mm worm's-eye, target and creep): the same
// REVIEW tower, now lit warm and FLOWING (amber lanes sliding L->R while the whole stack rises), green check lamps where the red pinpoints
// blinked. On frame 0, all at once: letterbox snaps open (138 -> 0 in 3 f), 2 f white flash, +1.5 EV bloom decaying over 20 f, the Dutch
// tilt rights (-8 -> 0 over 12 f), BRAAM #2, and the refrain flips in its slot: THE LINE RUNS.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';

shot({
  id: 'iii-line-runs', dur: beats(4, 150), act: 'III',
  music: { section: 'act3', chord: 'D', div: 16, energy: 0.85, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.bars(0, 0, 0.1);
    ctx.fx.hit(0, 'S');
    ctx.fx.flash(0, 0.067);
    ctx.sfx(0, 'braam', { root: 'D1', gain: 0 });
    ctx.sfx(0, 'impact', { gain: 0 });
    ctx.sfx(0, 'sub_drop', { gain: -2 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = W.hall(scene, { state: 'lit', parts: { towers: { review: 1200, test: 640 }, cursor: true } });
    H.foreman.group.visible = false;   // not framed here; keep the plant count exact
    const grade = W.grade('III');
    return { scene, camera, ...grade, get exposure() { return grade.exposure; }, get bloom() { return grade.bloom; }, get vignette() { return grade.vignette; }, get sat() { return grade.sat; }, get tint() { return grade.tint; }, get lift() { return grade.lift; }, get ca() { return grade.ca; }, update(lt) {
      const t = B.T(ctx, lt);
      H.banks.update(lt, { on: 1, t });
      H.line.update(lt, { lit: 1, strips: 1 });
      H.towers.update(lt, { review: 160, test: 120, lit: 1, t, flow: 6 });
      H.towers.group.position.y = ((t * 1.25) % 0.5) - 0.5;                 // the stack rises a card-pitch at a time: flow up and out
      H.cursor.update(lt, { on: W.blink(t, { bpm: 150, div: 2 }), k: 10 });
      H.update(lt, { lit: 1 });
      grade.bloom.strength = W.bloomHit(1.1, lt, { peak: 2.4, d: 0.67 });
      grade.exposure = 1 + 0.55 * Math.pow(1 - clamp(lt / 0.67), 2);
      camFX(camera, t, W.camReviewWorm(camera, lt, { dur: ctx.T, mirror: true }));
    } };
  },
  ui(root, tl, K) {
    const sc = B.scrim(K, root, { y: 820, h: 380, a: 0.5 });
    K.cutIn(tl, sc, 0.05); K.cutOut(tl, sc, 1.55);
    const r = B.refrain(K, root, 'THE LINE <span class="hot">RUNS.</span>');
    K.slam(tl, r, 0.05, { from: 1.12, d: 5 / 30, blur: 6, ease: 'power3.out' });
    K.cutOut(tl, r, 1.55);
  },
});
