// =====================================================================================================
// Batch b4-act2a helpers (shots 33..47, ACT II: the jammed line). Wraps / extends lib/world.js (never edits it).
//   import * as B from './lib/b4-act2a.js';
// Reusable by the mirror / recall shots of other batches:
//   - towerMass(): the REVIEW / TEST jam as a MONUMENTAL dense mass of stacked cards (cluster of jittered card columns built from
//     8-card bundles, red pinpoints, lit amber/green state for the Act III mirrors, tip + shake for the topple / max-push).
//   - camHumanUnderTowerB(): MASTER C framing actually used by ii-line-waits-2 (worm's-eye 14mm, closer than world.camHumanUnderTower so
//     the tower reads as a mass and the human as a readable silhouette). p-human-lit / ii-max-push should use it + humanUnderSet().
//   - humanUnderSet(): the whole ii-line-waits-2 set (hall + REVIEW/TEST masses + spill + human + top light) in one call.
//   - bulkhead(): REVIEW's input wall with its single-lane slot (shots 33-36).
//   - streaks(): in-place updatable soft glow segments (motion streaks).   sparks(): deterministic spark bursts.
//   - refrain(): THE LINE WAITS. / THE LINE RUNS. card in the refrain slot (960, 820) over a -0.8 stop darkened band.
// =====================================================================================================
import { rand, clamp, lerp, ease } from '../../engine.js';
import * as W from './world.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const { THREE, C } = W;

export const ICE_CSS = '#CFE3F2';
export const RED_CSS = '#FF453A';
export const IVORY_CSS = '#FAF9F5';

// ----------------------------------------------------------------------------------------- small math
export const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
/** hash 0..1 from an integer (deterministic) */
export function hash(i, s = 0) { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }
/** world-space stamp envelope: k multiplier that spikes on the stamp frame and settles (seconds since stamp). */
export function stampK(dt, { peak = 3.2, d = 0.3 } = {}) { if (dt < 0) return 0; return lerp(peak, 1, ease.out(clamp(dt / d))); }
/** K.slam for world-space meshes: scale from `from` -> 1 expo-out over d seconds. */
export function stampScale(dt, { from = 1.35, d = 0.32 } = {}) { if (dt < 0) return from; return lerp(from, 1, ease.expoOut(clamp(dt / d))); }

// ----------------------------------------------------------------------------------------- streaks (in-place soft segments)
/** N soft additive glow segments updated in place: S.set(i, a, b, [r,g,b]?) / S.hide(i) / S.commit(). k nominal (x KE). */
export function streaks(count, { color = C.ice, k = 2, width = 2, colors = false } = {}) {
  const flat = new Array(count * 6).fill(0);
  for (let i = 0; i < count; i++) { flat[i * 6 + 1] = -1e4; flat[i * 6 + 4] = -1e4; }
  const mesh = W.glowSegs(flat, { color, k, width, colors: colors ? new Array(count * 6).fill(1) : null, offset: false });
  const pos = mesh.geometry.attributes.instanceStart.data;
  const col = colors ? mesh.geometry.attributes.instanceColorStart.data : null;
  return {
    mesh, count,
    set(i, a, b, c) {
      const o = i * 6, A = pos.array;
      A[o] = a[0]; A[o + 1] = a[1]; A[o + 2] = a[2]; A[o + 3] = b[0]; A[o + 4] = b[1]; A[o + 5] = b[2];
      if (c && col) { const Cc = col.array; Cc[o] = c[0]; Cc[o + 1] = c[1]; Cc[o + 2] = c[2]; Cc[o + 3] = c[0]; Cc[o + 4] = c[1]; Cc[o + 5] = c[2]; }
    },
    hide(i) { const o = i * 6, A = pos.array; A[o + 1] = -1e4; A[o + 4] = -1e4; A[o] = A[o + 3]; },
    commit() { pos.needsUpdate = true; if (col) col.needsUpdate = true; },
  };
}

// ----------------------------------------------------------------------------------------- sparks (vertex-coloured points)
/** Spark bursts: sparks({ count, color, size }) -> { points, update(bursts, t) } where bursts = [{ t0, p:[x,y,z], n, speed, life, seed, g }].
 *  Each burst throws n points radially (seeded) with drag + gravity; brightness fades over life. */
