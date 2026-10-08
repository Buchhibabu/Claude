// p-recall-5 — recall 5/6: camReviewWorm, level (the iii-line-runs mirror): the REVIEW tower lit amber and flowing, centred.
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade, RECALL_EXP } from './lib/b8-peak-end.js';

shot({
  id: 'p-recall-5', dur: beats(0.5, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 32, energy: 1.0, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = W.hall(scene, { state: 'lit', parts: { towers: { review: 1200, test: 640 }, cursor: true } });
    return {
      scene, camera, ...peakGrade({ exposure: RECALL_EXP[4] }),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.towers.update(lt, { review: 160, test: 120, lit: 1, flow: 6, t });
        H.banks.update(lt, { on: 1, t, beam: 0.5 });
        H.cursor.update(lt, { on: W.blink(lt, { bpm: 150, div: 2 }) });
        H.foreman.update(lt, { lit: 6 });
        H.update(lt, { lit: 1 });
        camFX(camera, t, W.camReviewWorm(camera, lt, { dur: 2, roll: 0 }));
      },
    };
  },
});
