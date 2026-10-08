// Batch b3 (act1b: shots 20..32) helpers — wraps/extends lib/world.js; never edits it.
import { rand, clamp, lerp, ease, kf } from '../../engine.js';
import * as W from './world.js';
const { THREE, G } = W;
export { W, THREE, G };

/** global time for beat-locked things */
export const T = (ctx, lt) => ctx.shot.start + lt;
const D2R = Math.PI / 180;

/** Act I grade from the shot list (bloom 0.8 thr 0.8, sat 0.8, tint cold, exp 0.9, vig 0.5, ca 0.0008) + overrides. */
export const gradeI = (over = {}) => W.grade('I', over);
export const gradeMID = (over = {}) => W.grade('MID', over);

/** FogExp2-safe exposure lift on a hit: +stops decaying over d seconds (dt = s since hit). */
export function stopLift(dt, stops = 0.4, d = 0.5) { return dt < 0 || dt > d ? 1 : Math.pow(2, stops * (1 - ease.out(dt / d))); }

// ------------------------------------------------------------------------------------------------ the tower count plot (act I continuity)
// i-gate-3 300->420 · i-crane-1000 640->1000 (crest at 1.2) · after: 1000 + crest
export const TOWER = { gate3: [300, 420], crane: [640, 1000] };

// ------------------------------------------------------------------------------------------------ month gates hall
/**
 * The approach hall for the FPV gate shots: dark hall + 5 gates + the CODE tower glowing ahead.
 * Fixes the library's oversized counters (they are wider than the 10.8u opening) by scaling them to fit.
 */
export function gateHall(scene, { counterScale = 0.62 } = {}) {
  const H = W.hall(scene, { state: 'dark', parts: { gates: true, tower: true, cursor: true } });
  for (const g of H.gates.gates) if (g.counter) g.counter.scale.setScalar(counterScale);
  // the clay beacon at the end of the hall (the CODE tower's glow, readable from 160u away)
  H.beacon = W.flare({ color: W.C.clay, k: 0, size: 46 }); H.beacon.position.set(-19.6, 12, 2); scene.add(H.beacon);
  return H;
}
/** elevation (deg) of gate n's lintel (y 14) seen from the gate-FPV camera at local time lt */
export function lintelElev(lt, n, y = 1) {
  const sp = [1, 1.3, 1.7, 2.2, 3][n - 1] * 16, tp = [0.75, 0.5, 0.5, 0.5, 0.25][n - 1];
  const d = sp * (tp - lt);
  return Math.atan2(14 - y, Math.max(d, 1e-3)) * 180 / Math.PI;
}
/** floor reflections of the lit lintel pips (one source per visible gate). */
export function gateSources(H, pips, k = 6) {
  return W.GATE_X.map((x, i) => ({ p: [x, 14, 0], c: W.C.brassHi, k: k * (pips[i] / 5) + 0.6, pool: 0, refl: 0.9, size: 6 }));
}
/** camGateFPV position + our own look (pitch up / Dutch), so the lintel pips stay readable through the pass. Returns fov. */
export function camGate(camera, lt, n, { pitch = 0, roll = 0, yaw = 0, x = null, y = null } = {}) {
  const fov = W.camGateFPV(camera, lt, n);
  const p = camera.position.clone();
  if (x !== null) p.x = x;
  if (y !== null) p.y = y;
  const pr = pitch * D2R, yr = yaw * D2R;
  const dir = new THREE.Vector3(Math.cos(pr) * Math.cos(yr), Math.sin(pr), Math.cos(pr) * Math.sin(yr));
  W.camLook(camera, p.toArray(), p.clone().addScaledVector(dir, 40).toArray(), fov, { roll });
  return fov;
}

// ------------------------------------------------------------------------------------------------ tower atmosphere
/**
 * Volumetric clay air around the 1,000-orb tower (light scattered inside the lattice) + a hot core flare.
 * towerHalo(scene) -> { group, update({ k (0..1 level), h (tower height u), core }) }
 */
