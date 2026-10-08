// iii-bank-7 — WORM'S-EYE 18mm straight up bank 7's beam: the panel slams on through the fog at dead centre, thousands of dust motes
// catch around it, bank 6 (lit) and bank 8 (still dark) flank it in the ceiling grid and the pillars converge on the zenith.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';

shot({
  id: 'iii-bank-7', dur: beats(1, 150), act: 'III',
  music: { section: 'turn', chord: 'Bb', div: 8, energy: 0.7899999999999999, add: ['strings', 'pulse', 'kick', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'boom', { gain: 0 });
    const { scene, camera } = B.cascadeStage(7, { fog: 0.005 });
    const H = W.hall(scene, { state: 'dark', parts: { foreman: false } });
    // (50, 0.5, 2) sits in the 1.2u gap between the DEPLOY and OPERATE boxes: their side walls would fill the frame, and the floor is behind us
    H.line.group.visible = false; H.floor.mesh.visible = false;
    const motes = B.beamMotes({ x: 50, count: 2600, size: 0.06, seed: 71 }); scene.add(motes.points);
    const grade = W.bankGrade(7);
    grade.bloom = { strength: 1.0, radius: 0.4, threshold: 0.82 };
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      const on = B.cascade(H, 7, lt, t, { beam: 0.6 });
      const o = on[6];
      motes.update(t, o * 1.1);
      // keep motes out of the lens (near ones would read as giant discs)
      const P = motes.positions; for (let i = 0; i < P.length; i += 3) if (P[i + 1] < 9) P[i] = 1e5;
      motes.geometry.attributes.position.needsUpdate = true;
      H.update(lt, { lit: B.hallLit(7, on), sky: 0.3 });
      // straight up from (50, 0.5, 2); screen right = +x (flow L->R), slow 5-degree corkscrew + slight rise
      const a = (-2.5 + 12.5 * lt) * Math.PI / 180;
      camera.up.set(Math.sin(a), 0, Math.cos(a));
      camera.position.set(50, 0.5 + 1.5 * lt, 2); camera.lookAt(50, 60, 2.0001);
      if (camera.fov !== W.FOV[18]) { camera.fov = W.FOV[18]; camera.updateProjectionMatrix(); }
      camFX(camera, t, W.FOV[18]);
    } };
  },
});
