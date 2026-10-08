// =====================================================================================================
// Batch b5-act2b helpers (shots 48-64: the escalation into the drop). Wraps / extends lib/world.js pieces.
// Everything deterministic: seeded layouts at build time, every pose computed from lt / global t.
// =====================================================================================================
import { rand, clamp, lerp, ease } from '../../engine.js';
import * as W from './world.js';
const { THREE, G } = W;
export { W, THREE, G };

/** global (music-grid) time */
export const gt = (ctx, lt) => ctx.shot.start + lt;

/** Act II shot boilerplate: letterbox + stage. */
export function act2(ctx, { fog, fogColor, fov = 40, far = 2400, near = 0.1 } = {}) {
  ctx.fx.bars(0, 138);
  return W.stage({ act: 'II', fog, fogColor, fov, far, near });
}

/** The locked Act II grade from the shot list (bloom 0.9 thr 0.8, sat 0.75, tint cold, exp 0.95, vig 0.55, ca 0.001). */
export function grade2(over = {}) { return W.grade('II', over); }

/** smooth 0..1 window helpers */
export const win = (x, a, b) => clamp((x - a) / (b - a));
export const smooth = (x) => x * x * (3 - 2 * x);

// ----------------------------------------------------------------------------------------------------- stamps / impulses
/** decaying impulse after t0 (0 before): exp(-(t-t0)/d) */
export const impulse = (t, t0, d = 0.12) => (t < t0 ? 0 : Math.exp(-(t - t0) / d));

// ----------------------------------------------------------------------------------------------------- debris field
/**
 * Toppled-tower debris: cards strewn on the floor in a fan from `origin` toward `dir` (the REVIEW tower fell toward +z).
 * debris({ count, origin:[x,z], len, spread, seed }) -> boxes API with all cards placed (call nothing per frame).
 */
export function debris({ count = 220, origin = [1.4, 2], len = 46, spread = 0.55, seed = 640, edgeK = 0.7, bodyK = 0.8, piles = true } = {}) {
  const I = W.cards({ count });
  const r = rand(seed);
  for (let i = 0; i < count; i++) {
    const u = Math.pow(r(), 0.7);
    const d = 3 + u * len;
    const a = (r() - 0.5) * spread * 2 * (0.4 + 0.6 * u);
    const x = origin[0] + Math.sin(a) * d + (r() - 0.5) * 2;
    const z = origin[1] + Math.cos(a) * d;
    const stackH = piles && r() < 0.3 ? Math.floor(r() * 3) : 0;
    const tilt = r() < 0.35 ? (r() - 0.5) * 0.9 : (r() - 0.5) * 0.12;
    I.set(i, { p: [x, 0.25 + stackH * 0.5 + Math.abs(tilt) * 0.8, z], r: [tilt, r() * Math.PI, (r() - 0.5) * 0.3], edge: W.CARD.edge(edgeK), body: W.CARD.body(bodyK) });
  }
  I.commit();
  return I;
}

// ----------------------------------------------------------------------------------------------------- red pinpoint swarm on towers
/**
 * Extra red pinpoints climbing a tower's faces (for "red pinpoints at their densest").
 * towerPins({ base:[x,y,z], height, every, seed }) -> orbs API with update(t, { k, height, tip, shake })
 */
