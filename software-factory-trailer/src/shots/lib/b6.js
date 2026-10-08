// =====================================================================================================
// Batch b6-act3a helpers (shots 65-83: iii-bank-1 .. iii-review-mirror). Wraps / extends lib/world.js; never edits it.
//   cascade staging (cold -> warm one bank per 150-BPM beat), floor light pools, bank rig outlines, station traces,
//   factory card flow, the neutral GRAPH (etched brass housings), bokeh, sparks, and the 2D type slots
//   (refrainSlot, tricolon label, statSlam) + a -0.8 stop scrim under type.
// =====================================================================================================
import { clamp, lerp, ease, rand } from '../../engine.js';
import * as W from './world.js';
const { THREE, G, C } = W;

export const F = 1 / 30;                      // one frame
export const B150 = 0.4;                      // one beat at 150 BPM
export const T = (ctx, lt) => ctx.shot.start + lt;
const smooth = (u) => u * u * (3 - 2 * u);

// ----------------------------------------------------------------------------------------- staging
/** Act III stage whose lights / fog colour sit i/8 of the way from the cold Act II rig to the warm Act III rig. */
export function cascadeStage(i, { fog = 0.005, fov = 40 } = {}) {
  const u = clamp(i / 8);
  const fc = new THREE.Color(C.fog).lerp(new THREE.Color(C.fogWarm), u);
  const S = W.stage({ act: 'III', fog, fogColor: fc.getHex(), fov });
  const { amb, key, rim } = S.lights;
  amb.intensity = lerp(0.04, 0.08, u); key.intensity = lerp(0.15, 0.4, u); rim.intensity = lerp(0.3, 0.5, u);
  key.color.set(C.ice).lerp(new THREE.Color(0xffd2a0), u); rim.color.set(C.steel).lerp(new THREE.Color(0xffb070), u);
  return S;
}
/** banks on-levels for iii-bank-i (1-based): banks before i are settled ON, bank i ignites (0 -> 1.3 in 2 f -> 1.0), the rest are OFF.
 *  lead: the ignition is advanced one frame so frame 0 (the boom) already shows the slam. */
export function bankOn(i, lt, { lead = F } = {}) {
  return W.BANK_X.map((_, j) => (j < i - 1 ? 1 : j === i - 1 ? W.ignite(lt + lead) : 0));
}
/** drive the hall for cascade shot i: banks + stations under lit banks (station s lights with bank s+1). Returns the on array. */
export function cascade(H, i, lt, t, { scan = null, beam = 1, dust = 1, housing, drawD = 0.2 } = {}) {
  const on = bankOn(i, lt);
  const bp = { on, t, beam, dust }; if (housing !== undefined) bp.housing = housing;
  H.banks.update(lt, bp);
  const st = on.slice(0, 7).map((v) => clamp(v));
  const draw = st.map((v, s) => (s === i - 1 ? ease.out(clamp((lt + F) / drawD)) : 1));
  const lp = { lit: st, strips: st, draw, stripK: 3, codeK: 8, red: 0 };
  if (scan) lp.scan = scan;
  H.line.update(lt, lp);
  return on;
}
/** hall 'lit' level for cascade shot i (pillar edges ice -> brass, sky haze cold -> warm). */
export const hallLit = (i, on) => clamp((i - 1 + clamp(on[i - 1] ?? 1)) / 8);

