// 30 · i-dive-core — FPV 18mm straight at the tower's brightest point, accelerating (power2.in): the lattice swells from a
// column of light to a wall of orbs whipping past the lens, the hot core blooming dead centre, until clay-white fills the frame
// (exposure +1.2 stop over the last 6 f). Hard cut on the music stop.
import { shot, beats, camFX } from '../engine.js';
import { W, THREE, T, gradeI, motes, towerHalo, lensWash, smoothOrbs, ease, clamp, lerp } from './lib/b3.js';

const CORE = [-19.6, 16.6, 0];

shot({
  id: 'i-dive-core', dur: beats(3), act: 'I',
  music: { section: 'act1', chord: 'C', div: 16, energy: 0.78, add: ['strings'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(1, 'reverse_swell', { dur: 0.5, gain: -3 });
    const { scene, camera } = W.stage({ act: 'I', fog: 0.007 });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, banks: false } });
    H.foreman.group.visible = false;
    smoothOrbs(H.tower.I, 12);                               // the last rows whip past the lens
    const halo = towerHalo(scene);
    // the core: a hot sphere of light inside the lattice + a big flare
    const core = W.glowMesh(new THREE.SphereGeometry(1.2, 24, 16), W.C.ivory, 0, { radius: 1.2 }); core.position.set(...CORE); scene.add(core);
    const coreFl = W.flare({ color: W.C.clay, k: 0, size: 30 }); coreFl.position.set(...CORE); scene.add(coreFl);
    const coreFl2 = W.flare({ color: W.C.ivory, k: 0, size: 8 }); coreFl2.position.set(CORE[0], CORE[1], CORE[2] + 0.5); scene.add(coreFl2);
    const coreL = new THREE.PointLight(W.C.clay, 0, 30, 1.4); coreL.position.set(...CORE); scene.add(coreL);
    // speed motes along the dive path
    const M = motes({ count: 1400, box: [-34, -5, 6, 26, -8, 46], color: W.C.amber, k: 1.6, size: 0.07, seed: 301 });
    scene.add(M.points);
    const wash = lensWash(camera, scene, { color: 0xffe0c8 });
    const R = {
      scene, camera, ...gradeI({ bloom: { strength: 0.9, radius: 0.55, threshold: 0.8 } }),
      update(lt) {
        const t = T(ctx, lt);
        const u = clamp(lt / ctx.T), e = 0.18 * u + 0.82 * u * u;   // power2.in (with a little launch speed so frame 0 moves)
        const z = lerp(40, 2, e), y = lerp(15, 16, e);
        const near = clamp((lt - 0.9) / 0.6);                // the core takes over
        const last = clamp((lt - (ctx.T - 6 / 30)) / (6 / 30)); // last 6 frames
        // lattice: rows near the lens light hotter as they whip past (light rakes over them)
        H.tower.update(lt, { count: 1000, k: 12 + 4 * near, crest: 1, t, pulse: 0.22 });
        halo.update({ k: 0.3 + 0.5 * near, h: 30, core: 1 + 2 * near });
        core.userData.setGlow(10 + 30 * near + 40 * last);
        coreFl.userData.set(3 + 10 * Math.pow(near, 1.5) + 20 * last);
        coreFl2.userData.set(4 + 12 * near);
        coreL.intensity = 200 + 1500 * near;
        M.update(t, { k: 1.4 + 1.2 * near, drift: [0, 0.4, 0] });
        H.update(lt, { sky: 1.4 });
        // white-out: clay-white floods the lens over the last 6 frames; exposure +1.2 stop
        wash.update(Math.pow(last, 1.3) * 0.92 + 0.08 * Math.pow(near, 3), 0xffe2cc, 1);
        R.exposure = 0.9 * Math.pow(2, 1.2 * ease.in(last));
        R.bloom.strength = 0.9 + 0.6 * near;
        // FPV: accelerating, tiny banking, aimed at the core
        const roll = 2.5 * Math.sin(lt * 3.1) * (1 - near) + 6 * e;
        camFX(camera, t, W.camLook(camera, [-19.6 + 0.3 * Math.sin(lt * 2.3), y, z], [CORE[0], CORE[1] - 0.3 * (1 - e), CORE[2]], W.FOV[18], { roll }));
      },
    };
    return R;
  },
});
