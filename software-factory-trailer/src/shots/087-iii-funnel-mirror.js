// 87 iii-funnel-mirror — MIRROR of ii-funnel-top: same static top-down 50mm (-6,60,0), up (0,0,-1). The same river of cards from CODE
// now splits into 12 parallel lit lanes at REVIEW and passes at full speed (30 u/s): no delta, no pile (parallelize reading).
import { shot, beats, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { G } = W;

const GATE = -8.4, LZ = (j) => -5.5 + j;   // 12 lanes, 1u apart
shot({
  id: 'iii-funnel-mirror', dur: beats(1, 150), act: 'III',
  music: B.act3('Bb', 0.88),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'chirps', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'III', fog: W.fogKeep(60, 0.85) });
    const H = B.litHall(scene, {});
    // river upstream (CODE): ivory particles, gently braided; downstream (REVIEW): 12 straight amber lanes
    const up = [], dn = [];
    for (let j = 0; j < 12; j++) {
      const z = LZ(j);
      up.push(G.spline([[-34, 3.35, z * 0.9 + Math.sin(j) * 0.4], [-24, 3.35, z * 0.95 - Math.cos(j * 1.7) * 0.3], [-14, 3.35, z * 0.98], [GATE, 3.35, z]]));
      dn.push(G.spline([[GATE, 3.35, z], [3, 3.35, z], [18, 3.35, z]]));
    }
    const FU = G.flow({ curves: up, count: 2400, speed: 30 / 26, size: 0.28, color: W.C.ivory, seed: 871, jitter: 0.3 });
    FU.material.color.set(W.C.ivory).multiplyScalar(W.ko(2.4)); scene.add(FU.points); FU.points.frustumCulled = false;
    const FD = G.flow({ curves: dn, count: 2000, speed: 30 / 26.4, size: 0.24, color: W.C.amberRail, seed: 872, jitter: 0.04 });
    FD.material.color.set(W.C.amberRail).multiplyScalar(W.ko(3.4)); scene.add(FD.points); FD.points.frustumCulled = false;
    // 12 lit lane strips over REVIEW + 12 gate ticks at the input
    const lanes = W.glowSegs(Array.from({ length: 12 }, (_, j) => [[GATE, 3.25, LZ(j)], [18, 3.25, LZ(j)]]), { color: W.C.amber, k: 2.2, width: 1.4 }); scene.add(lanes);
    const ticks = W.orbs({ count: 12, r: 0.22, seg: 8 }); scene.add(ticks.mesh);
    // cards riding the lanes (the river of cards) at 30 u/s
    const NC = 132;
    const Cd = W.cards({ count: NC, size: [1.1, 0.12, 0.62] }); scene.add(Cd.mesh);
    const r = rand(873); const cph = Array.from({ length: NC }, () => r());
    return {
      scene, camera, ...W.grade('III'),
      update(lt) {
        const t = ctx.shot.start + lt;
        B.litUpdate(H, lt, t, { foreman: 0, housing: false, beam: 0.2, stripK: 0.5, codeK: 1.6 });
        FU.update(t); FD.update(t);
        for (let j = 0; j < 12; j++) ticks.set(j, { p: [GATE, 3.4, LZ(j)], c: W.lin(W.C.amber), k: 5 + 5 * W.beatPulse(t + j * 0.0167, { bpm: 150, div: 4, decay: 8 }) });
        ticks.commit();
        for (let i = 0; i < NC; i++) {
          const j = i % 12; const span = 52;
          const x = -34 + ((cph[i] * span + t * 30) % span);
          const z = x < GATE ? lerp(LZ(j) * 0.9, LZ(j), clamp((x + 34) / 26)) : LZ(j);
          const lit = clamp((x - GATE) / 3);
          Cd.set(i, { p: [x, 3.45, z], edge: x < GATE ? W.CARD.edge(1.4) : W.CARD.amberEdge(3), body: lit > 0 ? W.CARD.amberBody(3) : W.CARD.body(1.4) });
        }
        Cd.commit();
        H.update(lt);
        camFX(camera, t, W.camTop(camera, -6, 60, 0, W.FOV[50]));
      },
    };
  },
});
