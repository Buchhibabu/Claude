// 82 iii-coord-44 — MIRROR of ii-errors-172 (MASTER E): the identical locked top-down camErrorTop (85mm, (1.4,160,0), same 2% creep),
// the same 300 seeded agent orbs (W.errorMap seed 172). The same red spark lights at the centre and starts to branch on 8ths, but a
// NEUTRAL IVORY coordinator node (r1.2, #FAF9F5 k8, never clay) ignites over it, throws 24 ivory hub filaments out to the field and
// intercepts: the 17 tendrils retract to exactly 4, which REMAIN red and keep pulsing (errors reduced, not gone). ×17.2 rolls to ×4.4 in
// ice and lands with the B hit at 0.4; the type cuts at 2.2 and the 4 residual red tendrils hold alone.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE, C } = W;

shot({
  id: 'iii-coord-44', dur: beats(6, 150), act: 'III',
  music: { section: 'act3', chord: 'Dm', div: 16, energy: 0.86, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0.4, 'B');
    ctx.sfx(0, 'chirps', { gain: -10 });
    ctx.sfx(0.4, 'impact', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'III' });
    const H = W.hall(scene, { state: 'lit', parts: { banks: false, pillars: false, foreman: false } });
    const E = W.errorMap({}); scene.add(E.group);
    const P = E.positions, T = E.tendrils, ctr = [1.4, 3, 0];
    const o = P[E.origin];
    // the 4 residual errors: four tendrils spread on the diagonals (same seeded paths as the master's 17)
    const KEEP = [2, 6, 11, 15];
    const keepLines = KEEP.map((k) => { const pts = T[k].map((i) => [P[i][0], P[i][1] + 0.06, P[i][2]]); if (pts.length < 2) pts.push(pts[0]); const l = W.fat(pts, { color: C.red, k: 6, width: 2 }); scene.add(l); return l; });
    const keepOrbs = W.orbs({ count: 48, r: 0.42, seg: 10 }); scene.add(keepOrbs.mesh);
    const tips = W.orbs({ count: 4, r: 0.5, seg: 12 }); scene.add(tips.mesh);
    const tipFl = KEEP.map(() => { const f = W.flare({ color: C.red, k: 0, size: 2 }); scene.add(f); return f; });
    // spark (red) at the origin
    const spark = W.flare({ color: C.red, k: 0, size: 5 }); spark.position.set(o[0], o[1] + 0.8, o[2]); scene.add(spark);
    // coordinator dressing: hub flare, an etched housing under it, ivory caps on the 24 linked orbs, pulses running out along the spokes
    const hubF = W.flare({ color: C.ivory, k: 0, size: 9 }); hubF.position.set(ctr[0], ctr[1] + 0.9, ctr[2]); scene.add(hubF);
    const etch = B.etchedDisc({ r: 4.2, color: C.ivory, k: 0 }); etch.position.set(ctr[0], ctr[1] + 0.02, ctr[2]); scene.add(etch);
    const ends = [];
    for (let k = 0; k < 24; k++) { const ang = (k / 24) * Math.PI * 2; let best = 0, bs = 1e9; P.forEach((p, i) => { const tx = ctr[0] + Math.cos(ang) * 14, tz = ctr[2] + Math.sin(ang) * 9; const d = (p[0] - tx) ** 2 + (p[2] - tz) ** 2; if (d < bs) { bs = d; best = i; } }); ends.push(P[best]); }
    const caps = W.orbs({ count: 24, r: 0.44, seg: 10 }); scene.add(caps.mesh);
    const pulses = W.orbs({ count: 24, r: 0.26, seg: 8 }); scene.add(pulses.mesh);
    // intercept shock: an ivory ring expanding from the hub on the hit (mirror of the master's red shock ring)
    const ringPts = Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * Math.PI * 2; return [Math.cos(a), 0, Math.sin(a) * 0.62]; });
    const ring = W.fat(ringPts, { color: C.ivory, k: 3, width: 2.5 }); ring.position.set(ctr[0], 3.1, ctr[2]); scene.add(ring);
    const scr = B.camScrim(scene, camera, { x: 960, y: 575, w: 1900, h: 760, a: 0 });
    const red = W.lin(C.red), hot = W.lin(0xff9a7a), ivory = W.lin(C.ivory);
    const HIT = 0.4;
    const g = W.grade('III', { bloom: { strength: 1.1, radius: 0.45, threshold: 0.75 }, ca: 0.0006, vignette: 0.5 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.T(ctx, lt);
        scene.fog.density = W.fogKeep(160, 0.85);
        // tendrils hop outward on 8ths (150 BPM: 0.2 s) until the coordinator intercepts at the hit
        const step = Math.floor(lt / 0.2 + 1e-6), sub = lt - step * 0.2;
        const hop = ease.expoOut(clamp(sub / 0.06));
        const gAll = clamp((Math.min(step, 2) + (step < 2 ? hop : 1) + 1) / 9.5);         // ~3 hops by the hit
        const retract = ease.out(clamp((lt - HIT) / 0.35));
        const coord = ease.expoOut(clamp((lt - 0.06) / 0.34));
        const pulse = 0.75 + 0.25 * Math.sin(t * Math.PI * 5);                                // 150 BPM 8ths
        E.update(lt, { grow: gAll, keep: 0, retract, coord, spark: -1, t, orbK: 4.2, tendrilK: 4.6 });
        // residual 4: keep growing gently after the intercept (to ~4 hops) and never leave
        const gK = lt < HIT ? gAll : lerp(gAll, 0.72, ease.out(clamp((lt - HIT) / 0.9)));
        let oi = 0;
        KEEP.forEach((k, q) => {
          const path = T[k];
          keepLines[q].userData.reveal(gK); keepLines[q].userData.set(5 * pulse * (1 + 0.6 * B.impulse(lt, HIT, 0.2)));
          const n = Math.floor(path.length * gK);
          for (let i = 0; i < n && oi < 48; i++) keepOrbs.set(oi++, { p: P[path[i]], c: red, k: 2.6 * pulse });
          const tipI = Math.max(0, Math.min(path.length - 1, n - 1)), prevI = Math.max(0, tipI - 1);
          const a = P[path[prevI]], b = P[path[tipI]];
          const x = lerp(a[0], b[0], lt < HIT ? hop : 1), z = lerp(a[2], b[2], lt < HIT ? hop : 1);
          tips.set(q, { p: [x, a[1] + 0.5, z], c: hot, k: (5 + 6 * Math.exp(-sub / 0.09)) * pulse });
          tipFl[q].position.set(x, a[1] + 0.6, z); tipFl[q].userData.set((1.2 + 2 * Math.exp(-sub / 0.09)) * pulse, C.red);
        });
        for (; oi < 48; oi++) keepOrbs.hide(oi);
        keepOrbs.commit(); tips.commit();
        // the spark: hot at the cut, swallowed by the coordinator as it ignites
        spark.userData.set(4 * Math.exp(-lt / 0.25), C.red);
        // coordinator
        const cf = B.impulse(lt, HIT, 0.25);
        E.hub.userData.setGlow(lt < 2.2 ? 8 + 5 * cf : 5);
        hubF.userData.set(lt < 2.2 ? coord * (0.7 + 1.6 * cf) : 0.15, C.ivory);
        etch.userData.set(coord * (0.35 + 0.6 * cf), C.ivory); etch.rotation.z = -0.25 * lt;
        ends.forEach((p, k) => {
          const linked = clamp(coord * 1.6 - k / 40) >= 0.999;
          if (!linked) { caps.hide(k); pulses.hide(k); return; }
          caps.set(k, { p: [p[0], p[1] + 0.02, p[2]], c: ivory, k: 2.6 + 3 * cf });
          // a pulse leaves the hub on every 8th after the hit and runs out to its orb
          const ph = lt >= HIT ? ((lt - HIT) / 0.2 + k * 0.13) % 1 : -1;
          if (ph < 0) { pulses.hide(k); return; }
          pulses.set(k, { p: [lerp(ctr[0], p[0], ph), lerp(ctr[1] + 0.8, p[1], ph), lerp(ctr[2], p[2], ph)], c: ivory, k: 5 * (1 - ph * 0.6) });
        });
        caps.commit(); pulses.commit();
        const dh = lt - HIT;
        ring.visible = dh >= 0 && dh < 0.7;
        if (ring.visible) { const s = lerp(2, 46, ease.expoOut(clamp(dh / 0.7))); ring.scale.set(s, 1, s); ring.userData.set(3.5 * Math.pow(1 - dh / 0.7, 2)); }
        g.bloom.strength = W.bloomHit(1.1, dh, { peak: 1.5, d: 0.5 });
        H.line.update(lt, { lit: 0, strips: 0, dim: 0.12 });
        scr.userData.set(lt < 2.2 ? 0.74 * clamp((lt - 0.02) / 0.2) : 0.45);
        H.extra.length = 0;
        H.extra.push({ p: [ctr[0], 4, ctr[2]], c: C.ivory, k: coord * (2 + 3 * cf), pool: 9, poolK: 0.8, refl: 0, size: 1 });
        H.extra.push({ p: [o[0], 3.5, o[2]], c: C.red, k: 2.5 * Math.exp(-lt / 0.3), pool: 6, poolK: 0.9, refl: 0, size: 1 });
        H.update(lt, { lit: 1 });
        // locked top-down with the master's 2% creep (frame 0 = camErrorTop exactly)
        const fov = W.camErrorTop(camera) * (1 - 0.02 * clamp(lt / ctx.T));
        camera.fov = fov; camera.updateProjectionMatrix();
        camFX(camera, t, fov);
        scr.userData.fit();
      },
    };
  },
  ui(root, tl, K) {
    // statSlam, same slots as the master: number y 470, label y 652, source kicker y 722
    const num = K.text(root, { y: 470, cls: 'mega', html: '×17.2', style: { color: '#CFE3F2', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 38px rgba(207,227,242,0.35), 0 0 4px rgba(0,0,0,0.9)' } });
    K.cutIn(tl, num, 0);
    K.roll(tl, num, 0, 17.2, 4.4, 0.4, (v) => '×' + v.toFixed(1), 'power2.in');
    tl.fromTo(num, { scale: 1.14 }, { scale: 1, duration: 0.14, ease: 'power3.out', immediateRender: false }, 0.4);
    K.push(tl, num, 0.54, 1.66, { from: 1, to: 1.035 });
    const lab = K.text(root, { y: 652, cls: 'slam', html: 'WITH A COORDINATOR:', style: { fontSize: '90px', color: '#FAF9F5', letterSpacing: '-0.02em' } });
    K.slam(tl, lab, 0.0, { from: 1.2, d: 0.26 });
    const src = K.text(root, { y: 722, cls: 'kicker', html: 'SAME STUDY', style: { fontSize: '24px', color: '#CFE3F2' } });
    K.decode(tl, src, 0.2, { d: 0.4, seed: 44 });
    K.cutOut(tl, num, 2.2); K.cutOut(tl, lab, 2.2); K.cutOut(tl, src, 2.2);
  },
});
