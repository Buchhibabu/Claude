// 61 ii-alarm-d — cut 4 of 4 (0.25 s, luminance-matched). TOP-DOWN 50mm over banks 7-8 from (60, 140, 0): two dark housings fill
// the centre over the jammed DEPLOY maze and OPERATE (red stop lamps, red station edges), the maze's red stop lamps blinking between
// them. Frame 1: banks 7-8 flick to red — glowing red alarm frames on their housings, red light spilling round their
// edges onto the floor; bank 6 already burning at frame left: all eight now pulse over the jammed line. Slow yaw + sink.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

shot({
  id: 'ii-alarm-d', dur: beats(0.5), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 32, energy: 0.95, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { near: 2 });
    ctx.sfx(0, 'boom', { gain: -6 });
    const H = W.hall(scene, { state: 'dark', parts: { pillars: false, foreman: false } });
    const D = W.deployMaze({}); scene.add(D.group);
    const BF = B.bankFrames({ k: 5, width: 2.4 }); scene.add(BF.mesh);
    const FL = [0, 1, 0.3, 1, 1, 1, 1, 1];
    const g = B.grade2({ vignette: 0.6, exposure: 0.62 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        scene.fog.density = W.fogKeep(140, 0.85);
        const a = B.frameTab(lt, FL);
        const pulse = lerp(0.6, 1, 0.5 + 0.5 * Math.cos((t / 0.5) * Math.PI * 2));
        const lv = [1, 1, 1, 1, 1, 1, a, a];
        H.banks.update(lt, { on: 0, alarm: lv, t, beam: 2.4 });
        BF.update(lv.map((v, i) => v * pulse * (i >= 6 ? 1 + 0.8 * B.impulse(lt, 1 / 30, 0.08) : 1)), 5);
        D.update(lt, { cards: 400, t });
        H.line.update(lt, { lit: 0, dim: 0.3, red: 1 });
        H.extra.length = 0;
        [6, 7].forEach((i) => { H.extra.push({ p: [W.BANK_X[i], 20, 0], c: W.C.red, k: 2.4 * a * pulse, pool: 13, poolK: 0.9, refl: 0, size: 6 }); });
        H.extra.push({ p: [W.BANK_X[5], 20, 0], c: W.C.red, k: 2.4 * pulse, pool: 13, poolK: 0.9, refl: 0, size: 6 });
        H.update(lt, { alarm: 0.6 });
        const u = clamp(lt / ctx.T);
        const fov = W.camTop(camera, 60, 140 - 3 * u, 0, W.FOV[50], 2 + 3 * u);
        W.handheld(camera, t, 0.15, 61);
        camFX(camera, t, fov);
      },
    };
  },
});
