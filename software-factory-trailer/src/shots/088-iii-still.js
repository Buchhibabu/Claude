// 88 iii-still — STILLNESS. Locked low at (0,1.5,-60) facing the dark foreman (0,40,-200), 1u linear creep (no ease). The lit hall
// behind the camera throws amber across an empty, drained floor running to the dark centre-back, where the foreman stands as a black
// stepped silhouette against warm haze, still unlit, filling the upper frame. Nothing moves except the creep.
// (24mm instead of the listed 35mm: at 35mm from this position the frame is filled edge to edge by T1/T2's faces and no stepped
//  outline or floor reads; 24mm keeps the same position/target and shows the stepped profile rising out of frame + the floor.)
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

shot({
  id: 'iii-still', dur: beats(1, 150), act: 'III',
  music: B.still(),
  three(ctx) {
    ctx.fx.bars(0, 0);
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0048 });
    const H = B.litHall(scene, {});
    // warm haze BEHIND the silhouette (the far hall, lit) so the stepped mass reads as a cut-out
    const halo = W.flare({ color: W.C.amberRail, k: 7, size: 520, fog: false, ref: 4 }); halo.position.set(0, 70, -520); scene.add(halo);
    const halo2 = W.flare({ color: W.C.ember, k: 3, size: 900, fog: false, ref: 4 }); halo2.position.set(0, 20, -700); scene.add(halo2);
    // light from the lit hall behind camera: long warm shafts raking over the lens down onto the drained floor
    [[-52, 0.22], [-18, 0.3], [16, 0.28], [50, 0.2]].forEach(([x, op]) => {
      const s = W.shaft({ rTop: 2.5, rBot: 13, h: 200, color: W.C.amber, k: 1.6, opacity: op, top: 1.0, bottom: 0.45, apexFade: 0.02 });
      W.aimShaft(s, [x * 0.5, 66, 10], [x, 0, -132]); scene.add(s);
    });
    // spill pools on the floor in front (amber), brightest where the shafts land
    H.extra.push(
      { p: [-18, 14, -128], c: W.C.amber, k: 14, pool: 9, poolK: 1, refl: 0, size: 6 },
      { p: [16, 14, -128], c: W.C.amber, k: 14, pool: 9, poolK: 1, refl: 0, size: 6 },
      { p: [-52, 14, -128], c: W.C.amber, k: 10, pool: 9, poolK: 1, refl: 0, size: 6 },
      { p: [50, 14, -128], c: W.C.amber, k: 10, pool: 9, poolK: 1, refl: 0, size: 6 },
      { p: [0, 30, -90], c: W.C.amber, k: 8, pool: 26, poolK: 0.8, refl: 0, size: 10 },
      { p: [0, 60, -420], c: W.C.amberRail, k: 30, pool: 0, refl: 0.9, size: 60 },   // the far haze reflected in the glossy floor
    );
    const P = B.motes({ count: 1500, center: [0, 12, -100], spread: [100, 24, 70], k: 2.2, size: 0.16, rise: 0.0 }); scene.add(P.points);
    P.update(0);
    return {
      scene, camera, ...W.grade('III', { exposure: 0.85, vignette: 0.5, bloom: { strength: 1.1, radius: 0.55, threshold: 0.72 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        B.litUpdate(H, lt, t, { foreman: 0, rim: 0.6, foremanOpts: { bounce: 0.12 } });
        H.update(lt, { sky: 6 });
        const u = clamp(lt / ctx.T);
        camFX(camera, t, W.camLook(camera, [0, 1.5, -60 - u], [0, 40, -200], W.FOV[24]));
      },
    };
  },
});
