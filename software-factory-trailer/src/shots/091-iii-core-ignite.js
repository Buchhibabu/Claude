// 91 iii-core-ignite — Fragment 3: macro 50mm at (0,150,-170) looking at (0,150,-195) — the c-core-tease framing, now clear (fog 0.004).
// The clay core ignites (k 0 -> 26 -> 20, 1.3x overshoot), forge sparks spit out of the slot, the radial wavefront starts on the
// slot seams, and the first of the 12 threads leaves the slot.
import { shot, beats, camFX, clamp, lerp, ease, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { THREE, G } = W;

const T0 = 0.06;   // ignition (2 f after the cut)
shot({
  id: 'iii-core-ignite', dur: beats(1, 150), act: 'III',
  music: B.act3('D', 0.92),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'reverse_swell', { dur: 0.4, gain: -4 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = B.litHall(scene, { floor: false, line: false, banks: false, pillars: false, threads: true });
    // forge sparks: 900 embers ejected from the slot toward the lens, drag + gravity
    const N = 900, r = rand(911);
    const P = W.swarmHaze({ count: N, spread: [0, 0, 0], center: [0, 150, -189], color: W.C.ember, k: 5, size: 0.09, seed: 912 });
    P.points.frustumCulled = false; scene.add(P.points);
    const v = Array.from({ length: N }, () => [(r() - 0.5) * 7, (r() - 0.5) * 9, 4 + r() * 16, r() * 0.15, -0.8 + r() * 1.6]);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.1, radius: 0.5, threshold: 0.8 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const L = lt - T0;
        const ck = L <= 0 ? 0 : L < 2 / 30 ? 26 * (L / (2 / 30)) : lerp(26, 20, ease.out(clamp((L - 2 / 30) / 0.22)));
        const wave = Math.max(0, lt - 0.22) * 0.9;     // the radial wavefront begins on the slot seams at the end of the shot
        H.foreman.update(lt, wave > 0 ? { lit: wave, core: ck, slotGlow: 0.3 } : { lit: 0, core: ck, slotGlow: 0.3, rimColor: W.C.amber, rimK: 0.3 });
        // macro: the hall-scale core light / flare would flood a 10u frame -> keep the spill local to the slot
        H.foreman.coreLight.intensity = ck * 9; H.foreman.coreLight.distance = 24;
        H.foreman.coreFlare.userData.set(ck * 0.012);
        // first thread (centre, j = 5) leaves the slot
        const rev = W.SUBLEAD_X.map((_, j) => (j === 5 ? clamp((lt - 0.2) / 0.5) * 0.55 : 0));
        H.threads.update(lt, { reveal: rev, t, flow: 0, pulses: 0, leads: 0, k: 3.2 });
        // sparks
        for (let i = 0; i < N; i++) {
          const a = L - v[i][3];
          if (a <= 0) { P.positions[i * 3] = 1e5; continue; }
          const dr = (1 - Math.exp(-a * 3)) / 3;
          P.positions[i * 3] = v[i][0] * dr * (0.35 + 0.65 * Math.abs(v[i][4]));
          P.positions[i * 3 + 1] = 150 + v[i][1] * dr - 9 * a * a;
          P.positions[i * 3 + 2] = -189 + v[i][2] * dr;
        }
        P.geometry.attributes.position.needsUpdate = true;
        P.material.color.set(W.C.ember).multiplyScalar(W.ko(6) * (L > 0 ? 1 : 0));
        H.update(lt, { sky: 1 });
        const u = clamp(lt / ctx.T);
        camFX(camera, t, W.camLook(camera, [lerp(1, 0, u), 150, lerp(-170, -171.2, ease.out(u))], [0, 150, -195], W.FOV[50]));
      },
    };
  },
});
