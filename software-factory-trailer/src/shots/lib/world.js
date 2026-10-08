// =====================================================================================================
// SHARED WORLD LIBRARY — the one hall every 3D shot of the trailer is set in.
//   import * as W from './lib/world.js';            (from a shot file in src/shots/)
// Units: 1u ~ 1 m (human = 1.8u). y up. Work flows +x (left -> right on screen).
// Every factory returns plain objects { group|mesh, ..., update(lt, params) }. Nothing animates by itself:
// pose everything from lt / global time inside your shot's update(). All layouts are seeded (rand(seed)).
//
// HDR CALIBRATION (important): every k parameter in this API is the shot list's NOMINAL k (cursor k10, core k20,
// banks k12, seams k6 ...). Internally the library renders surfaces/orbs/sprites at k * KS (0.33) and edges / fat
// lines at k * KE (0.7), because at the shot list's bloom strengths (0.8-1.6) nominal k on large or numerous
// emitters washes the frame to white. For your own emissives use W.hdr(hex, k) / W.hdrLine(hex, k) / W.ko(k) / W.kl(k)
// so they sit in the same calibrated range as the set.
// =====================================================================================================
import { rand, clamp, lerp, ease } from '../../engine.js';
import * as G from '../../kit/gl.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
const { THREE } = G;
export { THREE, G };

// ----------------------------------------------------------------------------------------- calibration
export const KS = 0.33;   // orbs, surfaces, sprites
export const KE = 0.7;    // edges, fat lines, rails
export const ko = (k) => k * KS;
export const kl = (k) => k * KE;

// ----------------------------------------------------------------------------------------- palette
export const C = {
  void: 0x050506, slate: 0x141413, graphite: 0x262624, steel: 0x5b7a93, ice: 0xcfe3f2,
  clay: 0xd97757, ember: 0xff8a5c, amberRail: 0xffb070, amber: 0xffd2a0, bankOn: 0xffe2c0,
  brassHi: 0xf3d9b1, brassMid: 0xb88a5a, brassDark: 0x4a3626, brass: 0xe8b47a, deadBrass: 0x3a2e22,
  ivory: 0xfaf9f5, card: 0xe8e6df, red: 0xff453a, green: 0x6ee7a0, obsidian: 0x0b0b0c,
  floor: 0x0a0a0b, grid: 0x1a2430, fog: 0x07090b, fogWarm: 0x0e0906,
};
const _col = new THREE.Color();
/** linear [r,g,b] * k (raw, no calibration) from an sRGB hex */
export function lin(hex, k = 1) { _col.set(hex); return [_col.r * k, _col.g * k, _col.b * k]; }
/** THREE.Color (linear) * k (raw) */
export function hcol(hex, k = 1) { return new THREE.Color(hex).multiplyScalar(k); }
/** calibrated HDR MeshBasicMaterial for surfaces/orbs: colour * ko(k) (fog on). */
export function hdr(hex, k = 3, opts = {}) { return new THREE.MeshBasicMaterial({ color: hcol(hex, ko(k)), toneMapped: false, ...opts }); }
/** calibrated HDR colour for thin lines / edges: colour * kl(k) */
export function hdrLine(hex, k = 2) { return hcol(hex, kl(k)); }
const mixA = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const scaleA = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// ----------------------------------------------------------------------------------------- layout
export const LINE = { x0: -70, x1: 70, y: 1.2, z: 0, len: 140 };
export const STATIONS = [
  ['PLAN', -70, -50.4], ['DESIGN', -50.4, -30.8], ['CODE', -30.8, -8.4], ['REVIEW', -8.4, 11.2],
  ['TEST', 11.2, 30.8], ['DEPLOY', 30.8, 50.4], ['OPERATE', 50.4, 70],
].map(([name, x0, x1], i) => ({ i, name, x0, x1, cx: +((x0 + x1) / 2).toFixed(2), w: +(x1 - x0).toFixed(2) }));
export const ST = { PLAN: 0, DESIGN: 1, CODE: 2, REVIEW: 3, TEST: 4, DEPLOY: 5, OPERATE: 6 };
export const BANK_X = Array.from({ length: 8 }, (_, i) => -70 + 20 * i);
export const GATE_X = [-250, -210, -180, -155, -135];
export const SUBLEAD_X = Array.from({ length: 12 }, (_, j) => -66 + 12 * j);
export const POS = {
  codeTop: [-19.6, 3, 0], reviewBase: [1.4, 3, 0], testBase: [21.0, 3, 0], deployBase: [40.6, 3, 0],
  screen: [-19.6, 2.5, 5.2], cursor: [-19.6, 2.5, 5.3],
  foreman: [0, 0, -200], core: [0, 150, -195], crest: [0, 196, -200], engraving: [0, 64, -172.8],
  humanI: [-19.6, 0, 6], humanII: [1.4, 0, 6], humanIII: [0, 0, -134], brief: [0.25, 1.55, -133.8],
  ledger: [-19.6, 36, 14],
};

// ----------------------------------------------------------------------------------------- time helpers
/** seconds per beat */
export const spb = (bpm = 120) => 60 / bpm;
/** 1 during the first `duty` of every (beat/div) step, else 0. Pass GLOBAL time (ctx.shot.start + lt) so it locks to the music grid. */
export function blink(t, { bpm = 120, div = 1, duty = 0.5, origin = 0 } = {}) {
  const p = spb(bpm) / div; const u = (((t - origin) / p) % 1 + 1) % 1; return u < duty ? 1 : 0;
}
/** decaying pulse 1 -> 0 after each (beat/div) step (for "pulses on 8ths" etc.). */
export function beatPulse(t, { bpm = 120, div = 1, decay = 6, origin = 0 } = {}) {
  const p = spb(bpm) / div; const u = (((t - origin) / p) % 1 + 1) % 1; return Math.exp(-u * decay);
}
/** light ignition envelope (spec): 0 -> 1.3 in 2 frames, settle to 1.0 over the next 6 frames. dt = seconds since switch-on. */
export function ignite(dt, { peak = 1.3, rise = 2 / 30, settle = 6 / 30 } = {}) {
  if (dt <= 0) return 0;
  if (dt < rise) return peak * (dt / rise);
  if (dt < rise + settle) return lerp(peak, 1, ease.out((dt - rise) / settle));
  return 1;
}
/** fluorescent strike: flickers for 0.2 s then holds 1 (deterministic). */
export function strike(dt, seed = 1) {
  if (dt <= 0) return 0; if (dt > 0.2) return 1;
  const r = rand(seed + Math.floor(dt * 60)); r(); return r() < dt * 5 ? 1 : 0.15;
}
/** fog density that keeps `keep` (0..1) contrast at distance d (FogExp2): use for high top-downs / telephotos. */
export function fogKeep(d, keep = 0.8) { return Math.sqrt(-Math.log(clamp(keep, 1e-4, 0.9999))) / d; }

// ----------------------------------------------------------------------------------------- grades (per act)
const GRADES = {
  COLD: { bloom: { strength: 1.2, radius: 0.4, threshold: 0.7 }, sat: 0.9, tint: [1.05, 1.0, 0.94], exposure: 0.62, ca: 0.0012, vignette: 0.5, lift: 0, fog: 0.01, fogColor: 0x0b0907 },
  I: { bloom: { strength: 0.8, radius: 0.4, threshold: 0.8 }, sat: 0.8, tint: [0.96, 1.0, 1.06], exposure: 0.9, ca: 0.0008, vignette: 0.5, lift: 0, fog: 0.005, fogColor: C.fog },
  MID: { bloom: { strength: 0.9, radius: 0.4, threshold: 0.85 }, sat: 0.7, tint: [0.96, 1.0, 1.06], exposure: 0.85, ca: 0.0008, vignette: 0.6, lift: 0, fog: 0.005, fogColor: C.fog },
  II: { bloom: { strength: 0.9, radius: 0.4, threshold: 0.8 }, sat: 0.75, tint: [0.95, 1.0, 1.07], exposure: 0.95, ca: 0.001, vignette: 0.55, lift: 0, fog: 0.005, fogColor: C.fog },
  III: { bloom: { strength: 1.1, radius: 0.45, threshold: 0.75 }, sat: 1.05, tint: [1.04, 1.0, 0.95], exposure: 1.0, ca: 0.0006, vignette: 0.4, lift: 0, fog: 0.004, fogColor: C.fogWarm },
  TITLE: { bloom: { strength: 1.5, radius: 0.4, threshold: 0.7 }, sat: 1.0, tint: [1.02, 1.0, 0.97], exposure: 1.0, ca: 0.0008, vignette: 0.5, lift: 0, fog: 0.0, fogColor: 0x000000 },
  BUTTON: { bloom: { strength: 0.9, radius: 0.4, threshold: 0.8 }, sat: 0.9, tint: [1.0, 1.0, 1.02], exposure: 0.9, ca: 0.0008, vignette: 0.5, lift: 0, fog: 0.005, fogColor: C.fog },
};
/** Fresh grade object to spread into a shot's three() return: { bloom, sat, tint, exposure, ca, vignette, lift } (+ fog, fogColor hints). */
export function grade(act = 'I', over = {}) {
  const g = GRADES[act] || GRADES.I;
  const out = { ...g, bloom: { ...g.bloom, ...(over.bloom || {}) }, tint: [...(over.tint || g.tint)] };
  for (const [k, v] of Object.entries(over)) if (k !== 'bloom' && k !== 'tint') out[k] = v;
  return out;
}
/** iii-bank-1..8: grade warms one step per bank (i = 1..8): tint cold -> warm, sat 0.75 -> 1.0. */
export function bankGrade(i) {
  const u = clamp(i / 8);
  return { bloom: { strength: 1.0, radius: 0.4, threshold: 0.78 }, sat: lerp(0.75, 1.0, u), tint: mixA([0.95, 1, 1.07], [1.04, 1, 0.95], u), exposure: lerp(0.95, 1.0, u), ca: 0.0008, vignette: lerp(0.55, 0.42, u), lift: 0 };
}
/** bloom strength on a hit: decays from peak to base over d seconds (dt = seconds since the hit). */
export function bloomHit(base, dt, { peak = 1.6, d = 0.66 } = {}) { return dt < 0 || dt > d ? base : lerp(peak, base, ease.out(dt / d)); }

// ----------------------------------------------------------------------------------------- stage
const LIGHTS = {
  COLD: { amb: 0.05, key: 0.15, keyCol: 0xffd2a0, rim: 0.35, rimCol: 0xff9a60 },
  I: { amb: 0.04, key: 0.15, keyCol: 0xcfe3f2, rim: 0.25, rimCol: 0x5b7a93 },
  MID: { amb: 0.03, key: 0.12, keyCol: 0xcfe3f2, rim: 0.2, rimCol: 0x5b7a93 },
  II: { amb: 0.04, key: 0.15, keyCol: 0xcfe3f2, rim: 0.3, rimCol: 0x5b7a93 },
  III: { amb: 0.08, key: 0.4, keyCol: 0xffd2a0, rim: 0.5, rimCol: 0xffb070 },
  TITLE: { amb: 0.0, key: 0.0, keyCol: 0xffffff, rim: 0.0, rimCol: 0xffffff },
  BUTTON: { amb: 0.04, key: 0.15, keyCol: 0xcfe3f2, rim: 0.25, rimCol: 0x5b7a93 },
};
/** Scene + camera + act lighting. stage({ act:'I', fog, fogColor, fov, far }) -> { scene, camera, lights:{amb,key,rim}, setFog(density, color?) } */
export function stage({ act = 'I', fog, fogColor, fov = 40, near = 0.1, far = 2400 } = {}) {
  const g = GRADES[act] || GRADES.I, L = LIGHTS[act] || LIGHTS.I;
  const scene = new THREE.Scene();
  const fc = new THREE.Color(fogColor ?? g.fogColor);
  scene.background = fc.clone();
  scene.fog = new THREE.FogExp2(fc.clone(), fog ?? g.fog);
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, near, far);
  const amb = new THREE.AmbientLight(0xffffff, L.amb);
  const key = new THREE.DirectionalLight(L.keyCol, L.key); key.position.set(60, 140, 90);
  const rim = new THREE.DirectionalLight(L.rimCol, L.rim); rim.position.set(-80, 40, -160);
  scene.add(amb, key, rim);
  return {
    scene, camera, lights: { amb, key, rim },
    setFog(d, color) { scene.fog.density = d; if (color !== undefined) { scene.fog.color.set(color); scene.background.set(color); } },
  };
}

// ----------------------------------------------------------------------------------------- shared shader bits
const FOG_V = `varying float vFogDepth;`;
const FOG_F = `uniform vec3 fogColor; uniform float fogDensity; varying float vFogDepth;
  float fogF(){ return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth); }`;
const withFog = (u) => THREE.UniformsUtils.merge([THREE.UniformsLib.fog, u]);

const GEO = {};   // shared geometry cache (module level, reused by every shot)
const geo = (key, make) => GEO[key] || (GEO[key] = make());
const BOX = () => geo('box', () => new THREE.BoxGeometry(1, 1, 1));
const SPHERE = (seg = 12) => geo('sph' + seg, () => new THREE.SphereGeometry(1, seg, Math.max(6, seg * 0.66 | 0)));

/**
 * MeshStandardMaterial + screen-space emissive EDGES (fwidth on face UVs; BoxGeometry, instanced or not) + flat emissive add
 * + optional height fade. Edges dim automatically when a face gets thinner than ~12 px (no moire on dense stacks).
 * mat.setEdge(hex, k) / mat.setBody(hex, k) take RAW linear k (use kl()/ko() for calibrated values). mat.userData.U = uniforms.
 */
export function edgeStd({ color = C.slate, metal = 0.5, rough = 0.45, edge = C.steel, edgeK = 0.3, edgeW = 1.3, body = 0x000000, bodyK = 0, fadeY = null, instanced = false, emissive = 0x000000, emissiveK = 0, side = THREE.FrontSide, crowd = 0.12 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough, emissive, emissiveIntensity: emissiveK, side });
  const U = {
    uEdge: { value: hcol(edge, edgeK) }, uEdgeW: { value: edgeW }, uBody: { value: hcol(body, bodyK) },
    uFadeY: { value: new THREE.Vector2(fadeY ? fadeY[0] : 0, fadeY ? fadeY[1] : -1) }, uCrowd: { value: crowd },
  };
  mat.userData.U = U;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec2 vEUv; varying float vEY;
        #ifdef EDGE_INST
          attribute vec3 aEdge; attribute vec3 aBody; varying vec3 vEdgeI; varying vec3 vBodyI;
        #endif`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vEUv = uv;
        { vec4 ew = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            ew = instanceMatrix * ew;
          #endif
          ew = modelMatrix * ew; vEY = ew.y; }
        #ifdef EDGE_INST
          vEdgeI = aEdge; vBodyI = aBody;
        #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uEdge; uniform float uEdgeW; uniform vec3 uBody; uniform vec2 uFadeY; uniform float uCrowd;
        varying vec2 vEUv; varying float vEY;
        #ifdef EDGE_INST
          varying vec3 vEdgeI; varying vec3 vBodyI;
        #endif`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec2 fw = max(fwidth(vEUv), vec2(1e-6));
          vec2 dd = min(vEUv, 1.0 - vEUv) / fw;
          float e = 1.0 - smoothstep(uEdgeW * 0.45, uEdgeW, min(dd.x, dd.y));
          e *= clamp((1.0 / max(fw.x, fw.y) - 3.0) / 9.0, uCrowd, 1.0);
          float fy = uFadeY.y > uFadeY.x ? 1.0 - smoothstep(uFadeY.x, uFadeY.y, vEY) : 1.0;
          vec3 ec = uEdge; vec3 bc = uBody;
          #ifdef EDGE_INST
            ec *= vEdgeI; bc += vBodyI;
          #endif
          totalEmissiveRadiance += (ec * e + bc) * fy; }`);
  };
  if (instanced) mat.defines = { EDGE_INST: '' };
  mat.customProgramCacheKey = () => 'edgeStd' + (instanced ? 'I' : '');
  mat.setEdge = (hex, k) => U.uEdge.value.set(hex).multiplyScalar(k);
  mat.setBody = (hex, k) => U.uBody.value.set(hex).multiplyScalar(k);
  return mat;
}

/**
 * Instanced edge-boxes (cards, rails, pillars, plinths...). One draw call, per-instance transform + edge colour + body glow.
 *   const I = W.boxes({ count, size:[w,h,d], color, metal, rough, edgeW, fadeY })
 *   I.set(i, { p:[x,y,z], r:[rx,ry,rz], s:[sx,sy,sz]|s, edge:[r,g,b], body:[r,g,b] }); I.hide(i); I.commit();
 *   edge/body are RAW linear HDR triples: build them with W.lin(hex, W.kl(k)) / W.lin(hex, W.ko(k)).
 * size is baked into the geometry (s multiplies it). Unset instances are hidden.
 */
export function boxes({ count = 100, size = [1, 1, 1], color = C.card, metal = 0.2, rough = 0.6, edgeW = 1.3, fadeY = null, geometry = null, crowd = 0.12 } = {}) {
  const g = (geometry || new THREE.BoxGeometry(size[0], size[1], size[2])).clone();
  const aEdge = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  const aBody = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  g.setAttribute('aEdge', aEdge); g.setAttribute('aBody', aBody);
  const material = edgeStd({ color, metal, rough, edge: 0xffffff, edgeK: 1, edgeW, fadeY, instanced: true, crowd });
  const mesh = new THREE.InstancedMesh(g, material, count);
  mesh.frustumCulled = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < count; i++) mesh.setMatrixAt(i, zero);
  return {
    mesh, material, count,
    set(i, { p = [0, 0, 0], r = null, s = 1, edge = null, body = null } = {}) {
      v.set(p[0], p[1], p[2]);
      if (Array.isArray(s)) s3.set(s[0], s[1], s[2]); else s3.set(s, s, s);
      if (r) q.setFromEuler(e.set(r[0], r[1], r[2])); else q.identity();
      mesh.setMatrixAt(i, m4.compose(v, q, s3));
      if (edge) aEdge.setXYZ(i, edge[0], edge[1], edge[2]);
      if (body) aBody.setXYZ(i, body[0], body[1], body[2]);
    },
    setQ(i, p, quat, s) { v.set(p[0], p[1], p[2]); if (Array.isArray(s)) s3.set(s[0], s[1], s[2]); else s3.set(s, s, s); mesh.setMatrixAt(i, m4.compose(v, quat, s3)); },
    color(i, edge, body) { if (edge) aEdge.setXYZ(i, edge[0], edge[1], edge[2]); if (body) aBody.setXYZ(i, body[0], body[1], body[2]); },
    hide(i) { mesh.setMatrixAt(i, zero); },
    commit() { mesh.instanceMatrix.needsUpdate = true; aEdge.needsUpdate = true; aBody.needsUpdate = true; },
  };
}

// Size compensation: an emitter that covers a lot of screen is dimmed (and a sub-pixel spark is boosted) so close-ups keep their
// colour instead of clipping to white, while far sparks still bloom. comp = clamp((ref / ndcRadius)^0.6, min, max).
const COMP = { ref: 0.05, min: 0.25, max: 1.6 };
function orbMaterial({ ref = COMP.ref, min = COMP.min, max = COMP.max } = {}) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: withFog({ uRef: { value: ref }, uMin: { value: min }, uMax: { value: max } }),
    vertexShader: `uniform float uRef; uniform float uMin; uniform float uMax; varying vec3 vCol; varying float vF; varying float vComp; ${FOG_V}
      void main(){
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        vF = max(dot(n, normalize(-mv.xyz)), 0.0);
        vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float rad = length((modelMatrix * instanceMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
        float ndc = rad * projectionMatrix[1][1] / max(-c.z, 0.05);
        vComp = clamp(pow(uRef / max(ndc, 1e-5), 0.6), uMin, uMax);
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #else
          vCol = vec3(1.0);
        #endif
        vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vCol; varying float vF; varying float vComp; ${FOG_F}
      void main(){ float core = pow(vF, 2.5); vec3 c = vCol * vComp * (0.25 + 0.95 * core);
        gl_FragColor = vec4(mix(c, fogColor, fogF()), 1.0); }`,
  });
}
/** Single glowing mesh (cursor, core, motes...) with the same screen-size compensation, applied per draw. mesh.userData.setGlow(k nominal, hex?). */
const _gv = new THREE.Vector3();
// shade: 'sphere' (hot core, fresnel falloff), 'box' (soft radial glow per face), 'flat'.
export function glowMesh(geometry, hex, k = 3, { ref = COMP.ref, min = COMP.min, max = COMP.max, radius = 0.5, shade = 'sphere', transparent = false } = {}) {
  const mode = shade === 'sphere' ? 1 : shade === 'box' ? 2 : 0;
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent, depthWrite: !transparent, blending: transparent ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: withFog({ uCol: { value: hcol(hex, ko(k)) } }),
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; ${FOG_V}
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; varying vec2 vUv; varying vec3 vN; varying vec3 vV; ${FOG_F}
      void main(){ float s = 1.0;
        ${mode === 1 ? 's = 0.25 + 1.25 * pow(max(dot(normalize(vN), normalize(vV)), 0.0), 2.5);' : ''}
        ${mode === 2 ? 'vec2 q = abs(vUv - 0.5) * 2.0; float pr = 1.0 - smoothstep(0.0, 1.0, max(q.x * q.x, q.y * q.y)); s = 0.45 + 1.1 * pr * pr;' : ''}
        gl_FragColor = vec4(mix(uCol * s, fogColor, fogF()), 1.0); }`,
  });
  mat.customProgramCacheKey = () => 'glow' + mode;
  const mesh = new THREE.Mesh(geometry, mat);
  const g = { base: hcol(hex, ko(k)), hex };
  mesh.userData.glow = g;
  mesh.userData.setGlow = (kk, h = g.hex) => { g.hex = h; g.base.set(h).multiplyScalar(ko(kk)); };
  mesh.onBeforeRender = (r, sc, cam) => {
    _gv.setFromMatrixPosition(mesh.matrixWorld).applyMatrix4(cam.matrixWorldInverse);
    const rad = radius * mesh.matrixWorld.getMaxScaleOnAxis();
    const ndc = rad * cam.projectionMatrix.elements[5] / Math.max(-_gv.z, 0.05);
    mat.uniforms.uCol.value.copy(g.base).multiplyScalar(clamp(Math.pow(ref / Math.max(ndc, 1e-5), 0.6), min, max));
  };
  return mesh;
}

