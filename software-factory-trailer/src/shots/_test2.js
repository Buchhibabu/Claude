import { shot, beats, kf, ease, camFX, rand } from '../engine.js';
import * as G from '../kit/gl.js';
const { THREE } = G;
shot({
  id: 'test2', dur: beats(8), act: 'I', music: { section: 'act1' },
  three(ctx) {
    const { scene, camera } = G.stage({ fog: 0.018 });
    scene.add(G.grid({ cell: 2, color: 0x2a2a34 }));
    const N = 1600, I = G.instanced({ count: N, basic: true, color: 0xffffff });
    const r = rand(5);
    for (let i = 0; i < N; i++) {
      const x = (i % 40) - 20, z = -Math.floor(i / 40) * 1.6;
      const hot = r() < 0.08;
      I.set(i, { p: [x * 1.6, 0.3, z], s: [1.1, 0.6, 0.9], c: hot ? G.COL.clay : 0x1a1c22, k: hot ? 4 : 1 });
    }
    I.commit(); scene.add(I.mesh);
    const man = G.human({ h: 1.8 }); man.position.set(0, 0, 6); scene.add(man);
    const curves = [G.spline([[-30, 4, -40], [-6, 3, -10], [0, 2.2, 4], [20, 6, 20]]), G.spline([[30, 5, -40], [6, 3, -10], [0, 2.4, 4], [-20, 6, 20]])];
    const F = G.flow({ curves, count: 1500, speed: 0.12, size: 0.22, color: G.COL.ice }); scene.add(F.points);
    const panel = G.canvasPlane({ w: 4, h: 2.4, glow: true, draw: (g, w, h, t) => G.drawCode(g, w, h, { seed: 3, reveal: Math.min(1, t / 3), bg: 'rgba(10,10,14,0.85)', t }) });
    panel.position.set(0, 2.2, 3.5); scene.add(panel);
    const ring = G.ring({ r: 1.2, color: G.COL.gold, k: 5 }); ring.position.set(0, 2.2, 3.4); scene.add(ring);
    return { scene, camera, bloom: { strength: 1.1, radius: 0.5, threshold: 0.75 },
      update(lt) {
        F.update(lt);
        panel.userData.redraw(lt);
        G.look(camera, kf(lt, [[0, [0, 1.2, 12]], [4, [3, 6, 14], ease.inOut]]), [0, 1.8, 0], 44.6);
        camFX(camera, ctx.shot.start + lt, 44.6);
      } };
  },
});
