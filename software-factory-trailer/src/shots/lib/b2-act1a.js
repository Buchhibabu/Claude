// Batch b2-act1a helpers (shots 9-19, Act I): hall atmosphere (volumetric skylights, a pool of light at the one station,
// layered haze cards, dust motes, rim lights on the pillars, wet-floor sources), 2D<->3D anchoring (type locked onto an
// in-world plane with a CSS homography), and a few small shot props. Wraps lib/world.js; never edits it.
import { rand, clamp, lerp, ease } from '../../engine.js';
import * as W from './world.js';
const { THREE, G } = W;
export { W, THREE, G };

const FOG_V = 'varying float vFogDepth;';
const FOG_F = `uniform vec3 fogColor; uniform float fogDensity; varying float vFogDepth;
  float fogF(){ return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth); }`;
const withFog = (u) => THREE.UniformsUtils.merge([THREE.UniformsLib.fog, u]);
const addBlend = (m) => { m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor; m.blendEquation = THREE.AddEquation; return m; };

// ----------------------------------------------------------------------------------------- haze cards
// A large vertical plane of drifting low haze (value noise), additive, fogged, fades near the lens. Bottom-heavy band:
// stack 3-5 at different depths across the aisle for atmospheric perspective (each layer lifts what is behind it).
export function hazeCard({ w = 220, h = 40, color = W.C.steel, k = 0.05, noise = 0.8, seed = 0, band = 0.45, top = 0.0, near = [6, 40] } = {}) {
  const mat = addBlend(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
    uniforms: withFog({ uCol: { value: new THREE.Color(color).multiplyScalar(k) }, uT: { value: 0 }, uSeed: { value: seed }, uNoise: { value: noise }, uBand: { value: band }, uTop: { value: top }, uNear: { value: new THREE.Vector2(near[0], near[1]) } }),
    vertexShader: `varying vec2 vUv; ${FOG_V} void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uT; uniform float uSeed; uniform float uNoise; uniform float uBand; uniform float uTop; uniform vec2 uNear; varying vec2 vUv; ${FOG_F}
      float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 17.0) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), f.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), f.x), f.y); }
      void main(){
        vec2 p = vUv * vec2(7.0, 1.6) + vec2(uT * 0.06 + uSeed * 3.7, -uT * 0.015);
        float n = 0.55 * vn(p) + 0.3 * vn(p * 2.2 + 4.1 + uT * 0.04) + 0.15 * vn(p * 5.3 + 1.7);
        float b = exp(-pow(max(vUv.y - uTop, 0.0) / uBand, 2.0));
        float sx = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
        float a = b * sx * mix(1.0, n * 1.7, uNoise);
        a *= (1.0 - 0.55 * fogF()) * smoothstep(uNear.x, uNear.y, vFogDepth);
        gl_FragColor = vec4(uCol * a, 1.0); }`,
  }));
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.frustumCulled = false;
  mesh.userData.set = (kk, hex = color) => mat.uniforms.uCol.value.set(hex).multiplyScalar(kk);
  mesh.userData.tick = (t) => { mat.uniforms.uT.value = t; };
  return mesh;
}

// ----------------------------------------------------------------------------------------- motes
// Soft dust motes inside a box (or a cone under a light). Drift is a pure function of t. size in world u.
export function motes({ count = 600, box = [[-10, 0, -10], [10, 20, 10]], cone = null, color = W.C.ice, k = 0.6, size = 0.12, seed = 5, rise = 0.25, sway = 0.5 } = {}) {
  const r = rand(seed);
  const base = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    if (cone) { // cone = { c:[x,yTop,z], rTop, rBot, h } light cone pointing down
      const v = r(); const rad = lerp(cone.rTop, cone.rBot, v) * Math.sqrt(r()) * 0.95; const a = r() * Math.PI * 2;
      base[i * 4] = cone.c[0] + Math.cos(a) * rad; base[i * 4 + 1] = cone.c[1] - v * cone.h; base[i * 4 + 2] = cone.c[2] + Math.sin(a) * rad;
    } else {
      base[i * 4] = lerp(box[0][0], box[1][0], r()); base[i * 4 + 1] = lerp(box[0][1], box[1][1], r()); base[i * 4 + 2] = lerp(box[0][2], box[1][2], r());
    }
    base[i * 4 + 3] = r();
  }
  const P = G.particles({ count, spread: [0, 0, 0], color, size, seed, opacity: 1 });
  P.points.frustumCulled = false;
  P.material.color.set(color).multiplyScalar(k);
  const pos = P.positions;
  const ylo = cone ? cone.c[1] - cone.h : box[0][1], yhi = cone ? cone.c[1] : box[1][1], span = Math.max(0.01, yhi - ylo);
  P.tick = (t) => {
    for (let i = 0; i < count; i++) {
      const ph = base[i * 4 + 3] * 40;
      pos[i * 3] = base[i * 4] + Math.sin(t * 0.37 + ph) * sway;
      pos[i * 3 + 1] = ylo + ((((base[i * 4 + 1] - ylo + t * rise * (0.4 + base[i * 4 + 3])) % span) + span) % span);
      pos[i * 3 + 2] = base[i * 4 + 2] + Math.cos(t * 0.29 + ph * 1.3) * sway;
    }
    P.geometry.attributes.position.needsUpdate = true;
  };
  P.set = (kk, hex = color) => P.material.color.set(hex).multiplyScalar(kk);
  return P;
}

