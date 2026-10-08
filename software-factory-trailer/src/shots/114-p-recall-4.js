// p-recall-4 — recall 4/6: camLineTop (the m-sixteen 16% composition), now with EVERY segment lit: the whole line, centred.
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade, RECALL_EXP } from './lib/b8-peak-end.js';

shot({
  id: 'p-recall-4', dur: beats(0.5, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 32, energy: 1.0, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = W.hall(scene, { state: 'lit', parts: { banks: false, pillars: false } });
    scene.fog.density = W.fogKeep(545, 0.85);
    camera.near = 200; camera.far = 900; camera.updateProjectionMatrix();   // 545u top-down: keep depth precision (no strip z-fighting)
    return {
      scene, camera, ...peakGrade({ exposure: RECALL_EXP[3] }),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.line.update(lt, { lit: 1, strips: 1, draw: 1, codeK: 8, stripK: 5, conveyorK: 3 });
        H.foreman.update(lt, { lit: 6 });
        H.update(lt, { lit: 1 });
        camFX(camera, t, W.camLineTop(camera, lt, { dur: ctx.T, descend: +(new URLSearchParams(location.search).get("dsc") ?? 0.03) }));
      },
    };
  },
});
