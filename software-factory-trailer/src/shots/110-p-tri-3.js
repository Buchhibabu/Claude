// p-tri-3 — tricolon 3 (peak hit): straight down over DEPLOY; DEPLOY's sub-lead ignites brightest, then a crash zoom out
// (rise + widen) reveals all three ignited threads pulsing together over the whole flowing line.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade, triRig } from './lib/b8-peak-end.js';

shot({
  id: 'p-tri-3', dur: beats(1, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 32, energy: 1.0, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'A');
    ctx.sfx(0, 'boom', { gain: 0 });
    ctx.sfx(0, 'impact', { gain: -2 });
    ctx.sfx(0, 'sub_drop', { gain: -4 });
    ctx.sfx(0, 'roll', { dur: 2.0, gain: -4 });
    const R = triRig(ctx, { j: 9, level: 3, others: [6, 7] });
    return {
      scene: R.scene, camera: R.camera, ...peakGrade({ bloom: { strength: 1.25, threshold: 0.72 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        // all three ignited threads pulse together on the 16ths
        const pz = Math.exp(-((lt * 10) % 1) * 4);
        R.pose(lt, t, { snapAt: 0.0, extraFlare: { 6: 0.8 * pz, 7: 0.8 * pz } });
        const z = ease.expoOut(clamp((lt - 0.12) / 0.28));
        const x = lerp(40.6 + (R.lead[0] - 40.6) * 0.6, 22, z), h = lerp(160, 330, z), zc = lerp(-7, -20, z);
        const fov = lerp(W.FOV[85], W.FOV[35], z);
        camFX(R.camera, t, W.camTop(R.camera, x, h, zc, fov, 0));
      },
    };
  },
});
