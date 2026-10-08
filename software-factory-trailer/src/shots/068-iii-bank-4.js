// iii-bank-4 — LOW 24mm under REVIEW: bank 4 ignites and its light pours over the stalled card tower; a wave flips the cards' edges
// ice -> amber from the beam level outward (hot leading edge). The TEST tower beyond is still cold. No red anywhere.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';

shot({
  id: 'iii-bank-4', dur: beats(1, 150), act: 'III',
  music: { section: 'turn', chord: 'Bb', div: 8, energy: 0.7, add: ['strings', 'pulse', 'kick', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'boom', { gain: -1 });
    const { scene, camera } = B.cascadeStage(4);
    const H = W.hall(scene, { state: 'dark', parts: { towers: { review: 300, test: 320 } } });
    const REV = 300;
    const ice = W.CARD.edge(), iceB = W.CARD.body();
    const grade = W.bankGrade(4);
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      const on = B.cascade(H, 4, lt, t);
      H.towers.update(lt, { review: REV, test: 260, lit: 0, red: 0, t });
      const I = H.towers.I;
      const front = 240 * Math.max(0, lt + B.F);   // u of tower swept per second from the beam level (y 55)
      for (let i = 0; i < REV; i++) {
        const y = 3.25 + i * 0.5, d = Math.abs(y - 55);
        const w = clamp((front - d) / 10);
        const hot = Math.exp(-Math.pow((front - d) / 5, 2)) * (front > 0 ? 1 : 0);
        const e = W.CARD.amberEdge(lerp(1, 3.2, w) + 6 * hot), b = W.CARD.amberBody(2.5 + 6 * hot);
        I.color(i, [lerp(ice[0], e[0], Math.max(w, hot)), lerp(ice[1], e[1], Math.max(w, hot)), lerp(ice[2], e[2], Math.max(w, hot))], [lerp(iceB[0], b[0], w), lerp(iceB[1], b[1], w), lerp(iceB[2], b[2], w)]);
      }
      I.commit();
      H.foreman.update(lt, { lit: 0 });
      H.update(lt, { lit: B.hallLit(4, on), sky: 0.5 });
      const u = ease.out(clamp(lt / ctx.T)) * 0.04;
      const P = [-20, 1, 30], Tg = [-10, 30, 0];
      camFX(camera, t, W.camLook(camera, [lerp(P[0], Tg[0], u), lerp(P[1], Tg[1], u), lerp(P[2], Tg[2], u)], Tg, W.FOV[24]));
    } };
  },
});
