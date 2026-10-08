// 49 ii-lock-gate — locks don't save it (image only). Worm's-eye 18mm under a narrow ice lock gate at REVIEW's input: 20 ice
// orbs crowd and jitter against its latch, back-lit through the slot; on the beat the latch lifts for 4 f, 3 squeeze through and
// streak off toward the 600u REVIEW tower, then it slams again. Push cut on the off-beat.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

shot({
  id: 'ii-lock-gate', dur: beats(1.5), act: 'II',
  music: { section: 'act2', chord: 'Bb', div: 16, energy: 0.76, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { fog: 0.006 });
    ctx.sfx(0, 'impact', { gain: -10 });
    const H = W.hall(scene, { state: 'dark', parts: { towers: { review: 1200, test: 640 } } });
    const GX = -8.4, GY = 3, GW = 2.0, GH = 5.6, GZ = -2.2;
    H.line.group.visible = false;   // the camera sits inside CODE's box volume: keep the station shells out of the lens
    // the lock gate: a narrow frame facing the crowd (steel body, ice edges) + a sliding latch bar
    const mat = W.edgeStd({ color: 0x0e1014, metal: 0.7, rough: 0.35, edge: W.C.ice, edgeK: W.kl(0.8), edgeW: 1.4 });
    const box = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); scene.add(m); return m; };
    const PW = 0.34;
    box(PW, GH, PW, GX - GW / 2 - PW / 2, GY + GH / 2, GZ); box(PW, GH, PW, GX + GW / 2 + PW / 2, GY + GH / 2, GZ); box(GW + PW * 2 + 0.3, 0.4, 0.5, GX, GY + GH, GZ);
    const outline = W.glowSegs([...W.boxEdgePairs([GX - GW / 2 - PW / 2, GY + GH / 2, GZ], [PW, GH, PW]), ...W.boxEdgePairs([GX + GW / 2 + PW / 2, GY + GH / 2, GZ], [PW, GH, PW]), ...W.boxEdgePairs([GX, GY + GH, GZ], [GW + PW * 2 + 0.3, 0.4, 0.5])], { color: W.C.ice, k: 1.3, width: 1.4 });
    scene.add(outline);
    // the lock: a portcullis grille across the slot (4 rails + 2 stiles) that lifts into the lintel when it opens
    const latch = new THREE.Group(); scene.add(latch);
    const grPairs = [];
    for (let k = 0; k < 4; k++) { const y = 0.7 + k * 1.05; grPairs.push([[-GW / 2, y, 0], [GW / 2, y, 0]]); }
    for (const x of [-GW / 6, GW / 6]) grPairs.push([[x, 0.2, 0], [x, GH - 0.5, 0]]);
    for (const [a, b] of grPairs) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0); m.scale.set(Math.max(0.12, Math.abs(b[0] - a[0])), Math.max(0.12, Math.abs(b[1] - a[1])), 0.12); latch.add(m); }
    const latchL = W.glowSegs(grPairs, { color: W.C.ice, k: 2.2, width: 1.6 }); latch.add(latchL);
    // back-light pouring through the slot (orbs occlude it) + the red lock lamp on the lintel
    const back = W.flare({ color: W.C.ice, k: 2.5, size: 9, fog: false }); back.position.set(GX, GY + GH * 0.55, GZ - 9); scene.add(back);
    const slotGlow = W.glowMesh(new THREE.PlaneGeometry(GW, GH), W.C.ice, 1.5, { shade: 'box', radius: 3, ref: 0.4 }); slotGlow.position.set(GX, GY + GH / 2, GZ - 0.6); scene.add(slotGlow);
    const lamp = W.orbs({ count: 1, r: 0.16, seg: 10 }); scene.add(lamp.mesh);
    const lampFl = W.flare({ color: W.C.red, k: 0, size: 1.6 }); lampFl.position.set(GX, GY + GH + 0.25, GZ + 0.3); scene.add(lampFl);
    // 20 crowding ice orbs (a heap pressed against the latch), 3 pass on the beat
    const N = 20, A = B.rimOrbs({ count: N, r: 0.28, seg: 22, core: 0.35, pow: 3.2 }); scene.add(A.mesh);
    const F = W.orbs({ count: 3, r: 0.22, seg: 12 }); scene.add(F.mesh);   // the three that get through, glowing once free
    const r = rand(4949);
    const home = Array.from({ length: N }, (_, i) => {
      const layer = Math.floor(i / 8), j = i % 8;
      const x = GX + (j % 4 - 1.5) * 0.55 + (r() - 0.5) * 0.25 + (layer ? (r() - 0.5) * 0.7 : 0);
      const y = GY + 0.7 + Math.floor(j / 4) * 0.55 + layer * 0.4 + r() * 0.3;
      return [x, y, GZ + 0.42 + layer * 0.55 + r() * 0.2];
    });
    const passers = [1, 2, 5];
    const passT = 0.25;               // the beat (global 62.5)
    const ice = W.lin(W.C.ice);
    const streaks = passers.map(() => { const l = W.fat([[0, 0, 0], [1, 0, 0]], { color: W.C.ice, k: 2.5, width: 2.4 }); scene.add(l); return l; });
    const g = B.grade2({ vignette: 0.62 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        // latch: slammed shut at the cut (impact), lifts on the beat for ~4 f, slams again
        const open = clamp((lt - passT + 0.02) / 0.05) * (1 - clamp((lt - passT - 0.14) / 0.04));
        const slam = B.impulse(lt, 0, 0.08) + B.impulse(lt, passT + 0.18, 0.08);
        latch.position.set(GX, GY + (GH - 0.6) * ease.out(open) - slam * 0.18, GZ + 0.12);
        latchL.userData.set(2.2 + 6 * slam);
        const locked = open < 0.5;
        lamp.set(0, { p: [GX, GY + GH + 0.25, GZ + 0.3], c: locked ? W.lin(W.C.red) : ice, k: locked ? 10 : 5 }); lamp.commit();
        lampFl.userData.set(locked ? 3 : 1.2, locked ? W.C.red : W.C.ice);
        back.userData.set(2.5 + 4 * open, W.C.ice);
        for (let i = 0; i < N; i++) {
          const h = home[i];
          const pi = passers.indexOf(i);
          const agit = 0.05 + 0.1 * slam;
          let x = h[0] + Math.sin(t * 41 + i * 3.1) * agit, y = h[1] + Math.sin(t * 37 + i * 1.7) * agit * 0.7, z = h[2] + Math.cos(t * 43 + i * 2.3) * agit;
          z -= 0.25 * open * (pi < 0 ? 1 : 0);   // the crowd surges at the opening
          if (pi >= 0) {
            const u = clamp((lt - passT - pi * 0.03) / 0.36);
            if (u > 0) {
              const e = ease.in(u);
              const tx = 1.4 - 1.6 + pi * 1.6, ty = 14 + pi * 5, tz = -3 - pi;
              const ux = clamp(e * 1.6);
              x = lerp(h[0], GX + (pi - 1) * 0.5, ux); y = lerp(h[1], GY + 2.2, ux); z = lerp(h[2], GZ - 1.2, ux);
              if (e > 0.62) { const w = (e - 0.62) / 0.38; x = lerp(x, tx, w); y = lerp(y, ty, w * w); z = lerp(z, tz, w); }
              const l = streaks[pi];
              const tail = 0.15 + 3 * e;
              l.geometry.setPositions([x - tail * 0.4, y - tail * 0.6, z + tail * 0.4, x, y, z]);
              l.visible = u > 0.08 && u < 1; l.userData.set(3 * (1 - u));
            } else streaks[pi].visible = false;
            if (u >= 1) { A.hide(i); F.hide(pi); continue; }
            if (u > 0) { A.hide(i); F.set(pi, { p: [x, y, z], c: ice, k: 8 }); continue; }
            F.hide(pi);
          }
          if (pi < 0 && lt > passT + 0.12) z -= 0.3 * ease.out(clamp((lt - passT - 0.12) / 0.2));
          A.set(i, { p: [x, y, z], c: ice, k: 2.2 + 2 * slam + 0.8 * open });
        }
        A.commit(); F.commit();
        H.towers.update(lt, { review: 1200, test: 640, t, shake: 0.03 });
        H.line.update(lt, { lit: 0, red: [0, 0, 0, 0.25, 0.4, 0.3, 0], strips: 0 });
        H.extra.length = 0;
        H.update(lt, { sky: 2.5 });
        // push cut on the off-beat: fast push decelerating, slight Dutch
        const p0 = [-9.6, 0.5, 4], tg = [-8.4, 5, 0];
        const u = 0.22 * ease.expoOut(clamp(lt / 0.75));
        const pos = [lerp(p0[0], tg[0], u), lerp(p0[1], tg[1], u), lerp(p0[2], tg[2], u)];
        W.camLook(camera, pos, tg, W.FOV[18], { roll: lerp(-2, -4, lt / 0.75) });
        W.handheld(camera, t, 0.3, 2);
        camFX(camera, t, W.FOV[18]);
      },
    };
  },
});
