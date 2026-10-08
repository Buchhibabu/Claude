// 51 ii-topple — it breaks. PATTERN BREAK: the overloaded 600u REVIEW tower tips toward camera; the frame ramps 1 -> 0.2x (0-0.3),
// hangs in slow motion (shed cards and dust suspended, a red fracture climbing the column on the 0.5 impact), then snaps forward
// at 3x in the last 0.4 s and the cards rain at the lens. Hard cut on peak velocity.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE, G } = B;

// speed ramp: 1 -> 0.2x over 0-0.3, hold 0.2x, -> 3x over the last 0.4 s; story time tau = integral of speed
const speed = (lt) => (lt < 0.3 ? lerp(1, 0.2, ease.out(lt / 0.3)) : lt < 1.1 ? 0.2 : lerp(0.2, 3, ease.in(clamp((lt - 1.1) / 0.4))));
function tau(lt) { const n = Math.max(1, Math.ceil(lt * 600)), h = lt / n; let s = 0; for (let i = 0; i < n; i++) s += speed((i + 0.5) * h) * h; return s; }

shot({
  id: 'ii-topple', dur: beats(3), act: 'II',
  music: { section: 'act2', chord: 'C', div: 16, energy: 0.7, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { fog: 0.0055 });
    ctx.fx.shake(1.3, 8, 0.2);
    ctx.sfx(0, 'tape_stop', { dur: 0.5, gain: -2 });
    ctx.sfx(0.5, 'impact', { gain: -2 });
    ctx.sfx(1.2, 'whoosh', { gain: -4 });
    const H = W.hall(scene, { state: 'dark', parts: { towers: { test: 640 }, human: 'II' } });
    const T = B.fallingTower({ count: 1200, dir: [Math.sin(-0.5), Math.cos(-0.5)] });   // toward the lens, falling off to camera-left so the lean reads
    scene.add(T.group);
    // dust / card-grit suspended in the air (slow-mo tell)
    const D = G.particles({ count: 2600, spread: [60, 70, 60], center: [0, 35, 10], color: W.C.ice, size: 0.2, seed: 515 });
    D.material.color.set(W.C.ice).multiplyScalar(W.ko(3)); scene.add(D.points); D.points.frustumCulled = false;
    const dv = Float32Array.from({ length: 2600 * 3 }, (_, i) => Math.sin(i * 12.9898) * 0.5);
    const a = 6.0, th0 = 0.03;
    const g = B.grade2({ vignette: 0.6 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const tu = tau(lt);
        const theta = th0 * Math.exp(a * tu);
        const camPos = [-4, 2, 40];
        T.update(lt, { theta, a, bend: 0.22, t: ctx.shot.start + tu, crack: lt >= 0.5 ? tu - tau(0.5) : -1, camPos, rain: lt - 1.12, vScale: 0.5 });
        for (let i = 0; i < 2600; i++) {
          D.positions[i * 3] = D.base[i * 3] + dv[i * 3] * tu * 8;
          D.positions[i * 3 + 1] = D.base[i * 3 + 1] - tu * 10 + dv[i * 3 + 1] * tu * 6;
          D.positions[i * 3 + 2] = D.base[i * 3 + 2] + tu * 14 + dv[i * 3 + 2] * tu * 8;
        }
        D.geometry.attributes.position.needsUpdate = true;
        H.towers.update(lt, { test: 640, t: ctx.shot.start + tu });
        H.human.update(lt, {});
        H.foreman.update(lt, { lit: 0, rimColor: W.C.red, rimK: 0.22 });
        H.line.update(lt, { lit: 0, red: [0.2, 0.3, 0.6, 1, 1, 0.6, 0.3] });
        H.extra.length = 0;
        H.extra.push({ p: [1.4, 9, 1], c: W.C.red, k: 2.5, pool: 4, poolK: 0.7, refl: 0.6, size: 0.5 });
        H.update(lt, { sky: 2.5 });
        // camera: settles into the slow-mo, flinches back and up as the tower comes down on it
        const snap = ease.in(clamp((lt - 1.1) / 0.4));
        const pos = [-4, 2 - 0.6 * snap, 40 + 3 * snap];
        const tg = [1.4, 30 + 14 * snap, 0];
        W.camLook(camera, pos, tg, W.FOV[35], { roll: lerp(0, -6, snap) });
        W.handheld(camera, t, 0.3, 6);
        camFX(camera, t, W.FOV[35]);
      },
    };
  },
});
