// #15 i-orbs-write — M1 (10). 85mm lateral dolly L->R at constant 3 u/s along the CODE station, just above its top: the tower's first
// row of 10 clay orbs (codeTower, count 10) WRITE work cards on 16ths. A writing orb kicks (flare + recoil), the card prints out across
// its width in 2 f, pops with a green edge for 3 f (green light pools on the tabletop), then rides the line's top +x at 8 u/s on one of
// two lanes, trailing an ice smear. Clay light pools under the orbs; behind, the station's cold top-light shaft in black air.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import { W, THREE, atmo, writeSchedule, cardLook, darkCards, spill } from './lib/b2-act1a.js';

const SHIFT = -110;            // lens shift (px): the work band sits on the lower third, the shaft and black air above it
const HOLD = 0.1, SPEED = 8, CY = 3.27, CAMY = 4.2;

shot({
  id: 'i-orbs-write', dur: beats(2), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 16, energy: 0.52, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'chirps', { gain: -12 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, banks: false } });
    const A = atmo(scene, H, {
      station: false,
      shafts: [{ x: -36, z: -70, r: 6, op: 0.16, from: [40, 230, 60], light: false }, { x: 2, z: -95, r: 8, op: 0.13, from: [40, 230, 60], light: false }],
      haze: [{ x: -20, z: -40, ry: 0, w: 140, h: 22, k: 0.035 }, { x: -20, z: -110, ry: 0, w: 260, h: 40, k: 0.045 }],
      near: { count: 60, box: [[-34, 2.5, 10], [-8, 7.5, 15]], color: 0xffc9a8, k: 0.16, size: 0.16, seed: 151, rise: 0.05, sway: 0.2 },
      motesN: 200, poolK: 0.4,
    });
    const orbX = Array.from({ length: 10 }, (_, i) => H.tower.orbPos(i)[0]);
    const OZ = H.tower.orbPos(0)[2], OY = H.tower.orbPos(0)[1];
    const S = writeSchedule({ xs: orbX, lanes: [2.4, -1.8], t0: -1.375, t1: 1.0, step: 0.125, speed: SPEED, hold: HOLD, seed: 1515 });
    const N = S.cards.length;
    const cards = darkCards({ count: N }); scene.add(cards.mesh);
    const tailCols = []; for (let i = 0; i < N; i++) tailCols.push(W.lin(W.C.ice, 1.0), [0, 0, 0]);
    const trails = W.glowSegs(Array.from({ length: N }, () => [[0, -50, 0], [0.01, -50, 0]]), { colors: tailCols, k: 1.3, width: 1.3, offset: false });
    scene.add(trails);
    const tp = new Float32Array(N * 6);
    const top = spill({ w: 44, d: 10, y: 3.015, center: [-19.6, 0] }); scene.add(top);
    const fl = orbX.map((x) => { const f = W.flare({ color: W.C.clay, k: 0, size: 2.4 }); f.position.set(x, OY, OZ + 0.4); scene.add(f); return f; });
    const TI = H.tower.I, clayL = W.lin(W.C.clay);
    const pools = [];
    return {
      scene, camera, ...W.grade('I', { bloom: { strength: 0.95, radius: 0.45, threshold: 0.8 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        pools.length = 0;
        // orbs: steady row, pulsing on 8ths; the one writing kicks (k up, small recoil)
        H.tower.update(lt, { count: 10, k: 10, t, pulse: 0.15 });
        const kick = new Float32Array(10);
        for (const c of S.cards) { const d = lt - c.te; if (d >= 0 && d < 0.3) kick[c.src] = Math.max(kick[c.src], Math.exp(-d / 0.07)); }
        const beat = W.beatPulse(t, { div: 2 });
        for (let i = 0; i < 10; i++) {
          const p = H.tower.orbPos(i);
          TI.set(i, { p: [p[0], p[1] + 0.12 * kick[i], p[2] - 0.25 * kick[i]], s: 1 + 0.25 * kick[i], c: clayL, k: 10 * (1 + 0.15 * beat) + 10 * kick[i] });
          fl[i].userData.set(1.0 + 5 * kick[i]);
          pools.push({ x: p[0], z: -5.2, r: 1.8, k: 1.5 + 2 * kick[i], c: W.C.clay });
        }
        TI.commit();
        // cards: print in (x scale 0 -> 1 over 2 f), green edge 3 f, then ride +x at 8 u/s with a smear
        S.cards.forEach((c, i) => {
          const d = lt - c.te;
          if (d < 0) { cards.hide(i); tp.set([0, -50, 0, 0.01, -50, 0], i * 6); return; }
          const x = S.x(c, lt);
          const pr = ease.out(clamp(d / (2 / 30)));
          const L = cardLook(d, { k: 1.6 });
          const pop = d < HOLD ? 1 + 0.18 * (1 - d / HOLD) : 1;
          cards.set(i, { p: [x, CY + 0.06 * (1 - pr), c.z], s: [Math.max(0.02, pr) * pop, pop, pop], edge: L.edge, body: L.body });
          const sp = clamp((d - HOLD) / 0.05);
          tp.set([x - 1.5, CY + 0.26, c.z + 1, x - 1.5 - 3.4 * sp, CY + 0.26, c.z + 1], i * 6);
          if (x < -5) pools.push({ x, z: c.z, r: L.g > 0.05 ? 2.2 : 1.8, k: 0.35 + 3.5 * L.g, c: L.g > 0.05 ? W.C.green : W.C.ice });
        });
        cards.commit(); trails.geometry.setPositions(tp);
        top.userData.set(pools);
        H.line.update(lt, { lit: 0, dim: 0.5 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.15 });
        A.update(lt, t, {});
        H.update(lt, { sky: 1.6, pillarK: 0.4 });
        // 85mm lateral track, constant velocity
        W.camLook(camera, [-26 + 3 * lt, CAMY, 22], [-23 + 3 * lt, 3, 0], W.FOV[85]);
        camera.setViewOffset(1920, 1080, 0, SHIFT, 1920, 1080);
        camFX(camera, t, W.FOV[85]);
      },
    };
  },
});
