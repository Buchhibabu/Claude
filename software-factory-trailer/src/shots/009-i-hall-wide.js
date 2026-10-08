// #9 i-hall-wide — ACT I master. The dark hall at 18mm near-worm's-eye (camHallWide): pillars recede into cold haze,
// skylight shafts slant across the aisle, one cold cone of light pools on the single CODE station 160u away, and the
// clay cursor blinks on every tick (the only warm pixel). Wet floor carries its streak.
import { shot, beats, camFX, clamp } from '../engine.js';
import { W, atmo } from './lib/b2-act1a.js';

shot({
  id: 'i-hall-wide', dur: beats(4), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 4, energy: 0.2, add: ['drone', 'ticks'], drop: ['pulse', 'ostinato', 'kick', 'drums'] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -9 });
    ctx.sfx(0, 'tick', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { cursor: true } });
    const cs = H.cursor.sources; H.cursor.sources = () => cs().map((s) => ({ ...s, refl: 0.35, pool: 2.5, poolK: 0.8 }));
    const A = atmo(scene, H, {
      stationTop: 46, coneR: [0.8, 11],
      shafts: [
        { x: -132, z: -20, r: 6, op: 0.2, poolK: 2.5, from: [26, 230, 90] },
        { x: -96, z: 16, r: 7, op: 0.16, poolK: 2.5, from: [26, 230, 90] },
        { x: -58, z: -22, r: 7, op: 0.12, poolK: 2, from: [26, 230, 90] },
        { x: 40, z: -12, r: 9, op: 0.08, light: false, from: [26, 230, 90] },
      ],
      haze: [
        { x: -130, w: 130, h: 26, k: 0.035 },
        { x: -85, w: 130, h: 30, k: 0.04 },
        { x: -40, w: 140, h: 34, k: 0.05 },
        { x: 10, w: 160, h: 40, k: 0.06 },
        { x: 80, w: 200, h: 50, k: 0.07 },
      ],
      near: { count: 140, box: [[-176, 0.2, -14], [-150, 9, 22]], color: 0xcfe3f2, k: 0.3, size: 0.08, seed: 9, rise: 0.08, sway: 0.25 },
    });
    return {
      scene, camera, ...W.grade('I', { vignette: 0.5 }),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.cursor.update(lt, { on: W.blink(t), k: 10, flare: 0.35 * W.blink(t) });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.steel, rimK: 0.3 });
        A.update(lt, t, { stationK: 1, shaftK: 1 });
        H.update(lt, { sky: 1.8, pillarK: 0.55 });
        camFX(camera, t, W.camHallWide(camera, lt, { dur: ctx.T, t, handheld: 0.3 }));
      },
    };
  },
});