export function sparks({ count = 600, color = C.red, size = 0.12, k = 6 } = {}) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size, map: W.G.dotTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false });
  const points = new THREE.Points(g, mat); points.frustumCulled = false;
  const base = W.lin(color, W.ko(k));
  return {
    points,
    update(bursts, t) {
      let n = 0;
      for (const b of bursts) {
        const dt = t - b.t0; const life = b.life ?? 0.4;
        for (let j = 0; j < b.n && n < count; j++, n++) {
          if (dt < 0 || dt > life) { pos[n * 3 + 1] = -1e4; col[n * 3] = col[n * 3 + 1] = col[n * 3 + 2] = 0; continue; }
          const h1 = hash(j, b.seed), h2 = hash(j + 71, b.seed), h3 = hash(j + 913, b.seed);
          const th = h1 * Math.PI * 2, ph = Math.acos(2 * h2 - 1);
          const sp = (b.speed ?? 8) * (0.35 + 0.65 * h3);
          const dir = b.dir || [0, 0, 0];
          const vx = Math.sin(ph) * Math.cos(th) * sp + dir[0], vy = Math.cos(ph) * sp * 0.7 + dir[1], vz = Math.sin(ph) * Math.sin(th) * sp + dir[2];
          const dr = (1 - Math.exp(-4 * dt)) / 4;   // drag-integrated displacement
          pos[n * 3] = b.p[0] + vx * dr; pos[n * 3 + 1] = b.p[1] + vy * dr - (b.g ?? 6) * dt * dt * 0.5; pos[n * 3 + 2] = b.p[2] + vz * dr;
          const f = Math.pow(1 - dt / life, 1.6) * (0.5 + 0.5 * hash(j + 5, b.seed));
          col[n * 3] = base[0] * f; col[n * 3 + 1] = base[1] * f; col[n * 3 + 2] = base[2] * f;
        }
      }
      for (; n < count; n++) { pos[n * 3 + 1] = -1e4; col[n * 3] = col[n * 3 + 1] = col[n * 3 + 2] = 0; }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true;
    },
  };
}

// ----------------------------------------------------------------------------------------- REVIEW input bulkhead
/** REVIEW's input wall in the CODE/REVIEW gap (x -9.0..-7.8): a slate slab from the floor to `top` with one single-lane slot at the
 *  card height (cards ride the station tops at y 3.45). bulkhead({ top }) -> { group, update(lt, { edgeK, slotK, pin 0..1, t }), slot, pinPos } */
export function bulkhead({ x = -8.4, top = 11, slotW = 2.5, slotY = [3.05, 4.05], th = 0.7 } = {}) {
  const group = new THREE.Group();
  const B = W.boxes({ count: 4, size: [1, 1, 1], color: 0x0d0e10, metal: 0.45, rough: 0.5, edgeW: 1.5 });
  const half = slotW / 2;
  const parts = [
    [x, top / 2, (-5 - half) / 2, th, top, 5 - half],
    [x, top / 2, (5 + half) / 2, th, top, 5 - half],
    [x, slotY[0] / 2, 0, th, slotY[0], slotW],
    [x, (slotY[1] + top) / 2, 0, th, top - slotY[1], slotW],
  ];
  group.add(B.mesh);
  const xs = [x - th / 2 - 0.02, x + th / 2 + 0.02];
  const sp = [];
  for (const xx of xs) {
    sp.push([[xx, slotY[0], -half], [xx, slotY[0], half]], [[xx, slotY[1], -half], [xx, slotY[1], half]], [[xx, slotY[0], -half], [xx, slotY[1], -half]], [[xx, slotY[0], half], [xx, slotY[1], half]]);
  }
  const slot = W.glowSegs(sp, { color: C.ice, k: 2, width: 2 });
  group.add(slot);
  const pinPos = [x - th / 2 - 0.12, top - 1.3, -3.2];
  const pin = W.orbs({ count: 1, r: 0.22, seg: 12 }); group.add(pin.mesh);
  const pinFl = W.flare({ color: C.red, k: 0, size: 3 }); pinFl.position.set(...pinPos); group.add(pinFl);
  const api = {
    group, slot, pinPos, B,
    update(lt, { edgeK = 0.5, slotK = 2, pin: pk = 0, t = lt } = {}) {
      parts.forEach((p, i) => B.set(i, { p: [p[0], p[1], p[2]], s: [p[3], p[4], p[5]], edge: W.lin(C.steel, W.kl(edgeK)), body: [0, 0, 0] }));
      B.commit();
      slot.userData.set(slotK);
      if (pk > 0.001) { pin.set(0, { p: pinPos, c: W.lin(C.red), k: 8 * pk }); pinFl.userData.set(2.2 * pk, C.red); } else { pin.hide(0); pinFl.userData.set(0); }
      pin.commit();
    },
    sources(pk = 1) { return pk > 0.01 ? [{ p: [pinPos[0] - 0.5, pinPos[1], pinPos[2]], c: C.red, k: 2 * pk, pool: 0, refl: 0.8, size: 0.3 }] : []; },
  };
  api.update(0);
  return api;
}

