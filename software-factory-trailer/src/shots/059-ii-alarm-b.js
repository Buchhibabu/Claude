// 59 ii-alarm-b — cut 2 of 4 (0.25 s, luminance-matched). SIDE 24mm from (-20, 30, 80) onto (-20, 40, 0), centred between banks 3 and 4:
// the dimmed code tower stands dead centre, the 600u REVIEW column rises to its right, banks 1-2 already burn red at frame left.
// Frame 1: banks 3-4 flick to red alarm and their beams cut down onto DESIGN and CODE, bracketing the tower.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

shot({
  id: 'ii-alarm-b', dur: beats(0.5), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 32, energy: 0.93, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { fog: 0.0045 });
    ctx.sfx(0, 'boom', { gain: -6 });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, towers: { review: 1200, test: 640, deploy: 240 } } });
    const FL = [0, 1, 0.3, 1, 1, 1, 1, 1];
    // banks 3-4's alarm beams, drawn hotter than the library's subtle alarm shaft so they visibly cut down onto DESIGN / CODE
    const shafts = [2, 3].map((i) => { const m = W.shaft({ rTop: 5.5, rBot: 9.5, h: 58, color: W.C.red, k: 1.4, opacity: 0, top: 1.0, bottom: 0.5, apexFade: 0.04 }); m.position.set(W.BANK_X[i], 30.6, 0); scene.add(m); return m; });
    const g = B.grade2({ vignette: 0.6, exposure: 0.6 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const a = B.frameTab(lt, FL);
        H.banks.update(lt, { on: 0, alarm: [1, 1, a, a, 0, 0, 0, 0], t, beam: 5, dust: 1 });
        const pulse = lerp(0.6, 1, 0.5 + 0.5 * Math.cos((t / 0.5) * Math.PI * 2));
        shafts.forEach((m) => m.userData.set(undefined, 0.3 * a * (0.75 + 0.25 * pulse)));
        H.tower.update(lt, { count: 1000, k: 4.5, t: t - lt, pulse: 0.05 });     // stalled since ii-jam-code: frozen, dim
        H.towers.update(lt, { review: 1200, test: 640, deploy: 240, t });
        H.line.update(lt, { lit: 0, dim: 0.3, red: 1 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.red, rimK: 0.2 });
        H.update(lt, { sky: 2.2, alarm: 0.5 });
        const u = clamp(lt / ctx.T);
        const fl = B.impulse(lt, 1 / 30, 0.06);
        W.camLook(camera, [-27 + 1.2 * u, 30 - 0.15 * fl, 80 - 1.5 * u], [-20, 40 - 0.1 * fl, 0], W.FOV[24]);   // x -27: keeps the near pillar row off the tower
        W.handheld(camera, t, 0.25, 59);
        camFX(camera, t, W.FOV[24]);
      },
    };
  },
});
