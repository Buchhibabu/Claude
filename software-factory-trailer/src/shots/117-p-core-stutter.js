// p-core-stutter — MACRO on the foreman core (the iii-core-ignite framing, 50mm (0,150,-171.2) -> (0,150,-195)): the clay core
// blazes in its slot with the 12 threads pouring out of it, step-printed on twos with a +3% zoom every 2 f; on the last 8th the
// image HOLDS (freeze) and sags as the music tape-stops. A horizontal anamorphic clay streak through the core pre-draws the
// title's light line in the same place (shape match), then HARD CUT TO BLACK.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B1 from './lib/b1-cold.js';
import { peakGrade } from './lib/b8-peak-end.js';

shot({
  id: 'p-core-stutter', dur: beats(1, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 32, energy: 1.0, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0.2, 'tape_stop', { dur: 0.2, gain: 0 });
    ctx.sfx(0, 'reverse_swell', { dur: 0.4, gain: -4 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = W.hall(scene, { state: 'lit', parts: { floor: false, line: false, banks: false, pillars: false, threads: true } });
    const core = W.POS.core;
    const streak = B1.anamorphic({ color: W.C.clay, k: 2, w: 11.6, h: 0.12, fog: false }); streak.position.set(core[0], core[1], core[2] + 6.5); scene.add(streak);
    const streak2 = B1.anamorphic({ color: W.C.ivory, k: 1, w: 6, h: 0.04, fog: false }); streak2.position.set(core[0], core[1], core[2] + 6.6); scene.add(streak2);
    const out = {
      scene, camera, ...peakGrade({ bloom: { strength: 0.95, radius: 0.42, threshold: 0.78 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const hold = lt >= 0.2;
        const step = hold ? 2 : Math.floor(lt * 15);            // step-print on twos (3 steps), then freeze
        const pt = step / 15;                                    // posed time
        const pulse = 1 + 0.12 * Math.exp(-((pt * 20) % 1) * 3);   // core throbs on the 32nds (posed)
        H.foreman.update(pt, { lit: 6 + pt, core: 20 * pulse, slotGlow: 0.6 });
        H.foreman.coreLight.intensity = 20 * pulse * 30;
        H.threads.update(pt, { t: 3 + pt, flow: 0, k: 2.6, pulses: 1 });
        streak.userData.set(2 + 0.8 * step, W.C.clay);
        streak2.userData.set(1 + 0.5 * step, W.C.ivory);
        H.update(pt, { lit: 1, sky: 1 });
        // the hold sags like a tape stop (exposure dips while the image is frozen)
        out.exposure = hold ? lerp(1.0, 0.72, ease.in(clamp((lt - 0.2) / 0.2))) : 1.0;
        const fov = W.FOV[50] / Math.pow(1.03, step);
        W.camLook(camera, [0, 150, -171.2], [0, 150, -195], fov);
        camFX(camera, t, fov);
      },
    };
    return out;
  },
});
