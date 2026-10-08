// iii-bank-6 — TOP-DOWN 135mm over the DEPLOY maze: bank 6 ignites; the red stop lamps go dark one by one (then answer green) and the
// maze's conveyor strips light amber with the cards starting to flow L->R.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';

shot({
  id: 'iii-bank-6', dur: beats(1, 150), act: 'III',
  music: { section: 'turn', chord: 'Bb', div: 8, energy: 0.76, add: ['strings', 'pulse', 'kick', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'boom', { gain: 0 });
    const { scene, camera } = B.cascadeStage(6, { fog: W.fogKeep(300, 0.9) });
    const H = W.hall(scene, { state: 'dark', parts: { pillars: false } });
    const D = W.deployMaze({}); scene.add(D.group);
    const rig = B.bankRig({ width: 1.2 }); scene.add(rig.group);
    const pool = B.warmPool({ w: 30, d: 30, color: W.C.amber, k: 0, soft: 0.5 }); pool.position.x = 40.6; scene.add(pool);
    // order the lamps by x (L->R) so they go dark one by one across the maze
    const order = D.strips.map((s, i) => [s.alongX ? s.x + s.L / 2 : s.x, i]).sort((a, b) => a[0] - b[0]).map((a) => a[1]);
    const rank = []; order.forEach((i, r) => { rank[i] = r; });
    const grade = W.bankGrade(6);
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      const on = B.cascade(H, 6, lt, t, { housing: false, beam: 0.3 });
      rig.update(on, { kOn: 0.9, kOff: 0.15 });
      pool.userData.set(0.05 * on[5] * (1 + 1.5 * Math.exp(-lt * 12)));
      const flowLit = clamp((lt - 0.05) / 0.25);
      D.update(lt, { cards: 400, lit: flowLit, t: t - 78.5, flow: 6 });
      D.strips.forEach((s, i) => {
        const li = clamp((lt + B.F - rank[i] * 0.018) / 0.06);
        D.S.set(i, { p: [s.x, 0.05, s.z], s: s.alongX ? [s.L, 0.1, 0.4] : [0.4, 0.1, s.L], edge: W.lin(W.C.amber, W.kl(lerp(0.4, 3.2, li))), body: W.lin(W.C.amber, lerp(0.0, 0.3, li)) });
        const lp = s.alongX ? [s.x + s.L / 2 + 0.5, 0.6, s.z] : [s.x, 0.6, s.z + s.L / 2 + 0.5];
        const off = lt + B.F - rank[i] * 0.018;               // red lamp dies, then a green check answers 4 f later
        if (off < 0) D.lamps.set(i, { p: lp, c: W.lin(W.C.red), k: 8 * W.blink(t, { bpm: 150, div: 2 }) + 0.5 });
        else if (off < 0.12) D.lamps.hide(i);
        else D.lamps.set(i, { p: lp, c: W.lin(W.C.green), k: 4 * clamp((off - 0.12) / 0.05) });
      });
      D.S.commit(); D.lamps.commit();
      H.foreman.update(lt, { lit: 0 });
      H.update(lt, { lit: B.hallLit(6, on), sky: 0.4 });
      camFX(camera, t, W.camTop(camera, 40.6, 300 - 6 * lt, 0, W.FOV[135]));
    } };
  },
});
