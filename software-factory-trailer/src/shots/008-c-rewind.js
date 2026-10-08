// 008 c-rewind — REWIND. The cold-open world (circuit floor, 1,000 rails, 7 lit stations, the 1,000-orb tower) dies in reverse:
// the dark eats the board from the edges inward behind a white-hot retreating front, the stations gutter out outside-in, the tower
// is switched off tier by tier from the crest down (each tier pops white and dies), and the last tier IMPLODES into the clay cursor
// on the CODE screen while a 24mm yank (expo.in) hauls the lens back and up 160u. Grade drains warm -> steel. At 1.25 s the frame is
// black except that one cursor; it blinks once on the 7.5 tick; the last 4 f are black. Cursor lands where i-hall-wide's cursor sits.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b1-cold.js';
const { THREE } = W;

const CUR = W.POS.cursor;                         // (-19.6, 2.5, 5.3)
const P0 = [-19.6, 30, 30], P1 = [-19.6, 120, 160];
const SHIFT = [-33, -163];                        // lens shift (px): cursor lands at (993, 703) = its spot in i-hall-wide
const T_RAIL = 0.5, T_ST0 = 0.4, T_TW0 = 0.6, T_TIER = 0.05, T_IMP = 1.08, T_GONE = 1.25, T_BLINK = 1.5, T_END = 2 - 4 / 30;

