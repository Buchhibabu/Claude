// 42 ii-line-waits-2 — MASTER C, refrain #2: the cost lands on a person. DESIGNATED HOLD. 14mm worm's-eye (camHumanUnderTowerC, 4%
// creep push ending on the cut): the tiny human, back to us, stands in a hard cold pool of top light at the foot of a lit scree of
// spilled work; above him the 300u REVIEW mass — a stepped wall of stacked cards — climbs out of frame into fog, red pinpoints
// blinking on the tick far above; TEST rises at frame right.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-line-waits-2', dur: beats(4), act: 'II',
  music: { section: 'act2', chord: 'Bb', div: 8, energy: 0.55, add: ['pulse', 'ostinato', 'drone', 'heart'], drop: ['drums'] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'heartbeat', { gain: -8 });
    ctx.sfx(0, 'tick', { gain: -8 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.0085 });
    const S = B.humanUnderSetC(scene, { reviewMax: 300, testMax: 170 });
    // grit drifting down through the top light (scale cue)
    const motes = W.swarmHaze({ count: 420, spread: [8, 18, 8], center: [B.HUMAN_C[0], 9, B.HUMAN_C[2] - 1.5], color: C.ice, size: 0.06, k: 1.6, seed: 421 });
    scene.add(motes.points);

    return {
      scene, camera, ...W.grade('II', { vignette: 0.6 }),
      update(lt) {
        const t = ctx.shot.start + lt;
        for (let i = 0; i < 420; i++) motes.positions[i * 3 + 1] = motes.base[i * 3 + 1] + 0.25 * Math.sin(t * 0.7 + i) - 0.4 * lt;
        motes.geometry.attributes.position.needsUpdate = true;
        S.update(lt, { t, review: 300, test: 165, red: 1, pinDiv: 1, rimK: 1.5, poolK: 1, sky: 3, k: 1.75, body: 0.45 });
        // the tiny human stands in the word gap of the refrain (between LINE and WAITS., ~x 1028 px), never under a glyph
        camFX(camera, t, B.camHumanUnderTowerC(camera, lt, { dur: ctx.T, t, handheld: 0.3, x: -1.2, z0: 46, pitch: 26.5 }));
      },
    };
  },
  ui(root, tl, K) {
    B.refrainC(root, tl, K, { html: 'THE LINE WAITS.', at: 0.25, out: 1.75 });
  },
});