export function towerPins({ base = W.POS.reviewBase, height = 600, every = 5, seed = 77, r = 0.22 } = {}) {
  const n = Math.floor(height / every);
  const P = W.orbs({ count: n, r, seg: 6 });
  const rr = rand(seed);
  const slots = Array.from({ length: n }, (_, k) => {
    const face = Math.floor(rr() * 4);
    const off = (rr() - 0.5) * 2.4;
    const p = face === 0 ? [off, 1.06] : face === 1 ? [off, -1.06] : face === 2 ? [1.56, off * 0.6] : [-1.56, off * 0.6];
    return { y: 4 + k * every + rr() * every * 0.6, p, ph: rr(), div: rr() < 0.5 ? 2 : 4 };
  });
  const red = W.lin(W.C.red);
  P.update = (t, { k = 7, height: h = height, shake = 0, lockY = -1, lockK = null } = {}) => {
    for (let i = 0; i < n; i++) {
      const s = slots[i];
      if (s.y > h) { P.hide(i); continue; }
      const on = s.y < lockY ? 1 : W.blink(t, { bpm: 120, div: s.div, origin: s.ph * 0.25, duty: 0.55 });
      if (!on) { P.hide(i); continue; }
      const jx = shake ? Math.sin(t * 47 + i) * shake : 0;
      const kk = s.y < lockY && lockK !== null ? lockK * (1 + 1.5 * Math.exp(-(lockY - s.y) / 6)) : k;
      P.set(i, { p: [base[0] + s.p[0] + jx, base[1] + s.y, base[2] + s.p[1]], c: red, k: kk });
    }
    P.commit();
  };
  return P;
}

// ----------------------------------------------------------------------------------------------------- wildfire cracks
/**
 * Branching red crack network spreading from `origin` along path distance d (front radius r advances at 40 u/s).
 * crackTree({ origin:[x,z], seed, rays, xMax, zMax, y }) -> { group, segs, update(r, { t, k }) , tipPos[] }
 * One soft LineSegments2 draw; segments sorted by arrival so `instanceCount` reveals them; per-segment colours cool from a
 * hot front to embers. 1 flare per primary ray rides its front.
 */
