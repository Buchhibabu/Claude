// 81 iii-one-writer — MIRROR of ii-two-writers: camWriterMacro (85mm, (-9,3.2,6) -> (-9,2.6,0)), the same card (B.writerCard) in the same
// framing and light rig. ONE ivory writer orb streaks in from frame left at 0.1 and stamps the card at 0.15: a clean green light runs
// out along the card's edges from the stamp point (#6EE7A0 k4), a soft ripple crosses its face. No crack. The lit hall glows out of
// focus behind. (Line hidden: the card sits in the CODE/REVIEW gap inside the station boxes' depth, WORLD.md section 6.)
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE, C } = W;

shot({
  id: 'iii-one-writer', dur: beats(1, 150), act: 'III',
  music: { section: 'act3', chord: 'Gm', div: 16, energy: 0.88, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0.15, 'tick', { gain: -2 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = W.hall(scene, { state: 'lit', parts: { line: false, foreman: false, pillars: false } });
    const CD = B.writerCard(scene);
    const [cx, , cz] = CD.p, hw = CD.size[0] / 2;
    const yT = CD.top + 0.004, zF = CD.front + 0.004, zB = CD.back, yB = CD.top - CD.size[1] - 0.004;
    // green edge light racing out from the stamp point along the top-front, top-back and bottom-front edges
    const run = (x0, x1, y, z) => Array.from({ length: 25 }, (_, q) => [lerp(x0, x1, q / 24), y, z]);
    const mk = (pts, k) => { const l = W.fat(pts, { color: C.green, k, width: 2 }); scene.add(l); return l; };
    const edges = [mk(run(cx, cx - hw, yT, zF), 3), mk(run(cx, cx + hw, yT, zF), 3), mk(run(cx, cx - hw, yT, zB), 2), mk(run(cx, cx + hw, yT, zB), 2),
      mk(run(cx, cx - hw, yB, zF), 2), mk(run(cx, cx + hw, yB, zF), 2)];
    // the writer orb + its streak + the stamp ripple
    const OR = 0.1;
    const orb = W.glowMesh(new THREE.SphereGeometry(1, 28, 18), C.ivory, 8, { radius: 1, min: 0.5 }); orb.scale.setScalar(OR); scene.add(orb);
    const orbF = W.flare({ color: C.ivory, k: 0, size: 1.2 }); scene.add(orbF);
    const streak = W.fat([[0, 0, 0], [1, 0, 0]], { color: C.ivory, k: 2.5, width: 3 }); scene.add(streak);
    const circ = Array.from({ length: 65 }, (_, i) => { const a = (i / 64) * Math.PI * 2; return [Math.cos(a), 0, Math.sin(a)]; });
    const ripple = W.fat(circ, { color: C.green, k: 2.5, width: 1.8 }); ripple.position.set(cx, yT + 0.003, cz + 0.05); scene.add(ripple);
    const stampF = W.flare({ color: C.green, k: 0, size: 1.0 }); stampF.position.set(cx, yT + 0.03, cz + 0.1); scene.add(stampF);
    // the lit hall out of focus behind + a warm pool under the card
    const bk = B.bokeh({ count: 18, center: [-9, 5, -60], spread: [44, 10, 24], size: [2.5, 6], seed: 811 }); scene.add(bk.group);
    const pool = B.warmPool({ w: 6, d: 4, color: C.amber, k: 0.3 }); pool.position.set(cx, 0.03, cz); scene.add(pool);
    const T0 = 0.1, TS = 0.15;                                     // enter, stamp
    const g = W.grade('III', { bloom: { strength: 1.0, radius: 0.4, threshold: 0.8 }, ca: 0.0006 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.T(ctx, lt);
        const ds = lt - TS;
        const on = ds >= 0;
        const u = on ? ease.out(clamp(ds / 0.07)) : 0;             // edge light travel (2 f)
        const flash = on ? Math.exp(-ds / 0.08) : 0;
        CD.I.set(0, { p: CD.p, edge: on && u >= 1 ? W.CARD.greenEdge(4 + 1.5 * flash) : W.CARD.edge(1.8), body: on ? W.lin(C.green, 0.012 + 0.03 * flash) : W.CARD.body(0.9) });
        CD.I.commit();
        CD.label.material.color.setScalar(0.5 + 0.4 * flash);
        edges.forEach((l, i) => { l.userData.reveal(u); l.visible = u > 0; l.userData.set((i < 2 ? 3 : 2) + 3 * flash); });
        // writer: streak in from frame left (x -10.4 -> -9 in ~0.07 s), dip onto the card at the stamp, then hover just above it
        const vis = lt >= T0 - 0.02;
        orb.visible = vis;
        let x = cx, y = yT + OR + 0.06;
        if (!on) { const uu = clamp((lt - (T0 - 0.02)) / (TS - T0 + 0.02)); x = lerp(-10.45, cx, ease.out(uu)); y = lerp(yT + 0.3, yT + OR + 0.06, uu); }
        else { const dip = Math.exp(-ds / 0.05) * Math.sin(Math.min(Math.PI, (ds / 0.06) * Math.PI)); y = yT + OR + 0.06 - 0.06 * dip + 0.05 * clamp((ds - 0.06) / 0.2); }
        orb.position.set(x, y, cz + 0.05); orbF.position.set(x, y, cz + 0.1);
        orb.userData.setGlow(6 + 5 * flash); orbF.userData.set(vis ? 0.8 + 1.2 * flash : 0, C.ivory);
        streak.visible = lt >= T0 - 0.02 && lt < TS + 0.04;
        if (streak.visible) { const len = on ? 0.7 * (1 - clamp(ds / 0.04)) : 0.7; streak.position.set(x - OR, y, cz + 0.05); streak.scale.set(-Math.max(0.01, len), 1, 1); streak.userData.set(2.5 * (on ? 1 - clamp(ds / 0.04) : 1)); }
        ripple.visible = on && ds < 0.25;
        if (ripple.visible) { const r = lerp(0.1, 0.9, ease.expoOut(ds / 0.25)); ripple.scale.set(r, 1, r * 0.6); ripple.userData.set(2.5 * Math.pow(1 - ds / 0.25, 1.4)); }
        stampF.userData.set(on ? 1.8 * flash + 0.2 : 0, C.green);
        bk.update(0.6);
        g.bloom.strength = W.bloomHit(1.0, ds, { peak: 1.15, d: 0.2 });
        H.extra.length = 0;
        H.extra.push({ p: [cx, CD.top + 0.4, cz + 0.4], c: on ? C.green : C.ivory, k: on ? 0.8 + 1.0 * flash : 0.7, pool: 1.6, poolK: 0.7, refl: 0, size: 0.4 });
        H.update(lt, { lit: 1, sky: 1.5 });
        const fov = W.camWriterMacro(camera) * (1 - 0.015 * flash);     // 1.5% punch on the stamp
        camera.fov = fov; camera.updateProjectionMatrix();
        camFX(camera, t, fov);
      },
    };
  },
});
