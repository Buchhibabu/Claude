// p-human-lit — MIRROR of ii-line-waits-2 (camHumanUnderTower, identical): the same tiny human under the REVIEW tower,
// which is now lit amber and flowing L->R with green check lamps instead of red pinpoints; banks blazing overhead.
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade } from './lib/b8-peak-end.js';

shot({
  id: 'p-human-lit', dur: beats(1, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 16, energy: 0.97, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.008 });
    const H = W.hall(scene, { state: 'lit', parts: { towers: { review: 1200, test: 640 }, human: 'III' } });
    H.human.group.position.set(...W.POS.humanII);
    return {
      scene, camera, ...peakGrade(),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.towers.update(lt, { review: 600, test: 320, lit: 1, flow: 6, t });
        H.banks.update(lt, { on: 1, t });
        H.human.update(lt, { rimK: 3 });
        H.foreman.update(lt, { lit: 6 });
        H.update(lt, { lit: 1 });
        camFX(camera, t, W.camHumanUnderTower(camera, lt, { dur: ctx.T }));
      },
    };
  },
});
