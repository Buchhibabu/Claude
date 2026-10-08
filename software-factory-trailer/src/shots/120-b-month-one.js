// b-month-one — BUTTON. The Act I master returns (camHallWide framing + the same i-hall-wide atmosphere from b2), calm, no handheld,
// 1%/s push: one cold station at 160u, the clay cursor blinking on the returned quarter-note tick, the rest of the hall dark.
// Gate 1 stands over the station with all 5 pips OFF; on the 1.0 beat the counter rolls MONTH 0 -> 1 and the first pip lights.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import { atmo } from './lib/b2-act1a.js';
import { odometer } from './lib/b8-peak-end.js';

shot({
  id: 'b-month-one', dur: beats(6), act: 'BUTTON',
  music: { section: 'end', chord: 'Dm', div: 4, energy: 0.15, add: ['ticks', 'piano', 'drone'], drop: ['pulse', 'ostinato', 'kick', 'drums', 'strings', 'hats'] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(1.0, 'B');
    ctx.sfx(0, 'tick', { gain: -20 });
    ctx.sfx(1.0, 'bell', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'BUTTON' });
    const H = W.hall(scene, { state: 'dark', parts: { cursor: true } });
    // the i-hall-wide atmosphere (same skylights, haze layers and near motes as shot 9)
    const A = atmo(scene, H, {
      shafts: [
        { x: -138, z: -6, r: 6, op: 0.10, poolK: 0.8 },
        { x: -104, z: -12, r: 7, op: 0.12 },
        { x: -66, z: -4, r: 7, op: 0.13 },
        { x: 18, z: -14, r: 8, op: 0.12 },
        { x: 62, z: -2, r: 9, op: 0.10, light: false },
      ],
      haze: [
        { x: -130, w: 130, h: 26, k: 0.035 },
        { x: -85, w: 130, h: 30, k: 0.04 },
        { x: -40, w: 140, h: 34, k: 0.05 },
        { x: 10, w: 160, h: 40, k: 0.06 },
        { x: 80, w: 200, h: 50, k: 0.07 },
      ],
      near: { count: 140, box: [[-176, 0.2, -14], [-150, 9, 22]], color: 0xcfe3f2, k: 0.18, size: 0.05, seed: 9, rise: 0.08, sway: 0.25 },
    });
    // gate 1, scaled up so its lintel reads above the station at 160u
    const GS = 1.6;
    const Gt = W.gate({ x: 0, counter: null });
    Gt.group.scale.setScalar(GS); Gt.group.position.set(-34, 0, 0); scene.add(Gt.group);
    const pipFl = W.flare({ color: W.C.brassHi, k: 0, size: 5 }); scene.add(pipFl);
    return {
      scene, camera, ...W.grade('BUTTON', { vignette: 0.5 }),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.cursor.update(lt, { on: W.blink(lt, { bpm: 120 }), k: 10 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.4 });
        const ig = W.ignite(lt - 1.0);
        Gt.update(lt, { lit: lt >= 1.0 ? 1 : 0, k: 1.6, pipK: 10 * Math.max(ig, lt >= 1 ? 1 : 0), body: 0 });
        // pip 1 (z -4 on the camera-facing face) gets a flare on ignition
        pipFl.position.set(-34 - 0.7 * GS, 14 * GS, -4 * GS);
        pipFl.userData.set(lt >= 1.0 ? 3 + 9 * Math.exp(-(lt - 1.0) * 5) : 0, W.C.brassHi);
        A.update(lt, t, { stationK: 1, shaftK: 1 });
        H.update(lt, { sky: 2.6, pillarK: 0.55 });
        camFX(camera, t, W.camHallWide(camera, lt, { dur: ctx.T, push: 4.8 }));
      },
    };
  },
  ui(root, tl, K, ctx) {
    // one mono counter: 'MONTH 0' fades in at 0.75 (primed recall), only the digit rolls 0 -> 1 at 1.0 (6 f), out at 2.25
    const el = K.text(root, { x: 960, y: 300, w: 1200, cls: 'mono', html: 'MONTH&nbsp;', style: { fontSize: '120px', color: '#FAF9F5', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: '1', textShadow: '0 0 24px rgba(0,0,0,0.6)' } });
    const D = odometer(K, el, ['0', '1']);
    K.fadeIn(tl, el, 0.75, { d: 0.25 });
    D.roll(tl, 1.0, 0.2);
    K.cutOut(tl, el, 2.25);
  },
});
