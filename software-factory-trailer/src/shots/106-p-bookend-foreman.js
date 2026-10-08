// p-bookend-foreman — BOOKEND of c-foreman-worm: the same camForemanWorm (pull 38) and the same specular sweep rig (b1 trail + head
// flare + anamorphic, s = 40 + 140 lt) climbing the same corner seam — but the colossus is now KNOWN: lit, seams blazing,
// crest beams on, the core blazing in its slot, back-lit by the same warm ray fan.
import { shot, beats, camFX, clamp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B1 from './lib/b1-cold.js';
import { peakGrade } from './lib/b8-peak-end.js';

shot({
  id: 'p-bookend-foreman', dur: beats(1, 150), act: 'III',
  music: { section: 'peak', chord: 'D', div: 16, energy: 0.97, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = W.hall(scene, { state: 'lit', parts: { threads: true } });
    const fan = B1.rayFan({ color: W.C.amberRail, k: 0.9, size: 760, count: 64, seed: 17 }); fan.position.set(0, 150, -330); scene.add(fan);
    const tr = B1.trail({ path: H.foreman.sweepPath, count: 320, r: 0.55 }); scene.add(tr.mesh);
    const head = W.flare({ color: W.C.clay, k: 10, size: 14 }); scene.add(head);
    const headA = B1.anamorphic({ color: W.C.amberRail, k: 2.2, w: 90, h: 1.6 }); scene.add(headA);
    const motes = B1.embers({ count: 700, center: [0, 0, -100], spread: [70, 40, 30], rise: 0.8, sway: 0.5, color: W.C.amberRail, k: 0.35, size: 0.18, seed: 41 });
    scene.add(motes.points);
    const sweepSrc = { p: [0, 0, 0], c: W.C.clay, k: 8, pool: 0, refl: 2.0, size: 1 };
    H.extra.push(sweepSrc);
    return {
      scene, camera, ...peakGrade({ bloom: { strength: 1.15, threshold: 0.73 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const s = 40 + 140 * lt;
        H.banks.update(lt, { on: 1, t });
        H.foreman.update(lt, { lit: 6, hourRing: 18 });
        H.threads.update(lt, { t, flow: 1 });
        tr.update(s, { k: 14, decay: 22, head: 4 });
        const p = H.foreman.sweepPath.getPointAt(clamp(s / H.foreman.sweepLen));
        sweepSrc.p[0] = p.x; sweepSrc.p[1] = p.y; sweepSrc.p[2] = p.z;
        head.position.copy(p); headA.position.copy(p);
        head.userData.set(10, clamp(s / H.foreman.sweepLen) > 0.6 ? W.C.ivory : W.C.clay); headA.userData.set(2.4);
        fan.userData.set(0.9); fan.userData.spin(0.05 * (lt + 0.5));
        motes.update(t, { k: 0.35 });
        H.update(lt, { lit: 1, sky: 2.0 });
        camFX(camera, t, W.camForemanWorm(camera, lt, { pull: 38 }));
      },
    };
  },
});
