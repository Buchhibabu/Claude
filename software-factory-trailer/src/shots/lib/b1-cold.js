// =====================================================================================================
// b1-cold — COLD OPEN set pieces (shots 1-8) built on top of lib/world.js.
//   import * as B from './lib/b1-cold.js';
// Everything is deterministic (seeded at build time) and posed from lt / global t inside update().
// Exports are reusable by the peak bookends (p-bookend-rail / p-bookend-cascade / p-bookend-foreman) so those can
// re-render these exact frames "now clear and warm" with the same world.js camera functions.
// =====================================================================================================
import { rand, clamp, lerp, ease } from '../../engine.js';
import * as W from './world.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
const { THREE, G, C } = W;

// ----------------------------------------------------------------------------------------- shader bits (fog-aware)
const FOG_V = 'varying float vFogDepth;';
const FOG_F = `uniform vec3 fogColor; uniform float fogDensity; varying float vFogDepth;
  float fogF(){ return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth); }`;
const withFog = (u) => THREE.UniformsUtils.merge([THREE.UniformsLib.fog, u]);
const additive = (m) => { m.transparent = true; m.depthWrite = false; m.blending = THREE.CustomBlending; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor; m.blendEquation = THREE.AddEquation; return m; };
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// =====================================================================================================
// SPARK RAIL (c-rail-streak / p-bookend-rail). camColdRail is an 85mm macro 0.3u over the rail: the visible rail runs only ~1.2..4.2u
// ahead of the lens, so the "orb" is a macro spark (r 0.045) riding the rail top, overtaking the camera at 30 u/s (6 u/s relative):
// it crosses the frame from the left third (d 1.55u) to the top-right exit in 0.5 s. A brass bar rail with glinting edges, a hot
// filament that the spark leaves burning on the rail (white -> clay -> ember decay), a 4u comet smear, an anamorphic lens streak,
// 300 wake sparks thrown off it (drawn as velocity streaks), sleepers whipping under the lens, near-lens dust bokeh.
// sparkRail() -> { group, sparkX(lt), sources:[...], update(lt, { k=12, d0=1.55, rel=6, hot=1, t }) }
// =====================================================================================================
export function sparkRail({ seed = 901, z = 20, y = 0.08 } = {}) {
  const group = new THREE.Group();
  const top = y + 0.035;   // rail top face
  // rail bar: dark brass body, glinting brass edges
  const railMat = W.edgeStd({ color: C.brassDark, metal: 0.9, rough: 0.32, edge: C.brassHi, edgeK: W.kl(1.4), edgeW: 1.8 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(400, 0.07, 0.05), railMat); rail.position.set(0, y, z); group.add(rail);
  // hot filament on the rail top: lit behind the spark, decaying with distance (shader driven by the spark x)
  const filU = withFog({ uSX: { value: 0 }, uK: { value: 1 }, uL: { value: 2.2 }, uHot: { value: new THREE.Color(0xfff1dc) }, uMid: { value: new THREE.Color(C.clay) }, uLow: { value: new THREE.Color(C.ember) } });
  const filMat = additive(new THREE.ShaderMaterial({
    fog: true, uniforms: filU,
    vertexShader: `varying float vX; varying vec2 vUv; ${FOG_V} void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vX = w.x; vec4 mv = viewMatrix * w; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uSX; uniform float uK; uniform float uL; uniform vec3 uHot; uniform vec3 uMid; uniform vec3 uLow; varying float vX; varying vec2 vUv; ${FOG_F}
      void main(){ float b = uSX - vX; if (b < -0.02) discard;
        float e = exp(-max(b, 0.0) / uL); float h = exp(-max(b, 0.0) / 0.18);
        vec3 c = mix(mix(uLow * 0.6, uMid, e), uHot, h) * (0.12 + e * 1.0 + h * 1.4) * uK;
        float side = 1.0 - pow(abs(vUv.y - 0.5) * 2.0, 2.0);
        gl_FragColor = vec4(c * (0.55 + 0.45 * side) * (1.0 - fogF()) * smoothstep(1.1, 2.2, vFogDepth), 1.0); }`,
  }));
  const fil = new THREE.Mesh(new THREE.BoxGeometry(400, 0.004, 0.016), filMat); fil.position.set(0, top + 0.003, z); group.add(fil);
  // comet smear: tapered cone along -x from the spark (4u), additive, white core -> clay -> ember
  const smGeo = new THREE.CylinderGeometry(0.0, 1, 1, 20, 24, true); smGeo.rotateZ(Math.PI / 2); smGeo.translate(-0.5, 0, 0);   // apex at -x (tail), base (r 1) at x 0
  const smU = withFog({ uK: { value: 1 }, uHot: { value: new THREE.Color(0xfff1dc) }, uMid: { value: new THREE.Color(C.clay) }, uLow: { value: new THREE.Color(C.ember) } });
  const smear = new THREE.Mesh(smGeo, additive(new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: smU,
    vertexShader: `varying float vU; varying vec3 vN; varying vec3 vV; ${FOG_V}
      void main(){ vU = position.x + 1.0; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uK; uniform vec3 uHot; uniform vec3 uMid; uniform vec3 uLow; varying float vU; varying vec3 vN; varying vec3 vV; ${FOG_F}
      void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
        float u = clamp(vU, 0.0, 1.0);
        vec3 c = mix(mix(uLow, uMid, smoothstep(0.0, 0.6, u)), uHot, smoothstep(0.75, 1.0, u));
        float a = f * pow(u, 1.6) * uK;
        gl_FragColor = vec4(c * a * (1.0 - fogF()) * smoothstep(1.0, 1.6, vFogDepth), 1.0); }`,
  })));
  smear.frustumCulled = false; group.add(smear);
  // the spark: white-hot core + clay halo flare + anamorphic streak
  const core = W.glowMesh(new THREE.SphereGeometry(1, 16, 12), 0xffe9cc, 12, { radius: 1, max: 1.6 }); core.scale.setScalar(0.03); group.add(core);
  const halo = W.flare({ color: C.clay, k: 6, size: 0.14, ref: 0.08 }); group.add(halo);
  const streak = anamorphic({ color: C.amberRail, k: 2.5, w: 6, h: 0.05 }); group.add(streak);
  // wake sparks: 300 velocity streaks (one draw)
  const N = 300, r = rand(seed);
  const wk = Array.from({ length: N }, (_, i) => ({ tb: -0.7 + (i / N) * 1.25 + r() * 0.004, vx: 30 * (0.15 + r() * 0.55), vy: 0.6 + r() * 3.2, vz: (r() - 0.5) * 3.2, life: 0.25 + r() * 0.55, hot: r() }));
  const segPos = new Float32Array(N * 6), segCol = new Float32Array(N * 6);
  const wakeGeo = new LineSegmentsGeometry();
  const wake = W.glowSegs([[[0, 0, 0], [1, 0, 0]]], { color: 0xffffff, k: 1, width: 1.6, colors: [[1, 1, 1], [1, 1, 1]], offset: false });
  wake.geometry = wakeGeo; wake.frustumCulled = false; group.add(wake);
  // sleepers
  const SL = W.boxes({ count: 200, size: [0.14, 0.05, 1.3], color: 0x0d0c0b, metal: 0.6, rough: 0.4, edgeW: 1.2 });
  for (let i = 0; i < 200; i++) SL.set(i, { p: [-200 + i * 2, 0.025, z], edge: W.lin(C.brassMid, W.kl(0.45)), body: [0, 0, 0] });
  SL.commit(); group.add(SL.mesh);
  // near-lens dust bokeh (soft, out of focus, streams past the tracking camera)
  const dust = G.particles({ count: 160, spread: [60, 1.6, 4.5], center: [-30, 0.95, z + 0.4], color: C.amberRail, size: 0.05, seed: seed + 3, opacity: 0.5 });
  dust.material.color.set(C.amberRail).multiplyScalar(0.35); group.add(dust.points);
  const src = { p: [0, top + 0.05, z], c: C.clay, k: 8, pool: 0, poolK: 0, refl: 1.1, size: 0.05 };
  const src2 = { p: [0, top, z], c: C.ember, k: 3, pool: 0, poolK: 0, refl: 0.6, size: 0.6 };
  const hot = new THREE.Color(1, 0.93, 0.85), amb = new THREE.Color(C.amberRail), emb = new THREE.Color(C.ember);
  const api = {
    group, core, halo, streak, smear, wake, sources: [src], rail, top,
    sparkX: (lt, { d0 = 1.55, rel = 6 } = {}) => -60 + 24 * lt + d0 + rel * lt,
    update(lt, { k = 12, d0 = 1.55, rel = 6, hot: hk = 1, smearLen = 4, t = lt } = {}) {
      const sx = api.sparkX(lt, { d0, rel }), sy = top + 0.03;
      const flick = 0.85 + 0.15 * Math.sin(t * 91) * Math.sin(t * 37);
      core.position.set(sx, sy, z); core.userData.setGlow(k * flick);
      halo.position.set(sx, sy, z + 0.02); halo.userData.set(k * 0.55 * flick);
      streak.position.set(sx, sy, z + 0.03); streak.userData.set(2.5 * hk * flick);
      smear.position.set(sx, sy, z); smear.scale.set(smearLen, 0.02, 0.02); smU.uK.value = 1.6 * hk;
      filU.uSX.value = sx; filU.uK.value = hk;
      // wake sparks: born at the spark, thrown up/back, gravity + drag; drawn as velocity streaks
      for (let i = 0; i < N; i++) {
        const w = wk[i], a = lt - w.tb, o = i * 6;
        if (a < 0 || a > w.life) { for (let j = 0; j < 6; j++) segPos[o + j] = j === 1 || j === 4 ? -500 : 0; continue; }
        const bx = api.sparkX(w.tb, { d0, rel });
        const dr = Math.exp(-3 * a), dr2 = Math.exp(-3 * Math.max(0, a - 0.03));
        const px = bx + w.vx * (1 - dr) / 3, py = sy + w.vy * (1 - dr) / 3 - 4.9 * a * a, pz = z + w.vz * (1 - dr) / 3;
        const a2 = Math.max(0, a - 0.03);
        const qx = bx + w.vx * (1 - dr2) / 3, qy = sy + w.vy * (1 - dr2) / 3 - 4.9 * a2 * a2, qz = z + w.vz * (1 - dr2) / 3;
        segPos[o] = qx; segPos[o + 1] = Math.max(top - 0.04, qy); segPos[o + 2] = qz; segPos[o + 3] = px; segPos[o + 4] = Math.max(top - 0.04, py); segPos[o + 5] = pz;
        const u = a / w.life, f = Math.pow(1 - u, 1.5) * (0.6 + 0.8 * w.hot) * hk;
        const c = u < 0.3 ? hot.clone().lerp(amb, u / 0.3) : amb.clone().lerp(emb, (u - 0.3) / 0.7);
        for (let j = 0; j < 2; j++) { segCol[o + j * 3] = c.r * f * (j ? 1 : 0.35); segCol[o + j * 3 + 1] = c.g * f * (j ? 1 : 0.35); segCol[o + j * 3 + 2] = c.b * f * (j ? 1 : 0.35); }
      }
      wakeGeo.attributes.instanceStart.data.needsUpdate = true; wakeGeo.attributes.instanceColorStart.data.needsUpdate = true;
      src.p[0] = sx; src.k = k * 0.7;
    },
  };
  // keep the position/colour arrays live (setPositions copies into a new interleaved buffer: rebind ours)
  rebindSegs(wakeGeo, segPos, segCol);
  api.update(0);
  return api;
}
// LineSegmentsGeometry copies arrays into its own interleaved buffers; point them at our live arrays so per-frame writes are cheap.
function rebindSegs(geo, pos, col) {
  const ib = new THREE.InstancedInterleavedBuffer(pos, 6, 1);
  geo.setAttribute('instanceStart', new THREE.InterleavedBufferAttribute(ib, 3, 0));
  geo.setAttribute('instanceEnd', new THREE.InterleavedBufferAttribute(ib, 3, 3));
  if (col) {
    const cb = new THREE.InstancedInterleavedBuffer(col, 6, 1);
    geo.setAttribute('instanceColorStart', new THREE.InterleavedBufferAttribute(cb, 3, 0));
    geo.setAttribute('instanceColorEnd', new THREE.InterleavedBufferAttribute(cb, 3, 3));
  }
  geo.instanceCount = pos.length / 6;
}

