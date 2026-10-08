// 43 ii-add-agents — the reflex (V1, the human's voice). 85mm over the human's shoulder onto his handheld terminal: the black,
// ice-rimmed shoulder edge frames left, the REVIEW mass behind him has melted to out-of-focus bokeh (red pins blinking on the tick),
// and on the cold screen a steel cursor blinks on the tick and types the line, one character per frame. The 2D type is pinned onto the
// screen plane every frame (CSS homography), so it rides the handheld with the glass.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
import { pinToPlane } from './lib/b2-act1a.js';
import { bokeh } from './lib/b5-act2b.js';
const { THREE, C } = W;

const DEV = { w: 1.2, h: 0.7, p: [2.05, 1.22, 11.5], tilt: -0.42, yaw: 0.32 };
const PX = 1200;   // DOM px across the screen plane (1 px per mm)

shot({
  id: 'ii-add-agents', dur: beats(4), act: 'II',
  music: { section: 'act2', chord: 'C', div: 16, energy: 0.62, add: ['pulse', 'ostinato', 'kick', 'drone', 'heart'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0.1, 'chirps', { gain: -16 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.035 });
    camera.near = 0.05; camera.updateProjectionMatrix();
    const H = W.hall(scene, { state: 'dark', parts: { banks: false, foreman: false, pillars: false, line: false } });
    const human = W.humanAnchor({ act: 'II', pos: B.HUMAN_C, facing: Math.PI });
    scene.add(human.group);
    human.human.userData.armL.visible = false; human.human.userData.armR.visible = false;   // arms read as pills this close
    // the terminal: dark slab + glass (canvas) facing the human, tilted up toward his face
    const dev = new THREE.Group(); dev.position.set(...DEV.p); dev.rotation.set(DEV.tilt, DEV.yaw, 0, 'YXZ'); scene.add(dev);
    const body = new THREE.Mesh(new THREE.BoxGeometry(DEV.w + 0.07, DEV.h + 0.07, 0.04), new THREE.MeshStandardMaterial({ color: 0x0a0b0d, metalness: 0.7, roughness: 0.35 }));
    body.position.z = -0.025; dev.add(body);
    const rim = W.glowSegs(W.boxEdgePairs([0, 0, -0.005], [DEV.w + 0.07, DEV.h + 0.07, 0.04]), { color: C.steel, k: 1.0, width: 1.2 }); dev.add(rim);
    const rr = rand(4301);
    const rows = Array.from({ length: 5 }, () => { const s = []; let x = 0.06; const n = 1 + Math.floor(rr() * 4); for (let k = 0; k < n; k++) { const w = 0.03 + rr() * 0.12; s.push([x, w, rr()]); x += w + 0.018; } return s; });
    const glass = W.G.canvasPlane({ w: DEV.w, h: DEV.h, px: 1024, glow: true, draw: (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(8,12,17,1)'); gr.addColorStop(1, 'rgba(3,4,6,1)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(91,122,147,0.5)'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
      rows.forEach((segs, i) => { const y = h * (0.12 + i * 0.065); segs.forEach(([x, ww, c]) => { g.fillStyle = c < 0.7 ? 'rgba(143,175,200,0.28)' : 'rgba(91,122,147,0.4)'; g.fillRect(x * w, y, ww * w, h * 0.022); }); });
    } });
    glass.position.z = 0.001; dev.add(glass);
    
    const scrL = new THREE.PointLight(0xbcd4e8, 1.4, 3.5, 1.6); scrL.position.set(0, 0, 0.5); dev.add(scrL);
    // behind him: the tower as soft out-of-focus light (a cold wash) + bokeh pins and swarm glints
    const wash = B.glowCard({ w: 9, h: 3.4, color: 0x9ab8d0, k: 0.12, falloff: 1.8 }); wash.position.set(-0.6, 0.9, 6.5); wash.rotation.x = -0.35; scene.add(wash);
    const BK = [];
    const br = rand(4302);
    for (let i = 0; i < 30; i++) {
      const red = i < 11;
      const s = bokeh({ color: red ? C.red : C.ice, k: red ? 0.9 : 0.35, size: red ? 0.22 + br() * 0.22 : 0.2 + br() * 0.35 });
      s.position.set(-3.6 + br() * 6, 0.25 + br() * 1.6, 3.5 + br() * 5);
      s.userData.red = red; s.userData.ph = br(); scene.add(s); BK.push(s);
    }
    const lowL = new THREE.PointLight(C.ice, 6, 9, 1.5); lowL.position.set(1.0, 3.2, 10.2); scene.add(lowL);   // the top-light pool behind him, rimming the shoulder

    const corner = (u, v) => new THREE.Vector3((u - 0.5) * DEV.w, (0.5 - v) * DEV.h, 0.002).applyMatrix4(glass.matrixWorld);
    return {
      scene, camera, ...W.grade('II', { vignette: 0.62, bloom: { strength: 0.85, radius: 0.45, threshold: 0.82 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        human.update(lt, { rimK: 1.1 });
        BK.forEach((s) => { const on = s.userData.red ? W.blink(t, { div: 1, origin: s.userData.ph > 0.5 ? 0 : 0.25 }) : 1; s.userData.set((s.userData.red ? 0.8 : 0.26) * (0.1 + 0.9 * on), s.userData.red ? C.red : C.ice); });
        H.extra.length = 0;
        H.extra.push({ p: [B.HUMAN_C[0], 9, B.HUMAN_C[2] - 0.6], c: C.ice, k: 3, pool: 3.8, poolK: 1.6, refl: 1.0, size: 0.9 });
        H.update(lt, { sky: 1.5 });
        // over the shoulder: camera behind-right of the human, aimed at the glass, 3% push
        const D = new THREE.Vector3(...DEV.p), off = new THREE.Vector3(2.15, 0.9, 4.8);
        const u = 1 - 0.03 * ease.inOut(clamp(lt / ctx.T));
        const cp = D.clone().add(off.multiplyScalar(u));
        W.camLook(camera, cp.toArray(), DEV.p, W.FOV[85]);
        W.handheld(camera, t, 0.3, 43);
        camFX(camera, t, W.FOV[85]);
        // pin the type card onto the glass
        if (ctx.pinEl) {
          scene.updateMatrixWorld(); camera.updateMatrixWorld();
          const o = corner(0, 0), ax = corner(1, 0).sub(o), ay = corner(0, 1).sub(o);
          pinToPlane(ctx.pinEl, camera, PX, Math.round(PX * DEV.h / DEV.w), o.toArray(), ax.toArray(), ay.toArray());
        }
      },
    };
  },
  ui(root, tl, K, ctx) {
    const PH = Math.round(PX * DEV.h / DEV.w);
    const card = K.el('div', { style: { position: 'absolute', left: '0px', top: '0px', width: PX + 'px', height: PH + 'px', transformOrigin: '0 0' } }, root);
    ctx.pinEl = card;
    const line = K.el('div', { style: { position: 'absolute', left: '0px', top: PH * 0.54 + 'px', width: PX + 'px', textAlign: 'center', transform: 'translateY(-50%)', whiteSpace: 'pre', fontFamily: 'var(--mono)', fontWeight: 500, fontSize: '48px', letterSpacing: '0.01em', color: '#FAF9F5', textShadow: '0 0 14px rgba(207,227,242,0.35)' } }, card);
    const txt = K.el('span', { text: 'just add more agents.' }, line);
    const cur = K.el('span', { style: { display: 'inline-block', width: '0.6em', height: '1.05em', marginLeft: '0.08em', verticalAlign: '-0.18em', background: '#CFE3F2', boxShadow: '0 0 16px rgba(207,227,242,0.8)' } }, line);
    const full = txt.textContent;
    // 1 char per frame from local 0.1 (centring held on the full line so the text does not slide while it types)
    const ghost = K.el('span', { style: { visibility: 'hidden' } }, line);
    const o = { n: 0 };
    txt.textContent = ''; ghost.textContent = full;
    tl.to(o, { n: full.length, duration: full.length / 30, ease: 'none', immediateRender: false, onUpdate: () => { const k = Math.round(o.n); txt.textContent = full.slice(0, k); ghost.textContent = full.slice(k); } }, 0.1);
    line.insertBefore(cur, ghost);
    // the steel cursor: solid while typing, then blinks at human speed on the tick (beats of the global grid)
    const s0 = ctx.shot.start;
    const typedAt = 0.1 + full.length / 30;
    gsap.set(cur, { autoAlpha: 1 });
    for (let b = Math.ceil((s0 + typedAt) / 0.5) * 0.5; b < s0 + ctx.T; b += 0.5) {
      const l = b - s0;
      tl.set(cur, { autoAlpha: 1 }, l); tl.set(cur, { autoAlpha: 0 }, l + 0.25);
    }
    if (typedAt < ctx.T) tl.set(cur, { autoAlpha: 0 }, typedAt + 0.001);
  },
});