export function crackTree({ origin = [1.4, 0], seed = 505, rays = 28, xMax = 74, zMax = 12, yTop = 3.22, yFloor = 0.06, width = 1.6, branch = 0.2 } = {}) {
  const r = rand(seed);
  const segs = [];
  const stack = [];
  for (let k = 0; k < rays; k++) {
    const side = k % 2 ? 1 : -1;
    let ang = (side > 0 ? 0 : Math.PI) + (r() - 0.5) * 1.5;
    if (k < 6) ang = (k % 2 ? 1 : -1) * Math.PI / 2 + (r() - 0.5) * 1.2;
    stack.push({ x: origin[0] + (r() - 0.5), z: origin[1] + (r() - 0.5), ang, base: ang, d: r() * 2, depth: 0, ray: k });
  }
  const rayOf = [];
  while (stack.length && segs.length < 3600) {
    const s = stack.shift();
    let { x, z, ang, d, depth } = s;
    const base = s.base;
    let n = 0; const maxN = depth ? 4 + Math.floor(r() * 12) : 999;
    while (Math.abs(x) < xMax && Math.abs(z) < zMax && n < maxN) {
      const L = lerp(0.9, 2.1, r());
      ang += (r() - 0.5) * 0.9; ang = lerp(ang, base, depth ? 0.05 : 0.18);
      const nx = x + Math.cos(ang) * L, nz = z + Math.sin(ang) * L * 0.75;
      segs.push({ a: [x, z], b: [nx, nz], d0: d, d1: d + L, depth, ray: s.ray });
      x = nx; z = nz; d += L; n++;
      if (r() < branch / (1 + depth * 0.7)) stack.push({ x, z, ang: ang + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.7), base: ang + (r() < 0.5 ? -1 : 1) * 0.8, d, depth: depth + 1, ray: s.ray });
    }
  }
  segs.sort((a, b) => a.d0 - b.d0);
  const N = segs.length;
  const yAt = (z) => (Math.abs(z) < 5 ? yTop : yFloor);
  const pos = new Float32Array(N * 6), col = new Float32Array(N * 6);
  segs.forEach((s, i) => {
    pos.set([s.a[0], yAt(s.a[1]), s.a[1], s.b[0], yAt(s.b[1]), s.b[1]], i * 6);
  });
  const line = W.glowSegs(pos, { colors: col, k: 1, width, color: 0xffffff });
  line.material.color.setRGB(1, 1, 1);
  const g = line.geometry;
  // primary-ray fronts
  const primary = Array.from({ length: rays }, () => []);
  segs.forEach((s) => { if (s.depth === 0) primary[s.ray].push(s); });
  const group = new THREE.Group(); group.add(line);
  const tips = primary.map(() => { const f = W.flare({ color: W.C.red, k: 0, size: 3.2 }); group.add(f); return f; });
  const tipCore = W.orbs({ count: rays, r: 0.45, seg: 8 }); group.add(tipCore.mesh);
  const red = W.lin(W.C.red), hot = W.lin(0xff9a7a);
  const api = {
    group, segs, line, count: N,
    /** r = front path distance; returns number of revealed segments */
    update(rf, { k = 6, t = 0, tipK = 10, emb = 0.32 } = {}) {
      let n = 0; while (n < N && segs[n].d0 <= rf) n++;
      g.instanceCount = Math.max(1, n);
      line.visible = n > 0;
      const kk = W.kl(k);
      for (let i = 0; i < n; i++) {
        const s = segs[i];
        const age = Math.max(0, rf - s.d1);
        const h = Math.exp(-age / 3.5);
        const flick = 0.85 + 0.15 * Math.sin(t * 31 + i * 1.7);
        const m = kk * (emb + 0.95 * h) * flick * (s.depth ? 0.7 : 1);
        for (let e = 0; e < 2; e++) {
          col[i * 6 + e * 3] = lerp(red[0], hot[0], h * 0.7) * m;
          col[i * 6 + e * 3 + 1] = lerp(red[1], hot[1], h * 0.7) * m;
          col[i * 6 + e * 3 + 2] = lerp(red[2], hot[2], h * 0.7) * m;
        }
      }
      g.attributes.instanceColorStart.data.needsUpdate = true;
      primary.forEach((list, j) => {
        const s = list.find((q) => q.d1 >= rf);
        if (!s || rf <= 0) { tips[j].userData.set(0); tipCore.hide(j); return; }
        const u = clamp((rf - s.d0) / (s.d1 - s.d0));
        const x = lerp(s.a[0], s.b[0], u), z = lerp(s.a[1], s.b[1], u), y = yAt(z) + 0.15;
        tips[j].position.set(x, y, z); tips[j].userData.set(tipK * (0.8 + 0.2 * Math.sin(t * 40 + j)), W.C.red);
        tipCore.set(j, { p: [x, y, z], c: hot, k: tipK * 1.2 });
      });
      tipCore.commit();
      return n;
    },
    /** nearest-segment arrival distance for an (x,z) point within `rad` (Infinity if none) */
    arrival(x, z, rad = 2.2) {
      let best = Infinity;
      for (const s of segs) { const mx = (s.a[0] + s.b[0]) / 2, mz = (s.a[1] + s.b[1]) / 2; const d2 = (mx - x) ** 2 + (mz - z) ** 2; if (d2 < rad * rad && s.d0 < best) best = s.d0; }
      return best;
    },
  };
  api.update(-1);
  return api;
}

// ----------------------------------------------------------------------------------------------------- falling tower
/**
 * The 600u REVIEW tower toppling (rigid lean + top lag), card by card: cards shed (a sparse early set anywhere on the column,
 * then everything from the top down) and tumble ballistically; `rain` cards (dark slabs with ice edges) fly at the lens in the
 * snap. Same seeded jitter as W.cardTowers (seed 21) so the standing silhouette matches the established tower.
 * fallingTower({ count, dir:[dx,dz] (tip direction) }) -> { group, update(lt, { theta, a (theta = theta0 e^(a tau)), bend, t,
 *   crack (story s since the fracture, <0 none), camPos, rain (s since the snap, <0 none), vScale }) }
 */
