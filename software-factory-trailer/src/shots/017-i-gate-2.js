// #17 i-gate-2 — M3 the clock, faster (1.3x). The FPV pitches up into gate 2 as it rushes the lens: its lintel fills the top of frame
// with TWO pips lit (no numerals: the pips are the counter). We pass under on the beat (0.5) and whip down to level: gates 3-5 telescope
// ahead, and the clay glow at the CODE station is brighter now (100 orbs).
import { shot, beats, camFX, kf, ease } from '../engine.js';
import { W, THREE, gateRun, gateCam } from './lib/b2-act1a.js';

shot({
  id: 'i-gate-2', dur: beats(2), act: 'I',
  music: { section: 'act1', chord: 'Bb', div: 16, energy: 0.57, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0.5, 'B');
    ctx.sfx(0.25, 'whoosh', { gain: -4 });
    ctx.sfx(0.5, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'I' });
    const R = gateRun(scene, { pips: [1, 2, 0, 0, 0], tower: 100 });
    return {
      scene, camera, ...W.grade('I'),
      update(lt) {
        const t = ctx.shot.start + lt;
        // track the lintel up as it rushes in (its 2 lit pips stay in frame), look straight up under it, whip down to level after the pass
        const dist = Math.max(0.01, 20.8 * (0.5 - lt)), elev = THREE.MathUtils.radToDeg(Math.atan2(13, dist));
        const pitch = lt < 0.44 ? Math.min(78, elev - 9) : kf(lt, [[0.44, 78], [0.68, 3, ease.expoOut], [1.0, 2]]);
        const roll = kf(lt, [[0, -4], [0.5, 3], [1.0, -1]]);
        const cam = gateCam(camera, lt, 2, { pitch, roll });
        R.update(lt, t, cam, { beaconK: 6.5 });
        camFX(camera, t, W.FOV[14]);
      },
    };
  },
});
