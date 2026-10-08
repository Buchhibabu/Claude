// 55 ii-jam-plan — backpressure 4: PLAN, the first station, goes red; the line is stopped end to end. LOW 24mm at the head of the
// line, PLAN dead centre: the jam's red hairline races up the conveyor from the right and hits the line's origin (x -70), PLAN's edges
// lock red with a strike-flicker, its queue slams in nose-to-tail and stops, two stop lamps lock on its front corners. Behind it the
// whole jammed line recedes to the right — red station edges, and the REVIEW / TEST / DEPLOY towers climbing out of frame with their
// pinpoints. Short push + lateral slide for parallax.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

shot({
  id: 'ii-jam-plan', dur: beats(1), act: 'II',
  music: { section: 'act2', chord: 'Bb', div: 32, energy: 0.86, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { fog: 0.0065 });
    ctx.sfx(0, 'boom', { gain: -6 });
    const H = W.hall(scene, { state: 'dark', parts: { towers: { review: 1200, test: 640, deploy: 240 }, banks: false } });
    const S = W.STATIONS[0];
    // PLAN's queue: dark slabs slamming in right -> left onto its top and stopping dead against the line head
    const NQ = 36, Q = W.boxes({ count: NQ, size: [3, 0.5, 2], color: 0x15171b, metal: 0.3, rough: 0.5, edgeW: 1.5, crowd: 0.6 }); scene.add(Q.mesh);
    const r = rand(5501);
    const slots = Array.from({ length: NQ }, (_, i) => {
      const lane = i % 3, k = Math.floor(i / 3);
      const x = -68.2 + k * 3.15 + (r() - 0.5) * 0.4;
      return { x, y: 3.25 + (r() < 0.25 ? 0.5 : 0), z: -2.6 + lane * 2.6 + (r() - 0.5) * 0.6, ry: (r() - 0.5) * 0.3, arrive: 0.02 + (x + 68.2) / 140 + r() * 0.02 };
    });
    // the red hairline on the conveyor + its racing head
    const hair = W.fat([[-30, 3.05, 5.15], [-70, 3.05, 5.15]], { color: W.C.red, k: 6, width: 2.6 }); scene.add(hair);
    const head = W.flare({ color: W.C.red, k: 0, size: 3.5 }); scene.add(head);
    const headO = W.orbs({ count: 1, r: 0.35, seg: 10 }); scene.add(headO.mesh);
    // stop lamps on PLAN's front corners + the line-head cap
    const L = W.orbs({ count: 3, r: 0.32, seg: 10 }); scene.add(L.mesh);
    const lampP = [[S.x0 + 0.9, 3.25, 5.15], [S.x1 - 0.9, 3.25, 5.15], [-70.4, 1.3, 0]];
    const capF = W.flare({ color: W.C.red, k: 0, size: 5 }); capF.position.set(-70.4, 1.3, 0); scene.add(capF);
    const ice = W.lin(W.C.ice, W.kl(1.7)), red = W.lin(W.C.red);
    const T_HIT = 2 / 30;                                  // the hairline reaches the line head at frame 2
    const flick = [0, 0, 1, 0.2, 1, 0.55, 1];               // PLAN's lock: strike flicker then hold
    const g = B.grade2({ vignette: 0.6 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const front = lerp(-38, -70, clamp(lt / T_HIT));
        hair.userData.reveal(clamp((-30 - front) / 40)); hair.userData.set(5.5 * (0.85 + 0.15 * Math.sin(t * 40)));
        const racing = lt < T_HIT;
        head.position.set(front, 3.1, 5.2); head.userData.set(racing ? 7 : 0, W.C.red);
        if (racing) headO.set(0, { p: [front, 3.1, 5.2], c: W.lin(0xff9a7a), k: 14 }); else headO.hide(0);
        headO.commit();
        const lock = B.frameTab(lt, flick);
        const dHit = lt - T_HIT;
        // PLAN edges red (others already red), stop lamps lock
        H.line.update(lt, { lit: 0, dim: 0.3, red: [lock, 1, 1, 1, 1, 1, 0.8] });
        lampP.forEach((p, i) => { if (lock < 0.1) { L.hide(i); return; } L.set(i, { p, c: red, k: (i === 2 ? 12 : 9) * lock * (1 + 1.4 * B.impulse(lt, T_HIT, 0.08)) }); });
        L.commit();
        capF.userData.set(dHit < 0 ? 0 : 3 + 6 * B.impulse(lt, T_HIT, 0.1), W.C.red);
        for (let i = 0; i < NQ; i++) {
          const s = slots[i];
          const u = clamp((lt + 0.05 - s.arrive) / 0.06);
          if (u <= 0) { Q.hide(i); continue; }
          Q.set(i, { p: [s.x + (1 - ease.out(u)) * 3.2, s.y, s.z], r: [0, s.ry, 0], edge: ice, body: [0, 0, 0] });
        }
        Q.commit();
        H.towers.update(lt, { review: 1200, test: 640, deploy: 240, t });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.red, rimK: 0.25 });
        H.extra.length = 0;
        H.extra.push({ p: [S.cx, 3.4, 5.4], c: W.C.red, k: 3.5 * lock, pool: 9, poolK: 1, refl: 1.2, size: 4 });
        H.extra.push({ p: [-70.4, 1.3, 0], c: W.C.red, k: dHit < 0 ? 0 : 4, pool: 4, poolK: 1, refl: 1.4, size: 0.6 });
        H.update(lt, { sky: 2.6 });
        // LOW 24mm, PLAN centred; 6% push + slide right (parallax against the receding line)
        const u = ease.out(clamp(lt / ctx.T));
        const tg = [S.cx + 3.2 + 1.5 * u, 4.2, 0];
        const p0 = [-81 + 2.6 * u, 0.85, 17.5 - 1.2 * u];
        W.camLook(camera, p0, tg, W.FOV[24], { roll: 2.5 });
        W.handheld(camera, t, 0.3, 55);
        camFX(camera, t, W.FOV[24]);
      },
    };
  },
});
