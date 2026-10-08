// p-recall-3 — recall 3/6: the 1,000-orb code tower (codeTower at 1,000 + crest), centred (35mm from a low front angle; the
// low frontal three-quarter of the i-crane-1000 reveal, levelled for Act III): a monolith of clay light, crest ring haloed on top.
import { shot, beats, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import { peakGrade, RECALL_EXP } from './lib/b8-peak-end.js';

shot({
  id: 'p-recall-3', dur: beats(0.5, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 32, energy: 1.0, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.01 });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, banks: false } });
    return {
      scene, camera, ...peakGrade({ exposure: RECALL_EXP[2] }),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.tower.update(lt, { count: 1000, k: 10, crest: 1, t });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.4 });
        H.update(lt, { lit: 0.3 });
        const z = lerp(80, 76, lt / ctx.T);
        camFX(camera, t, W.camLook(camera, [-19.6, 4, z], [-19.6, 17.5, 0], W.FOV[35]));
      },
    };
  },
});
