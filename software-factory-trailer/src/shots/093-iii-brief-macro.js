// 93 iii-brief-macro — Macro 85mm on the core slot, pos (0,150,-176) -> (0,150,-195), 2% push. The human's brief arrives: the single
// bright mote rides the centre thread up into the slot; the core pulses (k 20 -> 28 -> 20) with a clay shock ring, and all 12 primary
// threads flare once in sequence, one per 32nd. One human brief -> the foreman -> the line.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { THREE, G } = W;

const HIT = 0.25;   // mote enters the core
shot({
  id: 'iii-brief-macro', dur: beats(2, 150), act: 'III',
  music: B.act3('D', 0.95),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'chirps', { gain: -8 });
    ctx.sfx(0.4, 'impact', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = B.litHall(scene, { floor: false, line: false, banks: false, pillars: false, threads: true });
    const Th = H.threads;
    // shock ring from the core on arrival (in the slot plane)
    const ring = G.ring({ r: 1, tube: 0.05, color: W.C.ember, k: 1 }); ring.position.set(0, 150, -189.2); scene.add(ring);
    const bp = Th.briefPath; const len = bp.getLength();
    const uIn = 1 - 14 / len;     // the mote is ~14u below/before the core at the cut
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.0, radius: 0.5, threshold: 0.82 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const a = lt - HIT;
        // core: 20 -> 28 peaking on the impact (0.4) -> 20
        const core = a < 0 ? 8 : 8 + 6 * (a < 0.15 ? ease.out(a / 0.15) : Math.exp(-(a - 0.15) * 6));
        B.litUpdate(H, lt, t, { foreman: 5, foremanOpts: { core, slotGlow: 0.25 } });
        // macro: keep the hall-scale core light / flare from flooding a 4u frame
        H.foreman.coreLight.intensity = core * 7; H.foreman.coreLight.distance = 20;
        H.foreman.coreFlare.userData.set(core * 0.01);
        const flare = W.SUBLEAD_X.map((_, j) => { const d = a - j * 0.05; return d < 0 ? 0 : 2.4 * Math.exp(-d * 9); });
        Th.update(lt, { t, k: 2.6, flare, brief: a < 0 ? lerp(uIn, 1, ease.in(clamp(lt / HIT))) : -1, briefK: 14, pulses: 1 });
        ring.visible = a > 0 && a < 0.5;
        if (ring.visible) { const s = 1 + a * 26; ring.scale.setScalar(s); ring.material.color.set(W.C.ember).multiplyScalar(W.ko(9) * Math.exp(-a * 5)); }
        H.update(lt, { sky: 1 });
        const d = 60 * (1 - 0.04 * clamp(lt / ctx.T));
        camFX(camera, t, W.camLook(camera, [0, 150, -195 + d], [0, 150, -195], W.FOV[50]));
      },
    };
  },
});