export function fallingTower({ count = 1200, base = W.POS.reviewBase, seed = 21, rainCount = 90, dir = [0, 1] } = {}) {
  const group = new THREE.Group();
  const I = W.cards({ count });
  group.add(I.mesh);
  const dl = Math.hypot(dir[0], dir[1]); const DX = dir[0] / dl, DZ = dir[1] / dl;
  const axis = new THREE.Vector3(DZ, 0, -DX);
  const r = rand(seed);
  const jit = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { jit[i * 4] = (r() - 0.5) * 0.6; jit[i * 4 + 1] = (r() - 0.5) * 0.6; jit[i * 4 + 2] = (r() - 0.5) * 0.3; jit[i * 4 + 3] = r(); }
  const r2 = rand(seed + 1000);
  const H = count * 0.5;
  const det = new Float32Array(count), vel = new Float32Array(count * 3), spin = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const h = i / count;
    const early = r2() < 0.07;   // a sparse set lets go early, anywhere on the column (visible in the slow-mo)
    det[i] = early ? 0.035 + r2() * 0.09 : 0.06 + Math.pow(1 - h, 1.6) * 1.4 + r2() * 0.18;
    vel[i * 3] = (r2() - 0.5) * (early ? 34 : 14); vel[i * 3 + 1] = (r2() - 0.3) * (early ? 16 : 10); vel[i * 3 + 2] = (r2() - 0.1) * (early ? 30 : 18);
    spin[i * 3] = (r2() - 0.5) * 9; spin[i * 3 + 1] = (r2() - 0.5) * 9; spin[i * 3 + 2] = (r2() - 0.5) * 9;
  }
  const nP = Math.ceil(H / 12) + 1;
  const P = W.orbs({ count: nP, r: 0.25, seg: 8 }); group.add(P.mesh);
  const R = W.boxes({ count: rainCount, size: [3, 0.5, 2], color: 0x14161a, metal: 0.3, rough: 0.5, edgeW: 1.6, crowd: 0.6 }); group.add(R.mesh);
  const rainS = Array.from({ length: rainCount }, () => ({ h: 14 + r2() * 50, delay: r2() * 0.24, dur: 0.14 + r2() * 0.2, off: [(r2() - 0.5) * 8, (r2() - 0.5) * 5], spin: [(r2() - 0.5) * 10, (r2() - 0.5) * 10, (r2() - 0.5) * 10] }));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qt = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sv = new THREE.Vector3(1, 1, 1), lo = new THREE.Vector3();
  const colY = new Float32Array(count), colS = new Float32Array(count), colA = new Float32Array(count);
  const eC = W.CARD.edge(), bC = W.CARD.body(), redE = W.CARD.redEdge(6);
  const rainE = W.lin(W.C.ice, W.kl(2.2)), rainB = [0, 0, 0];
  const red = W.lin(W.C.red);
  const api = {
    group, I, P, R,
    update(lt, { theta = 0, a = 6, bend = 0.2, t = lt, crack = -1, camPos = null, rain = -1, vScale = 0.6 } = {}) {
      let y = base[1], sd = 0;
      for (let i = 0; i < count; i++) { const h = i / count; const an = theta * (1 - bend * h * h); y += 0.5 * Math.cos(an); sd += 0.5 * Math.sin(an); colY[i] = y - 0.25; colS[i] = sd; colA[i] = an; }
      const g = -240;
      for (let i = 0; i < count; i++) {
        const an = colA[i];
        qt.setFromAxisAngle(axis, an);
        lo.set(jit[i * 4], 0, jit[i * 4 + 1]).applyQuaternion(qt);
        let px = base[0] + DX * colS[i] + lo.x, py = colY[i] + lo.y, pz = base[2] + DZ * colS[i] + lo.z;
        q.setFromEuler(e.set(0, jit[i * 4 + 2], 0)); q.premultiply(qt);
        if (theta > det[i]) {
          const ds = Math.min(1.4, Math.log(theta / det[i]) / a);
          const vt = a * det[i] * i * 0.5 * vScale;
          const vh = Math.cos(an) * vt, vy = -Math.sin(an) * vt;
          px += (DX * vh + vel[i * 3]) * ds; py += (vy + vel[i * 3 + 1]) * ds + 0.5 * g * ds * ds; pz += (DZ * vh + vel[i * 3 + 2]) * ds;
          if (py < 0.3) py = 0.3;
          e.set(spin[i * 3] * ds, spin[i * 3 + 1] * ds, spin[i * 3 + 2] * ds); qt.setFromEuler(e); q.multiply(qt);
        }
        v.set(px, py, pz);
        I.mesh.setMatrixAt(i, m4.compose(v, q, sv));
        let ec = eC;
        if (crack >= 0) {
          const hc = 10 + crack * 420, hh = i * 0.5;
          const zig = Math.abs(((hh * 0.11) % 2) - 1);
          if (hh < hc && hh > 6 && jit[i * 4 + 3] < 0.22 + 0.25 * zig) { const f = 0.35 + 0.65 * Math.exp(-Math.max(0, hc - hh) / 18); ec = [lerp(eC[0], redE[0], f), lerp(eC[1], redE[1], f), lerp(eC[2], redE[2], f)]; }
        }
        I.color(i, ec, bC);
      }
      I.commit();
      for (let k = 0; k < nP; k++) {
        const hh = 6 + k * 12; const ci = Math.min(count - 1, Math.floor(hh * 2));
        const face = k % 2;
        const on = W.blink(t, { bpm: 120, div: 2, origin: face ? 0.25 : 0 });
        if (hh > H - 1 || theta > det[ci] || !on) { P.hide(k); continue; }
        qt.setFromAxisAngle(axis, colA[ci]);
        lo.set(face ? 1.6 : -1.6, 0, face ? -1.05 : 1.05).applyQuaternion(qt);
        P.set(k, { p: [base[0] + DX * colS[ci] + lo.x, colY[ci] + lo.y, base[2] + DZ * colS[ci] + lo.z], c: red, k: 8 });
      }
      P.commit();
      for (let i = 0; i < rainS.length; i++) {
        const s = rainS[i];
        const u = rain < 0 ? -1 : (rain - s.delay) / s.dur;
        if (u < 0 || u > 1.3 || !camPos) { R.hide(i); continue; }
        const ci = Math.min(count - 1, Math.floor(s.h * 2));
        const from = [base[0] + DX * colS[ci], colY[ci], base[2] + DZ * colS[ci]];
        const to = [camPos[0] + s.off[0], camPos[1] + 1.5 + s.off[1], camPos[2] + 4];
        R.set(i, { p: [lerp(from[0], to[0], u), lerp(from[1], to[1], u), lerp(from[2], to[2], u)], r: [s.spin[0] * u, s.spin[1] * u, s.spin[2] * u], edge: rainE, body: rainB });
      }
      R.commit();
    },
  };
  return api;
}

