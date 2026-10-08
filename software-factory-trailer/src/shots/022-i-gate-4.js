// 22 · i-gate-4 — FPV 2.2x, 270-degree shutter: the drone banks into a carving roll as it threads MONTH gate 4
// (4 pips ride the top of frame), light streaks stretch, the clay beacon swells ahead through gate 5.
import { shot, beats, camFX } from '../engine.js';
import { W, T, gradeI, gateHall, gateSources, camGate, streaks, motes, lintelElev, kf, ease, clamp, lerp } from './lib/b3.js';

shot({
  id: 'i-gate-4', dur: beats(2), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 16, energy: 0.68, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0.5, 'B');
    ctx.sfx(0.25, 'whoosh', { gain: -4 });
    ctx.sfx(0.5, 'impact', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = gateHall(scene);
    const S = streaks({ seed: 41, k: 1.2, count: 520 }); scene.add(S.mesh);
    const M = motes({ count: 900, box: [-175, -120, 0.2, 18, -12, 12], color: W.C.ice, k: 1.6, size: 0.09, seed: 43 });
    scene.add(M.points);
    const PIPS = [1, 2, 3, 4, 5];
    return {
      scene, camera, ...gradeI({ bloom: { strength: 0.95, radius: 0.45, threshold: 0.78 } }),
      update(lt) {
        const t = T(ctx, lt);
        const hit = lt - 0.5;
        const flash = hit >= 0 ? Math.exp(-hit / 0.12) : 0;
        H.gates.gates.forEach((g, i) => g.update(lt, { lit: PIPS[i], k: i === 3 ? 3 + 5 * flash : 3, pipK: i === 3 ? 8 + 22 * flash : 8, counterK: 0.9 }));
        H.gates.gates[4].counter.visible = false;   // MONTH 5 is withheld until gate 5 locks it
        H.tower.update(lt, { count: 1000, k: 10, crest: 1, t });
        H.cursor.update(lt, { on: W.blink(t, { div: 2 }), k: 10 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.12 });
        H.beacon.userData.set(lerp(5.5, 7, lt));
        S.update(lerp(4.5, 6.5, ease.inOut(clamp(lt * 1.2))), 1.1);   // 270-degree shutter: long streaks
        M.update(t, { k: 1.4 });
        H.extra.length = 0; H.extra.push(...gateSources(H, PIPS, 6));
        H.update(lt, { sky: 1.6 });
        const track = lintelElev(Math.min(lt, 0.5), 4) - 21;
        const pitch = lt <= 0.5 ? track : lerp(track, 4, ease.inOut(clamp((lt - 0.5) / 0.32)));
        const roll = kf(lt, [[0, 0], [0.5, -28, ease.inOut], [0.85, 6, ease.inOut], [1, 2]]);
        const yaw = kf(lt, [[0, 1.5], [0.5, -2], [1, 0.5]]);
        camFX(camera, t, camGate(camera, lt, 4, { pitch, roll, yaw }));
      },
    };
  },
});
