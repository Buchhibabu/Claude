// 007 c-core-tease — half-seen: 50mm macro on the foreman's 3u slot, the clay core (k20) burning behind it through fog 0.03 like
// a furnace through a crack; heat motes drift up through the slot light; one brass seam beside it ignites (k 0 -> 6) for 4 f and
// dies. 1u lateral drift = parallax between the slot lips and the core. Unexplained.
import { shot, beats, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b1-cold.js';
const { THREE } = W;

shot({
  id: 'c-core-tease', dur: beats(1), act: 'COLD',
  music: { section: 'cold', chord: 'Dm', div: 8, energy: 0.6, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'reverse_swell', { dur: 0.5, gain: -5 });
    const { scene, camera } = W.stage({ act: 'COLD', fog: 0.03 });
    const F = W.foreman(); scene.add(F.group);
    F.engraving.visible = false;
    const sky = W.atmosphere({ fogColor: scene.fog.color, glow: 0x000000 }); scene.add(sky);
    // the seam that flashes: the slot's left lip (x -1.6, face z -189), a soft glow line + a hot bead riding it
    const seam = W.glowSegs([[[-1.75, 136, -188.85], [-1.75, 172, -188.85]]], { color: W.C.brass, k: 6, width: 3.5 });
    scene.add(seam);
    const bead = W.flare({ color: W.C.brassHi, k: 8, size: 2.2 }); scene.add(bead);
    // light spilling out of the slot toward the lens + heat motes rising through it
    const spill = W.shaft({ rTop: 1.2, rBot: 6, h: 18, color: W.C.ember, k: 1.4, opacity: 0.22, top: 1, bottom: 0.2, apexFade: 0.02 });
    W.aimShaft(spill, [0, 150, -191], [1.2, 150, -173]); scene.add(spill);
    const motes = B.embers({ count: 500, center: [0, 138, -186], spread: [6, 30, 10], rise: 4, sway: 0.25, color: W.C.amberRail, k: 1.2, size: 0.06, seed: 97 });
    scene.add(motes.points);
    // the furnace read: a white-hot heart inside the clay core, plus a hot vertical flare line down the slot
    const heart = W.glowMesh(new THREE.SphereGeometry(1, 24, 16), 0xffe6c8, 20, { radius: 1, min: 0.7, max: 1.4 });
    heart.scale.setScalar(2.2); heart.position.set(0, 150, -193.2); scene.add(heart);
    const slit = B.anamorphic({ color: W.C.ember, k: 2.2, w: 34, h: 2.2 }); slit.material.rotation = Math.PI / 2; slit.position.set(0, 150, -188.5); scene.add(slit);
    const gr = W.grade('COLD', { vignette: 0.6 });
    return {
      scene, camera, ...gr,
      update(lt) {
        const t = ctx.shot.start + lt;
        // core breathes on the 8th pulse (a heartbeat behind stone)
        const br = 1 + 0.12 * W.beatPulse(t, { div: 2, decay: 7 });
        F.update(lt, { lit: 0, core: 20 * br, slotGlow: 1.0, rimColor: W.C.clay, rimK: 0.35 });
        // half-seen: the core's hall-light is held back (it lights the face from the front); only a lick of it rims the slot lips
        F.coreLight.intensity = 40 * br; F.coreFlare.userData.set(0.6 * br);
        // seam: k 0 -> 6 for 4 frames starting at 0.2 s, hot bead runs up it, then dies
        const s0 = 0.2, sd = 4 / 30, on = lt >= s0 && lt < s0 + sd ? 1 : lt >= s0 + sd ? Math.exp(-(lt - s0 - sd) / 0.04) : 0;
        seam.userData.set(6 * on); seam.visible = on > 0.01;
        bead.position.set(-1.75, lerp(140, 168, clamp((lt - s0) / sd)), -188.6); bead.userData.set(8 * on);
        motes.update(t, { k: 1.2 });
        spill.userData.set(0.8 * br);
        heart.userData.setGlow(20 * br); slit.userData.set(2.2 * br);
        const fov = W.camLook(camera, [lerp(2, 1, clamp(lt / ctx.T)), 150, -170], [0, 150, -195], W.FOV[50]);
        camFX(camera, t, fov);
      },
    };
  },
});
