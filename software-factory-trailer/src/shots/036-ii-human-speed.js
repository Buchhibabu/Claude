// 36 ii-human-speed — the mismatch from the bottom angle. 85mm macro on REVIEW's lectern: a steel-blue block cursor (human speed, NOT clay)
// blinks once in two beats while agent-speed cards streak past behind it and slam into the jam.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-human-speed', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Bb', div: 8, energy: 0.62, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'tick', { gain: -8 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.09 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, pillars: false, atmosphere: true } });
    const BH = B.bulkhead({ top: 11 }); scene.add(BH.group);
    const LEC = B.lectern({ px: 2200 }); scene.add(LEC.group);
    const cur = LEC.cursorWorld();
    const WALLX = -8.4 - 0.35 - 1.55;
    // out-of-focus bokeh in the deep background (depth)
    const bokeh = W.swarmHaze({ count: 60, spread: [30, 8, 20], center: [-22, 5, -16], color: C.ice, size: 0.9, k: 0.5, seed: 361 });
    scene.add(bokeh.points);
    // agent-speed streaks in the background (6u long, soft): cards racing +x across the deck behind the lectern
    const NS = 16, rs = rand(3602);
    const st = Array.from({ length: NS }, (_, i) => ({ t0: -0.3 + i * 0.075 + rs() * 0.04, y: 3.55 + rs() * 1.3, z: -2.6 + rs() * 5.0, v: 70 + rs() * 30 }));
    const S = B.streaks(NS, { color: C.ivory, k: 4.5, width: 12 }); scene.add(S.mesh);
    const SP = B.sparks({ count: 160, color: C.ice, size: 0.05, k: 6 }); scene.add(SP.points);
    const bursts = st.map((s, i) => ({ t0: s.t0 + (WALLX - 3.08 - 1.5 + 30) / s.v, p: [WALLX - 3.08 - 1.5, s.y, s.z], n: 10, speed: 6, life: 0.25, seed: 360 + i, g: 3, dir: [-2, 1, 0] }));
    // soft ice spill light from the screen onto the deck
    const scrL = new THREE.PointLight(C.ice, 1.2, 4, 2); scrL.position.set(cur[0], cur[1], cur[2] + 0.6); scene.add(scrL);

    return {
      scene, camera, ...W.grade('II', { bloom: { strength: 0.95, radius: 0.5, threshold: 0.78 }, vignette: 0.6 }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const on = W.blink(t, { div: 0.5, origin: ctx.shot.start });   // human speed: ON for one beat in two, on the tick
        LEC.update(lt, { on, k: 3.2 });
        for (let i = 0; i < NS; i++) {
          const s = st[i], d = lt - s.t0;
          const x = -30 + s.v * d, stop = WALLX - 3.08 - 1.5;
          if (d < 0 || x > stop + 1) { S.hide(i); continue; }
          S.set(i, [Math.min(x, stop), s.y, s.z], [Math.min(x, stop) - 6, s.y, s.z]);
        }
        S.commit();
        SP.update(bursts, lt);
        BH.update(lt, { edgeK: 1.4, slotK: 2.4, pin: W.blink(t, { div: 2 }), t });
        H.line.update(lt, { lit: 0, dim: 0.45 });
        H.extra.length = 0;
        H.update(lt);
        const u = clamp(lt / ctx.T);
        const d = (globalThis.DBG_D || 4.2) * (1 - 0.02 * u);
        const fov = W.camLook(camera, [cur[0] - 0.05, cur[1] + 0.22, cur[2] + d], [cur[0] + 0.14, cur[1] + 0.02, cur[2]], W.FOV[85]);
        W.handheld(camera, t, 0.3, 36);
        camFX(camera, t, fov);
      },
    };
  },
});
