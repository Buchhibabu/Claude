// 35 ii-funnel-top — the same problem as geometry. TOP-DOWN 50mm over the CODE/REVIEW seam: a 12-lane river of cards (streaks at 30u/s)
// narrows into REVIEW's single-lane slot and piles up into a widening delta; exactly one card passes per beat, on the tick.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-funnel-top', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Bb', div: 8, energy: 0.62, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'tick', { gain: -6 });
    ctx.sfx(0.5, 'tick', { gain: -6 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.004 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, pillars: false } });
    const BH = B.bulkhead({ top: 11 }); scene.add(BH.group);
    const LEC = B.lectern(); scene.add(LEC.group);
    // CODE deck lane lights (as in ii-fpv-launch)
    const lanesG = [];
    for (let k = 0; k < 7; k++) { const z = -4.5 + k * 1.5; lanesG.push([[-30.0, 3.03, z], [-9.2, 3.03, z]]); }
    for (let k = 0; k < 15; k++) { const x = -29.6 + k * 1.45; lanesG.push([[x, 3.03, -4.8], [x, 3.03, 4.8]]); }
    const deck = W.glowSegs(lanesG, { color: C.clay, k: 1.3, width: 1.4 }); scene.add(deck);

    // funnel walls: ice hairlines from the deck's full width into the slot
    const GX = -9.05, SLOT = 1.2;
    const wf = (x) => lerp(1, SLOT / 4.6, B.smooth(-31, GX, x));
    const wall = [];
    for (const sgn of [-1, 1]) { let prev = null; for (let k = 0; k <= 24; k++) { const x = lerp(-34, GX, k / 24); const p = [x, 3.25, sgn * (4.6 * wf(x) + 0.35)]; if (prev) wall.push([prev, p]); prev = p; } }
    const walls = W.glowSegs(wall, { color: C.ice, k: 2.2, width: 2 }); scene.add(walls);

    // ---- river: 12 lanes, per-lane pile (delta) + elements in flight
    const NL = 12, N0 = 60, RATE = 30, V = 30, X0 = -44;
    const r = rand(3501);
    const els = [];
    for (let j = 0; j < NL; j++) {
      const zj = (j - (NL - 1) / 2) / ((NL - 1) / 2);
      const total = N0 + RATE * 1.0 + 26;
      for (let k = 0; k < total; k++) {
        const row = k, col = 0;
        const xs = GX - 0.5 - row * 0.18 - Math.abs(zj) * row * 0.03 + (r() - 0.5) * 0.1;
        const v = V * (0.9 + 0.2 * r());
        const ta = (k - N0) / RATE + (r() - 0.5) * 0.02;   // arrival time at its pile slot
        const te = ta - (xs - X0) / v;
        const hw = Math.min(4.6 * wf(xs), 1.25 + row * 0.07);   // delta: widens away from the slot, bounded by the funnel walls
        const zs = zj * hw + (r() - 0.5) * 0.08;
        els.push({ j, zj, xs, zs, v, ta, te, row, lz: (r() - 0.5) * 0.25 });
      }
    }
    const N = els.length;
    const S = B.streaks(N, { color: C.ivory, k: 1.8, width: 1.7, colors: true }); scene.add(S.mesh);
    // one card per beat through the slot
    const ONE = W.cards({ count: 3 }); scene.add(ONE.mesh);
    const haze = W.swarmHaze({ count: 1200, spread: [34, 1.5, 11], center: [-22, 3.6, 0], color: C.ice, size: 0.09, k: 1.0, seed: 352 });
    scene.add(haze.points);

    const cMove = [0.9, 0.92, 0.95], cPile = [0.3, 0.34, 0.4], cHot = [0.62, 0.66, 0.74];
    return {
      scene, camera, ...W.grade('II', { bloom: { strength: 0.7, radius: 0.4, threshold: 0.85 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        for (let i = 0; i < N; i++) {
          const e = els[i];
          if (lt < e.te) { S.hide(i); continue; }
          if (lt >= e.ta) {
            const press = Math.exp(-e.row * 0.12);
            const c = e.row < 6 ? cHot : cPile;
            S.set(i, [e.xs + 0.13, 3.42, e.zs], [e.xs - 0.13, 3.42, e.zs], [c[0] * (0.6 + 0.4 * press), c[1] * (0.6 + 0.4 * press), c[2] * (0.6 + 0.4 * press)]);
            continue;
          }
          const x = X0 + e.v * (lt - e.te);
          const z = e.zj * 4.6 * wf(x) + e.lz * wf(x);
          S.set(i, [x, 3.45, z], [x - 1.35, 3.45, e.zj * 4.6 * wf(x - 1.35) + e.lz * wf(x - 1.35)], cMove);
        }
        S.commit();
        // the one card per beat: squeezes through at -0.5 / 0.0 / 0.5 and crawls at human speed
        let slotFlash = 0;
        for (let k = 0; k < 3; k++) {
          const d = lt - (k - 1) * 0.5;
          if (d < -0.1) { ONE.hide(k); continue; }
          slotFlash = Math.max(slotFlash, Math.exp(-Math.abs(d) * 12));
          const x = d < 0 ? -10.4 + 3.3 * ease.inOut(clamp((d + 0.1) / 0.1)) : -7.1 + 2.2 * d;
          ONE.set(k, { p: [x, 3.45, 0], r: [0, 0, 0], edge: W.CARD.edge(2.2), body: W.CARD.body(1.0) });
        }
        ONE.commit();
        BH.update(lt, { edgeK: 1.6, slotK: 2.5 + 5 * slotFlash, pin: W.blink(t, { div: 2 }), t });
        LEC.update(lt, { on: W.blink(t, { div: 0.5 }), k: 3 });
        deck.userData.set(1.3 + 0.5 * W.beatPulse(t, { div: 2 }));
        H.line.update(lt, { lit: 0, dim: 0.5, red: [0, 0, 0, 0.45, 0, 0, 0] });
        H.extra.length = 0;
        H.update(lt);
        const fov = W.camTop(camera, -6, 60, 0, W.FOV[50]);
        W.handheld(camera, t, 0.3, 35);
        camFX(camera, t, fov);
      },
    };
  },
});
