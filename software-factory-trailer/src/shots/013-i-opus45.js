// #13 i-opus45 — MOOD CHANGE #1. 85mm macro on the same CODE screen: the cursor IGNITES (k3 -> 13 -> 10 in 2 f, local bloom)
// and breaks the tick into double time (8ths). HDR code-glyph bars stream out of it L->R at agent speed, lane after lane, while
// the screen's code block reveals behind the headline and six test lamps under it tick green, one per 8th.
import { shot, beats, camFX, clamp, lerp, ease, rand } from '../engine.js';
import { W, THREE, G, screenPanel, scrim, WHISPER } from './lib/b2-act1a.js';

const EM = 0.3, CELL = EM * 0.6;
const CUR = [-21.0, 3.3, 5.3];                         // cursor cell centre (its top edge = the slab's light line in i-slab-rise)
const NB = 260;
const TOK = [W.C.ice, W.C.ice, W.C.card, 0x8faac0, W.C.clay];

shot({
  id: 'i-opus45', dur: beats(3), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 8, energy: 0.5, add: ['drone', 'ticks', 'pulse', 'ostinato', 'kick'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0.1, 'chirps', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'I', fog: 0.012 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false } });
    const scr = screenPanel({ w: 6, h: 3.4, rows: 10, seed: 12 });
    scr.position.set(-19.6, 2.5, 5.2); scene.add(scr);
    const back = new THREE.Mesh(new THREE.BoxGeometry(6.3, 3.7, 0.12), new THREE.MeshStandardMaterial({ color: 0x0c0d10, metalness: 0.6, roughness: 0.35 }));
    back.position.set(-19.6, 2.5, 5.12); scene.add(back);
    const C = W.cursorBlock({ screen: false, scale: EM, pos: CUR }); scene.add(C.group);
    // streaming glyph bars (HDR instanced quads on the glass)
    const B = G.instanced({ count: NB, geometry: new THREE.PlaneGeometry(1, 1), basic: true, color: 0xffffff });
    scene.add(B.mesh);
    const r = rand(45);
    const bars = Array.from({ length: NB }, (_, i) => { const u = r(); const lane = Math.round((r() - 0.5) * 8) / 8; return { dy: lane * 0.36 * (0.4 + 0.6 * Math.abs(lane) * 2), t0: 0.03 + (i / NB) * 1.3 + r() * 0.03, w: 0.06 + Math.pow(r(), 2) * 0.7, h: 0.014 + r() * 0.022, v: 7 + r() * 9, c: TOK[Math.floor(r() * TOK.length)], k: 0.5 + u * 0.9 }; });
    // six test lamps under the headline, one per 8th
    const L = W.orbs({ count: 6, r: 0.055, seg: 16 }); scene.add(L.mesh);
    const sockets = W.glowSegs(Array.from({ length: 6 }, (_, i) => { const x = -20.42 + i * 0.21; return [[x - 0.08, 2.08, 5.24], [x + 0.08, 2.08, 5.24]]; }), { color: W.C.steel, k: 0.6, width: 1 });
    scene.add(sockets);
    let lastLines = -1;
    return {
      scene, camera, ...W.grade('I', { vignette: 0.55 }),
      update(lt) {
        const t = ctx.shot.start + lt;
        // ignition k3 -> 13 (2 f) -> settle 10; then 8th-note blink
        const ig = lt < 2 / 30 ? lerp(3, 13, lt / (2 / 30)) : lt < 0.3 ? lerp(13, 10, ease.out((lt - 2 / 30) / 0.23)) : 10;
        const on = lt < 0.25 ? 1 : W.blink(t, { div: 2 });
        C.update(lt, { on, k: ig, flare: on * (lt < 0.3 ? lerp(1.4, 0.45, clamp(lt / 0.3)) : 0.45) });
        // code block behind the headline reveals 0 -> 1 over 1.2 s (rows drawn on the glass)
        const lines = clamp(lt / 1.2);
        if (Math.abs(lines - lastLines) > 0.02) { scr.userData.draw({ lines, alpha: 0.32, glyphs: 1, blank: [(4.2 - CUR[1] - 0.3) / 3.4, (4.2 - CUR[1] + 0.3) / 3.4], spill: [(CUR[0] + 22.6) / 6, (4.2 - CUR[1]) / 3.4, ig / 10 * on] }); lastLines = lines; }
        // bars stream out of the cursor to the right, accelerating
        for (let i = 0; i < NB; i++) {
          const b = bars[i]; const age = lt - b.t0;
          if (age < 0) { B.hide(i); continue; }
          const x0 = CUR[0] + CELL * 0.55, travel = b.v * age + 8 * age * age;
          const grow = clamp(age / 0.06);
          const x = x0 + travel * grow + b.w * grow / 2, y = CUR[1] + b.dy * clamp(age / 0.12);
          if (x - b.w / 2 > -16.5) { B.hide(i); continue; }
          const fade = 1 - clamp((x - (-19.2)) / 2.7);
          B.set(i, { p: [x, y, 5.26], s: [b.w * grow, b.h, 1], c: b.c, k: b.k * (0.35 + 0.65 * fade) * (b.c === W.C.clay ? 1.6 : 1.0) });
        }
        B.commit();
        for (let i = 0; i < 6; i++) { const lit = lt >= i * 0.25; const dt = lt - i * 0.25; L.set(i, { p: [-20.42 + i * 0.21, 2.17, 5.26], c: lit ? W.lin(W.C.green) : W.lin(W.C.steel), k: lit ? 4 * (1 + 1.2 * Math.exp(-dt * 10)) : 0.6 }); }
        L.commit();
        H.extra.length = 0; H.extra.push({ p: CUR, c: W.C.clay, k: ig * on, pool: 1.2, poolK: 1, refl: 0.6, size: 0.2 });
        H.update(lt);
        // 85mm, 4% push, slight drift; the cursor sits upper-left of centre, the headline below it
        const d = 12.2 * (1 - 0.04 * ease.inOut(clamp(lt / ctx.T)));
        const tg = [-19.96 + 0.12 * lt, 2.83, 5.2];
        W.camLook(camera, [tg[0] + 1.6, tg[1] + 0.35, tg[2] + d], tg, W.FOV[85]);
        camFX(camera, t, W.FOV[85]);
      },
    };
  },
  ui(root, tl, K, ctx) {
    scrim(K, root, { x: 960, y: 540, w: 1700, h: 360, a: 0.6 });
    const h = K.text(root, { y: 500, cls: 'slam', html: '<span class="hot">OPUS 4.5</span> SHIPS.' });
    K.slam(tl, h, 0.0, { from: 1.12, d: 5 / 30, blur: 14 });
    const d = K.text(root, { y: 600, cls: '', html: 'NOV 2025', style: WHISPER });
    K.decode(tl, d, 0.15, { d: 0.4 });
  },
});
