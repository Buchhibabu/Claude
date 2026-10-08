// p-recall-6 — recall 6/6: one graph node blooming, centred (graphDiagram, the iii-graph-pulse macro): the pulse arrives
// along its brass filament and the ivory node flares inside its etched brass rings.
import { shot, beats, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade, RECALL_EXP } from './lib/b8-peak-end.js';

shot({
  id: 'p-recall-6', dur: beats(0.5, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 32, energy: 1.0, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.006 });
    const H = W.hall(scene, { state: 'lit', parts: { line: false, banks: false, foreman: false } });
    const Gd = W.graphDiagram({ center: [0, 2, 0] }); scene.add(Gd.group);
    const j = 4, hop = 4 / 30, node = Gd.nodes[j];
    const fl = W.flare({ color: W.C.ivory, k: 0, size: 9 }); fl.position.set(node[0], node[1] + 0.2, node[2]); scene.add(fl);
    return {
      scene, camera, ...peakGrade({ exposure: RECALL_EXP[5] }),
      update(lt) {
        const t = ctx.shot.start + lt;
        Gd.update(lt, { t: (j + 1) * hop - 0.06 + lt, hop });
        H.update(lt, { lit: 1 });
        const arr = lt - 0.06;   // the pulse arrives 2 f in
        fl.userData.set(arr < 0 ? 0 : 1.5 + 4 * Math.exp(-arr * 9), W.C.ivory);
        const d = lerp(36, 33, lt / ctx.T);
        camFX(camera, t, W.camLook(camera, [node[0] + d * 0.25, node[1] + d * 0.8, node[2] + d * 0.55], node, W.FOV[85]));
      },
    };
  },
});