// ----------------------------------------------------------------------------------------- TOWER MASS (the jam)
const _bundle = {};
/** n cards (3 x 0.5 x 2) stacked into one geometry (centred, n*0.5 tall) with baked seeded jitter (x/z +-0.25, ry +-0.15). */
export function bundleGeometry(n = 8, seed = 5) {
  const key = n + ':' + seed; if (_bundle[key]) return _bundle[key];
  const r = rand(seed); const parts = [];
  for (let k = 0; k < n; k++) {
    const g = new THREE.BoxGeometry(3, 0.5, 2);
    g.rotateY((r() - 0.5) * 0.3);
    g.translate((r() - 0.5) * 0.5, -n * 0.25 + 0.25 + k * 0.5, (r() - 0.5) * 0.4);
    parts.push(g);
  }
  return (_bundle[key] = mergeGeometries(parts));
}
export const BASES = { review: W.POS.reviewBase, test: W.POS.testBase, deploy: W.POS.deployBase };
/**
 * towerMass({ name|base, nx, nz, pitch, maxH (u), taper, seed, bundle (cards per instance), pinsPerLevel })
 *   -> { group, I, P, update(lt, p), sources(), topAt(h) }
 * A cluster of nx x nz jittered card columns on a station top. Height in u (2 cards = 1u). Corner columns run shorter (taper) so the
 * silhouette steps in like a pile. Bundles of `bundle` cards keep the instance count low (8 cards = 4u per instance).
 * update params: h (u, tallest column), t (GLOBAL time for blinks), red 0..1, pins 0..1 (fraction of pin levels shown), pinDiv (2 = 8ths, 1 = tick),
 *   lit 0..1 (amber flow + green lamps, for the mirrors), flow (u/s), shake (u), tip (rad toward +z about the base front edge),
 *   fresh: { from: h before the latest slam, dt: s since it, drop: u } (new bundles fall in from above), k (edge k), body (body k)
 */