// ----------------------------------------------------------------------------------------- hall atmosphere
// Adds to a W.hall: a cold top-light cone + floor pool on the CODE station, slanting skylight shafts through the aisle
// (each with a floor pool, a wet-floor streak and a point light that rims the nearest pillars), haze cards, dust in
// the cone, a cold back light that rims pillar faces, and lifts the fog colour slightly so dark masses silhouette.
// atmo(scene, H, { station, shafts:[{x, z, from:[dx,dy,dz], r, k, op}], haze:[{x, z, ry, w, h, k}], fogColor }) -> { update(lt, t, opts) }
export function atmo(scene, H, {
  station = true, stationK = 1, stationTop = 70, coneR = [1.2, 13], stationPos = [-19.6, 0, 0.5],
  shafts = [], haze = [], fogColor = 0x080c11, backLight = 0.5, motesN = 260, near = null, poolK = 1,
} = {}) {
  const grp = new THREE.Group(); scene.add(grp);
  if (fogColor !== null) { scene.fog.color.set(fogColor); scene.background.set(fogColor); }
  // cold back light from the far end of the hall (+x, high): rims the pillar faces that the aisle camera sees edge-on
  const back = new THREE.DirectionalLight(0x9fc3e0, backLight); back.position.set(220, 140, -40); grp.add(back);
  const out = { group: grp, shafts: [], haze: [], lights: [], motes: null, cone: null, sources: [] };
  if (station) {
    const [sx, , sz] = stationPos;
    const cone = W.shaft({ rTop: coneR[0], rBot: coneR[1], h: stationTop, color: 0xd8e8f5, k: 1.0, opacity: 0.22, top: 0.25, bottom: 1.0, apexFade: 0.12 });
    cone.position.set(sx, stationTop / 2, sz); grp.add(cone); out.cone = cone;
    const lamp = W.glowMesh(new THREE.CylinderGeometry(1.4, 1.6, 0.4, 24), 0xdfeaf5, 3, { shade: 'flat', radius: 1.5 });
    lamp.position.set(sx, stationTop + 0.2, sz); grp.add(lamp); out.lamp = lamp;
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.9, 1.4, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide }));
    shade.position.set(sx, stationTop + 0.9, sz); grp.add(shade);
    const cable = W.fat([[sx, stationTop + 1.6, sz], [sx, stationTop + 160, sz]], { color: W.C.steel, k: 0.5, width: 1.2 }); grp.add(cable);
    const pl = new THREE.PointLight(0xcfe3f2, 60 * stationK, 40, 1.4); pl.position.set(sx, 14, sz + 2); grp.add(pl); out.lights.push(pl);
    out.motes = motes({ count: motesN, cone: { c: [sx, stationTop * 0.6, sz], rTop: coneR[0] + (coneR[1] - coneR[0]) * 0.4, rBot: coneR[1] * 0.9, h: stationTop * 0.6 }, color: 0xdfeaf5, k: 0.35, size: 0.12, seed: 51 });
    grp.add(out.motes.points);
    out.sources.push({ p: [sx, 6, sz], c: 0xcfe3f2, k: 2.2 * stationK * poolK, pool: 9, poolK: 1.1, refl: 0.0, size: 4 });
    out.sources.push({ p: [sx, 20, sz], c: 0xcfe3f2, k: 2.0 * stationK, pool: 0, refl: 1.4, size: 4 });
  }
  shafts.forEach((s, i) => {
    const from = [s.x + (s.from ? s.from[0] : 30), s.from ? s.from[1] : 240, s.z + (s.from ? s.from[2] : 70)];
    const to = [s.x, 0, s.z];
    const sh = W.shaft({ rTop: s.rTop ?? 2.5, rBot: s.r ?? 7, h: 100, color: s.color ?? 0xbcd4e8, k: s.k ?? 1, opacity: s.op ?? 0.12, top: 0.35, bottom: 1.0, apexFade: 0.05 });
    W.aimShaft(sh, from, to); grp.add(sh); out.shafts.push(sh);
    if (s.light !== false) { const pl = new THREE.PointLight(0xb8d0e6, (s.lightK ?? 30), 55, 1.2); pl.position.set(s.x, 6, s.z); grp.add(pl); out.lights.push(pl); }
    out.sources.push({ p: [s.x, 0.5, s.z], c: 0xbcd4e8, k: (s.poolK ?? 1.2) * poolK, pool: (s.r ?? 7) * 0.8, poolK: 0.9, refl: 0, size: 3 });
    out.sources.push({ p: [lerp(to[0], from[0], 0.08), lerp(to[1], from[1], 0.08), lerp(to[2], from[2], 0.08)], c: 0xbcd4e8, k: s.reflK ?? 0.7, pool: 0, refl: 0.8, size: (s.r ?? 7) * 0.7 });
  });
  haze.forEach((hz, i) => {
    const m = hazeCard({ w: hz.w ?? 220, h: hz.h ?? 40, color: hz.color ?? W.C.steel, k: hz.k ?? 0.05, seed: i * 1.37 + 0.5, band: hz.band ?? 0.45, near: hz.near ?? [6, 40] });
    m.position.set(hz.x, (hz.h ?? 40) / 2 + (hz.y ?? 0), hz.z ?? 0); m.rotation.y = hz.ry ?? -Math.PI / 2; grp.add(m); out.haze.push(m);
  });
  if (near) { out.near = motes(near); grp.add(out.near.points); }
  out.update = (lt, t, { stationK: sk = 1, shaftK = 1, hazeK = 1 } = {}) => {
    if (out.motes) out.motes.tick(t);
    if (out.near) out.near.tick(t);
    out.haze.forEach((m) => m.userData.tick(t));
    if (out.cone) { out.cone.userData.set(1.0 * sk, 0.22 * Math.min(1, sk)); out.lamp.userData.setGlow(3 * sk); }
    out.shafts.forEach((sh, i) => sh.userData.set(undefined, (shafts[i].op ?? 0.12) * shaftK));
    out.lights.forEach((pl, i) => { pl.userData.base ??= pl.intensity; pl.intensity = pl.userData.base * (i === 0 && station ? sk : shaftK); });
    out.motes && out.motes.set(0.35 * sk);
    H.extra.length = 0;
    out.sources.forEach((s, i) => H.extra.push({ ...s, k: s.k * (station && i < 2 ? sk : shaftK) }));
  };
  return out;
}

