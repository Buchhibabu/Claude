// 37 ii-line-waits-1 — MASTER A. The queue becomes a tower: worm's-eye 18mm (camReviewWorm, Dutch -8) as the REVIEW stack shoots up
// out of frame into fog, cards slamming on in 16ths, red pinpoints blinking high above on 8ths. Refrain #1: THE LINE WAITS.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-line-waits-1', dur: beats(4), act: 'II',
  music: { section: 'act2', chord: 'C', div: 8, energy: 0.62, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -6 });
    ctx.sfx(0.1, 'bell', { gain: -12 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.009 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, towers: { review: 240, test: 240 } } });
    const BH = B.bulkhead({ top: 11 }); scene.add(BH.group);
    // the concertina queue at the input wall (from ii-review-slam)
    const WALLX = -8.4 - 0.35 - 1.55;
    const Q = W.cards({ count: 72 }); scene.add(Q.mesh);
    const rq = rand(3701);
    for (let i = 0; i < 72; i++) { const lane = i % 4, k = Math.floor(i / 4); Q.set(i, { p: [WALLX - (k % 3) * 3.08 - rq() * 0.2, 3.45 + Math.floor(k / 3) * 0.52, -3.3 + lane * 2.2], r: [0, (rq() - 0.5) * 0.15, (rq() - 0.5) * 0.05], edge: W.CARD.edge(1.2), body: W.CARD.body(0.6) }); }
    Q.commit();
    // cold rim from high behind the tower so its striped column reads against the fog
    const rimL = new THREE.DirectionalLight(C.ice, 1.4); rimL.position.set(20, 80, -60); scene.add(rimL);
    const pool = W.shaft({ rTop: 0.8, rBot: 7, h: 70, color: C.ice, k: 1, opacity: 0.07, top: 0.2, bottom: 1, apexFade: 0.3 });
    W.aimShaft(pool, [1.4, 70, -2], [1.4, 3, 0]); scene.add(pool);

    return {
      scene, camera, ...W.grade('II'),
      update(lt) {
        const t = ctx.shot.start + lt;
        // the queue shoots up: 40 -> 160 cards in 16th-note slams over 0.75 s, then creeps (+1 per 16th)
        const steps = Math.floor(lt / 0.125), within = lt - steps * 0.125;
        const grow = (s) => (s < 6 ? lerp(40, 160, ease.out((s + 1) / 6)) : 160 + (s - 5));
        const prev = steps === 0 ? 40 : grow(steps - 1), cur = grow(steps);
        const review = lerp(prev, cur, ease.out(clamp(within / 0.06)));
        const jolt = Math.exp(-within * 30) * 0.06;
        H.towers.update(lt, { review, test: 200 + 4 * lt, t, shake: jolt });
        BH.update(lt, { edgeK: 1.2, slotK: 2.2, pin: W.blink(t, { div: 2 }), t });
        H.line.update(lt, { lit: 0, red: [0, 0, 0, 0.6, 0.25, 0, 0], dim: 0.45 });
        H.extra.length = 0;
        H.extra.push(...BH.sources(W.blink(t, { div: 2 })));
        H.update(lt, { sky: 2.2 });
        camFX(camera, t, W.camReviewWorm(camera, lt, { dur: ctx.T, t, handheld: 0.3 }));
      },
    };
  },
  ui(root, tl, K, ctx) {
    B.refrain(root, tl, K, { html: 'THE LINE WAITS.', at: 0.1, out: 1.6 });
  },
});
