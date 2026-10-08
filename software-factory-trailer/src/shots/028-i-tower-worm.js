// 28 · i-tower-worm — worm's-eye 14mm from the floor at the foot of the tower, Dutch -8: the 1,000-orb lattice converges overhead,
// clay light pouring down the column (volumetric shaft + falling motes). The orbs pulse on twos — a stepped wave of light racing UP
// the tiers toward the crest ring, which halos at the top. Slow creep push.
import { shot, beats, camFX } from '../engine.js';
import { W, THREE, T, gradeI, motes, towerHalo, smoothOrbs, ease, clamp, lerp } from './lib/b3.js';

shot({
  id: 'i-tower-worm', dur: beats(2), act: 'I',
  music: { section: 'act1', chord: 'Bb', div: 8, energy: 0.74, add: ['strings'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'impact', { gain: -9 });
    const { scene, camera } = W.stage({ act: 'I', fog: 0.008 });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, banks: false } });
    const halo = towerHalo(scene);
    // crest halo: hot flare + a wide soft second ring
    const crestFl = W.flare({ color: W.C.clay, k: 0, size: 40 }); crestFl.position.set(-19.6, 34, 0); scene.add(crestFl);
    const halo2 = W.G.ring({ r: 10.5, tube: 0.5, color: W.C.ember, k: 0 }); halo2.rotation.x = Math.PI / 2; halo2.position.set(-19.6, 34, 0); scene.add(halo2);
    // light pouring down: a shaft from the crest to the floor + falling motes inside the column
    const pour = W.shaft({ rTop: 6, rBot: 10, h: 34, color: W.C.clay, k: 1, opacity: 0, top: 1.0, bottom: 0.5, apexFade: 0.05 });
    pour.position.set(-19.6, 17, 0); scene.add(pour);
    const M = motes({ count: 1800, box: [-28, -11, 0.2, 36, -9, 9], color: W.C.amber, k: 2, size: 0.07, seed: 281, drift: [0, -3.5, 0] });
    scene.add(M.points);
    const TOWER = H.tower; smoothOrbs(TOWER.I, 22);
    return {
      scene, camera, ...gradeI({ bloom: { strength: 0.88, radius: 0.5, threshold: 0.8 } }),
      update(lt) {
        const t = T(ctx, lt);
        TOWER.update(lt, { count: 1000, k: 11, crest: 1, t, pulse: 0.1 });
        // pulse on twos: a stepped wave climbs the tiers (frame index / 2), one tier per step, repeating
        const step = Math.floor(lt * 15);                    // on twos at 30 fps
        const front = (step % 12) - 1;                       // tier index lit hot
        const cl = W.lin(W.C.clay), hot = W.lin(W.C.ember);
        for (let i = 0; i < 1000; i++) {
          const tier = Math.floor(i / 100);
          const d = tier - front;
          const b = d === 0 ? 1 : d === -1 ? 0.45 : d === -2 ? 0.18 : 0;
          if (b > 0) TOWER.I.set(i, { p: TOWER.orbPos(i), c: b > 0.9 ? hot : cl, k: 11 * 0.45 * (1 + 1.0 * b) });
        }
        TOWER.I.commit();
        const crestHit = front >= 9 ? 1 : 0;
        crestFl.userData.set(3 + 3 * crestHit + 1.2 * W.beatPulse(t, { div: 2 }));
        halo2.material.color.set(W.C.ember).multiplyScalar(W.ko(1.2 + 1.5 * crestHit));
        halo.update({ k: 0.35, h: 30, core: 1 });
        pour.userData.set(1.4, 0.2);
        M.update(t, { k: 1.8, drift: [0.05, -3.5, 0.05] });
        H.extra.length = 0; H.extra.push({ p: [-19.6, 3, 0], c: W.C.clay, k: 8, pool: 14, poolK: 1.2, refl: 0, size: 6 });
        H.update(lt, { sky: 1.5 });
        // worm's-eye 14mm, Dutch -8, creep push toward the column
        const u = ease.inOut(clamp(lt / ctx.T));
        // (lens 4u outside the lattice's front face — from inside it the nearest orbs fill the frame as blobs)
        const p = [lerp(-22, -21.7, u), lerp(0.5, 0.8, u), lerp(11.2, 10.2, u)];
        camFX(camera, t, W.camLook(camera, p, [-19.6, 30, 0], W.FOV[14], { roll: lerp(-8, -9.5, u) }));
      },
    };
  },
});
