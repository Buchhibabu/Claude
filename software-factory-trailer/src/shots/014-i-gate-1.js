// #14 i-gate-1 — M3 the clock. 14mm FPV skimming the approach rail at 16 u/s: brass GATE 1 (one lintel pip lit) with the MONTH 1
// placard hanging in its opening rushes the lens; we pass under it on the beat (0.75) and the camera levels out down a telescoping
// corridor of dark gates to the CODE station glowing clay at the vanishing point. World-fixed dust streaks sell the speed.
import { shot, beats, camFX, kf, ease } from '../engine.js';
import { W, gateRun, gateCam } from './lib/b2-act1a.js';

shot({
  id: 'i-gate-1', dur: beats(3), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 16, energy: 0.52, add: ['ticks', 'pulse', 'ostinato', 'kick'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0.75, 'B');
    ctx.sfx(0.5, 'whoosh', { gain: -4 });
    ctx.sfx(0.75, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'I' });
    const R = gateRun(scene, { pips: [1, 0, 0, 0, 0], sign: { text: 'MONTH 1', gate: 1 }, tower: 10 });
    return {
      scene, camera, ...W.grade('I'),
      update(lt) {
        const t = ctx.shot.start + lt;
        const pitch = kf(lt, [[0, 7], [0.6, 15, ease.inOut], [0.9, 1.5, ease.expoOut], [1.5, 2.5]]);
        const roll = 2.5 * Math.sin(lt * 2.4 + 0.6);
        const cam = gateCam(camera, lt, 1, { pitch, roll });
        R.update(lt, t, cam, { beaconK: 4 });
        camFX(camera, t, W.FOV[14]);
      },
    };
  },
});