// Anamorphic lens streak: a wide, thin additive billboard (horizontal gaussian line + soft core). userData.set(k).
let _anaTex = null;
function anaTexture() {
  if (_anaTex) return _anaTex;
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d');
  const img = g.createImageData(512, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 512; x++) {
    const u = (x - 255.5) / 256, v = (y - 31.5) / 32;
    const a = Math.exp(-v * v * 40) * Math.pow(1 - Math.min(1, Math.abs(u)), 2.2) + 0.5 * Math.exp(-(u * u * 900 + v * v * 25));
    const i = (y * 512 + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.min(255, a * 255);
  }
  g.putImageData(img, 0, 0);
  _anaTex = new THREE.CanvasTexture(c);
  return _anaTex;
}
export function anamorphic({ color = C.amberRail, k = 2, w = 6, h = 0.05, fog = true } = {}) {
  const mat = new THREE.SpriteMaterial({ map: anaTexture(), color: W.hcol(color, W.ko(k)), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, transparent: true, fog });
  const s = new THREE.Sprite(mat); s.scale.set(w, h, 1); s.renderOrder = 5;
  s.userData.set = (kk, hex = color) => { mat.color.set(hex).multiplyScalar(W.ko(kk)); s.visible = kk > 0.001; };
  return s;
}

// =====================================================================================================
// CIRCUIT BOARD (c-rail-cascade, c-rewind, bookend). A dense PCB of fine traces (parallel buses with 45-degree jogs) + via pads +
// the world's 1,000 rails, all lighting PER FRAGMENT on the radial front from CODE at 160 u/s (white-hot overshoot -> amber), with
// outward-racing energy pulses, a soft shock ring riding the front, and the same cascade run backwards for the rewind.
// circuitBoard({ origin, radius, buses }) -> { group, maxT, update(lt, { cascade (s since start, <0 off), rewind (s since start, <0 none),
//   k (lit nominal), hotK, pulse (0..1), ring (0..1), t, dim }) }
// =====================================================================================================
export function circuitBoard({ seed = 211, origin = [-19.6, 0, 0], radius = 110, buses = 150, speed = 160, zScale = 0.62, rails: withRails = true, chips: withChips = true } = {}) {
  const group = new THREE.Group();
  const r = rand(seed);
  const segs = [], vias = [];
  const DIR = (k) => { const a = k * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; };
  for (let b = 0; b < buses; b++) {
    const a0 = r() * Math.PI * 2, rr = 3 + Math.pow(r(), 0.85) * radius;
    let cx = origin[0] + Math.cos(a0) * rr, cz = origin[2] + Math.sin(a0) * rr * zScale;
    cx = Math.round(cx * 2) / 2; cz = Math.round(cz * 2) / 2;
    // initial direction: radial outward, quantized; favour x (the line axis)
    let dk = Math.round(Math.atan2(cz - origin[2], cx - origin[0]) / (Math.PI / 4));
    if (r() < 0.45) dk = Math.round(dk / 2) * 2;
    const n = 2 + Math.floor(r() * 7), sp = 0.62;
    const pts = [[cx, cz]];
    const legs = 2 + Math.floor(r() * 3);
    for (let l = 0; l < legs; l++) {
      const [dx, dz] = DIR(dk); const len = 3 + r() * (l === 0 ? 10 : 16);
      const p = pts[pts.length - 1]; pts.push([p[0] + dx * len, p[1] + dz * len]);
      dk += r() < 0.5 ? 1 : -1; if (r() < 0.3) dk += r() < 0.5 ? 1 : -1;
    }
    for (let j = 0; j < n; j++) {
      const off = (j - (n - 1) / 2) * sp;
      const tp = pts.map((p, i) => {
        const a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)];
        let tx = c[0] - a[0], tz = c[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        let mx = -tz, mz = tx; let m = 1;
        if (i > 0 && i < pts.length - 1) { const d1 = [p[0] - a[0], p[1] - a[1]], l1 = Math.hypot(...d1); const n1 = [-d1[1] / l1, d1[0] / l1]; m = 1 / Math.max(0.5, mx * n1[0] + mz * n1[1]); }
        return [p[0] + mx * off * m, p[1] + mz * off * m];
      });
      // trim the start/end of each parallel trace a little (staggered bus ends)
      for (let i = 1; i < tp.length; i++) segs.push([tp[i - 1], tp[i], 0.11 + (j % 3 === 0 ? 0.05 : 0)]);
      if (r() < 0.8) vias.push([tp[tp.length - 1][0], tp[tp.length - 1][1], 0.32 + r() * 0.12]);
      if (r() < 0.5) vias.push([tp[0][0], tp[0][1], 0.3 + r() * 0.1]);
    }
  }
  // IC footprints (dark pads with pin rows) scattered near the core
  const chips = [];
  for (let i = 0; i < (withChips ? 26 : 0); i++) {
    const a = r() * Math.PI * 2, rr = 6 + r() * radius * 0.7;
    const cx = Math.round((origin[0] + Math.cos(a) * rr) * 2) / 2, cz = Math.round((origin[2] + Math.sin(a) * rr * zScale) * 2) / 2;
    const w = 2 + Math.floor(r() * 4) * 1.2, d = 2 + Math.floor(r() * 3) * 1.2;
    chips.push([cx, cz, w, d]);
    const pins = Math.floor(w / 0.6);
    for (let p = 0; p < pins; p++) { vias.push([cx - w / 2 + 0.3 + p * 0.6, cz - d / 2 - 0.35, 0.18]); vias.push([cx - w / 2 + 0.3 + p * 0.6, cz + d / 2 + 0.35, 0.18]); }
  }
  // world rails (the shared 1,000 amber rails), lit by the same per-fragment front
  const big = withRails ? W.railNetwork({ posts: false }).segs : [];
  const U = withFog({
    uO: { value: new THREE.Vector2(origin[0], origin[2]) }, uT: { value: -1 }, uRew: { value: -1 }, uMaxD: { value: 1 }, uSpeed: { value: speed },
    uK: { value: 1 }, uHot: { value: 1 }, uDim: { value: 0.02 }, uTime: { value: 0 }, uPulse: { value: 1 },
    uCol: { value: new THREE.Color(C.amberRail) }, uHotC: { value: new THREE.Color(0xfff0dc) },
  });
  const VS = `attribute float aSeed; attribute float aGain; varying vec3 vW; varying float vSeed; varying float vGain; ${FOG_V}
    void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz; vSeed = aSeed; vGain = aGain; vec4 mv = viewMatrix * w; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`;
  const FS = `uniform vec2 uO; uniform float uT; uniform float uRew; uniform float uMaxD; uniform float uSpeed; uniform float uK; uniform float uHot; uniform float uDim; uniform float uTime; uniform float uPulse;
    uniform vec3 uCol; uniform vec3 uHotC; varying vec3 vW; varying float vSeed; varying float vGain; ${FOG_F}
    void main(){ float d = length(vW.xz - uO);
      float since = uT - d / uSpeed;
      float on = uT < 0.0 ? 0.0 : smoothstep(0.0, 0.05, since);
      float hot = uT < 0.0 ? 0.0 : exp(-max(since, 0.0) / 0.06) * step(0.0, since);
      if (uRew >= 0.0) { float rs = uRew - (uMaxD - d) / uSpeed; float off = smoothstep(0.0, 0.05, rs); on *= 1.0 - off; hot = max(hot * (1.0 - off), exp(-abs(rs) / 0.05) * step(-0.02, rs) * 0.6); }
      float pulse = uPulse * smoothstep(0.7, 0.97, fract((d - uTime * 46.0) / 10.0 + vSeed)) * on;
      vec3 c = uCol * vGain * (uDim + on * uK * (0.5 + 1.8 * pulse)) + uHotC * hot * uHot * vGain;
      gl_FragColor = vec4(mix(c, fogColor, fogF()), 1.0); }`;
  const mat = new THREE.ShaderMaterial({ fog: true, uniforms: U, vertexShader: VS, fragmentShader: FS });
  const mk = (geom, list, place) => {
    const g = geom.clone(); const n = list.length;
    const aSeed = new Float32Array(n), aGain = new Float32Array(n);
    const mesh = new THREE.InstancedMesh(g, mat, n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    list.forEach((it, i) => { const { p, s, ry, gain } = place(it); q.setFromEuler(e.set(0, ry, 0)); m4.compose(v3(p), q, v3(s)); mesh.setMatrixAt(i, m4); aSeed[i] = r(); aGain[i] = gain; });
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1)); g.setAttribute('aGain', new THREE.InstancedBufferAttribute(aGain, 1));
    mesh.frustumCulled = false; group.add(mesh); return mesh;
  };
  const box = new THREE.BoxGeometry(1, 1, 1);
  let maxD = 0;
  const traces = mk(box, segs, ([a, b, w]) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); maxD = Math.max(maxD, Math.hypot(b[0] - origin[0], b[1] - origin[2])); return { p: [(a[0] + b[0]) / 2, 0.03, (a[1] + b[1]) / 2], s: [L + w, 0.03, w], ry: -Math.atan2(dz, dx), gain: 0.55 + r() * 0.5 }; });
  const oct = new THREE.CylinderGeometry(1, 1, 1, 8); oct.rotateY(Math.PI / 8);
  const viaM = mk(oct, vias, ([x, z, s]) => ({ p: [x, 0.035, z], s: [s, 0.04, s], ry: 0, gain: 0.9 }));
  const rails = !big.length ? null : mk(box, big, (sg) => { const cx = clamp(sg.x, -200, 200), cz = clamp(sg.z, -160, 60); maxD = Math.max(maxD, Math.hypot(cx - origin[0], cz - origin[2])); return { p: [cx, 0.04, cz], s: sg.alongX ? [sg.L, 0.08, 0.25] : [0.25, 0.08, sg.L], ry: 0, gain: 1.0 }; });
  // chip bodies: dark slabs with a faint amber edge
  const CH = W.boxes({ count: Math.max(1, chips.length), size: [1, 1, 1], color: 0x0b0a09, metal: 0.5, rough: 0.45, edgeW: 1.2 });
  chips.forEach(([x, z, w, d], i) => CH.set(i, { p: [x, 0.18, z], s: [w, 0.36, d], edge: W.lin(C.amberRail, W.kl(0.2)), body: [0, 0, 0] })); CH.commit(); group.add(CH.mesh);
  U.uMaxD.value = maxD;
  // shock ring riding the front (soft additive annulus on the floor)
  const ringU = withFog({ uO: { value: new THREE.Vector2(origin[0], origin[2]) }, uR: { value: -10 }, uK: { value: 1 }, uCol: { value: new THREE.Color(C.amberRail) }, uHotC: { value: new THREE.Color(0xfff0dc) } });
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(520, 300), additive(new THREE.ShaderMaterial({
    fog: true, uniforms: ringU,
    vertexShader: `varying vec3 vW; ${FOG_V} void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec2 uO; uniform float uR; uniform float uK; uniform vec3 uCol; uniform vec3 uHotC; varying vec3 vW; ${FOG_F}
      void main(){ float d = length(vW.xz - uO); float x = d - uR;
        float ringA = exp(-x * x / 1.2) ; float wake = x < 0.0 ? exp(x / 8.0) * 0.05 : 0.0; float lead = x > 0.0 ? exp(-x / 1.0) * 0.08 : 0.0;
        vec3 c = (uHotC * ringA * 0.45 + uCol * (wake + lead)) * uK;
        gl_FragColor = vec4(c * (1.0 - fogF()), 1.0); }`,
  })));
  ring.rotation.x = -Math.PI / 2; ring.position.set(origin[0], 0.07, origin[2]); ring.renderOrder = 2; group.add(ring);
  // core node at the origin
  const core = W.glowMesh(new THREE.SphereGeometry(1, 20, 14), C.clay, 10, { radius: 1 }); core.scale.setScalar(0.7); core.position.set(origin[0], 0.5, origin[2]); group.add(core);
  const coreFl = W.flare({ color: C.clay, k: 6, size: 14 }); coreFl.position.set(origin[0], 0.8, origin[2]); group.add(coreFl);
  const pads = [1.7, 3.2].map((rr, i) => { const m = G.ring({ r: rr, tube: 0.04, color: C.amberRail, k: 1 }); m.rotation.x = Math.PI / 2; m.position.set(origin[0], 0.06, origin[2]); group.add(m); return m; });
  const maxT = maxD / speed;
  const api = {
    group, maxT, maxD, ring, core, coreFl, traces, rails, vias: viaM, uniforms: U,
    update(lt, { cascade = 99, rewind = -1, k = 6, hotK = 8, pulse = 1, ring: rk = 1, t = lt, dim = 0.03, coreK = 10 } = {}) {
      U.uT.value = cascade; U.uRew.value = rewind; U.uK.value = W.ko(k); U.uHot.value = W.ko(hotK); U.uDim.value = dim; U.uTime.value = t; U.uPulse.value = pulse;
      const R = cascade < 0 ? -10 : cascade * speed;
      ringU.uR.value = R; ringU.uK.value = rk * (cascade < 0 ? 0 : clamp(1.2 - R / 260)) * 1.4;
      ring.visible = rk > 0.001 && cascade >= 0 && R < 300;
      let ck = coreK * (cascade < 0 ? 0 : 1);
      if (rewind >= 0) ck *= clamp(1 - (rewind - maxT) / 0.1);
      const flash = cascade >= 0 ? Math.exp(-cascade / 0.08) * 2 : 0;
      core.userData.setGlow(ck * (1 + flash)); coreFl.userData.set(ck * 0.7 * (1 + flash));
      pads.forEach((m, i) => { const on = cascade >= 0 ? clamp((cascade - i * 0.012) / 0.03) : 0; m.material.color.set(C.amberRail).multiplyScalar(W.ko(2.5) * on * (rewind >= 0 ? clamp(1 - (rewind - maxT) / 0.1) : 1)); });
    },
  };
  api.update(0, { cascade: -1 });
  return api;
}