export function towerHalo(scene, { x = -19.6, z = 0 } = {}) {
  const group = new THREE.Group(); scene.add(group);
  const vol = W.shaft({ rTop: 9.5, rBot: 10.5, h: 32, color: W.C.clay, k: 1, opacity: 0.0, top: 0.8, bottom: 1.0, apexFade: 0.12 });
  vol.position.set(x, 3 + 16, z); group.add(vol);
  const vol2 = W.shaft({ rTop: 5, rBot: 6, h: 30, color: W.C.ember, k: 1, opacity: 0.0, top: 0.9, bottom: 1.0, apexFade: 0.1 });
  vol2.position.set(x, 3 + 15, z); group.add(vol2);
  const core = W.flare({ color: W.C.clay, k: 0, size: 34 }); core.position.set(x, 18, z); group.add(core);
  return {
    group, vol, core,
    update({ k = 1, h = 30, core: c = 1 } = {}) {
      const s = Math.max(0.05, h / 30);
      vol.scale.set(1, s, 1); vol.position.y = 3 + 16 * s; vol2.scale.set(1, s, 1); vol2.position.y = 3 + 15 * s;
      vol.userData.set(1.6 * k, 0.55 * k); vol2.userData.set(2.2 * k, 0.5 * k);
      core.position.y = 3 + h * 0.5; core.userData.set(3.2 * k * c);
      group.visible = k > 0.001;
    },
  };
}

// ------------------------------------------------------------------------------------------------ speed dust / light streaks
/**
 * Air-dust streaks along +x around an FPV path: soft additive segments whose length = motion-blur length (u).
 * streaks({ count, x0, x1, rMin, rMax, cy, seed, color, k }) -> { mesh, update(len, k, camX) }
 */
export function streaks({ count = 420, x0 = -320, x1 = -60, rMin = 2.5, rMax = 26, cy = 6, seed = 5, color = W.C.ice, warm = 0.25, k = 1.2, width = 1.4 } = {}) {
  const r = rand(seed);
  const P = new Float32Array(count * 4), cols = [];
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2, rad = lerp(rMin, rMax, Math.pow(r(), 0.7));
    let y = cy + Math.sin(a) * rad * 0.75, z = Math.cos(a) * rad;
    if (y < 0.15) y = 0.15 + r() * 0.6;   // floor dust hugging the slab
    P[i * 4] = lerp(x0, x1, r()); P[i * 4 + 1] = y; P[i * 4 + 2] = z; P[i * 4 + 3] = 0.35 + r() * 0.65;
    const c = r() < warm ? W.lin(W.C.brassHi, 1) : W.lin(color, 1);
    const b = P[i * 4 + 3];
    cols.push([c[0] * b, c[1] * b, c[2] * b], [c[0] * b * 0.15, c[1] * b * 0.15, c[2] * b * 0.15]);
  }
  const pos = new Float32Array(count * 6);
  const build = (len) => { for (let i = 0; i < count; i++) { const L = len * P[i * 4 + 3]; pos[i * 6] = P[i * 4] + L * 0.5; pos[i * 6 + 1] = P[i * 4 + 1]; pos[i * 6 + 2] = P[i * 4 + 2]; pos[i * 6 + 3] = P[i * 4] - L * 0.5; pos[i * 6 + 4] = P[i * 4 + 1]; pos[i * 6 + 5] = P[i * 4 + 2]; } return pos; };
  const mesh = W.glowSegs(build(1), { colors: cols, k, width, offset: false });
  let lastLen = 1;
  return {
    mesh,
    update(len, kk = k) {
      if (Math.abs(len - lastLen) > 1e-3) { mesh.geometry.setPositions(build(Math.max(0.02, len))); lastLen = len; }
      mesh.userData.set(kk); mesh.visible = kk > 0.001;
    },
  };
}

// ------------------------------------------------------------------------------------------------ drifting motes (lit dust in the air)
/** motes({ count, box:[x0,x1,y0,y1,z0,z1], color, k, size, seed }) -> { points, update(t, { k, drift:[vx,vy,vz] }) } — wraps inside the box. */
export function motes({ count = 1200, box = [-40, 0, 0, 40, -15, 25], color = W.C.clay, k = 2, size = 0.12, seed = 9, drift = [0.2, 0.35, 0.1] } = {}) {
  const P = G.particles({ count, spread: [0, 0, 0], color, size, seed });
  const r = rand(seed + 3); const base = new Float32Array(count * 3), ph = new Float32Array(count);
  for (let i = 0; i < count; i++) { base[i * 3] = lerp(box[0], box[1], r()); base[i * 3 + 1] = lerp(box[2], box[3], r()); base[i * 3 + 2] = lerp(box[4], box[5], r()); ph[i] = r() * 6.28; }
  P.points.frustumCulled = false;
  const span = [box[1] - box[0], box[3] - box[2], box[5] - box[4]];
  const wrap = (v, a, s) => a + ((((v - a) % s) + s) % s);
  P.update = (t, { k: kk = k, drift: d = drift } = {}) => {
    for (let i = 0; i < count; i++) {
      P.positions[i * 3] = wrap(base[i * 3] + d[0] * t + 0.15 * Math.sin(t * 0.7 + ph[i]), box[0], span[0]);
      P.positions[i * 3 + 1] = wrap(base[i * 3 + 1] + d[1] * t + 0.12 * Math.sin(t * 0.9 + ph[i] * 2), box[2], span[1]);
      P.positions[i * 3 + 2] = wrap(base[i * 3 + 2] + d[2] * t, box[4], span[2]);
    }
    P.geometry.attributes.position.needsUpdate = true;
    P.material.color.set(color).multiplyScalar(W.ko(kk));
  };
  return P;
}

