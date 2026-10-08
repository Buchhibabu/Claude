// 32 · m-sixteen — top-down 135mm (camLineTop): the 7-station line spans the frame, dark. The CODE segment lights IN PLACE:
// its clay strip draws from its own left edge (x -30.8) to its right edge (x -8.4) over 0.4 s from 0.1, a white-hot head leading —
// exactly 16% of the line's length, third station from the left — while the other six (84%) stay dark. An ivory hairline rule
// under the line marks only its two ends. CODE: 16% OF DEV TIME. masks up above; ATLASSIAN decodes under it.
import { shot, beats, camFX } from '../engine.js';
import { W, THREE, T, gradeMID, codeBox, scrim, ease, clamp, lerp } from './lib/b3.js';

const S = W.STATIONS[W.ST.CODE];

shot({
  id: 'm-sixteen', dur: beats(5), act: 'MID',
  music: { section: 'turn', chord: 'Dm', div: 4, energy: 0.12, add: ['drone', 'ticks'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0.5, 'B');
    ctx.sfx(0.5, 'boom', { gain: -6 });
    ctx.sfx(0.5, 'bell', { gain: -10 });
    ctx.sfx(1.5, 'riser', { dur: 1, gain: -6 });
    const { scene, camera } = W.stage({ act: 'MID' });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, pillars: false } });
    const CB = codeBox(); scene.add(CB.group);
    // the drawing head: white-hot leading edge riding the strip
    const head = W.flare({ color: W.C.ivory, k: 0, size: 9 }); scene.add(head);
    const headBar = W.glowSegs([[[0, 3.3, -5], [0, 3.3, 5]]], { color: W.C.ivory, k: 0, width: 3 }); scene.add(headBar);
    // the rule: an ivory hairline under the whole line (z 8.5), end ticks only
    const RZ = 8.6;
    const rule = W.glowSegs([[[W.LINE.x0, 0.05, RZ], [W.LINE.x1, 0.05, RZ]]], { color: W.C.ivory, k: 0, width: 1.1 });
    const ends = W.glowSegs([[[W.LINE.x0, 0.05, RZ - 2.4], [W.LINE.x0, 0.05, RZ + 2.4]], [[W.LINE.x1, 0.05, RZ - 2.4], [W.LINE.x1, 0.05, RZ + 2.4]]], { color: W.C.ivory, k: 0, width: 1.6 });
    scene.add(rule, ends);
    const boxL = new THREE.PointLight(W.C.clay, 0, 60, 1.2); boxL.position.set(S.cx, 9, 0); scene.add(boxL);
    const R = {
      scene, camera, ...gradeMID({ bloom: { strength: 0.9, radius: 0.45, threshold: 0.85 } }),
      update(lt) {
        const t = T(ctx, lt);
        scene.fog.density = W.fogKeep(545, 0.85);
        const d = clamp((lt - 0.1) / 0.4);
        const dr = ease.inOut(d);
        const dh = lt - 0.5;                                  // since the hit
        const flare = dh >= 0 ? Math.exp(-dh / 0.25) : 0;
        // dark line; only CODE's strip (clay) draws in place
        H.line.update(lt, { lit: 0, dim: 0.3, strips: [0, 0, 1, 0, 0, 0, 0], draw: [0, 0, dr, 0, 0, 0, 0], codeK: 4.5 + 3 * flare, conveyorK: 0.4 });
        // the box keeps a faint ember from the pull-back, then glows when the strip completes
        const swell = clamp((lt - 1.5) / 1.0);                 // the box breathes up under the riser
        CB.update({ edge: 0.5 + (d >= 1 ? 2.0 + 2 * flare + 0.8 * swell : 1.5 * dr), body: 0.12 + (d >= 1 ? 0.3 + 0.5 * flare + 0.15 * swell : 0.25 * dr) });
        boxL.intensity = 20 + 120 * dr + 250 * flare;
        // head
        const hx = S.x0 + 0.6 + (S.w - 1.2) * dr;
        const hv = d > 0 && d < 1 ? 1 : 0;
        head.position.set(hx, 3.4, 0); head.userData.set(hv * 10);
        headBar.position.x = hx; headBar.userData.set(hv * 6); headBar.visible = hv > 0;
        // the rule fades up with the strip, holds quietly
        const ru = clamp((lt - 0.2) / 0.4);
        rule.userData.set(0.75 * ru); ends.userData.set(2.2 * ru);
        H.update(lt);
        // camLineTop raised 545 -> 572 so the line's two ends (and the rule's end ticks) stay inside frame through the 2% descent
        camFX(camera, t, W.camLineTop(camera, lt, { dur: ctx.T, h: 572 }));
      },
    };
    return R;
  },
  ui(root, tl, K, ctx) {
    scrim(K, root, { x: 960, y: 330, w: 1500, h: 300, a: 0.5 });
    const h = K.text(root, { x: 960, y: 300, w: 1800, cls: 'cond', html: 'CODE: <span style="color:#D97757">16%</span> OF DEV TIME.', style: { fontSize: '140px', color: '#FAF9F5', whiteSpace: 'nowrap' } });
    K.maskUp(tl, h, 0.5, { d: 0.45 });
    const k = K.text(root, { x: 960, y: 394, w: 900, cls: 'kicker', html: 'ATLASSIAN', style: { fontSize: '24px', color: '#CFE3F2' } });
    K.decode(tl, k, 0.7, { d: 0.45, seed: 32 });
  },
});
