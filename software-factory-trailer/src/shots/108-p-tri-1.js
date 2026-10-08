// p-tri-1 — wordless tricolon 1: straight down (85mm) over REVIEW; REVIEW's sub-lead ignites clay with a shockwave and its
// thread snaps taut (core -> node in 2 frames); its sub-flows pour into the station below.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade, triRig } from './lib/b8-peak-end.js';

shot({
  id: 'p-tri-1', dur: beats(1, 150), act: 'III',
  music: { section: 'peak', chord: 'Bb', div: 16, energy: 0.98, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'boom', { gain: -2 });
    const R = triRig(ctx, { j: 6, level: 1 });
    return {
      scene: R.scene, camera: R.camera, ...peakGrade({ bloom: { strength: 1.15, threshold: 0.74 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        R.pose(lt, t, { snapAt: 0.0 });
        const u = ease.out(clamp(lt / ctx.T));
        camFX(R.camera, t, W.camTop(R.camera, 1.4 + (R.lead[0] - 1.4) * 0.6, lerp(160, 152, u), -7, W.FOV[85], 0));
      },
    };
  },
});