shot({
  id: 'c-rewind', dur: beats(4), act: 'COLD',
  music: { section: 'cold', chord: 'Dm', div: 4, energy: 0.2, add: [], drop: ['pulse', 'strings'] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'impact', { gain: -8 });
    ctx.sfx(0, 'tape_stop', { dur: 0.7, gain: 0 });
    ctx.sfx(1.5, 'tick', { gain: -6 });
    const { scene, camera } = W.stage({ act: 'COLD' });
    const H = W.hall(scene, { state: 'cold', parts: { banks: false, foreman: false, rails: true, tower: true, cursor: true } });
    const SF = B.stationFlow({ skip: [W.ST.CODE] }); scene.add(SF.mesh);
    const CB = B.circuitBoard({ seed: 219, radius: 120, buses: 170, rails: false }); scene.add(CB.group);
    CB.ring.visible = false;
    // embers from the wave-one tower, now falling back down (rewound)
    const em = B.embers({ count: 900, center: [-19.6, 0, 4], spread: [46, 40, 36], rise: 5, sway: 0.5, color: W.C.amberRail, k: 0.8, size: 0.16, seed: 808 });
    scene.add(em.points);
    // the implosion: a hot streak that collapses onto the cursor as the last tier is sucked in
    const pinch = B.anamorphic({ color: W.C.clay, k: 0, w: 16, h: 0.35 }); pinch.position.set(CUR[0], CUR[1], CUR[2] + 0.3); scene.add(pinch);
    const pools = W.STATIONS.map((st) => ({ p: [st.cx, 4, 0], c: st.i === W.ST.CODE ? W.C.clay : W.C.amber, k: 5, pool: 12, poolK: 0.7, refl: 0, size: 6 }));
    const TI = H.tower.I, tpos = H.tower.orbPos, clayL = W.lin(W.C.clay), hotL = W.lin(0xfff0dc);
    // station death order: outside-in by distance from CODE
    const stDie = W.STATIONS.map((st) => T_ST0 + (1 - Math.abs(st.cx - W.POS.cursor[0]) / 80) * 0.27);
    // a dying fluorescent: holds, stutters for 0.1 s, then off (deterministic)
    const die = (dt, seed) => { if (dt <= 0) return 1; if (dt > 0.1) return 0; const f = Math.floor(dt * 60); return [0.5, 1.15, 0.1, 0.7, 0.05, 0.3][(f + seed) % 6] * (1 - dt / 0.1); };
    const D0 = Math.max(CB.maxD, H.rails.maxT * 160) + 4;
    const gr = W.grade('COLD');
    const tintA = [1.05, 1.0, 0.94], tintB = [0.95, 1.0, 1.08];
    const fogA = new THREE.Color(0x0b0907), fogB = new THREE.Color(0x05070a);
    return {
      scene, camera, ...gr,
      update(lt) {
        const t = ctx.shot.start + lt;
        // ---- 1. rails + circuit board: reverse cascade, edges -> CODE, decelerating with the tape stop
        const front = D0 * Math.pow(1 - clamp(lt / T_RAIL), 3);
        const railRew = H.rails.maxT - front / 160;
        const tape = Math.min(lt, 0.7) - Math.min(lt, 0.7) ** 2 / 1.4;   // integral of a linear wind-down to 0 at 0.7 s (tape stop)
        const dimF = clamp(1 - (lt - 0.45) / 0.5);                         // residual (unlit) glow of traces/edges drains to black by ~0.95 s
        H.rails.update(lt, { cascade: 99, rewind: railRew, flow: 1, t: 50 - 30 * tape, k: 4, dim: 0.03 * dimF });
        CB.update(lt, { cascade: 99, rewind: (CB.maxD - front) / 160, k: 1.6, hotK: 9, t: 20 - 1.5 * tape, pulse: Math.max(0, 1 - lt / 0.5), ring: 0, coreK: 4, dim: 0.03 * dimF });
        CB.group.visible = lt < 1.0;
        // ---- 2. stations gutter out, outside-in; their work flow runs BACKWARDS and stalls (tape stop)
        const lit = stDie.map((d, i) => die(lt - d, i));
        H.line.update(lt, { lit, strips: 0, dim: 0.4 * clamp(1 - (lt - 0.6) / 0.5), conveyorK: 3 * Math.min(...lit.map((v, i) => (i === W.ST.CODE ? 1 : v))) + 0.0 });
        SF.update(lt, { speed: 1, k: 3, t: 40 - 14 * tape, body: 0.55, on: lit });
        // ---- 3. tower: crest + tiers die top-down (each pops white for a frame), last tier implodes into the cursor
        const killed = lt < T_TW0 ? 0 : Math.min(9, Math.floor((lt - T_TW0) / T_TIER) + 1);   // tiers 10..2 (index 9..1)
        const alive = 10 - killed;
        const warm = 1 - 0.35 * clamp((lt - 0.3) / 0.8);
        const comp = (n) => lerp(1, 0.45, clamp((n - 100) / 900));          // undo the tower's density compensation: survivors keep their brightness
        const kOrb = 10 * warm * comp(1000) / comp(alive * 100);
        H.tower.update(lt, { count: alive * 100, k: kOrb, crest: lt < T_TW0 ? 1 : 0, t, pulse: 0.25 });
        if (killed > 0 && killed <= 9) {                     // the tier switched off this step flashes white then dies
          const tier = 10 - killed, dtk = lt - (T_TW0 + (killed - 1) * T_TIER);
          if (dtk < 1.5 / 30) for (let j = 0; j < 100; j++) TI.set(tier * 100 + j, { p: tpos(tier * 100 + j), c: clayL, k: kOrb * comp(alive * 100) * (1.6 - dtk * 12) });
        }
        if (lt >= T_IMP - 0.04) {                             // last tier: sucked into the cursor (reverse of its birth)
          const u = clamp((lt - T_IMP) / (T_GONE - T_IMP));
          for (let j = 0; j < 100; j++) {
            const p = tpos(j), uj = clamp(u * 1.15 - (Math.abs(p[0] - CUR[0]) + Math.abs(p[2] - CUR[2])) * 0.008);
            const e = ease.in(uj);
            if (uj >= 1) { TI.hide(j); continue; }
            TI.set(j, { p: [lerp(p[0], CUR[0], e), lerp(p[1], CUR[1], e), lerp(p[2], CUR[2], e)], s: 1 - 0.85 * e, c: e > 0.6 ? hotL : clayL, k: 7 + 10 * e });
          }
        }
        TI.commit();
        // ---- 4. the cursor: steady through the death, flares as the tier lands in it, dark beat, ONE blink on the 7.5 tick, last 4 f black
        const absorb = lt >= T_IMP ? Math.exp(-Math.max(0, lt - T_GONE) / 0.07) * clamp((lt - T_IMP) / (T_GONE - T_IMP)) : 0;
        let on = 1, k = 10, fl = 0.15;
        if (lt >= T_GONE + 0.12 && lt < T_BLINK) on = 0;
        if (lt >= T_BLINK) { const d = lt - T_BLINK; k = 10 + 5 * Math.exp(-d / 0.05); fl = 0.6 * Math.exp(-d / 0.08) + 0.2; }
        if (lt >= T_END) on = 0;
        H.cursor.update(lt, { on, k: k + 6 * absorb, flare: on * (fl + 1.2 * absorb), screenK: 0.4 * clamp(1 - (lt - 0.5) / 0.6) + 0.0, type: 1, lines: 1 });
        pinch.userData.set(lt >= T_IMP && lt < T_GONE + 0.2 ? 3 * absorb : 0);
        pinch.scale.set(16 * (1 - 0.7 * clamp((lt - T_IMP) / (T_GONE - T_IMP))), 0.35, 1);
        // ---- floor light, embers, pillars, grade drain
        H.extra.length = 0;
        pools.forEach((s, i) => H.extra.push({ ...s, k: 5 * lit[i] * (i === W.ST.CODE ? warm * (alive / 10) : 1) }));
        em.update(100 - t, { k: 0.8 * clamp(1 - (lt - 0.6) / 0.5) });
        const L = clamp(1 - (lt - 0.15) / 0.5);
        H.update(lt, { lit: L, pillarK: 1.5 * L, sky: L });
        H.floor.setGrid(clamp(1 - (lt - 0.3) / 0.7));
        const g = ease.inOut(clamp(lt / 1.2));
        this.sat = lerp(0.9, 0.6, g); this.tint = tintA.map((v, i) => lerp(v, tintB[i], g));
        this.bloom.strength = lerp(1.2, 1.0, g) + 0.6 * absorb;
        scene.fog.color.copy(fogA).lerp(fogB, g); scene.background.copy(scene.fog.color);
        // ---- camera: yank back and up (expo.in over 1.4 s), target locked on the cursor, lens-shifted onto the hall-wide spot
        const u = ease.expoIn(clamp(lt / 1.4));
        const pos = P0.map((v, i) => lerp(v, P1[i], u));
        W.camLook(camera, pos, CUR, W.FOV[24]);
        camera.setViewOffset(1920, 1080, SHIFT[0], SHIFT[1], 1920, 1080);
        const dist = Math.hypot(pos[0] - CUR[0], pos[1] - CUR[1], pos[2] - CUR[2]);
        scene.fog.density = Math.min(0.01, W.fogKeep(dist, 0.8));
        camFX(camera, t, W.FOV[24]);
      },
    };
  },
});
