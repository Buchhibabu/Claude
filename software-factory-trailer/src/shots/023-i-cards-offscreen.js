// 23 · i-cards-offscreen — 85mm lateral track at 18 u/s; a stream of finished cards overtakes the camera at 1.5x (27 u/s) along the
// top of the dark line: they leave the CODE tower's clay light, flash green as they are finished, race past REVIEW's unlit,
// unlabelled box and shoot off the right edge into darkness. (Plant: where does the work go?)
import { shot, beats, camFX } from '../engine.js';
import { W, T, gradeI, motes, ease, clamp, lerp, rand } from './lib/b3.js';

shot({
  id: 'i-cards-offscreen', dur: beats(2), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 16, energy: 0.7, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0.5, 'whoosh', { gain: -6 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, banks: false } });
    const N = 40;
    const CardsI = W.cards({ count: N }); scene.add(CardsI.mesh);
    const r = rand(2301);
    const lanes = [2.4, -1.6];
    const cards = [];
    const xs = [-6, -8];
    for (let i = 0; i < N; i++) {
      const L = i % 2; xs[L] -= 3.7 + r() * 2.6;
      cards.push({ x0: xs[L], z: lanes[L] + (r() - 0.5) * 0.4, y: 3.27 + (r() < 0.15 ? 0.52 : 0), j: (r() - 0.5) * 0.03, sp: 27 * (0.97 + r() * 0.06) });
    }
    // comet tails (bright at the card, fading out)
    const tailCols = []; for (let i = 0; i < N; i++) tailCols.push(W.lin(W.C.ice, 1.0), [0, 0, 0]);
    const trails = W.glowSegs(Array.from({ length: N }, () => [[0, -50, 0], [0.01, -50, 0]]), { colors: tailCols, k: 1.4, width: 1.4, offset: false });
    scene.add(trails);
    const trailPos = new Float32Array(N * 6);
    // the CODE tower's clay spill: lights the cards while they are near it, falling off into the dark line
    const spill = new W.THREE.PointLight(W.C.clay, 70, 22, 1.5); spill.position.set(-13.5, 7, 6); scene.add(spill);
    const M = motes({ count: 900, box: [-25, 35, 0.3, 12, -6, 30], color: W.C.ice, k: 1.2, size: 0.05, seed: 233 });
    scene.add(M.points);
    const CAM = 18;
    return {
      scene, camera, ...gradeI({ bloom: { strength: 0.9, radius: 0.45, threshold: 0.8 } }),
      update(lt) {
        const t = T(ctx, lt);
        const cx = -10 + CAM * lt;
        for (let i = 0; i < N; i++) {
          const c = cards[i];
          const xx = c.x0 + c.sp * (lt + 1.0);
          if (xx < cx - 16 || xx > cx + 16) { CardsI.hide(i); trailPos.set([0, -50, 0, 0.01, -50, 0], i * 6); continue; }
          // green check flare as a card is finished (its tail crosses the CODE station's right edge, x -8.4)
          const g = clamp(1 - Math.abs(xx - 1.5 - (-8.4)) / 2.2);
          const ge = W.CARD.greenEdge(6);
          const dark = ease.inOut(clamp((xx + 6) / 22));   // run on into the dark line
          const kk = lerp(2.6, 0.35, dark);
          const edge = W.CARD.edge(kk).map((v, k) => lerp(v, ge[k], g));
          CardsI.set(i, { p: [xx, c.y, c.z], r: [0, 0, c.j], edge, body: W.CARD.body(lerp(1.4, 0.12, dark)).map((v, k) => v + ge[k] * 0.05 * g) });
          trailPos.set([xx - 1.5, c.y + 0.02, c.z, xx - 1.5 - 4.2 * (1 - 0.6 * dark), c.y + 0.02, c.z], i * 6);
        }
        CardsI.commit();
        trails.geometry.setPositions(trailPos);
        H.tower.update(lt, { count: 1000, k: 12, crest: 1, t });
        H.line.update(lt, { lit: 0, dim: 0.6 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0 });
        M.update(t, { k: 1.1, drift: [2, 0.2, 0] });
        H.update(lt, { sky: 2.2 });
        camFX(camera, t, W.camLook(camera, [cx, 4.4, 44], [cx, 6.0, 0], W.FOV[85]));
      },
    };
  },
});
