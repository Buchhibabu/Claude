// p-bookend-cascade — BOOKEND of c-rail-cascade: the same camColdCascade top-down crane over CODE (y 40 -> 120, expo.in) and the
// same circuit board (b1 circuitBoard: 1,000 rails + PCB traces + vias + chips), now FULLY LIT, warm, no fog, energy pulses racing
// outward; the seven stations sit on it as dark chips with amber outlines: the circuit board is the factory.
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import * as B1 from './lib/b1-cold.js';
import { peakGrade } from './lib/b8-peak-end.js';

shot({
  id: 'p-bookend-cascade', dur: beats(1, 150), act: 'III',
  music: { section: 'peak', chord: 'C', div: 16, energy: 0.96, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -4 });
    ctx.sfx(0, 'riser', { dur: 4.0, gain: -4 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0005 });
    const H = W.hall(scene, { state: 'lit', parts: { foreman: false, pillars: false, banks: false } });
    const CB = B1.circuitBoard({}); scene.add(CB.group);
    const hz = B1.embers({ count: 500, center: [-19.6, 2, 0], spread: [150, 60, 70], rise: 0.6, sway: 0.4, color: W.C.amberRail, k: 0.12, size: 0.3, seed: 77 });
    scene.add(hz.points);
    return {
      scene, camera, ...peakGrade({ bloom: { strength: 1.1, radius: 0.42, threshold: 0.74 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        CB.update(lt, { cascade: 99, k: 2.8, hotK: 3.5, t: t + 2, pulse: 1, ring: 0, coreK: 8 });
        hz.update(t, { k: 0.12 });
        H.line.update(lt, { lit: 1, strips: 0, conveyorK: 3 });
        H.update(lt, { lit: 1 });
        camFX(camera, t, W.camColdCascade(camera, lt, { dur: ctx.T }));
      },
    };
  },
});