// ----------------------------------------------------------------------------------------- set dressing
/** soft-edged rectangular additive light pool on the floor (or any plane). mesh.userData.set(k, hex?) (RAW k). */
export function warmPool({ w = 18, d = 10, color = C.amber, k = 1, soft = 0.35, y = 0.03 } = {}) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, blending: THREE.AdditiveBlending,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: W.hcol(color, k) }, uSoft: { value: soft } }]),
    vertexShader: `varying vec2 vUv; varying float vFogDepth; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uSoft; uniform vec3 fogColor; uniform float fogDensity; varying vec2 vUv; varying float vFogDepth;
      void main(){ vec2 q = abs(vUv - 0.5) * 2.0; float a = (1.0 - smoothstep(1.0 - uSoft, 1.0, q.x)) * (1.0 - smoothstep(1.0 - uSoft, 1.0, q.y));
        a *= 0.6 + 0.4 * (1.0 - dot(q, q) * 0.5);
        float f = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        gl_FragColor = vec4(uCol * a * f, 1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = 2;
  m.userData.set = (kk, hex = color) => { mat.uniforms.uCol.value.set(hex).multiplyScalar(kk); m.visible = kk > 1e-4; };
  return m;
}
/** thin glowing outlines of the 8 bank housings (for top-downs where the housings themselves are hidden). update(on[8]). */
export function bankRig({ width = 1.4 } = {}) {
  const group = new THREE.Group();
  const segs = W.BANK_X.map((x) => { const s = W.glowSegs(W.boxEdgePairs([x, 60, 0], [16, 0.8, 12]), { color: C.amber, k: 1, width }); group.add(s); return s; });
  return { group, segs, update(on, { kOn = 2.2, kOff = 0.25 } = {}) { segs.forEach((s, j) => { const o = clamp(on[j] || 0); s.userData.set(lerp(kOff, kOn, o), o > 0.01 ? C.amber : C.steel); }); } };
}
/** a light that traces station i's top perimeter (fat line, reveal 0..1 = how much of the outline is drawn). */
export function stationTrace(i, { k = 6, y = 3.08, width = 3, color = C.amber } = {}) {
  const s = W.STATIONS[i]; const hw = (s.w - 1.2) / 2, hd = 5;
  const corners = [[s.cx - hw, y, hd], [s.cx - hw, y, -hd], [s.cx + hw, y, -hd], [s.cx + hw, y, hd], [s.cx - hw, y, hd]];
  const pts = [];
  for (let c = 0; c < 4; c++) for (let q = 0; q < 16; q++) { const a = corners[c], b = corners[c + 1], u = q / 16; pts.push([lerp(a[0], b[0], u), y, lerp(a[2], b[2], u)]); }
  pts.push(corners[4]);
  return W.fat(pts, { color, k, width });
}
/** out-of-focus warm bokeh discs far behind a telephoto / macro subject. update(k). */
export function bokeh({ count = 18, center = [0, 0, -60], spread = [60, 20, 10], size = [3, 8], color = C.amber, seed = 9 } = {}) {
  const group = new THREE.Group(); const r = rand(seed); const fl = [];
  for (let i = 0; i < count; i++) {
    const f = W.flare({ color: r() < 0.25 ? C.ivory : color, k: 1, size: lerp(size[0], size[1], r()), fog: false, ref: 0.5 });
    f.position.set(center[0] + (r() - 0.5) * spread[0], center[1] + (r() - 0.5) * spread[1], center[2] + (r() - 0.5) * spread[2]);
    f.userData.base = 0.4 + r() * 0.6; group.add(f); fl.push(f);
  }
  return { group, update(k = 1) { fl.forEach((f) => f.userData.set(k * f.userData.base)); } };
}
/** deterministic spark burst (additive points). update(age s, { k, g }) — age < 0 hides. */
export function sparks({ count = 160, at = [0, 0, 0], speed = [1.5, 4], up = 0.6, color = C.bankOn, size = 0.05, seed = 13 } = {}) {
  const r = rand(seed);
  const P = G.particles({ count, spread: [0, 0, 0], center: at, color, size, seed });
  const v = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { const a = r() * Math.PI * 2, b = (r() - 0.2) * Math.PI * 0.5 * up + r() * 0.3; const s = lerp(speed[0], speed[1], r());
    v[i * 3] = Math.cos(a) * Math.cos(b) * s; v[i * 3 + 1] = Math.abs(Math.sin(b)) * s; v[i * 3 + 2] = Math.sin(a) * Math.cos(b) * s; }
  P.points.frustumCulled = false;
  P.update = (age, { k = 4, g = 6 } = {}) => {
    P.points.visible = age >= 0 && age < 0.8;
    if (!P.points.visible) return;
    for (let i = 0; i < count; i++) { P.positions[i * 3] = at[0] + v[i * 3] * age; P.positions[i * 3 + 1] = at[1] + v[i * 3 + 1] * age - 0.5 * g * age * age; P.positions[i * 3 + 2] = at[2] + v[i * 3 + 2] * age; }
    P.geometry.attributes.position.needsUpdate = true;
    P.material.color.set(color).multiplyScalar(W.ko(k) * Math.pow(1 - age / 0.8, 1.5));
  };
  return P;
}
/** extra dust motes filling one bank's beam column (worm's-eye shots). update(t, level). */
export function beamMotes({ x = 50, count = 1400, r0 = 9, h = 58, size = 0.12, seed = 17 } = {}) {
  const r = rand(seed);
  const P = G.particles({ count, spread: [0, 0, 0], color: C.amber, size, seed });
  const base = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { const y = r() * h; const rad = lerp(r0, 6, y / h) * Math.sqrt(r()); const a = r() * Math.PI * 2; base[i * 4] = x + Math.cos(a) * rad; base[i * 4 + 1] = y; base[i * 4 + 2] = Math.sin(a) * rad; base[i * 4 + 3] = r(); }
  P.points.frustumCulled = false;
  P.update = (t, lvl = 1) => {
    for (let i = 0; i < count; i++) { const y = ((base[i * 4 + 1] + t * 0.6 * (0.4 + base[i * 4 + 3])) % h + h) % h;
      P.positions[i * 3] = base[i * 4] + Math.sin(t * 0.4 + i) * 0.3; P.positions[i * 3 + 1] = y + 0.5; P.positions[i * 3 + 2] = base[i * 4 + 2] + Math.cos(t * 0.37 + i * 1.7) * 0.3; }
    P.geometry.attributes.position.needsUpdate = true;
    P.material.color.set(C.amber).multiplyScalar(W.ko(3) * lvl);
    P.points.visible = lvl > 0.001;
  };
  return P;
}

// ----------------------------------------------------------------------------------------- canvas textures
let _etch = null;
/** etched brass housing ring (white on transparent): ticks, numerals-as-glyph blocks, segmented arcs. */
export function etchTexture() {
  if (_etch) return _etch;
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.translate(256, 256); g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  const ring = (r, w, a0 = 0, a1 = Math.PI * 2) => { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, a0, a1); g.stroke(); };
  ring(248, 3); ring(232, 1.5); ring(170, 2); ring(150, 1);
  for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2; const L = i % 10 === 0 ? 22 : i % 5 === 0 ? 14 : 8; g.lineWidth = i % 10 === 0 ? 3 : 1.4;
    g.beginPath(); g.moveTo(Math.cos(a) * 230, Math.sin(a) * 230); g.lineTo(Math.cos(a) * (230 - L), Math.sin(a) * (230 - L)); g.stroke(); }
  const r = rand(77);
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2 + 0.04; g.save(); g.rotate(a); const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) g.fillRect(180 + k * 9, -3, 6, r() < 0.5 ? 6 : 10); g.restore(); }
  for (let s = 0; s < 6; s++) ring(160, 5, s * (Math.PI / 3) + 0.1, s * (Math.PI / 3) + 0.85);
  ring(110, 1.2); ring(96, 2.5);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.lineWidth = 2; g.beginPath(); g.moveTo(Math.cos(a) * 100, Math.sin(a) * 100); g.lineTo(Math.cos(a) * 146, Math.sin(a) * 146); g.stroke(); }
  _etch = new THREE.CanvasTexture(c); _etch.colorSpace = THREE.SRGBColorSpace; _etch.anisotropy = 4;
  return _etch;
}
/** additive etched disc (brass glyph ring) lying flat (faces +y). userData.set(k RAW). */
export function etchedDisc({ r = 3, color = C.brass, k = 0.6 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ map: etchTexture(), color: W.hcol(color, k), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: true });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), mat); m.rotation.x = -Math.PI / 2;
  m.userData.set = (kk, hex = color) => mat.color.set(hex).multiplyScalar(kk);
  return m;
}
let _cardTex = null;
/** the face of a work card at macro distance: dark ivory field with code token bars (amber / ivory / ice) and an ID rule. */
export function cardFaceTexture() {
  if (_cardTex) return _cardTex;
  const c = document.createElement('canvas'); c.width = 768; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#1b1712'; g.fillRect(0, 0, 768, 512);
  G.drawCode(g, 768, 512, { seed: 23, lines: 14, palette: ['#ffd2a0', '#faf9f5', '#cfe3f2', '#e8b47a', '#8d8a83'], cursor: false });
  g.strokeStyle = 'rgba(255,210,160,0.9)'; g.lineWidth = 6; g.strokeRect(10, 10, 748, 492);
  g.fillStyle = 'rgba(255,210,160,0.85)'; g.fillRect(28, 470, 160, 10); g.fillRect(200, 470, 60, 10);
  _cardTex = new THREE.CanvasTexture(c); _cardTex.colorSpace = THREE.SRGBColorSpace; _cardTex.anisotropy = 8;
  return _cardTex;
}

// ----------------------------------------------------------------------------------------- factory card flow
/** amber cards gliding +x along the lit line on the station tops (3 lanes). update(t, { speed, k }). heroX(t) = x of the lane-0 hero card. */
export function lineCards({ lanes = [-2.8, 0, 2.8], spacing = 4.6, speed = 6, y = 3.45, heroX0 = -2.2, seed = 5 } = {}) {
  const per = Math.ceil(140 / spacing), count = per * lanes.length;
  const I = W.cards({ count });
  const r = rand(seed); const ph = lanes.map((_, l) => (l === 1 ? 0 : r() * spacing));
  const api = {
    mesh: I.mesh, I, count, heroX: (t) => heroX0 + speed * t,
    update(t, { k = 2.5, edgeK = 2.5 } = {}) {
      const e = W.CARD.amberEdge(edgeK), b = W.CARD.amberBody(k);
      let n = 0;
      lanes.forEach((z, l) => {
        const x0 = heroX0 + speed * t + ph[l];
        for (let q = 0; q < per; q++) {
          const x = ((((x0 + q * spacing) + 70) % 140) + 140) % 140 - 70;
          const fade = clamp((x + 70) / 3) * clamp((70 - x) / 3);
          I.set(n++, { p: [x, y, z], s: [Math.max(0.02, fade), 1, 1], edge: e, body: b });
        }
      });
      I.commit();
    },
  };
  return api;
}

// ----------------------------------------------------------------------------------------- GRAPH (neutral architecture)
/** 1 ivory hub + 12 workers (orb r1) on etched brass housings, 13 brass filaments (inlet + 12 spokes) + 12 short outlet leads; ONE pulse
 *  hops edge by edge (hop s/edge) and each node blooms on arrival (base -> peak -> base). Before its pulse a node idles dim.
 *  update(lt, { t: s since the pulses start, hop, base (6), peak (14), idle (2.2), edgeK }) */
export function graphNet({ center = [0, 2, 0], radius = 14, hop = 4 / 30 } = {}) {
  const group = new THREE.Group();
  const [cx, cy, cz] = center;
  const nodes = [[cx, cy, cz]];
  for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2 - Math.PI / 2; nodes.push([cx + Math.cos(a) * radius, cy, cz + Math.sin(a) * radius * 0.8]); }
  const inlet = [cx - radius * 2.6, cy, cz];
  const N = W.orbs({ count: 13, r: 1, seg: 20 }); group.add(N.mesh);
  const plMat = W.edgeStd({ color: C.brassDark, metal: 0.9, rough: 0.35, edge: C.brass, edgeK: W.kl(1.5) });
  const discs = [], rings = [];
  nodes.forEach((p, i) => {
    const g = new THREE.Group(); g.position.set(...p);
    const d = etchedDisc({ r: i ? 2.7 : 3.8, k: 0.5 }); d.position.y = -1.05; g.add(d); discs.push(d);
    const r1 = G.ring({ r: i ? 1.55 : 2.2, tube: 0.07, color: C.brass, k: W.kl(2) }); r1.rotation.x = Math.PI / 2; g.add(r1); rings.push(r1);
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(i ? 2.75 : 3.85, i ? 2.9 : 4.0, 0.5, 48), plMat); plinth.position.y = -1.35; g.add(plinth);
    group.add(g);
  });
  const edges = [W.fat([inlet, nodes[0]], { color: C.brass, k: 1, width: 2.4 })];
  for (let j = 1; j <= 12; j++) edges.push(W.fat([nodes[0], nodes[j]], { color: C.brass, k: 1, width: 2.4 }));
  const outs = [];
  for (let j = 1; j <= 12; j++) { const p = nodes[j]; const dx = p[0] - cx, dz = p[2] - cz; const L = Math.hypot(dx, dz); const q = [p[0] + (dx / L) * 7, p[1], p[2] + (dz / L) * 7];
    outs.push(W.fat([p, q], { color: C.brass, k: 0.5, width: 1.4 })); }
  [...edges, ...outs].forEach((e) => group.add(e));
  const pulse = W.glowMesh(new THREE.SphereGeometry(1, 12, 8), C.ivory, 14, { radius: 1 }); pulse.scale.setScalar(0.42); group.add(pulse);
  const pfl = W.flare({ color: C.ivory, k: 3, size: 4 }); group.add(pfl);
  const trail = W.orbs({ count: 6, r: 0.3, seg: 8 }); group.add(trail.mesh);
  const opuls = W.orbs({ count: 12, r: 0.28, seg: 8 }); group.add(opuls.mesh);
  const posOn = (e, u) => { const a = e === 0 ? inlet : nodes[0], b = e === 0 ? nodes[0] : nodes[e]; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; };
  const api = {
    group, nodes, inlet, edges, outs, discs, N,
    arrival: (i) => (i === 0 ? 1 : i + 1) * hop,   // seconds after t=0 at which node i is reached
    update(lt, { t = lt, base = 6, peak = 14, idle = 2.2, edgeK = 2.2, edgeIdle = 0.7 } = {}) {
      const step = t / hop; const e = Math.floor(step), u = step - e;
      nodes.forEach((p, i) => {
        const since = step - (i === 0 ? 1 : i + 1);
        const k = since >= 0 ? base + (peak - base) * Math.exp(-since * 1.6) : idle;
        N.set(i, { p, c: W.lin(C.ivory), k: i === 0 ? k * 1.15 : k });
        discs[i].userData.set(since >= 0 ? 0.55 + 1.2 * Math.exp(-since * 1.2) : 0.3, C.brass);
      });
      N.commit();
      edges.forEach((ed, i) => ed.userData.set(t >= 0 && i < e ? edgeK : t >= 0 && i === e ? lerp(edgeIdle, edgeK, u) : edgeIdle));
      outs.forEach((o, j) => o.userData.set(t >= 0 && j + 1 < e ? 0.9 : 0.35));
      if (t >= 0 && e < 13) {
        const p = posOn(e, u); pulse.visible = true; pulse.position.set(...p); pfl.position.set(...p); pfl.userData.set(3, C.ivory);
        for (let q = 0; q < 6; q++) { const uu = u - (q + 1) * 0.07; if (uu < 0) { trail.hide(q); continue; } trail.set(q, { p: posOn(e, uu), c: W.lin(C.ivory), k: 6 * (1 - q / 6) }); }
      } else { pulse.visible = false; pfl.userData.set(0); for (let q = 0; q < 6; q++) trail.hide(q); }
      trail.commit();
      // the pulse "passes it on": after a worker blooms, a smaller pulse runs out its outlet lead
      for (let j = 1; j <= 12; j++) {
        const since = (step - (j + 1)) * hop; const uu = since / 0.18;
        if (since < 0 || uu > 1) { opuls.hide(j - 1); continue; }
        const a = nodes[j], o = outs[j - 1]; const dx = a[0] - cx, dz = a[2] - cz; const L = Math.hypot(dx, dz);
        opuls.set(j - 1, { p: [a[0] + (dx / L) * 7 * uu, a[1], a[2] + (dz / L) * 7 * uu], c: W.lin(C.ivory), k: 8 * (1 - uu * 0.6) });
      }
      opuls.commit();
    },
  };
  api.update(0, { t: -1 });
  return api;
}

// ----------------------------------------------------------------------------------------- 2D type slots
/** -0.8 stop darkening under a type band: a soft gradient band centred at y (px), height h. */
export function scrim(K, root, { y = 820, h = 360, a = 0.45, full = false } = {}) {
  const st = full
    ? { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', background: `radial-gradient(ellipse 60% 45% at 50% ${(y / 1080 * 100).toFixed(1)}%, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${(a * 0.6).toFixed(3)}) 55%, rgba(0,0,0,0) 100%)` }
    : { position: 'absolute', left: '0px', top: (y - h / 2) + 'px', width: '1920px', height: h + 'px', background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,${a}) 35%, rgba(0,0,0,${a}) 65%, rgba(0,0,0,0) 100%)` };
  return K.el('div', { style: st }, root);
}
/** refrainSlot (THE LINE WAITS. / THE LINE RUNS.): cond 220 px centred (960, 820). */
export function refrain(K, root, html, { color = '#FAF9F5' } = {}) {
  return K.text(root, { y: 820, cls: 'cond', html, style: { color, textShadow: '0 6px 40px rgba(0,0,0,0.55)' } });
}
/** structure tricolon card: small tracked label line (e.g. 'GRAPH:') over the big slam word (e.g. 'CONTROL.'); textContent is exactly
 *  `${pre} ${main}`. size = slam px of the main word (150 / 180 / 210 escalation). */
