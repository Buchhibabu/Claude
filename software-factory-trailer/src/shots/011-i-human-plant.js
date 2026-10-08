// #11 i-human-plant — PLANT 1. 135mm across the hall: the tiny human (ice rim) stands in a pool of cold light at the one CODE
// station while the agent orb beside the screen sputters out on three ticks. Behind them, compressed by the lens and veiled
// in layered haze and slanting light, the unlit foreman's tiers stand as a dark stepped wall with dead-brass seams.
import { shot, beats, camFX, clamp, lerp } from '../engine.js';
import { W, THREE, atmo, foremanCourses, halo } from './lib/b2-act1a.js';

shot({
  id: 'i-human-plant', dur: beats(4), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 4, energy: 0.25, add: ['drone', 'ticks'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'tick', { gain: -8 });
    ctx.sfx(1.0, 'reverse_swell', { dur: 1.0, gain: -6 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { cursor: true, human: 'I' } });
    H.pillars.I.hide(9); H.pillars.I.hide(29); H.pillars.I.commit();     // the two pillars that would cut through the subject
    const cs = H.cursor.sources; H.cursor.sources = () => cs().map((s) => ({ ...s, refl: 0.6 }));
    const courses = foremanCourses({ k: 0.24, color: 0x6a5238 }); scene.add(courses);
    const back = halo({ w: 6, h: 5.5, color: 0xa9c6de, k: 0.55 }); back.position.set(-19.6, 1.3, 5.55); scene.add(back);
    const orb = W.orbs({ count: 1, r: 0.35, seg: 16 }); scene.add(orb.mesh);
    const orbFl = W.flare({ color: W.C.clay, k: 0, size: 3 }); orbFl.position.set(-15.4, 3.5, 4.8); scene.add(orbFl);
    const A = atmo(scene, H, {
      stationTop: 46, coneR: [0.6, 7.5], stationPos: [-19.6, 0, 3],
      shafts: [
        { x: -46, z: -46, r: 2.2, rTop: 1.0, op: 0.24, poolK: 1.5, from: [60, 200, 0], light: false },
        { x: 6, z: -96, r: 2.8, rTop: 1.3, op: 0.2, poolK: 1.5, from: [60, 200, 0], light: false },
      ],
      haze: [
        { x: -19.6, z: -30, ry: 0, w: 160, h: 18, k: 0.05, band: 0.5 },
        { x: -19.6, z: -75, ry: 0, w: 200, h: 26, k: 0.06, band: 0.5 },
        { x: -19.6, z: -120, ry: 0, w: 240, h: 34, k: 0.07, band: 0.55 },
      ],
      motesN: 300,
    });
    // agent orb: three dying flickers on the ticks (0 / 0.5 / 1.0), then out to 0.3
    const orbK = (lt) => {
      const base = lt < 0.5 ? 4 : lt < 1.0 ? 2.4 : lt < 1.5 ? 0.9 : 0.3;
      const ph = lt % 0.5, n = Math.floor(lt / 0.5);
      if (n > 2 || ph > 0.22) return base;
      const f = Math.floor(ph * 15);   // 2-frame step inside the flicker burst
      const pat = [[1.0, 0.15, 1.1, 0.25, 0.8], [0.9, 0.1, 0.05, 0.7, 0.1], [0.8, 0.05, 0.3, 0.0, 0.05]][n];
      return (n === 0 ? 5 : n === 1 ? 4 : 2.4) * (pat[f] ?? 1);
    };
    return {
      scene, camera, ...W.grade('I'),
      update(lt) {
        const t = ctx.shot.start + lt;
        const ok = orbK(lt);
        orb.set(0, { p: [-15.4, 3.5, 4.6], c: W.lin(W.C.clay), k: ok }); orb.commit();
        orbFl.userData.set(ok * 0.25);
        H.cursor.update(lt, { on: W.blink(t), k: 3 });
        H.human.update(lt, { rimK: 1.0 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.24, bounce: 1.0 });
        A.update(lt, t, { stationK: 1.0 });
        A.cone.userData.set(0.9, 0.085);
        H.extra.push({ p: [-15.4, 3.5, 4.6], c: W.C.clay, k: ok * 0.6, pool: 2, poolK: 1, refl: 0.6, size: 0.4 });
        H.update(lt, { sky: 3.2, pillarK: 0.45 });
        const pos = [-19.6, 3, 200 - 8 * clamp(lt / ctx.T)];
        W.camPlant(camera, scene, pos, [-19.6, 15.5, -200], W.FOV[135]);
        W.handheld(camera, t, 0.3, 2);
        camFX(camera, t, W.FOV[135]);
      },
    };
  },
});
