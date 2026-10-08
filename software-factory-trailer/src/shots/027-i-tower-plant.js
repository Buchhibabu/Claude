// 27 · i-tower-plant — PLANT 2. 200mm from 350u out: the blazing code tower sits low-centre, and behind it — compressed into the
// same plane — the UNLIT foreman's stepped tiers stand as a dark wall three times its height, dead-brass seams barely catching
// the clay light. It reads as the hall's end wall. Slow lateral drift L->R; heat-haze motes hang in the long lens.
import { shot, beats, camFX } from '../engine.js';
import { W, THREE, T, gradeI, motes, towerHalo, ease, clamp, lerp } from './lib/b3.js';

shot({
  id: 'i-tower-plant', dur: beats(2), act: 'I',
  music: { section: 'act1', chord: 'Bb', div: 8, energy: 0.72, add: ['strings'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, banks: false } });
    const halo = towerHalo(scene);
    H.pillars.mesh.visible = false;                          // at 200mm a z=+-30 pillar would bisect the tower
    // long-lens air: motes between the lens and the tower, lit clay near it
    const M = motes({ count: 1600, box: [-40, 2, 4, 52, 10, 120], color: W.C.amber, k: 1.6, size: 0.16, seed: 271 });
    scene.add(M.points);
    return {
      scene, camera, ...gradeI({ bloom: { strength: 0.95, radius: 0.55, threshold: 0.8 } }),
      update(lt) {
        const t = T(ctx, lt);
        H.tower.update(lt, { count: 1000, k: 26, crest: 1, t, pulse: 0.22 });
        halo.update({ k: 1.25, h: 30, core: 2.6 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.45 });
        M.update(t, { k: 1.5, drift: [0.4, 0.5, 0] });
        H.update(lt, { sky: 3.2 });
        // 200mm, lateral drift L->R 1 u/s (+ the impact's settle)
        const x = -20.1 + 1.0 * lt;
        const fov = W.camPlant(camera, scene, [x, 15, 350], [x, 40, -200], W.FOV[200]);
        W.handheld(camera, t, 0.05, 27);
        camFX(camera, t, fov);
      },
    };
  },
});
