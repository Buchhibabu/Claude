// 004 c-foreman-worm — 14mm worm's-eye at the foot of the UNEXPLAINED colossus (camForemanWorm, pull 38 so T1-T4 read; use the same
// pull in p-bookend-foreman). A black stepped silhouette against warm back-lit haze; a clay -> ivory specular sweep climbs its
// front-left corner seam at 140 u/s leaving a fading trail. Nothing else on it is lit. The haze swells into the braam at 2.0.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b1-cold.js';
const { THREE } = W;

shot({
  id: 'c-foreman-worm', dur: beats(1), act: 'COLD',
  music: { section: 'cold', chord: 'Dm', div: 8, energy: 0.8, add: ['pulse', 'ticks'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'reverse_swell', { dur: 0.5, gain: -4 });
    const { scene, camera } = W.stage({ act: 'COLD', fog: 0.009, fogColor: 0x3a2416 });   // lighter warm haze: aerial perspective layers the tiers
    const H = W.hall(scene, { state: 'cold', parts: { banks: false, line: false, pillars: false } });
    // back-light: a broad warm glow far behind the monument so the stepped silhouette cuts black against lit air
    const glow = W.flare({ color: W.C.amberRail, k: 2.2, size: 900, fog: false, ref: 50 });
    glow.position.set(0, 120, -520); scene.add(glow);
    const rays = [];
    [[-0.5, 1.0], [-0.22, 0.8], [0.18, 0.9], [0.46, 0.7]].forEach(([a, op], i) => {
      const s = W.shaft({ rTop: 2, rBot: 70, h: 420, color: W.C.amberRail, k: 0.9, opacity: 0.1 * op, top: 0.2, bottom: 1.0, apexFade: 0.05 });
      W.aimShaft(s, [0, 150, -330], [Math.sin(a) * 420, 150 + Math.cos(a) * 420, -330]);
      scene.add(s); rays.push(s);
    });
    // crepuscular rays fanning from behind the obelisk (the monument cuts them); its engraving stays hidden until Act III
    const fan = B.rayFan({ color: W.C.amberRail, k: 1.6, size: 760, count: 64, seed: 17 }); fan.position.set(0, 150, -330); scene.add(fan);
    H.foreman.engraving.visible = false;
    const tr = B.trail({ path: H.foreman.sweepPath, count: 320, r: 0.55 }); scene.add(tr.mesh);
    const head = W.flare({ color: W.C.clay, k: 10, size: 14 }); scene.add(head);
    const headA = B.anamorphic({ color: W.C.amberRail, k: 2.2, w: 90, h: 1.6 }); scene.add(headA);
    const motes = B.embers({ count: 700, center: [0, 0, -100], spread: [70, 40, 30], rise: 0.8, sway: 0.5, color: W.C.amberRail, k: 0.35, size: 0.18, seed: 41 });
    scene.add(motes.points);
    const sweepSrc = { p: [0, 0, 0], c: W.C.clay, k: 8, pool: 0, refl: 2.0, size: 1 };
    H.extra.push(sweepSrc);
    const gr = W.grade('COLD');
    return {
      scene, camera, ...gr,
      update(lt) {
        const t = ctx.shot.start + lt;
        const s = 40 + 140 * lt;
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.45, sweep: { s, k: 12, len: 6 } });
        tr.update(s, { k: 12, decay: 22, head: 4 });
        const p = H.foreman.sweepPath.getPointAt(clamp(s / H.foreman.sweepLen));
        sweepSrc.p[0] = p.x; sweepSrc.p[1] = p.y; sweepSrc.p[2] = p.z;
        head.position.copy(p); headA.position.copy(p);
        const u = clamp(s / H.foreman.sweepLen); head.userData.set(9, u > 0.6 ? W.C.ivory : W.C.clay); headA.userData.set(2.2);
        const swell = ease.in(clamp(lt / 0.5));   // the reverse swell: the haze behind it brightens into the braam
        glow.userData.set(2.0 + 1.6 * swell);
        fan.userData.set(1.3 + 1.4 * swell); fan.userData.spin(0.05 * lt);
        rays.forEach((r) => r.userData.set(0.9 + 0.8 * swell));
        motes.update(t, { k: 0.35 });
        H.update(lt, { sky: 1.2 + 1.2 * swell });
        camFX(camera, t, W.camForemanWorm(camera, lt, { pull: 38 }));
      },
    };
  },
});
