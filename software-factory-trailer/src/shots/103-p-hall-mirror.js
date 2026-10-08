// 103 p-hall-mirror — BOOKEND of i-hall-wide: the camHallWide framing, no handheld. The lone Act I station is now one of hundreds of lit
// points down the hall (pillar beacons, flowing rail network, lit stations), banks blazing, the clay cursor still blinking (8ths).
import { shot, beats, camFX } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

shot({
  id: 'p-hall-mirror', dur: beats(1, 150), act: 'III',
  music: B.peak('Bb', 0.95),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = B.litHall(scene, { cursor: true, rails: true, threads: true });
    const P = B.pillarBeacons({ per: 6, k: 4 }); scene.add(P.mesh);
    const F = B.lineFlow({ count: 3000, lanes: 7, speed: 30, k: 5, size: 0.5, width: 8 }); scene.add(F.points);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.15, radius: 0.5, threshold: 0.76 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        B.litUpdate(H, lt, t, { foreman: 5, beam: 0.45, foremanOpts: { hourRing: 18 } });
        H.rails.update(lt, { cascade: 99, flow: 30, t, k: 4 });
        H.threads.update(lt, { t, k: 2.6 });
        H.cursor.update(lt, { on: W.blink(t, { bpm: 150, div: 2 }), k: 10 });
        P.update(t);
        F.update(t);
        H.update(lt);
        camFX(camera, t, W.camHallWide(camera, lt, { dur: ctx.T, t, handheld: 0 }));
      },
    };
  },
});
