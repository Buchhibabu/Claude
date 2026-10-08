// 34 ii-review-slam — "it stops at review". 135mm side telephoto (camReviewSide, R->L). Agent-speed cards streak in from frame left and
// slam into REVIEW's dark input wall; the queue concertinas into a wall (60 cards in 10 f), the pile shudders, one red pinpoint ignites.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-review-slam', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 8, energy: 0.6, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'impact', { gain: -4 });
    ctx.sfx(0.25, 'boom', { gain: -10 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.004 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false } });
    const BH = B.bulkhead({ top: 11 }); scene.add(BH.group);
    const LEC = B.lectern(); scene.add(LEC.group);
    const rimL = new THREE.DirectionalLight(C.ice, 0.9); rimL.position.set(-20, 30, -60); scene.add(rimL);

    // ---- queue slots: lane z 0 (front, 6 cols x 10 rows) + lane z -2.2 (behind, 5 x 8) ; then late arrivals at the back
    const WALLX = -8.4 - 0.35 - 1.55;
    const slots = [];
    for (let c = 0; c < 6; c++) for (let r = 0; r < 10; r++) slots.push({ x: WALLX - c * 3.08, y: 3.45 + r * 0.52, z: 0, ord: c + r * 0.42, lane: 0 });
    slots.sort((a, b) => a.ord - b.ord);
    slots.forEach((s, k) => { s.ta = 0.02 + (10 / 30) * k / 59; });
    const back = [];
    for (let c = 0; c < 5; c++) for (let r = 0; r < 8; r++) back.push({ x: WALLX - c * 3.08 - 0.4, y: 3.45 + r * 0.52, z: -2.2, ord: c + r * 0.42, lane: 1 });
    back.sort((a, b) => a.ord - b.ord).forEach((s, k) => { s.ta = 0.08 + 0.4 * k / 39; });
    const late = [];
    for (let k = 0; k < 24; k++) { const c = 6 + Math.floor(k / 8), r = k % 8; late.push({ x: WALLX - c * 3.08, y: 3.45 + r * 0.52, z: 0, lane: 0, ta: 0.4 + k * 0.025 }); }
    const all = [...slots, ...back, ...late];
    const rr = rand(3401);
    all.forEach((s) => { s.v = lerp(70, 95, rr()); s.ry = (rr() - 0.5) * 0.16; s.ph = rr(); s.rz = (rr() - 0.5) * 0.05; });
    const N = all.length;
    // overflow: cards pushed off the deck's front edge tumble to the floor in front of the CODE face
    const SPN = 26, spillS = [];
    for (let k = 0; k < SPN; k++) spillS.push({ t0: 0.1 + k * 0.032 + rr() * 0.03, x: lerp(-30, -10.5, rr()), y0: 3.45 + rr() * 2, z0: 4.3, land: 0.26 + (k % 4) * 0.5 + rr() * 0.2, zf: 6.0 + rr() * 2.2, rx: (rr() - 0.5) * 2.2, ry: (rr() - 0.5) * 0.8, rz: (rr() - 0.5) * 0.7 });
    const SPI = W.cards({ count: SPN }); scene.add(SPI.mesh);
    // human speed: one card per beat squeezes through the slot and crawls onto REVIEW
    const ONE = W.cards({ count: 3 }); scene.add(ONE.mesh);
    const I = W.cards({ count: N }); scene.add(I.mesh);
    const S = B.streaks(N, { color: C.ice, k: 1.6, width: 2.2 }); scene.add(S.mesh);
    const SP = B.sparks({ count: 400, color: C.ice, size: 0.09, k: 6 }); scene.add(SP.points);
    const bursts = slots.slice(0, 36).map((s, k) => ({ t0: s.ta, p: [s.x + 1.55, s.y, 0.8], n: 10, speed: 9, life: 0.32, seed: 40 + k, g: 5, dir: [-4, 1.5, 2] }));
    // REVIEW alarm pinpoint (front face, top-left)
    const pin = W.orbs({ count: 1, r: 0.2, seg: 12 }); scene.add(pin.mesh);
    const pinFl = W.flare({ color: C.red, k: 0, size: 2.6 }); pinFl.position.set(-6.2, 2.4, 5.25); scene.add(pinFl);
    // out-of-focus foreground motes (depth)
    const motes = W.swarmHaze({ count: 160, spread: [40, 14, 50], center: [-6, 3, 55], color: C.ice, size: 0.5, k: 0.45, seed: 343 });
    scene.add(motes.points);

    return {
      scene, camera, ...W.grade('II'),
      update(lt) {
        const t = ctx.shot.start + lt;
        // pile shudder from recent arrivals
        let jolt = 0;
        for (const s of all) { const d = lt - s.ta; if (d >= 0 && d < 0.3) jolt += Math.exp(-d * 18); }
        jolt = Math.min(1.5, jolt * 0.25);
        for (let i = 0; i < N; i++) {
          const s = all[i], d = lt - s.ta;
          if (d < 0) {
            const x = s.x + s.v * d;
            if (x < -40) { I.hide(i); S.hide(i); continue; }
            I.set(i, { p: [x, s.y + 0.06 * Math.sin(lt * 30 + s.ph * 9), s.z], r: [0, s.ry, 0], edge: W.CARD.edge(1.9), body: W.CARD.body(0.6) });
            S.set(i, [x - 1.5, s.y, s.z], [x - 1.5 - Math.min(9, s.v * 0.1), s.y, s.z]);
            continue;
          }
          S.hide(i);
          const rec = 0.32 * Math.exp(-d * 16) * Math.abs(Math.sin(d * 36));
          const sh = jolt * 0.06 * Math.sin(lt * 61 + i * 1.7);
          I.set(i, { p: [s.x - rec + sh, s.y + sh * 0.3, s.z], r: [0, s.ry, s.rz + (s.ph - 0.5) * 0.3 * Math.exp(-d * 10)], edge: W.CARD.edge(d < 0.08 ? 2.6 : 1.25), body: W.CARD.body(0.7) });
        }
        I.commit(); S.commit();
        for (let k = 0; k < SPN; k++) {
          const c = spillS[k], d = lt - c.t0;
          if (d < 0) { SPI.set(k, { p: [c.x, c.y0, c.z0 - 1.2], r: [0, c.ry * 0.2, 0], edge: W.CARD.edge(1.3), body: W.CARD.body(0.7) }); continue; }
          const tip = clamp(d / 0.12), tf = Math.max(0, d - 0.08);
          let y = c.y0 - 0.5 * 42 * tf * tf, z = lerp(c.z0 - 1.2, c.zf, ease.out(clamp(d / 0.4)));
          let rot = c.rx * clamp(d / 0.35) + tip * 0.6;
          if (y <= c.land) { const tl2 = Math.sqrt(2 * (c.y0 - c.land) / 42) + 0.08; const db = d - tl2; y = c.land + Math.abs(Math.sin(db * 18)) * 0.25 * Math.exp(-db * 9); rot = c.rx * 0.3 + 0.2; }
          SPI.set(k, { p: [c.x, y, z], r: [rot, c.ry, c.rz * clamp(d / 0.3)], edge: W.CARD.edge(1.5), body: W.CARD.body(0.7) });
        }
        SPI.commit();
        for (let k = 0; k < 3; k++) {
          const d = lt - (k - 1) * 0.5;   // passes at -0.5, 0.0, 0.5
          if (d < -0.12) { ONE.hide(k); continue; }
          const x = d < 0 ? -10.3 + 3.2 * ease.inOut(clamp((d + 0.12) / 0.12)) : -7.1 + 2.2 * d;
          ONE.set(k, { p: [x, 3.45, 0], r: [0, 0, 0], edge: W.CARD.edge(1.6), body: W.CARD.body(0.8) });
        }
        ONE.commit();
        LEC.update(lt, { on: W.blink(t, { div: 0.5 }), k: 3 });
        SP.update(bursts, lt);
        const pk = W.ignite(lt - 0.25);
        if (pk > 0) { pin.set(0, { p: [-6.2, 2.4, 5.12], c: W.lin(C.red), k: 9 * pk }); pinFl.userData.set(2.6 * pk, C.red); } else { pin.hide(0); pinFl.userData.set(0); }
        pin.commit();
        const wallFlash = Math.exp(-Math.max(0, lt - 0.02) * 6);
        BH.update(lt, { edgeK: 1.2 + 4 * wallFlash, slotK: 2 + 3 * wallFlash, pin: 0, t });
        H.line.update(lt, { lit: 0, dim: 0.5, red: [0, 0, 0, 0.6 * pk, 0, 0, 0] });
        H.extra.length = 0;
        H.extra.push({ p: [-17, 6, 0], c: C.ice, k: 1.4, pool: 9, poolK: 0.8, refl: 0.8, size: 4 });
        if (pk > 0) H.extra.push({ p: [-6.2, 2.4, 5.4], c: C.red, k: 3 * pk, pool: 2.5, poolK: 1, refl: 1.2, size: 0.3 });
        H.update(lt, { sky: 1 });
        camFX(camera, t, W.camReviewSide(camera, lt, { dur: ctx.T, dir: -1, t, handheld: 0.3 }));
      },
    };
  },
});
