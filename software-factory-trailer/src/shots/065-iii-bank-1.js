// iii-bank-1 — LIGHTS ON + TEMPO LIFT. Bank 1 (PLAN end) slams on. Frame 0 looks straight up into its lamp panel at frame centre
// (the shape match with the drop's lone cursor), then the camera whip-tilts down into the dead-centre one-point aisle (camAisle):
// the beam cuts the fog, the first pillars catch its light, the alarm red is gone everywhere.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE } = W;

shot({
  id: 'iii-bank-1', dur: beats(1, 150), act: 'III',
  music: { section: 'turn', chord: 'Bb', div: 8, energy: 0.61, add: ['strings', 'pulse', 'kick', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'boom', { gain: -2 });
    ctx.sfx(0, 'riser', { dur: 3.2, gain: -6 });
    const { scene, camera } = B.cascadeStage(1);
    const H = W.hall(scene, { state: 'dark', parts: {} });
    const pl = new THREE.PointLight(W.C.amber, 0, 150, 1.1); pl.position.set(-70, 30, 0); scene.add(pl);
    const pool = B.warmPool({ w: 26, d: 22, color: W.C.amber, k: 0, soft: 0.6 }); pool.position.x = -70; scene.add(pool);
    const motes = B.beamMotes({ x: -70, count: 900, size: 0.16, seed: 31 }); scene.add(motes.points);
    const shaft = W.shaft({ rTop: 6, rBot: 10.5, h: 58, color: W.C.amber, k: 2.4, opacity: 0, top: 1.0, bottom: 0.55, apexFade: 0.05 });
    shaft.position.set(-70, 30.6, 0); scene.add(shaft);
    const P0 = [-90, 0.5, 0];
    const up = Math.atan2(59.6 - 0.5, 20), down = Math.atan2(19.5, 150);
    const grade = W.bankGrade(1);
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      const on = B.cascade(H, 1, lt, t);
      pl.intensity = 700 * on[0];
      pool.userData.set(0.5 * on[0]);
      shaft.userData.set(undefined, 0.42 * on[0]);
      motes.update(t, on[0]);
      H.foreman.update(lt, { lit: 0 });
      H.update(lt, { lit: B.hallLit(1, on), sky: 0.5 });
      // hold 2 f on the panel, whip-tilt down over ~7 f, settle into the aisle
      const u = ease.inOut(clamp((lt - 0.06) / 0.24));
      const p = lerp(up, down, u);
      const tg = [P0[0] + Math.cos(p) * 100, P0[1] + Math.sin(p) * 100, 0];
      W.camLook(camera, P0, tg, W.FOV[14]);
      grade.exposure = lerp(1.0, 0.95, u);
      camFX(camera, t, W.FOV[14]);
    } };
  },
});