// =====================================================================================================
// SPEED STREAKS — static world-space dust drawn as soft segments along the travel axis (x). A camera flying +x through them reads
// as warm horizontal smears (the FPV's motion blur). speedStreaks({ count, x0, x1, y:[a,b], z:[a,b], len }) -> LineSegments2
// =====================================================================================================
export function speedStreaks({ count = 500, x0 = -170, x1 = -60, y = [0.15, 4], z = [34, 48], len = [1.2, 3.5], seed = 303, k = 2, width = 1.6, color = C.amberRail } = {}) {
  const r = rand(seed); const pairs = [], cols = [];
  const c1 = new THREE.Color(color), c2 = new THREE.Color(0xfff0dc);
  for (let i = 0; i < count; i++) {
    const x = lerp(x0, x1, r()), yy = lerp(y[0], y[1], Math.pow(r(), 1.6)), zz = lerp(z[0], z[1], r()), L = lerp(len[0], len[1], r());
    pairs.push([[x, yy, zz], [x + L, yy, zz]]);
    const c = c1.clone().lerp(c2, r() * 0.5).multiplyScalar(0.3 + r() * 0.9);
    cols.push([c.r * 0.15, c.g * 0.15, c.b * 0.15], [c.r, c.g, c.b]);
  }
  const s = W.glowSegs(pairs, { color: 0xffffff, k, width, colors: cols, offset: false });
  return s;
}

