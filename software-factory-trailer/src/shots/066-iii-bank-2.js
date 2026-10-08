// iii-bank-2 — top-down 50mm over DESIGN: bank 2 ignites; a rectangular warm pool lands on the station, its outline traces amber and
// the wireframe-to-solid scan rises. PLAN (left) already lit, CODE (right) still dark: the cascade reads L->R.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';

shot({
  id: 'iii-bank-2', dur: beats(1, 150), act: 'III',
  music: { section: 'turn', chord: 'Bb', div: 8, energy: 0.6399999999999999, add: ['strings', 'pulse', 'kick', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'boom', { gain: -2 });
    const { scene, camera } = B.cascadeStage(2, { fog: W.fogKeep(120, 0.88) });
    const H = W.hall(scene, { state: 'dark', parts: { pillars: false } });
    const pools = [0, 1].map((s) => { const p = B.warmPool({ w: W.STATIONS[s].w + 4, d: 15, color: W.C.amber, k: 0, soft: 0.45 }); p.position.x = W.STATIONS[s].cx; scene.add(p); return p; });
    const trace = B.stationTrace(W.ST.DESIGN, { k: 5, width: 2.6 }); scene.add(trace);
    const grade = W.bankGrade(2);
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      const scan = [1, ease.out(clamp((lt + B.F) / 0.2)), 1, 1, 1, 1, 1];
      const on = B.cascade(H, 2, lt, t, { scan, housing: false, beam: 0.35 });
      pools[0].userData.set(0.07);
      pools[1].userData.set(0.09 * on[1] * (1 + 1.2 * Math.exp(-lt * 14)));
      trace.userData.reveal(ease.out(clamp((lt + B.F) / 0.2)));
      trace.userData.set(lerp(7, 2.5, clamp(lt / 0.3)));
      H.foreman.update(lt, { lit: 0 });
      H.update(lt, { lit: B.hallLit(2, on), sky: 0.4 });
      camFX(camera, t, W.camTop(camera, -50, 120 - 4 * lt, 0, W.FOV[50]));
    } };
  },
});