export function tricolon(K, root, { pre, main, size = 150, y = 860, color = '#FAF9F5' } = {}) {
  const preSize = Math.round(size * 0.34);
  const html = `<span style="display:block;font-family:var(--display);font-weight:600;font-size:${preSize}px;letter-spacing:0.42em;margin-right:-0.42em;color:#E8B47A;line-height:1;margin-bottom:${Math.round(size * 0.1)}px">${pre}</span> <span style="display:block;line-height:0.92">${main}</span>`;
  return K.text(root, { y, cls: 'slam', html, style: { fontSize: size + 'px', color, textShadow: '0 8px 48px rgba(0,0,0,0.6)' } });
}

// ----------------------------------------------------------------------------------------- misc
export const impulse = (t, t0, d = 0.12) => (t < t0 ? 0 : Math.exp(-(t - t0) / d));
/** 3D scrim glued to the camera (darkens the GL layer under a type block BEFORE bloom, so the glow can't bleed through the card).
 *  m.userData.set(alpha); call m.userData.fit() after the camera fov is final each frame. (x, y, w, h in 1080p px.) */
export function camScrim(scene, camera, { x = 960, y = 540, w = 1500, h = 560, a = 0.7 } = {}) {
  if (!camera.parent) scene.add(camera);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, fog: false,
    uniforms: { uA: { value: a } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float uA; varying vec2 vUv; void main(){ vec2 c = (vUv - 0.5) * 2.0; float r = length(c); float al = uA * (1.0 - smoothstep(0.25, 1.0, r)); gl_FragColor = vec4(0.0, 0.0, 0.0, al); }',
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.renderOrder = 999; m.frustumCulled = false;
  camera.add(m);
  m.userData.set = (aa) => { mat.uniforms.uA.value = aa; m.visible = aa > 0.001; };
  m.userData.fit = () => {
    const d = 1; const hh = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2); const s = hh / 1080;
    m.position.set((x - 960) * s, -(y - 540) * s, -d); m.scale.set(w * s, h * s, 1); m.rotation.set(0, 0, 0);
  };
  m.userData.set(a);
  return m;
}

