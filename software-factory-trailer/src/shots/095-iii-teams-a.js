// 95 iii-teams-a — PROOF 1 (structure). HIGH -70 deg 35mm, pos (0,60,22) -> (0,0,0), slow orbit 10 deg/s. Exactly 100 clay orbs
// (an Opus 5.5 team) start as noise and on the hit snap (6 f) into 12 sub-lead clusters: 12 brighter leads, each ringed by 7 workers
// (the 4 left over join 4 clusters) — the structure the team picked for proofs.
// Card: 100-AGENT TEAMS PICKED THEIR OWN STRUCTURE. / SYSTEM CARD (carries into iii-teams-b).
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { THREE } = W;

shot({
  id: 'iii-teams-a', dur: beats(5, 150), act: 'III',
  music: B.act3('F', 0.9),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'A');
    ctx.sfx(0, 'impact', { gain: -2 });
    ctx.sfx(0, 'chirps', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.006 });
    const H = B.litHall(scene, { line: false, banks: false, foreman: false });
    const T = B.TEAM;
    const O = W.agents({ count: 100, r: 0.42, seg: 14 }); scene.add(O.mesh);
    // worker -> lead tethers (88) + a faint ring through the 12 leads
    const tether = W.glowSegs(Array.from({ length: 88 }, () => [[0, -50, 0], [0, -50, 0.01]]), { color: W.C.clay, k: 1.4, width: 1.1 });
    scene.add(tether);
    const ringPts = Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * Math.PI * 2; return [T.ring.c[0] + Math.sin(a) * T.ring.R, T.ring.c[1] + 0.6, T.ring.c[2] + Math.cos(a) * T.ring.R * 0.78]; });
    const ring = W.fat(ringPts, { color: W.C.ember, k: 0.9, width: 1.2 }); scene.add(ring);
    const pads = Array.from({ length: 12 }, (_, j) => { const r = W.G.ring({ r: 2.9, tube: 0.05, color: W.C.brass, k: W.kl(1.4) }); r.rotation.x = Math.PI / 2; const p = T.leadPos(j); r.position.set(p[0], 0.06, p[2]); scene.add(r); return r; });
    const tg = tether.geometry;
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.15, radius: 0.5, threshold: 0.75 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const u = B.snap(clamp(lt / 0.2));                 // 6 f snap from noise
        const pos = [];
        for (let i = 0; i < 100; i++) {
          const n = T.noise[i], c = T.cluster(i, lt);
          const jit = (1 - u) * 0.6;
          const p = [lerp(n[0], c[0], u) + Math.sin(t * 7 + i) * jit, lerp(n[1], c[1], u), lerp(n[2], c[2], u) + Math.cos(t * 6 + i) * jit];
          pos.push(p);
          const lead = T.cl[i].isLead;
          const pulse = lead ? 1 + 0.35 * W.beatPulse(t + (i % 12) * 0.033, { bpm: 150, div: 4, decay: 5 }) : 1;
          O.set(i, { p, s: lead ? 1.5 : 0.85, c: W.lin(W.C.clay), k: (lead ? 10 : 5) * pulse });
        }
        O.commit();
        const seg = []; let q = 0;
        for (let i = 12; i < 100; i++) { const L = pos[T.leadIdx[T.cl[i].j]], p = pos[i]; seg.push(L[0], L[1], L[2], p[0], p[1], p[2]); q++; }
        tg.setPositions(seg);
        tether.userData.set(1.4 * clamp((lt - 0.18) / 0.15));
        ring.userData.reveal(clamp((lt - 0.25) / 0.5)); ring.userData.set(0.9);
        pads.forEach((r) => { r.visible = u > 0.9; });
        H.extra.length = 0;
        for (let j = 0; j < 12; j += 2) { const p = T.leadPos(j); H.extra.push({ p: [p[0], 2, p[2]], c: W.C.clay, k: 4 * u, pool: 4, poolK: 1, refl: 0.6, size: 1 }); }
        H.update(lt);
        const a = THREE.MathUtils.degToRad(-10 + 10 * lt);  // 10 deg/s orbit about the target
        const R = Math.hypot(60, 22), el = Math.atan2(60, 22);
        const ch = R * Math.cos(el);
        camFX(camera, t, W.camLook(camera, [Math.sin(a) * ch, 60, Math.cos(a) * ch], [0, 0, 0], W.FOV[35]));
      },
    };
  },
  ui(root, tl, K, ctx) {
    B.proofCard(root, tl, K, { ...B.CARDS.teams, enter: true, push: { d: ctx.T, from: 1, to: 1.025 } });
  },
});