// ----------------------------------------------------------------------------------------- 2D <-> 3D
const _v = new THREE.Vector3();
/** world point -> [px, py] in the 1920x1080 frame (call camera.updateMatrixWorld() first). */
export function project(camera, p) { _v.set(p[0], p[1], p[2]).project(camera); return [(_v.x + 1) * 960, (1 - _v.y) * 540, _v.z]; }
/** CSS matrix3d mapping a w x h element (top-left origin) onto the screen quad p0 (TL), p1 (TR), p2 (BR), p3 (BL). */
export function quadMatrix(w, h, [p0, p1, p2, p3]) {
  const [x0, y0] = p0, [x1, y1] = p1, [x2, y2] = p2, [x3, y3] = p3;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a, b, c, d, e, f, g, hh;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) { a = x1 - x0; b = x3 - x0; c = x0; d = y1 - y0; e = y3 - y0; f = y0; g = 0; hh = 0; }
  else {
    const det = dx1 * dy2 - dx2 * dy1; g = (dx3 * dy2 - dx2 * dy3) / det; hh = (dx1 * dy3 - dx3 * dy1) / det;
    a = x1 - x0 + g * x1; b = x3 - x0 + hh * x3; c = x0; d = y1 - y0 + g * y1; e = y3 - y0 + hh * y3; f = y0;
  }
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((x) => +x.toFixed(9)).join(',')})`;
}
/** Lock a DOM element (w x h px, absolutely positioned at 0,0) onto a world-space rectangle: origin = top-left corner, ax/ay = world
 *  vectors along the element's x (right) and y (down) for its full width/height. */
export function pinToPlane(el, camera, w, h, origin, ax, ay) {
  const o = origin, pt = (u, v) => project(camera, [o[0] + ax[0] * u + ay[0] * v, o[1] + ax[1] * u + ay[1] * v, o[2] + ax[2] * u + ay[2] * v]);
  el.style.transform = quadMatrix(w, h, [pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)]);
}

// Soft dark scrim behind type (the "-0.8 stop" rule), a radial ellipse.
export function scrim(K, root, { x = 960, y = 540, w = 1500, h = 420, a = 0.55 } = {}) {
  return K.el('div', { style: { position: 'absolute', left: x - w / 2 + 'px', top: y - h / 2 + 'px', width: w + 'px', height: h + 'px', background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${a * 0.6}) 45%, rgba(0,0,0,0) 100%)`, pointerEvents: 'none' } }, root);
}
// Whisper / source tag style (JetBrains Mono caps 30px, +0.18em, ice at 80%).
export const WHISPER = { fontFamily: 'var(--mono)', fontWeight: 500, fontSize: '30px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(207,227,242,0.85)' };
export const MONO = { fontFamily: 'var(--mono)', fontWeight: 500, letterSpacing: '0', color: '#FAF9F5' };