// =====================================================================================================
// HAZE DECKS — drifting cloud layers (seeded fBm canvas) for high top-downs: they veil the factory ("half revealed") and add
// parallax between the telephoto camera and the floor. hazeDecks({ heights, size, color, opacity }) -> { group, update(lt, { drift }) }
// =====================================================================================================
let _hazeTex = null;
function hazeTexture(seed = 5) {
  if (_hazeTex) return _hazeTex;
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  const r = rand(seed); const grid = (n) => Array.from({ length: n * n }, () => r());
  const oct = [4, 8, 16, 32].map((n) => ({ n, v: grid(n) }));
  const sm = (t) => t * t * (3 - 2 * t);
  const val = ({ n, v }, x, y) => { const fx = x * n, fy = y * n; const ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy);
    const a = v[(iy % n) * n + (ix % n)], b = v[(iy % n) * n + ((ix + 1) % n)], cc = v[((iy + 1) % n) * n + (ix % n)], d = v[((iy + 1) % n) * n + ((ix + 1) % n)];
    return lerp(lerp(a, b, tx), lerp(cc, d, tx), ty); };
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let f = 0, amp = 0.55; for (const o of oct) { f += val(o, x / N, y / N) * amp; amp *= 0.5; }
    const a = clamp((f - 0.42) * 2.4); const i = (y * N + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = a * 255;
  }
  g.putImageData(img, 0, 0);
  _hazeTex = new THREE.CanvasTexture(c); _hazeTex.wrapS = _hazeTex.wrapT = THREE.RepeatWrapping;
  return _hazeTex;
}
export function hazeDecks({ heights = [140, 260, 380], size = 420, color = 0x17110c, glow = 0x3a2614, opacity = 0.55, center = [0, 0] } = {}) {
  const group = new THREE.Group(); const decks = [];
  heights.forEach((h, i) => {
    const tex = hazeTexture().clone(); tex.needsUpdate = true; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.3 + i * 0.4, 1.3 + i * 0.4);
    const mat = new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity: opacity * (1 - i * 0.15), depthWrite: false, fog: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat); m.rotation.x = -Math.PI / 2; m.position.set(center[0], h, center[1]); m.renderOrder = 3; group.add(m);
    const gm = new THREE.MeshBasicMaterial({ map: tex, color: glow, transparent: true, opacity: 0.35, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
    const m2 = new THREE.Mesh(m.geometry, gm); m2.rotation.x = -Math.PI / 2; m2.position.set(center[0], h - 0.5, center[1]); m2.renderOrder = 3; group.add(m2);
    decks.push({ tex, i });
  });
  return { group, update(lt, { drift = 1 } = {}) { decks.forEach(({ tex, i }) => { tex.offset.set(0.01 + lt * 0.012 * drift * (1 + i * 0.6), 0.37 * i - lt * 0.004 * drift); }); } };
}

