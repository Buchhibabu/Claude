// #18 i-top-100 — M1 (100), top angle. 50mm straight down on the CODE station (camera.up -z, yaw 5 deg/s), craning down onto it:
// the 10x10 tier of clay orbs is the only warm patch on the black floor. The slab breathes on 8ths — each 8th a wave of light runs
// across it left -> right (the writing direction) — and on every write a chase of light runs down one row into the slab's right edge,
// where a green-edged card prints out and streams off the right of frame along the line's top. Warm spill under the slab, steel edges.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import { W, THREE, motes, writeSchedule, cardLook, darkCards, spill } from './lib/b2-act1a.js';

const HOLD = 0.08, SPEED = 8, CY = 3.27, SPAWN = -10.3;
const LANES = [-4.0, -0.8, 2.4];          // = rows 2, 4, 6 of the slab

shot({
  id: 'i-top-100', dur: beats(2), act: 'I',
  music: { section: 'act1', chord: 'Bb', div: 16, energy: 0.58, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'chirps', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, banks: false, foreman: false } });
    const S = writeSchedule({ xs: [SPAWN], lanes: LANES, t0: -1.5, t1: 1.0, step: 1 / 8, speed: SPEED, hold: HOLD, seed: 1818 });
    const N = S.cards.length;
    const cards = darkCards({ count: N }); scene.add(cards.mesh);
    const tailCols = []; for (let i = 0; i < N; i++) tailCols.push(W.lin(W.C.ice, 1.0), [0, 0, 0]);
    const trails = W.glowSegs(Array.from({ length: N }, () => [[0, -50, 0], [0.01, -50, 0]]), { colors: tailCols, k: 1.1, width: 1.2, offset: false });
    scene.add(trails);
    const tp = new Float32Array(N * 6);
    const top = spill({ w: 30, d: 10, y: 3.015, center: [-17, 0] }); scene.add(top);
    const dust = motes({ count: 220, box: [[-34, 8, -12], [-5, 34, 12]], color: 0xcfe3f2, k: 0.14, size: 0.14, seed: 181, rise: 0.15, sway: 0.4 });
    scene.add(dust.points);
    const TI = H.tower.I, P = H.tower.orbPos, clayL = W.lin(W.C.clay), hotL = W.lin(0xffd9c2);
    const pools = [];
    return {
      scene, camera, ...W.grade('I', { bloom: { strength: 0.9, radius: 0.45, threshold: 0.82 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        pools.length = 0;
        // chase of light down the writing row (L -> R), arriving at the slab's right edge as the card prints
        const kick = new Float32Array(100);
        for (const c of S.cards) {
          const row = Math.round((c.z + 7.2) / 1.6);
          for (let col = 0; col < 10; col++) { const d = lt - (c.te - (9 - col) * 0.014); if (d >= 0 && d < 0.3) kick[row * 10 + col] = Math.max(kick[row * 10 + col], Math.exp(-d / 0.03)); }
        }
        for (let i = 0; i < 100; i++) {
          const p = P(i), col = i % 10;
          const wave = W.beatPulse(t - col * 0.02, { div: 2, decay: 7 });
          const kk = kick[i];
          TI.set(i, { p, s: 1 + 0.1 * wave + 0.25 * kk, c: clayL, k: 3.6 + 3 * wave + 4.5 * kk });
        }
        for (let i = 100; i < 1000; i++) TI.hide(i);
        TI.commit(); H.tower.crest.visible = false;
        const beat = W.beatPulse(t, { div: 2, decay: 6 });
        for (let r = 0; r < 10; r += 3) pools.push({ x: -19.6, z: -7.2 + r * 1.6 + 0.8, r: 7.5, k: 0.5 + 0.25 * beat, c: W.C.clay });
        // cards: print at the slab's right edge, green pop, ride +x off frame
        S.cards.forEach((c, i) => {
          const d = lt - c.te;
          if (d < 0) { cards.hide(i); tp.set([0, -50, 0, 0.01, -50, 0], i * 6); return; }
          const x = S.x(c, lt);
          const pr = ease.out(clamp(d / (2 / 30)));
          const L = cardLook(d, { k: 1.5, flash: 0.1 });
          cards.set(i, { p: [x - 1.5 * (1 - pr), CY, c.z], s: [Math.max(0.02, pr), 1, 1], edge: L.edge, body: L.body });
          const sp = clamp((d - HOLD) / 0.05);
          tp.set([x - 1.5, CY + 0.3, c.z, x - 1.5 - 2.6 * sp, CY + 0.3, c.z], i * 6);
          if (L.g > 0.05) pools.push({ x, z: c.z, r: 2.4, k: 3 * L.g, c: W.C.green });
        });
        cards.commit(); trails.geometry.setPositions(tp);
        top.userData.set(pools);
        dust.tick(t);
        H.line.update(lt, { lit: 0, dim: 0.6 });
        H.extra.length = 0;
        H.extra.push({ p: [-19.6, 3.6, 0], c: W.C.clay, k: 3 + 1.2 * beat, pool: 12, poolK: 1.0, refl: 0, size: 7 });
        H.update(lt, { sky: 1 });
        // crane down onto the slab (57 -> 44u: the full 10x10 reads inside the bars, then the push), yaw 5 deg/s
        const h = lerp(57, 44, ease.out(clamp(lt / ctx.T)));
        camFX(camera, t, W.camTop(camera, -19.6, h, 0, W.FOV[50], -4 + 5 * lt));
      },
    };
  },
});
