// iii-bank-5 — SIDE 24mm lateral track L->R: bank 5 ignites over TEST; a scan line rises through the TEST station and up its card
// tower, building it solid amber below the line (wireframe ice above). Foreground pillars slide for parallax.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';

shot({
  id: 'iii-bank-5', dur: beats(1, 150), act: 'III',
  music: { section: 'turn', chord: 'Bb', div: 8, energy: 0.73, add: ['strings', 'pulse', 'kick', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'boom', { gain: 0 });
    const { scene, camera } = B.cascadeStage(5);
    const H = W.hall(scene, { state: 'dark', parts: { towers: { review: 300, test: 320 } } });
    const TS = W.STATIONS[W.ST.TEST];
    const scanL = W.glowSegs([[[TS.x0 - 1, 0, 6], [TS.x1 + 1, 0, 6]], [[TS.x0 - 1, 0, -6], [TS.x1 + 1, 0, -6]], [[19, 0, 1.6], [23, 0, 1.6]]], { color: W.C.amber, k: 8, width: 3 });
    scene.add(scanL);
    const fl = W.flare({ color: W.C.amber, k: 0, size: 7 }); scene.add(fl);
    const REV = 300, TST = 320;
    const ice = W.CARD.edge(), iceB = W.CARD.body();
    const grade = W.bankGrade(5);
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      const ys = 0.1 + 58 * Math.pow(clamp((lt + B.F) / 0.42), 1.35);           // scan height (u)
      const on = B.cascade(H, 5, lt, t, { scan: [1, 1, 1, 1, clamp(ys / 3), 1, 1], beam: 0.6 });
      H.towers.update(lt, { review: REV, test: TST, lit: 0, red: 0, t });
      const I = H.towers.I;
      const am = W.CARD.amberEdge(3), amB = W.CARD.amberBody(2.5);
      for (let i = 0; i < REV; i++) I.color(i, am, amB);   // REVIEW already flipped by bank 4
      for (let i = 0; i < TST; i++) {
        const y = 3.25 + i * 0.5; const dz = ys - y;
        const w = clamp(dz / 1.5), hot = Math.exp(-dz * dz / 4);
        const e = W.CARD.amberEdge(3 + 8 * hot);
        I.color(REV + i, [lerp(ice[0], e[0], Math.max(w, hot)), lerp(ice[1], e[1], Math.max(w, hot)), lerp(ice[2], e[2], Math.max(w, hot))], w > 0 ? amB : iceB);
      }
      I.commit();
      scanL.position.y = ys; scanL.visible = ys < 175; scanL.userData.set(9);
      fl.position.set(21, ys, 7); fl.userData.set(1.4, W.C.amber);
      H.foreman.group.visible = false;
      H.update(lt, { lit: B.hallLit(5, on), sky: 0.3 });
      const x = 10 + 10 * lt;
      camFX(camera, t, W.camLook(camera, [x, 20, 89], [x, 20, 0], W.FOV[24]));   // z 89: a camera exactly over the floor's z=90 edge mis-clips the floor
    } };
  },
});
