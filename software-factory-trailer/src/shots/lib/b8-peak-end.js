// Batch b8 "peak-end" helpers (shots 104-123): peak montage, recalls, false stop, title forge, button, end credit.
// Wraps src/shots/lib/world.js (never edits it). Beat-locked visuals use LOCAL time: every peak shot starts on the
// 150 BPM grid (origin 76.5 s) and every button shot starts on the returned 120 BPM tick, so local phase == global phase.
import { clamp, lerp, ease } from '../../engine.js';
import * as W from './world.js';
const { THREE } = W;

export const ADD_PEAK = ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'];

/** quantize to the 30 fps frame grid (step-printing / holds) */
export const fr = (lt, step = 1) => Math.floor(lt * 30 / step) * step / 30;

/** warm Act III grade + per-shot overrides (bloom merges). */
export const peakGrade = (over = {}) => W.grade('III', over);

/** A clay shockwave ring (horizontal torus) that expands and fades: update(dt) with dt = seconds since ignition. */
export function shockRing({ color = W.C.clay, r = 1, tube = 0.06, k = 6, grow = 10, life = 0.35, axis = 'y' } = {}) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, tube, 8, 96), new THREE.MeshBasicMaterial({ color: W.hcol(color, W.ko(k)), toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  if (axis === 'y') m.rotation.x = Math.PI / 2;
  m.userData.update = (dt, kk = k) => {
    if (dt < 0 || dt > life) { m.visible = false; return; }
    m.visible = true;
    const u = dt / life;
    const s = r + grow * ease.expoOut(u);
    m.scale.set(s, s, 1);
    m.material.color.set(color).multiplyScalar(W.ko(kk) * Math.pow(1 - u, 1.6));
  };
  m.visible = false;
  return m;
}

/** Soft dark ellipse behind type (the -0.8 stop "background darkened under the card"). */
export function scrim(root, K, { x = 960, y = 540, w = 1500, h = 420, a = 0.55 } = {}) {
  return K.el('div', { style: { position: 'absolute', left: (x - w / 2) + 'px', top: (y - h / 2) + 'px', width: w + 'px', height: h + 'px', background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${a * 0.75}) 45%, rgba(0,0,0,0) 100%)`, pointerEvents: 'none' } }, root);
}

/** Kicker / whisper style (JetBrains Mono 500 caps 30px, +0.18em, ice at 80%). */
export const WHISPER = { fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: '30px', letterSpacing: '0.18em', color: 'rgba(207,227,242,0.8)', textTransform: 'uppercase' };

/**
 * Rich decode: scrambled glyphs resolve left -> right across ALL text nodes of el (keeps coloured spans, e.g. '5.5' in clay).
 * Deterministic (seeded table), seekable (GSAP onUpdate from a tweened value).
 */
export function decodeRich(tl, el, at, { d = 0.6, glyphs = '▮▯#%&@$*+=<>/\\|01', seed = 7 } = {}) {
  const nodes = [];
  const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 3) nodes.push(c); else if (c.nodeType === 1) walk(c); } };
  walk(el);
  const full = nodes.map((n) => n.textContent);
  const total = full.reduce((a, s) => a + s.length, 0);
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const table = Array.from({ length: 48 }, () => Array.from({ length: total }, () => glyphs[Math.floor(rnd() * glyphs.length)]));
  const o = { u: 0 };
  const paint = (u) => {
    const k = Math.floor(u * total * 1.0001), row = table[Math.min(47, Math.floor(u * 47))];
    let idx = 0;
    nodes.forEach((n, i) => {
      const str = full[i];
      let out = '';
      for (let j = 0; j < str.length; j++, idx++) out += idx < k || str[j] === ' ' || str[j] === ' ' ? str[j] : row[idx];
      n.textContent = out;
    });
  };
  gsap.set(el, { autoAlpha: 0 });
  tl.set(el, { autoAlpha: 1 }, at);
  tl.fromTo(o, { u: 0 }, { u: 1, duration: d, ease: 'none', immediateRender: false, onUpdate: () => paint(o.u) }, at);
  return el;
}

/** Odometer digit: a 1em window with a column of glyphs; roll(tl, at, d) slides from glyph 0 to glyph n-1. */
export function odometer(K, parent, glyphs = ['0', '1']) {
  const win = K.el('span', { style: { display: 'inline-block', overflow: 'hidden', height: '1.0em', lineHeight: '1.0em', verticalAlign: 'top', position: 'relative' } }, parent);
  const col = K.el('span', { style: { display: 'block' } }, win);
  glyphs.forEach((g) => K.el('span', { text: g, style: { display: 'block', height: '1.0em', lineHeight: '1.0em' } }, col));
  return {
    win, col,
    roll(tl, at, d = 0.2, toIndex = glyphs.length - 1) {
      tl.fromTo(col, { yPercent: 0 }, { yPercent: -100 * toIndex / glyphs.length, duration: d, ease: 'power3.inOut', immediateRender: false }, at);
    },
  };
}

/**
 * Peak tricolon (p-tri-1..3): the lit hall + foreman threads seen from straight above; one sub-lead ignites clay with a shockwave
 * and its thread snaps taut (draws core -> node in 2 frames with a flare spike); level 1..3 = brighter each time.
 */
export function triRig(ctx, { j, level = 1, others = [] } = {}) {
  const { scene, camera } = W.stage({ act: 'III', fog: 0.0035 });
  const H = W.hall(scene, { state: 'lit', parts: { threads: true, pillars: false } });
  camera.near = 20; camera.updateProjectionMatrix();
  const lead = H.threads.leadPos[j];
  const ring = shockRing({ r: 1.6, grow: 16, life: 0.4, k: 2.5 + 1.2 * level, tube: 0.02 }); ring.position.set(lead[0], lead[1], lead[2]); scene.add(ring);
  const ring2 = shockRing({ r: 2, grow: 26, life: 0.4, k: 1.5 + 0.6 * level, tube: 0.01 }); ring2.position.set(lead[0], 3.3, 0); scene.add(ring2);
  const fl = W.flare({ color: W.C.ember, k: 0, size: 26 }); fl.position.set(lead[0], lead[1] + 0.5, lead[2]); scene.add(fl);
  return {
    scene, camera, H, lead,
    pose(lt, t, { snapAt = 0, extraFlare = {} } = {}) {
      const dt = lt - snapAt;
      const reveal = W.SUBLEAD_X.map((_, i) => (i === j ? clamp(dt / 0.067) : 1));
      const leads = W.SUBLEAD_X.map((_, i) => (i === j ? (dt >= 0 ? 1 : 0.3) : others.includes(i) ? 0.75 : 0.3));
      const spike = dt >= 0 ? Math.exp(-dt * 7) : 0;
      const flare = W.SUBLEAD_X.map((_, i) => (i === j ? (0.6 + 0.5 * level) * (0.5 + 2.2 * spike) : others.includes(i) ? 0.3 + (extraFlare[i] || 0) : -0.55));
      H.threads.update(lt, { reveal, leads, flare, t, flow: 1, k: 2.2, pulses: 1 });
      ring.userData.update(dt); ring2.userData.update(dt - 0.03);
      fl.userData.set((2 + 1.2 * level) * (0.3 + 1.0 * spike), W.C.ember);
      H.banks.update(lt, { on: 1, t, housing: false, beam: 0.35, dust: 0.6 });
      H.line.update(lt, { lit: 1, strips: 0, conveyorK: 3 });
      H.foreman.update(lt, { lit: 6, hourRing: 18 });
      H.update(lt, { lit: 1 });
    },
  };
}

/** recall flurry exposure trims (p-recall-1..6), tuned from measured mean luma so all six sit at ~0.12 (+-8%). */
export const RECALL_EXP = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
