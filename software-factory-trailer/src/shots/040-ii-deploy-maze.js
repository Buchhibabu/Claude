// 40 ii-deploy-maze — tricolon 3/3, MASTER B: and the next. 50mm top-down (camDeployTop, yaw 6 deg/s): the DEPLOY region as a
// gridlocked maze of 14 conveyor strips, 240 cards jammed, red stop lamps on 8ths. On the A hit DEPLOY. slams down flat across the
// floor in danger red (+40% over REVIEW.), every stop lamp flares, the jam jolts and a red shock ring runs out across the floor.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
const { THREE, C } = W;

shot({
  id: 'ii-deploy-maze', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 8, energy: 0.7, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'A');
    ctx.sfx(0, 'boom', { gain: 0 });
    ctx.sfx(0, 'impact', { gain: -2 });
    ctx.sfx(0, 'sub_drop', { gain: -6 });

    const { scene, camera } = W.stage({ act: 'II', fog: W.fogKeep(70, 0.85) });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, pillars: false } });
    const D = W.deployMaze({}); scene.add(D.group);
    // the word, laid flat: a floor stamp just above the jam's card tops so nothing occludes it
    const ST = B.stamp3D('DEPLOY.', { height: 3.15, k: 2.4, glow: 0.26, glowW: 1.15, glowH: 1.9, peak: 1.8, from: 1.5 });
    ST.group.rotation.x = -Math.PI / 2; ST.group.position.set(40.6, 0.95, 0.6); scene.add(ST.group);
    // red shock ring on the floor
    const ringPts = Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * Math.PI * 2; return [Math.cos(a), 0, Math.sin(a)]; });
    const ring = W.fat(ringPts, { color: C.red, k: 4, width: 3 }); ring.position.set(40.6, 0.45, 0.6); scene.add(ring);
    // lamp flares (stop lamps read as hot pinpoints from 70u)
    const lampFl = D.strips.map(() => { const f = W.flare({ color: C.red, k: 0, size: 3.2 }); scene.add(f); return f; });
    const lampP = D.strips.map((s) => (s.alongX ? [s.x + s.L / 2 + 0.5, 0.6, s.z] : [s.x, 0.6, s.z + s.L / 2 + 0.5]));
    // overspill: cards spat off the strip ends on the hit
    const SP = B.sparks({ count: 300, color: C.red, size: 0.22, k: 6 }); scene.add(SP.points);
    const bursts = lampP.map((p, i) => ({ t0: 0.0 + (i % 5) * 0.012, p: [p[0], 0.8, p[2]], n: 20, speed: 12, life: 0.5, seed: 400 + i, g: 0, dir: [0, 6, 0] }));
    const dust = W.swarmHaze({ count: 700, spread: [60, 8, 30], center: [40.6, 5, 0], color: C.ice, size: 0.12, k: 0.8, seed: 401 });
    scene.add(dust.points);
    const r = rand(4002); const jit = Float32Array.from({ length: 400 }, () => r());

    return {
      scene, camera, ...W.grade('II', { bloom: { strength: 0.95, radius: 0.45, threshold: 0.8 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const hitE = Math.exp(-lt / 0.1), jolt = Math.exp(-lt / 0.14);
        D.update(lt, { cards: 240, t });
        // jolt: every jammed card kicks on the hit (instance matrices already composed: nudge via a second pass)
        if (jolt > 0.02) {
          const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
          for (let i = 0; i < 240; i++) {
            D.I.mesh.getMatrixAt(i, m4); m4.decompose(p, q, s);
            p.x += (jit[i] - 0.5) * 0.5 * jolt * Math.sin(lt * 60 + i); p.z += (jit[(i * 7) % 400] - 0.5) * 0.5 * jolt * Math.cos(lt * 55 + i);
            D.I.mesh.setMatrixAt(i, m4.compose(p, q, s));
          }
          D.I.commit();
        }
        // stop lamps: 8th-note blink (odd/even), all slammed hot on the hit
        D.strips.forEach((st, i) => {
          const on = W.blink(t, { div: 2, origin: (i % 2) * 0.25 });
          const k = Math.max(9 * on + 0.6, 16 * hitE);
          D.lamps.set(i, { p: lampP[i], c: W.lin(C.red), k });
          lampFl[i].position.set(...lampP[i]); lampFl[i].userData.set(Math.max(1.6 * on, 4 * hitE) + 0.2, C.red);
        });
        D.lamps.commit();
        ST.update(lt, {});
        const dr = lt;
        ring.visible = dr < 0.7;
        if (ring.visible) { const s = lerp(4, 46, ease.expoOut(clamp(dr / 0.7))); ring.scale.set(s, 1, s); ring.userData.set(5 * Math.pow(1 - dr / 0.7, 2)); }
        SP.update(bursts, lt);
        H.line.update(lt, { lit: 0, dim: 0.3, red: [0, 0, 0, 0.3, 0.25, 1, 0] });
        H.line.boxes.hide(W.ST.DEPLOY); H.line.boxes.commit();   // the DEPLOY plinth would cover the maze from above
        H.extra.length = 0;
        D.strips.forEach((st, i) => { if (i % 2 === 0) H.extra.push({ p: lampP[i], c: C.red, k: 1.0 + 3 * hitE, pool: 3.2, poolK: 1, refl: 0, size: 0.5 }); });
        H.extra.push({ p: [40.6, 1, 0.6], c: C.red, k: 0.6 + 6 * hitE, pool: 16, poolK: 0.9, refl: 0, size: 6 });
        H.update(lt);
        // camDeployTop + a 6% descend (crash-in on the hit, then creep)
        const fov = W.camDeployTop(camera, lt);
        camera.position.y = 70 * (1 - 0.03 * ease.expoOut(clamp(lt / 0.25)) - 0.03 * clamp(lt / ctx.T));
        W.handheld(camera, t, 0.3, 40);
        camFX(camera, t, fov);
      },
    };
  },
});
