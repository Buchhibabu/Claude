// 24 · i-gate-5 — the last gate. The drone brakes hard (3x, expo out) and flares up into the threshold; 'MONTH 5' hangs in
// the opening and LOCKS on the tick (stamp + gleam + 5th pip ignites); the square opening closes onto the clay tower ahead
// (shape match into i-ledger-rise).
import { shot, beats, camFX } from '../engine.js';
import { W, T, gradeI, gateHall, gateSources, camGate, streaks, motes, kf, ease, clamp, lerp } from './lib/b3.js';

shot({
  id: 'i-gate-5', dur: beats(1), act: 'I',
  music: { section: 'act1', chord: 'A', div: 16, energy: 0.72, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0.25, 'B');
    ctx.sfx(0, 'whoosh', { gain: -4 });
    ctx.sfx(0.25, 'tick', { gain: -2 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = gateHall(scene, { counterScale: 0.6 });
    const S = streaks({ seed: 51, k: 1.0, count: 420, x0: -170, x1: -60 }); scene.add(S.mesh);
    const M = motes({ count: 900, box: [-150, -128, 0.2, 16, -10, 10], color: W.C.ice, k: 1.6, size: 0.07, seed: 53 });
    scene.add(M.points);
    const G5 = H.gates.gates[4], CTR = G5.counter;
    const GX = W.GATE_X[4];
    // brake: 48 u/s with k 6 -> 7.6u of travel, stopping 5u short of the gate plane
    const K = 6, SP = 48, D0 = 12.6;
    const xAt = (lt) => GX - D0 + (SP / K) * (1 - Math.exp(-K * lt));
    return {
      scene, camera, ...gradeI({ bloom: { strength: 0.95, radius: 0.45, threshold: 0.78 } }),
      update(lt) {
        const t = T(ctx, lt);
        const dl = lt - 0.25;                         // the lock
        const lock = dl >= 0 ? 1 : 0;
        const flash = dl >= 0 ? Math.exp(-dl / 0.06) : 0;
        H.gates.gates.forEach((g, i) => { if (i < 4) g.update(lt, { lit: i + 1, k: 3, counterK: 0.9 }); });
        G5.update(lt, { lit: 4 + W.ignite(dl), k: 3 + 2 * flash, pipK: 8 + 10 * flash, counterK: lock ? 0.7 + 0.5 * flash : 0.26 + 0.04 * Math.sin(lt * 90) });
        // stamp: 1.12 -> 1.0 in 3 frames; gleam sweeps the glyphs
        const sc = 0.6 * (lock ? lerp(1.12, 1, ease.out(clamp(dl / 0.1))) : 1);
        CTR.scale.setScalar(sc);
        CTR.userData.sweep(lock ? lerp(-0.2, 1.2, clamp(dl / 0.18)) : -9, 0.08, 1.2);
        H.tower.update(lt, { count: 1000, k: 10, crest: 1, t });
        H.cursor.update(lt, { on: W.blink(t, { div: 2 }), k: 10 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.12 });
        H.beacon.userData.set(lerp(7, 9, lt * 2));
        const v = SP * Math.exp(-K * lt);             // current speed -> streak length
        S.update(Math.max(0.05, v * 0.11), 1.0);
        M.update(t, { k: 1.4 });
        H.extra.length = 0; H.extra.push(...gateSources(H, [1, 2, 3, 4, 5], 6));
        H.update(lt, { sky: 1.6 });
        const u = ease.out(clamp(lt / 0.5));
        const pitch = lerp(21, 11, u), y = lerp(1.2, 4.4, u);
        const roll = kf(lt, [[0, 3], [0.3, -1.5], [0.5, 0]]);
        camFX(camera, t, camGate(camera, lt, 5, { x: xAt(lt), y, pitch, roll }));
      },
    };
  },
});