// ----------------------------------------------------------------------------------------------------- rim-lit orbs
/**
 * Instanced "glass" agents for close / back-lit shots: near-black body, fresnel rim + a small hot core (instance colour = rim colour
 * x k RAW). rimOrbs({ count, r, seg, core }) -> instanced API (set(i, { p, s, c, k }), hide, commit).
 */
export function rimOrbs({ count = 20, r = 0.3, seg = 20, core = 0.35, pow = 2.4 } = {}) {
  const I = G.instanced({ count, geometry: new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), basic: true });
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCore: { value: core }, uPow: { value: pow } }]),
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vCol; varying float vFogDepth;
      void main(){ vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * mat3(instanceMatrix) * normal); vV = normalize(-mv.xyz);
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #else
          vCol = vec3(1.0);
        #endif
        vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uCore; uniform float uPow; uniform vec3 fogColor; uniform float fogDensity; varying vec3 vN; varying vec3 vV; varying vec3 vCol; varying float vFogDepth;
      void main(){ float d = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); float rim = pow(1.0 - d, uPow); float core = pow(d, 18.0) * uCore;
        vec3 c = vec3(0.004) + vCol * (rim * 0.9 + core) + vCol * 0.035;
        float f = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
        gl_FragColor = vec4(mix(c, fogColor, f), 1.0); }`,
  });
  I.mesh.material = I.material = mat;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < count; i++) I.mesh.setMatrixAt(i, zero);
  const set0 = I.set;
  I.set = (i, o = {}) => set0(i, { ...o, s: (o.s ?? 1) * r, k: o.k ?? 1 });
  I.hide = (i) => I.mesh.setMatrixAt(i, zero);
  return I;
}

// ----------------------------------------------------------------------------------------------------- bokeh (fake shallow DOF)
let _disc = null;
function discTexture() {
  if (_disc) return _disc;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.75, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.9, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
  _disc = new THREE.CanvasTexture(c);
  return _disc;
}
/** out-of-focus disc sprite (additive) — foreground/background agents in macro shots. */
export function bokeh({ color = W.C.ice, k = 0.6, size = 1 } = {}) {
  const m = new THREE.SpriteMaterial({ map: discTexture(), color: W.hcol(color, k), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1);
  s.userData.set = (kk, hex = color) => m.color.set(hex).multiplyScalar(kk);
  return s;
}

// ----------------------------------------------------------------------------------------------------- outlines
/** rectangle outline pairs in the xz plane at height y (for bank alarm frames seen from above) */
export function rectPairs(cx, y, cz, w, d) {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  return [[[x0, y, z0], [x1, y, z0]], [[x1, y, z0], [x1, y, z1]], [[x1, y, z1], [x0, y, z1]], [[x0, y, z1], [x0, y, z0]]];
}

/** soft radial band plane (alarm beam sweep). band({ len, width, color, k }) -> mesh, userData.set(k) */
export function band({ len = 200, width = 8, color = W.C.red, k = 0.6 } = {}) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uCol: { value: W.hcol(color, k) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uCol; varying vec2 vUv; void main(){ float x = (vUv.x - 0.5) * 2.0; float a = exp(-x * x * 5.0) * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y); float core = exp(-x * x * 40.0); gl_FragColor = vec4(uCol * (a * 0.7 + core * 0.5), 1.0); }',
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, len), mat);
  m.userData.set = (kk) => mat.uniforms.uCol.value.set(color).multiplyScalar(kk);
  return m;
}

/**
 * In-scene type scrim: a soft black ellipse glued in front of the camera (darkens the 3D + its bloom under the type, unlike a
 * 2D div, which the glitch drop-shadows would tint). camScrim(scene, camera, { x, y (px centre), w, h (px), a }) -> mesh;
 * call mesh.userData.fit() after the camera fov is final each frame; mesh.userData.set(a).
 */
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
  return m;
}

// ----------------------------------------------------------------------------------------------------- 2D helpers
/** dark soft scrim behind type (multiply-black radial gradient) */
export function scrim(K, root, { x = 960, y = 540, w = 1500, h = 560, a = 0.7 } = {}) {
  return K.el('div', { style: { position: 'absolute', left: (x - w / 2) + 'px', top: (y - h / 2) + 'px', width: w + 'px', height: h + 'px', background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${(a * 0.75).toFixed(2)}) 45%, rgba(0,0,0,0) 100%)` } }, root);
}