// ------------------------------------------------------------------------------------------------ ledger extras
/**
 * Cell-7 glow that reads from every side (the library fill sits inside the bar and only peeks out of the long faces) +
 * a hot wavefront racing from the slot to both ends of the bar along its edges ("seams flare end to end").
 */
export function ledgerExtras(L) {
  const [cx, cy, cz] = L.cellPos(6);
  const group = new THREE.Group();
  const cell = W.glowMesh(new THREE.BoxGeometry(1, 1, 1), W.C.clay, 0, { shade: 'box' });
  cell.scale.set(40 / 12 - 0.24, 1.26, 3.06); cell.position.set(cx, cy, cz); group.add(cell);
  const fl = W.flare({ color: W.C.clay, k: 0, size: 10 }); fl.position.set(cx, cy, cz); group.add(fl);
  const fronts = [];
  for (const dir of [-1, 1]) for (const [dy, dz] of [[0.6, 1.5], [0.6, -1.5], [-0.6, 1.5], [-0.6, -1.5]]) {
    const o = W.orbs({ count: 6, r: 0.09, seg: 8 }); group.add(o.mesh); fronts.push({ o, dir, dy, dz });
  }
  const X0 = -39.6, X1 = 0.4;
  return {
    group, cell, flare: fl,
    /** fill 0..1, front: seconds since the stamp (<0 none), speed u/s, k */
    update(lt, { fill = 0, front = -1, speed = 70, k = 14, flare = 0 } = {}) {
      cell.userData.setGlow(10 * fill); cell.visible = fill > 0.001;
      fl.userData.set(flare * 8);
      for (const f of fronts) {
        for (let j = 0; j < 6; j++) {
          const s = front - j * 0.01;
          const x = cx + f.dir * speed * s;
          if (front < 0 || s < 0 || x < X0 || x > X1) { f.o.hide(j); continue; }
          f.o.set(j, { p: [x, cy + f.dy, cz + f.dz], c: W.lin(j === 0 ? W.C.ivory : W.C.brassHi), k: k * Math.pow(1 - j / 6, 1.6) });
        }
        f.o.commit();
      }
    },
  };
}

// ------------------------------------------------------------------------------------------------ camera helpers
/** pose from spherical offset around a target: yaw (deg, 0 = +z), pitch (deg, negative looks down), dist. */
export function camOrbit(camera, target, { yaw = 0, pitch = 0, dist = 10, fov = 31.4, roll = 0, up = [0, 1, 0] } = {}) {
  const yr = yaw * D2R, pr = pitch * D2R;
  const p = [target[0] + Math.sin(yr) * Math.cos(pr) * dist, target[1] - Math.sin(pr) * dist, target[2] + Math.cos(yr) * Math.cos(pr) * dist];
  return W.camLook(camera, p, target, fov, { roll, up });
}

/** a soft full-frame additive card glued to the camera (whiteouts / colour washes), opacity driven per frame. */
export function lensWash(camera, scene, { color = 0xffd8c0, dist = 1 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false, fog: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), mat);
  m.renderOrder = 999; m.frustumCulled = false;
  scene.add(m);
  return {
    mesh: m,
    update(op, hex = color, k = 1) {
      m.visible = op > 0.001;
      mat.opacity = clamp(op); mat.color.set(hex).multiplyScalar(k);
      m.position.copy(camera.position); m.quaternion.copy(camera.quaternion); m.translateZ(-dist);
      const h = 2 * dist * Math.tan((camera.fov * D2R) / 2) * 1.3; m.scale.set(h * camera.aspect / 4 * 1.1, h / 4, 1);
    },
  };
}
export { clamp, lerp, ease, kf, rand };
