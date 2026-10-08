// 44 ii-swarm-pour — more agents arrive. Straight top-down 35mm from 90u (yaw 4 deg/s, slight descend): ice agents POUR onto the
// line from every side with no structure — 10, then 100, then 1,000 instanced orbs on the 8ths, each dragging a motion streak, flooding
// over the stations into a flat shapeless crowd, while 8,000 haze particles stream in beyond; the dimmed clay spark at CODE is lost.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-swarm-pour', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'C', div: 16, energy: 0.7, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'chirps', { gain: -8 });

    const { scene, camera } = W.stage({ act: 'II', fog: W.fogKeep(95, 0.85) });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, pillars: false } });
    // agents: tier 0 (10) land first, tier 1 (90) on the next 8th, tier 2 (900) on the one after; each flies in from beyond the
    // frame edge on a slightly curved path and settles into a loose, structureless blanket over the line
    const N = 1000, r = rand(4401);
    const A = W.orbs({ count: N, r: 0.34, seg: 8 }); scene.add(A.mesh);
    const S = B.streaks(N, { color: C.ice, k: 1.1, width: 1.6 }); scene.add(S.mesh);
    const ag = [];
    for (let i = 0; i < N; i++) {
      const tier = i < 10 ? 0 : i < 100 ? 1 : 2;
      const t0 = [-0.32, -0.08, 0.17][tier] + r() * [0.16, 0.18, 0.5][tier];
      const a = r() * Math.PI * 2;
      const R0 = 70 + r() * 30;
      // landing: a flat, lumpy blanket hugging the line (denser near it, spilling onto the floor)
      // landing: inward along its own bearing (reads as a radial pour from every side), into a flat lumpy blanket over the line
      const sx = Math.cos(a) * R0 * 1.4, sz = Math.sin(a) * R0 * 0.6;
      const gx = sx * (0.18 + r() * 0.45) + (r() - 0.5) * 14, gz = sz * (0.05 + r() * 0.25) + (r() - 0.5) * 7;
      const onDeck = Math.abs(gz) < 5 && Math.abs(gx) < 70;
      ag.push({ t0, sx, sz, gx, gz, gy: onDeck ? 3.4 : 0.35, fly: 0.32 + r() * 0.2, bend: (r() - 0.5) * 30, ph: r() * 6.28, tier });
    }
    // the dimmed clay spark (k3) at CODE, lost in the crowd
    const spark = W.orbs({ count: 1, r: 0.38, seg: 12 }); scene.add(spark.mesh);
    // distant haze: 8,000 particles streaming in from beyond the frame
    const HZ = W.swarmHaze({ count: 8000, spread: [240, 2, 120], center: [0, 1, 0], color: C.ice, size: 0.3, k: 0.6, seed: 441 });
    scene.add(HZ.points);

    return {
      scene, camera, ...W.grade('II', { bloom: { strength: 0.95, radius: 0.4, threshold: 0.78 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const cnt = [0, 0, 0];
        for (let i = 0; i < N; i++) {
          const g = ag[i], d = lt - g.t0;
          if (d < 0) { A.hide(i); S.hide(i); continue; }
          const u = clamp(d / g.fly), e = ease.out(u);
          let x = lerp(g.sx, g.gx, e), z = lerp(g.sz, g.gz, e) + Math.sin(u * Math.PI) * g.bend * 0.3, y = lerp(6, g.gy, e);
          if (u >= 1) { const dd = d - g.fly; x += Math.sin(t * 1.7 + g.ph) * 0.5 + dd * 1.5 * Math.cos(g.ph); z += Math.cos(t * 1.3 + g.ph) * 0.5; }
          cnt[g.tier]++;
          const hot = u < 1 ? 1 + 1.5 * (1 - u) : 1;
          A.set(i, { p: [x, y, z], c: W.lin(C.ice), k: (g.tier === 0 ? 4.5 : g.tier === 1 ? 3 : 2.1) * hot });
          if (u < 0.98) {
            const e2 = ease.out(clamp(u - 0.06)), px = lerp(g.sx, g.gx, e2), pz = lerp(g.sz, g.gz, e2) + Math.sin(clamp(u - 0.06) * Math.PI) * g.bend * 0.3;
            S.set(i, [x, y, z], [px, lerp(6, g.gy, e2), pz]);
          } else S.hide(i);
        }
        A.commit(); S.commit();
        spark.set(0, { p: [-19.6, 3.6, 0.4], c: W.lin(C.clay), k: 3 * (0.6 + 0.4 * W.blink(t, { div: 1 })) }); spark.commit();
        // haze drifts inward
        const P = HZ.positions, Bs = HZ.base, k = 1 - 0.18 * lt;
        for (let i = 0; i < 8000; i++) { P[i * 3] = Bs[i * 3] * k; P[i * 3 + 2] = Bs[i * 3 + 2] * k; }
        HZ.geometry.attributes.position.needsUpdate = true;
        H.line.update(lt, { lit: 0, dim: 0.5, strips: [0, 0, 0.3, 0, 0, 0, 0], codeK: 2 });
        H.extra.length = 0;
        H.extra.push({ p: [0, 2, 0], c: C.ice, k: 0.6 + 0.0015 * (cnt[1] + cnt[2]), pool: 40, poolK: 0.6, refl: 0, size: 20 });
        H.update(lt);
        const fov = W.camTop(camera, 0, 90 * (1 - 0.05 * ease.out(clamp(lt / ctx.T))), 0, W.FOV[35], 4 * lt);
        W.handheld(camera, t, 0.3, 44);
        camFX(camera, t, fov);
      },
    };
  },
});