export function towerMass({ name = 'review', base = null, nx = 5, nz = 3, pitch = [3.25, 2.3], maxH = 300, taper = 0.22, seed = 3, bundle = 8, pinsPerLevel = 2, pinEvery = 12 } = {}) {
  const b0 = base || BASES[name];
  const r = rand(seed * 7 + 1);
  const group = new THREE.Group();
  const cols = [];
  const cx = (nx - 1) / 2, cz = (nz - 1) / 2;
  for (let gz = 0; gz < nz; gz++) for (let gx = 0; gx < nx; gx++) {
    const ox = (gx - cx) * pitch[0] + (r() - 0.5) * 0.6;
    const oz = (gz - cz) * pitch[1] + (r() - 0.5) * 0.4;
    const e = Math.max(cx ? Math.abs(gx - cx) / cx : 0, cz ? Math.abs(gz - cz) / cz : 0);
    const hf = 1 - taper * e * (0.55 + 0.45 * r()) - 0.04 * r();
    cols.push({ ox, oz, hf, gx, gz, ph: r() });
  }
  const bh = bundle * 0.5;
  const perCol = Math.ceil(maxH / bh) + 1;
  const N = cols.length * perCol;
  const I = W.boxes({ count: N, geometry: bundleGeometry(bundle, seed), color: C.card, metal: 0.1, rough: 0.55, edgeW: 1.2, crowd: 0.35 });
  group.add(I.mesh);
  const jr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { jr[i * 3] = (r() - 0.5) * 0.22; jr[i * 3 + 1] = (r() - 0.5) * 0.35; jr[i * 3 + 2] = (r() - 0.5) * 0.3; }
  // pinpoints: per 12u level, pinsPerLevel pins on the front (+z) face and the side faces, alternating.
  const levels = Math.ceil(maxH / pinEvery);
  const halfW = cx * pitch[0] + 1.6, halfD = cz * pitch[1] + 1.05;
  const pins = [];
  for (let L = 0; L < levels; L++) for (let k = 0; k < pinsPerLevel; k++) {
    const face = (L + k) % 3;   // 0 front, 1 left side, 2 right side
    const u = hash(L * 7 + k, seed);
    let p;
    if (face === 0) p = [lerp(-halfW + 0.6, halfW - 0.6, u), halfD + 0.05];
    else p = [face === 1 ? -halfW - 0.05 : halfW + 0.05, lerp(-halfD + 0.4, halfD - 0.2, u)];
    pins.push({ L, x: p[0], z: p[1], y: 6 + L * pinEvery + (hash(L, seed + 3) - 0.5) * 4, odd: (L + k) % 2, face });
  }
  const P = W.orbs({ count: pins.length, r: 0.28, seg: 8 });
  group.add(P.mesh);
  const st = { h: 0, lit: 0, red: 1 };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qt = new THREE.Quaternion(), e3 = new THREE.Euler(), v = new THREE.Vector3(), sv = new THREE.Vector3(1, 1, 1), piv = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const api = {
    group, I, P, cols, pins, state: st, base: b0, halfW, halfD,
    /** visible top of the mass at height h (u above the station top) */
    topAt(h) { return b0[1] + h; },
    update(lt, p = {}) {
      const h = p.h ?? maxH, t = p.t ?? lt, lit = clamp(p.lit ?? 0), red = p.red ?? 1, shake = p.shake ?? 0, tip = p.tip ?? 0, flow = p.flow ?? 6;
      const pinFrac = p.pins ?? 1, pinDiv = p.pinDiv ?? 2, fresh = p.fresh || null, ek = p.k ?? 1.2, bk = p.body ?? 1.2;
      st.h = h; st.lit = lit; st.red = red;
      const edgeC = [0, 0, 0], bodyC = [0, 0, 0];
      const e0 = W.CARD.edge(ek), e1 = W.CARD.amberEdge(), bb0 = W.CARD.body(bk), bb1 = W.CARD.amberBody();
      for (let c = 0; c < 3; c++) { edgeC[c] = lerp(e0[c], e1[c], lit); bodyC[c] = lerp(bb0[c], bb1[c], lit); }
      piv.set(b0[0], b0[1], b0[2] + halfD);
      qt.setFromEuler(e3.set(tip, 0, 0));
      let idx = 0;
      for (const col of cols) {
        const hc = h * col.hf;
        const nb = hc / bh;
        const nVis = Math.ceil(nb - 1e-4);
        for (let k = 0; k < perCol; k++, idx++) {
          if (k >= nVis || hc <= 0) { I.mesh.setMatrixAt(idx, zero); continue; }
          let x = b0[0] + col.ox + jr[idx * 3] * 1.2 * (1 - lit), z = b0[2] + col.oz + jr[idx * 3 + 2] * (1 - lit);
          let y = b0[1] + k * bh + bh / 2;
          let sy = 1, rx = 0, rz = 0;
          if (k === nVis - 1) { const fr = nb - (nVis - 1); sy = Math.max(0.125, Math.ceil(fr * bundle) / bundle); y = b0[1] + k * bh + (bh * sy) / 2; }
          if (fresh && fresh.dt >= 0) {
            const yb = k * bh;
            if (yb >= fresh.from * col.hf - 1e-3) {
              const u = clamp(fresh.dt / (fresh.d ?? 0.07));
              y += (fresh.drop ?? 10) * (1 - ease.out(u));
              rz = (hash(idx, 9) - 0.5) * 0.25 * (1 - u); rx = (hash(idx, 4) - 0.5) * 0.2 * (1 - u);
            }
          }
          if (lit > 0) {
            const ph = hash(idx, 2), lane = k % 2;
            const uu = ((((t * flow) / 6 + ph + lane * 0.5) % 1) + 1) % 1;
            x = lerp(x, b0[0] + col.ox + (uu - 0.5) * 6, lit);
          }
          if (shake) { const s = shake * (0.4 + 0.6 * clamp(k / 20)); x += Math.sin(t * 47 + idx * 0.37) * s; z += Math.cos(t * 53 + idx * 0.29) * s * 0.6; }
          v.set(x, y, z);
          q.setFromEuler(e3.set(rx, jr[idx * 3 + 1] * (1 - lit) + (hash(idx, 1) < 0.5 ? 0 : Math.PI), rz));
          if (tip) { v.sub(piv).applyQuaternion(qt).add(piv); q.premultiply(qt); }
          sv.set(1, sy, 1);
          I.mesh.setMatrixAt(idx, m4.compose(v, q, sv));
          I.color(idx, edgeC, bodyC);
        }
      }
      // pins
      let pi = 0;
      for (const pn of pins) {
        const top = h * 0.9;
        const vis = pn.y < top - 1 && (pn.L + 1) / levels <= pinFrac + 1e-6;
        if (!vis) { P.hide(pi++); continue; }
        const on = lit > 0.5 ? 1 : W.blink(t, { bpm: 120, div: pinDiv, origin: pn.odd ? (pinDiv === 2 ? 0.25 : 0.5) : 0 });
        const kk = lit > 0.5 ? 4 : 8 * red * (0.08 + 0.92 * on);
        v.set(b0[0] + pn.x, b0[1] + pn.y, b0[2] + pn.z);
        if (tip) v.sub(piv).applyQuaternion(qt).add(piv);
        P.set(pi++, { p: [v.x, v.y, v.z], c: lit > 0.5 ? W.lin(C.green) : W.lin(C.red), k: kk });
      }
      I.commit(); P.commit();
    },
    sources() {
      const out = [];
      if (st.h < 1) return out;
      out.push({ p: [b0[0], b0[1] + Math.min(st.h, 24) * 0.5, b0[2] + halfD], c: st.lit > 0.5 ? C.amber : C.ice, k: st.lit > 0.5 ? 2.5 : 1.0, pool: halfW * 1.1, poolK: 0.7, refl: 0.5, size: halfW });
      if (st.lit < 0.5 && st.red > 0) out.push({ p: [b0[0] + halfW * 0.6, b0[1] + 6, b0[2] + halfD + 0.3], c: C.red, k: 2.2 * st.red, pool: 3, poolK: 0.5, refl: 0.8, size: 0.4 });
      return out;
    },
  };
  return api;
}

