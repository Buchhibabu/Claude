// 62 ii-hall-red-top — BREATH / totality. Very high top-down 50mm from (0, 700, -60): the whole hall as a city at night seen from
// orbit. The jammed line runs across the middle under 8 red alarm frames breathing on the quarter note; the card towers point
// straight up at the lens, so they read as radial streaks studded with red pinpoints (densest at the REVIEW stack); hundreds of red
// error pinpoints blink in the cold haze of the swarm; the toppled tower's debris fans out across the floor; the human is one ice-red
// dot at the foot of the scree. At the frame's top edge, the foreman's dark square footprint — unlit, unexplained. Static, 0.5% drift.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as B from './lib/b5-act2b.js';
import * as M from './lib/b4-act2a.js';
const { W, THREE } = B;

shot({
  id: 'ii-hall-red-top', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 32, energy: 0.96, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera } = B.act2(ctx, { near: 20 });
    ctx.sfx(0, 'boom', { gain: -4 });
    const H = W.hall(scene, { state: 'alarm', parts: { towers: { review: 1200, test: 640, deploy: 240 } } });
    const D = W.deployMaze({}); scene.add(D.group);
    const BF = B.bankFrames({ k: 5, width: 2.2, inset: 2 }); scene.add(BF.mesh);
    const pins = B.towerPins({ base: W.POS.reviewBase, height: 600, every: 4, seed: 621, r: 0.32 }); scene.add(pins.mesh);
    const pinsT = B.towerPins({ base: W.POS.testBase, height: 320, every: 6, seed: 622, r: 0.32 }); scene.add(pinsT.mesh);
    const deb = B.debris({ count: 240, origin: [1.4, 3], len: 44, spread: 0.6, seed: 5353, edgeK: 0.4, bodyK: 0.12 }); scene.add(deb.mesh);
    // the cold swarm haze: agents queued in lanes across the WHOLE floor (x-lanes every 7u, sparse z cross-lanes every 24u), densest at
    // the line and thinning toward the foreman — from 700u it reads as a night city's street grid
    const r = rand(624);
    const NH = 14000;
    const haze = W.swarmHaze({ count: NH, spread: [1, 1, 1], center: [0, 3.4, 0], color: W.C.ice, size: 0.8, k: 2.5, seed: 623 }); scene.add(haze.points);
    const laneZ = []; for (let z = -146; z <= 44; z += 7) laneZ.push(z);
    const dens = (z) => 0.25 + 0.75 * Math.exp(-Math.abs(z) / 45);
    const spot = () => {
      for (;;) {
        const cross = r() < 0.18;
        let x, z;
        if (cross) { x = -240 + Math.floor(r() * 21) * 24 + (r() - 0.5) * 1.6; z = -150 + r() * 194; }
        else {
          const li = Math.floor(r() * laneZ.length); z = laneZ[li] + (r() - 0.5) * 1.8; x = (r() - 0.5) * 480;
          if (M.hash(li * 31 + Math.floor((x + 240) / 26), 7) < 0.32 && r() < 0.9) continue;          // dark blocks: the grid breaks up
          if (r() > 0.45 + 0.55 * M.hash(li, 3)) continue;                                              // per-lane density
        }
        if (Math.abs(z) < 6 && Math.abs(x) < 72) continue;          // the stations themselves
        if (z < -136 && Math.abs(x) < 64) continue;                  // the foreman's footprint stays dark
        if (r() < dens(z) * (1 - 0.5 * Math.min(1, Math.abs(x) / 260))) return [x, z];
      }
    };
    for (let i = 0; i < NH; i++) { const [x, z] = spot(); haze.positions[i * 3] = x; haze.positions[i * 3 + 1] = 1 + r() * 3; haze.positions[i * 3 + 2] = z; }
    haze.geometry.attributes.position.needsUpdate = true; haze.points.frustumCulled = false;
    // red error pinpoints in the same lanes, blinking on 8ths / 16ths
    const NE = 800, E = W.orbs({ count: NE, r: 0.55, seg: 6 }); scene.add(E.mesh);
    const err = Array.from({ length: NE }, () => { const [x, z] = spot(); return { p: [x, 3.6, z], ph: r(), div: r() < 0.5 ? 2 : 4, k: 6 + r() * 3.5 }; });
    // the human: one dot at the foot of the scree (HUMAN_C), red-rimmed since ii-human-red
    const hu = W.humanAnchor({ act: 'II', pos: M.HUMAN_C, facing: Math.PI }); scene.add(hu.group);
    const huDot = W.orbs({ count: 1, r: 0.9, seg: 8 }); scene.add(huDot.mesh);
    const red = W.lin(W.C.red), tE = W.CARD.edge(0.42), tB = W.CARD.body(0.1);
    const g = B.grade2({ vignette: 0.58, bloom: { strength: 0.9, radius: 0.4, threshold: 0.8 } });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        scene.fog.density = W.fogKeep(700, 0.86);
        const pulse = lerp(0.6, 1, 0.5 + 0.5 * Math.cos((t / 0.5) * Math.PI * 2));
        H.banks.update(lt, { on: 0, alarm: 1, t, beam: 2.4 });
        BF.update(Array(8).fill(pulse), 5);
        H.towers.update(lt, { review: 1200, test: 640, deploy: 240, t });
        for (let i = 0; i < 2080; i++) H.towers.I.color(i, tE, tB);      // from 700u the towers point at the lens: dark columns, the pins carry them
        H.towers.I.commit();
        pins.update(t, { k: 9 }); pinsT.update(t, { k: 9 });
        D.update(lt, { cards: 400, t });
        H.line.update(lt, { lit: 0, dim: 0.3, red: 1 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.red, rimK: 0 });
        for (let i = 0; i < NE; i++) {
          const e = err[i];
          if (!W.blink(t, { div: e.div, origin: e.ph * 0.25, duty: 0.6 })) { E.hide(i); continue; }
          E.set(i, { p: e.p, c: red, k: e.k });
        }
        E.commit();
        hu.update(lt, { rim: W.C.red, rimK: 4 });
        huDot.set(0, { p: [M.HUMAN_C[0], 1.2, M.HUMAN_C[2]], c: W.lin(W.C.ivory), k: 14 }); huDot.commit();
        H.extra.length = 0;
        H.extra.push({ p: [M.HUMAN_C[0], 6, M.HUMAN_C[2]], c: W.C.red, k: 3, pool: 3.5, poolK: 1.2, refl: 0, size: 1 });
        H.update(lt, { alarm: 1, sky: 1 });
        const u = clamp(lt / ctx.T);
        const fov = W.camTop(camera, -22, 700 * (1 - 0.005 * u), -60, W.FOV[50], 0.4 * u);   // x -22 (not 0): the REVIEW streak would cover the human dot
        W.handheld(camera, t, 0.06, 62);
        camFX(camera, t, fov);
      },
    };
  },
});
