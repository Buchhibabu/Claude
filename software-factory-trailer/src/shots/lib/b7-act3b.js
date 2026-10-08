// Batch b7-act3b helpers (shots 84-103: mirror tour, stillness, light-before-sound, 5.5, the foreman reveal, proofs).
// Wraps / extends lib/world.js pieces; never edits them. Import from a shot file: import * as B from './lib/b7-act3b.js';
import { clamp, lerp, ease, rand } from '../../engine.js';
import * as W from './world.js';
const { THREE, G } = W;

// ----------------------------------------------------------------------------------------- music beds (copied from the shot list)
const ACT3_ADD = ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'];
export const act3 = (chord, energy) => ({ section: 'act3', chord, div: 16, energy, add: [...ACT3_ADD], drop: [] });
export const peak = (chord, energy) => ({ section: 'peak', chord, div: 16, energy, add: [...ACT3_ADD], drop: [] });
export const still = () => ({ section: 'act3', chord: 'Bb', div: 4, energy: 0.3, add: ['pad'], drop: ['pulse', 'ostinato', 'kick', 'drums', 'hats', 'strings'] });

// ----------------------------------------------------------------------------------------- PROOF CARD (lower third)
// Slam claim (Inter Tight 800, ivory, claim token in clay) + ice mono kicker (decode) on a -0.8 stop scrim.
// enter:false = carried over from the previous shot: identical layout, already settled (no re-entrance), push continues.
export function proofCard(root, tl, K, { html, kicker, size = 112, y = 818, ky = 968, enter = true, cutOut = null, kAt = 0.2, push = null } = {}) {
  const scrim = K.el('div', { style: { position: 'absolute', left: '0px', right: '0px', bottom: '0px', height: '470px', background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 42%, rgba(0,0,0,0) 100%)' } }, root);
  const t = K.text(root, { y, cls: 'slam', html, w: 1840, style: { fontSize: size + 'px', lineHeight: '1.0', letterSpacing: '-0.028em', color: '#FAF9F5', textShadow: '0 6px 40px rgba(0,0,0,0.65)' } });
  const k = K.text(root, { y: ky, cls: 'mono', html: kicker, w: 1200, style: { fontSize: '30px', letterSpacing: '0.18em', color: 'rgba(207,227,242,0.85)', textTransform: 'uppercase', textShadow: '0 2px 14px rgba(0,0,0,0.8)' } });
  if (enter) { K.maskUp(tl, t, 0.0, { d: 0.42, stagger: 0.07 }); K.decode(tl, k, kAt, { d: 0.4 }); }
  if (push) K.push(tl, t, 0, push.d, { from: push.from, to: push.to });
  if (cutOut !== null) { K.cutOut(tl, t, cutOut); K.cutOut(tl, k, cutOut); K.cutOut(tl, scrim, cutOut); }
  return { t, k, scrim };
}

// ----------------------------------------------------------------------------------------- the lit hall
/** Lit hall with everything ON (Act III after the turn). Returns H; call B.litUpdate(H, lt, t, {...}) then H.update(lt) LAST. */
export function litHall(scene, parts = {}) { return W.hall(scene, { state: 'lit', parts }); }
export function litUpdate(H, lt, t, { foreman = 5, banks = 1, beam = 1, housing, rim = 0.3, foremanOpts = {}, line = true, stripK = 3, codeK = 8, strips = 1 } = {}) {
  if (H.banks) H.banks.update(lt, { on: banks, t, beam, ...(housing !== undefined ? { housing } : {}) });
  if (H.line && line) H.line.update(lt, { lit: 1, strips, stripK, codeK });
  if (H.foreman) H.foreman.update(lt, foreman > 0 ? { lit: foreman, ...foremanOpts } : { lit: 0, rimColor: W.C.amber, rimK: rim, ...foremanOpts });
}

// ----------------------------------------------------------------------------------------- line flow (work moving L->R on the station tops)
/** Particle flow along the whole line (station tops, y 3.4) moving +x at `speed` u/s. lineFlow({count, lanes, speed, k}) -> G.flow API (.update(t)). */
export function lineFlow({ count = 3000, lanes = 7, speed = 30, k = 3, size = 0.35, x0 = -72, x1 = 72, y = 3.45, width = 7, color = W.C.amberRail, seed = 701 } = {}) {
  const curves = [];
  for (let j = 0; j < lanes; j++) { const z = lanes === 1 ? 0 : -width / 2 + (width * j) / (lanes - 1); curves.push(G.spline([[x0, y, z], [lerp(x0, x1, 0.5), y, z], [x1, y, z]])); }
  const F = G.flow({ curves, count, speed: speed / (x1 - x0), size, color, seed, jitter: 0.08 });
  F.material.color.set(color).multiplyScalar(W.ko(k));
  F.points.frustumCulled = false;
  return F;
}

// ----------------------------------------------------------------------------------------- pillar beacons ("hundreds of lit points down the hall")
/** Small amber lamps on the aisle faces of all 40 pillars (n per pillar), plus a floor lamp at each pillar foot. update(t, k) blinks them in a slow L->R chase. */
export function pillarBeacons({ per = 6, k = 4 } = {}) {
  const n = 40 * per + 40;
  const O = W.orbs({ count: n, r: 0.32, seg: 6 });
  const pts = [];
  for (const z of [30, -30]) for (let i = 0; i < 20; i++) {
    const x = -285 + 30 * i, zf = z > 0 ? z - 1.15 : z + 1.15;
    for (let j = 0; j < per; j++) pts.push({ p: [x, 8 + j * 9, zf], x, j });
    pts.push({ p: [x, 0.35, z > 0 ? z - 2.2 : z + 2.2], x, j: -1 });
  }
  const api = {
    mesh: O.mesh, O,
    update(t, kk = k) {
      pts.forEach((q, i) => {
        const chase = 0.65 + 0.35 * Math.max(0, Math.sin((q.x / 60 - t * 2.5) * Math.PI));
        O.set(i, { p: q.p, c: W.lin(q.j < 0 ? W.C.amber : W.C.amberRail), k: kk * (q.j < 0 ? 1.4 : chase) });
      });
      O.commit();
    },
  };
  api.update(0);
  return api;
}

// ----------------------------------------------------------------------------------------- dust / embers (depth + parallax)
/** Warm air motes in a box; update(t) drifts them (deterministic). */
export function motes({ count = 2500, center = [0, 20, -100], spread = [200, 60, 160], k = 1.2, size = 0.4, color = W.C.amber, seed = 711, rise = 0.6 } = {}) {
  const P = W.swarmHaze({ count, spread, center, color, k, size, seed });
  const base = P.positions.slice();
  const r = rand(seed + 3); const ph = Float32Array.from({ length: count }, () => r());
  P.points.frustumCulled = false;
  P.update = (t) => {
    for (let i = 0; i < count; i++) {
      const by = base[i * 3 + 1] - center[1] + spread[1] / 2;
      P.positions[i * 3] = base[i * 3] + Math.sin(t * 0.4 + ph[i] * 6.28) * 0.6;
      P.positions[i * 3 + 1] = center[1] - spread[1] / 2 + ((by + t * rise * (0.5 + ph[i])) % spread[1]);
      P.positions[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.33 + ph[i] * 6.28) * 0.6;
    }
    P.geometry.attributes.position.needsUpdate = true;
  };
  return P;
}

// ----------------------------------------------------------------------------------------- the 100-agent team (iii-teams-a / iii-teams-b)
// Exactly 100 orbs. Noise layout -> 12 sub-lead clusters (12 leads + 7 workers each = 96; the 4 left over join clusters 0, 3, 6, 9) -> flat 10x10 sheet.
export const TEAM = (() => {
  const r = rand(951);
  const noise = Array.from({ length: 100 }, () => [(r() - 0.5) * 46, 1.5 + r() * 9, -6 + (r() - 0.5) * 30]);
  const ring = { c: [0, 2.2, -6.5], R: 15.5 };
  const cl = [];   // per orb: { lead: j, isLead, slot, n }
  const leadIdx = [];
  let i = 0;
  for (let j = 0; j < 12; j++) { leadIdx.push(i); cl.push({ j, isLead: true, slot: 0, n: 0 }); i++; }
  const counts = Array(12).fill(7); [0, 3, 6, 9].forEach((j) => { counts[j] = 8; });
  for (let j = 0; j < 12; j++) for (let s = 0; s < counts[j]; s++) { cl.push({ j, isLead: false, slot: s, n: counts[j] }); i++; }
  const leadPos = (j) => { const a = (j / 12) * Math.PI * 2 + Math.PI / 12; return [ring.c[0] + Math.sin(a) * ring.R, ring.c[1] + 0.6, ring.c[2] + Math.cos(a) * ring.R * 0.78]; };
  const cluster = (k, t = 0) => {
    const o = cl[k]; const L = leadPos(o.j);
    if (o.isLead) return L;
    const a = (o.slot / o.n) * Math.PI * 2 + t * 0.9 + o.j;
    return [L[0] + Math.cos(a) * 2.3, L[1] - 0.6 + Math.sin(a * 2 + o.j) * 0.25, L[2] + Math.sin(a) * 2.3];
  };
  const sheet = (k) => { const c = k % 10, rr = Math.floor(k / 10); return [(c - 4.5) * 1.55, 4.2 + (9 - rr) * 1.25, -2 - rr * 0.35]; };
  return { noise, cl, leadIdx, leadPos, cluster, sheet, ring };
})();

/** 3D cubic-ish ease for snaps with a little overshoot */
export const snap = (u) => { u = clamp(u); const s = 1.4; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };

// ----------------------------------------------------------------------------------------- soft glow sprite (no anamorphic streak)
let _soft = null;
function softTex() {
  if (_soft) return _soft;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  _soft = new THREE.CanvasTexture(c); return _soft;
}
/** additive radial glow billboard: glow({ color, k (raw linear gain), size, fog }) -> Sprite; sprite.userData.set(k, hex?) */
export function glow({ color = W.C.amber, k = 0.3, size = 100, fog = false } = {}) {
  const mat = new THREE.SpriteMaterial({ map: softTex(), color: W.hcol(color, k), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog });
  const s = new THREE.Sprite(mat); s.scale.set(size, size, 1); s.frustumCulled = false;
  s.userData.set = (kk, hex = color) => { mat.color.set(hex).multiplyScalar(kk); s.visible = kk > 1e-4; };
  return s;
}

// ----------------------------------------------------------------------------------------- the proof cards (exact shot-list text; carries reuse the same object)
export const CARDS = {
  teams: { html: '<span class="hot">100</span>-AGENT TEAMS PICKED<br>THEIR OWN STRUCTURE.', kicker: 'SYSTEM CARD' },
  stripe: { html: 'ONE SESSION<br>DIRECTED A DOZEN.', kicker: 'STRIPE', size: 124 },
  clio: { html: '<span class="hot">18+</span> HOURS UNATTENDED.', kicker: 'CLIO', size: 124, y: 862 },
  cost: { html: '<span class="hot">40%</span> LOWER COST<br>THAN OPUS 5.', kicker: 'ANTHROPIC' },
};

// ----------------------------------------------------------------------------------------- the Stripe session (iii-stripe / iii-pr-tower)
// One session orb at frame centre; exactly 12 orbs on an arc above it (r 11, 12..168 deg), bowed back in z; quadratic threads bulge
// toward the lens so they read in depth.
export const STRIPE = (() => {
  const session = [0, 9.2, 0];
  const orbs = Array.from({ length: 12 }, (_, j) => { const a = THREE.MathUtils.degToRad(lerp(168, 12, j / 11)); return [Math.cos(a) * 11.2, session[1] + Math.sin(a) * 10.2, -2.6 * Math.sin(a)]; });
  const ctrl = (j, to) => [to[0] * 0.45, session[1] + (to[1] - session[1]) * 0.35 + 1.0, 4.5];
  return { session, orbs, ctrl };
})();

// ----------------------------------------------------------------------------------------- shift-lens camera (verticals stay parallel)
/** level camera (pitch 0) at pos looking toward target's azimuth, with the image shifted so the horizon sits at screen y `horizonY` (px). */
export function camShift(camera, pos, target, fov, horizonY = 700) {
  camera.up.set(0, 1, 0);
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(target[0], pos[1], target[2]);
  if (Math.abs(camera.fov - fov) > 1e-5) { camera.fov = fov; }
  camera.setViewOffset(1920, 1080, 0, -(horizonY - 540), 1920, 1080);
  camera.updateProjectionMatrix();
  return fov;
}
/** wet-floor streak sources under the lit foreman's terraces (push into H.extra each frame). */
export const FOREMAN_REFL = [[-50, 18.3, -139.8], [-25, 18.3, -139.8], [0, 18.3, -139.8], [25, 18.3, -139.8], [50, 18.3, -139.8], [-36, 36.3, -151.8], [0, 36.3, -151.8], [36, 36.3, -151.8], [0, 54.3, -162.8], [0, 74.3, -172.8]];
export function foremanRefl(list, k = 6, refl = 1.4) { FOREMAN_REFL.forEach((p) => list.push({ p, c: W.C.brass, k, pool: 0, refl, size: 5 })); }