/** Cards spilled over a station's front edge down to the floor (a scree of tumbled work). spill({ x0, x1, n, seed, zTop, zFoot }) -> boxes API (static; call once). */
export function spill({ x0 = -9, x1 = 12, n = 160, seed = 17, zTop = 4.6, zFoot = 10.5, yTop = 3.3, k = 1.2 } = {}) {
  const r = rand(seed);
  const I = W.cards({ count: n });
  for (let i = 0; i < n; i++) {
    const u = Math.pow(r(), 0.8);   // more cards near the top of the slope
    const x = lerp(x0, x1, r()) + (r() - 0.5) * 2;
    const z = lerp(zTop, zFoot, u) + (r() - 0.5) * 0.8;
    const y = Math.max(0.26, lerp(yTop, 0.25, Math.pow(u, 0.7)) + (r() - 0.5) * 0.5 + (r() < 0.25 ? 0.5 : 0));
    const slope = u < 0.85 ? -0.55 : 0;
    I.set(i, { p: [x, y, z], r: [slope + (r() - 0.5) * 0.6, (r() - 0.5) * 1.2, (r() - 0.5) * 0.5], edge: W.CARD.edge(k), body: W.CARD.body(k) });
  }
  I.commit();
  return I;
}

// ----------------------------------------------------------------------------------------- MASTER C (human under the tower)
/** camera actually used for MASTER C: 14mm worm's-eye, (1.4, 0.32, 44) creeping 4% -> target (1.4, 21, 0). stutter: step-print on twos + zoom +3% / 2 f. */
export function camHumanUnderTowerB(camera, lt, { dur = 2, stutter = false, push = 0.04, z0 = 44, ty = 21, t = lt, handheld: hh = 0, roll = 0 } = {}) {
  let l = lt, fov = W.FOV[14];
  if (stutter) { l = Math.floor(lt * 15) / 15; fov = W.FOV[14] / Math.pow(1.03, Math.floor(lt * 15) % 6); }
  const z = z0 * (1 - push * clamp(l / dur));
  W.camLook(camera, [1.4, 0.32, z], [1.4, ty, 0], fov, { roll });
  W.handheld(camera, t, hh, 7);
  return fov;
}
export const HUMAN_C = [1.4, 0, 12.2];
/**
 * The ii-line-waits-2 set: hall (dark or alarm), REVIEW mass (300u), TEST mass (160u), card spill, the human (back to camera, looking up),
 * a cold top light (shaft + floor pool) the human stands in.  humanUnderSet(scene, { state, review, test, lit }) ->
 *   { H, rev, test, spillI, human, shaft, update(lt, { t, review, test, red, lit, shake, tip, pinDiv, alarm, rim, rimK, poolK, sky }) }
 */
export function humanUnderSet(scene, { state = 'dark', reviewMax = 600, testMax = 340, lit = 0 } = {}) {
  const H = W.hall(scene, { state, parts: { banks: state === 'alarm', foreman: false } });
  const rev = towerMass({ name: 'review', nx: 5, nz: 3, maxH: reviewMax, seed: 3, pinsPerLevel: 2 });
  const test = towerMass({ name: 'test', nx: 3, nz: 3, pitch: [3.25, 2.3], maxH: testMax, seed: 5, pinsPerLevel: 1 });
  scene.add(rev.group, test.group);
  const spillI = spill({}); scene.add(spillI.mesh);
  const human = W.humanAnchor({ act: 'II', pos: HUMAN_C, facing: Math.PI });
  scene.add(human.group);
  const shaft = W.shaft({ rTop: 0.6, rBot: 4.2, h: 60, color: C.ice, k: 1, opacity: 0.16, top: 0.25, bottom: 1.0, apexFade: 0.3 });
  W.aimShaft(shaft, [HUMAN_C[0], 60, HUMAN_C[2] - 1], [HUMAN_C[0], 0, HUMAN_C[2]]);
  scene.add(shaft);
  return {
    H, rev, test, spillI, human, shaft,
    update(lt, p = {}) {
      const t = p.t ?? lt;
      rev.update(lt, { h: p.review ?? 300, t, red: p.red ?? 1, lit: p.lit ?? lit, shake: p.shake ?? 0, tip: p.tip ?? 0, pinDiv: p.pinDiv ?? 1 });
      test.update(lt, { h: p.test ?? 160, t, red: p.red ?? 1, lit: p.lit ?? lit, shake: (p.shake ?? 0) * 0.5, pinDiv: p.pinDiv ?? 1 });
      human.update(lt, { rim: p.rim ?? C.ice, rimK: p.rimK ?? 3 });
      const poolK = p.poolK ?? 1;
      shaft.userData.set(1.0 * poolK, 0.16 * poolK);
      H.extra.length = 0;
      H.extra.push({ p: [HUMAN_C[0], 9, HUMAN_C[2] - 0.5], c: p.rim ?? C.ice, k: 6 * poolK, pool: 3.4, poolK: 2.2, refl: 1.4, size: 0.8 });
      H.extra.push(...rev.sources(), ...test.sources());
      if (H.line) H.line.update(lt, { lit: 0, dim: 0.35, red: [0, 0, 0, 0.5 * (p.red ?? 1), 0.4 * (p.red ?? 1), 0, 0] });
      if (H.banks) H.banks.update(lt, { on: 0, alarm: p.alarm ?? 0, t });
      H.update(lt, { alarm: p.alarm ?? 0, sky: p.sky ?? 3 });
    },
  };
}

