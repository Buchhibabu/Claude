// 89 iii-sweep — LIGHT BEFORE SOUND. Macro 85mm on the foreman's T4 front-left edge, pos (-20,71,-160) -> (-27,70,-173).
// A clay specular sweep strip (k14) races up the tier edge, its gleam raking across the black obsidian face and catching the
// stone-course grooves; 2 f clay-tinted flash. No sound at all.
// (The library sweep is a chain of r0.35 orbs, which at 15u through an 85mm lens become 200 px blobs; here the strip is a thin
//  soft line riding the same corner path, so the macro reads as a hot edge of light.)
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { THREE } = W;

const CX = -27.05, CZ = -172.95;   // T4 front-left corner, just proud of the stone
shot({
  id: 'iii-sweep', dur: beats(1, 150), act: 'III',
  music: B.still(),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.flash(0, 0.067, { color: '#D97757', peak: 0.45 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = B.litHall(scene, { floor: false, line: false, banks: false, pillars: false });
    // the strip: 40 short soft segments up the corner; brightness follows a moving head with a long tail
    const NS = 48, Y0 = 62, Y1 = 78;
    const segY = Array.from({ length: NS + 1 }, (_, i) => lerp(Y0, Y1, i / NS));
    const segs = Array.from({ length: NS }, (_, i) => { const l = W.fat([[CX, segY[i], CZ], [CX, segY[i + 1], CZ]], { color: W.C.clay, k: 0, width: 2.2 }); scene.add(l); return l; });
    const core = Array.from({ length: NS }, (_, i) => { const l = W.fat([[CX, segY[i], CZ], [CX, segY[i + 1], CZ]], { color: W.C.ivory, k: 0, width: 0.8 }); scene.add(l); return l; });
    // stone-course grooves on the T4 front face that catch the gleam
    const ys = [63, 67.5, 72];
    const grooves = ys.map((y) => { const g = W.fat([[CX + 0.05, y, CZ], [-14, y, CZ]], { color: W.C.clay, k: 0, width: 1.0 }); scene.add(g); return g; });
    const topEdge = W.fat([[CX, 74.15, CZ], [-12, 74.15, CZ]], { color: W.C.clay, k: 0, width: 1.6 }); scene.add(topEdge);
    const head = W.flare({ color: W.C.clay, k: 0, size: 1.6, ref: 0.02 }); scene.add(head);
    const gleam = new THREE.PointLight(W.C.clay, 0, 6, 2); scene.add(gleam);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.05, radius: 0.45, threshold: 0.78 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.foreman.update(lt, { lit: 0, rimColor: W.C.amber, rimK: 0.25 });
        const yh = lerp(64.6, 76.5, ease.inOut(clamp((lt - 0.02) / 0.34)));   // head crosses the frame (y 68.3..71.7) mid-shot
        for (let i = 0; i < NS; i++) {
          const ym = (segY[i] + segY[i + 1]) / 2, d = yh - ym;
          const v = d < 0 ? Math.exp(-d * d * 30) : Math.exp(-d / 2.2);
          segs[i].userData.set(14 * v); core[i].userData.set(9 * v * v);
        }
        grooves.forEach((g, i) => { const d = Math.abs(ys[i] - yh); g.userData.set(5 * Math.exp(-d * d / 2.5)); });
        topEdge.userData.set(6 * Math.exp(-Math.pow(yh - 74.15, 2) / 2));
        const hy = Math.min(yh, 76.5);
        head.position.set(CX, hy, CZ + 0.1); head.userData.set(14, W.C.clay);
        gleam.position.set(CX + 1.6, hy, CZ + 1.4); gleam.intensity = 55;
        H.update(lt, { sky: 1.4 });
        camFX(camera, t, W.camLook(camera, [-20, 71, -160], [-27, 70, -173], W.FOV[85]));
      },
    };
  },
});
