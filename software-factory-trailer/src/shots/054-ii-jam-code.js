// 54 ii-jam-code — backpressure 3 reaches CODE. 50mm macro at the crown of the 1,000-orb code tower: every tier is a bank of
// half-open drawers, dark work cards being stamped out of the +x (flow) face by the edge orbs. The backpressure CLIMBS the tower
// (bottom -> top, 130 u/s): as it passes each tier that tier hard-brakes — orbs freeze mid-stamp and drop to 35%, cards stop dead
// half-out with a tiny recoil, a red stop pinpoint locks at every stuck card's tip. Frame 0: the lower tiers are already dead and
// red-tipped, the crown still running hot; by frame 4 the crown dies too. 4% creep push through the frozen machine.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as B from './lib/b5-act2b.js';
const { W, THREE } = B;

const LOCK0 = 15, LOCKV = 130;                       // lock height at frame 0, climb speed (u/s)
const tierY = (tier) => 3.6 + tier * 3;
const stallAt = (y) => (y - LOCK0) / LOCKV;          // local time the lock passes height y (<0: already stalled at frame 0)

shot({
  id: 'ii-jam-code', dur: beats(1), act: 'II',
  music: { section: 'act2', chord: 'Bb', div: 32, energy: 0.85, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { fog: 0.03 });
    ctx.sfx(0, 'boom', { gain: -6 });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, banks: false, foreman: false } });
    H.tower.crest.visible = false;
    // drawers: cards half-out of the +x face between tiers (10 per gap, tiers 3..9)
    const TIERS = [3, 4, 5, 6, 7, 8, 9];
    const NC = TIERS.length * 10;
    const Cd = W.boxes({ count: NC, size: [1.9, 0.3, 1.2], color: 0x15171b, metal: 0.35, rough: 0.45, edgeW: 1.5, crowd: 0.5 }); scene.add(Cd.mesh);
    const r = rand(5401);
    const xFace = -19.6 + 4.5 * 1.6 + 0.35;
    const TAU = 0.035;
    const slots = [];
    TIERS.forEach((tier) => { for (let row = 0; row < 10; row++) {
      const y = tierY(tier) - 0.6;
      slots.push({ z: (row - 4.5) * 1.6, y, out0: 0.25 + r() * 0.55, v: 6 + r() * 5, ry: (r() - 0.5) * 0.08, ts: stallAt(tierY(tier)), ph: r() });
    } });
    const Pn = W.orbs({ count: NC, r: 0.12, seg: 6 }); scene.add(Pn.mesh);
    const red = W.lin(W.C.red), hot = W.lin(0xff9a7a), clay = W.lin(W.C.clay), clayHot = W.lin(0xffb08a);
    const eRun = W.lin(W.C.ice, W.kl(1.8)), eDead = W.lin(W.C.ice, W.kl(0.9));
    const g = B.grade2({ vignette: 0.62, bloom: { strength: 0.95, radius: 0.45, threshold: 0.8 } });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const lockY = LOCK0 + LOCKV * lt;
        // orbs: running tiers stamp + pulse hot; stalled tiers frozen at their stall instant, 35%, flash as the lock passes
        H.tower.update(lt, { count: 1000, k: 0, t });
        for (let i = 0; i < 1000; i++) {
          const tier = Math.floor(i / 100), col = i % 10, ty = tierY(tier);
          const ts = stallAt(ty);
          const tt = t - lt + B.brake(lt, ts, TAU);              // machine time for this tier
          const p = H.tower.orbPos(i);
          const ph = ((i * 0.618) % 1);
          const dip = col === 9 ? 0.32 * Math.max(0, Math.sin((tt * 8 + ph) * Math.PI * 2)) : 0;
          const pu = 1 + 0.25 * Math.sin((tt * 4 + ph) * Math.PI * 2);
          const dead = lt > ts;
          const flash = dead ? Math.exp(-(lt - ts) / 0.05) : 0;
          const k = (dead ? lerp(4.2, 26, flash) : 24) * pu * (col === 9 ? 1 + 0.5 * dip / 0.32 : 1);
          const c = dead ? clay : [lerp(clay[0], clayHot[0], 0.35), lerp(clay[1], clayHot[1], 0.35), lerp(clay[2], clayHot[2], 0.35)];
          H.tower.I.set(i, { p: [p[0], p[1] - dip, p[2]], s: 1, c, k: k * 0.45 });
        }
        H.tower.I.commit();
        for (let i = 0; i < NC; i++) {
          const s = slots[i];
          const dead = lt > s.ts;
          const recoil = dead ? -0.07 * Math.exp(-(lt - s.ts) / 0.06) * Math.sin((lt - s.ts) * 50) : 0;
          const out = s.out0 + 0.55 + s.v * (B.brake(lt, s.ts, TAU) - s.ts - TAU) + recoil;
          const x = xFace - 0.95 + out;
          Cd.set(i, { p: [x, s.y, s.z], r: [0, s.ry, 0], edge: dead ? eDead : eRun, body: [0, 0, 0] });
          if (!dead) { Pn.hide(i); continue; }
          const f = Math.exp(-(lt - s.ts) / 0.06);
          Pn.set(i, { p: [x + 0.97, s.y + 0.02, s.z], c: [lerp(red[0], hot[0], f), lerp(red[1], hot[1], f), lerp(red[2], hot[2], f)], k: 8 + 10 * f });
        }
        Cd.commit(); Pn.commit();
        H.line.update(lt, { lit: 0, dim: 0.3, red: [0, 0, 0.8, 1, 1, 1, 0.6], strips: 0, conveyorK: 0.3 });
        H.extra.length = 0;
        H.extra.push({ p: [-11, Math.min(lockY, 31), 0], c: W.C.red, k: 2, pool: 5, poolK: 0.4, refl: 0.2, size: 2 });
        H.update(lt, { sky: 1.2 });
        // camera: 50mm, front-right just above the crown, 4% creep; a clunk as the crown dies
        const u = clamp(lt / ctx.T);
        const tc = stallAt(tierY(9));
        const clunk = lt < tc ? 0 : 0.22 * Math.exp(-(lt - tc) / 0.07) * Math.sin((lt - tc) * 70);
        const tg = [-15.4, 29.3, 0];
        const p0 = [-2.8, 33.4, 17.2];
        const pu = 0.04 * ease.out(u);
        const pos = [lerp(p0[0], tg[0], pu), lerp(p0[1], tg[1], pu) + clunk, lerp(p0[2], tg[2], pu)];
        W.camLook(camera, pos, [tg[0], tg[1] + clunk * 0.4, tg[2]], W.FOV[50], { roll: -2 });
        W.handheld(camera, t, 0.3, 54);
        camFX(camera, t, W.FOV[50]);
      },
    };
  },
});
