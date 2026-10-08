// 98 iii-pr-tower — PROOF 2 (40 stacked PRs, all green). LOW 24mm tilting up 10 deg, pos (0,1,18) -> (0,14,-10). Behind the 12 orbs,
// 40 stacked PR slabs (6 x 0.6 x 3, ivory) rise into a tower and flip green (#6EE7A0 k4) in a bottom-to-top cascade over 0.6 s until
// all 40 are green. CARRY: ONE SESSION DIRECTED A DOZEN. + STRIPE, cut out at local 0.5.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { THREE } = W;

const N = 40, PITCH = 0.98, BX = 0, BZ = -10;
shot({
  id: 'iii-pr-tower', dur: beats(2, 150), act: 'III',
  music: B.act3('C', 0.92),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'tick', { gain: -8 });
    ctx.sfx(0.1, 'chirps', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0042 });
    const H = B.litHall(scene, {});
    const S = B.STRIPE;
    const sess = W.glowMesh(new THREE.SphereGeometry(1, 28, 20), W.C.clay, 14, { radius: 1 }); sess.scale.setScalar(1.2); sess.position.set(...S.session); scene.add(sess);
    const Th = W.threads({ from: S.session, to: S.orbs, ctrl: S.ctrl, c0: W.C.clay, c1: W.C.ember, k: 2.4, width: 2.4 }); scene.add(Th.group);
    const O = W.agents({ count: 12, r: 0.62, seg: 16 }); scene.add(O.mesh);
    const PR = W.boxes({ count: N, size: [6, 0.6, 3], color: W.C.card, metal: 0.1, rough: 0.5, edgeW: 1.4, crowd: 0.4 }); scene.add(PR.mesh);
    const lamps = W.orbs({ count: N, r: 0.16, seg: 8 }); scene.add(lamps.mesh);
    const spine = W.glowSegs([[[BX - 3.4, 0, BZ + 1.7], [BX - 3.4, N * PITCH + 1, BZ + 1.7]], [[BX + 3.4, 0, BZ + 1.7], [BX + 3.4, N * PITCH + 1, BZ + 1.7]]], { color: W.C.brass, k: 1.2, width: 1.2 }); scene.add(spine);
    const q = new THREE.Quaternion(), e = new THREE.Euler();
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.0, radius: 0.45, threshold: 0.8 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        Th.update({ reveal: 1, k: 2.2 });
        S.orbs.forEach((p, j) => O.set(j, { p, c: W.lin(W.C.clay), k: 9 + 2 * W.beatPulse(t + j * 0.025, { bpm: 150, div: 4, decay: 6 }) }));
        O.commit();
        for (let i = 0; i < N; i++) {
          const rise = ease.out(clamp((lt - i * 0.0035) / 0.12));          // the stack builds upward in ~0.25 s
          const y = lerp(-1.5, 0.35 + i * PITCH, rise);
          const f = clamp((lt - (0.1 + i * 0.015)) / 0.06);                 // flip: bottom -> top, 0.1 .. 0.7
          q.setFromEuler(e.set(Math.PI * ease.inOut(f), 0, 0));
          PR.setQ(i, [BX, y, BZ], q, [1, 1, 1]);
          const g = f >= 0.5 ? 1 : 0;
          PR.color(i, g ? W.lin(W.C.green, W.kl(4) * 0.42) : W.lin(W.C.ivory, W.kl(1.6) * 0.45), g ? W.lin(W.C.green, 0.018) : W.lin(W.C.card, 0.03));
          if (g) lamps.set(i, { p: [BX + 2.55, y, BZ + 1.62], c: W.lin(W.C.green), k: 4 + 5 * Math.exp(-(lt - 0.13 - i * 0.015) * 10) }); else lamps.hide(i);
        }
        PR.commit(); lamps.commit();
        sess.userData.setGlow(14);
        B.litUpdate(H, lt, t, { foreman: 5, beam: 0.3 });
        H.extra.length = 0;
        H.extra.push({ p: S.session, c: W.C.clay, k: 10, pool: 7, poolK: 1.2, refl: 1.4, size: 1.2 });
        const nG = clamp((lt - 0.1) / 0.6) * N;
        H.extra.push({ p: [BX, Math.max(1, nG * PITCH * 0.5), BZ], c: W.C.green, k: 1.2 * clamp(nG / N), pool: 0, refl: 1.0, size: 3 });
        H.update(lt);
        const tilt = THREE.MathUtils.degToRad(10 * ease.inOut(clamp(lt / ctx.T)));
        const dz = -28, dy = 13; const base = Math.atan2(dy, -dz) + tilt; const D = Math.hypot(dz, dy);
        camFX(camera, t, W.camLook(camera, [0, 1, 18], [0, 1 + Math.sin(base) * D, 18 - Math.cos(base) * D], W.FOV[24]));
      },
    };
  },
  ui(root, tl, K, ctx) {
    B.proofCard(root, tl, K, { ...B.CARDS.stripe, enter: false, cutOut: 0.5, push: { d: 0.5, from: 1.025, to: 1.031 } });
  },
});
