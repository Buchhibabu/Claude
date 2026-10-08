// 39 ii-test-tower — tricolon 2/3: the next station is worse. 14mm worm's-eye (camTestWorm, Dutch +10) up the TEST mass: twice the
// REVIEW tower's height, converging into fog, red pinpoints CLIMBING it on 8ths (a new band ignites every 8th). TEST. stamps in danger
// red on the mass's front face at the bottom of frame (+20% over REVIEW.); the REVIEW mass stands lower at frame left.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-test-tower', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 8, energy: 0.68, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'boom', { gain: -1 });
    ctx.sfx(0, 'impact', { gain: -6 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.0075 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false } });
    const test = B.towerMass({ name: 'test', nx: 3, nz: 3, maxH: 162, seed: 5, pinsPerLevel: 3, pinEvery: 7 });
    const rev = B.towerMass({ name: 'review', nx: 5, nz: 3, maxH: 84, seed: 3, pinsPerLevel: 2, pinEvery: 8 });
    scene.add(test.group, rev.group);
    // the stamp: on the TEST mass's +z face, low (the station face itself sits below this lens's frame)
    const ST = B.stamp3D('TEST.', { height: 3.0, k: 2.3, glow: 0.32, peak: 1.7 });
    ST.group.rotation.x = 0.5; ST.group.position.set(21.1, 13.9, test.halfD + 1.1); scene.add(ST.group);
    // hot band flares riding the pin chase
    const FL = []; for (let i = 0; i < 4; i++) { const f = W.flare({ color: C.red, k: 0, size: 7 }); scene.add(f); FL.push(f); }
    // cold top light behind the stack: a lit haze for the column to read against
    const back = B.glowCard({ w: 140, h: 220, color: 0x9ab8d0, k: 0.09, falloff: 2.2 });
    back.position.set(28, 120, -70); scene.add(back);
    const ceil = B.glowCard({ w: 260, h: 260, color: 0x9ab8d0, k: 0.9, falloff: 2.4 });
    ceil.rotation.x = Math.PI / 2; ceil.position.set(24, 175, -6); scene.add(ceil);
    const rimL = new THREE.DirectionalLight(C.ice, 1.3); rimL.position.set(30, 120, -80); scene.add(rimL);
    const shock = new THREE.PointLight(C.red, 0, 30, 1.5); shock.position.set(21, 9, 9); scene.add(shock);
    const SP = B.sparks({ count: 360, color: C.red, size: 0.14, k: 7 }); scene.add(SP.points);
    const bursts = [0, 1, 2, 3, 4, 5].map((i) => ({ t0: 0.0 + i * 0.01, p: [18.5 + i, 10 + (i % 2) * 1.6, test.halfD + 0.5], n: 55, speed: 10, life: 0.6, seed: 390 + i, g: 10, dir: [0, 2, 5] }));
    // grit falling off the stack through the lens (scale + speed)
    const NG = 160, rg = rand(3902);
    const grit = Array.from({ length: NG }, () => ({ x: 14 + rg() * 16, z: -2 + rg() * 10, y0: 30 + rg() * 90, v: 18 + rg() * 26, ph: rg() }));
    const GR = B.streaks(NG, { color: C.ice, k: 1.1, width: 1.4 }); scene.add(GR.mesh);

    return {
      scene, camera, ...W.grade('II', { bloom: { strength: 0.95, radius: 0.45, threshold: 0.78 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const step = Math.floor(lt / 0.25), sub = lt - step * 0.25;
        const pins = clamp((step + 1) / 4 * 0.98 + 0.02);
        const jolt = Math.exp(-lt / 0.12);
        test.update(lt, { h: 160 + 2 * lt, t, pins, pinDiv: 2, shake: 0.08 * jolt, k: 1.35, body: 1.1 });
        rev.update(lt, { h: 82, t, pinDiv: 2, k: 0.5, body: 0.35, red: 0.4 });
        // the newest band flares as the chase climbs
        const levels = Math.ceil(162 / 7);
        const yBand = 3 + 6 + (pins * levels - 1) * 7;
        FL.forEach((f, i) => {
          const fx = 21 + (i % 2 ? 1 : -1) * (test.halfW + 0.1), fz = i < 2 ? test.halfD * 0.2 : test.halfD + 0.1;
          f.position.set(i < 2 ? fx : 21 + (i - 2.5) * 3, yBand + (i % 2) * 2.5, fz);
          f.userData.set(6 * Math.exp(-sub / 0.08) + 0.6, C.red);
        });
        ST.update(lt, {});
        shock.intensity = 70 * Math.exp(-lt / 0.12);
        SP.update(bursts, lt);
        for (let i = 0; i < NG; i++) {
          const g = grit[i];
          const y = g.y0 - g.v * (lt + g.ph * 2);
          if (y < 4) { GR.hide(i); continue; }
          GR.set(i, [g.x, y, g.z], [g.x, y + 0.08 * g.v, g.z]);
        }
        GR.commit();
        H.line.update(lt, { lit: 0, dim: 0.45, red: [0, 0, 0, 0.5, 0.9, 0, 0] });
        H.extra.length = 0;
        H.extra.push({ p: [21, 3, 6], c: C.red, k: 2.5 + 6 * jolt, pool: 7, poolK: 1, refl: 1.2, size: 3 });
        H.extra.push(...test.sources(), ...rev.sources());
        H.update(lt, { sky: 2.6 });
        // shared camTestWorm framing + a 3% creep up the column for life
        const fov = W.camTestWorm(camera, lt, { dutch: 10 });
        camera.translateZ(-0.6 * ease.out(clamp(lt / ctx.T)));
        W.handheld(camera, t, 0.3, 39);
        camFX(camera, t, fov);
      },
    };
  },
});
