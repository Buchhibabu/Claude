// b-cursor-on — FINAL IMAGE. Eye-level 85mm, locked, on the one clay cursor on its dark screen; the lit hall glows softly through
// fog around the screen's edges. It blinks 3 times on the tick (0.0 / 0.5 / 1.0); at 1.5 it STOPS BLINKING and stays ON (k14) with
// a localized clay flare (r 3u, 4 f decay). Held on the steady cursor to the cut.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';

const ON_AT = 1.5;
shot({
  id: 'b-cursor-on', dur: beats(8), act: 'BUTTON',
  music: { section: 'end', chord: 'Dsus', div: 4, energy: 0.12, add: ['pad', 'piano'], drop: ['ticks', 'drone'] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'tick', { gain: -14 });
    ctx.sfx(0.5, 'tick', { gain: -14 });
    ctx.sfx(1.0, 'tick', { gain: -14 });
    ctx.sfx(1.5, 'sting', { gain: -6 });
    ctx.sfx(1.5, 'chirps', { gain: -14 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.011 });
    const H = W.hall(scene, { state: 'lit', parts: { cursor: true } });
    const out = {
      scene, camera, ...W.grade('BUTTON', { sat: 0.95, exposure: 0.85, tint: [1.02, 1.0, 0.98], vignette: 0.55, bloom: { strength: 1.0, radius: 0.45, threshold: 0.74 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const blinking = lt < ON_AT;
        const on = blinking ? W.blink(lt, { bpm: 120 }) : 1;
        const dt = lt - ON_AT;
        const fl = blinking ? 0 : 0.35 + 1.1 * clamp(1 - dt / (4 / 30));    // 4-frame flare decay to a steady glow
        H.cursor.update(lt, { on, k: blinking ? 10 : 14, flare: fl, screenK: 0.3, type: 1 });
        H.banks.update(lt, { on: 1, t, beam: 0.8 });
        H.line.update(lt, { lit: 1, strips: 1 });
        H.foreman.update(lt, { lit: 8 });
        H.update(lt, { lit: 1 });
        out.bloom.strength = blinking ? 1.0 : W.bloomHit(1.0, dt, { peak: 1.5, d: 0.3 });
        camFX(camera, t, W.camCursorMacro(camera, lt, { dist: 20, push: 0, dur: ctx.T }));
      },
    };
    return out;
  },
});