// =====================================================================================================
// Appended for shots 54-64 (backpressure climbs the line -> the alarm -> the drop). New exports only.
// =====================================================================================================

/**
 * Dense red pinpoints on the faces of a box footprint (a b4 towerMass: pass its base / halfW / halfD), for "pinpoints at their
 * densest". massPins({ base, halfW, halfD, height, every, seed, r }) -> orbs API + update(t, { k, h (visible height), shake, div, bias })
 * Each pin blinks on 8ths or 16ths (seeded phase); `bias` 0..1 adds an always-on fraction.
 */
export function massPins({ base = W.POS.reviewBase, halfW = 8.1, halfD = 3.35, height = 600, every = 4, seed = 63, r = 0.26 } = {}) {
  const n = Math.floor(height / every);
  const P = W.orbs({ count: n, r, seg: 6 });
  const rr = rand(seed);
  const slots = Array.from({ length: n }, (_, k) => {
    const face = Math.floor(rr() * 4);
    const u = rr() * 2 - 1;
    const p = face === 0 ? [u * (halfW - 0.4), halfD + 0.06] : face === 1 ? [u * (halfW - 0.4), -halfD - 0.06] : [(face === 2 ? 1 : -1) * (halfW + 0.06), u * (halfD - 0.3)];
    return { y: 4 + k * every + rr() * every, p, ph: rr(), div: rr() < 0.6 ? 2 : 4, on: rr() };
  });
  const red = W.lin(W.C.red);
  P.update = (t, { k = 7, h = height, shake = 0, div = null, bias = 0 } = {}) => {
    for (let i = 0; i < n; i++) {
      const s = slots[i];
      if (s.y > h) { P.hide(i); continue; }
      const on = s.on < bias ? 1 : W.blink(t, { bpm: 120, div: div ?? s.div, origin: s.ph * 0.25, duty: 0.5 });
      if (!on) { P.hide(i); continue; }
      const sx = shake ? Math.sin(t * 47 + s.y * 0.37) * shake * (0.4 + 0.6 * clamp(s.y / 80)) : 0;
      P.set(i, { p: [base[0] + s.p[0] + sx, base[1] + s.y, base[2] + s.p[1]], c: red, k });
    }
    P.commit();
  };
  return P;
}