// ----------------------------------------------------------------------------------------- 2D: refrain slot card
/** THE LINE WAITS. (refrain slot): cond 220 px at (960, 820), ice #CFE3F2, K.slam 1.12 -> 1.0 in 5 f, over a band darkened ~-0.8 stop. */
export function refrain(root, tl, K, { html = 'THE LINE WAITS.', at = 0.1, out = 1.6, color = ICE_CSS } = {}) {
  const band = K.el('div', { style: { position: 'absolute', left: '0px', top: '640px', width: '1920px', height: '360px', background: 'radial-gradient(ellipse 58% 52% at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0) 100%)' } }, root);
  const el = K.text(root, { y: 820, w: 1900, cls: 'cond', html, style: { color, textShadow: '0 0 28px rgba(0,0,0,0.6)' } });
  K.slam(tl, el, at, { from: 1.12, d: 5 / 30, blur: 10 });
  gsap.set(band, { autoAlpha: 0 }); tl.set(band, { autoAlpha: 1 }, at);
  if (out !== null) { K.cutOut(tl, el, out); tl.set(band, { autoAlpha: 0 }, out); }
  return el;
}

// ----------------------------------------------------------------------------------------- REVIEW's input lectern (human speed)
/** The reviewer's lectern at REVIEW's input: a 2 x 1.2 screen on a post at the front edge of the CODE deck, just before the bulkhead,
 *  facing +z (tilted back 10 deg). Ice code lines + a steel-blue block cursor (#CFE3F2, nominal k3) that blinks at HUMAN speed.
 *  lectern() -> { group, screen, cursor, cursorPos, update(lt, { on 0..1, k (cursor nominal k), screenK 0..1, t }) } */
export const LECTERN = { p: [-13.4, 3.0, 4.35], w: 2, h: 1.2, tilt: -0.17 };
export function lectern({ px = 1400, seed = 36 } = {}) {
  const group = new THREE.Group();
  group.position.set(...LECTERN.p);
  const dark = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, metalness: 0.6, roughness: 0.4 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), dark); post.position.set(0, 0.28, 0); group.add(post);
  const head = new THREE.Group(); head.position.set(0, 0.55 + LECTERN.h / 2, 0); head.rotation.x = LECTERN.tilt; group.add(head);
  const back = new THREE.Mesh(new THREE.BoxGeometry(LECTERN.w + 0.12, LECTERN.h + 0.12, 0.06), dark); back.position.z = -0.04; head.add(back);
  const r = rand(seed);
  const lines = [];
  for (let i = 0; i < 9; i++) { const segs = []; let x = 0.06 + Math.floor(r() * 3) * 0.05; const n = 1 + Math.floor(r() * 4); for (let k = 0; k < n; k++) { const w = 0.04 + r() * 0.16; segs.push([x, w, r()]); x += w + 0.02; } lines.push(segs); }
  const CUR_LINE = 5;
  lines[CUR_LINE] = [];   // the reviewer's cursor waits at the start of an empty line
  const st = { k: 1 };
  const screen = W.G.canvasPlane({ w: LECTERN.w, h: LECTERN.h, px, glow: true, draw: (g, w, h) => {
    g.fillStyle = 'rgba(7,10,14,0.96)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(91,122,147,0.55)'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
    const lh = h / 11;
    lines.forEach((segs, i) => {
      const y = lh * (i + 1.4);
      segs.forEach(([x, ww, c]) => { g.fillStyle = c < 0.6 ? `rgba(143,175,200,${0.55 * st.k})` : c < 0.85 ? `rgba(207,227,242,${0.75 * st.k})` : `rgba(91,122,147,${0.8 * st.k})`; g.fillRect(x * w, y - lh * 0.17, ww * w, lh * 0.34); });
      if (i === CUR_LINE) { st.cx = 0.06; st.cy = y / h; }
    });
  } });
  head.add(screen);
  const lh = LECTERN.h / 11;
  const cursor = W.glowMesh(new THREE.BoxGeometry(1, 1, 1), C.ice, 3, { shade: 'box', min: 0.3 });
  const cx = -LECTERN.w / 2 + st.cx * LECTERN.w + 0.035, cy = LECTERN.h / 2 - st.cy * LECTERN.h;
  cursor.scale.set(0.07, lh * 0.72, 0.012); cursor.position.set(cx, cy, 0.012); head.add(cursor);
  const _v = new THREE.Vector3();
  return {
    group, screen, cursor, head,
    cursorWorld() { cursor.updateWorldMatrix(true, false); return cursor.getWorldPosition(_v).toArray(); },
    update(lt, { on = 1, k = 3, screenK = 1 } = {}) {
      if (Math.abs(st.k - screenK) > 1e-3) { st.k = screenK; screen.userData.redraw(lt); }
      cursor.visible = on > 0.01; cursor.userData.setGlow(k * on);
    },
  };
}