// =====================================================================================================
// EMBERS — rising sparks / dust (additive points), posed from t. embers({ count, box:[cx,cy,cz,sx,sy,sz], rise, color, k, size })
// =====================================================================================================
export function embers({ count = 600, center = [0, 0, 0], spread = [20, 30, 20], rise = 2, sway = 0.6, color = C.amberRail, k = 1, size = 0.15, seed = 404 } = {}) {
  const P = G.particles({ count, spread: [0, 0, 0], center: [0, 0, 0], color, size, seed });
  const r = rand(seed + 1); const base = Float32Array.from({ length: count * 5 }, () => r());
  P.material.color.set(color).multiplyScalar(k);
  P.points.frustumCulled = false;
  P.update = (t, { k: kk = k, rise: rs = rise } = {}) => {
    for (let i = 0; i < count; i++) {
      const b = i * 5; const sp = rs * (0.5 + base[b + 3]);
      const y = ((base[b + 1] * spread[1] + t * sp) % spread[1]);
      P.positions[i * 3] = center[0] + (base[b] - 0.5) * spread[0] + Math.sin(t * 1.3 + base[b + 4] * 20) * sway;
      P.positions[i * 3 + 1] = center[1] + y;
      P.positions[i * 3 + 2] = center[2] + (base[b + 2] - 0.5) * spread[2] + Math.cos(t * 1.1 + base[b + 4] * 13) * sway;
    }
    P.geometry.attributes.position.needsUpdate = true;
    P.material.color.set(color).multiplyScalar(kk);
  };
  return P;
}

