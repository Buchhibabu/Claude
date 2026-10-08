// 90 iii-five-five — Fragment 2, the delayed boom (BRAAM #3, tier-S). Macro 85mm on the brass "5.5" engraved in T4's front face
// (0,64,-172.8): the numerals catch the clay sweep at local 0.1 and stay half lit. 2% push.
// (Camera backed off from z -160 to z -124 on the same axis: at 13u an 85mm frame is 3u tall and the 8u numerals cannot be read.)
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { THREE } = W;

shot({
  id: 'iii-five-five', dur: beats(2, 150), act: 'III',
  music: B.act3('D', 0.9),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'S');
    ctx.sfx(0, 'braam', { root: 'A1', gain: -2 });
    ctx.sfx(0, 'impact', { gain: 0 });
    ctx.sfx(0, 'sub_drop', { gain: -2 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = B.litHall(scene, { floor: false, line: false, banks: false, pillars: false });
    const F = H.foreman;
    // engraved relief: a dark-ember bevel copy just behind/below the brass numerals
    const bev = W.text3D('5.5', { height: 8, color: W.C.ember, k: 0, font: '300 220px "Inter Tight"', letterSpacing: 6 });
    bev.position.set(0.22, 63.75, -172.86); scene.add(bev);
    // engraved plaque rules above / below
    const rules = [59.2, 69.4].map((y) => { const l = W.fat([[-12, y, -172.85], [12, y, -172.85]], { color: W.C.brass, k: 0, width: 1.6 }); scene.add(l); return l; });
    const gleam = new THREE.PointLight(W.C.clay, 0, 16, 1.8); scene.add(gleam);
        return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.1, radius: 0.5, threshold: 0.78 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const on = clamp((lt - 0.1) / 0.12);                     // numerals catch the light from 0.1
        const sx = lerp(-0.25, 1.25, ease.out(clamp((lt - 0.1) / 0.6)));   // sweep band crosses L->R
        const base = 0.55 * on + 0.35 * clamp((sx - 0.2) / 0.8);  // "half lit": the passed half keeps a warm glow
        F.update(lt, { lit: 0, rimColor: W.C.amber, rimK: 0.3, engrave: { k: base, x: sx, width: 0.14, gain: 3.2 * on } });
        bev.userData.set(0.28 * on * (0.4 + Math.exp(-Math.pow((sx - 0.5) * 2.2, 2))), W.C.ember);
        rules.forEach((r) => r.userData.set(on * (0.4 + 2.2 * Math.exp(-Math.pow((sx - 0.5) * 2.5, 2)))));
        gleam.position.set(lerp(-14, 14, clamp(sx)), 64, -169.5); gleam.intensity = 70 * on;
        H.update(lt, { sky: 2 });
        const d = 48.8 * (1 - 0.02 * clamp(lt / ctx.T));
        camFX(camera, t, W.camLook(camera, [3 * d / 48.8, 65, -172.8 + d], [0, 64.2, -172.8], W.FOV[85]));
      },
    };
  },
});
