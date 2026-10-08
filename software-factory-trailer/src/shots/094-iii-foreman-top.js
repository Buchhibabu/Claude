// 94 iii-foreman-top — the understanding angle. TOP-DOWN 35mm, camera.up (0,0,-1), yaw 3 deg/s: the lit foreman's stepped square at
// the top of frame, its 12 primary threads fanning to the 12 clay sub-leads in a row over the line, each sub-lead's particle flow
// branching down to the stations; the line flows L->R. Exactly 12 lines; everything finer is particle flow.
// (Centre moved from z -110 to z -96 and height raised 320 -> ~400: at the listed numbers the frame ends at z -20, so the sub-leads
//  at z -12 and the line at z 0 fall outside it.)
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

shot({
  id: 'iii-foreman-top', dur: beats(4, 150), act: 'III',
  music: B.act3('Bb', 0.9),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'chirps', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = B.litHall(scene, { threads: true, rails: true });
    const F = B.lineFlow({ count: 3200, lanes: 9, speed: 30, k: 5, size: 0.7, width: 8 }); scene.add(F.points);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.15, radius: 0.45, threshold: 0.75 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        B.litUpdate(H, lt, t, { foreman: 5, housing: false, beam: 0.3, stripK: 1.2, codeK: 3 });
        H.rails.update(lt, { cascade: 99, flow: 30, t, k: 2.5 });
        H.threads.update(lt, { t, k: 3, flow: 1, pulses: 1 });
        F.update(t);
        H.update(lt);
        const h = lerp(410, 392, ease.out(clamp(lt / ctx.T)));
        scene.fog.density = W.fogKeep(h, 0.72);
        camFX(camera, t, W.camTop(camera, 0, h, -96, W.FOV[35], 3 * lt));
      },
    };
  },
});
