// 21 · i-crane-1000 — crane up 35mm from the human's feet: the last tiers of the 1,000-orb code tower slam in on 16ths,
// the camera rises (with a slow 3/4 orbit so the lattice reads as a column of light) and the crest ring ignites at 1.2.
import { shot, beats, camFX } from '../engine.js';
import { W, T, gradeI, motes, towerHalo, camOrbit, ease, clamp, lerp, TOWER } from './lib/b3.js';

shot({
  id: 'i-crane-1000', dur: beats(3), act: 'I',
  music: { section: 'act1', chord: 'C', div: 16, energy: 0.65, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'chirps', { gain: -9 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, cursor: true, human: 'I' } });
    const halo = towerHalo(scene);
    const M = motes({ count: 1400, box: [-42, 2, 0.3, 40, -14, 28], color: W.C.amber, k: 1.5, size: 0.1, seed: 211 });
    scene.add(M.points);
    const crestFl = W.flare({ color: W.C.clay, k: 0, size: 26 }); crestFl.position.set(-19.6, 34, 0); scene.add(crestFl);
    const ring2 = W.G.ring({ r: 9, tube: 0.12, color: W.C.ivory, k: 0 }); ring2.rotation.x = Math.PI / 2; ring2.position.set(-19.6, 34, 0); scene.add(ring2);
    return {
      scene, camera, ...gradeI({ bloom: { strength: 1.3, radius: 0.6, threshold: 0.8 } }),
      update(lt) {
        const t = T(ctx, lt);
        // last tiers slam in on 16ths (0.125 s): 640 -> 1000 by 0.75 s
        const step = Math.min(6, Math.floor(lt / 0.125) + 1);
        const count = Math.min(TOWER.crane[1], TOWER.crane[0] + step * 60 + 60 * ease.out(clamp((lt % 0.125) / 0.06)));
        const n = lt > 0.75 ? 1000 : count;
        const dc = lt - 1.2;
        const ig = W.ignite(dc);
        H.tower.update(lt, { count: n, k: 11.5, crest: ig, t, pulse: 0.25 });
        halo.update({ k: 0.22 + 0.13 * n / 1000, h: 3 * Math.ceil(n / 100), core: 1 + 1.5 * Math.max(0, ig - 1) });
        crestFl.userData.set(dc >= 0 ? 2.5 + 5 * Math.exp(-dc / 0.08) : 0);
        ring2.visible = dc >= 0 && dc < 0.3;   // a white shock ring expands off the crest on ignition
        if (ring2.visible) { const s = 1 + 0.6 * ease.out(dc / 0.3); ring2.scale.set(s, s, 1); ring2.material.color.set(W.C.ivory).multiplyScalar(W.ko(6) * (1 - dc / 0.3)); }
        H.cursor.update(lt, { on: W.blink(t, { div: 2 }), k: 10 });
        H.human.update(lt, { rimK: 4 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.2 });
        M.update(t, { k: 1.3 });
        H.update(lt, { sky: 1.4 });
        // crane: low at the human's feet -> high on the crest, with a slow 3/4 orbit (yaw 26 -> 14 deg)
        const u = ease.inOut(clamp(lt / ctx.T));
        // start: lens at knee height, the human's silhouette at the base, the column climbing out of frame; end: the crest
        const tgt = [-19.6, lerp(5, 28, u), 0];
        const dist = lerp(34, 54, u);
        const camY = lerp(1.2, 29, u);
        const pitch = -Math.atan2(camY - tgt[1], dist) * 180 / Math.PI;
        camFX(camera, t, camOrbit(camera, tgt, { yaw: lerp(-26, -14, u), pitch, dist: Math.hypot(dist, camY - tgt[1]), fov: W.FOV[35], roll: lerp(2, -0.5, u) }));
      },
    };
  },
});