// ----------------------------------------------------------------------------------------- hero relay (iii-bank-3 macro)
let _coilTex = null;
function coilTexture() {
  if (_coilTex) return _coilTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  for (let y = 0; y < 256; y += 4) { const v = 0.75 + 0.25 * Math.sin(y * 0.7); g.fillStyle = `rgb(${Math.round(200 * v)},${Math.round(110 * v)},${Math.round(60 * v)})`; g.fillRect(0, y, 64, 3); g.fillStyle = '#2a1408'; g.fillRect(0, y + 3, 64, 1); }
  _coilTex = new THREE.CanvasTexture(c); _coilTex.colorSpace = THREE.SRGBColorSpace; _coilTex.wrapS = _coilTex.wrapT = THREE.RepeatWrapping;
  return _coilTex;
}
/** A detailed brass relay (base plate + rivets, copper coil, hinge post, armature with contact rivet, fixed contact, helical filament on
 *  two posts). Origin = base centre. update(lt, { closed 0..1, fil (filament nominal k), filColor }). tipWorld() = contact point. */
export function relayHero({ pos = [0, 0, 0] } = {}) {
  const group = new THREE.Group(); group.position.set(...pos);
  const brass = W.edgeStd({ color: 0x8a6438, metal: 0.85, rough: 0.32, edge: C.brassHi, edgeK: W.kl(0.5), edgeW: 1.1 });
  const dark = W.edgeStd({ color: C.brassDark, metal: 0.8, rough: 0.4, edge: C.brassHi, edgeK: W.kl(0.35), edgeW: 1.1 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, metalness: 1, roughness: 0.18 });
  const box = (m, s, p, parent = group) => { const o = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m); o.scale.set(...s); o.position.set(...p); parent.add(o); return o; };
  const cyl = (m, r, h, p, parent = group, seg = 24) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); o.position.set(...p); parent.add(o); return o; };
  box(dark, [2.9, 0.12, 1.5], [0, 0.06, 0]);
  [[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]].forEach(([x, z]) => cyl(silver, 0.06, 0.04, [x, 0.14, z], group, 12));
  const coilMat = new THREE.MeshStandardMaterial({ map: coilTexture(), metalness: 0.7, roughness: 0.38, color: 0xffffff });
  cyl(coilMat, 0.27, 0.66, [-0.45, 0.45, 0]); cyl(brass, 0.32, 0.06, [-0.45, 0.81, 0]); cyl(brass, 0.32, 0.06, [-0.45, 0.15, 0]);
  cyl(silver, 0.1, 0.05, [-0.45, 0.86, 0], group, 16);                     // pole face
  box(brass, [0.16, 0.95, 0.34], [-1.12, 0.59, 0]);                         // hinge post
  const pivot = new THREE.Group(); pivot.position.set(-1.12, 1.07, 0); group.add(pivot);
  box(brass, [2.0, 0.08, 0.3], [1.0, 0, 0], pivot);                         // armature
  cyl(silver, 0.075, 0.06, [1.85, -0.07, 0], pivot, 16);                    // moving contact
  box(dark, [0.2, 0.86, 0.32], [0.73, 0.55, 0]);                            // fixed contact post (top 0.98)
  cyl(silver, 0.075, 0.05, [0.73, 1.0, 0], group, 16);                      // fixed contact
  // filament: helix on two posts behind the armature (z -0.5)
  box(dark, [0.07, 0.7, 0.07], [-0.15, 0.47, -0.5]); box(dark, [0.07, 0.7, 0.07], [0.75, 0.47, -0.5]);
  const pts = []; for (let i = 0; i <= 260; i++) { const u = i / 260; const a = u * Math.PI * 2 * 18; pts.push(new THREE.Vector3(lerp(-0.12, 0.72, u), 0.8 + Math.sin(a) * 0.035, -0.5 + Math.cos(a) * 0.035)); }
  const filMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
  const fil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 520, 0.009, 5, false), filMat); group.add(fil);
  const tip = new THREE.Vector3();
  const api = {
    group, pivot, fil,
    tipWorld() { group.updateWorldMatrix(true, true); return pivot.localToWorld(tip.set(1.85, -0.1, 0)).toArray(); },
    update(lt, { closed = 1, fil: fk = 10, filColor = C.bankOn } = {}) {
      pivot.rotation.z = lerp(0.32, 0.0, clamp(closed));
      filMat.color.set(filColor).multiplyScalar(W.ko(fk));
    },
  };
  api.update(0);
  return api;
}

// =====================================================================================================
// b6 part 2 (shots 78-83: iii-hierarchy, iii-tier-snap, iii-swarm, iii-one-writer, iii-coord-44, iii-review-mirror).
// Appended exports only.
// =====================================================================================================
const qbez = (a, c, b, u) => [0, 1, 2].map((k) => (1 - u) * (1 - u) * a[k] + 2 * u * (1 - u) * c[k] + u * u * b[k]);

