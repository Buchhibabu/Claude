// 26 · i-capability — M1 at its first peak. Aerial high (-56 deg, 35mm) over the 1,000-orb code tower: the brass ledger row SLAMS
// down into place in front of it on the downbeat — cell 7 stamps clay, a dust burst and a shock ring blow off the cell, a hot
// wavefront races the seams to both ends, the frame lifts +0.4 stop. CAPABILITY → BUDGET. slams in under it (arrow = clay hairline).
import { shot, beats, camFX } from '../engine.js';
import { W, THREE, T, gradeI, motes, ledgerExtras, towerHalo, stopLift, scrim, hidePillars, ease, clamp, lerp, rand } from './lib/b3.js';

shot({
  id: 'i-capability', dur: beats(4), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 8, energy: 0.75, add: ['strings'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'A');
    ctx.sfx(0, 'impact', { gain: 0 });
    ctx.sfx(0, 'sub_drop', { gain: -4 });
    ctx.sfx(0.05, 'bell', { gain: -12 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, ledger: true, banks: false } });
    H.foreman.group.visible = false;                         // behind the camera's top edge; skip the cost
    hidePillars(H, [[-15, 30], [15, 30]]);                   // the two between the lens and the ledger would slab across frame
    const LX = ledgerExtras(H.ledger); scene.add(LX.group);
    const halo = towerHalo(scene);
    const [CX, CY, CZ] = H.ledger.cellPos(6);
    // shock ring off cell 7 + hot flare
    const ring = W.G.ring({ r: 1, tube: 0.035, color: W.C.ivory, k: 0 }); ring.position.set(CX, CY, CZ + 1.6); scene.add(ring);
    const ring2 = W.G.ring({ r: 1, tube: 0.02, color: W.C.clay, k: 0 }); ring2.position.set(CX, CY, CZ + 1.6); scene.add(ring2);
    const hot = W.flare({ color: W.C.clay, k: 0, size: 26 }); hot.position.set(CX, CY + 0.8, CZ + 1.6); scene.add(hot);
    const cellL = new THREE.PointLight(W.C.clay, 0, 40, 1.4); cellL.position.set(CX, CY + 2, CZ + 2); scene.add(cellL);
    // falling brass grit (the dust burst's heavy part) + air motes lit by the tower
    const grit = W.G.particles({ count: 700, spread: [0, 0, 0], color: W.C.brassHi, size: 0.14, seed: 2601 });
    grit.points.frustumCulled = false; scene.add(grit.points);
    const gdir = new Float32Array(700 * 3);
    { const rr = rand(77);
      for (let i = 0; i < 700; i++) { const a = rr() * Math.PI * 2, sp = 3 + rr() * 9; gdir[i * 3] = Math.cos(a) * sp * (0.5 + rr()); gdir[i * 3 + 1] = 2 + rr() * 9; gdir[i * 3 + 2] = Math.sin(a) * sp * 0.6; } }
    const M = motes({ count: 800, box: [-48, 8, 0.5, 44, -16, 30], color: W.C.amber, k: 1.4, size: 0.09, seed: 262 });
    scene.add(M.points);
    const R = {
      scene, camera, ...gradeI({ bloom: { strength: 0.9, radius: 0.4, threshold: 0.82 } }),
      update(lt) {
        const t = T(ctx, lt);
        // landing: the bar drops the last 3u in 2 frames, then rings down
        const dl = lt - 2 / 30;
        const yOff = dl < 0 ? lerp(3, 0, ease.in(clamp(lt / (2 / 30)))) : -0.55 * Math.exp(-dl * 7) * Math.cos(dl * 26);
        H.ledger.group.position.y = yOff; LX.group.position.y = yOff;
        const ds = Math.max(0, dl);
        const fill = dl >= 0 ? W.ignite(dl + 0.01) : 0;
        H.ledger.update(lt, { fill, seam: dl >= 0 ? lerp(10, 4.5, ease.out(clamp(ds / 0.5))) : 3, burst: dl >= 0 ? ds : -1 });
        LX.update(lt, { fill, front: dl >= 0 ? ds : -1, speed: 80, k: 18, flare: dl >= 0 ? 0.5 + 1.8 * Math.exp(-ds / 0.12) : 0 });
        // shock rings
        const rs = 1 + 18 * ease.out(clamp(ds / 0.3)), rk = dl >= 0 ? Math.pow(1 - clamp(ds / 0.3), 1.5) : 0;
        ring.scale.setScalar(rs); ring.material.color.set(W.C.ivory).multiplyScalar(W.ko(9) * rk); ring.visible = rk > 0.01;
        const rs2 = 1 + 7 * ease.out(clamp(ds / 0.25)), rk2 = dl >= 0 ? Math.pow(1 - clamp(ds / 0.25), 1.2) : 0;
        ring2.scale.setScalar(rs2); ring2.material.color.set(W.C.clay).multiplyScalar(W.ko(10) * rk2); ring2.visible = rk2 > 0.01;
        ring.lookAt(camera.position); ring2.lookAt(camera.position);
        hot.userData.set(dl >= 0 ? 2 + 14 * Math.exp(-ds / 0.1) : 0);
        hot.position.y = CY + 0.8 + yOff;
        cellL.intensity = dl >= 0 ? 700 * Math.exp(-ds / 0.08) : 0;
        // grit
        for (let i = 0; i < 700; i++) {
          const tt = Math.max(0, ds - (i % 7) * 0.01);
          grit.positions[i * 3] = CX + gdir[i * 3] * tt;
          grit.positions[i * 3 + 1] = CY + yOff + gdir[i * 3 + 1] * tt - 14 * tt * tt;
          grit.positions[i * 3 + 2] = CZ + gdir[i * 3 + 2] * tt;
        }
        grit.geometry.attributes.position.needsUpdate = true;
        grit.points.visible = dl >= 0;
        grit.material.color.set(W.C.brassHi).multiplyScalar(W.ko(5) * Math.max(0, 1 - ds / 1.9));
        // the tower blazes; its 8th-note pulse rides the strings
        const kick = dl >= 0 ? Math.exp(-ds / 0.2) : 0;
        H.tower.update(lt, { count: 1000, k: 12 + 6 * kick, crest: 1, t, pulse: 0.22 });
        halo.update({ k: 0.28 + 0.25 * kick, h: 30, core: 1 + kick });
        M.update(t, { k: 1.3, drift: [0.15, 0.6, 0.1] });
        H.extra.length = 0; H.extra.push({ p: [CX, CY, CZ], c: W.C.clay, k: 3 + 10 * kick, pool: 10, poolK: 0.5, refl: 0.4, size: 3 });
        H.update(lt, { sky: 1.0 });
        R.exposure = 0.9 * stopLift(lt, 0.4, 0.6);
        // aerial high, -56 deg, slow 5% descent, a hair of lateral drift so the lattice parallaxes against the floor
        const u = ease.inOut(clamp(lt / ctx.T));
        const pos = [-19.6 + lerp(-1.2, 1.2, u), lerp(70, 66.5, u), lerp(40, 38.6, u)];
        camFX(camera, t, W.camLook(camera, pos, [-19.6, 10, 0], W.FOV[35], { roll: lerp(-1.5, 0.5, u) }));
      },
    };
    return R;
  },
  ui(root, tl, K, ctx) {
    scrim(K, root, { x: 960, y: 820, w: 1800, h: 300, a: 0.6 });
    const arrow = `<span style="position:relative;display:inline-block;width:0.72em;color:transparent;margin:0 0.1em">→` +
      `<svg viewBox="0 0 100 40" preserveAspectRatio="none" style="position:absolute;left:0;top:50%;width:100%;height:0.42em;transform:translateY(-62%);overflow:visible">` +
      `<path class="arw" d="M2 20 H96 M78 4 L97 20 L78 36" pathLength="1" fill="none" stroke="#D97757" stroke-width="4.5" stroke-linecap="square" vector-effect="non-scaling-stroke" ` +
      `style="stroke-dasharray:1;stroke-dashoffset:1;filter:drop-shadow(0 0 6px rgba(217,119,87,0.9))"/></svg></span>`;
    const h = K.text(root, { x: 960, y: 820, w: 1900, cls: 'cond', html: `CAPABILITY${arrow}BUDGET.`, style: { color: '#FAF9F5', fontSize: '182px', whiteSpace: 'nowrap', textShadow: '0 0 40px rgba(0,0,0,0.6)' } });
    K.slam(tl, h, 0.0, { from: 1.22, d: 0.3, blur: 16 });
    const p = h.querySelector('.arw');
    tl.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 6 / 30, ease: 'power2.out', immediateRender: false }, 0.06);
    K.push(tl, h, 0.3, 1.6, { from: 1, to: 1.03 });
    K.cutOut(tl, h, 1.9);
  },
});
