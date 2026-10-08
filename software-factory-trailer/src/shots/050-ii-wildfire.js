// 50 ii-wildfire — it spreads to the whole line. The m-sixteen composition (135mm straight down from 545u, the 140u line filling the
// frame width) now burns: branching red cracks race out from REVIEW across all 7 stations at 40 u/s (hot front -> embers), ice swarm
// agents flip red as it reaches them, stations flip to red edges, the dimmed clay 16% strip is overrun; one alarm beam sweeps the frame.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

shot({
  id: 'ii-wildfire', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'C', div: 16, energy: 0.78, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { near: 150 });
    ctx.fx.glitch(0, 0.1);
    ctx.sfx(0, 'glitch', { gain: -6 });
    ctx.sfx(0.5, 'whoosh', { gain: -8 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, pillars: false, foreman: false } });
    const F = B.crackTree({ origin: [1.4, 0], seed: 5050, rays: 18, xMax: 74, zMax: 13, width: 1.15, branch: 0.11 });
    scene.add(F.group);
    // the cold swarm scattered over and around the line (they flip red as the fire reaches them)
    const r = rand(5051);
    const NS = 1400;
    const S = W.orbs({ count: NS, r: 0.32, seg: 6 }); scene.add(S.mesh);
    const sw = Array.from({ length: NS }, () => { const x = (r() - 0.5) * 150, z = (r() - 0.5) * 2 * (r() < 0.45 ? 6 : r() < 0.6 ? 16 : 28); return { x, z, y: Math.abs(z) < 5 ? 3.4 : 0.4, ph: r() }; });
    sw.forEach((o) => { o.arr = F.arrival(o.x, o.z, 2.4); });
    // alarm beam sweeping across the frame (soft red band) + its floor light
    const beam = B.band({ len: 160, width: 22, color: W.C.red, k: 0.3 }); beam.rotation.x = -Math.PI / 2; scene.add(beam);
    const ice = W.lin(W.C.ice), red = W.lin(W.C.red), hot = W.lin(0xff9a7a);
    const g = B.grade2({ vignette: 0.6 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        scene.fog.density = W.fogKeep(545, 0.85);
        const rf = 21 + 40 * lt;                      // front (path distance) at 40 u/s
        F.update(rf, { k: 5.5, t, tipK: 9, emb: 0.1 });
        for (let i = 0; i < NS; i++) {
          const o = sw[i];
          const burnt = rf > o.arr;
          const age = burnt ? rf - o.arr : 0;
          const jit = Math.sin(t * 9 + i) * 0.15;
          S.set(i, { p: [o.x + jit, o.y, o.z], c: burnt ? (age < 3 ? hot : red) : ice, k: burnt ? (age < 3 ? 8 : 2.2) : 2.4 });
        }
        S.commit();
        // stations: edges flip red as the front passes each one (REVIEW first)
        const reach = rf / 1.1;
        const redSt = W.STATIONS.map((s) => clamp((reach - Math.max(0, Math.abs(s.cx - 1.4) - s.w / 2)) / 8));
        H.line.update(lt, { lit: 0, dim: 0.3, red: redSt, strips: [0, 0, 1, 0, 0, 0, 0], draw: 1, codeK: 2.4 });
        // the beam: sweeps L->R across the frame over the shot, tilted
        const bx = lerp(-95, 95, ease.inOut(clamp(lt / 1.0)));
        beam.position.set(bx, 5, 0); beam.rotation.z = 0.32;
        beam.userData.set(0.28);
        H.extra.length = 0;
        H.extra.push({ p: [bx, 4, 0], c: W.C.red, k: 2.5, pool: 7, poolK: 1, refl: 0, size: 2 });
        H.extra.push({ p: [1.4, 3.5, 0], c: W.C.red, k: 3, pool: 14, poolK: 0.9, refl: 0, size: 2 });
        H.update(lt);
        const fov = W.camLineTop(camera, lt, { dur: ctx.T, rot: 3 * lt });
        W.handheld(camera, t, 0.15, 4);
        camFX(camera, t, fov);
      },
    };
  },
});
