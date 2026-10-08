// 005 c-wave-one — BRAAM #1. Low frontal 24mm on the blazing 1,000-orb code tower (wave one, flash-forward) in x2 fog, 8% linear
// push; 2 f white flash + tier-S hit on the braam frame; WAVE ONE decodes, ≈5 MONTHS. slams 1.6 -> 1.0 in 4 f over a -0.8 stop scrim.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b1-cold.js';

shot({
  id: 'c-wave-one', dur: beats(4), act: 'COLD',
  music: { section: 'cold', chord: 'Dm', div: 8, energy: 0.9, add: ['pulse', 'strings'], drop: [] },
  three(ctx) {
    const { scene, camera } = W.stage({ act: 'COLD' });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, tower: true } });
    H.foreman.group.visible = false;   // out of frame; keep it from catching the tower light
    const em = B.embers({ count: 1400, center: [-19.6, 0, 6], spread: [40, 44, 34], rise: 3.2, sway: 0.8, color: W.C.amberRail, k: 0.9, size: 0.22, seed: 55 });
    scene.add(em.points);
    const fan = B.rayFan({ color: W.C.amberRail, k: 1.2, size: 150, count: 56, seed: 23 }); fan.position.set(-19.6, 31, -14); scene.add(fan);
    const halo = W.flare({ color: W.C.clay, k: 3, size: 70, ref: 0.5 }); halo.position.set(-19.6, 18, -4); scene.add(halo);
    const gr = W.grade('COLD', { bloom: { strength: 1.6, radius: 0.4, threshold: 0.7 } });
    return {
      scene, camera, ...gr,
      update(lt) {
        const t = ctx.shot.start + lt;
        H.tower.update(lt, { count: 1000, k: 12, crest: 1, t, pulse: 0.3 });
        H.tower.crest.rotation.z = lt * 0.6;
        H.line.update(lt, { lit: 0, strips: 0, dim: 0.3 });
        em.update(t, { k: 0.9 });
        fan.userData.set(1.1 + 0.5 * W.beatPulse(t, { decay: 4 })); fan.userData.spin(-0.08 * lt);
        halo.userData.set(2.4 + 0.6 * W.beatPulse(t, { div: 2, decay: 5 }));
        H.update(lt);
        this.bloom.strength = W.bloomHit(1.0, lt, { peak: 1.6, d: 20 / 30 });
        // 8% linear push from (-19.6, 2, 34) toward the target (-19.6, 18, 0)
        const u = 0.08 * clamp(lt / ctx.T);
        const fov = W.camLook(camera, [-19.6, lerp(2, 18, u), lerp(34, 0, u)], [-19.6, 18, 0], W.FOV[24]);
        camFX(camera, t, fov);
      },
    };
  },
  ui(root, tl, K, ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'S');
    ctx.fx.flash(0, 0.067);
    ctx.sfx(0, 'braam', { root: 'D1', gain: 0 });
    ctx.sfx(0, 'impact', { gain: 0 });
    ctx.sfx(0, 'sub_drop', { gain: -2 });
    const sc = B.scrim(K, root, { x: 960, y: 500, w: 2100, h: 640, a: 0.62 });
    K.cutIn(tl, sc, 0); K.cutOut(tl, sc, 1.9);
    const kick = K.text(root, { x: 960, y: 372, w: 1200, cls: 'mono', html: 'WAVE ONE', style: { fontSize: '40px', letterSpacing: '0.32em', color: 'rgba(207,227,242,0.92)' } });
    K.decode(tl, kick, 0, { d: 6 / 30 });
    const mega = K.text(root, { x: 960, y: 540, w: 1900, cls: 'mega', html: '<span class="hot">≈5</span> MONTHS.',
      style: { color: '#FAF9F5', fontSize: '250px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', textShadow: '0 0 60px rgba(0,0,0,0.55)' } });
    K.slam(tl, mega, 0, { from: 1.6, blur: 14, d: 4 / 30 });
    K.cutOut(tl, kick, 1.9); K.cutOut(tl, mega, 1.9);
  },
});