// =====================================================================================================
// AFTERGLOW TRAIL along a path (foreman sweep): dense orbs sampled along a CurvePath; orb i (at arc s_i) glows by how recently the
// sweep head passed it. trail({ path, len (u), count }) -> { mesh, update(head s, { k, decay (u), color0, color1 }) }
// =====================================================================================================
export function trail({ path, count = 260, r = 0.32 } = {}) {
  const I = W.orbs({ count, r, seg: 6 });
  const L = path.getLength();
  const pts = Array.from({ length: count }, (_, i) => path.getPointAt(i / (count - 1)));
  const c0 = W.lin(C.clay), c1 = W.lin(C.ivory);
  return {
    mesh: I.mesh, length: L,
    update(s, { k = 6, decay = 22, head = 4 } = {}) {
      for (let i = 0; i < count; i++) {
        const si = (i / (count - 1)) * L, b = s - si;
        if (b < 0 || b > decay * 4) { I.hide(i); continue; }
        const f = b < head ? 1 : Math.exp(-(b - head) / decay);
        const u = si / L; const c = [lerp(c0[0], c1[0], u), lerp(c0[1], c1[1], u), lerp(c0[2], c1[2], u)];
        I.set(i, { p: [pts[i].x, pts[i].y, pts[i].z], s: 0.6 + 0.4 * f, c, k: k * f });
      }
      I.commit();
    },
  };
}

