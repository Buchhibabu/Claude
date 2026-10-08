// #19 i-card-wall — output at agent speed. 200mm telephoto from 120u, slow push 2%/s: a rack of finished work cards (≈400 instances
// in four depth layers around x -6) rising like an elevator. The long lens collapses the layers into one living wall of ice-edged
// slabs; fog grades them back to front, so the wall still reads deep as it slides. On every 16th a card STAMPS green (edge flare +
// check lamp) and keeps its green lamp as it rises. Thin steel rack rails, a clay glow from the CODE tower behind the left edge.
import { shot, beats, camFX, clamp, lerp, ease, rand } from '../engine.js';
import { W, THREE, motes, darkCards } from './lib/b2-act1a.js';

const CX = -6, CY = 6;
const DX = 3.5, DY = 1.1, V = 2.4;                  // column pitch, row pitch, rise speed (u/s)
const LAYERS = [8, -4, -16, -28];
const TAN = Math.tan(THREE.MathUtils.degToRad(W.FOV[200] / 2));

shot({
  id: 'i-card-wall', dur: beats(2), act: 'I',
  music: { section: 'act1', chord: 'C', div: 16, energy: 0.6, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'tick', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'I', fog: 0.0068 });
    const sky = W.atmosphere({ fogColor: scene.fog.color, glow: 0x1a2430, k: 1.2, horizon: 0.0, width: 0.6 }); scene.add(sky);
    const r = rand(1919);
    // ---- layout: per layer, enough columns/rows to cover the (letterboxed) frame at that depth + margins
    const L = LAYERS.map((z, li) => {
      const d = 120 - z, hw = d * TAN * 16 / 9, hh = d * TAN * (804 / 1080);
      const cols = Math.ceil((2 * hw + DX) / DX) + 1, rows = Math.ceil((2 * hh + 2 * DY) / DY) + 1;
      return { z, li, cols, rows, x0: CX - (cols - 1) * DX / 2 + (r() - 0.5) * DX, y0: CY - (rows - 1) * DY / 2, ph: r() * DY, span: rows * DY, v: V * (1 + 0.06 * li) };
    });
    const cardsL = [];
    L.forEach((ly) => { for (let c = 0; c < ly.cols; c++) for (let rr = 0; rr < ly.rows; rr++) cardsL.push({ ly, c, rr, j: (r() - 0.5) * 0.25, tilt: (r() - 0.5) * 0.03, kk: 0.75 + r() * 0.5 }); });
    const N = cardsL.length;
    const cards = darkCards({ count: N }); scene.add(cards.mesh);
    const lamps = W.orbs({ count: N, r: 0.09, seg: 8 }); scene.add(lamps.mesh);
    // card y at time t (wrapping inside the layer's span: a continuous elevator)
    const cy = (k, t) => { const ly = k.ly; const y = ((k.rr * DY + ly.ph + ly.v * t) % ly.span + ly.span) % ly.span; return ly.y0 - DY + y; };
    // stamps: one per 16th in each of the two front layers (seeded card near a random spot in the lower 2/3 of frame)
    const stamps = new Map();
    for (let e = 0; e < 24; e++) {
      const te = -1 + e / 8;
      for (const li of [0, 1]) {
        const ly = L[li], tx = CX + (r() - 0.5) * 2 * (120 - ly.z) * TAN * 16 / 9 * 0.8, ty = CY + (r() - 0.65) * 1.6 * (120 - ly.z) * TAN * 0.744;
        let best = -1, bd = 1e9;
        cardsL.forEach((k, i) => { if (k.ly !== ly || stamps.has(i)) return; const dd = Math.abs(ly.x0 + k.c * DX - tx) * 0.5 + Math.abs(cy(k, te) - ty); if (dd < bd) { bd = dd; best = i; } });
        if (best >= 0) stamps.set(best, te);
      }
    }
    // rack rails: thin steel uprights between the columns of every layer
    const rails = [];
    L.forEach((ly) => { for (let c = 0; c <= ly.cols; c++) { const x = ly.x0 + (c - 0.5) * DX; rails.push([[x, -2, ly.z - 1.05], [x, 18, ly.z - 1.05]]); } });
    const rack = W.glowSegs(rails, { color: W.C.steel, k: 0.7, width: 1.2 }); scene.add(rack);
    // clay glow of the tower bleeding in behind the left edge + a cold backlight high right
    const clay = W.flare({ color: W.C.clay, k: 4, size: 70, ref: 0.5 }); clay.position.set(-17, 2, -60); scene.add(clay);
    const cold = W.flare({ color: 0x9fc3e0, k: 1.4, size: 70, ref: 0.5 }); cold.position.set(10, 16, -120); scene.add(cold);
    const air = motes({ count: 240, box: [[-20, -1, 30], [8, 14, 70]], color: 0xcfe3f2, k: 0.25, size: 0.09, seed: 191, rise: 0.4, sway: 0.3 });
    scene.add(air.points);
    const green = W.lin(W.C.green), steel = W.lin(W.C.steel);
    const GE = W.CARD.greenEdge(6), ICE = W.CARD.edge(1), CARDB = W.CARD.body(1), FRONT = [1.45, 0.85, 0.55, 0.35];
    const edge = [0, 0, 0], body = [0, 0, 0];
    return {
      scene, camera, ...W.grade('I', { bloom: { strength: 0.95, radius: 0.5, threshold: 0.8 }, vignette: 0.6 }),
      update(lt) {
        const t = ctx.shot.start + lt;
        cardsL.forEach((k, i) => {
          const x = k.ly.x0 + k.c * DX + k.j, y = cy(k, lt), z = k.ly.z;
          const te = stamps.get(i), ds = te === undefined ? -1 : lt - te;
          const g = ds < 0 ? 0 : ds < 0.1 ? 1 : Math.exp(-(ds - 0.1) / 0.12);
          const front = FRONT[k.ly.li], ek = 1.3 * k.kk * front, bk = 0.9 * k.kk * Math.sqrt(front);
          for (let q = 0; q < 3; q++) { edge[q] = lerp(ICE[q] * ek, GE[q], g); body[q] = CARDB[q] * bk + green[q] * 0.12 * g; }
          const pop = ds >= 0 && ds < 0.1 ? 1.2 - 2 * ds : 1;
          cards.set(i, { p: [x, y, z], r: [0, 0, k.tilt], s: pop, edge, body });
          const done = ds >= 0;
          lamps.set(i, { p: [x + 1.15, y, z + 1.02], c: done ? green : steel, k: done ? 3 + 9 * g : 0.8 });
        });
        cards.commit(); lamps.commit();
        air.tick(t);
        clay.userData.set(3.0 + 0.6 * W.beatPulse(t, { div: 2, decay: 5 }));
        // 200mm, slow push 2%/s
        const d = 120 * (1 - 0.02 * lt);
        W.camLook(camera, [CX, CY, d], [CX, CY, 0], W.FOV[200]);
        camFX(camera, t, W.FOV[200]);
      },
    };
  },
});
