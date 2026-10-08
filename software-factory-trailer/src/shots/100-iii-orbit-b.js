// 100 iii-orbit-b — HIGH 35mm three-quarter, pos (-120,140,80) -> (0,60,-100), slow push: the foreman, the 12 threads and the line read
// as one machine; particle flow streams down every thread to the stations, the line flows L->R, the 18-lamp hour ring fully lit.
// CARRY: 18+ HOURS UNATTENDED. + CLIO, cut out at local 1.1.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

shot({
  id: 'iii-orbit-b', dur: beats(3, 150), act: 'III',
  music: B.act3('D', 0.97),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'impact', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0028 });
    const H = B.litHall(scene, { threads: true, rails: true });
    // the near pillar row (z +30) sits between this high camera and the machine: drop it so it doesn't bar the frame
    for (let i = 0; i < 20; i++) H.pillars.I.hide(i);
    H.pillars.I.commit();
    const F = B.lineFlow({ count: 3000, lanes: 9, speed: 30, k: 5, size: 0.55, width: 8 }); scene.add(F.points);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.15, radius: 0.5, threshold: 0.75 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const core = 20 + 5 * W.beatPulse(t, { bpm: 150, div: 1, decay: 5 });
        B.litUpdate(H, lt, t, { foreman: 5, beam: 0.6, foremanOpts: { hourRing: 18, core } });
        H.rails.update(lt, { cascade: 99, flow: 30, t, k: 3 });
        H.threads.update(lt, { t, k: 2.6, flow: 1, pulses: 1 });
        F.update(t);
        H.extra.length = 0; B.foremanRefl(H.extra, 5, 1.2);
        H.update(lt);
        const u = ease.out(clamp(lt / ctx.T));
        const p0 = [-120, 140, 80], tg = [0, 60, -100];
        const pos = p0.map((v, i) => lerp(v, tg[i], 0.07 * u));   // slow 7% push
        camFX(camera, t, W.camLook(camera, pos, tg, W.FOV[35]));
      },
    };
  },
  ui(root, tl, K, ctx) {
    B.proofCard(root, tl, K, { ...B.CARDS.clio, enter: false, cutOut: 1.1, push: { d: 1.1, from: 1.012, to: 1.03 } });
  },
});