/** Instanced glowing spheres (orbs/agents/pinpoints): hot-core shading + screen-size compensation. I.set(i, { p, s (radius multiplier), c: hex|[r,g,b], k: NOMINAL k }) — k is calibrated (x KS). */
export function orbs({ count = 100, r = 0.35, seg = 10, color = 0xffffff, ref, min, max } = {}) {
  const I = G.instanced({ count, geometry: SPHERE(seg), basic: true, color });
  I.mesh.material = I.material = orbMaterial({ ref, min, max });
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < count; i++) I.mesh.setMatrixAt(i, zero);
  const set0 = I.set;
  I.r = r;
  I.set = (i, o = {}) => set0(i, { ...o, s: (o.s ?? 1) * r, k: ko(o.k ?? 3) });
  I.hide = (i) => I.mesh.setMatrixAt(i, zero);
  return I;
}

/** Additive volumetric light shaft with fog. shaft({ rTop, rBot, h, color, k, opacity, apexFade }) — userData.set(k, opacity), setColor(hex, k). Apex at +h/2. */
export function shaft({ rTop = 0.5, rBot = 6, h = 30, color = C.amber, k = 1, opacity = 0.18, seg = 40, top = 1.0, bottom = 0.35, apexFade = 0.1 } = {}) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, true);
  const BEAM = 0.38;   // calibration: two faces x overlap
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: withFog({ uCol: { value: hcol(color, k * BEAM) }, uOp: { value: opacity }, uTop: { value: top }, uBot: { value: bottom }, uApex: { value: apexFade } }),
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; ${FOG_V}
      void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uOp; uniform float uTop; uniform float uBot; uniform float uApex; varying vec2 vUv; varying vec3 vN; varying vec3 vV; ${FOG_F}
      void main(){ float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
        float along = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(1.0 - uApex, 1.0, vUv.y)) * mix(uBot, uTop, vUv.y);
        float a = uOp * edge * along * (1.0 - fogF()) * smoothstep(4.0, 30.0, vFogDepth);
        gl_FragColor = vec4(uCol * a, 1.0); }`,
  });
  mat.blending = THREE.CustomBlending; mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneFactor; mat.blendEquation = THREE.AddEquation;
  const mesh = new THREE.Mesh(g, mat);
  mesh.userData.set = (kk, op) => { if (kk !== undefined) mat.uniforms.uCol.value.set(color).multiplyScalar(kk * BEAM); if (op !== undefined) mat.uniforms.uOp.value = op; };
  mesh.userData.setColor = (hex, kk) => mat.uniforms.uCol.value.set(hex).multiplyScalar(kk * BEAM);
  mesh.frustumCulled = false;
  return mesh;
}
/** Orient a shaft so its apex sits at `from` and its base at `to` (stretches it to fit). */
export function aimShaft(mesh, from, to) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const dir = a.clone().sub(b); const len = dir.length();
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.scale.set(1, len / mesh.geometry.parameters.height, 1);
  return mesh;
}

// ----------------------------------------------------------------------------------------- sprites / flares / text
let _flareTex = null;
function flareTexture() {
  if (_flareTex) return _flareTex;
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  let gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.06, 'rgba(255,255,255,0.7)'); gr.addColorStop(0.22, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  gr = g.createLinearGradient(0, 0, 256, 0);   // anamorphic streak
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 127, 256, 2);
  _flareTex = new THREE.CanvasTexture(c);
  return _flareTex;
}
/** Additive billboard flare (radial glow + thin horizontal anamorphic streak). flare({color, k (nominal), size}) -> Sprite; sprite.userData.set(k, hex?). */
export function flare({ color = C.clay, k = 4, size = 6, fog = true, ref = 0.06 } = {}) {
  const mat = new THREE.SpriteMaterial({ map: flareTexture(), color: hcol(color, ko(k)), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog });
  const s = new THREE.Sprite(mat); s.scale.set(size, size, 1);
  const base = hcol(color, ko(k));
  s.userData.set = (kk, hex = color) => { base.set(hex).multiplyScalar(ko(kk)); s.visible = kk > 0.001; };
  s.onBeforeRender = (r, sc, cam) => {
    _gv.setFromMatrixPosition(s.matrixWorld).applyMatrix4(cam.matrixWorldInverse);
    const ndc = 0.12 * s.matrixWorld.getMaxScaleOnAxis() * cam.projectionMatrix.elements[5] / Math.max(-_gv.z, 0.05);
    mat.color.copy(base).multiplyScalar(clamp(Math.pow(ref / Math.max(ndc, 1e-5), 0.7), 0.08, 1.4));
  };
  s.visible = k > 0.001;
  return s;
}
const _texCache = new Map();
/** cached canvas texture of a text string (white glyphs on transparent). */
export function textTexture(text, { font = '800 160px "Inter Tight"', letterSpacing = 0, pad = 24 } = {}) {
  const key = text + '|' + font + '|' + letterSpacing;
  if (_texCache.has(key)) return _texCache.get(key);
  const c = document.createElement('canvas'); const g = c.getContext('2d');
  g.font = font; if (letterSpacing) g.letterSpacing = letterSpacing + 'px';
  const m = g.measureText(text); const fs = parseInt(font.match(/(\d+)px/)[1], 10);
  c.width = Math.ceil(m.width + pad * 2); c.height = Math.ceil(fs * 1.25 + pad * 2);
  g.font = font; if (letterSpacing) g.letterSpacing = letterSpacing + 'px';
  g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.fillText(text, pad, c.height / 2 + fs * 0.04);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const out = { tex, aspect: c.width / c.height, capRatio: (fs * 0.73) / c.height };
  _texCache.set(key, out);
  return out;
}
/**
 * Text plane in world space (station stamps REVIEW./TEST./DEPLOY., MONTH counters, engraving). k is RAW (type is not calibrated: k 1.2 = readable, 3-4 = glowing).
 * text3D('REVIEW.', { height: cap height (u), color, k, font }) -> mesh; mesh.userData.set(k, hex?), mesh.userData.sweep(x01, width, gain) (a moving highlight band).
 * Plane faces +z; rotate it yourself. mesh.userData.size = [w, h].
 */
export function text3D(text, { height = 2, color = C.ivory, k = 1.2, font = '800 160px "Inter Tight"', letterSpacing = 0, fog = true, depthTest = true } = {}) {
  const T = textTexture(text, { font, letterSpacing });
  const h = height / T.capRatio, w = h * T.aspect;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest, fog,
    uniforms: withFog({ map: { value: T.tex }, uCol: { value: hcol(color, k) }, uSweep: { value: new THREE.Vector3(-9, 0.15, 0) } }),
    vertexShader: `varying vec2 vUv; ${FOG_V} void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 uCol; uniform vec3 uSweep; varying vec2 vUv; ${FOG_F}
      void main(){ float a = texture2D(map, vUv).a; if (a < 0.01) discard;
        float sw = exp(-pow((vUv.x - uSweep.x) / uSweep.y, 2.0)) * uSweep.z;
        float f = fogF();
        gl_FragColor = vec4(uCol * (1.0 + sw) * (1.0 - f), a * (1.0 - f * 0.9)); }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.userData.size = [w, h];
  mesh.userData.set = (kk, hex = color) => mat.uniforms.uCol.value.set(hex).multiplyScalar(kk);
  mesh.userData.sweep = (x01, width = 0.15, gain = 4) => mat.uniforms.uSweep.value.set(x01, width, gain);
  return mesh;
}

// ----------------------------------------------------------------------------------------- fat lines
// SOFT lines: LineMaterial patched to a gaussian cross-section, additive, fog-attenuated. Thin HDR geometry aliases (its
// per-column energy flickers 1px/2px along a tilted line) and the bloom pyramid turns that into blotchy dashes; a soft
// profile keeps the energy constant along the line so the glow stays continuous. Used by fat() (default) and glowSegs().
const SOFT_FOG = `#ifdef USE_FOG
  #ifdef FOG_EXP2
    gl_FragColor.rgb *= exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    gl_FragColor.rgb *= 1.0 - smoothstep( fogNear, fogFar, vFogDepth );
  #endif
#endif`;
function softLine(mat, { sharp = 2.4, extraV = '', extraVMain = '', extraF = '', colorExpr = 'diffuse', key = 'soft' } = {}) {
  mat.transparent = true; mat.depthWrite = false; mat.blending = THREE.AdditiveBlending;
  mat.onBeforeCompile = (sh) => {
    if (extraV) sh.vertexShader = sh.vertexShader.replace('void main() {', extraV + '\nvoid main() {\n' + extraVMain);
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', extraF + '\nvoid main() {')
      .replace('vec4 diffuseColor = vec4( diffuse, alpha );', `if ( abs( vUv.y ) > 1.0 ) discard; float prof = exp( - vUv.x * vUv.x * ${sharp.toFixed(2)} ); alpha *= prof; vec4 diffuseColor = vec4( ${colorExpr}, alpha );`)
      .replace('#include <fog_fragment>', SOFT_FOG);
  };
  mat.customProgramCacheKey = () => key + sharp;
  return mat;
}
/** Fat line (fog on, optional per-vertex colours). k NOMINAL (x KE). Width in 1080p px (soft lines render ~2.2x wider with a soft falloff
 * so the core reads at about `width`). line.userData.reveal(u) draws the first u of it; userData.set(k, hex?). soft:false = hard LineMaterial. */
export function fat(points, { color = C.brass, k = 1, width = 2, colors = null, opacity = 1, fog = true, soft = true } = {}) {
  const geo2 = new LineGeometry();
  geo2.setPositions(points.flatMap((p) => (p.isVector3 ? [p.x, p.y, p.z] : p)));
  if (colors) geo2.setColors(colors.flat());
  const mat = new LineMaterial({ color: hcol(colors ? 0xffffff : color, kl(k)), linewidth: soft ? width * 2.2 : width, transparent: opacity < 1, opacity, vertexColors: !!colors, worldUnits: false });
  mat.fog = fog;
  if (soft) softLine(mat);
  mat.resolution.set(1920, 1080);
  const line = new Line2(geo2, mat);
  line.computeLineDistances();
  line.frustumCulled = false;
  const nSeg = points.length - 1;
  line.userData.nSeg = nSeg;
  line.userData.reveal = (u) => { geo2.instanceCount = Math.max(0, Math.min(nSeg, Math.round(nSeg * clamp(u)))); line.visible = geo2.instanceCount > 0; };
  line.userData.set = (kk, hex) => { mat.color.set(hex ?? (colors ? 0xffffff : color)).multiplyScalar(kl(kk)); };
  return line;
}

/** Many soft glow segments in one draw call: glowSegs([[a,b], ...] | flat [x,y,z,x,y,z,...], { color, k (nominal), width (px), colors }) -> LineSegments2.
 *  seg.userData.set(k, hex?). Good for circuit traces, filaments, scan lines. */
export function glowSegs(pairs, { color = C.amber, k = 2, width = 2, colors = null, fog = true, offset = true } = {}) {
  const g = new LineSegmentsGeometry();
  g.setPositions(Array.isArray(pairs[0]) ? pairs.flat(2) : pairs);
  if (colors) g.setColors(colors.flat ? colors.flat(2) : colors);
  const mat = new LineMaterial({ color: hcol(colors ? 0xffffff : color, kl(k)), linewidth: width * 2.2, vertexColors: !!colors, worldUnits: false });
  mat.fog = fog; mat.resolution.set(1920, 1080);
  if (offset) { mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -60; }
  softLine(mat);
  const seg = new LineSegments2(g, mat); seg.frustumCulled = false;
  seg.userData.set = (kk, hex) => mat.color.set(hex ?? (colors ? 0xffffff : color)).multiplyScalar(kl(kk));
  return seg;
}

/** the 12 edges of an axis-aligned box as segment pairs (centre, size) — feed to glowSegs for soft, alias-free outlines. */
export function boxEdgePairs([cx, cy, cz], [w, h, d]) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  return [[[x0, y0, z0], [x1, y0, z0]], [[x0, y1, z0], [x1, y1, z0]], [[x0, y0, z1], [x1, y0, z1]], [[x0, y1, z1], [x1, y1, z1]],
    [[x0, y0, z0], [x0, y1, z0]], [[x1, y0, z0], [x1, y1, z0]], [[x0, y0, z1], [x0, y1, z1]], [[x1, y0, z1], [x1, y1, z1]],
    [[x0, y0, z0], [x0, y0, z1]], [[x1, y0, z0], [x1, y0, z1]], [[x0, y1, z0], [x0, y1, z1]], [[x1, y1, z0], [x1, y1, z1]]];
}

