// 85 iii-deploy-mirror — MIRROR of ii-deploy-maze (camDeployTop, same yaw): red stops become green/amber flow, the strips run L->R,
// the floor where DEPLOY. lay is clean; the rail network under the floor flows with it.
import { shot, beats, camFX } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

shot({
  id: 'iii-deploy-mirror', dur: beats(1, 150), act: 'III',
  music: B.act3('Bb', 0.88),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'chirps', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'III', fog: W.fogKeep(70, 0.85) });
    const H = B.litHall(scene, { rails: true });
    const D = W.deployMaze({}); scene.add(D.group);
    const F = B.lineFlow({ count: 2200, lanes: 7, speed: 30, k: 6, size: 0.3, width: 8, x0: 20, x1: 62 }); scene.add(F.points);
    return {
      scene, camera, ...W.grade('III'),
      update(lt) {
        const t = ctx.shot.start + lt;
        B.litUpdate(H, lt, t, { foreman: 0, housing: false, beam: 0.3, stripK: 0.7, codeK: 2 });
        H.rails.update(lt, { cascade: 99, flow: 30, t, k: 4 });
        D.update(lt, { cards: 240, lit: 1, t, flow: 14 });
        F.update(t);
        H.update(lt);
        camFX(camera, t, W.camDeployTop(camera, lt));
      },
    };
  },
});
