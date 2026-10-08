import { shot, beats, kf, ease, camFX } from '../engine.js';
import * as G from '../kit/gl.js';
shot({
  id: 'test-3d', dur: beats(8), act: 1,
  three(ctx) {
    const { scene, camera } = G.stage({ fog: 0.02 });
    scene.add(G.grid({ y: -2, color: 0x2a2a33 }));
    const P = G.particles({ count: 3000, spread: [140, 50, 140], size: 0.3 });
    scene.add(P.points);
    const boxes = [];
    for (let i = 0; i < 12; i++) { const b = G.glowBox({ intensity: i === 6 ? 2.2 : 0.05 }); b.position.set((i - 6) * 3.2, -1.4, 0); scene.add(b); boxes.push(b); }
    const word = G.textPlane('THE LINE', { font: '900 160px "Inter Tight"', width: 14, color: '#f4f1ea' });
    word.position.set(0, 4, -6); scene.add(word);
    ctx.fx.bars(0, 0); ctx.fx.bars(0.6, 138);
    return {
      scene, camera, bloom: { strength: 1.1, threshold: 0.7 }, sat: 0.8, tint: [0.92, 0.98, 1.08],
      update(lt) {
        const p = kf(lt, [[0, [16, 1.2, 22]], [4, [4, 0.2, 9], ease.expoInOut]]);
        G.look(camera, p, [0, 0, 0], 38);
        camFX(camera, ctx.shot.start + lt, 38);
        boxes.forEach((b, i) => { b.userData.mat.emissiveIntensity = Math.max(0.05, 2.4 * Math.max(0, 1 - Math.abs(((lt * 4) % 12) - i))); });
      },
    };
  },
  ui(root, tl, K, ctx) {
    const a = K.text(root, { y: 540, cls: 'slam', html: 'The coding agent<br>was <span class="hot">one station.</span>' });
    K.slam(tl, a, 1.0); K.push(tl, a, 1.0, 3);
    ctx.fx.hit(1.0, 'S');
    ctx.sfx(1.0, 'impact');
    K.cutOut(tl, a, 3.0);
    const b = K.text(root, { y: 540, cls: 'cond', html: '16%' });
    K.giant(tl, b, 3.2); ctx.fx.glitch(3.2, 0.3, 1); ctx.sfx(3.2, 'braam', { root: 'A1' });
  },
});
