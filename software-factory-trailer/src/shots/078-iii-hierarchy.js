// 78 iii-hierarchy — HIERARCHY (structure tricolon 2/3). 24mm crane UP from worm's-eye (0,1,40) -> (0,30,60), power2.inOut, looking at
// a stepped 16 -> 4 -> 1 diagram on a dark dais that deliberately rhymes with the unlit foreman standing behind it in the warm haze.
// Light runs DOWN the tree on the beat: sky shaft onto the apex at the boom (0.0), ivory arcs to the 4 leads (0.4), brass arcs to the
// 16 workers (0.8); every tier's card stacks square up on arrival (3 f), the seams ignite, and at 1.2 the whole structure locks.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE } = W;

shot({
  id: 'iii-hierarchy', dur: beats(4, 150), act: 'III',
  music: { section: 'act3', chord: 'C', div: 16, energy: 0.87, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'boom', { gain: -1 });
    ctx.sfx(0, 'impact', { gain: -6 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0042 });
    const H = W.hall(scene, { state: 'lit', parts: { line: false, banks: false } });
    const R = B.hierarchyRig({ center: [0, 0, -28], scale: 1.85, dais: 10 }); scene.add(R.group);
    // warm haze behind the foreman so both stepped silhouettes read as cut-outs (same rig as iii-still)
    const halo = W.flare({ color: W.C.amberRail, k: 3.2, size: 520, fog: false, ref: 4 }); halo.position.set(0, 80, -520); scene.add(halo);
    const halo2 = W.flare({ color: W.C.ember, k: 1.4, size: 900, fog: false, ref: 4 }); halo2.position.set(0, 20, -700); scene.add(halo2);
    const motes = B.beamMotes({ x: 0, count: 600, r0: 30, h: 46, size: 0.1, seed: 781 }); scene.add(motes.points);
    const SNAPS = [0.0, 0.4, 0.8];
    const g = W.grade('III', { bloom: { strength: 1.1, radius: 0.45, threshold: 0.75 }, ca: 0.0006, exposure: 0.95 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.T(ctx, lt);
        R.update(lt, { t, snaps: SNAPS, lock: 1.2 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.amber, rimK: 0.5, bounce: 0.1 });
        motes.update(t, 0.45);
        g.bloom.strength = W.bloomHit(1.1, lt - 1.2, { peak: 1.35, d: 0.3 });
        H.extra.length = 0; H.extra.push(...R.sources());
        H.update(lt, { lit: 1, sky: 2.2 });
        const v = clamp(lt / ctx.T); const u = v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;   // power2.inOut
        const fov = W.camLook(camera, [0, lerp(1, 30, u), lerp(40, 60, u)], [0, 20, 0], W.FOV[24]);
        camFX(camera, t, fov);
      },
    };
  },
  ui(root, tl, K) {
    const sc = B.scrim(K, root, { y: 860, h: 380, a: 0.5 });
    K.cutIn(tl, sc, 0);
    const el = B.tricolon(K, root, { pre: 'HIERARCHY:', main: 'COHERENCE.', size: 180, y: 860 });
    K.slam(tl, el, 0.0, { from: 1.25, d: 0.28 });
    // carries through iii-tier-snap (cut out there at its end)
  },
});
