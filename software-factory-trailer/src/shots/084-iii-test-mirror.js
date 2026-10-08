// 84 iii-test-mirror — MIRROR of ii-test-tower (camTestWorm, Dutch 0): the TEST tower is now a lit amber column of flowing work
// with a rising chase of green check lamps; level horizon.
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

shot({
  id: 'iii-test-mirror', dur: beats(1, 150), act: 'III',
  music: B.act3('Bb', 0.87),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'impact', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = B.litHall(scene, { towers: { review: 400, test: 640 } });
    // dense check-lamp column: a green lamp every 3u on alternating front corners of the TEST tower, chasing upward on 16ths
    const N = 54;
    const L = W.orbs({ count: N, r: 0.42, seg: 10 }); scene.add(L.mesh);
    const lampPos = Array.from({ length: N }, (_, i) => [21 + (i % 2 ? 1.65 : -1.65), 5 + i * 3, i % 2 ? 1.1 : 1.1]);
    return {
      scene, camera, ...W.grade('III', { exposure: 0.9, bloom: { strength: 1.05, radius: 0.45, threshold: 0.8 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        B.litUpdate(H, lt, t, { foreman: 0, beam: 0.22 });
        H.towers.update(lt, { review: 160, test: 320, lit: 1, t, flow: 9 });
        const head = (lt / 0.4) * N * 1.15;   // chase climbs the column during the shot
        for (let i = 0; i < N; i++) {
          const d = head - i;
          const k = d < 0 ? 1.5 : 6 + 8 * Math.exp(-d * 0.6);
          L.set(i, { p: lampPos[i], c: W.lin(W.C.green), k });
        }
        L.commit();
        H.extra.length = 0;
        H.extra.push({ p: [21, 6, 1.5], c: W.C.green, k: 2.5, pool: 4, poolK: 0.8, refl: 0.8, size: 1 });
        H.update(lt);
        camFX(camera, t, W.camTestWorm(camera, lt, { dutch: 0 }));
      },
    };
  },
});
