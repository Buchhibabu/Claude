// 20 · i-gate-3 — FPV 1.7x through MONTH gate 3 (3 pips). The drone whips its nose up to read the lintel as it
// passes overhead on the hit, then tips back down onto gate 4 and the growing clay tower ahead.
import { shot, beats, camFX } from '../engine.js';
import { W, T, gradeI, gateHall, gateSources, camGate, streaks, motes, lintelElev, kf, ease, clamp, lerp, TOWER } from './lib/b3.js';

shot({
  id: 'i-gate-3', dur: beats(2), act: 'I',
  music: { section: 'act1', chord: 'C', div: 16, energy: 0.62, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0.5, 'B');
    ctx.sfx(0.25, 'whoosh', { gain: -4 });
    ctx.sfx(0.5, 'impact', { gain: -9 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = gateHall(scene);
    const S = streaks({ seed: 23, k: 0.8, count: 320 }); scene.add(S.mesh);
    const M = motes({ count: 900, box: [-215, -150, 0.2, 18, -12, 12], color: W.C.ice, k: 1.6, size: 0.09, seed: 31 });
    scene.add(M.points);
    const PIPS = [1, 2, 3, 4, 5];
    return {
      scene, camera, ...gradeI({ bloom: { strength: 0.9, radius: 0.45, threshold: 0.78 } }),
      update(lt) {
        const t = T(ctx, lt);
        const hit = lt - 0.5;
        const flash = hit >= 0 ? Math.exp(-hit / 0.12) : 0;
        H.gates.gates.forEach((g, i) => g.update(lt, { lit: PIPS[i], k: i === 2 ? 3 + 5 * flash : 3, pipK: i === 2 ? 8 + 22 * flash : 8, counterK: 0.9 }));
        H.tower.update(lt, { count: lerp(TOWER.gate3[0], TOWER.gate3[1], clamp(lt)), k: 10, crest: 0, t });
        H.cursor.update(lt, { on: W.blink(t, { div: 2 }), k: 10 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.12 });
        H.gates.gates[4].counter.visible = false;   // MONTH 5 is withheld until gate 5 locks it
        H.beacon.userData.set(4.5);
        S.update(2.2, 0.8);
        M.update(t, { k: 1.4 });
        H.extra.length = 0; H.extra.push(...gateSources(H, PIPS, 6));
        H.update(lt, { sky: 1.6 });
        // nose up to keep gate 3's lintel in frame as it passes overhead, then tip back down onto gate 4
        const track = lintelElev(Math.min(lt, 0.5), 3) - 19;          // lintel rides the upper frame through the pass
        const pitch = lt <= 0.5 ? track : lerp(track, 6, ease.inOut(clamp((lt - 0.5) / 0.36)));
        const roll = kf(lt, [[0, -2], [0.5, 4], [1, -3]]);
        camFX(camera, t, camGate(camera, lt, 3, { pitch, roll }));
      },
    };
  },
});