/** HIERARCHY rig: the stepped 16 -> 4 -> 1 diagram that echoes the foreman's silhouette. Obsidian tiers with brass seams, standing on a
 *  dark dais; ivory nodes on etched brass housings; a stack of 3 work cards in front of every node (jittered, slowly drifting) that
 *  squares up (jitter -> 0 in 3 f) when its tier's beam strikes. Light runs DOWN the tree: a sky shaft onto the apex, pulses along the
 *  ivory apex->lead arcs, then along the brass lead->worker arcs; each arrival = beam strike + node flare + seam ignite + card snap.
 *  hierarchyRig({ center:[x,0,z] (dais foot), scale, dais (height u) }) ->
 *    { group, nodes:[{p, tier, j}] (world), cardsAt(i) world, groupCenter(j), update(lt, { t, snaps:[apex, leads, workers] (local s), lock }) , sources() } */
export function hierarchyRig({ center = [0, 0, -14], scale = 1.25, dais = 7, seed = 781 } = {}) {
  const group = new THREE.Group();
  const s = scale, [cx, cy, cz] = center;
  const P = (x, y, z) => [cx + x * s, cy + dais + y * s, cz + z * s];
  const obs = W.edgeStd({ color: 0x0b0a09, metal: 0.6, rough: 0.38, edge: C.brass, edgeK: W.kl(1.1), edgeW: 1.3 });
  const daisMat = W.edgeStd({ color: 0x080807, metal: 0.5, rough: 0.45, edge: C.brassMid, edgeK: W.kl(0.6), edgeW: 1.2 });
  const box = (mat, [x, y, z], [w, h, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); group.add(m); return m; };
  // dais + three tiers (local units x scale)
  const TI = [{ w: 50, d: 22, h: 4, y: 0 }, { w: 30, d: 13, h: 4, y: 4 }, { w: 12, d: 6, h: 4, y: 8 }];
  box(daisMat, [cx, cy + dais / 2, cz], [58 * s, dais, 30 * s]);
  TI.forEach((T) => box(obs, P(0, T.y + T.h / 2, 0), [T.w * s, T.h * s, T.d * s]));
  // seams: top perimeter of each tier (+ dais) as soft glow segments
  const rim = (T, yy) => { const hw = (T.w / 2) * s, hd = (T.d / 2) * s; const y = cy + dais + yy * s + 0.02; const a = [cx - hw, y, cz + hd], b = [cx + hw, y, cz + hd], c2 = [cx + hw, y, cz - hd], d2 = [cx - hw, y, cz - hd]; return [[a, b], [b, c2], [c2, d2], [d2, a]]; };
  const seams = TI.map((T) => { const g = W.glowSegs(rim(T, T.y + T.h), { color: C.amber, k: 1, width: 2.2 }); group.add(g); return g; });
  const faceSeams = TI.map((T) => { const hw = (T.w / 2) * s; const y0 = cy + dais + T.y * s + 0.5 * s, z = cz + (T.d / 2) * s + 0.03;
    const g = W.glowSegs([[[cx - hw, y0, z], [cx + hw, y0, z]]], { color: C.brass, k: 0.6, width: 1.4 }); group.add(g); return g; });
  const daisSeam = W.glowSegs(rim({ w: 58, d: 30 }, 0).map(([a, b]) => [[a[0], cy + dais + 0.02, a[2]], [b[0], cy + dais + 0.02, b[2]]]), { color: C.brassMid, k: 1.2, width: 1.8 }); group.add(daisSeam);
  // nodes
  const nodes = [];
  nodes.push({ p: P(0, 13.7, -0.5), tier: 2, j: 0, r: 0.95, top: 12, cz: 1.9, card: [2.8, 0.22, 1.5] });
  const LX = [-10.5, -3.5, 3.5, 10.5];
  LX.forEach((x, j) => nodes.push({ p: P(x, 8.95, 4.0), tier: 1, j, r: 0.62, top: 8, cz: 5.6, card: [2.2, 0.2, 1.1], lx: x }));
  const GX = [-18, -6, 6, 18], OFF = [-4.05, -1.35, 1.35, 4.05];
  GX.forEach((g, j) => OFF.forEach((o) => nodes.push({ p: P(g + o, 4.8, 7.6), tier: 0, j, r: 0.46, top: 4, cz: 9.6, card: [1.6, 0.17, 1.0], lx: g + o })));
  const N = W.orbs({ count: nodes.length, r: 1, seg: 18 }); group.add(N.mesh);
  const rings = nodes.map((n) => { const g = G.ring({ r: n.r * 1.75 * s, tube: 0.05 * s, color: C.brass, k: W.kl(1.4) }); g.rotation.x = Math.PI / 2;
    g.position.set(n.p[0], cy + dais + n.top * s + 0.06, n.p[2]); group.add(g); return g; });
  const discs = nodes.map((n) => { const d = etchedDisc({ r: n.r * 2.6 * s, k: 0.35 }); d.position.set(n.p[0], cy + dais + n.top * s + 0.04, n.p[2]); group.add(d); return d; });
  const flares = nodes.map((n) => { const f = W.flare({ color: C.ivory, k: 0, size: n.r * 9 * s }); f.position.set(...n.p); group.add(f); return f; });
  const crest = G.ring({ r: 1.9 * s, tube: 0.06 * s, color: C.ivory, k: W.kl(2.5) }); crest.rotation.x = Math.PI / 2; crest.position.set(nodes[0].p[0], nodes[0].p[1] + 0.2, nodes[0].p[2]); group.add(crest);
  // cards: 3 per node
  const nC = nodes.length * 3;
  const Cd = W.cards({ count: nC, size: [1, 1, 1] }); group.add(Cd.mesh);
  const r = rand(seed);
  const jit = Array.from({ length: nC }, () => ({ x: (r() - 0.5) * 0.5, z: (r() - 0.5) * 0.45, ry: (r() - 0.5) * 0.6, rz: (r() - 0.5) * 0.12, ph: r() * 6.28 }));
  // links: circuit traces routed over the tier tops and diagonally down the tier faces (stone-course circuitry, like the foreman's):
  // apex -> leads (ivory), lead -> its 4 workers (brass)
  const resample = (poly, n = 24) => { const L = [0]; for (let i = 1; i < poly.length; i++) L.push(L[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1], poly[i][2] - poly[i - 1][2]));
    const out = []; for (let q = 0; q <= n; q++) { const d = (q / n) * L[L.length - 1]; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const u = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
      out.push([lerp(poly[i - 1][0], poly[i][0], u), lerp(poly[i - 1][1], poly[i][1], u), lerp(poly[i - 1][2], poly[i][2], u)]); } return out; };
  const links = [], linkCurves = [];
  for (let j = 0; j < 4; j++) { const lx = LX[j];
    const pts = resample([nodes[0].p, P(lx * 0.22, 12.06, -0.5), P(lx * 0.22, 12.06, 3.06), P(lx, 8.06, 3.06), P(lx, 8.06, 3.6), nodes[1 + j].p]);
    linkCurves.push(pts); const l = W.fat(pts, { color: C.ivory, k: 1.2, width: 1.6 }); group.add(l); links.push(l); }
  for (let w = 0; w < 16; w++) { const n = nodes[5 + w], L = nodes[1 + n.j]; const lx = L.lx, wx = n.lx;
    const pts = resample([L.p, P(lx, 8.06, 4.0), P(lx + (wx - lx) * 0.18, 8.06, 6.56), P(wx, 4.06, 6.56), P(wx, 4.06, 7.0), n.p]);
    linkCurves.push(pts); const l = W.fat(pts, { color: C.brass, k: 1, width: 1.3 }); group.add(l); links.push(l); }
  const pulses = W.orbs({ count: 20, r: 0.28 * s, seg: 10 }); group.add(pulses.mesh);
  // beams: sky -> apex, apex -> each lead, lead -> its worker group
  const beams = [];
  const sky = W.shaft({ rTop: 0.6, rBot: 2.6 * s, h: 40, color: C.bankOn, k: 1, opacity: 0, apexFade: 0.02, bottom: 1.0, top: 0.4 });
  W.aimShaft(sky, [nodes[0].p[0], nodes[0].p[1] + 60, nodes[0].p[2]], [nodes[0].p[0], nodes[0].p[1] - 1.2 * s, nodes[0].p[2]]); group.add(sky); beams.push({ m: sky, tier: 2 });
  for (let j = 0; j < 4; j++) { const sh = W.shaft({ rTop: 0.25 * s, rBot: 1.9 * s, h: 10, color: C.bankOn, k: 1, opacity: 0, apexFade: 0.15 });
    const L = nodes[1 + j].p; W.aimShaft(sh, nodes[0].p, [L[0], L[1] - 0.9 * s, L[2] + 0.6 * s]); group.add(sh); beams.push({ m: sh, tier: 1 }); }
  for (let j = 0; j < 4; j++) { const sh = W.shaft({ rTop: 0.25 * s, rBot: 5.0 * s, h: 10, color: C.amber, k: 1, opacity: 0, apexFade: 0.15 });
    const L = nodes[1 + j].p, gC = P(GX[j], 4.0, 8.6); W.aimShaft(sh, L, gC); group.add(sh); beams.push({ m: sh, tier: 0 }); }
  const floorDisc = etchedDisc({ r: 46 * s, k: 0.06 }); floorDisc.position.set(cx, cy + 0.03, cz); group.add(floorDisc);
  const cardWorld = (n, k) => [n.p[0], cy + dais + (n.top + n.card[1] / 2 + k * (n.card[1] + 0.03)) * s, cz + n.cz * s];
  const st = { snapsA: [0, 0, 0], lt: 0 };
  const api = {
    group, nodes, links, beams, P, scale: s, dais, N,
    groupCenter: (j) => P(GX[j], 4.6, 8.4), cardWorld,
    update(lt, { t = lt, snaps = [0, 0.4, 0.8], lock = 99, drift = 1, flash = 1, beamOp = 1 } = {}) {
      st.lt = lt;
      const fx = (tier) => flash * (tier === 0 ? 0.32 : 1);
      const since = (tier) => lt - snaps[2 - tier];          // tier 2 = apex = snaps[0]
      const lockS = lt - lock;
      const lockF = lockS >= 0 ? Math.exp(-lockS / 0.25) : 0;
      nodes.forEach((n, i) => {
        const d = since(n.tier);
        const k = d >= 0 ? 4 + 8 * fx(n.tier) * Math.exp(-d / 0.1) + 3 * lockF : 1.5;
        N.set(i, { p: n.p, s: n.r * s, c: W.lin(C.ivory), k: n.tier === 2 ? k * 1.2 : k });
        flares[i].userData.set(d >= 0 ? (n.tier === 2 ? 1.6 : 0.8) * (0.3 + 1.4 * Math.exp(-d / 0.1)) + 0.5 * lockF : 0, C.ivory);
        rings[i].material.color.set(C.brass).multiplyScalar(W.kl(d >= 0 ? 1.6 + 3 * Math.exp(-d / 0.15) : 0.7));
        discs[i].userData.set(d >= 0 ? 0.5 + 1.0 * Math.exp(-d / 0.2) : 0.25, C.brass);
        for (let k2 = 0; k2 < 3; k2++) {
          const ci = i * 3 + k2, J = jit[ci];
          const snapU = d >= 0 ? clamp(d / 0.1) : 0;
          const a = d >= 0 ? Math.pow(1 - snapU, 2) : 1;                  // 1 = full jitter, 0 = squared (3 f)
          const wob = a * drift * Math.sin(t * 2.3 + J.ph) * 0.35;
          const cw = cardWorld(n, k2);
          const gap = a * 0.1 * s * k2;
          const fl = d >= 0 ? fx(n.tier) * Math.exp(-d / 0.08) : 0;
          Cd.set(ci, { p: [cw[0] + (J.x + wob * 0.2) * a * s, cw[1] + gap, cw[2] + J.z * a * s], r: [0, (J.ry + wob * 0.3) * a, J.rz * a],
            s: [n.card[0] * s, n.card[1] * s, n.card[2] * s],
            edge: d >= 0 ? W.CARD.amberEdge(2.6 + 4 * fl + 1.5 * lockF) : W.CARD.edge(1.2), body: d >= 0 ? W.CARD.amberBody(1.4 + 3 * fl) : W.CARD.body(0.7) });
        }
      });
      N.commit(); Cd.commit();
      crest.material.color.set(C.ivory).multiplyScalar(W.kl(since(2) >= 0 ? 2 + 4 * Math.exp(-since(2) / 0.2) + 3 * lockF : 0.8));
      // seams ignite with their tier
      seams.forEach((g, ti) => { const d = since(ti); g.userData.set(d >= 0 ? 1.5 + 3.5 * fx(ti) * Math.exp(-d / 0.15) + 1.2 * lockF : 0.4); });
      faceSeams.forEach((g, ti) => { const d = since(ti); g.userData.set(d >= 0 ? 1.4 + 3 * Math.exp(-d / 0.2) : 0.35); });
      daisSeam.userData.set(1.0 + 2.5 * lockF);
      // links draw as the light travels down: apex->lead arcs during [leads-0.24, leads], lead->worker arcs during [workers-0.24, workers]
      const TRAVEL = 0.24;
      links.forEach((l, q) => {
        const tier = q < 4 ? 1 : 0; const d = since(tier); const u = clamp((d + TRAVEL) / TRAVEL);
        l.userData.reveal(u);
        l.userData.set(q < 4 ? (d >= 0 ? 1.3 + 1.5 * lockF : 2.4) : (d >= 0 ? 0.9 + 1.2 * lockF : 2));
        const pq = q;
        if (u > 0 && u < 1) { const pts = linkCurves[q]; const f = u * 24; const i0 = Math.min(23, Math.floor(f)); const uu = f - i0; const a = pts[i0], b = pts[i0 + 1];
          pulses.set(pq, { p: [lerp(a[0], b[0], uu), lerp(a[1], b[1], uu), lerp(a[2], b[2], uu)], c: W.lin(q < 4 ? C.ivory : C.bankOn), k: 14 }); }
        else pulses.hide(pq);
      });
      pulses.commit();
      beams.forEach((b) => { const d = since(b.tier); const on = d >= -0.03 ? 1 : 0; const fl = d >= 0 ? Math.exp(-d / 0.18) : 0;
        b.m.userData.set(on * (b.tier === 2 ? 1.2 + 2 * fl : b.tier === 1 ? 1.0 + 2 * fl : 0.9 + 0.8 * fl), beamOp * on * (b.tier === 2 ? 0.28 : 0.2) * (0.8 + 0.2 * Math.sin(t * 9 + b.tier))); });
      floorDisc.userData.set(0.05 + 0.08 * clamp(since(0) + 0.5) + 0.12 * lockF, C.brass);
    },
    sources() {
      const out = [];
      const d0 = st.lt;
      out.push({ p: nodes[0].p, c: C.ivory, k: 2, pool: 10 * s, poolK: 0.3, refl: 0.6, size: 2 });
      for (let j = 0; j < 4; j++) out.push({ p: P(GX[j], 6, 9), c: C.amber, k: 1.4, pool: 8 * s, poolK: 0.4, refl: 0.5, size: 3 });
      out.push({ p: [cx, cy + dais, cz + 15 * s], c: C.amber, k: 1.2, pool: 22 * s, poolK: 0.5, refl: 0.0, size: 10 });
      return out;
    },
  };
  api.update(0, { snaps: [9, 9, 9] });
  return api;
}

