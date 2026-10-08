// 96 iii-teams-b — PROOF 1 (second structure). LOW PROFILE 24mm, pos (0,1.5,30) -> (0,4,0). The SAME 100 orbs re-snap flat into one
// even 10x10 sheet (the knowledge-base structure): no leads, no tethers. CARRY: the 100-AGENT TEAMS card + SYSTEM CARD stay in place;
// cut out at local 1.4.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

shot({
  id: 'iii-teams-b', dur: beats(4, 150), act: 'III',
  music: B.act3('F', 0.9),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -6 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0045 });
    const H = B.litHall(scene, {});
    const T = B.TEAM;
    const O = W.agents({ count: 100, r: 0.42, seg: 14 }); scene.add(O.mesh);
    // even lattice hairlines (rows + columns) that draw in as the sheet locks
    const grid = [];
    for (let r = 0; r < 10; r++) { const a = T.sheet(r * 10), b = T.sheet(r * 10 + 9); grid.push([a, b]); }
    for (let c = 0; c < 10; c++) { const a = T.sheet(c), b = T.sheet(90 + c); grid.push([a, b]); }
    const lattice = W.glowSegs(grid, { color: W.C.clay, k: 0, width: 1.0 }); scene.add(lattice);
    const trails = W.agents({ count: 300, r: 0.2, seg: 6 }); scene.add(trails.mesh);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.15, radius: 0.5, threshold: 0.75 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const u = B.snap(clamp(lt / 0.2));
        const v = ease.out(clamp(lt / 0.2));
        for (let i = 0; i < 100; i++) {
          const c = T.cluster(i, 2.0), s = T.sheet(i);
          const p = [lerp(c[0], s[0], u), lerp(c[1], s[1], u), lerp(c[2], s[2], u)];
          const pulse = 1 + 0.25 * W.beatPulse(t + ((i % 10) + Math.floor(i / 10)) * 0.02, { bpm: 150, div: 2, decay: 6 });
          O.set(i, { p, s: lerp(T.cl[i].isLead ? 1.5 : 0.85, 1.0, v), c: W.lin(W.C.clay), k: lerp(T.cl[i].isLead ? 10 : 5, 6.5, v) * pulse });
          for (let k = 0; k < 3; k++) {   // motion streaks during the re-snap
            const uu = B.snap(clamp((lt - (k + 1) * 0.025) / 0.2));
            if (lt > 0.32) { trails.hide(i * 3 + k); continue; }
            trails.set(i * 3 + k, { p: [lerp(c[0], s[0], uu), lerp(c[1], s[1], uu), lerp(c[2], s[2], uu)], s: 1 - k * 0.25, c: W.lin(W.C.ember), k: 3 * (1 - k / 3) });
          }
        }
        O.commit(); trails.commit();
        lattice.userData.set(1.1 * clamp((lt - 0.2) / 0.25));
        B.litUpdate(H, lt, t, { foreman: 5, beam: 0.35 });
        H.extra.length = 0; H.extra.push({ p: [0, 10, -3], c: W.C.clay, k: 6, pool: 0, refl: 1.4, size: 7 });
        H.update(lt);
        const d = 1 - 0.02 * clamp(lt / ctx.T);
        camFX(camera, t, W.camLook(camera, [0, 1.5, 30 * d], [0, 4, 0], W.FOV[24]));
      },
    };
  },
  ui(root, tl, K, ctx) {
    B.proofCard(root, tl, K, { ...B.CARDS.teams, enter: false, cutOut: 1.4, push: { d: 1.4, from: 1.025, to: 1.0425 } });
  },
});
