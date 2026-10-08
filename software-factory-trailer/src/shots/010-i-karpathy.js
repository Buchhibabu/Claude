// #10 i-karpathy — 85mm macro on the CODE screen. The human voice types out (1 char / frame) ON the screen plane: the 2D mono line
// is locked onto the screen with a CSS homography so it rides the push, drift and handheld; the 3D clay cursor sits in the next cell,
// spills clay light on the glass, then after the full stop it flickers and dies to 30%, blinking on the tick.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import { W, THREE, screenPanel, pinToPlane, WHISPER, MONO } from './lib/b2-act1a.js';

const TEXT = "they just don't work.";
const N = TEXT.length;                 // 21 chars, typed 1 per frame from 0.1 -> done at 0.8
const EM = 0.3, CELL = EM * 0.6;       // world units per em / per mono cell
const CELLS = N + 1;                   // text + cursor cell
const XS = -19.6 - (CELLS * CELL) / 2, YL = 2.2, ZS = 5.205;
const FPX = 68;                        // natural font size (px) ~ on-screen size, so the homography stays near 1:1
let plane = null;

const typed = (lt) => Math.round(N * clamp((lt - 0.1) / 0.7));
function cursorState(lt, t) {
  if (lt < 0.8) return { on: 1, k: 10 };
  if (lt < 1.25) {                     // after the full stop: flicker, dying
    const f = Math.floor((lt - 0.8) * 30), pat = [1, 0.2, 1, 1, 0, 0.5, 0, 0.9, 0.1, 0, 0.6, 0, 0, 0.35];
    return { on: (pat[f] ?? 0.3) > 0.05 ? 1 : 0, k: lerp(10, 3, clamp((lt - 0.8) / 0.45)) * Math.max(0.3, pat[f] ?? 0.3) };
  }
  return { on: W.blink(t), k: 3 };
}

shot({
  id: 'i-karpathy', dur: beats(4), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 4, energy: 0.22, add: ['drone', 'ticks'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'tick', { gain: -8 });
    ctx.sfx(0.1, 'chirps', { gain: -16 });
    ctx.sfx(0.8, 'bell', { gain: -14 });
    const { scene, camera } = W.stage({ act: 'I', fog: 0.012 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false } });
    const scr = screenPanel({ w: 6, h: 3.4, rows: 10, seed: 12 });
    scr.position.set(-19.6, 2.5, 5.2); scene.add(scr);
    const C = W.cursorBlock({ screen: false, scale: EM, pos: [XS, YL, 5.3] }); scene.add(C.group);
    // bezel: thin steel frame around the glass so the plane reads as a physical screen
    const bez = W.glowSegs(W.boxEdgePairs([-19.6, 2.5, 5.18], [6.12, 3.52, 0.06]), { color: W.C.steel, k: 0.8, width: 1.2 }); scene.add(bez);
    const back = new THREE.Mesh(new THREE.BoxGeometry(6.3, 3.7, 0.12), new THREE.MeshStandardMaterial({ color: 0x0c0d10, metalness: 0.6, roughness: 0.35 }));
    back.position.set(-19.6, 2.5, 5.12); scene.add(back);
    const lastDraw = { k: -1, n: -1 };
    return {
      scene, camera, ...W.grade('I', { vignette: 0.55 }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const n = typed(lt), cs = cursorState(lt, t);
        const cx = XS + (n + 0.5) * CELL;
        C.cursor.position.set(cx, YL, 5.3); C.flare.position.set(cx, YL, 5.45);
        C.update(lt, { on: cs.on, k: cs.k, flare: cs.on * cs.k / 10 * 0.5 });
        const spill = cs.on * cs.k / 10;
        if (Math.abs(spill - lastDraw.k) > 0.01 || n !== lastDraw.n) {
          scr.userData.draw({ lines: 1, alpha: lerp(0.4, 0.3, clamp((lt - 0.8) / 0.4)), blank: [(4.2 - YL - 0.28) / 3.4, 1], spill: [(cx + 22.6) / 6, (4.2 - YL) / 3.4, spill] });
          lastDraw.k = spill; lastDraw.n = n;
        }
        H.extra.length = 0; H.extra.push({ p: [cx, YL, 5.4], c: W.C.clay, k: cs.k * cs.on, pool: 1.2, poolK: 1, refl: 0.6, size: 0.2 });
        H.update(lt);
        // 85mm macro: 18 deg off-axis from the right, 6% push + lateral drift 2%/s, handheld 0.3
        const d = 21 * (1 - 0.06 * ease.inOut(clamp(lt / ctx.T)));
        const a = THREE.MathUtils.degToRad(18 - 1.2 * lt);
        const tg = [-19.6 + 0.17 * lt, YL - 0.08, 5.2];   // lateral drift ~2% of frame width per second
        W.camLook(camera, [tg[0] + Math.sin(a) * d, tg[1] + 0.55, tg[2] + Math.cos(a) * d], tg, W.FOV[85]);
        W.handheld(camera, t, 0.3, 4);
        camFX(camera, t, W.FOV[85]);
        if (plane) { camera.updateMatrixWorld(true); pinToPlane(plane, camera, CELLS * 0.6 * FPX, 1.25 * FPX, [XS, YL + EM * 0.625, ZS], [CELLS * CELL, 0, 0], [0, -EM * 1.25, 0]); }
      },
    };
  },
  ui(root, tl, K, ctx) {
    plane = K.el('div', { style: { position: 'absolute', left: '0px', top: '0px', width: CELLS * 0.6 * FPX + 'px', height: 1.25 * FPX + 'px', transformOrigin: '0 0', willChange: 'transform' } }, root);
    const line = K.el('div', { text: TEXT, style: { ...MONO, fontSize: FPX + 'px', lineHeight: 1.25 * FPX + 'px', whiteSpace: 'pre', textShadow: '0 0 14px rgba(207,227,242,0.35)' } }, plane);
    K.typewriter(tl, line, 0.1, 0.7);
    const src = K.text(root, { y: 600, cls: '', html: 'KARPATHY, OCT 2025', style: WHISPER });
    K.decode(tl, src, 0.5, { d: 0.5 });
  },
});
