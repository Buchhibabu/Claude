// 47 ii-two-writers — MASTER D, the mechanism (mirror source for iii-one-writer). camWriterMacro 85mm on ONE card on the conveyor:
// two ice agents streak in from left and right at 0.15 and clamp onto the same card at once (two writers, one change), wrenching it
// up off the rollers and toward the lens between them; at 0.3 it cracks red down the middle (#FF453A k6 fracture), splits, sparks.
// The card is drawn at 0.55 scale so both ends sit inside the 85mm frame; the stations are hidden (they would fill the lens).
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
import { bokeh } from './lib/b5-act2b.js';
const { THREE, C } = W;

const CARD = [-9, 2.6, 0], SC = 0.55;
const CW = 3 * SC, CH = 0.5 * SC, CD = 2 * SC;

shot({
  id: 'ii-two-writers', dur: beats(1), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 16, energy: 0.76, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.glitch(0.3, 0.13);
    ctx.sfx(0.3, 'glitch', { gain: -4 });
    ctx.sfx(0.3, 'impact', { gain: -8 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.03 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, pillars: false, line: false } });
    // conveyor: dark bed, steel rails, ice rollers (the card rests on them at y 2.6 - CH/2)
    const yBed = CARD[1] - CH / 2;
    const bed = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 1.5), new THREE.MeshStandardMaterial({ color: 0x08090b, metalness: 0.6, roughness: 0.45 })); bed.position.set(-9, yBed - 0.17, 0); scene.add(bed);
    const rails = W.glowSegs([[[-15, yBed - 0.01, 0.7], [-3, yBed - 0.01, 0.7]], [[-15, yBed - 0.01, -0.7], [-3, yBed - 0.01, -0.7]]], { color: C.steel, k: 1.5, width: 1.5 }); scene.add(rails);
    const rp = []; for (let x = -14.5; x <= -3.5; x += 0.42) rp.push([[x, yBed - 0.012, -0.68], [x, yBed - 0.012, 0.68]]);
    const rollers = W.glowSegs(rp, { color: C.ice, k: 0.55, width: 1.0 }); scene.add(rollers);
    // the card: a pivot group (lift + tilt toward the lens) holding two halves + the fracture
    const piv = new THREE.Group(); piv.position.set(...CARD); scene.add(piv);
    const halves = W.boxes({ count: 2, size: [CW / 2, CH, CD], color: 0x17181c, metal: 0.25, rough: 0.5, edgeW: 1.4, crowd: 0.4 }); piv.add(halves.mesh);
    const rj = rand(4701), fr = [];
    for (let k = 0; k <= 10; k++) fr.push([(rj() - 0.5) * 0.07 * (k % 2 ? 1 : -1) + (k === 0 || k === 10 ? 0 : (rj() - 0.5) * 0.04), CH / 2 + 0.004, lerp(CD / 2, -CD / 2, k / 10)]);
    const crack = W.fat(fr, { color: C.red, k: 6, width: 2.6 }); piv.add(crack);
    const crack2 = W.fat([[0, CH / 2, CD / 2 + 0.004], [0.02, 0, CD / 2 + 0.004], [-0.015, -CH / 2, CD / 2 + 0.004]], { color: C.red, k: 6, width: 2.6 }); piv.add(crack2);
    const bleed = B.glowCard({ w: 0.5, h: CD * 1.3, color: C.red, k: 0, falloff: 3.2 }); bleed.rotation.x = -Math.PI / 2; bleed.position.set(0, CH / 2 + 0.01, 0); piv.add(bleed);
    // writers + their entry streaks
    const WR = W.orbs({ count: 2, r: 0.11, seg: 20 }); scene.add(WR.mesh);
    const WS = B.streaks(2, { color: C.ice, k: 2.0, width: 2.6 }); scene.add(WS.mesh);
    const wrFl = [0, 1].map(() => { const f = W.flare({ color: C.ice, k: 0, size: 0.9 }); scene.add(f); return f; });
    const SP = B.sparks({ count: 300, color: C.red, size: 0.03, k: 9 }); scene.add(SP.points);
    const redL = new THREE.PointLight(C.red, 0, 3.5, 1.6); scene.add(redL);
    const iceL = new THREE.PointLight(C.ice, 0, 3, 1.8); scene.add(iceL);
    // background: the swarm as small out-of-focus bokeh; red pins far behind
    const br = rand(4702), BK = [];
    for (let i = 0; i < 18; i++) { const red = i < 5; const s = bokeh({ color: red ? C.red : C.ice, k: red ? 0.55 : 0.2, size: 0.08 + br() * 0.16 }); s.position.set(-10.3 + br() * 2.6, 2.75 + br() * 0.6, -2.5 - br() * 3); s.userData.red = red; s.userData.ph = br(); scene.add(s); BK.push(s); }
    const v = new THREE.Vector3();

    return {
      scene, camera, ...W.grade('II', { vignette: 0.6, bloom: { strength: 0.9, radius: 0.42, threshold: 0.82 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const enter = clamp((lt - 0.15) / 0.06);                // streak in, clamp at 0.21
        const grab = clamp((lt - 0.21) / 0.09);                 // wrench up + toward the lens until the crack
        const split = lt >= 0.3 ? ease.expoOut(clamp((lt - 0.3) / 0.16)) : 0;
        const g = ease.out(grab);
        const shudder = lt >= 0.21 && lt < 0.3 ? Math.sin(lt * 160) * 0.01 : 0;
        piv.position.set(CARD[0] + shudder, CARD[1] + 0.12 * g + 0.03 * split, CARD[2] + 0.1 * g);
        piv.rotation.set(0.55 * g, 0, 0);
        piv.updateMatrixWorld();
        for (let k = 0; k < 2; k++) {
          const sg = k === 0 ? -1 : 1;
          const ek = lt >= 0.3 ? W.CARD.redEdge(lerp(4, 1.8, clamp((lt - 0.3) / 0.15))) : W.CARD.edge(1.5 + 0.8 * g);
          halves.set(k, { p: [sg * (CW / 4 + 0.002 + 0.16 * split), 0, 0], r: [0, sg * 0.12 * split, -sg * 0.16 * split], edge: ek, body: lt >= 0.3 ? W.lin(C.red, 0.02) : W.CARD.body(0.5) });
          // writer: rides the card's end
          if (lt < 0.15) { WR.hide(k); WS.hide(k); wrFl[k].userData.set(0); continue; }
          v.set(sg * (CW / 2 - 0.12 + 0.16 * split), CH / 2 + 0.1, 0.1).applyMatrix4(piv.matrixWorld);
          const fx = v.x + sg * 1.6 * (1 - ease.out(enter)) + sg * 0.25 * split;
          WR.set(k, { p: [fx, v.y, v.z], c: W.lin(C.ice), k: 4 + 2 * g });
          wrFl[k].position.set(fx, v.y, v.z + 0.05); wrFl[k].userData.set(0.8 + 0.8 * g * (1 - split), C.ice);
          if (enter < 1) WS.set(k, [fx, v.y, v.z], [fx + sg * 1.4 * (1 - enter) + sg * 0.1, v.y, v.z]); else WS.hide(k);
        }
        halves.commit(); WR.commit(); WS.commit();
        crack.visible = crack2.visible = lt >= 0.3;
        if (lt >= 0.3) { const rv = clamp((lt - 0.3) / 0.05); crack.userData.reveal(rv); crack2.userData.reveal(rv); const ck = 3.2 * (1 + 0.6 * Math.exp(-(lt - 0.3) / 0.06)); crack.userData.set(ck); crack2.userData.set(ck); }
        bleed.userData.set(lt >= 0.3 ? 0.7 * Math.exp(-(lt - 0.3) / 0.1) + 0.22 : 0, C.red);
        v.set(0, CH, 0.4).applyMatrix4(piv.matrixWorld);
        redL.position.copy(v); redL.intensity = lt >= 0.3 ? 6 * Math.exp(-(lt - 0.3) / 0.1) + 1 : 0;
        iceL.position.set(CARD[0], CARD[1] + 0.8, 1.2); iceL.intensity = 1.2 * g * (1 - split);
        v.set(0, CH / 2, 0).applyMatrix4(piv.matrixWorld);
        SP.update([{ t0: 0.3, p: [v.x, v.y, v.z], n: 160, speed: 4, life: 0.24, seed: 471, g: 5, dir: [0, 1.5, 2] }, { t0: 0.315, p: [v.x, v.y - 0.05, v.z + 0.1], n: 120, speed: 3, life: 0.2, seed: 472, g: 5, dir: [0, 0.5, 2.5] }], lt);
        BK.forEach((s) => { const on = s.userData.red ? W.blink(t, { div: 2, origin: s.userData.ph > 0.5 ? 0.25 : 0 }) : 1; s.userData.set((s.userData.red ? 0.55 : 0.2) * (0.2 + 0.8 * on), s.userData.red ? C.red : C.ice); });
        H.extra.length = 0;
        H.update(lt);
        const fov = W.camWriterMacro(camera);
        W.handheld(camera, t, 0.3, 47);
        camFX(camera, t, fov);
      },
    };
  },
});
