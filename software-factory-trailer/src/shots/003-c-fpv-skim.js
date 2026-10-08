// 003 c-fpv-skim — 14mm FPV 0.5u over the lit rails at 40 u/s (camColdFPV), rolling 0 -> 90 deg; lamp posts whip past the lens
// every 7.5 f with anamorphic flares, brass pillars strobe by, warm speed streaks smear along the travel axis.
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b1-cold.js';

shot({
  id: 'c-fpv-skim', dur: beats(1), act: 'COLD',
  music: { section: 'cold', chord: 'Dm', div: 8, energy: 0.75, add: ['pulse', 'ticks'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0.25, 'whoosh', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'COLD' });
    const H = W.hall(scene, { state: 'cold', parts: { banks: false, rails: true } });
    // lamp-post tip flares (anamorphic) along z = 41.5 near the flight path
    const flares = [];
    for (let i = 0; i < 9; i++) {
      const x = -160 + i * 10;
      const f = W.flare({ color: W.C.amberRail, k: 5, size: 3.5 }); f.position.set(x, 4.05, 41.5); scene.add(f);
      const a = B.anamorphic({ color: W.C.amberRail, k: 1.4, w: 14, h: 0.35 }); a.position.set(x, 4.05, 41.5); scene.add(a);
      flares.push(f, a);
    }
    const streaks = B.speedStreaks({ count: 520, x0: -175, x1: -90, y: [0.12, 5], z: [35, 47], len: [1.5, 4.5], k: 2.2, width: 1.5 });
    scene.add(streaks);
    // lamp tips + rail glints mirrored in the wet floor (fills the lower half with streaks at this grazing angle)
    const postSrc = Array.from({ length: 6 }, () => ({ p: [0, 4.05, 41.5], c: W.C.amberRail, k: 7, pool: 2.5, poolK: 0.6, refl: 2.2, size: 0.4 }));
    H.extra.push(...postSrc);
    const near = B.speedStreaks({ count: 160, x0: -175, x1: -90, y: [0.05, 0.6], z: [38.5, 41.5], len: [2.5, 6], k: 3, width: 2.2, seed: 304, color: W.C.clay });
    scene.add(near);
    return {
      scene, camera, ...W.grade('COLD'),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.rails.update(lt, { cascade: 99, flow: 30, t, k: 5 });
        const cx = -150 + 40 * lt;
        postSrc.forEach((ps, i) => { ps.p[0] = Math.ceil((cx + 2) / 10) * 10 + i * 10; });
        H.line.update(lt, { lit: 1, strips: 1 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.4 });
        H.update(lt, { lit: 1, sky: 1.2 });
        const fov = W.camColdFPV(camera, lt);
        camFX(camera, t, fov);
      },
    };
  },
});
