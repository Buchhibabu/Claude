// iii-graph — GRAPH (structure tricolon 1/3). TOP-DOWN 35mm, yaw 4 deg/s, slight descent: a neutral node graph (1 ivory hub + 12 ivory
// workers on etched brass housings, 13 brass filaments). One light pulse enters from the left edge and hops edge by edge (4 f per hop);
// each node blooms on arrival and stays lit: control, node by node. Neutral colours only: architecture, not Claude.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE } = W;

shot({
  id: 'iii-graph', dur: beats(4, 150), act: 'III',
  music: { section: 'act3', chord: 'F', div: 16, energy: 0.85, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'boom', { gain: -2 });
    ctx.sfx(0, 'chirps', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.003 });
    const H = W.hall(scene, { state: 'lit', parts: { line: false, banks: false, foreman: false } });
    const Gn = B.graphNet({ center: [0, 2, 0], radius: 14 }); scene.add(Gn.group);
    const big = B.etchedDisc({ r: 26, k: 0.1 }); big.position.set(0, 0.04, 0); scene.add(big);
    const big2 = B.etchedDisc({ r: 40, k: 0.05 }); big2.position.set(0, 0.03, 0); big2.rotation.z = 0.3; scene.add(big2);
    const grade = W.grade('III', { bloom: { strength: 1.0, threshold: 0.78 } });
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      Gn.update(lt, { t: lt - 0.02, base: 5, peak: 12, idle: 1.8 });
      big.rotation.z = -0.05 * lt;
      H.extra.length = 0; H.extra.push({ p: [0, 3, 0], c: W.C.ivory, k: 1.5, pool: 16, poolK: 0.5, refl: 0, size: 2 });
      H.update(lt, { lit: 1 });
      const h = lerp(84, 74, ease.out(clamp(lt / ctx.T)));
      camFX(camera, t, W.camTop(camera, 0, h, 6.5, W.FOV[35], 4 * lt));
    } };
  },
  ui(root, tl, K) {
    const sc = B.scrim(K, root, { y: 870, h: 360, a: 0.45 });
    K.cutIn(tl, sc, 0); K.cutOut(tl, sc, 1.55);
    const el = B.tricolon(K, root, { pre: 'GRAPH:', main: 'CONTROL.', size: 150, y: 870 });
    K.slam(tl, el, 0.0, { from: 1.25, d: 0.28 });
    K.cutOut(tl, el, 1.55);
  },
});