// ----------------------------------------------------------------------------------------- props
// A screen canvas for the macro shots: rows of ice code bars (seeded) + a typed region left blank + a clay light spill.
// screenPanel({ w, h, rows, seed }) -> mesh with userData.draw({ lines (rows revealed 0..1), alpha, spill:[u,v,k], blank:[v0,v1], stream })
export function screenPanel({ w = 6, h = 3.4, px = 1024, rows = 10, seed = 3, rowH = null } = {}) {
  const r = rand(seed);
  const R = Array.from({ length: rows }, () => { const n = 2 + Math.floor(r() * 5); let x = Math.floor(r() * 4) * 0.035; return Array.from({ length: n }, () => { const bw = 0.03 + r() * 0.14; const o = [x, bw, Math.floor(r() * 5)]; x += bw + 0.018; return o; }); });
  const pal = ['207,227,242', '207,227,242', '143,170,192', '232,230,223', '91,122,147'];
  const st = { lines: 1, alpha: 0.4, spill: null, blank: null, glyphs: 1 };
  const mesh = G.canvasPlane({ w, h, px, glow: true, draw: (g, cw, ch) => {
    g.fillStyle = '#050506'; g.fillRect(0, 0, cw, ch);
    const grd = g.createLinearGradient(0, 0, cw, ch); grd.addColorStop(0, 'rgba(91,122,147,0.10)'); grd.addColorStop(0.5, 'rgba(91,122,147,0.0)'); grd.addColorStop(1, 'rgba(91,122,147,0.06)');
    g.fillStyle = grd; g.fillRect(0, 0, cw, ch);
    const lh = rowH ? rowH / h * ch : ch / (rows + 1.5);
    const n = Math.floor(rows * st.lines + 1e-6);
    for (let i = 0; i < n; i++) {
      const y = lh * (i + 1);
      if (st.blank && y > st.blank[0] * ch && y < st.blank[1] * ch) continue;
      for (const [x, bw, c] of R[i]) { if (x + bw > st.glyphs * 1.2) break; g.fillStyle = `rgba(${pal[c]},${(st.alpha * (0.55 + 0.45 * ((i * 7 + c) % 3) / 2)).toFixed(3)})`; g.fillRect(cw * (0.05 + x), y - lh * 0.2, cw * bw, lh * 0.4); }
    }
    if (st.spill) { const [u, v, k] = st.spill; if (k > 0.001) { const gr = g.createRadialGradient(u * cw, v * ch, 0, u * cw, v * ch, cw * 0.22); gr.addColorStop(0, `rgba(217,119,87,${(0.35 * k).toFixed(3)})`); gr.addColorStop(1, 'rgba(217,119,87,0)'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch); } }
    g.strokeStyle = 'rgba(91,122,147,0.5)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, cw - 3, ch - 3);
  } });
  mesh.userData.state = st;
  mesh.userData.draw = (o = {}) => { Object.assign(st, o); mesh.userData.redraw(0); };
  return mesh;
}

