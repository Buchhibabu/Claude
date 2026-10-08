// 001 c-rail-streak — frame 0 of the film. 85mm macro tracking the brass rail at 24 u/s (camColdRail, frame-identical bookend);
// a white-hot clay spark overtakes the lens at 30 u/s, burning a filament into the rail and throwing amber sparks in its wake.
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b1-cold.js';

shot({
  id: 'c-rail-streak', dur: beats(1), act: 'COLD',
  music: { section: 'cold', chord: 'Dm', div: 8, energy: 0.7, add: ['pulse', 'ticks'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -3 });
    ctx.sfx(0, 'sub_drop', { gain: -6 });
    ctx.sfx(0, 'tick', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'COLD', fog: 0.02 });
    const fl = W.floor({ rough: 0.05 }); scene.add(fl.mesh);
    const S = B.sparkRail({}); scene.add(S.group);
    const gr = W.grade('COLD', { bloom: { strength: 1.2, radius: 0.4, threshold: 0.7 }, ca: 0.0012, vignette: 0.5 });
    return {
      scene, camera, ...gr,
      update(lt) {
        const t = ctx.shot.start + lt;
        // frame-0 transient: the spark ignites over-bright and settles in 4 f
        const ign = 1 - 0.25 * Math.exp(-lt / 0.05);   // the B-hit exposure kick is the frame-0 flash; keep the spark itself from clipping
        S.update(lt, { k: 12 * ign, hot: Math.min(1.3, ign), t });
        const dbg = new URLSearchParams(location.search).get('dbg') || '';
        if (dbg.includes('a')) S.smear.visible = false;
        if (dbg.includes('b')) S.wake.visible = false;
        if (dbg.includes('c')) S.halo.visible = false;
        if (dbg.includes('d')) S.streak.visible = false;
        if (dbg.includes('e')) S.core.visible = false;
        if (dbg.includes('f')) S.group.children.forEach((c) => { if (c.isPoints) c.visible = false; });
        if (dbg.includes('g')) fl.mesh.visible = false;
        fl.setSources(S.sources);
        this.bloom.strength = W.bloomHit(1.2, lt, { peak: 1.3, d: 0.3 });
        camFX(camera, t, W.camColdRail(camera, lt));
      },
    };
  },
});
