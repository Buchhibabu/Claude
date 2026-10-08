// 33 ii-fpv-launch — MOOD CHANGE #2. FPV 14mm riding 1u above the line's card deck, in motion from frame 0: agent-speed cards
// blast out of the clay CODE bed all around the lens and race L->R into REVIEW's dark input wall, which looms to fill the frame on the cut.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-fpv-launch', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 8, energy: 0.6, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'A');
    ctx.sfx(0, 'boom', { gain: 0 });
    ctx.sfx(0, 'impact', { gain: -4 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.012 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false } });
    const BH = B.bulkhead({ top: 11 }); scene.add(BH.group);
    const LEC = B.lectern(); scene.add(LEC.group);

    // faint warm under-light from the clay CODE deck
    const clayL = new THREE.PointLight(C.clay, 3, 14, 1.6); clayL.position.set(-19.6, 3.4, 0); scene.add(clayL);
    // the lit CODE deck as clay lane lights + cross ticks (speed cues rushing under the lens) instead of a flat clay slab
    const lanes = [];
    for (let k = 0; k < 7; k++) { const z = -4.5 + k * 1.5; lanes.push([[-30.0, 3.03, z], [-9.2, 3.03, z]]); }
    for (let k = 0; k < 15; k++) { const x = -29.6 + k * 1.45; lanes.push([[x, 3.03, -4.8], [x, 3.03, 4.8]]); }
    const deck = W.glowSegs(lanes, { color: C.clay, k: 3.2, width: 2.2 }); scene.add(deck);

    // ---- the card stream (120 in flight; arrivals concertina against the wall in 5 pile lanes, 2 deep)
    const N = 120, WALL = -8.4 - 0.35 - 1.55;
    const r = rand(3301);
    const cards = [];
    for (let i = 0; i < N; i++) {
      const ts = lerp(-0.2, 0.92, i / N) + (r() - 0.5) * 0.05;
      const xs = lerp(-31, -16, r());
      const lane = i % 5, lz = -3.4 + lane * 1.7;
      let z = lz + (r() - 0.5) * 0.7;
      let y = 3.45 + Math.pow(r(), 1.6) * 4.4;
      if (lane === 2) y = 6.3 + r() * 1.6;
      else if (Math.abs(z) < 2.6 && y > 3.7 && y < 5.4) y = r() < 0.5 ? 3.45 : 5.6 + r();
      const v = lerp(55, 85, r());
      cards.push({ ts, xs, z, lz, y, v, lane, ry: (r() - 0.5) * 0.25, ph: r() });
    }
    const byLane = [[], [], [], [], []];
    cards.forEach((c, i) => { c.arr = c.ts + (WALL - c.xs) / c.v; byLane[c.lane].push(i); });
    for (const L of byLane) L.sort((a, b) => cards[a].arr - cards[b].arr).forEach((i, rank) => {
      const c = cards[i]; c.stop = WALL - (rank % 2) * 3.08; c.ys = 3.45 + Math.floor(rank / 2) * 0.52; c.tStop = c.ts + (c.stop - c.xs) / c.v + 0.04;
    });

    const I = W.cards({ count: N }); scene.add(I.mesh);
    const S = B.streaks(N, { color: C.ice, k: 1.5, width: 2.0 }); scene.add(S.mesh);
    const SP = B.sparks({ count: 720, color: C.ice, size: 0.07, k: 7 }); scene.add(SP.points);
    const bursts = cards.map((c, i) => ({ t0: c.tStop, p: [c.stop + 1.5, c.ys + 0.2, c.lz], n: 6, speed: 7, life: 0.3, seed: i + 1, g: 4, dir: [-3, 1, 0] }));
    const dust = W.swarmHaze({ count: 900, spread: [50, 7, 16], center: [-20, 6.5, 0], color: C.ice, size: 0.05, k: 2.2, seed: 331 });
    scene.add(dust.points);

    const pos = (c, lt) => {
      const dt = lt - c.ts;
      if (dt < 0) return null;
      const rise = ease.out(clamp(dt / 0.12));
      let x = c.xs + c.v * (dt - 0.04 * (1 - Math.exp(-dt / 0.04)));
      const dive = smooth(c.stop - 7, c.stop, x);
      let y = lerp(lerp(3.2, c.y, rise), c.ys, dive), z = lerp(c.z, c.lz, dive), rz = 0, rx = (1 - rise) * 0.5, stopped = false;
      if (x >= c.stop) {
        const ds = Math.max(0, lt - c.tStop);
        x = c.stop - 0.3 * Math.exp(-ds * 16) * Math.abs(Math.sin(ds * 34));
        y = c.ys; z = c.lz;
        rz = (c.ph - 0.5) * 0.25 * Math.exp(-ds * 9);
        stopped = true;
      }
      return { x, y, z, rz, rx, stopped };
    };
    const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

    return {
      scene, camera, ...W.grade('II', { bloom: { strength: 0.95, radius: 0.45, threshold: 0.8 }, vignette: 0.55, ca: 0.001 }),
      update(lt) {
        const t = ctx.shot.start + lt;
        H.line.update(lt, { lit: 0, strips: 0, codeK: 0, dim: 0.45, red: [0, 0, 0, 0.35, 0, 0, 0] });
        deck.userData.set(3.2 + 1.2 * W.beatPulse(t, { div: 2 }));
        BH.update(lt, { edgeK: 2.6, slotK: 3, pin: W.blink(t, { div: 2 }) * 0.9 + 0.1, t });
        for (let i = 0; i < N; i++) {
          const c = cards[i], p = pos(c, lt);
          if (!p) { I.hide(i); S.hide(i); continue; }
          I.set(i, { p: [p.x, p.y, p.z], r: [p.rx, c.ry, p.rz], edge: W.CARD.edge(p.stopped ? 1.2 : 1.8), body: W.CARD.body(0.55) });
          if (p.stopped) S.hide(i);
          else S.set(i, [p.x - 1.5, p.y, p.z], [p.x - 1.5 - Math.min(7, c.v * 0.075), p.y, p.z]);
        }
        I.commit(); S.commit();
        SP.update(bursts, lt);
        LEC.update(lt, { on: W.blink(t, { div: 0.5 }), k: 3 });
        H.extra.length = 0;
        H.extra.push(...BH.sources(1));
        H.update(lt);
        // camera: launched over the clay bed, linear, small FPV banking
        const x = -41 + 16 * lt;
        const roll = 3.5 * Math.sin(lt * 5.2 + 0.6) - 2;
        W.camLook(camera, [x, 4.4, 0.15 * Math.sin(lt * 7)], [x + 30, 3.9, 0], W.FOV[14], { roll });
        W.handheld(camera, t, 0.3, 33);
        camFX(camera, t, W.FOV[14]);
      },
    };
  },
});