// Faint dead-brass stone courses on the UNLIT foreman's front faces (every 4.5u horizontally, joints every 12u: the same
// pattern its lit shader traces later), so the wall reads as monumental masonry in the plants. foremanCourses({ k, color, tiers })
export function foremanCourses({ k = 0.25, color = W.C.deadBrass, tiers = 4, width = 1.0 } = {}) {
  const T = [[60, 0, 18], [48, 18, 36], [37, 36, 54], [27, 54, 74]].slice(0, tiers);
  const pairs = [];
  for (const [h, y0, y1] of T) {
    const z = -200 + h + 0.08;
    for (let y = Math.ceil(y0 / 4.5) * 4.5; y < y1 - 0.5; y += 4.5) if (y > y0 + 0.5) pairs.push([[-h, y, z], [h, y, z]]);
    for (let x = Math.ceil(-h / 12) * 12; x < h; x += 12) if (x > -h + 1 && x < h - 1) pairs.push([[x, y0, z], [x, y1, z]]);
  }
  const seg = W.glowSegs(pairs, { color, k, width });
  return seg;
}
// Soft additive halo card (backlight spill behind a silhouette). halo({ w, h, color, k }) -> mesh facing +z; userData.set(k)
export function halo({ w = 3, h = 3, color = W.C.ice, k = 0.5, fog = true } = {}) {
  const mat = addBlend(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog,
    uniforms: withFog({ uCol: { value: new THREE.Color(color).multiplyScalar(k) } }),
    vertexShader: `varying vec2 vUv; ${FOG_V} void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; varying vec2 vUv; ${FOG_F}
      void main(){ vec2 q = (vUv - 0.5) * 2.0; float r2 = dot(q, q); float a = exp(-r2 * 3.2) * (1.0 - smoothstep(0.55, 1.0, r2)); gl_FragColor = vec4(uCol * a * (1.0 - fogF()), 1.0); }`,
  }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.userData.set = (kk, hex = color) => mat.uniforms.uCol.value.set(hex).multiplyScalar(kk);
  return m;
}