// =====================================================================================================
// ATMOSPHERE — sky dome: fog colour + a faint haze band at the horizon so dark masses (the foreman, pillars) read as
// silhouettes against air. atmosphere({ fogColor, glow, k }) ; mesh.userData.set({ fogColor, glow, k })
// =====================================================================================================
export function atmosphere({ fogColor = C.fog, glow = 0x1a2430, k = 1, horizon = 0.02, width = 0.4 } = {}) {
  const mat = new THREE.ShaderMaterial({
    depthWrite: false, fog: false, side: THREE.BackSide,
    uniforms: { uFog: { value: new THREE.Color(fogColor) }, uGlow: { value: hcol(glow, k) }, uH: { value: horizon }, uW: { value: width } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec3 wp = cameraPosition + position * 1900.0; gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0); gl_Position.z = gl_Position.w * 0.99999; }`,
    fragmentShader: `uniform vec3 uFog; uniform vec3 uGlow; uniform float uH; uniform float uW; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float b = exp(-pow((d.y - uH) / uW, 2.0)); float lo = smoothstep(-0.25, uH, d.y);
        gl_FragColor = vec4(uFog + uGlow * b * lo, 1.0); }`,
  });
  const mesh = new THREE.Mesh(SPHERE(24), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -10;
  mesh.userData.set = ({ fogColor: f, glow: gl, k: kk } = {}) => { if (f !== undefined) mat.uniforms.uFog.value.set(f); if (gl !== undefined || kk !== undefined) mat.uniforms.uGlow.value.set(gl ?? glow).multiplyScalar(kk ?? k); };
  return mesh;
}

// =====================================================================================================
// FLOOR — dark glossy slab + grid + analytic light POOLS + glossy streak REFLECTIONS of light sources (wet-floor look).
// floor({ x0,x1,z0,z1, grid:true, gridColor, rough }) -> { mesh, setSources(list), setGrid(k) }
// source = { p:[x,y,z], c: hex, k: NOMINAL intensity, pool: radius u (0 = none), poolK, refl: gain (0 = none), size: source radius u }
// =====================================================================================================
const NS = 16;
export function floor({ x0 = -300, x1 = 300, z0 = -290, z1 = 90, grid = true, gridColor = C.grid, cell = 2, gridFade = 220, base = C.floor, rough = 0.07, gridK = 1 } = {}) {
  const src = [], srcCol = [], srcPar = [];
  for (let i = 0; i < NS; i++) { src.push(new THREE.Vector4()); srcCol.push(new THREE.Vector3()); srcPar.push(new THREE.Vector3()); }
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: withFog({
      uBase: { value: new THREE.Color(base) }, uGrid: { value: hcol(gridColor, grid ? gridK : 0) }, uCell: { value: cell }, uGridFade: { value: gridFade },
      uRough: { value: rough }, uN: { value: 0 }, uSrc: { value: src }, uSrcCol: { value: srcCol }, uSrcPar: { value: srcPar },
      uBox: { value: new THREE.Vector4(0, 0, 0, 0) },
    }),
    vertexShader: `varying vec3 vW; ${FOG_V} void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `#define NS ${NS}
      uniform vec3 uBase; uniform vec3 uGrid; uniform float uCell; uniform float uGridFade; uniform float uRough; uniform int uN; uniform vec4 uBox;
      uniform vec4 uSrc[NS]; uniform vec3 uSrcCol[NS]; uniform vec3 uSrcPar[NS];
      varying vec3 vW; ${FOG_F}
      void main(){
        vec2 c = vW.xz / uCell; vec2 fw = fwidth(c);
        vec2 g = abs(fract(c - 0.5) - 0.5) / max(fw, vec2(1e-4));
        float l = 1.0 - min(min(g.x, g.y), 1.0);
        float moire = 1.0 - smoothstep(0.18, 0.5, max(fw.x, fw.y));
        float dcam = length(vW.xz - cameraPosition.xz);
        float gf = 1.0 - smoothstep(uGridFade * 0.3, uGridFade, dcam);
        vec3 V = normalize(vW - cameraPosition);
        vec3 R = vec3(V.x, -V.y, V.z);
        vec2 f = normalize(V.xz + vec2(1e-5)); vec2 s = vec2(-f.y, f.x);
        float fres = 0.02 + 0.45 * pow(1.0 - abs(V.y), 5.0);
        vec3 light = vec3(0.0); vec3 refl = vec3(0.0);
        float a0 = uRough * 0.12, b0 = uRough * 0.25;
        bool doRefl = fres > 0.03;
        bool inPools = vW.x > uBox.x && vW.x < uBox.z && vW.z > uBox.y && vW.z < uBox.w;
        int nLoop = (doRefl || inPools) ? uN : 0;
        for (int i = 0; i < NS; i++) {
          if (i >= nLoop) break;
          vec3 S = uSrc[i].xyz; vec3 par = uSrcPar[i];
          vec3 Lv = S - vW;
          if (inPools && par.x > 0.0) { float q = dot(Lv.xz, Lv.xz) * par.x; if (q < 6.0) light += uSrcCol[i] * (par.y * exp(-q)); }
          if (doRefl && par.z > 0.0) { vec3 sc = uSrcCol[i];
            float dist = length(Lv); vec3 L = Lv / dist; vec3 d = R - L;
            float ang = min(uSrc[i].w / dist, 0.25);
            float aw = a0 + ang * 0.7; float bw = b0 + ang;
            float lat = dot(d.xz, s);
            refl += sc * par.z * (a0 / aw) * exp(-(lat * lat) / (aw * aw) - (d.y * d.y) / (bw * bw));
          }
        }
        vec3 col = uBase + light * 0.05;
        col += uGrid * l * moire * gf * (0.35 + 5.0 * dot(light, vec3(0.3, 0.5, 0.2)));
        col += refl * fres;
        gl_FragColor = vec4(mix(col, fogColor, fogF()), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const tmp = new THREE.Color();
  return {
    mesh, material: mat,
    setSources(list) {
      let n = 0; let bx0 = 1e9, bz0 = 1e9, bx1 = -1e9, bz1 = -1e9;
      for (const s of list) {
        if (!s || n >= NS) continue;
        const kk = s.k ?? 1; if (kk <= 0.001) continue;
        tmp.set(s.c ?? 0xffffff).multiplyScalar(ko(kk));
        src[n].set(s.p[0], s.p[1], s.p[2], s.size ?? 0.5);
        srcCol[n].set(tmp.r, tmp.g, tmp.b);
        srcPar[n].set(s.pool ? 1 / (s.pool * s.pool) : 0, s.poolK ?? 1, s.refl ?? 0);
        if (s.pool) { const m = s.pool * 2.45; bx0 = Math.min(bx0, s.p[0] - m); bx1 = Math.max(bx1, s.p[0] + m); bz0 = Math.min(bz0, s.p[2] - m); bz1 = Math.max(bz1, s.p[2] + m); }
        n++;
      }
      mat.uniforms.uN.value = n; mat.uniforms.uBox.value.set(bx0, bz0, bx1, bz1);
    },
    setGrid(k, hex = gridColor) { mat.uniforms.uGrid.value.set(hex).multiplyScalar(k); },
  };
}

// =====================================================================================================
// PILLARS — 40 slate pillars 2x120x2 at z=±30, x = -285 + 30i; edge glow fades with height into the fog.
// pillars({ lit }) -> { mesh, update(lt, { lit 0..1, k (nominal edge k override), alarm 0..1 }) }  lit 0 = ice k0.3 ; lit 1 = brass k1.5
// =====================================================================================================
export function pillars({ lit = 0, rows = [30, -30], count = 20 } = {}) {
  const n = rows.length * count;
  const I = boxes({ count: n, size: [2, 120, 2], color: C.slate, metal: 0.4, rough: 0.55, edgeW: 1.4, fadeY: [4, 100] });
  let i = 0;
  for (const z of rows) for (let k = 0; k < count; k++) I.set(i++, { p: [-285 + 30 * k, 60, z], edge: [1, 1, 1], body: [0, 0, 0] });
  I.commit();
  const U = I.material.userData.U;
  const api = {
    mesh: I.mesh, I,
    update(lt, { lit: L = lit, k = null, alarm = 0 } = {}) {
      const e = mixA(lin(C.steel, kl(k ?? 0.3)), lin(C.brass, kl(k ?? 1.5)), L);
      const e2 = mixA(e, lin(C.red, kl(0.5)), alarm * 0.25);
      U.uEdge.value.setRGB(e2[0], e2[1], e2[2]);
      U.uBody.value.set(C.amber).multiplyScalar(0.012 * L);
    },
  };
  api.update(0);
  return api;
}

// =====================================================================================================
// LINE STATIONS — 7 stations (seg-1.2 x 3 x 10 at y 1.5), conveyor hairline (ivory), per-station top strips.
// lineStations({ lit }) -> { group, update(lt, params), label(i, text, opts), sources() }
// params (arrays are per station [7], scalars apply to all):
//   lit 0..1 (edges ice k0.4 -> amber k3, faint warm body), strips 0..1 (top strip level), draw 0..1 (strip drawn from its own left edge),
//   codeK (CODE strip nominal k, default 8, clay), stripK (other strips, amber, default 3), red 0..1 (alarm edges), scan 0..1 (wireframe->solid
//   scan-line build; < 1 shows a rising amber scan line), conveyorK (default 2 lit / 0.8 dark), dim (dark edge k, default 0.4)
// =====================================================================================================
export function lineStations({ lit = 0 } = {}) {
  const group = new THREE.Group();
  const B = boxes({ count: 7, size: [1, 1, 1], color: C.slate, metal: 0.35, rough: 0.5, edgeW: 1.4 });
  group.add(B.mesh);
  const S = boxes({ count: 7, size: [1, 1, 1], color: 0x0a0a0a, metal: 0, rough: 1, edgeW: 1.0 });
  group.add(S.mesh);
  const F = boxes({ count: 7, size: [1, 1, 1], color: 0x000000, metal: 0, rough: 1, edgeW: 2.0 });
  group.add(F.mesh);
  const conveyor = fat([[LINE.x0, LINE.y, 0.0], [LINE.x1, LINE.y, 0.0]], { color: C.ivory, k: 2, width: 2 });
  group.add(conveyor);
  const st = {
    lit: Array(7).fill(lit), strips: Array(7).fill(lit ? 1 : 0), draw: Array(7).fill(1), red: Array(7).fill(0), scan: Array(7).fill(1),
    codeK: 8, stripK: 3, conveyorK: null, dim: 0.4,
  };
  const api = {
    group, stations: STATIONS, state: st, conveyor, boxes: B, stripsI: S,
    /** world-space label on station i's front face (z 5.06) or flat on the floor in front (flat:true). k RAW (danger red stamp ~4). */
    label(i, text, { color = C.red, k = 4, height = 1.6, flat = false, font = '800 160px "Inter Tight"', y = 1.5 } = {}) {
      const m = text3D(text, { height, color, k, font });
      const s = STATIONS[i];
      if (flat) { m.rotation.x = -Math.PI / 2; m.position.set(s.cx, 0.03, 9); } else m.position.set(s.cx, y, 5.06);
      group.add(m); return m;
    },
    update(lt, p = {}) {
      const arr = (v, d) => (v === undefined ? d : Array.isArray(v) ? v : Array(7).fill(v));
      st.lit = arr(p.lit, st.lit); st.strips = arr(p.strips, st.strips); st.draw = arr(p.draw, st.draw); st.red = arr(p.red, st.red); st.scan = arr(p.scan, st.scan);
      if (p.codeK !== undefined) st.codeK = p.codeK; if (p.stripK !== undefined) st.stripK = p.stripK;
      if (p.conveyorK !== undefined) st.conveyorK = p.conveyorK; if (p.dim !== undefined) st.dim = p.dim;
      let anyLit = 0;
      for (let i = 0; i < 7; i++) {
        const s = STATIONS[i], L = clamp(st.lit[i]), red = clamp(st.red[i]), sc = clamp(st.scan[i]);
        anyLit = Math.max(anyLit, L);
        let edge = mixA(lin(C.steel, kl(st.dim)), lin(C.amber, kl(3) * 0.6), L * sc);
        edge = mixA(edge, lin(C.red, kl(3) * 0.6), red);
        const body = mixA(mixA([0, 0, 0], lin(C.amber, 0.02), L * sc), lin(C.red, 0.015), red);
        B.set(i, { p: [s.cx, 1.5, 0], s: [s.w - 1.2, 3, 10], edge, body });
        if (sc < 0.999 && L > 0.001) {   // scan line + solid fill rising
          const hgt = Math.max(0.02, 3 * sc);
          F.set(i, { p: [s.cx, hgt / 2, 0], s: [s.w - 1.1, hgt, 10.1], edge: lin(C.amber, kl(6) * L), body: lin(C.amber, 0.05 * L) });
          B.color(i, mixA(lin(C.steel, kl(st.dim)), lin(C.amber, kl(1.2)), L), [0, 0, 0]);
        } else F.hide(i);
        const lvl = clamp(st.strips[i]), dr = clamp(st.draw[i]);
        if (lvl > 0.001 && dr > 0.001) {
          const w = (s.w - 1.2) * dr, x0 = s.x0 + 0.6;
          const kk = (i === ST.CODE ? st.codeK : st.stripK) * lvl, hx = i === ST.CODE ? C.clay : C.amber;
          S.set(i, { p: [x0 + w / 2, 3.1, 0], s: [w, 0.2, 10], edge: lin(hx, kl(kk) * 0.7), body: lin(hx, ko(kk) * (i === ST.CODE ? 0.5 : 0.22)) });
        } else S.hide(i);
      }
      B.commit(); S.commit(); F.commit();
      conveyor.userData.set(st.conveyorK ?? lerp(0.35, 2, anyLit));
    },
    sources() {
      const out = [];
      for (let i = 0; i < 7; i++) {
        const s = STATIONS[i], lvl = clamp(st.strips[i]) * clamp(st.draw[i]);
        if (lvl > 0.01) out.push({ p: [s.x0 + 0.6 + (s.w - 1.2) * clamp(st.draw[i]) / 2, 3.2, 0], c: i === ST.CODE ? C.clay : C.amber, k: (i === ST.CODE ? st.codeK : st.stripK) * lvl * 0.5, pool: 11, poolK: 0.8, refl: 0.0, size: 6 });
      }
      return out;
    },
  };
  api.update(0);
  return api;
}

// =====================================================================================================
// CODE TOWER — instanced clay orbs on the CODE station: tiers of 10x10 on a 1.6u grid, tier spacing 3u (count 10 = one row,
// 100 = one tier, 1000 = 10 tiers, 30u). Crest ring r9 at y=34. Pulses +-20% on 8ths with per-orb phase.
// codeTower() -> { group, I, crest, orbPos(i), update(lt, { count 0..1000 (fractional = growing), k (nominal 10; 3 = dimmed 30%),
//   crest 0..1, t (GLOBAL time: 8th pulses), pulse (0.2), hideFrom (index: hide orbs >= it, e.g. one lifting off) }) }
// Density compensation: rendered k falls to 45% at 1,000 orbs so the full tower blazes without whiting out the frame.
// =====================================================================================================
export function codeTower({ seed = 11 } = {}) {
  const group = new THREE.Group();
  const I = orbs({ count: 1000, r: 0.35, seg: 8 });
  group.add(I.mesh);
  const r = rand(seed); const phase = Float32Array.from({ length: 1000 }, () => r());
  const crest = G.ring({ r: 9, tube: 0.25, color: C.clay, k: ko(8) });
  crest.rotation.x = Math.PI / 2; crest.position.set(-19.6, 34, 0); group.add(crest);
  const pos = (i) => { const tier = Math.floor(i / 100), j = i % 100, row = Math.floor(j / 10), col = j % 10; return [-19.6 + (col - 4.5) * 1.6, 3.6 + tier * 3, (row - 4.5) * 1.6]; };
  const st = { count: 0, k: 10 };
  const cl = lin(C.clay);
  const api = {
    group, I, orbPos: pos, state: st, crest,
    update(lt, { count = 1000, k = 10, crest: cr = count >= 1000 ? 1 : 0, t = lt, pulse = 0.2, hideFrom = null } = {}) {
      st.count = count; st.k = k;
      const n = Math.min(1000, Math.ceil(count));
      const comp = lerp(1, 0.45, clamp((count - 100) / 900));
      for (let i = 0; i < 1000; i++) {
        if (i >= n || (hideFrom !== null && i >= hideFrom)) { I.hide(i); continue; }
        const frac = i === n - 1 ? clamp(count - (n - 1)) : 1;
        const pu = 1 + pulse * Math.sin((t * 4 + phase[i]) * Math.PI * 2);   // 8ths at 120 BPM = 4 Hz
        I.set(i, { p: pos(i), s: frac, c: cl, k: k * comp * pu });
      }
      I.commit();
      crest.visible = cr > 0.001;
      crest.material.color.set(C.clay).multiplyScalar(ko(8) * cr);
    },
    sources() {
      if (st.count < 1) return [];
      const h = Math.min(30, 3 * Math.ceil(st.count / 100));
      const kk = st.k * Math.min(1, 0.15 + st.count / 300);
      return [{ p: [-19.6, 3 + h * 0.5, 0], c: C.clay, k: kk * 0.6, pool: 9 + h * 0.4, poolK: 1.0, refl: 0.5, size: Math.max(1, h * 0.35) }];
    },
  };
  api.update(0, { count: 0 });
  return api;
}

// =====================================================================================================
// CARDS — instanced work cards: box 3 x 0.5 x 2, ivory, edges on. cards({ count }) -> boxes API.
// Colour presets (RAW triples for I.set edge/body): CARD.edge(k) ice edge, CARD.body(k) ivory body, CARD.amberEdge/amberBody (lit), greenEdge, redEdge.
// Card bodies glow faintly; the edges carry the read (a stack of cards = a striped column).
// =====================================================================================================
export const CARD = {
  body: (k = 1.2) => lin(C.card, k * 0.09), edge: (k = 1.2) => lin(C.ice, kl(k) * 1.15),
  amberBody: (k = 2.5) => lin(C.amber, k * 0.045), amberEdge: (k = 2.5) => lin(C.amber, kl(k) * 0.6),
  greenEdge: (k = 4) => lin(C.green, kl(k)), redEdge: (k = 6) => lin(C.red, kl(k)),
};
export function cards({ count = 200, size = [3, 0.5, 2] } = {}) {
  return boxes({ count, size, color: C.card, metal: 0.1, rough: 0.55, edgeW: 1.2, crowd: 0.4 });
}

// =====================================================================================================
// CARD TOWERS — the jam. cardTowers({ towers: { review: 1200, test: 640, deploy: 240 } })  (max instances per tower; total <= ~2,000)
// update(lt, { review: n, test: n, deploy: n,      // visible cards (fractional ok; 2 cards = 1u of height)
//              lit 0..1 (jammed ivory pile -> ordered amber rack of lanes flowing +x), flow (u/s, 6), t (GLOBAL time: pinpoints blink on 8ths),
//              red 0..1 (pinpoint level), shake (u), tip: { review: radians } (topple toward camera +z about the base) })
// Bases: REVIEW (1.4,3,0), TEST (21,3,0), DEPLOY (40.6,3,0). Red pinpoints every 12u on alternating corners; lit -> green check lamps.
// =====================================================================================================
export function cardTowers({ towers = { review: 1200, test: 640 }, seed = 21 } = {}) {
  const group = new THREE.Group();
  const names = Object.keys(towers);
  const total = names.reduce((a, n) => a + towers[n], 0);
  const I = cards({ count: total });
  group.add(I.mesh);
  const base = { review: POS.reviewBase, test: POS.testBase, deploy: POS.deployBase };
  const r = rand(seed);
  const jit = new Float32Array(total * 4);
  for (let i = 0; i < total; i++) { jit[i * 4] = (r() - 0.5) * 0.6; jit[i * 4 + 1] = (r() - 0.5) * 0.6; jit[i * 4 + 2] = (r() - 0.5) * 0.3; jit[i * 4 + 3] = r(); }
  const pinCount = names.reduce((a, n) => a + Math.ceil(towers[n] * 0.5 / 12) + 1, 0);
  const P = orbs({ count: pinCount, r: 0.25, seg: 8 });
  group.add(P.mesh);
  const st = { counts: {}, lit: 0, red: 1 };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sv = new THREE.Vector3(1, 1, 1);
  const pivotV = new THREE.Vector3();
  return {
    group, I, P, state: st,
    update(lt, p = {}) {
      const lit = clamp(p.lit ?? 0), flow = p.flow ?? 6, t = p.t ?? lt, red = p.red ?? 1, shake = p.shake ?? 0;
      st.lit = lit; st.red = red;
      const eC = mixA(CARD.edge(), CARD.amberEdge(), lit), bC = mixA(CARD.body(), CARD.amberBody(), lit);
      let off = 0, pi = 0;
      for (const n of names) {
        const max = towers[n], cnt = Math.min(max, p[n] ?? 0); st.counts[n] = cnt;
        const b = base[n]; const tip = (p.tip && p.tip[n]) || 0;
        q2.setFromEuler(e.set(tip, 0, 0));
        pivotV.set(b[0], b[1], b[2]);
        const nVis = Math.ceil(cnt);
        for (let i = 0; i < max; i++) {
          const idx = off + i;
          if (i >= nVis) { I.hide(idx); continue; }
          const jx = jit[idx * 4] * (1 - lit), jz = jit[idx * 4 + 1] * (1 - lit), jr = jit[idx * 4 + 2] * (1 - lit);
          let x = b[0] + jx, y = b[1] + 0.25 + i * 0.5, z = b[2] + jz;
          let sc = i === nVis - 1 ? Math.max(0.05, cnt - (nVis - 1)) : 1;
          if (lit > 0) {   // lit flow: each level is a conveyor lane sliding +x through a 5u window
            const lane = i % 2; const ph = jit[idx * 4 + 3];
            const u = ((((t * flow) / 5 + ph + lane * 0.5) % 1) + 1) % 1;
            x = lerp(x, b[0] + (u - 0.5) * 5, lit);
            sc *= lerp(1, Math.min(1, Math.sin(u * Math.PI) * 2.4), lit);
          }
          if (shake) { x += Math.sin(t * 47 + i * 0.37) * shake; z += Math.cos(t * 53 + i * 0.29) * shake * 0.6; }
          v.set(x, y, z);
          if (tip) v.sub(pivotV).applyQuaternion(q2).add(pivotV);
          q.setFromEuler(e.set(0, jr, 0)); if (tip) q.premultiply(q2);
          sv.set(sc, 1, sc);
          I.mesh.setMatrixAt(idx, m4.compose(v, q, sv));
          I.color(idx, eC, bC);
        }
        const h = cnt * 0.5, nP = Math.ceil(towers[n] * 0.5 / 12) + 1;
        for (let k = 0; k < nP; k++) {
          const y = b[1] + 6 + k * 12;
          if (y > b[1] + h - 1 || cnt < 4) { P.hide(pi++); continue; }
          const face = k % 2;
          const on = lit > 0.5 ? 1 : blink(t, { bpm: 120, div: 2, origin: face ? 0.25 : 0 });
          const kk = lit > 0.5 ? 4 : 8 * red * on;
          v.set(b[0] + (face ? 1.6 : -1.6), y, b[2] + (face ? -1.05 : 1.05));
          if (tip) v.sub(pivotV).applyQuaternion(q2).add(pivotV);
          if (kk < 0.01) { P.hide(pi++); continue; }
          P.set(pi++, { p: [v.x, v.y, v.z], c: lit > 0.5 ? lin(C.green) : lin(C.red), k: kk });
        }
        off += max;
      }
      I.commit(); P.commit();
    },
    sources() {
      const out = [];
      for (const n of names) {
        const c = st.counts[n] || 0; if (c < 2) continue; const b = base[n]; const h = c * 0.5;
        out.push({ p: [b[0], 3 + Math.min(h, 30) * 0.5, b[2]], c: st.lit > 0.5 ? C.amber : C.ice, k: st.lit > 0.5 ? 2 : 0.8, pool: 6, poolK: 0.8, refl: 0.4, size: 2 });
        if (st.lit < 0.5 && st.red > 0) out.push({ p: [b[0], 9, b[2] + 1], c: C.red, k: 2.5 * st.red, pool: 3, poolK: 0.6, refl: 0.6, size: 0.4 });
      }
      return out;
    },
  };
}

// =====================================================================================================
// DEPLOY MAZE — 14 branching conveyor strips (0.4 x 0.1 x 8-18, ice k0.6) over the DEPLOY region (x 31..51, z -12..12), up to 400
// gridlocked cards, red stop lamps blinking on 8ths. deployMaze() -> { group, update(lt, { cards 0..400, lit 0..1, t, flow }) }
// =====================================================================================================
export function deployMaze({ seed = 31 } = {}) {
  const group = new THREE.Group();
  const r = rand(seed);
  const strips = [];
  for (let i = 0; i < 14; i++) {
    const alongX = i < 9;
    const L = 8 + Math.floor(r() * 11);
    if (alongX) strips.push({ alongX, L, x: 31 + L / 2 + r() * (20 - L), z: -12 + i * 3 });
    else strips.push({ alongX, L, x: 32.5 + (i - 9) * 4.4 + (r() - 0.5), z: -12 + L / 2 + r() * (24 - L) });
  }
  const S = boxes({ count: 14, size: [1, 1, 1], color: 0x101114, metal: 0.2, rough: 0.6, edgeW: 1.0 });
  group.add(S.mesh);
  const I = cards({ count: 400 });
  group.add(I.mesh);
  const slots = [];
  for (let i = 0; i < 400; i++) slots.push({ s: i % 14, d: (r() - 0.5), ry: (r() - 0.5) * 0.3, layer: Math.floor(i / 140) });
  const lamps = orbs({ count: 14, r: 0.35 });
  group.add(lamps.mesh);
  const api = {
    group, strips, I, S, lamps,
    update(lt, { cards: nc = 400, lit = 0, t = lt, flow = 6 } = {}) {
      strips.forEach((s, i) => {
        S.set(i, { p: [s.x, 0.05, s.z], s: s.alongX ? [s.L, 0.1, 0.4] : [0.4, 0.1, s.L], edge: mixA(lin(C.ice, kl(0.6)), lin(C.amber, kl(3)), lit), body: mixA(lin(C.ice, 0.02), lin(C.amber, 0.25), lit) });
        const on = blink(t, { bpm: 120, div: 2, origin: (i % 2) * 0.25 });
        const lp = s.alongX ? [s.x + s.L / 2 + 0.5, 0.6, s.z] : [s.x, 0.6, s.z + s.L / 2 + 0.5];
        if (lit > 0.5) lamps.set(i, { p: lp, c: lin(C.green), k: 4 }); else lamps.set(i, { p: lp, c: lin(C.red), k: 8 * on + 0.5 });
      });
      for (let i = 0; i < 400; i++) {
        if (i >= nc) { I.hide(i); continue; }
        const sl = slots[i], s = strips[sl.s];
        let d = sl.d * (s.L - 3);
        if (lit > 0) d = ((((d + s.L / 2) + t * flow * lit) % s.L) + s.L) % s.L - s.L / 2;
        const p = s.alongX ? [s.x + d, 0.2 + sl.layer * 0.3, s.z] : [s.x, 0.2 + sl.layer * 0.3, s.z + d];
        const ry = (s.alongX ? 0 : Math.PI / 2) + sl.ry * (1 - lit);
        I.set(i, { p, r: [0, ry, 0], s: [0.55, 0.55, 0.55], edge: mixA(CARD.edge(1), CARD.amberEdge(), lit), body: mixA(CARD.body(1), CARD.amberBody(2), lit) });
      }
      S.commit(); I.commit(); lamps.commit();
    },
  };
  api.update(0);
  return api;
}

// =====================================================================================================
// LIGHT BANKS — 8 overhead banks at x=-70+20i, y=60, z=0: housing 16x0.8x12, a lamp-grid underside, a beam to the floor,
// 1,500 dust motes inside the beams, and a brass relay at (x, 60.6, 6) for the macro shots (ii-alarm-c / iii-bank-3).
// lightBanks() -> { group, beams, lamps, relays, update(lt, { on: number|[8] (0..1.3; drive with W.ignite(dt)), alarm: number|[8] 0..1,
//   t (GLOBAL time: alarm breathes on quarter notes), beam (opacity scale, 1), relay: number|[8] 0..1 closed (default follows on/alarm), dust 0..1,
//   housing: true|false (false hides housings/lamps/relays but keeps beams + floor pools: use it for top-downs above y 60, where the
//   16x12 housings would otherwise cover the line) }) }
// OFF: slate, ice edges k0.2. ALARM: #FF453A k3 lamps, beam 0.06, pulse 0.6..1. ON: #FFE2C0 k12 lamps, beam #FFD2A0 0.18.
// =====================================================================================================
export function lightBanks({ dustCount = 1500, seed = 41 } = {}) {
  const group = new THREE.Group();
  const H = boxes({ count: 8, size: [16, 0.8, 12], color: C.slate, metal: 0.5, rough: 0.5, edgeW: 1.3 });
  BANK_X.forEach((x, i) => H.set(i, { p: [x, 60, 0], edge: lin(C.steel, kl(0.2)), body: [0, 0, 0] }));
  H.commit(); group.add(H.mesh);
  const lampMat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: withFog({ uCol: { value: new THREE.Color(0, 0, 0) } }),
    vertexShader: `varying vec2 vUv; ${FOG_V} void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; varying vec2 vUv; ${FOG_F}
      void main(){ vec2 g = vUv * vec2(6.0, 4.0); vec2 f = abs(fract(g) - 0.5);
        float cell = 1.0 - smoothstep(0.30, 0.38, max(f.x, f.y));
        float rim = smoothstep(0.42, 0.5, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
        vec3 c = uCol * (0.06 + cell) + uCol * rim * 0.3;
        gl_FragColor = vec4(mix(c, fogColor, fogF()), 1.0); }`,
  });
  const lamps = [], beams = [], relays = [];
  const lampGeo = geo('bankLamp', () => new THREE.PlaneGeometry(15.4, 11.4));
  BANK_X.forEach((x, i) => {
    const m = new THREE.Mesh(lampGeo, lampMat.clone()); m.rotation.x = Math.PI / 2; m.position.set(x, 59.58, 0); group.add(m); lamps.push(m);
    m.userData.base = new THREE.Color(0, 0, 0);
    m.onBeforeRender = (r, sc, cam) => { _gv.setFromMatrixPosition(m.matrixWorld).applyMatrix4(cam.matrixWorldInverse);
      const ndc = 8 * cam.projectionMatrix.elements[5] / Math.max(-_gv.z, 0.05);
      m.material.uniforms.uCol.value.copy(m.userData.base).multiplyScalar(clamp(Math.pow(0.12 / ndc, 0.6), 0.3, 1.2)); };
    const b = shaft({ rTop: 6, rBot: 10, h: 58, color: C.amber, k: 1, opacity: 0.18, top: 1.0, bottom: 0.4, apexFade: 0.04 });
    b.position.set(x, 59.6 - 29, 0); group.add(b); beams.push(b);
    const rg = new THREE.Group(); rg.position.set(x, 60.6, 6);
    const brass = edgeStd({ color: C.brassDark, metal: 0.9, rough: 0.35, edge: C.brassHi, edgeK: 0, edgeW: 1.2 });
    const base = new THREE.Mesh(BOX(), brass); base.scale.set(2.4, 0.2, 1.2); rg.add(base);
    const post = new THREE.Mesh(BOX(), brass); post.scale.set(0.25, 0.9, 0.25); post.position.set(-0.8, 0.5, 0); rg.add(post);
    const contact = new THREE.Mesh(BOX(), brass); contact.scale.set(0.3, 0.3, 0.6); contact.position.set(0.85, 0.25, 0); rg.add(contact);
    const arm = new THREE.Group(); arm.position.set(-0.8, 0.95, 0);
    const armM = new THREE.Mesh(BOX(), brass); armM.scale.set(1.75, 0.14, 0.4); armM.position.set(0.875, 0, 0); arm.add(armM); rg.add(arm);
    const fil = new THREE.Mesh(geo('filament', () => new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6)), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    fil.rotation.z = Math.PI / 2; fil.position.set(0, 0.55, -0.35); rg.add(fil);
    group.add(rg); relays.push({ g: rg, arm, fil, brass });
  });
  const r = rand(seed);
  const dpos = new Float32Array(dustCount * 3), dbase = new Float32Array(dustCount * 4), dcol = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const b = i % 8; const y = r() * 58; const rad = lerp(10, 6, y / 58) * Math.sqrt(r()) * 0.9; const a = r() * Math.PI * 2;
    dbase[i * 4] = BANK_X[b] + Math.cos(a) * rad; dbase[i * 4 + 1] = y; dbase[i * 4 + 2] = Math.sin(a) * rad; dbase[i * 4 + 3] = r();
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3)); dg.setAttribute('color', new THREE.BufferAttribute(dcol, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.2, map: G.dotTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  dust.frustumCulled = false; group.add(dust);
  const st = { on: Array(8).fill(0), alarm: Array(8).fill(0) };
  const api = {
    group, beams, lamps, relays, dust, state: st,
    update(lt, p = {}) {
      const arr = (v, d) => (v === undefined ? d : Array.isArray(v) ? v : Array(8).fill(v));
      const on = arr(p.on, st.on), alarm = arr(p.alarm, st.alarm), relay = arr(p.relay, null);
      st.on = on; st.alarm = alarm;
      const t = p.t ?? lt, beamK = p.beam ?? 1, dustK = p.dust ?? 1;
      if (p.housing !== undefined) { const hv = !!p.housing; H.mesh.visible = hv; lamps.forEach((m) => { m.visible = hv; }); relays.forEach((R) => { R.g.visible = hv; }); }
      const pulse = lerp(0.6, 1.0, 0.5 + 0.5 * Math.cos((t / spb(120)) * Math.PI * 2));
      for (let i = 0; i < 8; i++) {
        const o = on[i] || 0, a = o > 0.01 ? 0 : clamp(alarm[i] || 0);
        const col = o > 0 ? lin(C.bankOn, ko(12) * 0.38 * o) : a > 0 ? lin(C.red, ko(3) * a * pulse) : [0, 0, 0];
        lamps[i].userData.base.setRGB(col[0], col[1], col[2]);
        H.color(i, o > 0 ? lin(C.amber, kl(2) * o) : a > 0 ? lin(C.red, kl(1.0) * a * pulse) : lin(C.steel, kl(0.12)), [0, 0, 0]);
        const bm = beams[i];
        if (o > 0) { bm.visible = true; bm.userData.setColor(C.amber, 1); bm.userData.set(undefined, 0.18 * o * beamK); }
        else if (a > 0) { bm.visible = true; bm.userData.setColor(C.red, 0.4); bm.userData.set(undefined, 0.06 * a * pulse * beamK); }
        else bm.visible = false;
        const R = relays[i];
        const closed = relay ? clamp(relay[i]) : clamp(Math.max(o, a));
        R.arm.rotation.z = lerp(0.55, -0.12, closed);
        R.brass.setEdge(C.brassHi, kl(o > 0 ? 1.5 : a > 0 ? 0.6 : 0.15));
        const fk = o > 0 ? 10 * o : a > 0 ? 6 * a * pulse : 0;
        R.fil.material.color.set(o > 0 ? C.bankOn : C.red).multiplyScalar(ko(fk));
      }
      H.commit();
      for (let i = 0; i < dustCount; i++) {
        const b = i % 8; const lvl = Math.max((on[b] || 0), clamp(alarm[b] || 0) * 0.15) * dustK;
        const y = ((dbase[i * 4 + 1] - t * 0.6 * (0.5 + dbase[i * 4 + 3])) % 58 + 58) % 58;
        dpos[i * 3] = dbase[i * 4] + Math.sin(t * 0.3 + i) * 0.4; dpos[i * 3 + 1] = y + 1; dpos[i * 3 + 2] = dbase[i * 4 + 2] + Math.cos(t * 0.27 + i * 1.3) * 0.4;
        const c = (on[b] || 0) > 0 ? lin(C.amber, lvl * 1.4) : lin(C.red, lvl);
        const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 7.1);
        dcol[i * 3] = c[0] * tw; dcol[i * 3 + 1] = c[1] * tw; dcol[i * 3 + 2] = c[2] * tw;
      }
      dg.attributes.position.needsUpdate = true; dg.attributes.color.needsUpdate = true;
    },
    sources() {
      const out = [];
      for (let i = 0; i < 8; i++) {
        const o = st.on[i] || 0, a = clamp(st.alarm[i] || 0);
        if (o > 0.01) out.push({ p: [BANK_X[i], 59, 0], c: C.amber, k: 5 * o, pool: 10, poolK: 1.0, refl: 0.5, size: 6 });
        else if (a > 0.01) out.push({ p: [BANK_X[i], 59, 0], c: C.red, k: 0.5 * a, pool: 6, poolK: 0.4, refl: 0.6, size: 6 });
      }
      return out;
    },
  };
  api.update(0);
  return api;
}

// =====================================================================================================
// THE FOREMAN — #1 hero. Origin (0,0,-200), faces +z, 196u tall. Obsidian tiers T1-T4 (ziggurat) + T5-T6 (obelisk shaft, T6 with a 3u
// slot on +z through which the clay CORE shows) + T7 pyramidion + crest ring. 42 brass seam strips ignite RADIALLY from the core at
// 120 u/s (a hot wavefront rides ahead; whole silhouette traced in ~1.6 s) and the wave leaves faint stone-course circuitry on the faces.
// foreman() -> { group, update(lt, params), corePos, sweepPath, sweepLen, sources() }
// params: lit: seconds since ignition (<= 0 unlit) | seamK (nominal 6) | core: nominal k override (default from lit: 0 -> 26 -> 20)
//   beams 0..1 (4 crest beams; default fades in from lit 0.8) | panel 0..1 (face circuitry, default 1) | crest 0..1
//   rimColor / rimK: dead-seam + tier-edge glint + faint face bounce when UNLIT (plants: clay 0.4 in Act I, red 0.5 in Act II, steel 0.3 cold)
//   bounce: scale of the warm hall bounce on the lit faces (default 1)
//   sweep: { s: distance along the T1-T4 front-left corner path (0..sweepLen ~110u; camForemanWorm uses s = 140*lt), k: 12, len: 6 } | null
//   engrave: { k (raw, default 1.2 lit / 0 unlit), x: highlight band position 0..1, width, gain } | hourRing: 0..18 lamps lit | slotGlow 0..1
// =====================================================================================================
const TIERS = [
  { w: 120, y0: 0, y1: 18 }, { w: 96, y0: 18, y1: 36 }, { w: 74, y0: 36, y1: 54 }, { w: 54, y0: 54, y1: 74 },
  { w: 30, y0: 74, y1: 134 }, { w: 22, y0: 134, y1: 174 },
];
export function foreman() {
  const group = new THREE.Group();
  const O = [0, 0, -200];
  const core = new THREE.Vector3(0, 150, -195);
  const U = { uCore: { value: core.clone() }, uR: { value: -1 }, uPanel: { value: hcol(C.brass, 0) }, uEdgeC: { value: hcol(C.brass, 0) }, uRimC: { value: hcol(C.steel, 0) }, uBounce: { value: hcol(C.amber, 0) } };
  const body = new THREE.MeshStandardMaterial({ color: C.obsidian, roughness: 0.55, metalness: 0.35 });
  body.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFW; varying vec3 vFN; varying vec2 vFUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFW = (modelMatrix * vec4(transformed,1.0)).xyz; vFN = normalize(mat3(modelMatrix) * objectNormal); vFUv = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform vec3 uCore; uniform float uR; uniform vec3 uPanel; uniform vec3 uEdgeC; uniform vec3 uRimC; uniform vec3 uBounce; varying vec3 vFW; varying vec3 vFN; varying vec2 vFUv;
        float lineAA(float x, float cell){ float c = x / cell; float fw = fwidth(c); float g = abs(fract(c - 0.5) - 0.5) / max(fw, 1e-4); return (1.0 - min(g, 1.0)) * (1.0 - smoothstep(0.12, 0.35, fw)); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 an = abs(vFN);
          float vert = an.y < 0.5 ? 1.0 : 0.0;
          float h = an.x > 0.5 ? vFW.z : vFW.x;
          float gl = vert * max(lineAA(vFW.y, 4.5) * 0.8, lineAA(h, 12.0) * 0.45);
          float d = distance(vFW, uCore);
          float lit = uR > 0.0 ? smoothstep(uR, uR - 14.0, d) : 0.0;
          float front = uR > 0.0 ? exp(-pow((d - uR) / 5.0, 2.0)) : 0.0;
          vec2 fw = fwidth(vFUv); vec2 dd = min(vFUv, 1.0 - vFUv) / max(fw, vec2(1e-6)); float e = 1.0 - smoothstep(0.7, 1.5, min(dd.x, dd.y));
          float bounce = vert * (0.35 + 0.65 * max(vFN.z, 0.0)) * pow(1.0 - clamp(vFW.y / 200.0, 0.0, 1.0), 2.0);
          float wash = 0.0;
          if (vert > 0.5) { float tops[6] = float[6](18.0, 36.0, 54.0, 74.0, 134.0, 174.0); float b = 0.0;
            for (int i = 0; i < 6; i++) { float t = tops[i]; if (vFW.y <= t + 0.01 && vFW.y >= b - 0.01) { wash = exp(-(t - vFW.y) / 3.0) + (i > 0 ? 0.5 * exp(-(vFW.y - b) / 4.0) : 0.0); } b = t; } }
          totalEmissiveRadiance += uPanel * gl * (lit * 0.04 + front * 1.2) + uEdgeC * e * lit + uRimC * e + uBounce * bounce + uPanel * wash * lit * 0.22; }`);
  };
  body.customProgramCacheKey = () => 'foremanBody';
  TIERS.forEach((T, i) => {
    if (i === 5) return;
    const m = new THREE.Mesh(geo('tier' + i, () => new THREE.BoxGeometry(T.w, T.y1 - T.y0, T.w)), body); m.position.set(O[0], (T.y0 + T.y1) / 2, O[2]); group.add(m);
  });
  { // T6 = 4 slabs leaving a 3u vertical slot on +z (y 136..172)
    const w = 22, h = 40, y0 = 134, th = 3, cz = O[2];
    const slab = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(BOX(), body); m.scale.set(sx, sy, sz); m.position.set(x, y, z); group.add(m); };
    slab(w, h, th, 0, y0 + h / 2, cz - w / 2 + th / 2);
    slab(th, h, w - 2 * th, -w / 2 + th / 2, y0 + h / 2, cz);
    slab(th, h, w - 2 * th, w / 2 - th / 2, y0 + h / 2, cz);
    const fw = (w - 3) / 2;
    slab(fw, h, th, -(1.5 + fw / 2), y0 + h / 2, cz + w / 2 - th / 2);
    slab(fw, h, th, 1.5 + fw / 2, y0 + h / 2, cz + w / 2 - th / 2);
    slab(3, 2, th, 0, y0 + 1, cz + w / 2 - th / 2);
    slab(3, 2, th, 0, y0 + h - 1, cz + w / 2 - th / 2);
    slab(w - 2 * th, 1, w - 2 * th, 0, y0 + h - 0.5, cz);
  }
  const pyr = new THREE.Mesh(geo('pyramidion', () => { let g = new THREE.CylinderGeometry(1.414, 9.9, 20, 4, 1, true); g.rotateY(Math.PI / 4); g = g.toNonIndexed(); g.computeVertexNormals(); return g; }), body);
  pyr.position.set(0, 184, O[2]); group.add(pyr);
  // core + slot glow + flare + light
  const coreM = glowMesh(SPHERE(20), C.clay, 0, { radius: 1 }); coreM.scale.setScalar(4); coreM.position.copy(core); group.add(coreM);
  const slotGlow = glowMesh(geo('slotPlane', () => new THREE.PlaneGeometry(2.6, 36)), C.ember, 0, { radius: 18, ref: 0.15, shade: 'box' });
  slotGlow.position.set(0, 154, O[2] + 11 - 3.2); group.add(slotGlow);
  const coreFlare = flare({ color: C.ember, k: 0, size: 30 }); coreFlare.position.set(0, 150, O[2] + 12.5); group.add(coreFlare);
  const coreLight = new THREE.PointLight(C.ember, 0, 160, 1.3); coreLight.position.set(0, 150, O[2] + 16); group.add(coreLight);
  // brass seams
  const seams = [];
  const addSeam = (a, b, th = 0.4) => seams.push({ a: new THREE.Vector3(...a), b: new THREE.Vector3(...b), th });
  TIERS.forEach((T) => { const h = T.w / 2 + 0.05, y = T.y1 + 0.2, z = O[2];
    addSeam([-h, y, z + h], [h, y, z + h]); addSeam([-h, y, z - h], [h, y, z - h]); addSeam([-h, y, z - h], [-h, y, z + h]); addSeam([h, y, z - h], [h, y, z + h]); });
  { const y = 194.2, h = 1.05, z = O[2]; addSeam([-h, y, z + h], [h, y, z + h]); addSeam([-h, y, z - h], [h, y, z - h]); addSeam([-h, y, z - h], [-h, y, z + h]); addSeam([h, y, z - h], [h, y, z + h]); }
  [[74, 134, 15.05], [134, 174, 11.05]].forEach(([y0, y1, h]) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) addSeam([sx * h, y0, O[2] + sz * h], [sx * h, y1, O[2] + sz * h]); });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addSeam([sx * 7.05, 174, O[2] + sz * 7.05], [sx * 1.05, 194, O[2] + sz * 1.05]);
  addSeam([-1.6, 136, O[2] + 11.1], [-1.6, 172, O[2] + 11.1], 0.3); addSeam([1.6, 136, O[2] + 11.1], [1.6, 172, O[2] + 11.1], 0.3);
  const SU = { uCore: U.uCore, uR: U.uR, uK: { value: hcol(C.brass, 0) }, uHot: { value: hcol(C.brassHi, 0) }, uDead: { value: hcol(C.deadBrass, 0) } };
  const seamMat = new THREE.MeshStandardMaterial({ color: C.deadBrass, metalness: 0.9, roughness: 0.35 });
  seamMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ vec4 w = vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nw = instanceMatrix * w;\n#endif\nvSW = (modelMatrix * w).xyz; }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uCore; uniform float uR; uniform vec3 uK; uniform vec3 uHot; uniform vec3 uDead; varying vec3 vSW;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float d = distance(vSW, uCore);
          float lit = uR > 0.0 ? smoothstep(uR, uR - 4.0, d) : 0.0;
          float front = uR > 0.0 ? exp(-pow((d - uR) / 3.0, 2.0)) : 0.0;
          totalEmissiveRadiance += uK * lit + uHot * front + uDead; }`);
  };
  seamMat.customProgramCacheKey = () => 'foremanSeam';
  const seamI = new THREE.InstancedMesh(BOX(), seamMat, seams.length);
  { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ax = new THREE.Vector3(1, 0, 0);
    seams.forEach((s, i) => { const d = s.b.clone().sub(s.a); const len = d.length(); q.setFromUnitVectors(ax, d.normalize());
      m4.compose(s.a.clone().add(s.b).multiplyScalar(0.5), q, new THREE.Vector3(len + s.th, s.th, s.th)); seamI.setMatrixAt(i, m4); }); }
  seamI.frustumCulled = false; group.add(seamI);
  // anti-aliased glow layer riding just outside each seam's outer top corner, subdivided (2.5u) so the radial wavefront is smooth
  const segPos = [];
  const cen = new THREE.Vector3(0, 0, O[2]);
  seams.forEach((sm) => {
    const len = sm.a.distanceTo(sm.b); const n = Math.max(1, Math.round(len / 2.5));
    const horiz = Math.abs(sm.a.y - sm.b.y) < 1e-3;
    const off = new THREE.Vector3();
    if (horiz) { const mid = sm.a.clone().add(sm.b).multiplyScalar(0.5); off.set(mid.x - cen.x, 0, mid.z - cen.z); if (Math.abs(off.x) > Math.abs(off.z)) off.set(Math.sign(off.x), 0, 0); else off.set(0, 0, Math.sign(off.z)); off.multiplyScalar(0.35); off.y = sm.th * 0.5 + 0.08; }
    else { const mid = sm.a.clone().add(sm.b).multiplyScalar(0.5); off.set(Math.sign(mid.x - cen.x) * 0.35, 0, Math.sign(mid.z - cen.z) * 0.35); }
    for (let i = 0; i < n; i++) { const p0 = sm.a.clone().lerp(sm.b, i / n).add(off), p1 = sm.a.clone().lerp(sm.b, (i + 1) / n).add(off); segPos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z); }
  });
  const sgGeo = new LineSegmentsGeometry(); sgGeo.setPositions(segPos);
  const sgMat = new LineMaterial({ color: hcol(C.brass, 1), linewidth: 2.4 * 2.2, worldUnits: false }); sgMat.fog = true; sgMat.resolution.set(1920, 1080);
  sgMat.polygonOffset = true; sgMat.polygonOffsetFactor = -2; sgMat.polygonOffsetUnits = -60;
  sgMat.uniforms.uCore = U.uCore; sgMat.uniforms.uR = U.uR; sgMat.uniforms.uHotC = { value: hcol(C.brassHi, 0) }; sgMat.uniforms.uDeadC = { value: hcol(C.clay, 0) };
  softLine(sgMat, { key: 'seamGlow', extraV: 'uniform vec3 uCore; uniform float uR; varying float vLit; varying float vFront;',
    extraVMain: 'vec3 smid = (modelMatrix * vec4((instanceStart + instanceEnd) * 0.5, 1.0)).xyz; float sd = distance(smid, uCore); vLit = uR > 0.0 ? smoothstep(uR, uR - 4.0, sd) : 0.0; vFront = uR > 0.0 ? exp(-pow((sd - uR) / 4.0, 2.0)) : 0.0;',
    extraF: 'uniform vec3 uHotC; uniform vec3 uDeadC; varying float vLit; varying float vFront;', colorExpr: 'diffuse * vLit + uHotC * vFront + uDeadC' });
  const seamGlow = new LineSegments2(sgGeo, sgMat); seamGlow.frustumCulled = false; group.add(seamGlow);
  // crest ring + 4 crest beams (a light pyramid from the crest to the T1..T4 terrace corners)
  const crest = G.ring({ r: 5, tube: 0.3, color: C.brassHi, k: 0 }); crest.rotation.x = Math.PI / 2; crest.position.set(0, 196, O[2]); group.add(crest);
  const beamsF = [];
  [[-1, 1, 54, 18], [1, 1, 42.5, 36], [-1, -1, 32, 54], [1, -1, 21, 74]].forEach(([sx, sz, r, y]) => {
    const b = shaft({ rTop: 0.4, rBot: 6, h: 100, color: C.amber, k: 1, opacity: 0, top: 0.6, bottom: 1.0, apexFade: 0.35 });
    aimShaft(b, [0, 196, O[2]], [sx * r, y, O[2] + sz * r]); group.add(b); beamsF.push(b);
  });
  // engraving '5.5' on T4's front face
  const engr = text3D('5.5', { height: 8, color: C.brass, k: 0, font: '300 220px "Inter Tight"', letterSpacing: 6 });
  engr.position.set(0, 64, -172.8); group.add(engr);
  // hour ring: 18 clay floor lamps around the base (r 94)
  const hour = boxes({ count: 18, size: [2.2, 0.3, 2.2], color: 0x0d0d0e, metal: 0.4, rough: 0.5, edgeW: 1.2 });
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; hour.set(i, { p: [Math.sin(a) * 94, 0.15, O[2] + Math.cos(a) * 94], r: [0, a, 0], edge: lin(C.clay, kl(0.3)), body: [0, 0, 0] }); }
  hour.commit(); group.add(hour.mesh);
  // specular sweep path (T1..T4 front-left corner, climbing)
  const sweepPts = [[-60.3, 0, -139.7], [-60.3, 18.3, -139.7], [-48.3, 18.3, -151.7], [-48.3, 36.3, -151.7], [-37.3, 36.3, -162.7], [-37.3, 54.3, -162.7], [-27.3, 54.3, -172.7], [-27.3, 74.3, -172.7]].map((p) => new THREE.Vector3(...p));
  const sweepPath = new THREE.CurvePath(); for (let i = 1; i < sweepPts.length; i++) sweepPath.add(new THREE.LineCurve3(sweepPts[i - 1], sweepPts[i]));
  const sweepLen = sweepPath.getLength();
  const SW = orbs({ count: 24, r: 0.35, seg: 6 }); group.add(SW.mesh);
  const sweepFl = flare({ color: C.clay, k: 0, size: 5 }); group.add(sweepFl);
  const st = { lit: 0, core: 0 };
  const api = {
    group, corePos: core.toArray(), sweepPath, sweepLen, state: st, coreMesh: coreM, coreFlare, coreLight, engraving: engr, beams: beamsF, seams: seamI, crest,
    update(lt, p = {}) {
      const L = p.lit ?? 0; st.lit = L;
      U.uR.value = L > 0 ? L * 120 : -1;
      SU.uK.value.set(C.brass).multiplyScalar(kl(p.seamK ?? 6) * 0.18);
      SU.uHot.value.set(C.brassHi).multiplyScalar(L > 0 && L < 2.2 ? kl(16) * 0.3 : 0);
      sgMat.color.set(C.brass).multiplyScalar(kl(p.seamK ?? 6) * 0.36);
      sgMat.uniforms.uHotC.value.set(C.brassHi).multiplyScalar(L > 0 && L < 2.2 ? kl(16) * 0.35 : 0);
      const rimK = p.rimK ?? 0, rimC = p.rimColor ?? C.steel;
      SU.uDead.value.set(rimC).multiplyScalar(L > 0 ? 0 : kl(rimK) * 1.5);
      sgMat.uniforms.uDeadC.value.set(rimC).multiplyScalar(L > 0 ? 0 : kl(rimK) * 1.2);
      U.uPanel.value.set(C.brass).multiplyScalar(L > 0 ? kl(1.5) * (p.panel ?? 1) : 0);
      U.uEdgeC.value.set(C.brass).multiplyScalar(L > 0 ? kl(0.3) : 0);
      U.uRimC.value.set(rimC).multiplyScalar(L > 0 ? 0 : kl(rimK) * 1.5);
      U.uBounce.value.set(L > 0 ? C.amber : rimC).multiplyScalar(L > 0 ? 0.035 * clamp(L / 1.6) * (p.bounce ?? 1) : 0.02 * rimK * (p.bounce ?? 1));
      let ck = p.core;
      if (ck === undefined) ck = L <= 0 ? 0 : L < 0.12 ? 26 * (L / 0.12) : L < 0.5 ? lerp(26, 20, ease.out((L - 0.12) / 0.38)) : 20;
      st.core = ck;
      coreM.userData.setGlow(ck);
      slotGlow.userData.setGlow(ck * 0.3 * (p.slotGlow ?? 1));
      coreFlare.userData.set(ck * 0.1);
      coreLight.intensity = ck * 60;
      crest.material.color.set(C.brassHi).multiplyScalar(kl(6) * (p.crest ?? clamp((L - 1.2) * 4)));
      const bm = p.beams ?? clamp((L - 0.8) / 0.5);
      beamsF.forEach((b) => { b.visible = bm > 0.001; b.userData.set(1, 0.12 * bm); });
      const en = p.engrave || {};
      engr.userData.set(en.k ?? (L > 0 ? 1.2 : 0), C.brass);
      engr.userData.sweep(en.x ?? -9, en.width ?? 0.18, en.gain ?? 6);
      const hr = p.hourRing ?? 0;
      for (let i = 0; i < 18; i++) hour.color(i, i < hr ? lin(C.clay, kl(6)) : lin(C.clay, kl(0.15)), i < hr ? lin(C.clay, ko(3)) : [0, 0, 0]);
      hour.commit();
      const sw = p.sweep;
      if (sw && sw.s !== undefined && sw.s >= 0 && sw.s - (sw.len ?? 6) <= sweepLen) {
        const len = sw.len ?? 6, k = sw.k ?? 12;
        for (let i = 0; i < 24; i++) {
          const s = sw.s - (i / 23) * len;
          if (s < 0 || s > sweepLen) { SW.hide(i); continue; }
          const pt = sweepPath.getPointAt(s / sweepLen);
          SW.set(i, { p: [pt.x, pt.y, pt.z], s: 0.9, c: mixA(lin(C.clay), lin(C.ivory), s / sweepLen), k: k * Math.pow(1 - i / 24, 1.5) });
          if (i === 0) { sweepFl.position.copy(pt); sweepFl.userData.set(k * 0.5, C.clay); }
        }
      } else { for (let i = 0; i < 24; i++) SW.hide(i); sweepFl.userData.set(0); }
      SW.commit();
    },
    sources() {
      const out = [];
      if (st.core > 0.1) out.push({ p: core.toArray(), c: C.ember, k: st.core * 0.25, pool: 0, refl: 1.0, size: 4 });
      if (st.lit > 0.2) {
        const f = clamp(st.lit - 1.0);   // seams near the floor light last
        out.push({ p: [0, 40, -150], c: C.brass, k: 2 * f, pool: 45, poolK: 0.5, refl: 0.0, size: 30 });
        for (const x of [-45, -15, 15, 45]) out.push({ p: [x, 18.2, -139.8], c: C.brass, k: 3 * f, pool: 0, refl: 0.6, size: 7 });
        for (const x of [-24, 24]) out.push({ p: [x, 36.2, -151.8], c: C.brass, k: 2.5 * f, pool: 0, refl: 0.5, size: 7 });
      }
      return out;
    },
  };
  api.update(0);
  return api;
}
/** foremanPlant fog: density = 1.27 / distance(camera -> foreman), ~20% contrast left on the foreman (reads as architecture). */
export function plantFog(camPos, target = [0, 60, -200]) { const d = Math.hypot(camPos[0] - target[0], camPos[1] - target[1], camPos[2] - target[2]); return 1.27 / d; }

// =====================================================================================================
// THREADS — generic fan of fat lines from one point to many (foreman 12 threads, Stripe session -> 12 orbs).
// threads({ from, to:[[x,y,z]...], ctrl:(j,to)=>[x,y,z] (quadratic bezier control), c0, c1 (gradient), k (nominal), width (px), seg })
//   -> { group, lines, curves, update({ reveal: number|[n] 0..1, k, flare: [n] extra multiplier }) }
// =====================================================================================================
export function threads({ from, to, ctrl = null, c0 = C.clay, c1 = C.amberRail, k = 3, width = 2.5, seg = 48 } = {}) {
  const group = new THREE.Group();
  const A = new THREE.Vector3(...from);
  const curves = to.map((t, j) => {
    const B = new THREE.Vector3(...t);
    const Cc = ctrl ? new THREE.Vector3(...ctrl(j, t)) : A.clone().add(B).multiplyScalar(0.5);
    return new THREE.QuadraticBezierCurve3(A, Cc, B);
  });
  const ca = lin(c0), cb = lin(c1);
  const lines = curves.map((cv) => {
    const pts = cv.getPoints(seg);
    const l = fat(pts, { colors: pts.map((_, i) => mixA(ca, cb, i / seg)), k, width });
    group.add(l); return l;
  });
  return {
    group, lines, curves,
    update({ reveal = 1, k: kk = k, flare = null } = {}) {
      lines.forEach((l, j) => { const r = Array.isArray(reveal) ? reveal[j] : reveal; l.userData.reveal(r); l.userData.set(kk * (1 + (flare ? flare[j] || 0 : 0))); });
    },
  };
}

// =====================================================================================================
// FOREMAN THREADS — ONE session -> A DOZEN. 12 fat lines core -> 12 clay sub-leads (orb r1.6 k10 at (x_j, 40, -12), x_j = -66+12j),
// 84 sub-flows as 6,000 particles from the sub-leads down to the station tops, pulses riding the threads at 60 u/s, and the
// human's brief mote (a path from the hand at the foreman's foot up the stepped front face into the core).
// foremanThreads({ briefStart }) -> { group, briefPath, leadPos, update(lt, { reveal 0..1|[12], k (nominal thread k, 3), leads 0..1|[12],
//   flow 0..1 (particle gate), t (time for flows/pulses), pulses 0..1, flare [12] (extra multiplier, e.g. brief arrival sequence),
//   brief: 0..1 mote progress along briefPath (<0 hidden), briefK }) }
// =====================================================================================================
export function foremanThreads({ flowCount = 6000, seed = 61, briefStart = POS.brief } = {}) {
  const group = new THREE.Group();
  const leadPos = SUBLEAD_X.map((x) => [x, 40, -12]);
  const T = threads({ from: POS.core, to: leadPos, ctrl: (j, t) => [0.5 * t[0], 110, -100], c0: C.clay, c1: C.amberRail, k: 2.2, width: 2.5, seg: 56 });
  group.add(T.group);
  const leads = orbs({ count: 12, r: 1.6, seg: 14 }); group.add(leads.mesh);
  const leadFl = leadPos.map((p) => { const f = flare({ color: C.clay, k: 0, size: 10 }); f.position.set(...p); group.add(f); return f; });
  const r = rand(seed);
  const curves = [];
  leadPos.forEach((p) => { for (let k = 0; k < 7; k++) { const tx = p[0] + (k - 3) * 1.7 + (r() - 0.5) * 0.6; const tz = (r() - 0.5) * 6;
    curves.push(G.spline([[p[0], p[1] - 1.6, p[2]], [lerp(p[0], tx, 0.45), 22 + r() * 6, lerp(p[2], tz, 0.4)], [tx, 6, tz * 0.8], [tx, 3.1, tz]])); } });
  const F = G.flow({ curves, count: flowCount, speed: 0.5, size: 0.45, color: C.amberRail, seed, jitter: 0.12 });
  F.material.color.set(C.amberRail).multiplyScalar(ko(3));
  group.add(F.points); F.points.frustumCulled = false;
  const pulseN = 36; const pg = new THREE.BufferGeometry(); const pp = new Float32Array(pulseN * 3); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pulseMat = new THREE.PointsMaterial({ size: 2.2, map: G.dotTexture(), color: hcol(C.amberRail, ko(14)), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pulses = new THREE.Points(pg, pulseMat); pulses.frustumCulled = false; group.add(pulses);
  const lens = T.curves.map((c) => c.getLength());
  const briefPath = G.spline([briefStart, [0.2, 20, -137], [0, 40, -148], [0, 60, -159], [0, 80, -170], [0, 110, -181], [0, 140, -186.5], [0, 150, -190], [0, 150, -195]]);
  const mote = flare({ color: C.ivory, k: 0, size: 3.5 }); group.add(mote);
  const moteCore = glowMesh(SPHERE(8), C.ivory, 14, { radius: 1 }); moteCore.scale.setScalar(0.3); group.add(moteCore);
  const api = {
    group, threads: T, leadPos, flow: F, briefPath, leads,
    update(lt, p = {}) {
      const t = p.t ?? lt;
      T.update({ reveal: p.reveal ?? 1, k: p.k ?? 2.2, flare: p.flare ?? null });
      const ld = p.leads ?? 1;
      leadPos.forEach((pos, j) => { const lv = Array.isArray(ld) ? ld[j] : ld; const rv = Array.isArray(p.reveal) ? p.reveal[j] : (p.reveal ?? 1);
        const on = clamp(lv) * (rv >= 0.999 ? 1 : 0); if (on < 0.01) { leads.hide(j); leadFl[j].userData.set(0); return; }
        const fl = 1 + (p.flare ? p.flare[j] || 0 : 0);
        leads.set(j, { p: pos, c: lin(C.clay), k: 10 * on * fl }); leadFl[j].userData.set(2 * on * fl); });
      leads.commit();
      F.update(t, p.flow ?? 1); F.points.visible = (p.flow ?? 1) > 0.001;
      const pk = p.pulses ?? 1;
      for (let i = 0; i < pulseN; i++) {
        const j = i % 12, k = Math.floor(i / 12); const rv = Array.isArray(p.reveal) ? p.reveal[j] : (p.reveal ?? 1);
        const u = ((t * 60) / lens[j] + k / 3 + j * 0.07) % 1;
        if (pk < 0.01 || u > rv) { pp[i * 3] = 1e5; continue; }
        const q = T.curves[j].getPointAt(u); pp[i * 3] = q.x; pp[i * 3 + 1] = q.y; pp[i * 3 + 2] = q.z;
      }
      pg.attributes.position.needsUpdate = true; pulseMat.color.set(C.amberRail).multiplyScalar(ko(14) * pk);
      const b = p.brief ?? -1;
      if (b >= 0 && b <= 1) { const q = briefPath.getPointAt(clamp(b)); mote.position.copy(q); moteCore.position.copy(q); mote.userData.set(p.briefK ?? 8, C.ivory); moteCore.visible = true; }
      else { mote.userData.set(0); moteCore.visible = false; }
    },
  };
  api.update(0);
  return api;
}

// =====================================================================================================
// HUMAN ANCHOR — black silhouette with a fresnel rim (reads as back-lit) + a real point light 2u behind at shoulder height.
// humanAnchor({ act:'I'|'II'|'III', pos, facing (rad; 0 faces +z/camera, Math.PI faces the foreman), brief:true, h }) ->
//   { group, update(lt, { rim: hex (default ice / amber in III), rimK (3), raise 0..1 (hold -> arm raised overhead), brief (card glow 0..1), briefHide }),
//     cardWorld() (world pos of the brief card), sources() }
// =====================================================================================================
export function humanAnchor({ act = 'I', pos, facing = 0, brief = false, h = 1.8, light = true } = {}) {
  const P0 = pos || (act === 'III' ? POS.humanIII : act === 'II' ? POS.humanII : POS.humanI);
  const rimHex = act === 'III' ? C.amber : C.ice;
  const group = new THREE.Group(); group.position.set(...P0);
  const inner = new THREE.Group(); inner.rotation.y = facing; group.add(inner);
  const hm = G.human({ h, pose: 'stand' });
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: withFog({ uRim: { value: hcol(rimHex, ko(3)) }, uPow: { value: 2.2 } }),
    vertexShader: `varying vec3 vN; varying vec3 vV; ${FOG_V} void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vFogDepth = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uRim; uniform float uPow; varying vec3 vN; varying vec3 vV; ${FOG_F}
      void main(){ float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), uPow); vec3 c = vec3(0.003) + uRim * f;
        gl_FragColor = vec4(mix(c, fogColor, fogF()), 1.0); }`,
  });
  hm.traverse((o) => { if (o.isMesh) o.material = mat; });
  inner.add(hm);
  const u = h / 1.8, ud = hm.userData;
  const pivot = new THREE.Group(); pivot.position.set(0.34 * u, 1.42 * u, 0); pivot.rotation.z = 0.12; hm.add(pivot);
  hm.remove(ud.armR); ud.armR.position.set(0, -0.3 * u, 0); ud.armR.rotation.set(0, 0, 0); pivot.add(ud.armR);
  let pl = null;
  if (light) { pl = new THREE.PointLight(rimHex, 2, 12, 1.5); pl.position.set(0, 1.5 * u, -2); group.add(pl); }
  let card = null;
  if (brief) { card = glowMesh(BOX(), C.ivory, 8, { shade: 'flat' }); card.scale.set(0.3 * u, 0.2 * u, 0.02 * u); card.position.set(0, -0.64 * u, 0.06 * u); pivot.add(card); }
  const st = { rim: rimHex, k: 3 };
  const _w = new THREE.Vector3();
  return {
    group, human: hm, light: pl, card, pivot, state: st,
    cardWorld() { if (!card) return null; card.updateWorldMatrix(true, false); return card.getWorldPosition(_w).toArray(); },
    update(lt, { rim = rimHex, rimK = 3, raise = 0, brief: bk = 1, briefHide = false } = {}) {
      st.rim = rim; st.k = rimK;
      mat.uniforms.uRim.value.set(rim).multiplyScalar(ko(rimK));
      if (pl) { pl.color.set(rim); pl.intensity = 2 * rimK / 3; }
      const rr = ease.inOut(clamp(raise));
      pivot.rotation.x = lerp(brief ? -1.05 : 0, -2.85, rr); pivot.rotation.z = lerp(brief ? 0.05 : 0.12, 0.04, rr);
      if (card) { card.visible = !briefHide; card.userData.setGlow(8 * bk); }
    },
    sources() { const p = group.position; return [{ p: [p.x, 1.4, p.z - 2.2], c: st.rim, k: st.k, pool: 2.6, poolK: 1.4, refl: 0.4, size: 0.4 }]; },
  };
}

// =====================================================================================================
// CURSOR BLOCK — the protagonist: block 0.6 x 1.0 x 0.15, clay k10, on the CODE station screen (canvas 6 x 3.4 at (-19.6,2.5,5.2), facing +z,
// ice code bars at 40%, the current line types in to the cursor's left).
// cursorBlock({ screen:true, scale:1, pos }) -> { group, cursor, screen, flare, update(lt, { on 0..1, k (nominal: 10, 3 dimmed, 14 final ON),
//   type 0..1 (current line typed), lines 0..1 (code above revealed), screenK (0.4), flare 0..1 (localized clay flare r 3u), tint (hex) }), sources() }
// Blink: on = W.blink(tGlobal, { bpm, div }) — div 1 quarter notes (human speed), div 2 after OPUS 4.5 SHIPS.
// =====================================================================================================
export function cursorBlock({ screen = true, scale = 1, seed = 7, pos = POS.cursor } = {}) {
  const group = new THREE.Group();
  const cursor = glowMesh(BOX(), C.clay, 10, { shade: 'box', min: 0.26 }); cursor.scale.set(0.6 * scale, 1.0 * scale, 0.15); cursor.position.set(...pos); group.add(cursor);
  const fl = flare({ color: C.clay, k: 0, size: 6 }); fl.position.set(pos[0], pos[1], pos[2] + 0.2); group.add(fl);
  let scr = null;
  const st = { type: 1, lines: 1, screenK: 0.4, on: 1, k: 10 };
  if (screen) {
    const r0 = rand(seed);
    const rows = Array.from({ length: 9 }, () => { const n = 2 + Math.floor(r0() * 4); let x = Math.floor(r0() * 3) * 0.05; return Array.from({ length: n }, () => { const w = 0.04 + r0() * 0.13; const o = [x, w]; x += w + 0.02; return o; }); });
    const cur = Array.from({ length: 7 }, () => 0.025 + r0() * 0.06);
    scr = G.canvasPlane({ w: 6, h: 3.4, px: 512, glow: true, draw: (g, w, h) => {
      g.fillStyle = '#050506'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(91,122,147,0.45)'; g.lineWidth = 2; g.strokeRect(2, 2, w - 4, h - 4);
      const lh = h / 12; const a = st.screenK;
      const nRows = Math.floor(rows.length * st.lines);
      for (let i = 0; i < nRows; i++) { const y = h * 0.5 - lh * (rows.length - i) - lh * 0.1; if (y < lh * 0.6) continue;
        for (const [x, bw] of rows[i]) { g.fillStyle = `rgba(207,227,242,${(a * (0.5 + 0.25 * ((i * 7) % 3))).toFixed(3)})`; g.fillRect(w * (0.08 + x), y - lh * 0.22, w * bw, lh * 0.44); } }
      let x = w * 0.5 - w * 0.06; const nT = Math.floor(cur.length * st.type + 1e-6);
      for (let i = nT - 1; i >= 0; i--) { const bw = w * cur[i]; x -= bw; g.fillStyle = `rgba(207,227,242,${Math.min(1, a * 1.4).toFixed(3)})`; g.fillRect(x, h * 0.5 - lh * 0.22, bw, lh * 0.44); x -= w * 0.012; }
    } });
    scr.position.set(POS.screen[0], POS.screen[1], POS.screen[2]); group.add(scr);
  }
  return {
    group, cursor, screen: scr, flare: fl, state: st, worldPos: pos,
    update(lt, { on = 1, k = 10, type = st.type, lines = st.lines, screenK = st.screenK, flare: f = 0, tint = C.clay } = {}) {
      st.on = on; st.k = k;
      cursor.userData.setGlow(k * on, tint);
      cursor.visible = on > 0.001;
      fl.userData.set(f * 6, tint);
      if (scr && (type !== st.type || lines !== st.lines || screenK !== st.screenK || !st.drawn)) { st.type = type; st.lines = lines; st.screenK = screenK; st.drawn = true; scr.userData.redraw(lt); }
    },
    sources() { return [{ p: pos, c: C.clay, k: st.k * st.on, pool: 1.5, poolK: 1.2, refl: 0.8, size: 0.5 }]; },
  };
}

// =====================================================================================================
// MONTH GATES — 5 brass gates on the approach rail (x = -250,-210,-180,-155,-135; z 0). Posts 1.2x14x1.2 at z=±6, lintel 13.2 at y 14,
// body #4A3626, edges #F3D9B1 k3, 5 lintel pips (both faces, x ± 0.7), counters 'MONTH 1' / 'MONTH 5' (facing -x) on gates 1 and 5.
// monthGates({ counters:true }) -> { group, gates, rail, update(lt, { pips: [5] lit counts (default [1,2,3,4,5]), k (edge, 3), counterK (raw 1.2) }) }
// gate({ x, y, z, counter }) -> single gate { group, update(lt, { lit: pips 0..5, k, pipK, counterK, body }) } (e.g. hung above the station in b-month-one).
// =====================================================================================================
export function gate({ x = 0, y = 0, z = 0, counter = null } = {}) {
  const group = new THREE.Group(); group.position.set(x, y, z);
  const mat = edgeStd({ color: C.brassDark, metal: 0.9, rough: 0.35, edge: C.brassHi, edgeK: kl(3), edgeW: 2.0 });
  const post = (pz) => { const m = new THREE.Mesh(BOX(), mat); m.scale.set(1.2, 14, 1.2); m.position.set(0, 7, pz); group.add(m); };
  post(-6); post(6);
  const lintel = new THREE.Mesh(BOX(), mat); lintel.scale.set(1.2, 1.2, 13.2); lintel.position.set(0, 14, 0); group.add(lintel);
  const outline = glowSegs([...boxEdgePairs([0, 7, -6], [1.2, 14, 1.2]), ...boxEdgePairs([0, 7, 6], [1.2, 14, 1.2]), ...boxEdgePairs([0, 14, 0], [1.2, 1.2, 13.2])], { color: C.brassHi, k: 3, width: 1.6 });
  group.add(outline);
  const pips = orbs({ count: 10, r: 0.35, seg: 10 }); group.add(pips.mesh);
  const zs = [-4, -2, 0, 2, 4];
  let ctr = null;
  if (counter) { ctr = text3D(counter, { height: 2.2, color: C.ivory, k: 1.2, font: '800 160px "Inter Tight"' }); ctr.rotation.y = -Math.PI / 2; ctr.position.set(0, 7, 0); group.add(ctr); }
  const api = {
    group, mat, pips, counter: ctr, outline,
    update(lt, { lit = 0, k = 3, pipK = 8, counterK = 0.9, body = 0 } = {}) {
      mat.setEdge(C.brassHi, kl(k) * 0.25); mat.setBody(C.brass, ko(body)); outline.userData.set(k * 0.55);
      for (let i = 0; i < 5; i++) for (let s = 0; s < 2; s++) pips.set(i * 2 + s, { p: [s ? 0.7 : -0.7, 14, zs[i]], c: lin(C.brassHi), k: i < lit ? pipK : 0.15 });
      pips.commit();
      if (ctr) ctr.userData.set(counterK);
    },
  };
  api.update(0);
  return api;
}
export function monthGates({ counters = true } = {}) {
  const group = new THREE.Group();
  const gates = GATE_X.map((x, i) => { const g = gate({ x, counter: counters && (i === 0 || i === 4) ? `MONTH ${i + 1}` : null }); group.add(g.group); return g; });
  const rail = fat([[-300, 0.05, 0], [-70, 0.05, 0]], { color: C.brassMid, k: 1.5, width: 2 }); group.add(rail);
  return {
    group, gates, rail,
    update(lt, { pips = [1, 2, 3, 4, 5], k = 3, counterK = 0.9 } = {}) { gates.forEach((g, i) => g.update(lt, { lit: pips[i], k, counterK })); },
  };
}

// =====================================================================================================
// LEDGER ROW — the diegetic BUDGET object (no text): brass bar 40 x 1.2 x 3 at (-19.6, 36, 14), 12 cells (ivory hairlines), cell 7 fills
// clay k10 on the stamp, edge seams flare (k3 -> 10), dust burst (1,500 ivory particles, radial 6u over 0.8 s with drag).
// ledgerRow() -> { group, cellPos(i), update(lt, { fill 0..1, seam (nominal edge k, 3), burst: seconds since stamp (<0 none) }) }
// =====================================================================================================
export function ledgerRow({ seed = 71 } = {}) {
  const group = new THREE.Group(); const [X, Y, Z] = POS.ledger;
  const mat = edgeStd({ color: C.brassDark, metal: 0.9, rough: 0.35, edge: C.brassHi, edgeK: kl(3), edgeW: 1.6 });
  const bar = new THREE.Mesh(BOX(), mat); bar.scale.set(40, 1.2, 3); bar.position.set(X, Y, Z); group.add(bar);
  const outline = glowSegs(boxEdgePairs([X, Y, Z], [40, 1.2, 3]), { color: C.brassHi, k: 3, width: 1.6 }); group.add(outline);
  const hair = boxes({ count: 11, size: [0.2, 1.24, 3.04], color: C.ivory, metal: 0, rough: 1, edgeW: 1 });
  for (let i = 0; i < 11; i++) hair.set(i, { p: [X - 20 + (i + 1) * (40 / 12), Y, Z], edge: lin(C.ivory, kl(1.5)), body: lin(C.ivory, ko(1.5)) });
  hair.commit(); group.add(hair.mesh);
  const cellX = (i) => X - 20 + (i + 0.5) * (40 / 12);
  const fillM = glowMesh(BOX(), C.clay, 0, { shade: 'box' }); fillM.scale.set(40 / 12 - 0.3, 1.0, 3.1); fillM.position.set(cellX(6), Y, Z); group.add(fillM);
  const r = rand(seed); const N = 1500;
  const dir = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = r() * Math.PI * 2, b = (r() - 0.5) * Math.PI; const s = 0.4 + r() * 0.6; dir[i * 3] = Math.cos(a) * Math.cos(b) * s; dir[i * 3 + 1] = Math.sin(b) * s; dir[i * 3 + 2] = Math.sin(a) * Math.cos(b) * s; }
  const P = G.particles({ count: N, spread: [0, 0, 0], center: [cellX(6), Y, Z], color: C.ivory, size: 0.1, seed });
  group.add(P.points); P.points.frustumCulled = false;
  return {
    group, cellPos: (i) => [cellX(i), Y, Z], bar, mat,
    update(lt, { fill = 0, seam = 3, burst = -1 } = {}) {
      mat.setEdge(C.brassHi, kl(seam) * 0.25); outline.userData.set(seam * 0.55);
      fillM.userData.setGlow(10 * clamp(fill)); fillM.visible = fill > 0.001;
      P.points.visible = burst >= 0 && burst < 1.6;
      if (P.points.visible) {
        const dist = 6 * (1 - Math.exp(-burst * 4));
        for (let i = 0; i < N; i++) { P.positions[i * 3] = cellX(6) + dir[i * 3] * dist; P.positions[i * 3 + 1] = Y + dir[i * 3 + 1] * dist - burst * burst * 0.3; P.positions[i * 3 + 2] = Z + dir[i * 3 + 2] * dist; }
        P.geometry.attributes.position.needsUpdate = true;
        P.material.color.set(C.ivory).multiplyScalar(ko(4) * Math.max(0, 1 - burst / 1.6));
      }
    },
  };
}

// =====================================================================================================
// RAIL NETWORK — 1,000 instanced amber rails (L 6-24u, 0.08 x 0.25) on a 4u grid over x -200..200, z -160..60 (70% along x, 30% along z),
// circuit-board traces converging on the line. Radial cascade from CODE (-19.6,0,0) at 160 u/s; rewind = the same cascade backwards
// (edges first). Lamp posts along z = 41.5 every 10u (tips light with the cascade).
// railNetwork({ posts:true }) -> { group, maxT, update(lt, { cascade: seconds since start (<0 all off; 99 all on), rewind: seconds since rewind
//   started (<0 none), k (nominal lit k, 6), flow (dash speed u/s, 0 = steady; flows +x on x-rails and toward the line on z-rails), t, dim }) }
// =====================================================================================================
export function railNetwork({ count = 1000, seed = 81, posts = true, speed = 160 } = {}) {
  const group = new THREE.Group();
  const r = rand(seed);
  const origin = [-19.6, 0, 0];
  const aT = new Float32Array(count), aDir = new Float32Array(count), aSeed = new Float32Array(count);
  const geoR = BOX().clone();
  let maxT = 0;
  const segs = [];
  while (segs.length < count) {
    let x = Math.round((r() * 400 - 200) / 4) * 4, z = Math.round((r() * 220 - 160) / 4) * 4;
    const legs = 3 + Math.floor(r() * 4);
    for (let l = 0; l < legs && segs.length < count; l++) {
      const alongX = r() < 0.7;
      const L = 6 + Math.floor(r() * 5) * 4.5;
      if (alongX) { const dir = r() < 0.65 ? 1 : -1; segs.push({ x: x + dir * L / 2, z, L, alongX }); x += dir * L; }
      else { const dir = z > 0 ? -1 : 1; if (Math.abs(z) < 6) continue; segs.push({ x, z: z + dir * L / 2, L, alongX }); z += dir * L; }
    }
  }
  const m4 = new THREE.Matrix4();
  const mesh = new THREE.InstancedMesh(geoR, null, count);
  segs.forEach((s, i) => {
    const cx = clamp(s.x, -200, 200), cz = clamp(s.z, -160, 60);
    m4.makeScale(s.alongX ? s.L : 0.25, 0.08, s.alongX ? 0.25 : s.L).setPosition(cx, 0.04, cz);
    mesh.setMatrixAt(i, m4);
    const d = Math.hypot(cx - origin[0], cz - origin[2]); aT[i] = d / speed; maxT = Math.max(maxT, aT[i]);
    aDir[i] = s.alongX ? 0 : 1; aSeed[i] = r();
  });
  geoR.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 1));
  geoR.setAttribute('aDir', new THREE.InstancedBufferAttribute(aDir, 1));
  geoR.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  const uni = withFog({ uT: { value: -1 }, uRew: { value: -1 }, uMax: { value: maxT }, uK: { value: ko(6) }, uDim: { value: 0.03 }, uCol: { value: new THREE.Color(C.amberRail) }, uTime: { value: 0 }, uFlow: { value: 0 } });
  const mat = new THREE.ShaderMaterial({
    fog: true, uniforms: uni,
    vertexShader: `attribute float aT; attribute float aDir; attribute float aSeed; uniform float uT; uniform float uRew; uniform float uMax; uniform float uK; uniform float uDim;
      varying float vK; varying vec3 vW; varying float vDir; varying float vSeed; ${FOG_V}
      void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz; vDir = aDir; vSeed = aSeed;
        float on = uT < 0.0 ? 0.0 : clamp((uT - aT) / 0.0667, 0.0, 1.0);
        if (uRew >= 0.0) on *= 1.0 - clamp((uRew - (uMax - aT)) / 0.0667, 0.0, 1.0);
        vec4 mv = viewMatrix * w; vFogDepth = -mv.z;
        vK = mix(uDim, uK, on) * clamp(vFogDepth / 45.0, 0.25, 1.0);   // near rails read as bars: keep them from flaring
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uTime; uniform float uFlow; varying float vK; varying vec3 vW; varying float vDir; varying float vSeed; ${FOG_F}
      void main(){ float coord = vDir < 0.5 ? vW.x : -abs(vW.z);
        float dash = uFlow > 0.0 ? 0.45 + 0.55 * smoothstep(0.6, 0.95, fract((coord - uTime * uFlow) / 7.0 + vSeed)) : 1.0;
        gl_FragColor = vec4(mix(uCol * vK * dash, fogColor, fogF()), 1.0); }`,
  });
  mesh.material = mat; mesh.frustumCulled = false; group.add(mesh);
  let tipsI = null; const postT = [];
  if (posts) {
    const n = 41;
    const postsI = boxes({ count: n, size: [0.3, 4, 0.3], color: 0x0c0c0d, metal: 0.4, rough: 0.5, edgeW: 1.0 });
    tipsI = orbs({ count: n, r: 0.22, seg: 6 });
    for (let i = 0; i < n; i++) { const x = -200 + i * 10; postsI.set(i, { p: [x, 2, 41.5], edge: lin(C.amberRail, kl(0.25)), body: [0, 0, 0] }); postT.push(Math.hypot(x - origin[0], 41.5) / speed); }
    postsI.commit(); group.add(postsI.mesh, tipsI.mesh);
  }
  return {
    group, mesh, maxT, segs,
    update(lt, { cascade = 99, rewind = -1, k = 6, flow = 0, t = lt, dim = 0.03 } = {}) {
      uni.uT.value = cascade; uni.uRew.value = rewind; uni.uK.value = ko(k); uni.uTime.value = t; uni.uFlow.value = flow; uni.uDim.value = dim;
      if (tipsI) {
        for (let i = 0; i < postT.length; i++) {
          let on = cascade < 0 ? 0 : clamp((cascade - postT[i]) / 0.0667);
          if (rewind >= 0) on *= 1 - clamp((rewind - (maxT - postT[i])) / 0.0667);
          tipsI.set(i, { p: [-200 + i * 10, 4.05, 41.5], c: lin(C.amberRail), k: 6 * on + 0.05 });
        }
        tipsI.commit();
      }
    },
  };
}

// =====================================================================================================
// COLD RAIL (camColdRail set piece): brass rail along z=20 (y 0.08) with dark sleepers + a clay orb (r0.5 k12) riding it at 30 u/s from
// x -60 + 300 amber wake motes. coldRail() -> { group, orb, update(lt, { k (12), x (override orb x) }) }
// =====================================================================================================
export function coldRail({ seed = 91 } = {}) {
  const group = new THREE.Group();
  const rail = fat([[-200, 0.08, 20], [200, 0.08, 20]], { color: C.brassMid, k: 1.5, width: 3 }); group.add(rail);
  const sleeper = boxes({ count: 120, size: [0.12, 0.05, 1.2], color: 0x0d0c0b, metal: 0.6, rough: 0.4, edgeW: 1 });
  for (let i = 0; i < 120; i++) sleeper.set(i, { p: [-120 + i * 2, 0.025, 20], edge: lin(C.brassMid, kl(0.35)), body: [0, 0, 0] });
  sleeper.commit(); group.add(sleeper.mesh);
  const orb = glowMesh(SPHERE(16), C.clay, 12, { radius: 1 }); orb.scale.setScalar(0.5); group.add(orb);
  const fl = flare({ color: C.clay, k: 3, size: 5 }); group.add(fl);
  const r = rand(seed); const N = 300; const P = G.particles({ count: N, spread: [0, 0, 0], color: C.amberRail, size: 0.06, seed });
  const off = Float32Array.from({ length: N * 4 }, () => r()); group.add(P.points); P.points.frustumCulled = false;
  return {
    group, orb,
    update(lt, { k = 12, x = null } = {}) {
      const ox = x ?? -60 + 30 * lt; orb.position.set(ox, 0.58, 20); fl.position.set(ox, 0.58, 20.1);
      orb.userData.setGlow(k); fl.userData.set(k * 0.25);
      for (let i = 0; i < N; i++) { const age = off[i * 4] * 1.2; const px = ox - age * 30 * (0.4 + off[i * 4 + 1] * 0.6);
        P.positions[i * 3] = px; P.positions[i * 3 + 1] = 0.15 + off[i * 4 + 2] * 0.9 * age; P.positions[i * 3 + 2] = 20 + (off[i * 4 + 3] - 0.5) * 1.2 * age; }
      P.geometry.attributes.position.needsUpdate = true; P.material.color.set(C.amberRail).multiplyScalar(ko(4));
    },
  };
}

// =====================================================================================================
// AGENTS / SWARMS — agents({ count <= 1000, r, seg }) -> orbs API (k nominal: AGENT.claude clay 10 / swarm ice 4 / neutral ivory 6 / error red 12)
// swarmHaze({ count (crowds > 2,000), spread, center, color, k (nominal), size }) -> G.particles API (positions you animate yourself)
// =====================================================================================================
export const AGENT = { claude: [C.clay, 10], swarm: [C.ice, 4], neutral: [C.ivory, 6], error: [C.red, 12] };
export function agents({ count = 100, r = 0.35, seg = 10 } = {}) { return orbs({ count, r, seg }); }
export function swarmHaze({ count = 8000, spread = [140, 6, 40], center = [0, 3, 0], color = C.ice, size = 0.3, seed = 101, k = 2 } = {}) {
  const P = G.particles({ count, spread, center, color, size, seed });
  P.material.color.set(color).multiplyScalar(ko(k));
  return P;
}

// =====================================================================================================
// ERROR MAP — camErrorTop master/mirror: the SAME 300 seeded orbs (field ~62 x 30u centred on (1.4, 3, 0)), a red spark, 17 red tendrils
// (fat lines #FF453A k6, 2px, walking orb to orb outward). The coordinator variant shows a neutral ivory hub (r1.2 k8) + 24 ivory filaments
// and retracts the tendrils to exactly 4, which keep pulsing red.
// errorMap({ seed }) -> { group, positions, tendrils, update(lt, { grow 0..1, keep (tendrils kept: 17 or 4), retract 0..1 (extras shrink),
//   coord 0..1, spark 0..1 (spark along tendril 0, <0 hidden), t, orbColor (ice), orbK (nominal 4), tendrilK (6) }) }
// =====================================================================================================
export function errorMap({ seed = 172, count = 300, center = [1.4, 3, 0] } = {}) {
  const group = new THREE.Group();
  const r = rand(seed);
  const pos = [];
  while (pos.length < count) { const x = center[0] + (r() - 0.5) * 62, z = center[2] + (r() - 0.5) * 30; if (pos.every((p) => (p[0] - x) ** 2 + (p[2] - z) ** 2 > 2.2)) pos.push([x, center[1] + (r() - 0.5) * 0.6, z]); }
  const O = orbs({ count, r: 0.35, seg: 8 }); group.add(O.mesh);
  let o0 = 0; pos.forEach((p, i) => { if ((p[0] - center[0]) ** 2 + (p[2] - center[2]) ** 2 < (pos[o0][0] - center[0]) ** 2 + (pos[o0][2] - center[2]) ** 2) o0 = i; });
  const used = new Set([o0]);
  const tendrils = [];
  for (let k = 0; k < 17; k++) {
    const ang = (k / 17) * Math.PI * 2 + (r() - 0.5) * 0.2; const dx = Math.cos(ang), dz = Math.sin(ang) * 0.6;
    const path = [o0]; let cur = o0;
    for (let s = 0; s < 9; s++) {
      let best = -1, bs = -1e9;
      pos.forEach((p, i) => { if (used.has(i)) return; const vx = p[0] - pos[cur][0], vz = p[2] - pos[cur][2]; const d = Math.hypot(vx, vz); if (d < 1.2 || d > 6.5) return;
        const sc = (vx * dx + vz * dz) / d - d * 0.06 + (r() - 0.5) * 0.25; if (sc > bs) { bs = sc; best = i; } });
      if (best < 0) break; path.push(best); used.add(best); cur = best;
    }
    tendrils.push(path);
  }
  const lines = tendrils.map((path) => { const pts = path.map((i) => [pos[i][0], pos[i][1] + 0.05, pos[i][2]]); if (pts.length < 2) pts.push(pts[0]); return fat(pts, { color: C.red, k: 6, width: 2 }); });
  lines.forEach((l) => group.add(l));
  const hub = glowMesh(SPHERE(16), C.ivory, 8, { radius: 1 }); hub.scale.setScalar(1.2); hub.position.set(center[0], center[1] + 0.8, center[2]); group.add(hub);
  const hubRing = G.ring({ r: 2.2, tube: 0.08, color: C.ivory, k: kl(3) }); hubRing.rotation.x = Math.PI / 2; hubRing.position.copy(hub.position); group.add(hubRing);
  const spokes = [];
  for (let k = 0; k < 24; k++) { const ang = (k / 24) * Math.PI * 2; let best = 0, bs = 1e9; pos.forEach((p, i) => { const tx = center[0] + Math.cos(ang) * 14, tz = center[2] + Math.sin(ang) * 9; const d = (p[0] - tx) ** 2 + (p[2] - tz) ** 2; if (d < bs) { bs = d; best = i; } });
    const l = fat([[center[0], center[1] + 0.8, center[2]], [pos[best][0], pos[best][1] + 0.05, pos[best][2]]], { color: C.ivory, k: 1.6, width: 1.5 }); group.add(l); spokes.push(l); }
  const spark = glowMesh(SPHERE(10), C.red, 12, { radius: 1 }); spark.scale.setScalar(0.55); group.add(spark);
  const sparkFl = flare({ color: C.red, k: 0, size: 4 }); group.add(sparkFl);
  return {
    group, positions: pos, tendrils, lines, hub, origin: o0,
    update(lt, { grow = 1, keep = 17, retract = 0, coord = 0, spark: sp = -1, t = lt, orbColor = C.ice, orbK = 4, tendrilK = 6 } = {}) {
      const oc = lin(orbColor), rc = lin(C.red);
      const hot = new Set(); tendrils.forEach((path, k) => { const g = k < keep ? grow : grow * (1 - clamp(retract)); const n = Math.floor(path.length * g); for (let i = 0; i < n; i++) hot.add(path[i]); });
      pos.forEach((p, i) => { const h = hot.has(i); O.set(i, { p, c: h ? rc : oc, k: (h ? 6 : orbK) * 0.38 }); });
      O.commit();
      const pulse = 0.75 + 0.25 * Math.sin(t * Math.PI * 8);
      lines.forEach((l, k) => { const g = k < keep ? grow : grow * (1 - clamp(retract)); l.userData.reveal(g); l.userData.set(tendrilK * (k < keep ? pulse : 1)); });
      hub.visible = coord > 0.001; hubRing.visible = hub.visible; hub.scale.setScalar(1.2 * clamp(coord * 1.5));
      spokes.forEach((l, k) => l.userData.reveal(clamp(coord * 1.6 - k / 40)));
      if (sp >= 0) { const path = tendrils[0]; const f = sp * (path.length - 1); const i = Math.min(path.length - 2, Math.floor(f)); const u = f - i;
        const a = pos[path[Math.max(0, i)]], b = pos[path[Math.min(path.length - 1, i + 1)]]; spark.position.set(lerp(a[0], b[0], u), a[1] + 0.6, lerp(a[2], b[2], u)); sparkFl.position.copy(spark.position); spark.visible = true; sparkFl.userData.set(4); }
      else { spark.visible = false; sparkFl.userData.set(0); }
    },
  };
}

// =====================================================================================================
// GRAPH — neutral architecture: 1 ivory hub + 12 workers (orb r1, ivory k6, brass ring housings + plinths) wired by 13 brass filaments
// (an inlet from the left + 12 spokes); a light pulse hops edge by edge (4 frames per hop) and nodes bloom on arrival.
// graphDiagram({ center:[0,2,0], radius:14 }) -> { group, nodes, update(lt, { t: seconds since the pulses start (<0 none), hop (4/30), k (node k, default 3; arrivals flare +8) }) }
// =====================================================================================================
export function graphDiagram({ center = [0, 2, 0], radius = 14 } = {}) {
  const group = new THREE.Group();
  const [cx, cy, cz] = center;
  const nodesP = [[cx, cy, cz]]; for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2 - Math.PI / 2; nodesP.push([cx + Math.cos(a) * radius, cy, cz + Math.sin(a) * radius * 0.8]); }
  const inlet = [cx - radius * 2.2, cy, cz];
  const N = orbs({ count: 13, r: 1, seg: 16 }); group.add(N.mesh);
  const plMat = edgeStd({ color: C.brassDark, metal: 0.9, rough: 0.35, edge: C.brass, edgeK: kl(1.5) });
  const housings = nodesP.map((p, i) => { const g = new THREE.Group(); g.position.set(...p);
    const r1 = G.ring({ r: i ? 1.7 : 2.4, tube: 0.06, color: C.brass, k: kl(2) }); r1.rotation.x = Math.PI / 2; g.add(r1);
    const r2 = G.ring({ r: i ? 2.1 : 3.0, tube: 0.03, color: C.brass, k: kl(1), arc: Math.PI * 1.5 }); r2.rotation.x = Math.PI / 2; g.add(r2);
    const plinth = new THREE.Mesh(BOX(), plMat); plinth.scale.set(i ? 2.6 : 3.6, 0.4, i ? 2.6 : 3.6); plinth.position.y = -1.3; g.add(plinth);
    group.add(g); return g; });
  const edges = [fat([inlet, nodesP[0]], { color: C.brass, k: 2, width: 2 })];
  for (let j = 1; j <= 12; j++) edges.push(fat([nodesP[0], nodesP[j]], { color: C.brass, k: 2, width: 2 }));
  edges.forEach((e) => group.add(e));
  const pulse = glowMesh(SPHERE(8), C.ivory, 14, { radius: 1 }); pulse.scale.setScalar(0.45); group.add(pulse);
  const pfl = flare({ color: C.ivory, k: 3, size: 4 }); group.add(pfl);
  return {
    group, nodes: nodesP, inlet, edges, housings,
    update(lt, { t = lt, hop = 4 / 30, k = 3 } = {}) {
      const step = t / hop; const e = Math.floor(step), u = step - e;
      nodesP.forEach((p, i) => { const since = i === 0 ? step - 1 : step - (i + 1);
        N.set(i, { p, c: lin(C.ivory), k: since >= 0 ? k + 8 * Math.exp(-since * 0.9) : k * 0.7 }); });
      N.commit();
      edges.forEach((ed, i) => ed.userData.set(i <= e && t >= 0 ? 2.5 : 1.2));
      if (t >= 0 && e < 13) { const a = e === 0 ? inlet : nodesP[0], b = e === 0 ? nodesP[0] : nodesP[e]; pulse.visible = true; pulse.position.set(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)); pfl.position.copy(pulse.position); pfl.userData.set(3, C.ivory); }
      else { pulse.visible = false; pfl.userData.set(0); }
    },
  };
}

// =====================================================================================================
// HIERARCHY — stepped diagram echoing the foreman: 16 workers -> 4 leads -> 1 apex on brass-seamed obsidian plinths (44/26/10u wide, 4u tiers),
// links apex->leads->workers, beams from the apex onto the tiers, one card per node squaring into alignment.
// hierarchy({ center:[0,0,0], scale }) -> { group, nodes, update(lt, { align 0..1 | [3] (tier 0 workers, 1 leads, 2 apex), beams 0..1, k (node k, default 3), links 0..1 }) }
// =====================================================================================================
export function hierarchy({ center = [0, 0, 0], scale = 1, seed = 111 } = {}) {
  const group = new THREE.Group(); group.position.set(...center); group.scale.setScalar(scale);
  const plMat = edgeStd({ color: 0x0e0e0f, metal: 0.4, rough: 0.5, edge: C.brass, edgeK: kl(2.5), edgeW: 1.5 });
  const tiers = [{ w: 44, d: 16, y: 0, h: 4, n: 16 }, { w: 26, d: 11, y: 4, h: 4, n: 4 }, { w: 10, d: 7, y: 8, h: 4, n: 1 }];
  tiers.forEach((T) => { const m = new THREE.Mesh(BOX(), plMat); m.scale.set(T.w, T.h, T.d); m.position.set(0, T.y + T.h / 2, 0); group.add(m); });
  const nodePos = [];
  tiers.forEach((T, ti) => { for (let i = 0; i < T.n; i++) { const x = T.n === 1 ? 0 : ti === 0 ? -19.5 + i * 2.6 : -9 + i * 6; nodePos.push([x, T.y + T.h + (ti === 2 ? 2.2 : 1.1), ti === 0 ? -3 : -1.5]); } });
  const N = orbs({ count: 21, r: 0.6, seg: 12 }); group.add(N.mesh);
  const apexR = G.ring({ r: 2.2, tube: 0.08, color: C.ivory, k: kl(3) }); apexR.rotation.x = Math.PI / 2; apexR.position.set(...nodePos[20]); group.add(apexR);
  const Cd = cards({ count: 21, size: [1.6, 0.25, 1.1] }); group.add(Cd.mesh);
  const r = rand(seed); const jit = Array.from({ length: 21 }, () => [(r() - 0.5) * 0.9, (r() - 0.5) * 0.5, (r() - 0.5) * 0.9]);
  const links = [];
  for (let l = 0; l < 4; l++) links.push(fat([nodePos[20], nodePos[16 + l]], { color: C.ivory, k: 1.5, width: 1.5 }));
  for (let w = 0; w < 16; w++) links.push(fat([nodePos[16 + Math.floor(w / 4)], nodePos[w]], { color: C.brass, k: 1.2, width: 1.2 }));
  links.forEach((l) => group.add(l));
  const shafts = [shaft({ rTop: 0.5, rBot: 13, h: 12, color: C.amber, k: 1, opacity: 0, apexFade: 0.3 }), shaft({ rTop: 0.5, rBot: 7, h: 8, color: C.amber, k: 1, opacity: 0, apexFade: 0.3 })];
  aimShaft(shafts[0], [0, 14, -1.5], [0, 4.1, -1]); aimShaft(shafts[1], [0, 14, -1.5], [0, 8.1, -1]);
  shafts.forEach((s) => group.add(s));
  return {
    group, nodes: nodePos,
    update(lt, { align = 1, beams = 1, k = 3, links: lk = 1 } = {}) {
      nodePos.forEach((p, i) => N.set(i, { p, c: lin(C.ivory), k: i === 20 ? k * 1.4 : i >= 16 ? k : k * 0.8 }));
      N.commit();
      nodePos.forEach((p, i) => { const ti = i < 16 ? 0 : i < 20 ? 1 : 2; const a = Array.isArray(align) ? align[ti] : align; const j = jit[i];
        Cd.set(i, { p: [p[0] + j[0] * (1 - a), p[1] - (ti === 2 ? 1.6 : 0.85), p[2] + 1.6 + j[2] * (1 - a)], r: [0, j[1] * (1 - a), 0], edge: mixA(CARD.edge(), CARD.amberEdge(2), a), body: mixA(CARD.body(), CARD.amberBody(2), a) }); });
      Cd.commit();
      shafts.forEach((s) => s.userData.set(1, 0.25 * beams));
      links.forEach((l) => l.userData.reveal(lk));
    },
  };
}

// =====================================================================================================
// SWARM READ — 300 small ivory orbs fan out to read 24 document planes in parallel (read-beams = ONE LineSegments, ivory 30%), then converge
// on ONE writer orb that draws the single write line to the card (card edge turns green when write = 1).
// swarmRead({ center:[20,2,0] }) -> { group, update(lt, { fan 0..1, converge 0..1, write 0..1, t }) }   (~20u wide: frame with 200mm @ 120u)
// =====================================================================================================
export function swarmRead({ center = [20, 2, 0], seed = 121 } = {}) {
  const group = new THREE.Group(); group.position.set(...center);
  const r = rand(seed);
  const texs = [0, 1, 2, 3].map((s) => G.canvasPlane({ w: 1.6, h: 2.1, px: 192, glow: false, draw: (g, w, h) => G.drawCode(g, w, h, { seed: 40 + s, lines: 14, bg: 'rgba(20,20,22,0.95)', palette: ['#faf9f5', '#cfe3f2', '#8d8a83', '#e8b47a'], cursor: false }) }).material.map);
  const docMats = texs.map((tx) => new THREE.MeshBasicMaterial({ map: tx, color: hcol(0xffffff, 0.8), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  const docs = [];
  for (let i = 0; i < 24; i++) { const a = -0.9 + (i % 12) / 11 * 1.8; const row = Math.floor(i / 12);
    const m = new THREE.Mesh(geo('doc', () => new THREE.PlaneGeometry(1.6, 2.1)), docMats[i % 4]); m.position.set(Math.sin(a) * 9, 2.2 + row * 2.6, -Math.cos(a) * 6 - 2); m.lookAt(0, 2.2 + row * 2.6, 4); group.add(m); docs.push(m); }
  const N = 300; const O = orbs({ count: N, r: 0.12, seg: 6 }); group.add(O.mesh);
  const home = [], tgt = [];
  for (let i = 0; i < N; i++) { home.push([(r() - 0.5) * 3, 0.8 + r() * 1.5, 3 + (r() - 0.5) * 2]); const d = docs[i % 24].position; tgt.push([d.x * 0.82 + (r() - 0.5) * 0.9, d.y + (r() - 0.5) * 1.4, d.z * 0.82 + 0.6 + (r() - 0.5) * 0.4]); }
  const writer = [0, 1.6, 4.2];
  const segGeo = new THREE.BufferGeometry(); const sp = new Float32Array(N * 6); segGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const seg = new THREE.LineSegments(segGeo, new THREE.LineBasicMaterial({ color: hcol(C.ivory, 0.5), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })); seg.frustumCulled = false; group.add(seg);
  const W1 = glowMesh(SPHERE(14), C.ivory, 8, { radius: 1 }); W1.scale.setScalar(0.4); W1.position.set(...writer); group.add(W1);
  const cardMat = edgeStd({ color: C.card, metal: 0.1, rough: 0.5, edge: C.ice, edgeK: kl(2.5), body: C.card, bodyK: 0.12 });
  const card = new THREE.Mesh(BOX(), cardMat); card.scale.set(3, 0.5, 2); card.position.set(0, 0.25, 7.5); group.add(card);
  const wl = fat([writer, [0, 0.55, 7.5]], { color: C.ivory, k: 6, width: 2.5 }); group.add(wl);
  return {
    group, docs, writer, card,
    update(lt, { fan = 1, converge = 0, write = 0, t = lt } = {}) {
      const f = ease.out(clamp(fan)), cv = ease.inOut(clamp(converge));
      const ic = lin(C.ivory);
      for (let i = 0; i < N; i++) { const h = home[i], g = tgt[i]; const wob = Math.sin(t * 3 + i) * 0.08 * (1 - cv);
        let x = lerp(h[0], g[0], f), y = lerp(h[1], g[1], f) + wob, z = lerp(h[2], g[2], f);
        x = lerp(x, writer[0] + (i % 10 - 4.5) * 0.02, cv); y = lerp(y, writer[1], cv); z = lerp(z, writer[2] - 0.3, cv);
        O.set(i, { p: [x, y, z], c: ic, k: 1.6 });
        const vis = f * (1 - cv);
        sp[i * 6] = x; sp[i * 6 + 1] = y; sp[i * 6 + 2] = z;
        const d = docs[i % 24].position; sp[i * 6 + 3] = lerp(x, d.x, vis); sp[i * 6 + 4] = lerp(y, d.y, vis); sp[i * 6 + 5] = lerp(z, d.z, vis);
      }
      O.commit(); segGeo.attributes.position.needsUpdate = true;
      W1.userData.setGlow(8 * clamp(converge * 2)); W1.visible = converge > 0.02;
      wl.userData.reveal(write); wl.visible = write > 0.001;
      cardMat.setEdge(write >= 1 ? C.green : C.ice, kl(write >= 1 ? 4 : 2.5));
    },
  };
}

// =====================================================================================================
// TITLE FORGE (optional 3D layer for t-title): a clay -> ivory HDR light line (k12) growing from centre to 70% width with an anamorphic
// streak, splitting vertically to reveal the 2D title, + 600 rising embers. Pair with camTitle(camera).
// titleForge() -> { group, update(lt, { grow 0..1, split (gap in u; the 16u-wide frame = 1920 px, so 1u = 120 px), k (nominal 12), warm 0..1 (clay -> ivory), embers 0..1, t }) }
// =====================================================================================================
export function titleForge({ seed = 131 } = {}) {
  const group = new THREE.Group();
  const top = fat([[-0.5, 0, 0], [0.5, 0, 0]], { color: C.ivory, k: 4, width: 2, fog: false }), bot = fat([[-0.5, 0, 0], [0.5, 0, 0]], { color: C.ivory, k: 4, width: 2, fog: false });
  group.add(top, bot);
  const streak = new THREE.Mesh(geo('streak', () => new THREE.PlaneGeometry(1, 1)), new THREE.MeshBasicMaterial({ map: flareTexture(), color: hcol(C.clay, 1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  group.add(streak);
  const P = G.particles({ count: 600, spread: [18, 10, 4], center: [0, -1, -1], color: C.clay, size: 0.05, seed });
  P.material.fog = false;
  const base = P.positions.slice(); group.add(P.points);
  return {
    group,
    update(lt, { grow = 1, split = 0, k = 12, embers = 1, t = lt, warm = 0.5 } = {}) {
      const w = 11.2 * clamp(grow); const col = mixA(lin(C.clay, kl(k) * 0.16), lin(C.ivory, kl(k) * 0.16), warm);
      [top, bot].forEach((m, i) => { m.scale.set(Math.max(0.001, w), 1, 1); m.position.set(0, (i ? -1 : 1) * split / 2, 0); m.material.color.setRGB(col[0], col[1], col[2]); m.visible = grow > 0.001; });
      streak.scale.set(Math.max(0.001, w * 1.9), 0.35, 1); streak.material.color.set(C.clay).multiplyScalar(ko(3) * clamp(grow) * (1 - clamp(split / 4) * 0.6)); streak.visible = grow > 0.001;
      for (let i = 0; i < 600; i++) { P.positions[i * 3 + 1] = ((base[i * 3 + 1] + 6 + t * 0.4) % 10) - 5; P.positions[i * 3] = base[i * 3] + Math.sin(t * 0.5 + i) * 0.2; }
      P.geometry.attributes.position.needsUpdate = true; P.material.color.set(C.clay).multiplyScalar(ko(5) * embers); P.points.visible = embers > 0.001;
    },
  };
}
/** camera for titleForge: 16u-wide frame at z=0 (1u = 120 px at 1080p), centre (0,0). */
export function camTitle(camera, lt = 0, { push = 0.02, dur = 4.8 } = {}) { const d = 30 * (1 - push * clamp(lt / dur)); const fov = 2 * Math.atan(4.5 / 30) * 180 / Math.PI; camLook(camera, [0, 0, d], [0, 0, 0], fov); return fov; }

// =====================================================================================================
// HALL — the one set. hall(scene, { state:'cold'|'dark'|'alarm'|'lit', parts }) builds sky, floor, pillars, the line, the light banks
// and the foreman with consistent defaults for that state. parts default { floor, pillars, atmosphere, line, banks, foreman: true;
//   cursor, tower, rails, gates, ledger, threads: false; towers: null ({review, test, deploy} max cards); human: null ('I'|'II'|'III') }.
// Returns H = { group, floor, pillars, sky, line, banks, foreman, cursor, tower, towers, rails, gates, ledger, threads, human, extra: [], update(lt, p) }
// H.update(lt, { lit 0..1 (pillar edges ice -> brass, sky haze cold -> warm), alarm 0..1, pillarK, sky (haze gain, 1) }) — CALL IT LAST every frame: it collects
// floor light pools / reflections from every part's current state (+ any sources you push into H.extra).
// =====================================================================================================
export function hall(scene, { state = 'dark', parts = {} } = {}) {
  const P = { floor: true, pillars: true, atmosphere: true, line: true, banks: true, foreman: true, cursor: false, tower: false, towers: null, rails: false, gates: false, ledger: false, threads: false, human: null, ...parts };
  const lit = state === 'lit' || state === 'cold' ? 1 : 0;
  const group = new THREE.Group(); scene.add(group);
  const H = { group, state, extra: [], parts: P };
  const glowDark = state === 'alarm' ? hcol(C.red, 0.012) : hcol(C.steel, 0.05), glowLit = state === 'cold' ? hcol(C.amberRail, 0.03) : hcol(C.amberRail, 0.032);
  if (P.atmosphere) { H.sky = atmosphere({ fogColor: scene.fog ? scene.fog.color : C.fog, glow: 0x000000, k: 1 }); group.add(H.sky); H.sky.material.uniforms.uGlow.value.copy(lit ? glowLit : glowDark); }
  if (P.floor) { H.floor = floor({}); group.add(H.floor.mesh); }
  if (P.pillars) { H.pillars = pillars({ lit }); group.add(H.pillars.mesh); }
  if (P.line) { H.line = lineStations({ lit }); group.add(H.line.group); H.line.update(0, { lit, strips: lit }); }
  if (P.banks) { H.banks = lightBanks({}); group.add(H.banks.group); H.banks.update(0, { on: state === 'lit' ? 1 : 0, alarm: state === 'alarm' ? 1 : 0 }); }
  if (P.foreman) { H.foreman = foreman(); group.add(H.foreman.group); H.foreman.update(0, { lit: 0 }); }   // unlit until its reveal: drive it
  if (P.cursor) { H.cursor = cursorBlock({}); group.add(H.cursor.group); }
  if (P.tower) { H.tower = codeTower({}); group.add(H.tower.group); }
  if (P.towers) { H.towers = cardTowers({ towers: P.towers }); group.add(H.towers.group); }
  if (P.rails) { H.rails = railNetwork({}); group.add(H.rails.group); }
  if (P.gates) { H.gates = monthGates({}); group.add(H.gates.group); H.gates.update(0); }
  if (P.ledger) { H.ledger = ledgerRow({}); group.add(H.ledger.group); }
  if (P.threads) { H.threads = foremanThreads({}); group.add(H.threads.group); }
  if (P.human) { H.human = humanAnchor({ act: P.human }); group.add(H.human.group); H.human.update(0, {}); }
  H.update = (lt, p = {}) => {
    const L = p.lit ?? lit;
    if (H.pillars) H.pillars.update(lt, { lit: L, alarm: p.alarm ?? (state === 'alarm' ? 1 : 0), k: p.pillarK ?? null });
    if (H.sky) { H.sky.material.uniforms.uGlow.value.copy(glowDark).lerp(glowLit, L).multiplyScalar(p.sky ?? 1); H.sky.material.uniforms.uFog.value.copy(scene.fog ? scene.fog.color : H.sky.material.uniforms.uFog.value); }
    if (H.floor) {
      const src = [];
      for (const k of ['cursor', 'human', 'tower', 'towers', 'banks', 'line', 'foreman']) if (H[k] && H[k].sources) src.push(...H[k].sources());
      src.push(...H.extra);
      src.sort((a, b) => (b.k ?? 1) * (1 + (b.refl ?? 0)) - (a.k ?? 1) * (1 + (a.refl ?? 0)));
      H.floor.setSources(src);
    }
  };
  H.update(0);
  return H;
}

// =====================================================================================================
// CAMERAS — every repeated composition. Each sets position / orientation / fov (and Dutch roll) and RETURNS the base fov:
//   const fov = W.camHallWide(camera, lt, { dur: ctx.T, t: ctx.shot.start + lt, handheld: 0.3 }); camFX(camera, ctx.shot.start + lt, fov);
// Top-downs set camera.up = (0,0,-1) rotated by yaw (screen up = -z, +x right: flow reads L->R; the foreman sits at the top edge) and never flip.
// High cameras: set fog with W.fogKeep(distance, 0.8) (FogExp2 is distance-based; at 0.005 a camera 545u up sees nothing).
// =====================================================================================================
export const FOV = { 14: 70.2, 18: 57.3, 24: 44.6, 35: 31.4, 50: 22.3, 85: 13.2, 135: 8.3, 200: 5.6 };
function setFov(camera, fov) { if (Math.abs(camera.fov - fov) > 1e-5) { camera.fov = fov; camera.updateProjectionMatrix(); } }
/** generic: pos, target, fov, { roll (deg Dutch), up } */
export function camLook(camera, pos, target, fov, { roll = 0, up = [0, 1, 0] } = {}) {
  camera.up.set(up[0], up[1], up[2]);
  camera.position.set(pos[0], pos[1], pos[2]); camera.lookAt(target[0], target[1], target[2]);
  if (roll) camera.rotateZ(THREE.MathUtils.degToRad(roll));
  setFov(camera, fov); return fov;
}
/** deterministic handheld micro-rotation (deg amplitude); call after the camera is posed. t = GLOBAL time. */
export function handheld(camera, t, deg = 0.3, seed = 1) {
  if (!deg) return;
  const n = (x, s) => (Math.sin(x * 1.3 + s) + 0.6 * Math.sin(x * 2.9 + s * 3.1) + 0.3 * Math.sin(x * 6.1 + s * 7.7)) / 1.9;
  camera.rotateX(THREE.MathUtils.degToRad(deg * n(t, seed))); camera.rotateY(THREE.MathUtils.degToRad(deg * n(t, seed + 5.3))); camera.rotateZ(THREE.MathUtils.degToRad(deg * 0.5 * n(t, seed + 9.1)));
}
/** straight-down camera at height h over (x, z), yaw (deg) rotates the frame; up = (0,0,-1) rotated by yaw. */
export function camTop(camera, x, h, z, fov, yawDeg = 0) {
  const a = THREE.MathUtils.degToRad(yawDeg);
  camera.up.set(Math.sin(a), 0, -Math.cos(a));
  camera.position.set(x, h, z); camera.lookAt(x, 0, z);
  setFov(camera, fov); return fov;
}
/** Act I master (i-hall-wide / p-hall-mirror / b-month-one): 18mm, (-180,1,6) -> (-175,1,6) linear over dur, target (-19.6,29,0); handheld (deg) only in Act I. */
export function camHallWide(camera, lt, { dur = 2, t = lt, handheld: hh = 0, push = 5 } = {}) {
  camLook(camera, [-180 + push * clamp(lt / dur), 1.0, 6], [-19.6, 29, 0], FOV[18]);
  handheld(camera, t, hh, 3); return FOV[18];
}
/** MASTER A (ii-line-waits-1) / MIRROR iii-line-runs / recall: 18mm worm's-eye (-6,0.5,18) creeping 5% toward (1.4,14.1,0), Dutch -8; mirror:true rights it to 0 over 12 f (power3.out). */
export function camReviewWorm(camera, lt, { dur = 2, mirror = false, roll = -8, t = lt, handheld: hh = 0 } = {}) {
  const u = clamp(lt / dur) * 0.05;
  const p0 = [-6, 0.5, 18], tg = [1.4, 14.1, 0];
  const rr = mirror ? roll * Math.pow(1 - clamp(lt / 0.4), 3) : roll;
  camLook(camera, [lerp(p0[0], tg[0], u), lerp(p0[1], tg[1], u), lerp(p0[2], tg[2], u)], tg, FOV[18], { roll: rr }); handheld(camera, t, hh, 5); return FOV[18];
}
/** MASTER C (ii-line-waits-2 / ii-max-push / p-human-lit): 14mm (1.4,0.3,72) -> (1.4,0.3,69.1), target (1.4,36,0). stutter: step-print on twos + zoom +3% every 2 f (resets every 6 steps). Use fog 0.008. */
export function camHumanUnderTower(camera, lt, { dur = 2, stutter = false, push = 2.9, t = lt, handheld: hh = 0 } = {}) {
  let l = lt, fov = FOV[14];
  if (stutter) { l = Math.floor(lt * 15) / 15; fov = FOV[14] / Math.pow(1.03, Math.floor(lt * 15) % 6); }
  camLook(camera, [1.4, 0.3, 72 - push * clamp(l / dur)], [1.4, 36, 0], fov); handheld(camera, t, hh, 7); return fov;
}
/** ii-review-slam / ii-review-stamp (dir -1: x -4 -> -8, R->L) / iii-review-mirror (dir +1: -8 -> -4): 135mm side at z 90, y 3. */
export function camReviewSide(camera, lt, { dur = 1, dir = -1, t = lt, handheld: hh = 0 } = {}) {
  const u = clamp(lt / dur); const x = dir < 0 ? lerp(-4, -8, u) : lerp(-8, -4, u);
  camLook(camera, [x, 3, 90], [x, 3, 0], FOV[135]); handheld(camera, t, hh, 11); return FOV[135];
}
/** ii-test-tower (dutch +10) / iii-test-mirror (dutch 0): 14mm (16,0.5,14) -> (21,30,0). */
export function camTestWorm(camera, lt, { dutch = 10, t = lt, handheld: hh = 0 } = {}) { camLook(camera, [16, 0.5, 14], [21, 30, 0], FOV[14], { roll: dutch }); handheld(camera, t, hh, 13); return FOV[14]; }
/** ii-deploy-maze / iii-deploy-mirror: 50mm top-down (40.6,70,0), yaw 6 deg/s. */
export function camDeployTop(camera, lt, { yaw = 6 } = {}) { return camTop(camera, 40.6, 70, 0, FOV[50], yaw * lt); }
/** MASTER E (ii-errors-172) / MIRROR iii-coord-44: 85mm static top-down (1.4,160,0), frame ~66 x 37u. Use fog <= 0.003. */
export function camErrorTop(camera) { return camTop(camera, 1.4, 160, 0, FOV[85]); }
/** MASTER D (ii-two-writers) / MIRROR iii-one-writer: 85mm (-9,3.2,6) -> (-9,2.6,0); frame ~1.4u tall: the card at (-9,2.6,0) fills it. */
export function camWriterMacro(camera) { return camLook(camera, [-9, 3.2, 6], [-9, 2.6, 0], FOV[85]); }
/** m-sixteen / p-line-flow / recall 4: 135mm straight down at (0,545,0) descending 2% linear; rot (deg) rotates the frame. Use fog W.fogKeep(545, 0.85). */
export function camLineTop(camera, lt, { dur = 2.5, rot = 0, h = 545, descend = 0.02 } = {}) { return camTop(camera, 0, h * (1 - descend * clamp(lt / dur)), 0, FOV[135], rot); }
/** c-rail-streak / p-bookend-rail: 85mm macro tracking the brass rail (z 20) at 24 u/s (pair with coldRail()). */
export function camColdRail(camera, lt) { return camLook(camera, [-60 + 24 * lt, 0.38, 20.8], [-58 + 24 * lt, 0.08, 20], FOV[85]); }
/** c-rail-cascade / p-bookend-cascade: 35mm top-down over CODE, y = 40 * 3^expoIn(lt/dur) (40 -> 120), z offset -0.7 (pitch -89.5), up (0,0,-1). */
export function camColdCascade(camera, lt, { dur = 0.5 } = {}) {
  const y = 40 * Math.pow(3, ease.expoIn(clamp(lt / dur)));
  camera.up.set(0, 0, -1); camera.position.set(-19.6, y, -0.7); camera.lookAt(-19.6, 0, 0); setFov(camera, FOV[35]); return FOV[35];
}
/** c-fpv-skim: 14mm FPV 0.5u over the rails at 40 u/s along z=40 (lamp posts at z 41.5 whip past), roll 0 -> 90 deg over 0.5 s. */
export function camColdFPV(camera, lt) { const x = -150 + 40 * lt; return camLook(camera, [x, 0.5, 40], [x + 20, 0.3, 40], FOV[14], { roll: 90 * ease.inOut(clamp(lt / 0.5)) }); }
/** c-foreman-worm / p-bookend-foreman: 14mm at the foreman's foot (0,0.5,-128-2lt) looking up at (0,42,-200). Sweep: foreman.update({ sweep:{ s: 140*lt } }).
 * NOTE: at the spec position the camera is 12u from T1's face, so only T1 is visible (T2-T4 hide behind its lip). pull: u to back off along +z
 * (pull 38 -> z -90: T1-T4 stack readable, T5+ into fog, the crest in frame). Use the same pull in both bookends. */
export function camForemanWorm(camera, lt, { pull = 0 } = {}) { return camLook(camera, [0, 0.5, -128 + pull - 2 * lt], [0, 42, -200], FOV[14]); }
/** month-gate FPV (n = 1..5): 14mm, y 1, z 0, +x at 16u/s x [1,1.3,1.7,2.2,3], passing gate n's plane at local [0.75,0.5,0.5,0.5,0.25]; gate 5 brakes (exp). */
export function camGateFPV(camera, lt, n = 1) {
  const sp = [1, 1.3, 1.7, 2.2, 3][n - 1] * 16, tp = [0.75, 0.5, 0.5, 0.5, 0.25][n - 1], gx = GATE_X[n - 1];
  let x;
  if (n === 5) { const k = 4; const x0 = gx - (sp / k) * (1 - Math.exp(-k * tp)); x = x0 + (sp / k) * (1 - Math.exp(-k * lt)); }
  else x = gx + sp * (lt - tp);
  return camLook(camera, [x, 1.0, 0], [x + 40, 1.6, 0], FOV[14]);
}
/** iii-foreman-hero: 14mm at (0,2,-40) (1% of the monument's height), pitch only +8 deg, lens shift up 22% (setViewOffset), 3% push + 12 deg orbit (-6 -> +6). */
export function camForemanHero(camera, lt, { dur = 2.4, orbit = 12, push = 0.03, shift = 0.24, pitch = 8 } = {}) {
  const u = clamp(lt / dur); const a = THREE.MathUtils.degToRad(lerp(-orbit / 2, orbit / 2, u));
  const R = 160 * (1 - push * u);
  camera.up.set(0, 1, 0);
  camera.position.set(Math.sin(a) * R, 2, -200 + Math.cos(a) * R);
  camera.lookAt(0, 2 + Math.tan(THREE.MathUtils.degToRad(pitch)) * R, -200);
  camera.fov = FOV[14];
  camera.setViewOffset(1920, 1080, 0, -shift * 1080, 1920, 1080);
  return FOV[14];
}
/** iii-still: locked low 35mm at (0,1.5,-60) facing the dark foreman (0,40,-200), linear 1u creep over dur. */
export function camStill(camera, lt, { dur = 0.4 } = {}) { return camLook(camera, [0, 1.5, -60 - clamp(lt / dur)], [0, 40, -200], FOV[35]); }
/** iii-bank-1 / ii-alarm-a: dead-centre one-point worm's-eye down the aisle (-90,0.5,0) -> (60,20,0), 14mm. */
export function camAisle(camera, lt, { roll = 0 } = {}) { return camLook(camera, [-90, 0.5, 0], [60, 20, 0], FOV[14], { roll }); }
/** a macro that actually frames the 1u cursor (85mm at distance d shows ~0.23*d u of height; default d 9 -> cursor ~48% of frame height). */
export function camCursorMacro(camera, lt, { dist = 9, push = 0.04, dur = 2, fov = FOV[85], target = POS.cursor } = {}) {
  const d = dist * (1 - push * clamp(lt / dur));
  return camLook(camera, [target[0] + 0.3, target[1] + 0.1, target[2] + d], target, fov);
}
/** foremanPlant: telephoto across the hall with the foreman compressed behind the subject; sets scene fog = 1.27 / dist(cam, foreman). */
export function camPlant(camera, scene, pos, target, fov = FOV[135]) { if (scene && scene.fog) scene.fog.density = plantFog(pos); return camLook(camera, pos, target, fov); }
