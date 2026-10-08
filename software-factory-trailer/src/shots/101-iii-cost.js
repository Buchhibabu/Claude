// 101 iii-cost — PROOF: economics. LOW camera at (-14,3,40) looking toward (0,30,-120), 2% push. Frame-left foreground: a monumental
// brass cost gauge — a vertical stack of 10 glowing clay rings (r 2.2, 1.6u apart) on a brass spine with emissive seams. From local 0.2
// the top 4 rings switch OFF one per 16th (0.1 s) with a relay clunk, leaving 6 lit (-40%). Behind it the line keeps flowing L->R at
// full speed and the foreman's core stays at full brightness (output unchanged). No axes, no numbers in 3D.
// Card: 40% LOWER COST THAN OPUS 5. / ANTHROPIC.
// (Shift-lens 18mm instead of 35mm: from y 3 a 35mm frame cannot hold the gauge, the line and the core at once; verticals stay parallel.)
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b7-act3b.js';
const { THREE } = W;

const OFF = [0.2, 0.3, 0.4, 0.5];   // rings 9, 8, 7, 6 switch off
shot({
  id: 'iii-cost', dur: beats(5, 150), act: 'III',
  music: B.act3('F', 0.97),
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'A');
    ctx.sfx(0, 'impact', { gain: -2 });
    OFF.forEach((at) => ctx.sfx(at, 'tick', { gain: -6 }));
    const { scene, camera } = W.stage({ act: 'III', fog: 0.0036 });
    const H = B.litHall(scene, {});
    const F = B.lineFlow({ count: 3000, lanes: 7, speed: 30, k: 6, size: 0.4, width: 8 }); scene.add(F.points);
    // gauge placement: frame-left foreground, ~26u from the lens
    const cam0 = [-14, 3, 40];
    const fwd = new THREE.Vector2(14, -160).normalize(); const left = new THREE.Vector2(fwd.y, -fwd.x);
    const az = THREE.MathUtils.degToRad(25), D = 25;
    const GX = cam0[0] + fwd.x * D * Math.cos(az) + left.x * D * Math.sin(az), GZ = cam0[2] + fwd.y * D * Math.cos(az) + left.y * D * Math.sin(az);
    const G0 = new THREE.Group(); G0.position.set(GX, 0, GZ); scene.add(G0);
    const brass = W.edgeStd({ color: W.C.brassDark, metal: 0.9, rough: 0.35, edge: W.C.brassHi, edgeK: W.kl(2) * 0.4, edgeW: 1.6 });
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.4, 6.4), brass); plinth.position.y = 0.7; G0.add(plinth);
    const plinth2 = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.8, 4.6), brass); plinth2.position.y = 1.8; G0.add(plinth2);
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 18.2, 16), new THREE.MeshStandardMaterial({ color: W.C.brassDark, metalness: 0.9, roughness: 0.3 })); spine.position.y = 2.2 + 9.1; G0.add(spine);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 4), brass); cap.position.y = 2.2 + 18.2 + 0.7; G0.add(cap);
    const seam = W.glowSegs([[[0.33, 2.2, 0], [0.33, 20.4, 0]], [[-0.33, 2.2, 0], [-0.33, 20.4, 0]], [[0, 2.2, 0.33], [0, 20.4, 0.33]]].map((p) => p.map((q) => [q[0] + GX, q[1], q[2] + GZ])), { color: W.C.brass, k: 2.2, width: 1.2 });
    scene.add(seam);
    const RY = (i) => 3.4 + i * 1.6;
    const rings = [], dead = [], spokes = [];
    for (let i = 0; i < 10; i++) {
      const dr = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.1, 10, 72), new THREE.MeshStandardMaterial({ color: W.C.brassDark, metalness: 0.9, roughness: 0.35 }));
      dr.rotation.x = Math.PI / 2; dr.position.y = RY(i); G0.add(dr); dead.push(dr);
      const gl = W.G.ring({ r: 2.2, tube: 0.24, color: W.C.clay, k: 1 }); gl.rotation.x = Math.PI / 2; gl.position.y = RY(i); G0.add(gl); rings.push(gl);
      for (let s = 0; s < 4; s++) { const a = s * Math.PI / 2 + Math.PI / 4; const sp = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.08), brass); sp.position.set(Math.cos(a) * 1.25, RY(i), Math.sin(a) * 1.25); sp.rotation.y = -a; G0.add(sp); spokes.push(sp); }
    }
    const pop = W.flare({ color: W.C.ivory, k: 0, size: 7 }); G0.add(pop);
    const relay = W.orbs({ count: 10, r: 0.18, seg: 8 }); scene.add(relay.mesh);
    return {
      scene, camera, ...W.grade('III', { bloom: { strength: 1.15, radius: 0.5, threshold: 0.75 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        let lit = 10, popK = 0, popY = 0;
        for (let i = 0; i < 10; i++) {
          const j = 9 - i; const off = j < 4 ? OFF[j] : 99;   // ring index 9 is the top
          const d = lt - off;
          const on = d < 0 ? 1 : 0;
          if (!on) lit--;
          const flash = d >= 0 && d < 0.1 ? Math.exp(-d * 40) : 0;
          if (flash > popK) { popK = flash; popY = RY(i); }
          const k = on ? 9 * (1 + 0.12 * W.beatPulse(t + i * 0.02, { bpm: 150, div: 4, decay: 6 })) : 0;
          rings[i].material.color.set(on ? W.C.clay : W.C.ivory).multiplyScalar(W.ko(on ? k : 16 * flash));
          rings[i].visible = on || flash > 0.01;
          relay.set(i, { p: [GX + 2.75, RY(i), GZ + 0.2], c: W.lin(on ? W.C.green : W.C.red), k: on ? 3 : 2 });
        }
        relay.commit();
        pop.position.set(0, popY, 0.3); pop.userData.set(10 * popK, W.C.ivory);
        B.litUpdate(H, lt, t, { foreman: 5, beam: 0.45, foremanOpts: { hourRing: 18, core: 20 } });
        F.update(t);
        H.extra.length = 0;
        H.extra.push({ p: [GX, 9, GZ], c: W.C.clay, k: 1.2 * lit, pool: 5, poolK: 1.1, refl: 1.2, size: 3 });
        B.foremanRefl(H.extra, 5, 1.2);
        H.update(lt);
        const u = clamp(lt / ctx.T);
        const pos = [lerp(-14, -14 + 14 * 0.02, u), 3, lerp(40, 40 - 160 * 0.02 * 0.5, u)];
        camFX(camera, t, B.camShift(camera, pos, [0, 3, -120], 60, 640));
      },
    };
  },
  ui(root, tl, K, ctx) {
    B.proofCard(root, tl, K, { ...B.CARDS.cost, enter: true, cutOut: 1.9, push: { d: 1.9, from: 1, to: 1.025 } });
  },
});
