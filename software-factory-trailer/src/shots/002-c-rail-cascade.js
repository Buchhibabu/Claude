// 002 c-rail-cascade — top-down 35mm crane (camColdCascade, y 40 -> 120 expo.in): the spark lands on the CODE point and the whole
// floor wakes as a circuit board — 1,000 amber rails + a dense PCB of fine traces light per fragment on a radial front at 160 u/s
// (white-hot overshoot settling to amber), a shock ring rides the front, energy pulses race outward. No station, no foreman.
import { shot, beats, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b1-cold.js';

shot({
  id: 'c-rail-cascade', dur: beats(1), act: 'COLD',
  music: { section: 'cold', chord: 'Dm', div: 8, energy: 0.72, add: ['pulse', 'ticks'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'riser', { dur: 1.5, gain: -6 });
    const { scene, camera } = W.stage({ act: 'COLD' });
    const fl = W.floor({ rough: 0.08, gridK: 0.9 }); scene.add(fl.mesh);
    const CB = B.circuitBoard({}); scene.add(CB.group);
    // haze between lens and floor: parallax as the crane rockets up
    const hz = B.embers({ count: 500, center: [-19.6, 2, 0], spread: [150, 60, 70], rise: 0.6, sway: 0.4, color: W.C.amberRail, k: 0.1, size: 0.3, seed: 77 });
    scene.add(hz.points);
    const src = [{ p: [-19.6, 1.2, 0], c: W.C.clay, k: 6, pool: 4, poolK: 0.8, refl: 0, size: 1 }];
    return {
      scene, camera, ...W.grade('COLD'),
      update(lt) {
        const t = ctx.shot.start + lt;
        const cas = lt + 0.06;   // the spark lands just before the cut: frame 0 shows the burst leaving the core
        CB.update(lt, { cascade: cas, k: 2.2, hotK: 3.5, t, pulse: 1, ring: 1 });
        hz.update(t, { k: 0.1 });
        src[0].k = 6 * (1 + 2 * Math.exp(-cas / 0.1));
        fl.setSources(src);
        const fov = W.camColdCascade(camera, lt, { dur: ctx.T });
        // keep the board readable through the x2 fog while the crane climbs (density follows camera height)
        scene.fog.density = Math.min(0.01, W.fogKeep(camera.position.y, 0.62));
        camFX(camera, t, fov);
      },
    };
  },
});
