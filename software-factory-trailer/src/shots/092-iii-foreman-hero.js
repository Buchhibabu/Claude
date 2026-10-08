// 92 iii-foreman-hero — THE FOREMAN (#1 hero frame). Low-angle 14mm at (0,2,-40) (1% of the monument's height), dead-centre symmetry,
// verticals kept parallel by lens shift (pitch +8 deg, image shifted up), 3% push + 12 deg orbit, linear, zero handheld.
// From local 0 its brass seams light RADIALLY from the clay core (120 u/s: obelisk corners first, then T4 -> T1, ~1.6 s), the 4 crest
// beams descend at 0.8, the 12 primary threads unfurl from the core (a crown of rays out of frame top, toward the sub-leads over the
// line), the human at its foot (amber rim, 1:109) raises the light-card brief; at 1.2 it lifts off and rides the centre thread up into
// the core as one bright mote; the core pulses on arrival.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';

const LIT0 = 0.2;      // continues the wavefront begun in iii-core-ignite
const ARRIVE = 2.15;   // brief mote reaches the core
shot({
  id: 'iii-foreman-hero', dur: beats(6, 150), act: 'III',
  music: B.act3('D', 0.95),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'boom', { gain: 0 });
    ctx.sfx(0, 'impact', { gain: -6 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0036 });
    const H = B.litHall(scene, { threads: true });
    const hu = W.humanAnchor({ act: 'III', brief: true, facing: Math.PI }); scene.add(hu.group);
    // air: warm motes between lens and monument (depth + parallax under the orbit)
    const M = B.motes({ count: 1400, center: [0, 30, -90], spread: [150, 60, 90], k: 0.9, size: 0.2, rise: 0.8, seed: 921 }); scene.add(M.points);
    // a restrained warm bloom of air behind the obelisk only (the frame stays ~65% near-black)
    const halo = B.glow({ color: W.C.amberRail, k: 0.10, size: 420 }); halo.position.set(0, 150, -560); scene.add(halo);
    // wet-floor reflections of the lit tiers (vertical streaks under each terrace seam, the core's long column)
    const REFL = [[-50, 18.3, -139.8], [-25, 18.3, -139.8], [0, 18.3, -139.8], [25, 18.3, -139.8], [50, 18.3, -139.8], [-36, 36.3, -151.8], [0, 36.3, -151.8], [36, 36.3, -151.8], [0, 54.3, -162.8], [0, 74.3, -172.8]];
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.3, radius: 0.5, threshold: 0.72 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const L = lt + LIT0;
        const arr = lt - ARRIVE;
        const core = L < 0.5 ? undefined : 20 + (arr > 0 ? 8 * Math.exp(-arr * 7) * clamp(arr * 30) : 0);
        B.litUpdate(H, lt, t, { foreman: L, foremanOpts: { ...(core !== undefined ? { core } : {}), crest: clamp((lt - 1.0) * 4), slotGlow: 1 } });
        H.threads.update(lt, {
          reveal: W.SUBLEAD_X.map((_, j) => clamp((lt - 0.5 - Math.abs(j - 5.5) * 0.035) / 0.6)),
          t, flow: clamp((lt - 1.0) / 0.5), pulses: clamp((lt - 1.1) / 0.3), k: 2.6,
          brief: lt >= 1.2 && arr < 0 ? ease.inOut(clamp((lt - 1.2) / (ARRIVE - 1.2))) : -1, briefK: 10,
          flare: arr > 0 ? W.SUBLEAD_X.map((_, j) => 1.5 * Math.exp(-Math.max(0, arr - j * 0.05) * 10) * (arr > j * 0.05 ? 1 : 0)) : null,
        });
        hu.update(lt, { raise: ease.inOut(clamp((lt - 0.3) / 0.6)), briefHide: lt >= 1.2, rimK: 4 });
        H.extra.length = 0; H.extra.push(...hu.sources());
        REFL.forEach(([x, y, z]) => { const dist = Math.hypot(x, y - 150, z + 195); const on = clamp((L * 120 - dist) / 12); if (on > 0) H.extra.push({ p: [x, y, z], c: W.C.brass, k: 6 * on, pool: 0, refl: 1.4, size: 5 }); });
        M.update(t);
        H.update(lt, { sky: lerp(2.0, 1.1, clamp(lt / 1.2)) });
        camFX(camera, t, W.camForemanHero(camera, lt, { dur: ctx.T }));
      },
    };
  },
});
