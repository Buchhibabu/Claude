// p-recall-2 — recall 2/6: a brass MONTH gate with all 5 pips lit (no numerals), centred, the lit line glowing far behind it
// down the one-point perspective of the brass pillars.
import { shot, beats, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade, RECALL_EXP } from './lib/b8-peak-end.js';

shot({
  id: 'p-recall-2', dur: beats(0.5, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 32, energy: 1.0, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.006 });
    const H = W.hall(scene, { state: 'lit', parts: { cursor: false } });
    const gx = W.GATE_X[4];
    const Gt = W.gate({ x: gx, counter: null }); scene.add(Gt.group);
    const rail = W.fat([[-300, 0.05, 0], [-70, 0.05, 0]], { color: W.C.brassMid, k: 1.5, width: 2 }); scene.add(rail);
    return {
      scene, camera, ...peakGrade({ exposure: RECALL_EXP[1] }),
      update(lt) {
        const t = ctx.shot.start + lt;
        Gt.update(lt, { lit: 5, k: 3, pipK: 10, body: 0.15 });
        H.banks.update(lt, { on: 1, t, beam: 0.4 });
        H.line.update(lt, { lit: 1, strips: 1 });
        H.foreman.update(lt, { lit: 6 });
        H.extra.length = 0;
        H.extra.push({ p: [gx, 14, 0], c: W.C.brassHi, k: 3, pool: 9, poolK: 0.8, refl: 1.0, size: 7 });
        H.update(lt, { lit: 1 });
        const d = lerp(36, 33, lt / ctx.T);
        camFX(camera, t, W.camLook(camera, [gx - d, 7.4, 0], [gx, 7.4, 0], W.FOV[35]));
      },
    };
  },
});