// =====================================================================================================
// Appended for shots 38-47 (tricolon stamps, plant 3, MASTER C, swarm, two writers). New exports only.
// =====================================================================================================
const _FOG_V = 'varying float vFogDepth;';
const _FOG_F = `uniform vec3 fogColor; uniform float fogDensity; varying float vFogDepth;
  float fogF(){ return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth); }`;
/** soft additive radial glow card (faces +z; fogged). glowCard({ w, h, color, k, falloff }) -> mesh; userData.set(k, hex?) */
export function glowCard({ w = 4, h = 2, color = C.red, k = 0.5, falloff = 3.2, fog = true } = {}) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uCol: { value: new THREE.Color(color).multiplyScalar(k) }, uF: { value: falloff } }]),
    vertexShader: `varying vec2 vUv; ${_FOG_V} void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uF; varying vec2 vUv; ${_FOG_F}
      void main(){ vec2 q = (vUv - 0.5) * 2.0; float r2 = dot(q, q); float a = exp(-r2 * uF) * (1.0 - smoothstep(0.6, 1.0, r2)); gl_FragColor = vec4(uCol * a * (1.0 - fogF()), 1.0); }`,
  });
  mat.blending = THREE.CustomBlending; mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneFactor; mat.blendEquation = THREE.AddEquation;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.frustumCulled = false;
  m.userData.set = (kk, hex = color) => { mat.uniforms.uCol.value.set(hex).multiplyScalar(kk); m.visible = kk > 1e-4; };
  return m;
}

/**
 * World-space STAMP for the REVIEW. / TEST. / DEPLOY. tricolon: a text3D word (danger red, RAW k) over an additive red under-glow,
 * K.slam in world space (scale `from` -> 1 expo-out over d, k spikes to `peak` and settles), plus a hard ring of red light.
 * stamp3D('REVIEW.', { height (cap u), k, glow }) -> { group, mesh, halo, size, update(dt) }   (dt = seconds since the stamp; < 0 hidden)
 */
export function stamp3D(text, { height = 1.4, color = C.red, k = 2.4, glow = 0.35, glowW = 1.3, glowH = 2.4, font = '800 160px "Inter Tight"', from = 1.35, d = 0.3, peak = 3.2 } = {}) {
  const group = new THREE.Group();
  const mesh = W.text3D(text, { height, color, k, font });
  const [w, h] = mesh.userData.size;
  const halo = glowCard({ w: w * glowW, h: h * glowH, color, k: glow, falloff: 2.6 });
  halo.position.z = -0.03;
  group.add(halo, mesh);
  return {
    group, mesh, halo, size: [w, h],
    update(dt, { k: kk = k, glow: gk = glow } = {}) {
      group.visible = dt >= 0;
      if (dt < 0) return;
      const s = stampScale(dt, { from, d });
      group.scale.set(s, s, s);
      const e = stampK(dt, { peak, d: d * 1.2 });
      mesh.userData.set(kk * e, color);
      halo.userData.set(gk * (0.6 + 0.4 * e) * (dt < 0.05 ? 2.2 : 1), color);
    },
  };
}

// ----------------------------------------------------------------------------------------- MASTER C, monumental variant (ii-line-waits-2)
/** MASTER C camera as built: 14mm worm's-eye from (x, 0.3, z0) creeping `push` toward the mass, pitched so the floor horizon sits at
 *  ~y 930 px. ii-line-waits-2 uses x -1.7 / z0 52 so the tiny human (at HUMAN_C) stands in the word gap of the refrain card
 *  (between LINE and WAITS., ~x 1028 px). Returns the fov for camFX. */
export function camHumanUnderTowerC(camera, lt, { dur = 2, z0 = 58, x = 1.4, push = 0.04, pitch = 26.9, t = lt, handheld: hh = 0, roll = 0 } = {}) {
  const z = z0 * (1 - push * ease.out(clamp(lt / dur)));
  const ty = 0.3 + z * Math.tan(THREE.MathUtils.degToRad(pitch));
  W.camLook(camera, [x, 0.3, z], [x, ty, 0], W.FOV[14], { roll });
  W.handheld(camera, t, hh, 7);
  return W.FOV[14];
}
/**
 * The MASTER C set, monumental: a 9 x 3 stepped REVIEW mass (16-card bundles, 300u) over a wide lit scree of spilled cards, the TEST mass
 * at frame right, the human (back to camera, at HUMAN_C) in a hard cold top-light pool with a volumetric shaft, a haze glow behind the
 * scree so his silhouette cuts black against light.  humanUnderSetC(scene, { review, test }) -> { H, rev, test, scree, human, shaft, update(lt, p) }
 * update p: { t, review (u), test (u), red, pinDiv, rimK, poolK, sky, shake, lit, alarm }
 */
