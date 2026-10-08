// 45 ii-towers-double — the consequence. Low 24mm (Dutch +8, slow push) up the REVIEW and TEST masses as the swarm writes: both
// DOUBLE in one second (REVIEW 300u -> 600u, TEST 160u -> 320u). The stacks are rammed upward out of the stations in 16th-note slams
// (each slam lifts the whole mass by a course, with a jolt and a flash of fresh edges), ice agents streak up the faces laying cards,
// and the red pinpoints multiply.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-towers-double', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 16, energy: 0.72, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'boom', { gain: -4 });
    ctx.sfx(0, 'chirps', { gain: -10 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.0062 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false } });
    const RMAX = 600, TMAX = 320;
    const rev = B.towerMass({ name: 'review', nx: 5, nz: 3, maxH: RMAX, seed: 3, pinsPerLevel: 4, pinEvery: 5 });
    const test = B.towerMass({ name: 'test', nx: 3, nz: 3, maxH: TMAX, seed: 5, pinsPerLevel: 3, pinEvery: 5 });
    scene.add(rev.group, test.group);
    // writers: ice agents racing up the faces
    const NA = 36, r = rand(4501);
    const AG = Array.from({ length: NA }, (_, i) => { const tw = i % 3 === 2; const m = tw ? test : rev; const b = tw ? W.POS.testBase : W.POS.reviewBase;
      const face = Math.floor(r() * 3);
      const off = face === 0 ? [(r() - 0.5) * 2 * m.halfW, m.halfD + 0.6] : [(face === 1 ? -1 : 1) * (m.halfW + 0.6), (r() - 0.5) * 2 * m.halfD];
      return { x: b[0] + off[0], z: b[2] + off[1], y0: 20 + r() * 40, v: 70 + r() * 70, ph: r(), tw }; });
    const A = W.orbs({ count: NA, r: 0.32, seg: 8 }); scene.add(A.mesh);
    const AS = B.streaks(NA, { color: C.ice, k: 1.2, width: 1.5 }); scene.add(AS.mesh);
    const rimL = new THREE.DirectionalLight(C.ice, 1.2); rimL.position.set(40, 120, -60); scene.add(rimL);
    const sky = B.glowCard({ w: 260, h: 300, color: 0x8fb0c8, k: 0.12, falloff: 2.0 }); sky.position.set(10, 150, -120); scene.add(sky);

    // 16 slams: step s at s/16 s; each lifts REVIEW by 18.75u and TEST by 10u (expo-out over 2 f)
    const STEP = 1 / 16;
    const grow = (lt, from, to) => { const s = Math.floor(lt / STEP), w = lt - s * STEP; const a = from + (to - from) * Math.min(16, s) / 16, b = from + (to - from) * Math.min(16, s + 1) / 16; return lerp(a, b, ease.expoOut(clamp(w / 0.05))); };
    // fresh courses: the slice rammed in most recently glows hot ice and cools as it rises
    const hot = W.lin(C.ice, W.kl(4.5) * 1.15), hotB = W.lin(C.card, 0.25);
    const heat = (m, MAX, h) => {
      const per = Math.ceil(MAX / 4) + 1, e0 = W.CARD.edge(1.3), b0 = W.CARD.body(1.1);
      m.cols.forEach((c, ci) => { for (let k = 0; k < per; k++) { const age = h - (MAX - k * 4); if (age < 0 || age > 160) continue; const f = Math.exp(-age / 55);
        m.I.color(ci * per + k, [lerp(e0[0], hot[0], f), lerp(e0[1], hot[1], f), lerp(e0[2], hot[2], f)], [lerp(b0[0], hotB[0], f), lerp(b0[1], hotB[1], f), lerp(b0[2], hotB[2], f)]); } });
      m.I.commit();
    };
    const hidePins = (m, frac, t) => { m.pins.forEach((p, i) => { if (B.hash(i, 77) > frac) m.P.hide(i); }); m.P.commit(); };

    return {
      scene, camera, ...W.grade('II', { bloom: { strength: 0.95, radius: 0.42, threshold: 0.8 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const s = Math.floor(lt / STEP), w = lt - s * STEP;
        const jolt = Math.exp(-w / 0.03);
        const hr = grow(lt, 300, 600), ht = grow(lt - STEP / 2, 160, 320);
        // extrusion: the full mass is built, the group sinks into the station by (max - h): content rises as the stack doubles
        rev.update(lt, { h: RMAX, t, pinDiv: 2, shake: 0.12 * jolt, k: 1.3 + 0.9 * jolt, body: 1.1 });
        test.update(lt, { h: TMAX, t, pinDiv: 2, shake: 0.08 * jolt, k: 1.25 + 0.7 * jolt, body: 1.0 });
        rev.group.position.y = -(RMAX - hr); test.group.position.y = -(TMAX - ht);
        heat(rev, RMAX, hr); heat(test, TMAX, ht);
        const frac = lerp(0.35, 1, clamp(lt / 0.9));
        hidePins(rev, frac, t); hidePins(test, frac, t);
        for (let i = 0; i < NA; i++) {
          const a = AG[i];
          const y = a.y0 + ((lt + a.ph) * a.v) % 90;
          A.set(i, { p: [a.x, y, a.z], c: W.lin(C.ice), k: 3 });
          AS.set(i, [a.x, y, a.z], [a.x, y - Math.min(12, a.v * 0.09), a.z]);
        }
        A.commit(); AS.commit();
        H.foreman.update(lt, { lit: 0, rimColor: C.red, rimK: 0.25 });
        H.line.update(lt, { lit: 0, dim: 0.4, red: [0, 0, 0, 0.7, 0.7, 0, 0] });
        H.extra.length = 0;
        H.extra.push({ p: [1.4, 5, 4], c: C.red, k: 2 + 3 * jolt, pool: 9, poolK: 0.8, refl: 0.8, size: 2 });
        H.extra.push(...rev.sources(), ...test.sources());
        H.update(lt, { sky: 2.4 });
        // LOW 24mm, Dutch +8, slow push (6%) toward the target
        const p0 = [-20, 1, 60], tg0 = [10, 60, 0], u = 0.08 * ease.inOut(clamp(lt / ctx.T));
        const tg = [tg0[0], tg0[1] + 14 * ease.inOut(clamp(lt / ctx.T)), tg0[2]];   // the lens is dragged upward by the growth
        W.camLook(camera, [lerp(p0[0], tg0[0], u), lerp(p0[1], tg0[1], u), lerp(p0[2], tg0[2], u)], tg, W.FOV[24], { roll: 8 });
        camera.rotateZ(THREE.MathUtils.degToRad(0.35 * jolt * Math.sin(s * 2.1)));   // each 16th slam jars the lens
        W.handheld(camera, t, 0.3, 45);
        camFX(camera, t, W.FOV[24]);
      },
    };
  },
});