/** SWARM field (iii-swarm): 24 ivory document planes in a shallow two-row amphitheatre, 300 small ivory reader orbs that burst out of a
 *  tight cluster and fan to READ them in parallel (hovering, scanning down each page; read-beams = ONE LineSegments, 300 segments,
 *  ivory at 30%), then snap on the beat into ONE writer orb, which fires the single write line down to the card (card edge -> green).
 *  swarmField({ center }) -> { group, writerW, cardW, update(lt, { t, fan (s since burst), converge (s since snap; <0 none), write (s since
 *  strike; <0 none) }), sources() } */
export function swarmField({ center = [20, 2, 0], seed = 801 } = {}) {
  const group = new THREE.Group(); group.position.set(...center);
  const r = rand(seed);
  const NDOC = 24, N = 300;
  // document textures: dark page, ivory/ice/brass token bars, ivory header rule + margin tick
  const texs = [0, 1, 2, 3, 4, 5].map((q) => {
    const c = document.createElement('canvas'); c.width = 192; c.height = 256; const g = c.getContext('2d');
    g.fillStyle = 'rgba(16,15,13,0.96)'; g.fillRect(0, 0, 192, 256);
    G.drawCode(g, 192, 256, { seed: 60 + q, lines: 15, palette: ['#faf9f5', '#faf9f5', '#cfe3f2', '#8d8a83', '#e8b47a'], cursor: false });
    g.fillStyle = '#faf9f5'; g.fillRect(12, 10, 70, 6); g.globalAlpha = 0.5; g.fillRect(90, 10, 30, 6); g.globalAlpha = 1;
    g.strokeStyle = 'rgba(250,249,245,0.75)'; g.lineWidth = 3; g.strokeRect(2, 2, 188, 252);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx;
  });
  const docs = [];
  const docGeo = new THREE.PlaneGeometry(1.5, 2.0);
  for (let i = 0; i < NDOC; i++) {
    const row = Math.floor(i / 12), c = i % 12; const a = -1.05 + (c / 11) * 2.1;
    const mat = new THREE.MeshBasicMaterial({ map: texs[i % 6], color: W.hcol(0xffffff, 0.5), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const m = new THREE.Mesh(docGeo, mat);
    const y = 2.4 + row * 2.2, rad = 10 - row * 0.3;
    m.position.set(Math.sin(a) * rad, y, -Math.cos(a) * rad * 0.45 - 1.0);
    group.add(m); m.lookAt(center[0], center[1] + y - 0.4, center[2] + 9);
    docs.push(m);
  }
  group.updateMatrixWorld(true);
  const docN = docs.map((m) => new THREE.Vector3(0, 0, 1).applyQuaternion(m.quaternion));
  const docR = docs.map((m) => new THREE.Vector3(1, 0, 0).applyQuaternion(m.quaternion));
  const docU = docs.map((m) => new THREE.Vector3(0, 1, 0).applyQuaternion(m.quaternion));
  const O = W.orbs({ count: N, r: 0.1, seg: 8 }); group.add(O.mesh);
  const writer = [0, 3.4, 1.0];
  const cardP = [0, 1.0, -1.5];
  const home = [], rd = [];
  for (let i = 0; i < N; i++) {
    home.push([writer[0] + (r() - 0.5) * 1.4, writer[1] - 0.3 + (r() - 0.5) * 1.0, writer[2] + 0.6 + (r() - 0.5) * 1.0]);
    rd.push({ d: i % NDOC, u: (r() - 0.5) * 1.2, v: r(), hov: 0.5 + r() * 0.7, ph: r() * 6.28, sp: 0.7 + r() * 0.8, del: r() * 0.12, cdel: r() * 0.07 });
  }
  // read-beams: ONE LineSegments, 300 segments, ivory at 30%
  const segGeo = new THREE.BufferGeometry(); const sp = new Float32Array(N * 6); segGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const segMat = new THREE.LineBasicMaterial({ color: W.hcol(C.ivory, 0.9), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const seg = new THREE.LineSegments(segGeo, segMat); seg.frustumCulled = false; group.add(seg);
  // the writer, its write line and the card
  const Wr = W.glowMesh(new THREE.SphereGeometry(1, 24, 16), C.ivory, 8, { radius: 1 }); Wr.scale.setScalar(0.32); Wr.position.set(...writer); group.add(Wr);
  const WrF = W.flare({ color: C.ivory, k: 0, size: 5 }); WrF.position.set(...writer); group.add(WrF);
  const wpts = Array.from({ length: 17 }, (_, q) => [lerp(writer[0], cardP[0], q / 16), lerp(writer[1] - 0.3, cardP[1] + 0.27, q / 16), lerp(writer[2] - 0.2, cardP[2] + 0.3, q / 16)]);
  const ped = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1, 1.1), W.edgeStd({ color: 0x0b0a09, metal: 0.6, rough: 0.4, edge: C.brass, edgeK: W.kl(1.2), edgeW: 1.3 }));
  ped.scale.y = center[1] + cardP[1] - 0.25; ped.position.set(cardP[0], -center[1] + ped.scale.y / 2, cardP[2]); group.add(ped);
  const wl = W.fat(wpts, { color: C.ivory, k: 6, width: 2.6 }); group.add(wl);
  const cardMat = W.edgeStd({ color: C.card, metal: 0.1, rough: 0.5, edge: C.ice, edgeK: W.kl(2), body: C.card, bodyK: 0.06, edgeW: 1.4 });
  const card = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 2), cardMat); card.position.set(...cardP); group.add(card);
  const circ = Array.from({ length: 65 }, (_, i) => { const a = (i / 64) * Math.PI * 2; return [Math.cos(a), 0, Math.sin(a)]; });
  const ring = W.fat(circ, { color: C.green, k: 4, width: 2.4 }); ring.position.set(cardP[0], cardP[1] - 0.2, cardP[2]); group.add(ring);
  const cardF = W.flare({ color: C.green, k: 0, size: 4 }); cardF.position.set(cardP[0], cardP[1] + 0.3, cardP[2]); group.add(cardF);
  const tmp = new THREE.Vector3();
  const docPt = (i, t, scan) => { const q = rd[i]; const m = docs[q.d]; const v = 0.95 - ((q.v + scan * q.sp) % 1) * 1.9;
    return tmp.copy(m.position).addScaledVector(docR[q.d], q.u * 0.6 + Math.sin(t * 9 + q.ph) * 0.18).addScaledVector(docU[q.d], v * 0.95); };
  const st = { write: -1, cv: 0 };
  const api = {
    group, docs,
    writerW: [center[0] + writer[0], center[1] + writer[1], center[2] + writer[2]], cardW: [center[0] + cardP[0], center[1] + cardP[1], center[2] + cardP[2]],
    update(lt, { t = lt, fan = lt, converge = -1, write = -1 } = {}) {
      const ic = W.lin(C.ivory);
      const act = new Float32Array(NDOC);
      let cvAll = 0;
      for (let i = 0; i < N; i++) {
        const q = rd[i];
        const f = ease.expoOut(clamp((fan - q.del) / 0.42));
        const cvu = converge >= 0 ? clamp((converge - q.cdel) / 0.13) : 0;
        const cv = cvu * cvu * cvu;                                 // accelerate into the writer: snap
        cvAll += cv;
        const scan = Math.max(0, fan - 0.25) * 0.55;
        const dp = docPt(i, t, scan);
        const nrm = docN[q.d];
        // reading position: hovering in front of its page
        const rx = dp.x + nrm.x * q.hov, ry = dp.y + nrm.y * q.hov, rz = dp.z + nrm.z * q.hov;
        const h = home[i];
        // fan path bows outward/up so the burst reads as a bloom, not a slide
        const bow = Math.sin(f * Math.PI) * 1.4;
        let x = lerp(h[0], rx, f), y = lerp(h[1], ry, f) + bow * 0.6, z = lerp(h[2], rz, f) + bow * 0.4;
        x = lerp(x, writer[0], cv); y = lerp(y, writer[1], cv); z = lerp(z, writer[2], cv);
        if (cv > 0.985) { O.hide(i); sp.fill(0, i * 6, i * 6 + 6); continue; }
        O.set(i, { p: [x, y, z], c: ic, k: 2.4 + 1.0 * cvu });
        const vis = f * (1 - cvu) * (0.55 + 0.45 * Math.sin(t * 23 + q.ph * 3));
        act[q.d] += vis;
        sp[i * 6] = x; sp[i * 6 + 1] = y; sp[i * 6 + 2] = z;
        sp[i * 6 + 3] = lerp(x, dp.x, vis > 0.05 ? 1 : 0); sp[i * 6 + 4] = lerp(y, dp.y, vis > 0.05 ? 1 : 0); sp[i * 6 + 5] = lerp(z, dp.z, vis > 0.05 ? 1 : 0);
      }
      O.commit(); segGeo.attributes.position.needsUpdate = true;
      const cvm = cvAll / N;
      segMat.opacity = 0.3 * clamp(fan / 0.2) * (1 - clamp(cvm * 1.5));
      docs.forEach((m, d) => { const a = clamp(act[d] / (N / NDOC)); m.material.color.setScalar(0.35 + 0.75 * a + 0.1 * (1 - cvm)); });
      st.cv = cvm; st.write = write;
      const won = converge >= 0;
      Wr.visible = won; WrF.visible = won;
      if (won) { const p = clamp(converge / 0.15); const sc = 0.12 + 0.26 * p + 0.12 * Math.exp(-Math.max(0, converge - 0.15) / 0.08) * (converge > 0.15 ? 1 : 0);
        Wr.scale.setScalar(sc); Wr.userData.setGlow(4 + 8 * p + (write >= 0 ? 4 * Math.exp(-write / 0.1) : 0)); WrF.userData.set(1.2 + 2.2 * p, C.ivory); }
      wl.userData.reveal(write >= 0 ? ease.out(clamp(write / 0.08)) : 0); wl.visible = write >= 0;
      if (write >= 0) wl.userData.set(3 + 5 * Math.exp(-write / 0.15));
      const done = write >= 0.08 ? write - 0.08 : -1;
      cardMat.setEdge(done >= 0 ? C.green : C.ice, W.kl(done >= 0 ? 4 + 5 * Math.exp(-done / 0.12) : 1.6));
      cardMat.setBody(done >= 0 ? C.green : C.card, done >= 0 ? 0.05 + 0.25 * Math.exp(-done / 0.12) : 0.05);
      ring.visible = done >= 0 && done < 0.45;
      if (ring.visible) { const rr = lerp(1.6, 7, ease.expoOut(done / 0.45)); ring.scale.set(rr, 1, rr * 0.75); ring.userData.set(4 * Math.pow(1 - done / 0.45, 1.5)); }
      cardF.userData.set(done >= 0 ? 0.6 + 2.4 * Math.exp(-done / 0.1) : 0, C.green);
    },
    sources() {
      const out = [{ p: [center[0], center[1] + 4, center[2] - 4], c: C.ivory, k: 1.0 * (1 - st.cv), pool: 12, poolK: 0.4, refl: 0.3, size: 8 }];
      if (st.write >= 0.08) out.push({ p: api.cardW, c: C.green, k: 2.5, pool: 4, poolK: 0.9, refl: 0.8, size: 1.5 });
      out.push({ p: api.writerW, c: C.ivory, k: 2.5 * st.cv, pool: 4, poolK: 0.6, refl: 0.8, size: 0.5 });
      return out;
    },
  };
  api.update(0, { fan: 0 });
  return api;
}

