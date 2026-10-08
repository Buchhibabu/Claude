// 83 iii-review-mirror — MIRROR of ii-review-slam: camReviewSide (135mm side at z 90, y 3), now tracking L->R (x -8 -> -4). The REVIEW
// wall is gone: where the bulkhead stood a brass gate post of light stands open, and the work streams through it at agent speed in two
// lanes, entering ice and leaving amber (each card flares as it crosses). The REVIEW box is lit; the master's red pinpoint is a green
// check lamp. A bank beam pours down beside the gate; warm motes drift across the lens.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE, C } = W;

shot({
  id: 'iii-review-mirror', dur: beats(1, 150), act: 'III',
  music: { section: 'act3', chord: 'Bb', div: 16, energy: 0.86, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'tick', { gain: -4 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = W.hall(scene, { state: 'lit', parts: {} });
    const GX = -8.4;                                                 // where the bulkhead stood
    // the open gate: the bulkhead's footprint is now a tall curtain of warm light (soft vertical band + two brass post lines) that the
    // work passes through, and a brass sill flush in the CODE/REVIEW gap where the wall's footing was
    const post = W.glowSegs([[[GX - 0.36, 3.0, 1.6], [GX - 0.36, 11, 1.6]], [[GX + 0.36, 3.0, 1.6], [GX + 0.36, 11, 1.6]]], { color: C.brass, k: 2, width: 1.6 });
    scene.add(post);
    const curtainMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uCol: { value: W.hcol(C.amber, 0.5) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uCol; varying vec2 vUv; void main(){ float x = abs(vUv.x - 0.5) * 2.0; float a = exp(-x * x * 5.0) * smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y)); gl_FragColor = vec4(uCol * a, 1.0); }',
    });
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 9), curtainMat); curtain.position.set(GX, 3 + 4.5, 1.7); scene.add(curtain);
    const gateF = W.flare({ color: C.amber, k: 0, size: 3.2 }); gateF.position.set(GX, 5, 1.8); scene.add(gateF);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 10), W.edgeStd({ color: 0x0d0c0b, metal: 0.6, rough: 0.4, edge: C.brass, edgeK: W.kl(1.4) }));
    sill.position.set(GX, 3.09, 0); scene.add(sill);
    // the master's jammed wall (10 rows on lane z 0, 8 rows behind on z -2.2), now a river: every row streams +x at agent speed,
    // rows sheared in phase so the block reads as flow, not as a sliding wall
    const LANES = [{ z: 0, rows: 10, ph: 0 }, { z: -2.2, rows: 8, ph: 1.6 }];
    const SP = 3.4, V = 24, X0 = -26, X1 = 12, per = Math.ceil((X1 - X0) / SP);
    const total = LANES.reduce((a2, L) => a2 + L.rows * per, 0);
    const I = W.cards({ count: total }); scene.add(I.mesh);
    const r = rand(831); const jit = Array.from({ length: total }, () => [(r() - 0.5) * 0.06, r() * SP]);
    // the master's red alarm pinpoint, now a green check lamp
    const lamp = W.orbs({ count: 1, r: 0.2, seg: 12 }); scene.add(lamp.mesh);
    const lampF = W.flare({ color: C.green, k: 0, size: 2.2 }); lampF.position.set(-6.2, 2.4, 5.25); scene.add(lampF);
    // out-of-focus warm motes near the lens (depth + parallax against the track)
    const motes = W.swarmHaze({ count: 160, spread: [40, 14, 50], center: [-6, 3, 55], color: C.amber, size: 0.5, k: 0.5, seed: 833 }); scene.add(motes.points);
    const g = W.grade('III', { bloom: { strength: 1.05, radius: 0.42, threshold: 0.8 }, ca: 0.0006 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.T(ctx, lt);
        let n = 0, cross = 0;
        const iceBody = W.lin(C.ice, 0.02);
        LANES.forEach((L, li) => {
          for (let row = 0; row < L.rows; row++) for (let q = 0; q < per; q++) {
            const j = jit[n];
            const x = X0 + ((((q * SP + L.ph + j[1] * 0.35 + row * 1.13 + V * t) % (X1 - X0)) + (X1 - X0)) % (X1 - X0));
            const d = (x - GX) / V;                                   // s since this card crossed the gate (<0 = not yet)
            const fl = d >= 0 ? Math.exp(-d / 0.05) : 0;
            if (d >= 0 && d < 0.1) cross += Math.exp(-d / 0.05) * (li ? 0.3 : 0.6) / 6;
            const amber = d >= 0;
            const fade = clamp((x - X0) / 2) * clamp((X1 - x) / 2);
            I.set(n, { p: [x, 3.45 + row * 0.52, L.z], r: [0, j[0], 0], s: [Math.max(0.02, fade), 1, 1],
              edge: amber ? W.CARD.amberEdge(3.6 + 5 * fl) : W.CARD.edge(2.0), body: amber ? W.CARD.amberBody(2.4 + 6 * fl) : iceBody });
            n++;
          }
        });
        I.commit();
        const cr = Math.min(1, cross);
        post.userData.set(1.6 + 1.2 * cr);
        curtainMat.uniforms.uCol.value.set(C.amber).multiplyScalar(0.26 + 0.18 * cr);
        gateF.userData.set(0.5 + 1.0 * cr, C.amber);
        lamp.set(0, { p: [-6.2, 2.4, 5.12], c: W.lin(C.green), k: 6 }); lamp.commit(); lampF.userData.set(1.6, C.green);
        H.banks.update(lt, { on: 1, t, beam: 0.8 });
        H.line.update(lt, { lit: 1, strips: 1, stripK: 3, codeK: 8 });
        H.foreman.update(lt, { lit: 0, rimColor: C.amber, rimK: 0.3 });
        H.extra.length = 0;
        H.extra.push({ p: [GX, 5, 1.5], c: C.amber, k: 5 + 2 * cr, pool: 5, poolK: 0.9, refl: 2.0, size: 1.5 });
        H.extra.push({ p: [1.4, 5, 0], c: C.amber, k: 4, pool: 9, poolK: 0.7, refl: 1.6, size: 4 });
        H.extra.push({ p: [-18, 5, 0], c: C.ice, k: 2.5, pool: 9, poolK: 0.6, refl: 1.4, size: 4 });
        // spill on the floor in front of the line: cold where the work comes from, warm where it leaves
        H.extra.push({ p: [-17, 3, 13], c: C.ice, k: 1.6, pool: 12, poolK: 0.9, refl: 0, size: 2 });
        H.extra.push({ p: [0, 3, 13], c: C.amber, k: 2.0, pool: 14, poolK: 0.9, refl: 0, size: 2 });
        H.extra.push({ p: [GX, 3, 9], c: C.amber, k: 2 + 2 * cr, pool: 6, poolK: 1.0, refl: 0, size: 1 });
        H.extra.push({ p: [-6.2, 2.4, 5.4], c: C.green, k: 2, pool: 2.5, poolK: 1, refl: 1.2, size: 0.3 });
        H.update(lt, { lit: 1 });
        camFX(camera, t, W.camReviewSide(camera, lt, { dur: ctx.T, dir: +1, t }));
      },
    };
  },
});
