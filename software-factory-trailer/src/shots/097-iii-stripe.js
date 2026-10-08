// 97 iii-stripe — PROOF 2 (one session -> a dozen). LOW ANGLE 24mm, pos (0,2,26) -> (0,10,0), centred, 3% push. One clay session orb
// (r1.2, k14) sends exactly 12 clay threads to exactly 12 clay orbs on an arc; each thread pulses once on 16ths as it connects.
// Card: ONE SESSION DIRECTED A DOZEN. / STRIPE (carries into iii-pr-tower).
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

const S16 = 0.1;   // a 16th at 150 BPM
shot({
  id: 'iii-stripe', dur: beats(5, 150), act: 'III',
  music: B.act3('C', 0.92),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'A');
    ctx.sfx(0, 'impact', { gain: -2 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0042 });
    const H = B.litHall(scene, {});
    const S = B.STRIPE;
    const sess = W.glowMesh(new W.THREE.SphereGeometry(1, 28, 20), W.C.clay, 14, { radius: 1 }); sess.scale.setScalar(1.2); sess.position.set(...S.session); scene.add(sess);
    const sessFl = W.flare({ color: W.C.ember, k: 4, size: 9 }); sessFl.position.set(...S.session); scene.add(sessFl);
    const halo = W.G.ring({ r: 2.1, tube: 0.04, color: W.C.ember, k: W.kl(3) }); halo.position.set(...S.session); scene.add(halo);
    const Th = W.threads({ from: S.session, to: S.orbs, ctrl: S.ctrl, c0: W.C.clay, c1: W.C.ember, k: 2.6, width: 2.4 }); scene.add(Th.group);
    const O = W.agents({ count: 12, r: 0.62, seg: 16 }); scene.add(O.mesh);
    const P = W.agents({ count: 12, r: 0.28, seg: 8 }); scene.add(P.mesh);   // the connect pulse riding each thread
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.2, radius: 0.5, threshold: 0.75 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const conn = S.orbs.map((_, j) => S16 * (j + 1));                  // thread j connects on 16th j+1
        const reveal = conn.map((c) => clamp((lt - (c - 0.14)) / 0.14));   // each thread draws in over 0.14 s, landing on its 16th
        const fl = conn.map((c) => (lt >= c ? 2.2 * Math.exp(-(lt - c) * 9) : 0));
        Th.update({ reveal, k: 2.4, flare: fl });
        S.orbs.forEach((p, j) => {
          const on = lt >= conn[j] ? 1 : 0.0;
          O.set(j, { p, c: W.lin(W.C.clay), k: on ? 10 * (1 + 0.8 * Math.exp(-(lt - conn[j]) * 8)) : 0.6 });
          const r = reveal[j];
          if (r > 0 && r < 1) { const q = Th.curves[j].getPoint(r); P.set(j, { p: [q.x, q.y, q.z], c: W.lin(W.C.ivory), k: 12 }); } else P.hide(j);
        });
        O.commit(); P.commit();
        const beat = W.beatPulse(t, { bpm: 150, div: 1, decay: 5 });
        sess.userData.setGlow(14 * (1 + 0.15 * beat)); halo.scale.setScalar(1 + 0.15 * beat);
        B.litUpdate(H, lt, t, { foreman: 5, beam: 0.3 });
        H.extra.length = 0; H.extra.push({ p: S.session, c: W.C.clay, k: 10, pool: 7, poolK: 1.2, refl: 1.4, size: 1.2 });
        H.update(lt);
        const d = 1 - 0.03 * clamp(lt / ctx.T);
        camFX(camera, t, W.camLook(camera, [0, 2, 26 * d], [0, 10, 0], W.FOV[24]));
      },
    };
  },
  ui(root, tl, K, ctx) {
    B.proofCard(root, tl, K, { ...B.CARDS.stripe, enter: true, push: { d: ctx.T, from: 1, to: 1.025 } });
  },
});
