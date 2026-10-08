// p-human-lit — MIRROR of ii-line-waits-2 (MASTER C: same humanUnderSetC set, same camHumanUnderTowerC framing, no handheld):
// the same tiny human under the same REVIEW mass, now lit amber and flowing, red pinpoints gone, warm rim instead of ice.
import { shot, beats, camFX } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
import { peakGrade } from './lib/b8-peak-end.js';

shot({
  id: 'p-human-lit', dur: beats(1, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 16, energy: 0.97, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.008 });
    const S = B.humanUnderSetC(scene, { reviewMax: 300, testMax: 170, state: 'lit', lit: 1 });
    return {
      scene, camera, ...peakGrade(),
      update(lt) {
        const t = ctx.shot.start + lt;
        S.update(lt, { t, review: 300, test: 165, red: 0, lit: 1, rim: W.C.amber, rimK: 2.4, poolK: 1.4, sky: 3, k: 1.9, body: 0.6 });
        camFX(camera, t, B.camHumanUnderTowerC(camera, lt, { dur: ctx.T, t, handheld: 0, x: -1.2, z0: 46, pitch: 26.5 }));
      },
    };
  },
});
