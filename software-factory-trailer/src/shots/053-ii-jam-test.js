// 53 ii-jam-test — backpressure 2. Static 85mm top-down at (16,160,0): the TEST queue spills back over REVIEW (cards slamming in
// right -> left, nose to tail, overflowing the station tops), a red hairline on the conveyor creeps upstream (-x at 20 u/s) ahead of
// the spill; the toppled REVIEW tower's debris fans out toward +z, its base already re-piling; the TEST tower plunges at the lens.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

shot({
  id: 'ii-jam-test', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 16, energy: 0.82, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { near: 1 });
    ctx.sfx(0, 'boom', { gain: -4 });
    ctx.sfx(0, 'riser', { dur: 6.0, gain: -4 });
    const H = W.hall(scene, { state: 'dark', parts: { towers: { review: 400, test: 640 }, banks: false, pillars: false, foreman: false } });
    const deb = B.debris({ count: 260, origin: [1.4, 3], len: 44, spread: 0.6, seed: 5353 }); scene.add(deb.mesh);
    // the spill: cards jamming nose-to-tail over TEST, then REVIEW, then the gap toward CODE
    const NQ = 420, Q = W.boxes({ count: NQ, size: [3, 0.5, 2], color: 0x16181c, metal: 0.3, rough: 0.5, edgeW: 1.4, crowd: 0.5 }); scene.add(Q.mesh);
    const r = rand(5354);
    const slots = Array.from({ length: NQ }, (_, i) => {
      const lane = i % 6, k = Math.floor(i / 6);
      const x = 30 - k * 1.35 - lane * 0.35 + (r() - 0.5) * 0.5;
      const edge = lane === 0 || lane === 5;                 // outer lanes overflow the station edges and spill to the floor
      const z = edge ? (lane ? 1 : -1) * (5.6 + r() * 2.2) : -3.6 + (lane - 1) * 2.4 + (r() - 0.5) * 0.9;
      const onTop = !edge && !(x < -8.4) && Math.abs(x - 11) > 0.6;
      const y = onTop ? 3.25 + Math.floor(r() * 2.2) * 0.5 : 0.25 + (edge ? r() * 1.2 : 0);
      return { x, y, z, ry: (r() - 0.5) * (edge ? 1.4 : 0.5), rx: edge ? (r() - 0.5) * 0.8 : 0, arrive: (30 - x) / 20 + (edge ? 0.08 : 0) };   // the jam front moves upstream at 20 u/s
    });
    const hair = W.fat([[30, 4.9, 0], [-12, 4.9, 0]], { color: W.C.red, k: 6, width: 2.4 }); scene.add(hair);
    const head = W.flare({ color: W.C.red, k: 0, size: 3 }); scene.add(head);
    const headO = W.orbs({ count: 1, r: 0.4, seg: 10 }); scene.add(headO.mesh);
    const ice = W.lin(W.C.ice, W.kl(1.6));
    const g = B.grade2({ vignette: 0.6 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        scene.fog.density = W.fogKeep(160, 0.85);
        const front = 30 - 20 * (lt + 0.55);            // the red hairline's head (x), creeping -x at 20 u/s
        hair.userData.reveal(clamp((30 - front) / 42)); hair.userData.set(5 * (0.85 + 0.15 * Math.sin(t * 40)));
        head.position.set(front, 5, 0); head.userData.set(6, W.C.red);
        headO.set(0, { p: [front, 5, 0], c: W.lin(0xff9a7a), k: 12 }); headO.commit();
        for (let i = 0; i < NQ; i++) {
          const s = slots[i];
          const u = clamp((lt + 0.55 - s.arrive) / 0.06);
          if (u <= 0) { Q.hide(i); continue; }
          Q.set(i, { p: [s.x + (1 - ease.out(u)) * 2.5, s.y, s.z], r: [s.rx, s.ry, 0], edge: ice, body: [0, 0, 0] });
        }
        Q.commit();
        // REVIEW re-piling (16ths), TEST standing; pinpoints blink
        H.towers.update(lt, { review: 90 + 60 * lt, test: 110, t });   // TEST capped here: its upper 265u would sit beside the lens (out of frame anyway)
        const redSt = W.STATIONS.map((s) => clamp((s.x1 - front) / 6));
        H.line.update(lt, { lit: 0, dim: 0.3, red: redSt.map((v, i) => (i >= 3 ? v : v * 0.6)) });
        H.extra.length = 0;
        H.extra.push({ p: [front, 3.6, 0], c: W.C.red, k: 4, pool: 5, poolK: 1, refl: 0, size: 1 });
        H.update(lt);
        const fov = W.camTop(camera, 16, 160, 0, W.FOV[85]);
        W.handheld(camera, t, 0.12, 9);
        camFX(camera, t, fov);
      },
    };
  },
});