/** WRITER MACRO card (camWriterMacro: 85mm (-9,3.2,6) -> (-9,2.6,0)), shared by ii-two-writers (master) and iii-one-writer (mirror):
 *  the stock 3 x 0.5 x 2 card over-fills this 85mm frame (2.5u wide), so the macro card is 1.5 x 0.22 x 1.0, centred at (-9, 2.6, 0),
 *  with a code-strip label on its front face. Hide H.line.group (the card sits in the CODE/REVIEW gap, inside the boxes' depth). */
export const WRITER_CARD = { p: [-9, 2.6, 0], size: [1.5, 0.22, 1.0] };
let _stripTex = null;
export function writerCard(scene) {
  const { p, size } = WRITER_CARD;
  const I = W.cards({ count: 1, size }); scene.add(I.mesh);
  if (!_stripTex) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 76; const g = c.getContext('2d');
    g.fillStyle = 'rgba(10,10,10,0.0)'; g.fillRect(0, 0, 512, 76);
    const r = rand(812); let x = 18;
    g.fillStyle = 'rgba(250,249,245,0.9)'; g.fillRect(x, 30, 46, 14); x += 58;
    while (x < 470) { const w = 8 + r() * 46; g.fillStyle = ['rgba(250,249,245,0.55)', 'rgba(255,210,160,0.7)', 'rgba(207,227,242,0.5)'][Math.floor(r() * 3)]; g.fillRect(x, 32, w, 10); x += w + 7; }
    g.fillStyle = 'rgba(250,249,245,0.8)'; g.fillRect(486, 22, 6, 32);
    _stripTex = new THREE.CanvasTexture(c); _stripTex.colorSpace = THREE.SRGBColorSpace; _stripTex.anisotropy = 8;
  }
  const label = new THREE.Mesh(new THREE.PlaneGeometry(size[0] * 0.92, size[1] * 0.62), new THREE.MeshBasicMaterial({ map: _stripTex, transparent: true, depthWrite: false, toneMapped: false, color: W.hcol(0xffffff, 0.5) }));
  label.position.set(p[0], p[1], p[2] + size[2] / 2 + 0.003); scene.add(label);
  return { I, label, p, size, top: p[1] + size[1] / 2, front: p[2] + size[2] / 2, back: p[2] - size[2] / 2 };
}
