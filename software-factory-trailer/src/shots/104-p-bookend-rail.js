// p-bookend-rail — BOOKEND of c-rail-streak: the same camColdRail macro and the same spark rig (b1 sparkRail, same d0/rel),
// frame-identical, now clear (fog 0.004) and warm: the clay spark comets along the brass rail L -> R, burning its filament,
// throwing amber sparks, while the lit factory floor beyond glows with flowing circuit traces and reflections.
import { shot, beats, camFX, clamp } from '../engine.js';
import * as W from './lib/world.js';
import * as B1 from './lib/b1-cold.js';
import { peakGrade } from './lib/b8-peak-end.js';

shot({
  id: 'p-bookend-rail', dur: beats(1, 150), act: 'III',
  music: { section: 'peak', chord: 'C', div: 16, energy: 0.96, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'impact', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = W.hall(scene, { state: 'lit', parts: { rails: true } });
    H.rails.mesh.scale.y = 0.12;            // macro: the factory's floor traces read as inlaid circuit lines
    const S = B1.sparkRail({}); scene.add(S.group);
    const out = {
      scene, camera, ...peakGrade({ bloom: { strength: 1.1, radius: 0.4, threshold: 0.72 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const ign = 1 + 0.5 * Math.exp(-lt / 0.04);
        S.update(lt, { k: 14 * ign, hot: Math.min(1.3, ign), t });
        H.rails.update(lt, { cascade: 99, flow: 30, t, k: 8 });
        H.banks.update(lt, { on: 1, t });
        H.line.update(lt, { lit: 1, strips: 1 });
        H.foreman.update(lt, { lit: 6 });
        H.extra.length = 0; H.extra.push(...S.sources);
        H.update(lt, { lit: 1 });
        out.bloom.strength = W.bloomHit(1.1, lt, { peak: 1.4, d: 0.3 });
        camFX(camera, t, W.camColdRail(camera, lt));
      },
    };
    return out;
  },
});
