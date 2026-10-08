// iii-graph-pulse — MACRO 85mm centred on one graph worker node: the pulse runs in along its brass filament, the node blooms
// (k6 -> 14 -> 6) over its etched brass housing ring, and passes the pulse on down its outlet lead.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE } = W;

shot({
  id: 'iii-graph-pulse', dur: beats(1, 150), act: 'III',
  music: { section: 'act3', chord: 'F', div: 16, energy: 0.85, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'chirps', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.006 });
    const H = W.hall(scene, { state: 'lit', parts: { line: false, banks: false, foreman: false } });
    const HOP = 4 / 30;
    const Gn = B.graphNet({ center: [0, 2, 0], radius: 14, hop: HOP }); scene.add(Gn.group);
    const J = 4;                                   // worker node 4 (lower right of the ring)
    const N = Gn.nodes[J], hub = Gn.nodes[0];
    const r = [N[0] - hub[0], 0, N[2] - hub[2]]; const L = Math.hypot(r[0], r[2]); r[0] /= L; r[2] /= L;
    const side = [-r[2], 0, r[0]];
    const halo = W.flare({ color: W.C.ivory, k: 0, size: 9, ref: 0.4 }); halo.position.set(N[0], N[1] + 0.2, N[2]); scene.add(halo);
    const grade = W.grade('III', { bloom: { strength: 1.0, threshold: 0.8 } });
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      const arrive = 0.12;                                           // pulse lands on the node at local 0.12
      const tg = lt - arrive + Gn.arrival(J);
      Gn.update(lt, { t: tg, base: 6, peak: 14, idle: 2 });
      const since = lt - arrive;
      halo.userData.set(since >= 0 ? 2.2 * Math.exp(-since * 6) : 0, W.C.ivory);
      H.update(lt, { lit: 1 });
      const u = clamp(lt / ctx.T);
      const d = lerp(17, 15.8, ease.out(u));
      const P = [N[0] + side[0] * d * 0.62 - r[0] * d * 0.12, N[1] + d * 0.77, N[2] + side[2] * d * 0.62 - r[2] * d * 0.12];
      camFX(camera, t, W.camLook(camera, P, [N[0] - r[0] * 0.6, N[1] - 0.6, N[2] - r[2] * 0.6], W.FOV[85]));
    } };
  },
});
