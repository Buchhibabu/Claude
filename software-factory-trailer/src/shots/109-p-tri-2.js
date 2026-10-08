// p-tri-2 — tricolon 2: straight down over TEST; TEST's sub-lead ignites, brighter (REVIEW's stays lit).
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade, triRig } from './lib/b8-peak-end.js';

shot({
  id: 'p-tri-2', dur: beats(1, 150), act: 'III',
  music: { section: 'peak', chord: 'C', div: 16, energy: 0.99, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'boom', { gain: -1 });
    ctx.sfx(0, 'impact', { gain: -4 });
    const R = triRig(ctx, { j: 7, level: 2, others: [6] });
    return {
      scene: R.scene, camera: R.camera, ...peakGrade({ bloom: { strength: 1.2, threshold: 0.73 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        R.pose(lt, t, { snapAt: 0.0 });
        const u = ease.out(clamp(lt / ctx.T));
        camFX(R.camera, t, W.camTop(R.camera, 21 + (R.lead[0] - 21) * 0.6, lerp(160, 150, u), -7, W.FOV[85], 0));
      },
    };
  },
});