// ----------------------------------------------------------------------------------------- MONTH gate FPV runs (i-gate-1 / i-gate-2)
// World-fixed dust rendered as short streaks along the flight axis (reads as speed even with 2-sample motion blur).
export function speedDust({ count = 240, win = 72, y = [0.15, 11], z = [-13, 13], color = W.C.ice, k = 0.6, seed = 17 } = {}) {
  const r = rand(seed);
  const base = Array.from({ length: count }, () => [r() * win, lerp(y[0], y[1], Math.pow(r(), 1.6)), lerp(z[0], z[1], r()), 0.4 + r() * 0.6]);
  const I = G.instanced({ count, geometry: new THREE.BoxGeometry(1, 1, 1), basic: true, color: 0xffffff, additive: true });
  I.mesh.renderOrder = 5;
  return {
    mesh: I.mesh,
    update(camX, speed) {
      const len = Math.max(0.05, speed * 0.045);
      for (let i = 0; i < count; i++) {
        const [bx, by, bz, kk] = base[i];
        const x = camX - 4 + ((((bx - camX) % win) + win) % win);
        const d = Math.hypot(x - camX, by - 1, bz);
        const near = clamp((d - 1.2) / 3) * (1 - clamp((d - 30) / 30));
        I.set(i, { p: [x, by, bz], s: [len, 0.014, 0.014], c: color, k: k * kk * near });
      }
      I.commit();
    },
  };
}
// A hanging counter placard for a gate opening (the shared gate counter is wider than the opening): dark brass plate, brass outline,
// ivory text, two hanger wires up to the lintel. Faces -x (the approaching FPV).
export function gateSign(text, { x, y = 4.6, w = 8.6, h = 2.4, cap = 1.25 } = {}) {
  const g = new THREE.Group(); g.position.set(x - 0.2, y, 0); g.rotation.y = -Math.PI / 2;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), W.edgeStd({ color: W.C.brassDark, metal: 0.85, rough: 0.35, edge: W.C.brassHi, edgeK: W.kl(3) * 0.3, edgeW: 1.4 }));
  plate.position.z = -0.08; g.add(plate);
  const ol = W.glowSegs(W.boxEdgePairs([0, 0, -0.08], [w, h, 0.12]), { color: W.C.brassHi, k: 1.6, width: 1.3 }); g.add(ol);
  const txt = W.text3D(text, { height: cap, color: W.C.ivory, k: 0.82, font: '800 160px "Inter Tight"', letterSpacing: 6 });
  txt.position.z = 0.01; g.add(txt);
  const wires = W.glowSegs([[[-w * 0.35, h / 2, -0.08], [-w * 0.35, 14 - y - 0.6, -0.08]], [[w * 0.35, h / 2, -0.08], [w * 0.35, 14 - y - 0.6, -0.08]]], { color: W.C.brassMid, k: 0.8, width: 1 });
  g.add(wires);
  return { group: g, text: txt, set(k) { txt.userData.set(0.82 * k); } };
}
/** FPV camera along the approach rail: x from the shared camGateFPV law (pass gate n at its spec time), y 1, with a pitch curve (deg) and roll. */
export function gateCam(camera, lt, n, { pitch = 0, roll = 0, y = 1.0 } = {}) {
  const sp = [1, 1.3, 1.7, 2.2, 3][n - 1] * 16, tp = [0.75, 0.5, 0.5, 0.5, 0.25][n - 1], gx = W.GATE_X[n - 1];
  const x = gx + sp * (lt - tp);
  const p = THREE.MathUtils.degToRad(pitch);
  W.camLook(camera, [x, y, 0], [x + 40 * Math.cos(p), y + 40 * Math.sin(p), 0], W.FOV[14], { roll });
  return { x, speed: sp };
}
/** Build the gate-run set: dark hall + 5 gates (pips per shot) + the CODE station glowing far ahead (beacon cone + tower) + haze + dust. */
export function gateRun(scene, { pips = [1, 0, 0, 0, 0], sign = null, tower = 10 } = {}) {
  const H = W.hall(scene, { state: 'dark', parts: { gates: true, tower: true, cursor: true } });
  H.gates.gates.forEach((g) => { if (g.counter) g.counter.visible = false; });
  let S = null;
  if (sign) { S = gateSign(sign.text, { x: W.GATE_X[sign.gate - 1] }); scene.add(S.group); }
  const A = atmo(scene, H, {
    stationTop: 46, coneR: [0.8, 12], stationPos: [-19.6, 0, 0],
    shafts: [{ x: -228, z: -14, r: 6, op: 0.14, from: [20, 220, 70] }, { x: -192, z: 12, r: 6, op: 0.12, from: [20, 220, 70] }, { x: -150, z: -16, r: 7, op: 0.12, from: [20, 220, 70] }, { x: -100, z: 10, r: 8, op: 0.1, from: [20, 220, 70], light: false }],
    haze: [{ x: -200, w: 120, h: 22, k: 0.03 }, { x: -150, w: 130, h: 26, k: 0.04 }, { x: -90, w: 150, h: 32, k: 0.05 }, { x: -30, w: 200, h: 44, k: 0.06 }],
    motesN: 200,
  });
  const beacon = W.flare({ color: W.C.clay, k: 3, size: 34, ref: 0.12 }); beacon.position.set(-19.6, 5, 0); scene.add(beacon);
  const dust = speedDust({}); scene.add(dust.mesh);
  return {
    H, A, S, dust,
    update(lt, t, cam, { towerN = tower, beaconK = 3 } = {}) {
      H.gates.update(lt, { pips, k: 2.2 });
      H.tower.update(lt, { count: towerN, k: 10, t });
      H.cursor.update(lt, { on: W.blink(t, { div: 2 }), k: 10 });
      H.foreman.update(lt, { lit: 0, rimColor: W.C.steel, rimK: 0.0 });
      beacon.userData.set(beaconK);
      dust.update(cam.x, cam.speed);
      A.update(lt, t, {});
      W.GATE_X.forEach((gx) => H.extra.push({ p: [gx, 8, 0], c: W.C.brassHi, k: 1.1, pool: 0, refl: 1.0, size: 7 }));
      H.extra.push({ p: [-19.6, 5, 0], c: W.C.clay, k: 5, pool: 0, refl: 1.4, size: 3 });
      H.update(lt, { sky: 1.6, pillarK: 0.55 });
    },
  };
}
