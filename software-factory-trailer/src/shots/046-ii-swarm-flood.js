// 46 ii-swarm-flood — collisions. Low 24mm at y 1 (Dutch +10): the flat swarm floods across the floor straight at the lens and
// past it, ice orbs dragging streaks; where they collide they flash red and throw red sparks (40 per second). Behind them the doubled
// towers stand red-pinned in the fog.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-swarm-flood', dur: beats(1), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 16, energy: 0.74, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'whoosh', { gain: -6 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.009 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false } });
    const rev = B.towerMass({ name: 'review', nx: 5, nz: 3, maxH: 600, seed: 3, bundle: 16, pinsPerLevel: 3, pinEvery: 8 });
    const test = B.towerMass({ name: 'test', nx: 3, nz: 3, maxH: 320, seed: 5, bundle: 16, pinsPerLevel: 2, pinEvery: 8 });
    scene.add(rev.group, test.group);
    // the flood: 700 orbs on a wide front racing +z toward the lens (camera at z 30), low over the floor, weaving
    const N = 560, r = rand(4601);
    const O = [];
    for (let i = 0; i < N; i++) O.push({ x: -26 + r() * 46, y: 0.4 + Math.pow(r(), 2) * 3.2, z0: -12 + r() * 40 - 40 * r() * r(), v: 26 + r() * 22, w: (r() - 0.5) * 4, ph: r() * 6.28 });
    const A = W.orbs({ count: N, r: 0.2, seg: 8, ref: 0.12, min: 0.6 }); scene.add(A.mesh);
    const S = B.streaks(N, { color: C.ice, k: 1.3, width: 2.0 }); scene.add(S.mesh);
    // collisions: 20 in 0.5 s (40/s), each a red flash on two orbs + a spark burst
    const NC = 20, col = [];
    for (let k = 0; k < NC; k++) {
      const t0 = k * 0.025 + r() * 0.02;
      let i = Math.floor(r() * N), guard = 0;
      while (guard++ < 400) { const z = O[i].z0 + O[i].v * t0; if (z > 2 && z < 22 && O[i].y < 2.6) break; i = Math.floor(r() * N); }
      col.push({ t0, i, j: (i + 7) % N });
    }
    const SP = B.sparks({ count: NC * 40, color: C.red, size: 0.26, k: 9 }); scene.add(SP.points);
    const FL = col.map(() => { const f = W.flare({ color: C.red, k: 0, size: 3.5 }); scene.add(f); return f; });
    const CAMZ = 30;
    const pos = (o, lt, t) => {
      const z = o.z0 + o.v * lt;
      return [o.x + Math.sin(t * 3 + o.ph) * 0.6 + o.w * lt, o.y + 0.15 * Math.sin(t * 9 + o.ph), z];
    };
    const bursts = col.map((c, k) => ({ t0: c.t0, p: [0, 0, 0], n: 40, speed: 9, life: 0.35, seed: 460 + k, g: 8, dir: [0, 2, 6] }));
    col.forEach((c, k) => { const p = pos(O[c.i], c.t0, ctx.shot.start + c.t0); bursts[k].p = p; });

    return {
      scene, camera, ...W.grade('II', { bloom: { strength: 0.95, radius: 0.42, threshold: 0.8 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        rev.update(lt, { h: 600, t, pinDiv: 2, k: 1.2, body: 1.0 });
        test.update(lt, { h: 320, t, pinDiv: 2, k: 1.15, body: 1.0 });
        const red = new Map();
        col.forEach((c, k) => { const e = Math.exp(-Math.max(0, lt - c.t0) / 0.07) * (lt >= c.t0 ? 1 : 0); if (e > 0.01) { red.set(c.i, Math.max(red.get(c.i) || 0, e)); red.set(c.j, Math.max(red.get(c.j) || 0, e)); }
          FL[k].position.set(...bursts[k].p); FL[k].userData.set(5 * e, C.red); });
        for (let i = 0; i < N; i++) {
          const o = O[i], p = pos(o, lt, t);
          const camZ = CAMZ + 3 * lt;
          if (p[2] > camZ - 0.5) { A.hide(i); S.hide(i); continue; }
          const re = red.get(i) || 0;
          const c = re > 0 ? W.lin(C.ice).map((v, q) => lerp(v, W.lin(C.red)[q], re)) : W.lin(C.ice);
          if (camZ - p[2] < 5.5) A.hide(i); else A.set(i, { p, c, k: 3.6 + 7 * re });   // near the lens: streak only (no giant spheres)
          S.set(i, p, [p[0] - o.w * 0.06, p[1], p[2] - Math.min(6, o.v * 0.11)], re > 0.05 ? W.lin(C.red, 1.5) : null);
        }
        A.commit(); S.commit();
        SP.update(bursts, lt);
        H.foreman.update(lt, { lit: 0, rimColor: C.red, rimK: 0.25 });
        H.line.update(lt, { lit: 0, dim: 0.4, red: [0, 0, 0, 0.7, 0.7, 0.4, 0] });
        H.extra.length = 0;
        H.extra.push({ p: [-3, 1.5, 18], c: C.ice, k: 2.2, pool: 14, poolK: 0.8, refl: 1.2, size: 8 });
        H.extra.push(...rev.sources(), ...test.sources());
        H.update(lt, { sky: 2.4 });
        // low 24mm at y 1, Dutch +10, pulling back with the flood
        const z = CAMZ + 3 * lt;
        W.camLook(camera, [-6, 1.0, z], [2, 7.5, 0], W.FOV[24], { roll: 10 });
        W.handheld(camera, t, 0.3, 46);
        camFX(camera, t, W.FOV[24]);
      },
    };
  },
});
