// iii-bank-8 — SIDE 24mm lateral track L->R along the hall: bank 8 at the far end slams on; the cascade has run the length of the hall
// (a colonnade of lit beams). On the last 8th the frame breathes in (pre-hit dip) before the turn.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';

shot({
  id: 'iii-bank-8', dur: beats(1, 150), act: 'III',
  music: { section: 'turn', chord: 'Bb', div: 8, energy: 0.82, add: ['strings', 'pulse', 'kick', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'boom', { gain: 0 });
    const { scene, camera } = B.cascadeStage(8);
    const H = W.hall(scene, { state: 'dark', parts: { towers: { review: 300, test: 320 } } });
    const grade = W.bankGrade(8);
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      const on = B.cascade(H, 8, lt, t, { beam: 0.8 });
      H.towers.update(lt, { review: 300, test: 320, lit: 1, t, flow: 6 });
      H.foreman.group.visible = false;
      H.update(lt, { lit: B.hallLit(8, on), sky: 0.3 });
      grade.exposure = lerp(1.0, 0.72, ease.in(clamp((lt - 0.2) / 0.2)));   // pre-hit dip on the last 8th
      const x = 40 + 20 * lt;
      camFX(camera, t, W.camLook(camera, [x, 25, 110], [x, 30, 0], W.FOV[24]));
    } };
  },
});
