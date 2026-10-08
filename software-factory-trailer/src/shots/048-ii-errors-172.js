// 48 ii-errors-172 — MASTER E. One red spark jumps orb to orb across 300 ice orbs and branches into exactly 17 red tendrils
// that hop outward on 8ths; the counter rolls to ×17.2 and lands on the A hit at 0.5. Locked top-down camErrorTop (mirror: iii-coord-44).
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

shot({
  id: 'ii-errors-172', dur: beats(5.5), act: 'II',
  music: { section: 'act2', chord: 'Bb', div: 16, energy: 0.75, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx);
    ctx.fx.hit(0.5, 'A');
    ctx.fx.glitch(0.5, 0.13);
    ctx.sfx(0, 'chirps', { gain: -8 });
    ctx.sfx(0.5, 'impact', { gain: 0 });
    ctx.sfx(0.5, 'glitch', { gain: -6 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, pillars: false, foreman: false } });
    const E = W.errorMap({}); scene.add(E.group);
    const P = E.positions, T = E.tendrils;
    // tendril tips: a hot red orb + flare riding the front of each of the 17 tendrils, landing on every 8th
    const tips = W.orbs({ count: 17, r: 0.42, seg: 10 }); scene.add(tips.mesh);
    const tipFl = T.map(() => { const f = W.flare({ color: W.C.red, k: 0, size: 1.8 }); scene.add(f); return f; });
    // shockwave ring under the hit (soft red ring expanding from the origin)
    const ringPts = Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * Math.PI * 2; return [Math.cos(a), 0, Math.sin(a) * 0.62]; });
    const ring = W.fat(ringPts, { color: W.C.red, k: 3, width: 2.5 }); scene.add(ring);
    const o = P[E.origin];
    ring.position.set(o[0], 3.1, o[2]);
    const red = W.lin(W.C.red), hot = W.lin(0xff9a7a);
    const scr = B.camScrim(scene, camera, { x: 960, y: 575, w: 1900, h: 760, a: 0 });
    const g = B.grade2({ vignette: 0.6 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        scene.fog.density = W.fogKeep(160, 0.85);
        // hops on 8ths (global grid): step 0 at the cut, then one hop per 8th
        const step = Math.floor(lt / 0.25 + 1e-6);
        const sub = lt - step * 0.25;
        const hop = ease.expoOut(clamp(sub / 0.07));
        const grow = clamp((step + 1) / 9.5);
        E.update(lt, { grow, keep: 17, spark: -1, t, orbK: 4.2, tendrilK: 4.2 * (1 + 0.7 * B.impulse(lt, 0.5, 0.25)) });
        T.forEach((path, k) => {
          const n = Math.min(path.length - 1, Math.floor(path.length * grow));
          const a = P[path[Math.max(0, n - 1)]], b = P[path[n]];
          const u = n === 0 ? 1 : hop;
          const x = lerp(a[0], b[0], u), z = lerp(a[2], b[2], u);
          const land = Math.exp(-sub / 0.09);
          const done = n >= path.length - 1 && sub > 0.12 ? 0.35 : 1;
          tips.set(k, { p: [x, a[1] + 0.5, z], c: hot, k: (5 + 9 * land) * done });
          tipFl[k].position.set(x, a[1] + 0.6, z); tipFl[k].userData.set((1 + 3.5 * land) * done, W.C.red);
        });
        tips.commit();
        // the hit: shock ring + whole map flares
        const dh = lt - 0.5;
        ring.visible = dh >= 0 && dh < 0.7;
        if (ring.visible) { const s = lerp(2, 46, ease.expoOut(clamp(dh / 0.7))); ring.scale.set(s, 1, s); ring.userData.set(4 * Math.pow(1 - dh / 0.7, 2)); }
        g.bloom.strength = W.bloomHit(0.9, dh, { peak: 1.5, d: 0.5 });
        H.line.update(lt, { lit: 0, dim: 0.12 });
        scr.userData.set(0.78 * clamp((lt - 0.05) / 0.25));
        H.extra.length = 0;
        H.extra.push({ p: [o[0], 3.5, o[2]], c: W.C.red, k: 2 + 3 * B.impulse(lt, 0.5, 0.3), pool: 7, poolK: 0.9, refl: 0, size: 1 });
        H.update(lt);
        // locked top-down with a 2% creep (frame 0 = camErrorTop exactly, for the mirror)
        const fov = W.camErrorTop(camera) * (1 - 0.02 * clamp(lt / ctx.T));
        camera.fov = fov; camera.updateProjectionMatrix();
        camFX(camera, t, fov);
        scr.userData.fit();
      },
    };
  },
  ui(root, tl, K) {
    const num = K.text(root, { y: 470, cls: 'mega', html: '×1.0', style: { color: '#FF453A', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 38px rgba(255,69,58,0.45), 0 0 4px rgba(0,0,0,0.9)' } });
    K.cutIn(tl, num, 0);
    K.roll(tl, num, 0, 1.0, 17.2, 0.5, (v) => '×' + v.toFixed(1), 'power2.in');
    tl.fromTo(num, { scale: 1.14 }, { scale: 1, duration: 0.14, ease: 'power3.out', immediateRender: false }, 0.5);
    K.push(tl, num, 0.64, 2.1, { from: 1, to: 1.035 });
    const lab = K.text(root, { y: 652, cls: 'slam', html: 'INDEPENDENT AGENTS: ERRORS', style: { fontSize: '90px', color: '#FAF9F5', letterSpacing: '-0.02em' } });
    K.maskUp(tl, lab, 0.1, { d: 0.4 });
    const src = K.text(root, { y: 722, cls: 'kicker', html: 'GOOGLE RESEARCH', style: { fontSize: '30px', color: '#CFE3F2' } });
    K.decode(tl, src, 0.3, { d: 0.45, seed: 17 });
  },
});
