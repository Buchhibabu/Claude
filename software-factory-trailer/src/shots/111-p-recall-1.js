// p-recall-1 — recall flurry 1/6 (0.2 s): the clay cursor block, centred (cursorBlock + camCursorMacro, the i-karpathy framing),
// on near-black; luminance matched across the six recalls (mean ~0.12, no white frames).
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade, RECALL_EXP } from './lib/b8-peak-end.js';

shot({
  id: 'p-recall-1', dur: beats(0.5, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 32, energy: 1.0, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.02 });
    const H = W.hall(scene, { state: 'lit', parts: { cursor: true, banks: false, pillars: false } });
    return {
      scene, camera, ...peakGrade({ exposure: RECALL_EXP[0] }),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.cursor.update(lt, { on: 1, k: 12, screenK: 0.22, type: 1, flare: 0.9 });
        H.line.update(lt, { lit: 1, strips: 1, stripK: 1.5, codeK: 4 });
        H.foreman.update(lt, { lit: 6 });
        H.update(lt, { lit: 1 });
        camFX(camera, t, W.camCursorMacro(camera, lt, { dist: 9, push: 0.05, dur: ctx.T }));
      },
    };
  },
});
