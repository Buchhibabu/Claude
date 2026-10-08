// 52 ii-jam-deploy — ACCELERANDO tier 1, backpressure 1. Worm's-eye 18mm under the DEPLOY tower: on the hit every DEPLOY stop lamp
// LOCKS red (a seizure climbing the tower bottom -> top), and the jammed queue stacks back along the conveyor into the TEST lane while
// the TEST and REVIEW towers converge overhead. Push 10%.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

shot({
  id: 'ii-jam-deploy', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 16, energy: 0.8, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { fog: 0.006 });
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'boom', { gain: -4 });
    const H = W.hall(scene, { state: 'dark', parts: { towers: { review: 1200, test: 640, deploy: 240 } } });
    const D = W.deployMaze({}); scene.add(D.group);
    const pins = B.towerPins({ base: W.POS.deployBase, height: 120, every: 1.6, seed: 52, r: 0.3 }); scene.add(pins.mesh);
    // the queue: dark card slabs jammed nose-to-tail on the conveyor tops from DEPLOY back into the TEST lane, a jagged ridge that
    // steps down upstream; it builds right -> left (the jam travelling upstream) and its stop lamps lock red with the tower
    const NQ = 150, Q = W.boxes({ count: NQ, size: [3, 0.5, 2], color: 0x15171b, metal: 0.3, rough: 0.5, edgeW: 1.5, crowd: 0.6 }); scene.add(Q.mesh);
    const r = rand(5252);
    const slots = [];
    for (let col = 0; col < 15 && slots.length < NQ; col++) {
      const nL = Math.max(1, Math.round(11 - col * 0.6 + (r() - 0.5) * 2));
      for (let l = 0; l < nL && slots.length < NQ; l++) {
        const x = 48.5 - col * 1.95 + (r() - 0.5) * 0.5;
        slots.push({ x, y: 3.25 + l * 0.5, z: 3.4 + (r() - 0.5) * 1.4, ry: (r() - 0.5) * 0.4, rz: (r() - 0.5) * 0.1, arrive: col * 0.045 + l * 0.01 + r() * 0.03 });
      }
    }
    const NL = 9, L = W.orbs({ count: NL, r: 0.3, seg: 10 }); scene.add(L.mesh);
    const lampP = Array.from({ length: NL }, (_, i) => { const col = i * 1.6; return [48.5 - col * 1.95, 3.25 + Math.max(1, 11 - col * 0.6) * 0.5 + 0.35, 4.5]; });
    const qEdge = W.lin(W.C.ice, W.kl(1.7)), qBody = [0, 0, 0];
    const g = B.grade2({ vignette: 0.6 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const lock = clamp(lt / 0.02);
        const lockY = 2 + 124 * ease.inOut(clamp(lt / 0.5));   // the lock climbs the tower bottom -> top in 15 f
        H.towers.update(lt, { review: 1200, test: 640, deploy: 240, t, red: 1 });
        pins.update(t, { k: 5, lockY, lockK: 10 });
        D.update(lt, { cards: 400, t });
        D.strips.forEach((s, i) => { const lp = s.alongX ? [s.x + s.L / 2 + 0.5, 0.6, s.z] : [s.x, 0.6, s.z + s.L / 2 + 0.5]; D.lamps.set(i, { p: lp, c: W.lin(W.C.red), k: 9 * lock + 0.5 }); });
        D.lamps.commit();
        for (let i = 0; i < NQ; i++) {
          const s = slots[i];
          if (!s) { Q.hide(i); continue; }
          const u = clamp((lt + 0.18 - s.arrive) / 0.07);
          if (u <= 0) { Q.hide(i); continue; }
          const slide = (1 - ease.out(u)) * 3.5;     // slams in from the right (downstream) and stops dead
          Q.set(i, { p: [s.x + slide, s.y, s.z], r: [0, s.ry, s.rz], edge: qEdge, body: qBody });
        }
        Q.commit();
        lampP.forEach((p, i) => { const arr = i * 1.6 * 0.045 + 0.07 - 0.18; if (lt < arr) { L.hide(i); return; } L.set(i, { p, c: W.lin(W.C.red), k: 9 * (1 + 1.2 * B.impulse(lt, arr, 0.1)) }); });
        L.commit();
        H.line.update(lt, { lit: 0, red: [0, 0, 0.3, 1, 1, 0.4 + 0.6 * lock, 0.2] });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.red, rimK: 0.08 });
        H.extra.length = 0;
        H.extra.push({ p: [40.6, 6, 2], c: W.C.red, k: 4 * lock, pool: 9, poolK: 1, refl: 0.8, size: 1 });
        H.update(lt, { sky: 2.5 });
        const p0 = [36, 0.5, 14], tg = [40.6, 16.5, 0];
        const u = 0.1 * ease.out(clamp(lt / ctx.T));
        W.camLook(camera, [lerp(p0[0], tg[0], u), lerp(p0[1], tg[1], u), lerp(p0[2], tg[2], u)], tg, W.FOV[18], { roll: 4 });
        W.handheld(camera, t, 0.3, 8);
        camFX(camera, t, W.FOV[18]);
      },
    };
  },
});
