// 86 iii-lock-mirror — MIRROR of ii-lock-gate: the same 18mm worm's-eye (-9.6,0.5,4) -> (-8.4,5,0), level. The same narrow lock gate
// (2u wide, now amber-edged) at REVIEW's input passes ivory orbs single-file, in order, one per 8th; nothing piles. Bank 3 blazes overhead.
import { shot, beats, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { THREE } = W;

const GX = -8.4, Y0 = 3, Y1 = 7.6, HZ = 1.0;   // gate at REVIEW's input
shot({
  id: 'iii-lock-mirror', dur: beats(1, 150), act: 'III',
  music: B.act3('Bb', 0.88),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'tick', { gain: -6 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = B.litHall(scene, {});
    // the lock gate: two posts + lintel (brass body, amber edges), soft outline
    const gm = W.edgeStd({ color: W.C.brassDark, metal: 0.9, rough: 0.35, edge: W.C.amber, edgeK: W.kl(3) * 0.4, edgeW: 1.6 });
    const post = (z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, Y1 - Y0, 0.3), gm); m.position.set(GX, (Y0 + Y1) / 2, z); scene.add(m); };
    post(-HZ); post(HZ);
    const lin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 2 * HZ + 0.3), gm); lin.position.set(GX, Y1, 0); scene.add(lin);
    const outline = W.glowSegs([...W.boxEdgePairs([GX, (Y0 + Y1) / 2, -HZ], [0.3, Y1 - Y0, 0.3]), ...W.boxEdgePairs([GX, (Y0 + Y1) / 2, HZ], [0.3, Y1 - Y0, 0.3]), ...W.boxEdgePairs([GX, Y1, 0], [0.3, 0.3, 2 * HZ + 0.3])], { color: W.C.amber, k: 2, width: 1.4 });
    scene.add(outline);
    const pass = W.flare({ color: W.C.amber, k: 0, size: 5 }); pass.position.set(GX, 5, 0); scene.add(pass);
    // the single-file queue: ivory orbs at 8u/s, spaced 1.6u -> one through the gate every 0.2 s (an 8th at 150 BPM)
    const N = 16, V = 8, SP = 1.6;
    const O = W.orbs({ count: N, r: 0.2, seg: 14 }); scene.add(O.mesh);
    const lane = W.glowSegs([[[-30, 4.95, 0], [12, 4.95, 0]]], { color: W.C.amber, k: 0.9, width: 1.0 }); scene.add(lane);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.0, radius: 0.45, threshold: 0.8 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        B.litUpdate(H, lt, t, { foreman: 0, beam: 0 });
        // the lens sits inside the CODE station's footprint (shared spec camera): drop CODE's box + strip so the frame is not filled by them
        H.line.boxes.hide(W.ST.CODE); H.line.stripsI.hide(W.ST.CODE); H.line.boxes.commit(); H.line.stripsI.commit();
        const ph = ((t / 0.2) % 1 + 1) % 1;            // locked to the 8th grid
        for (let i = 0; i < N; i++) {
          const x = GX + (ph - i + 8) * SP;            // orb i crosses the gate on its 8th
          O.set(i, { p: [x, 4.95, 0], c: W.lin(W.C.ivory), k: 3.2 });
        }
        O.commit();
        const since = ph * 0.2;                         // seconds since the last orb crossed
        pass.userData.set(3 * Math.exp(-since * 18), W.C.amber);
        outline.userData.set(1.8 + 3 * Math.exp(-since * 14));
        H.update(lt);
        camFX(camera, t, W.camLook(camera, [-9.6, 0.5, 4], [-8.4, 5, 0], W.FOV[18]));
      },
    };
  },
});
