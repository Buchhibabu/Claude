// 63 ii-max-push — everything at maximum. MASTER C (the ii-line-waits-2 set + camera, humanUnderSet / camHumanUnderTowerB) as the
// stutter variant: step-printed on twos with a +3% zoom stutter every 2 f, creep push 15%. The human stands motionless, rim red, at the
// foot of the scree under the 600u REVIEW mass; red pinpoints at their densest (the mass's own + a dense extra field, 8ths -> 16ths);
// the alarm banks pulse red overhead; the tower shudders 0.2u (rising to 0.35 after the 0.5 glitch, when everything doubles up).
// HARD CUT TO BLACK.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as B from './lib/b5-act2b.js';
import * as M from './lib/b4-act2a.js';
const { W, THREE } = B;

shot({
  id: 'ii-max-push', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 32, energy: 1.0, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { fog: 0.008 });
    ctx.fx.glitch(0.5, 0.25);
    ctx.sfx(0.5, 'stutter', { dur: 0.5, gain: -2 });
    const U = M.humanUnderSet(scene, { state: 'alarm', reviewMax: 600, testMax: 340 });
    const rv = U.rev;
    const pins = B.massPins({ base: rv.base, halfW: rv.halfW, halfD: rv.halfD, height: 600, every: 2.2, seed: 631, r: 0.38 }); scene.add(pins.mesh);
    const pinsLow = B.massPins({ base: rv.base, halfW: rv.halfW, halfD: rv.halfD, height: 150, every: 0.55, seed: 633, r: 0.3 }); scene.add(pinsLow.mesh);   // the visible lower 150u: densest
    const pinsT = B.massPins({ base: U.test.base, halfW: U.test.halfW, halfD: U.test.halfD, height: 200, every: 1.2, seed: 632, r: 0.3 }); scene.add(pinsT.mesh);
    const g = B.grade2({ vignette: 0.6 });
    const out = {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const tStep = t - lt + Math.floor(lt * 15) / 15;        // step-print on twos: the world updates every 2 f
        const second = lt >= 0.5;
        const shake = second ? 0.35 : 0.2;
        U.update(lt, { t: tStep, review: 600, test: 320, red: 1, shake, pinDiv: second ? 4 : 2, alarm: 1, rim: W.C.red, rimK: 3.6, poolK: 0.7, sky: 1 });
        // re-pose the masses with darker card edges so the red pinpoints and banks carry the frame (not white walls)
        U.rev.update(lt, { h: 600, t: tStep, red: 1, shake, pinDiv: second ? 4 : 2, k: 0.55, body: 0.32 });
        U.test.update(lt, { h: 320, t: tStep, red: 1, shake: shake * 0.5, pinDiv: second ? 4 : 2, k: 0.55, body: 0.32 });
        pins.update(tStep, { k: 10, shake, div: second ? 4 : null, bias: second ? 0.35 : 0.15 });
        pinsLow.update(tStep, { k: 9, shake, div: second ? 4 : null, bias: second ? 0.3 : 0.1 });
        pinsT.update(tStep, { k: 8, shake: shake * 0.5, div: second ? 4 : null, bias: 0.1 });
        // banks breathe red; after the glitch they pulse on 8ths
        U.H.banks.update(lt, { on: 0, alarm: 1, t: second ? tStep * 2 : tStep, beam: 0.7 });
        const pool = U.H.extra[0]; pool.k = 2.8; pool.pool = 2; pool.poolK = 1.1;
        U.H.update(lt, { alarm: 1, sky: 1 });
        // brief exposure throb on the stutter grid in the second half
        out.exposure = 0.95 * (second ? 1 + 0.12 * W.beatPulse(t, { div: 4, decay: 5 }) : 1);
        const fov = M.camHumanUnderTowerB(camera, lt, { dur: ctx.T, stutter: true, push: 0.15, t, handheld: second ? 0.5 : 0.3 });
        camFX(camera, t, fov);
      },
    };
    return out;
  },
});