export function humanUnderSetC(scene, { reviewMax = 300, testMax = 170, state = 'dark', lit = 0 } = {}) {
  const H = W.hall(scene, { state, parts: { banks: state === 'alarm', foreman: false } });
  const rev = towerMass({ name: 'review', nx: 13, nz: 3, pitch: [3.25, 2.3], maxH: reviewMax, seed: 3, bundle: 16, taper: 0.42, pinsPerLevel: 4, pinEvery: 9 });
  const test = towerMass({ base: [33, 3, -1], nx: 3, nz: 3, maxH: testMax, seed: 5, bundle: 16, taper: 0.25, pinsPerLevel: 2, pinEvery: 10 });
  scene.add(rev.group, test.group);
  const scree = spill({ x0: -22, x1: 25, n: 500, seed: 421, zTop: 4.2, zFoot: 10.6, yTop: 4.2, k: 1.05 });
  scene.add(scree.mesh);
  const human = W.humanAnchor({ act: 'II', pos: HUMAN_C, facing: Math.PI });
  scene.add(human.group);
  const shaft = W.shaft({ rTop: 0.7, rBot: 4.6, h: 60, color: C.ice, k: 1.0, opacity: 0.16, top: 0.2, bottom: 1.0, apexFade: 0.35 });
  W.aimShaft(shaft, [HUMAN_C[0], 46, HUMAN_C[2] - 1.5], [HUMAN_C[0], 0, HUMAN_C[2]]);
  scene.add(shaft);
  const topL = new THREE.PointLight(C.ice, 0, 14, 1.4); topL.position.set(HUMAN_C[0], 1.9, HUMAN_C[2] - 2.2); scene.add(topL);
  const behind = glowCard({ w: 3.6, h: 4.4, color: 0xb8d2e6, k: 0.1, falloff: 2.0 }); behind.position.set(HUMAN_C[0], 1.5, HUMAN_C[2] - 1.4); scene.add(behind);
  const sky = glowCard({ w: 150, h: 230, color: 0x8fb0c8, k: 0.11, falloff: 2.0 }); sky.position.set(4, 95, -70); scene.add(sky);
  const api = {
    H, rev, test, scree, human, shaft, topL, behind,
    update(lt, p = {}) {
      const t = p.t ?? lt, red = p.red ?? 1, L = p.lit ?? lit;
      rev.update(lt, { h: p.review ?? 300, t, red, lit: L, shake: p.shake ?? 0, pinDiv: p.pinDiv ?? 1, k: p.k ?? 1.3, body: p.body ?? 1.1 });
      test.update(lt, { h: p.test ?? 165, t, red, lit: L, shake: (p.shake ?? 0) * 0.5, pinDiv: p.pinDiv ?? 1, k: (p.k ?? 1.3) * 0.9, body: 1.0 });
      human.update(lt, { rim: p.rim ?? C.ice, rimK: p.rimK ?? 3.2 });
      const pk = p.poolK ?? 1;
      shaft.userData.set(0.8 * pk, 0.13 * pk);
      topL.intensity = 5 * pk;
      behind.userData.set(0.34 * pk, 0xb8d2e6);
      H.extra.length = 0;
      H.extra.push({ p: [HUMAN_C[0], 9, HUMAN_C[2] - 0.6], c: p.rim ?? C.ice, k: 3.2 * pk, pool: 3.8, poolK: 1.6, refl: 1.0, size: 0.9 });
      H.extra.push(...rev.sources(), ...test.sources());
      if (H.line) H.line.update(lt, { lit: L, dim: 0.35, red: [0, 0, 0, 0.5 * red, 0.4 * red, 0, 0] });
      if (H.banks) H.banks.update(lt, { on: 0, alarm: p.alarm ?? 0, t });
      H.update(lt, { alarm: p.alarm ?? 0, sky: p.sky ?? 3, lit: L });
    },
  };
  return api;
}
/** refrain card for MASTER C: identical type to refrain() (cond 220 px, ice, (960, 820), K.slam 1.12 -> 1 in 5 f) over a darkening band
 *  that stops above the horizon so the tiny human below the card keeps his light. */
export function refrainC(root, tl, K, { html = 'THE LINE WAITS.', at = 0.25, out = 1.75, color = ICE_CSS } = {}) {
  const band = K.el('div', { style: { position: 'absolute', left: '0px', top: '650px', width: '1920px', height: '250px', background: 'radial-gradient(ellipse 50% 60% at 50% 62%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 100%)' } }, root);
  const el = K.text(root, { y: 820, w: 1900, cls: 'cond', html, style: { color, textShadow: '0 0 28px rgba(0,0,0,0.6)' } });
  K.slam(tl, el, at, { from: 1.12, d: 5 / 30, blur: 10 });
  gsap.set(band, { autoAlpha: 0 }); tl.set(band, { autoAlpha: 1 }, at);
  if (out !== null) { K.cutOut(tl, el, out); tl.set(band, { autoAlpha: 0 }, out); }
  return el;
}
