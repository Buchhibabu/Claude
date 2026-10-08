// 38 ii-review-stamp — tricolon 1/3. 135mm side telephoto (camReviewSide, tracking R->L): a compressed side-on WALL of stalled
// cards (the concertina queue left of REVIEW's bulkhead + the REVIEW mass rising out of frame), and on the boom the word REVIEW.
// stamps onto the station's +z face in danger red: world-space slam, a red shock of light up the wall, sparks off the face.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-review-stamp', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'C', div: 8, energy: 0.65, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'boom', { gain: -2 });

    const { scene, camera } = W.stage({ act: 'II', fog: W.fogKeep(90, 0.72) });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, pillars: false } });
    const BH = B.bulkhead({ top: 13 }); scene.add(BH.group);
    // REVIEW mass (the tower from ii-line-waits-1, ~84u) — its lower courses fill the right of the wall
    const rev = B.towerMass({ name: 'review', nx: 5, nz: 3, maxH: 90, seed: 3, pinsPerLevel: 2, pinEvery: 6 });
    scene.add(rev.group);
    // the stalled queue on the CODE deck: 3 lanes x 7 cols x 12 rows, concertina'd against the wall
    const WALLX = -8.4 - 0.35 - 1.55;
    const r = rand(3801);
    const qs = [];
    for (let lane = 0; lane < 3; lane++) for (let c = 0; c < 7; c++) {
      const rows = 12 - Math.floor(c * 0.6 + r() * 2);
      for (let k = 0; k < rows; k++) qs.push({ x: WALLX - c * 3.06 - r() * 0.25, y: 3.27 + k * 0.51, z: 3.2 - lane * 2.4 + (r() - 0.5) * 0.3, ry: (r() - 0.5) * 0.12, rz: (r() - 0.5) * 0.06, ph: r(), lane });
    }
    const Q = W.cards({ count: qs.length }); scene.add(Q.mesh);
    // dead work on the floor in front of the face (fills the low band of the telephoto frame)
    const FLN = 46, FL = W.cards({ count: FLN }); scene.add(FL.mesh);
    for (let i = 0; i < FLN; i++) FL.set(i, { p: [-21 + r() * 30, 0.26, 9 + r() * 9], r: [(r() - 0.5) * 0.12, (r() - 0.5) * 1.4, (r() - 0.5) * 0.08], edge: W.CARD.edge(0.9), body: W.CARD.body(0.5) });
    FL.commit();
    // the stamp on the station face (z 5.06), framed in the camera's left-of-centre third at the hit
    const ST = B.stamp3D('REVIEW.', { height: 1.42, k: 2.3, glow: 0.3, peak: 1.7 });
    ST.group.position.set(-4.3, 1.62, 5.08); scene.add(ST.group);
    // shock: red light flash up the wall + sparks thrown off the face
    const shock = new THREE.PointLight(C.red, 0, 26, 1.4); shock.position.set(-4.3, 2.0, 8); scene.add(shock);
    const SP = B.sparks({ count: 420, color: C.red, size: 0.11, k: 7 }); scene.add(SP.points);
    const bursts = [];
    for (let i = 0; i < 7; i++) bursts.push({ t0: 0.0 + i * 0.012, p: [-7.2 + i * 1.0, 0.6 + (i % 3) * 0.9, 5.3], n: 50, speed: 9, life: 0.55, seed: 380 + i, g: 9, dir: [0, 2.5, 4] });
    const dust = B.sparks({ count: 260, color: C.ice, size: 0.07, k: 4 }); scene.add(dust.points);
    const dburst = [{ t0: 0.0, p: [-2, 3.4, 2], n: 140, speed: 6, life: 0.9, seed: 388, g: 2, dir: [0, 3, 1] }, { t0: 0.02, p: [-14, 6.4, 2], n: 120, speed: 5, life: 0.9, seed: 389, g: 2, dir: [0, 2, 1] }];
    // out-of-focus foreground motes (parallax against the tracking camera)
    const motes = W.swarmHaze({ count: 140, spread: [44, 14, 40], center: [-6, 3, 58], color: C.ice, size: 0.55, k: 0.45, seed: 381 });
    scene.add(motes.points);
    // red pinpoints in the wall (the alarm states of stalled cards), blinking on 8ths odd/even
    const PINS = [[-17.2, 5.9, 3.95], [-12.9, 4.4, 3.95], [-6.1, 6.6, 3.5], [-0.6, 4.9, 3.5], [3.8, 7.1, 3.5], [-14.6, 7.3, 3.95], [6.9, 5.3, 3.5]];
    const PN = W.orbs({ count: PINS.length, r: 0.2, seg: 10 }); scene.add(PN.mesh);
    const PF = PINS.map((p) => { const f = W.flare({ color: C.red, k: 0, size: 2.2 }); f.position.set(p[0], p[1], p[2] + 0.3); scene.add(f); return f; });
    const rimL = new THREE.DirectionalLight(C.ice, 0.9); rimL.position.set(-30, 40, -60); scene.add(rimL);

    return {
      scene, camera, ...W.grade('II'),
      update(lt) {
        const t = ctx.shot.start + lt;
        const hitE = Math.exp(-lt / 0.09), jolt = Math.exp(-lt / 0.12);
        rev.update(lt, { h: 84, t, pinDiv: 2, shake: 0.05 * jolt, k: 1.25, body: 1.0 });
        // the queue shudders on the hit, then settles (dead, stalled)
        for (let i = 0; i < qs.length; i++) {
          const s = qs[i];
          const sh = jolt * 0.07 * Math.sin(lt * 70 + i * 1.7);
          const lift = hitE * 0.06 * (0.5 + s.ph);
          I_set(Q, i, [s.x + sh, s.y + lift, s.z], [0, s.ry, s.rz + sh * 0.3], s.lane === 0 ? 1.3 + 2.4 * hitE : 1.05, 0.6);
        }
        Q.commit();
        PINS.forEach((p, i) => { const on = W.blink(t, { div: 2, origin: (i % 2) * 0.25 }); PN.set(i, { p, c: W.lin(C.red), k: 1 + 9 * on }); PF[i].userData.set(0.3 + 2 * on, C.red); });
        PN.commit();
        ST.update(lt, {});
        shock.intensity = 45 * Math.exp(-lt / 0.1);
        SP.update(bursts, lt);
        dust.update(dburst, lt);
        BH.update(lt, { edgeK: 1.2 + 2.5 * hitE, slotK: 2.2, pin: W.blink(t, { div: 2 }), t });
        H.line.update(lt, { lit: 0, dim: 0.45, red: [0, 0, 0, 0.55 + 0.45 * hitE, 0, 0, 0] });
        H.extra.length = 0;
        H.extra.push({ p: [-4.3, 1.4, 5.6], c: C.red, k: 1.8 + 6 * hitE, pool: 6, poolK: 1.2, refl: 1.6, size: 4 });
        H.extra.push(...rev.sources(), ...BH.sources(W.blink(t, { div: 2 })));
        H.update(lt, { sky: 1.6 });
        camFX(camera, t, W.camReviewSide(camera, lt, { dur: ctx.T, dir: -1, t, handheld: 0.3 }));
      },
    };
  },
});

function I_set(Q, i, p, r, ek, bk) { Q.set(i, { p, r, edge: W.CARD.edge(ek), body: W.CARD.body(bk) }); }