/**
 * Red alarm frames around the 8 bank housings as seen from ABOVE (the housing tops hide the lamp undersides in top-downs):
 * one soft glow outline per bank (+ an inner inset outline). bankFrames({ y, k, width, inset }) -> { mesh, update(levels[8] 0..1, k) }
 */
export function bankFrames({ y = 60.45, k = 4, width = 2, inset = 1.4 } = {}) {
  const pairs = [];
  W.BANK_X.forEach((x) => {
    pairs.push(...rectPairs(x, y, 0, 16, 12));
    pairs.push(...rectPairs(x, y, 0, 16 - inset * 2, 12 - inset * 2));
  });
  const flat = pairs.flat(2);
  const col = new Float32Array(flat.length);
  const mesh = W.glowSegs(flat, { colors: col, k: 1, width, color: 0xffffff, offset: false });
  mesh.material.color.setRGB(1, 1, 1);
  const red = W.lin(W.C.red), cAttr = mesh.geometry.attributes.instanceColorStart.data;
  const per = 8;   // segments per bank
  return {
    mesh,
    update(levels, kk = k) {
      const A = cAttr.array;
      for (let b = 0; b < 8; b++) {
        const L = clamp(levels[b] ?? 0);
        for (let s = 0; s < per; s++) {
          const m = W.kl(kk) * L * (s < 4 ? 1 : 0.45);
          const o = (b * per + s) * 6;
          for (let e = 0; e < 2; e++) { A[o + e * 3] = red[0] * m; A[o + e * 3 + 1] = red[1] * m; A[o + e * 3 + 2] = red[2] * m; }
        }
      }
      cAttr.needsUpdate = true;
    },
  };
}

/** per-frame flicker table helper: value of `tab` at frame floor(lt*30) (clamped to the last entry). */
export const frameTab = (lt, tab) => tab[Math.max(0, Math.min(tab.length - 1, Math.floor(lt * 30 + 1e-4)))];

/** hard-brake easing for "everything stops": distance travelled (in seconds of full-speed motion) after a brake at t0 with time constant tau. */
export const brake = (lt, t0 = 0, tau = 0.035) => (lt < t0 ? lt : t0 + tau * (1 - Math.exp(-(lt - t0) / tau)));
