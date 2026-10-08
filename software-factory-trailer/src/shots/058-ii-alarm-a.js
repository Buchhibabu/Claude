// 58 ii-alarm-a — the hall goes to alarm (cut 1 of 4, 0.25 s, luminance-matched). WORM'S-EYE 14mm from the head of the aisle
// (-90, 0.5, 0): frame 0 is the dead-centre one-point aisle (camAisle — the frame iii-bank-1 settles into), the 600u REVIEW tower on the
// vanishing axis, red-edged stations converging. Frame 1: banks 1-2 flick to RED ALARM and the camera whip-tilts UP the red beam into
// bank 1's panel, landing it dead centre (the exact frame iii-bank-1 opens on, warm) — the alarm is the mirror of the lights-on.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

shot({
  id: 'ii-alarm-a', dur: beats(0.5), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 32, energy: 0.92, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { fog: 0.0045 });
    ctx.sfx(0, 'boom', { gain: -6 });
    const H = W.hall(scene, { state: 'dark', parts: { towers: { review: 1200, test: 640, deploy: 240 } } });
    const FL = [0, 1, 0.3, 1, 1, 1, 1, 1];                 // per-frame flick of banks 1-2
    const g = B.grade2({ vignette: 0.5, exposure: 1.35 });
    const out = {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const a = B.frameTab(lt, FL);
        H.banks.update(lt, { on: 0, alarm: [a, a, 0, 0, 0, 0, 0, 0], t, beam: 9, dust: 7 });
        H.banks.lamps[0].userData.base.multiplyScalar(2.8); H.banks.lamps[1].userData.base.multiplyScalar(2.2);   // hot alarm panels (the whip lands on them)
        H.towers.update(lt, { review: 1200, test: 640, deploy: 240, t });
        H.line.update(lt, { lit: 0, dim: 0.3, red: 1 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.red, rimK: 0.2 });
        H.update(lt, { sky: 2.2, alarm: 0.6 * a });
        // whip-tilt: aisle (camAisle pitch) -> bank 1's panel centred, frames 1-6, hold
        const P0 = [-90, 0.5, 0];
        const up = Math.atan2(59.6 - 0.5, 20), down = Math.atan2(19.5, 150);
        const w = ease.inOut(clamp((lt - 1 / 30) / 0.17));
        const p = lerp(down, up, w);
        W.camLook(camera, P0, [P0[0] + Math.cos(p) * 100, P0[1] + Math.sin(p) * 100, 0], W.FOV[14]);
        out.exposure = lerp(1.45, 3.1, w);                  // luminance-match: the small panel frame is lifted to the series level
        W.handheld(camera, t, 0.25, 58);
        camFX(camera, t, W.FOV[14]);
      },
    };
    return out;
  },
});