// =====================================================================================================
// 2D helpers for type cards: soft dark scrim (the "-0.8 stop under the card" rule) behind a text block.
// =====================================================================================================
export function scrim(K, root, { x = 960, y = 540, w = 1500, h = 420, a = 0.55 } = {}) {
  return K.el('div', { style: { position: 'absolute', left: (x - w / 2) + 'px', top: (y - h / 2) + 'px', width: w + 'px', height: h + 'px',
    background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${a * 0.75}) 45%, rgba(0,0,0,0) 100%)`, pointerEvents: 'none' } }, root);
}

// =====================================================================================================
// RAY FAN — crepuscular rays as one big additive billboard (seeded radial streaks + soft core), fog off, depth-tested so a
// silhouette in front cuts them. rayFan({ color, k, size, count, seed }) -> Sprite; userData.set(k), userData.spin(rad)
// =====================================================================================================
const _fanTex = {};
function fanTexture(seed = 9, count = 70) {
  const key = seed + ':' + count; if (_fanTex[key]) return _fanTex[key];
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  const r = rand(seed);
  const rays = Array.from({ length: count }, () => ({ a: r() * Math.PI * 2, w: 0.004 + r() * 0.03, k: 0.25 + r() * 0.75 }));
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = (x - N / 2) / (N / 2), dy = (y - N / 2) / (N / 2), d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    let v = 0;
    for (const ry of rays) { let da = Math.abs(a - ry.a); da = Math.min(da, Math.PI * 2 - da); v += ry.k * Math.exp(-(da * da) / (ry.w * ry.w)); }
    const fall = Math.pow(Math.max(0, 1 - d), 1.6);
    const core = Math.exp(-d * d * 30) * 1.2;
    const val = Math.min(1, (v * 0.55 + 0.12) * fall + core);
    const i = (y * N + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = val * 255;
  }
  g.putImageData(img, 0, 0);
  return (_fanTex[key] = new THREE.CanvasTexture(c));
}
export function rayFan({ color = C.amberRail, k = 2, size = 600, count = 70, seed = 9 } = {}) {
  const mat = new THREE.SpriteMaterial({ map: fanTexture(seed, count), color: W.hcol(color, W.ko(k)), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  const s = new THREE.Sprite(mat); s.scale.set(size, size, 1);
  s.userData.set = (kk, hex = color) => { mat.color.set(hex).multiplyScalar(W.ko(kk)); s.visible = kk > 0.001; };
  s.userData.spin = (rad) => { mat.rotation = rad; };
  return s;
}

// =====================================================================================================
// STATION FLOW — work moving L->R through the 7 lit stations, readable from a high top-down: per station 3 lanes of amber cards
// riding at `speed` u/s (wrapping inside the station footprint, so the stream never leaves the line), with a per-card warm glow.
// stationFlow({ lanes, perLane, skip:[station idx] }) -> { mesh, update(lt, { speed, k, on: [7] 0..1 }) }
// =====================================================================================================
export function stationFlow({ lanes = 3, perLane = 5, skip = [], seed = 515, size = [1.8, 0.25, 1.1] } = {}) {
  const st = W.STATIONS.filter((s) => !skip.includes(s.i));
  const n = st.length * lanes * perLane;
  const I = W.boxes({ count: n, size, color: 0x14100c, metal: 0.2, rough: 0.6, edgeW: 1.1 });
  const r = rand(seed); const ph = Float32Array.from({ length: n }, () => r());
  return {
    mesh: I.mesh, I,
    update(lt, { speed = 6, k = 2.5, on = null, t = lt, body = 0.12 } = {}) {
      let i = 0;
      for (const s of st) {
        const L = s.w - 2.4, lvl = on ? clamp(on[s.i]) : 1;
        for (let l = 0; l < lanes; l++) for (let c = 0; c < perLane; c++, i++) {
          if (lvl <= 0.001) { I.hide(i); continue; }
          const u = ((c / perLane + ph[i] * 0.12 + (t * speed) / L) % 1 + 1) % 1;
          const x = s.x0 + 1.2 + u * L, z = (l - (lanes - 1) / 2) * 2.6;
          const fade = Math.min(1, u * 8, (1 - u) * 8);
          I.set(i, { p: [x, 3.25, z], edge: W.lin(C.amber, W.kl(k) * fade * lvl), body: W.lin(C.amber, W.ko(k) * body * fade * lvl) });
        }
      }
      I.commit();
    },
  };
}
