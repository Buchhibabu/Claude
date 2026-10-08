// 102 p-line-flow — PEAK, wordless tricolon 1/3. camLineTop rotated 90 deg (work now rises up the frame): the whole line flowing, every
// segment lit — the 16% composition, now 100% lit. Crash-settle descent on the hit.
// (Height raised from 545 to ~1100 so the full 140u line fits the frame height once rotated.)
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

shot({
  id: 'p-line-flow', dur: beats(1, 150), act: 'III',
  music: B.peak('Bb', 0.95),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = B.litHall(scene, { rails: true });
    const F = B.lineFlow({ count: 6000, lanes: 11, speed: 45, k: 6, size: 1.5, width: 8.6 }); scene.add(F.points);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.2, radius: 0.5, threshold: 0.74 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        B.litUpdate(H, lt, t, { foreman: 5, housing: false, beam: 0.35, stripK: 2.2, codeK: 6 });
        H.rails.update(lt, { cascade: 99, flow: 40, t, k: 3 });
        F.update(t);
        H.update(lt);
        const h = lerp(1210, 1110, ease.expoOut(clamp(lt / 0.3)));
        scene.fog.density = W.fogKeep(h, 0.85);
        camFX(camera, t, W.camTop(camera, 0, h, 0, W.FOV[135], 90));
      },
    };
  },
});
