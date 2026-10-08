// 99 iii-orbit-a — the factory runs. LOW ORBIT around the lit foreman at height 6, 25 deg/s, level horizon: the monument, its 12
// threads sweeping overhead toward the flowing line, banks and brass pillars at frame right; the brief's mote still pulsing in the core.
// The 18-lamp hour ring on the floor around its base ignites one lamp per 32nd as the camera orbits (hours, unattended; no human).
// Card: 18+ HOURS UNATTENDED. / CLIO (carries into iii-orbit-b).
// (14mm shift-lens at radius 180 instead of 24mm at radius 140: from height 6 the 24mm frame cannot hold both the core (y 150) and
//  the floor ring; the shift keeps verticals parallel like the hero frame and keeps the ring above the lower-third card.)
import { shot, beats, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { THREE } = W;

shot({
  id: 'iii-orbit-a', dur: beats(2, 150), act: 'III',
  music: B.act3('D', 0.95),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -8 });
    ctx.sfx(0, 'tick', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0032 });
    const H = B.litHall(scene, { threads: true });
    const F = B.lineFlow({ count: 2400, lanes: 7, speed: 30, k: 5, size: 0.6, width: 8 }); scene.add(F.points);
    const M = B.motes({ count: 1200, center: [-40, 30, -110], spread: [160, 60, 120], k: 0.9, size: 0.3, rise: 0.8, seed: 991 }); scene.add(M.points);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.2, radius: 0.5, threshold: 0.74 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const hr = Math.min(18, Math.floor(lt / (0.75 / 18)) + 1);   // one lamp per 32nd-ish: all 18 by 0.75
        const core = 20 + 5 * W.beatPulse(t, { bpm: 150, div: 1, decay: 5 });
        B.litUpdate(H, lt, t, { foreman: 5, beam: 0.55, foremanOpts: { hourRing: hr, core } });
        H.threads.update(lt, { t, k: 2.8, flow: 1, pulses: 1 });
        F.update(t); M.update(t);
        H.extra.length = 0; B.foremanRefl(H.extra, 7, 1.6);
        H.update(lt);
        const a = THREE.MathUtils.degToRad(-40 + 25 * lt);
        const R = 180, pos = [Math.sin(a) * R, 6, -200 + Math.cos(a) * R];
        camFX(camera, t, B.camShift(camera, pos, [0, 6, -200], W.FOV[14], 720));
      },
    };
  },
  ui(root, tl, K, ctx) {
    B.proofCard(root, tl, K, { ...B.CARDS.clio, enter: true, push: { d: ctx.T, from: 1, to: 1.012 } });
  },
});
