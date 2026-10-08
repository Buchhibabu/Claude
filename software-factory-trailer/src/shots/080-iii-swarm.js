// 80 iii-swarm — SWARM (structure tricolon 3/3). 200mm telephoto, slow 30 deg orbit around (20,2,0) at r120 / h30. On the boom 300
// ivory reader orbs burst out of one cluster and fan to READ a two-row amphitheatre of 24 document pages in parallel (300 read-beams in
// one LineSegments, ivory at 30%); on the beat at 1.2 the disorder snaps to order: every reader collapses into ONE writer orb, which fires
// the single write line into the card on its plinth; the card edge turns green. Parallelize reading, one writer per change.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE } = W;

shot({
  id: 'iii-swarm', dur: beats(5, 150), act: 'III',
  music: { section: 'act3', chord: 'Gm', div: 16, energy: 0.88, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'boom', { gain: 0 });
    ctx.sfx(0, 'impact', { gain: -2 });
    ctx.sfx(0, 'sub_drop', { gain: -6 });
    ctx.sfx(0.2, 'chirps', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0035 });
    const H = W.hall(scene, { state: 'lit', parts: { line: false, banks: false, pillars: false } });
    const S = B.swarmField({ center: [20, 2, 0] }); scene.add(S.group);
    // the lit hall far behind, thrown out of focus by the long lens
    const bk = B.bokeh({ count: 26, center: [10, 9, -130], spread: [150, 26, 40], size: [5, 14], seed: 801 }); scene.add(bk.group);
    const bk2 = B.bokeh({ count: 10, center: [20, 4, 70], spread: [40, 10, 10], size: [2, 4], seed: 802 }); scene.add(bk2.group);
    const disc = B.etchedDisc({ r: 16, k: 0.12 }); disc.position.set(20, 0.03, -2); scene.add(disc);
    const SNAP = 1.2, WRITE = 1.36;
    const g = W.grade('III', { bloom: { strength: 1.05, radius: 0.4, threshold: 0.78 }, ca: 0.0006, exposure: 1.0 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.T(ctx, lt);
        S.update(lt, { t, fan: lt, converge: lt >= SNAP ? lt - SNAP : -1, write: lt >= WRITE ? lt - WRITE : -1 });
        bk.update(0.55); bk2.update(0.35);
        disc.rotation.z = 0.04 * lt;
        disc.userData.set(0.1 + 0.25 * (lt >= SNAP ? Math.exp(-(lt - SNAP) / 0.3) : 0), W.C.brass);
        g.bloom.strength = W.bloomHit(1.05, lt - SNAP, { peak: 1.25, d: 0.3 });
        H.extra.length = 0; H.extra.push(...S.sources());
        H.update(lt, { lit: 1, sky: 1.4 });
        const a = THREE.MathUtils.degToRad(-15 + 30 * clamp(lt / ctx.T));
        const fov = W.camLook(camera, [20 + Math.sin(a) * 120, 30, Math.cos(a) * 120], [20, 3.2, 0], W.FOV[200]);
        camFX(camera, t, fov);
      },
    };
  },
  ui(root, tl, K) {
    const sc = B.scrim(K, root, { y: 860, h: 400, a: 0.5 });
    K.cutIn(tl, sc, 0); K.cutOut(tl, sc, 1.95);
    const el = B.tricolon(K, root, { pre: 'SWARM:', main: 'PARALLEL WORK.', size: 210, y: 860 });
    el.style.width = '1880px'; el.style.left = '20px'; el.style.whiteSpace = 'nowrap';
    K.slam(tl, el, 0.0, { from: 1.25, d: 0.28 });
    K.cutOut(tl, el, 1.95);
  },
});
