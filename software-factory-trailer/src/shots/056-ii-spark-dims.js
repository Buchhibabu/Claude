// 56 ii-spark-dims — the protagonist overwhelmed. 85mm macro: the one clay spark (M1) hangs dead centre inside the cold flat swarm,
// ringed by glass ice orbs that jostle and crowd in on it. Its blink stutters OFF the tick (irregular on/off, each relight weaker)
// while it dims k10 -> 3; the clay it throws onto the inner rims of its neighbours drains back to ice. Out-of-focus swarm bokeh in front
// and behind (fake shallow DOF), a few red pinpoints far behind. Slow push + handheld.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

const SP = [-16, 3.6, 4];                 // the spark, just above the CODE deck
// stuttering blink: [start, end, k] segments (local s). On the cut it is on at k10, then fails off-grid, each relight dimmer.
const SEGS = [[0, 0.07, 10], [0.1, 0.135, 7.5], [0.2, 0.22, 6], [0.27, 0.34, 4.6], [0.4, 0.5, 3]];
const sparkK = (lt) => { for (const [a, b, k] of SEGS) if (lt >= a && lt < b) return k * (lt - a < 1 / 30 ? 1.25 : 1); return 0; };

shot({
  id: 'ii-spark-dims', dur: beats(1), act: 'II',
  music: { section: 'act2', chord: 'C', div: 32, energy: 0.88, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { fog: 0.012 });
    ctx.sfx(0, 'boom', { gain: -6 });
    // the spark: hot-core orb + flare + a little clay light on its neighbours
    const S = W.orbs({ count: 1, r: 0.17, seg: 24 }); scene.add(S.mesh);
    const SF = W.flare({ color: W.C.clay, k: 0, size: 2.2, ref: 0.1 }); SF.position.set(...SP); scene.add(SF);
    const PL = new THREE.PointLight(W.C.clay, 0, 6, 1.6); PL.position.set(...SP); scene.add(PL);
    // ring of glass agents crowding it + a looser second shell
    const r = rand(5601);
    const NR = 26;
    const A = B.rimOrbs({ count: NR, r: 0.34, seg: 26, core: 0.3, pow: 2.8 }); scene.add(A.mesh);
    const ring = Array.from({ length: NR }, (_, i) => {
      const inner = i < 11;
      const a = (i / (inner ? 11 : NR - 11)) * Math.PI * 2 + (r() - 0.5) * 0.9;
      const rad = inner ? 0.8 + r() * 0.55 : 1.7 + r() * 1.4;
      return { a, rad, dz: (r() - 0.5) * (inner ? 1.0 : 2.4), ph: r() * 10, sp: 0.8 + r() * 1.4, s: 0.85 + r() * 0.3, inner };
    });
    // fake DOF: big soft discs in front, small ones behind; a few red pinpoints far back
    const FG = [], BG = [];
    for (let i = 0; i < 4; i++) { const s = B.bokeh({ color: W.C.ice, k: 0.03, size: 0.6 + r() * 0.4 }); const side = i % 2 ? 1 : -1; s.position.set(SP[0] + side * (1.6 + r() * 1.2), SP[1] + (r() - 0.5) * 1.6, SP[2] + 7 + r() * 3); s.userData.home = s.position.toArray(); s.userData.ph = r() * 9; scene.add(s); FG.push(s); }
    for (let i = 0; i < 46; i++) { const red = i < 5; const s = B.bokeh({ color: red ? W.C.red : W.C.ice, k: red ? 0.45 : 0.05 + r() * 0.07, size: red ? 0.7 + r() * 0.5 : 0.6 + r() * 1.1 }); s.position.set(SP[0] + (r() - 0.5) * 22, SP[1] + (r() - 0.5) * 8 + (red ? 3 : 0), SP[2] - 6 - r() * 18); s.userData.home = s.position.toArray(); s.userData.ph = r() * 9; scene.add(s); BG.push(s); }
    const ice = W.lin(W.C.ice), clay = W.lin(W.C.clay);
    const g = B.grade2({ vignette: 0.62, bloom: { strength: 0.95, radius: 0.5, threshold: 0.78 } });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const k = sparkK(lt);
        const on = k > 0 ? 1 : 0;
        S.set(0, { p: SP, c: clay, k: k * 2.2 }); if (!on) S.hide(0); S.commit();
        SF.userData.set(k * 0.7, W.C.clay);
        PL.intensity = 3 * k;
        const crowd = ease.inOut(clamp(lt / ctx.T));
        for (let i = 0; i < NR; i++) {
          const o = ring[i];
          const a = o.a + Math.sin(t * o.sp + o.ph) * 0.12;
          const rad = o.rad * (1 - 0.18 * crowd * (o.inner ? 1 : 0.6)) + Math.sin(t * 6.3 + o.ph) * 0.05;
          const p = [SP[0] + Math.cos(a) * rad, SP[1] + Math.sin(a) * rad * 0.8, SP[2] + o.dz + Math.sin(t * 4.1 + o.ph) * 0.08];
          // inner rims catch the spark's clay, scaled by its current k and proximity
          const near = o.inner ? Math.exp(-(rad - 0.9) * 1.6) : 0.15;
          const w = clamp(k / 10) * near * 0.85;
          const c = [lerp(ice[0], clay[0], w), lerp(ice[1], clay[1], w), lerp(ice[2], clay[2], w)];
          A.set(i, { p, s: o.s, c, k: o.inner ? 0.75 + w * 1.4 : 0.42 });
        }
        A.commit();
        FG.forEach((s, i) => { const h = s.userData.home; s.position.set(h[0] + Math.sin(t * 0.9 + s.userData.ph) * 0.4 - lt * 0.8, h[1], h[2]); });
        BG.forEach((s) => { const h = s.userData.home; s.position.set(h[0] + Math.sin(t * 0.7 + s.userData.ph) * 0.3, h[1] + Math.cos(t * 0.6 + s.userData.ph) * 0.2, h[2]); });
        // 85mm, slightly above, slow push 5% + a tiny arc
        const u = ease.out(clamp(lt / ctx.T));
        const d = 15.5 * (1 - 0.05 * u);
        const az = THREE.MathUtils.degToRad(5 + 2.5 * u);
        const pos = [SP[0] + Math.sin(az) * d, SP[1] + 1.1, SP[2] + Math.cos(az) * d];
        W.camLook(camera, pos, SP, W.FOV[85], { roll: -1.5 });
        W.handheld(camera, t, 0.3, 56);
        camFX(camera, t, W.FOV[85]);
      },
    };
  },
});
