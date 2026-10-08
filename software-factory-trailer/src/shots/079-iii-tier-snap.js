// 79 iii-tier-snap — MACRO 85mm on one worker tier of the hierarchy: the lead's beam slams down onto its four workers and their card
// stacks square up (0.2u jitter -> 0 in 3 f), seams flare, the pulse runs down the brass face traces. The HIERARCHY: COHERENCE. card
// from iii-hierarchy carries over unchanged (same slot, already settled) and cuts out at the end.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE } = W;

shot({
  id: 'iii-tier-snap', dur: beats(1, 150), act: 'III',
  music: { section: 'act3', chord: 'C', div: 16, energy: 0.87, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'tick', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = W.hall(scene, { state: 'lit', parts: { line: false, banks: false } });
    const R = B.hierarchyRig({ center: [0, 0, -28], scale: 1.85, dais: 10 }); scene.add(R.group);
    const halo = W.flare({ color: W.C.amberRail, k: 3.2, size: 520, fog: false, ref: 4 }); halo.position.set(0, 80, -520); scene.add(halo);
    const motes = B.beamMotes({ x: -11, count: 500, r0: 10, h: 30, size: 0.05, seed: 791 }); motes.points.position.set(0, 12, -12.5); scene.add(motes.points);
    // focus group: lead 1's four workers (j = 1)
    const gc = R.groupCenter(1);
    const w2 = R.nodes[5 + 4 + 1], w3 = R.nodes[5 + 4 + 2];
    const SNAP = 0.06;
    // at macro size the instanced node orbs are size-compensated down to grey: give the two hero workers (and their neighbours)
    // their own hot-core spheres with a high compensation floor so they read as glowing ivory agents.
    const heroes = [0, 1, 2, 3].map((q) => { const n = R.nodes[5 + 4 + q]; const m = W.glowMesh(new THREE.SphereGeometry(1, 28, 18), W.C.ivory, 3, { radius: 1, min: 0.55 });
      m.position.set(...n.p); m.scale.setScalar(n.r * R.scale * 1.03); scene.add(m); return m; });
    // snap shock: a thin amber ring racing out across the terrace from each squared stack
    const circ = Array.from({ length: 65 }, (_, i) => { const a = (i / 64) * Math.PI * 2; return [Math.cos(a), 0, Math.sin(a)]; });
    const shocks = [0, 1, 2, 3].map((q) => { const n = R.nodes[5 + 4 + q]; const c = R.cardWorld(n, 0); const l = W.fat(circ, { color: W.C.amber, k: 3, width: 2 });
      l.position.set(c[0], R.dais + 4 * R.scale + 0.05, c[2]); scene.add(l); return l; });
    const g = W.grade('III', { bloom: { strength: 0.9, radius: 0.35, threshold: 0.8 }, ca: 0.0006, exposure: 0.95 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.T(ctx, lt);
        // apex + leads already squared; this tier's beam strikes at SNAP (its pulses arrive down the face traces)
        R.update(lt, { t, snaps: [-3, -2, SNAP], lock: 99, drift: 1.4, flash: 0.8, beamOp: 0 });
        shocks.forEach((l) => { const d = lt - SNAP; l.visible = d >= 0 && d < 0.3; if (l.visible) { const r = lerp(1.2, 6, ease.expoOut(d / 0.3)); l.scale.set(r, 1, r * 0.8); l.userData.set(4 * Math.pow(1 - d / 0.3, 1.5)); } });
        heroes.forEach((m) => m.userData.setGlow(lt >= SNAP ? 3.8 + 2.5 * Math.exp(-(lt - SNAP) / 0.08) : 3));
        H.foreman.update(lt, { lit: 0, rimColor: W.C.amber, rimK: 0.5 });
        motes.update(t, 0.5);
        g.bloom.strength = W.bloomHit(0.9, lt - SNAP, { peak: 1.15, d: 0.2 });
        H.extra.length = 0; H.extra.push(...R.sources());
        H.update(lt, { lit: 1, sky: 2.2 });
        // 85mm, just above the terrace looking down ~9 deg: card stacks low-centre, their worker orbs behind; 3% push across the shot
        const tg = [(w2.p[0] + w3.p[0]) / 2, R.dais + 4 * R.scale + 0.45, R.cardWorld(w2, 0)[2] - 1.2];
        const d = 34 * (1 - 0.03 * clamp(lt / ctx.T));
        const dir = [0.1, 0.157, 0.982];
        const fov = W.camLook(camera, [tg[0] + dir[0] * d, tg[1] + dir[1] * d, tg[2] + dir[2] * d], tg, W.FOV[85]);
        camFX(camera, t, fov);
      },
    };
  },
  ui(root, tl, K) {
    // CARRY: identical card + scrim to iii-hierarchy, already settled (not a new card)
    const sc = B.scrim(K, root, { y: 860, h: 380, a: 0.5 });
    K.cutIn(tl, sc, 0); K.cutOut(tl, sc, 0.4);
    const el = B.tricolon(K, root, { pre: 'HIERARCHY:', main: 'COHERENCE.', size: 180, y: 860 });
    K.cutIn(tl, el, 0); K.cutOut(tl, el, 0.4);
  },
});
