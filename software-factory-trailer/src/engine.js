// Trailer engine. Every frame is a pure function of time t:
//   - 3D: the active shot's update(localT) poses its Three.js scene; one shared composer renders it (bloom etc.)
//   - 2D: a GSAP master timeline (kinetic type, overlays) is seeked to t
//   - FX: flash frames, impact shake, letterbox bars, RGB-split glitch are computed from event lists
// Shots are cut back-to-back (hard cuts by default). Durations are in seconds; use beats(n) to stay on the music grid.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const W = 1920, H = 1080;
export const MUSIC = { bpm: 120 };
export const beats = (n, bpm = MUSIC.bpm) => (n * 60) / bpm;   // beats(4) at 120 BPM = 2 s; beats(4, 150) = 1.6 s

const shots = [];
export function shot(def) { shots.push(def); return def; }

// ---------------------------------------------------------------- deterministic helpers
export function rand(seed) { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const ease = {
  linear: (u) => u,
  inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  out: (u) => 1 - Math.pow(1 - u, 3),
  in: (u) => u * u * u,
  expoOut: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  expoIn: (u) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10)),
  expoInOut: (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2),
  quartOut: (u) => 1 - Math.pow(1 - u, 4),
};
// Piecewise keyframes: kf(t, [[t0,v0],[t1,v1],...], easeFn) -> value (numbers or arrays)
export function kf(t, keys, e = ease.inOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const u = (e1 || e)((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, k) => lerp(a, v1[k], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}

// ---------------------------------------------------------------- renderer + post
let renderer, composer, renderPass, bloomPass, gradePass;
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uCA: { value: 0 }, uVig: { value: 0.35 }, uTime: { value: 0 }, uLift: { value: 0.0 }, uSat: { value: 1.0 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uExp: { value: 1.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uCA; uniform float uVig; uniform float uLift; uniform float uSat; uniform vec3 uTint; uniform float uExp; varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c,c);
      vec2 off = c * uCA * (0.6 + r2*3.0);
      vec4 col;
      col.r = texture2D(tDiffuse, vUv + off).r; col.g = texture2D(tDiffuse, vUv).g; col.b = texture2D(tDiffuse, vUv - off).b; col.a = 1.0;
      col.rgb *= uExp;
      float l = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
      col.rgb = mix(vec3(l), col.rgb, uSat) * uTint;
      col.rgb += uLift;
      col.rgb *= 1.0 - uVig * smoothstep(0.08, 0.55, r2);
      gl_FragColor = col;
    }`,
};

// Internal 3D resolution (the 2D type layer always renders at full 1080p). ?glscale=0.5 for fast drafts.
const Q = new URLSearchParams(location.search);
export const GL_SCALE = +(Q.get('glscale') || 0.75);
const AA = Q.get('aa') !== '0';
function initGL() {
  const canvas = document.getElementById('gl');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: AA, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(Math.round(W * GL_SCALE), Math.round(H * GL_SCALE), false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  composer = new EffectComposer(renderer);
  composer.setSize(Math.round(W * GL_SCALE), Math.round(H * GL_SCALE));
  renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
  composer.addPass(renderPass);
  bloomPass = new UnrealBloomPass(new THREE.Vector2(W * GL_SCALE, H * GL_SCALE), 0.9, 0.55, 0.2);
  composer.addPass(bloomPass);
  gradePass = new ShaderPass(GradeShader);
  composer.addPass(gradePass);
  composer.addPass(new OutputPass());
}
export const GL = { get renderer() { return renderer; }, THREE };

// ---------------------------------------------------------------- FX state (computed per frame from events)
const FX = { flashes: [], shakes: [], glitches: [], bars: [], fades: [], hits: [] };
// Impact tiers (from the camera research): S = act-level, A = strong, B = punctuation.
const TIER = { S: { amp: 1.0, len: 1.2, K: 6, exp: 2.6, ca: 0.008, px: 26 }, A: { amp: 0.6, len: 0.6, K: 3, exp: 1.7, ca: 0.004, px: 12 }, B: { amp: 0.25, len: 0.35, K: 1.2, exp: 1.25, ca: 0.002, px: 4 } };
const n1 = (x, s) => (Math.sin(x * 1.0 + s * 12.9) + 0.5 * Math.sin(x * 2.37 + s * 78.2) + 0.25 * Math.sin(x * 5.71 + s * 37.7)) / 1.75;
export function trauma(t) {
  let tr = 0;
  for (const h of FX.hits) { const d = t - h.t; if (d >= 0 && d < h.len) tr += h.amp * (1 - d / h.len); }
  return Math.min(1, tr);
}
function hitPulse(t, key) {
  let v = 0;
  for (const h of FX.hits) { const d = t - h.t; if (d >= 0 && d < 0.2) v = Math.max(v, h[key] * Math.exp(-d / 0.05)); }
  return v;
}
// Apply rotational shake + FOV kick to a 3D camera (call at the end of a shot's update with the global time).
export function camFX(camera, t, baseFov) {
  const sh = Math.pow(trauma(t), 2);
  if (sh > 0) {
    camera.rotateY(THREE.MathUtils.degToRad(2.5 * sh * n1(t * 9, 1)));
    camera.rotateX(THREE.MathUtils.degToRad(2.0 * sh * n1(t * 9, 2)));
    camera.rotateZ(THREE.MathUtils.degToRad(3.5 * sh * n1(t * 9, 3)));
  }
  let kick = 0;
  for (const h of FX.hits) { const d = t - h.t; if (d >= 0 && d < 1.2) { const w = 2 * Math.PI * 5, z = 0.4, wd = w * Math.sqrt(1 - z * z); kick -= h.K * Math.exp(-z * w * d) * Math.cos(wd * d); } }
  const fov = (baseFov ?? camera.fov) + kick * 0.6;
  if (Math.abs(camera.fov - fov) > 1e-4) { camera.fov = fov; camera.updateProjectionMatrix(); }
}
// flash: {t, d, color:'#fff'|'#000', peak}   shake: {t, amp(px), d, rot(deg)}   glitch: {t, d, amp}   fade: {t,d,from,to} (black fade)
export function fxAt(t) {
  let flash = 0, flashCol = '#ffffff';
  for (const f of FX.flashes) {
    const u = (t - f.t) / f.d;
    if (u >= 0 && u < 1) { const v = (f.peak ?? 1) * Math.pow(1 - u, f.curve ?? 2); if (v > flash) { flash = v; flashCol = f.color || '#ffffff'; } }
  }
  let sx = 0, sy = 0, sr = 0;
  for (const s of FX.shakes) {
    const dt = t - s.t;
    if (dt >= 0 && dt < s.d) {
      const a = s.amp * Math.exp((-dt / s.d) * 4);
      sx += a * (Math.sin(dt * 71 + s.t * 13) * 0.6 + Math.sin(dt * 133 + s.t * 7) * 0.4);
      sy += a * (Math.sin(dt * 89 + s.t * 5) * 0.6 + Math.sin(dt * 151 + s.t * 3) * 0.4);
      sr += (s.rot || 0) * Math.exp((-dt / s.d) * 4) * Math.sin(dt * 47 + s.t);
    }
  }
  let gl = 0;
  for (const g of FX.glitches) { const dt = t - g.t; if (dt >= 0 && dt < g.d) gl = Math.max(gl, g.amp * (Math.sin(dt * 90) > -0.2 ? 1 : 0.2)); }
  let bars = 0;   // letterbox: each event animates from the current height to px over d seconds (d=0: hard cut)
  for (const b of FX.bars) { if (t < b.t) break; bars = lerp(bars, b.px, b.d > 0 ? ease.inOut(clamp((t - b.t) / b.d)) : 1); }
  let black = 0;
  for (const f of FX.fades) { const u = clamp((t - f.t) / f.d); if (t >= f.t) black = lerp(f.from, f.to, ease.inOut(u)); }
  return { flash, flashCol, sx, sy, sr, gl, bars, black };
}

// ---------------------------------------------------------------- build + seek
let master, built = null;

export function build() {
  initGL();
  master = gsap.timeline({ paused: true });
  const ui = document.getElementById('ui');
  let t = 0;
  const sfx = [];
  for (const s of shots) {
    s.start = t;
    s.end = t + s.dur;
    // 2D layer for this shot (hard-cut visibility window).
    s.root = document.createElement('div');
    s.root.className = 'shot';
    s.root.dataset.id = s.id;
    ui.appendChild(s.root);
    gsap.set(s.root, { autoAlpha: 0 });
    master.set(s.root, { autoAlpha: 1 }, t);
    master.set(s.root, { autoAlpha: 0 }, s.end);
    const tl = gsap.timeline();
    const ctx = { shot: s, T: s.dur, beats, fx: shotFx(s), sfx: (at, kind, opts = {}) => sfx.push({ t: +(s.start + at).toFixed(4), kind, ...opts, shot: s.id }) };
    s.ctx = ctx;
    if (s.three) s.gl = s.three(ctx);           // -> { scene, camera, update(lt, u), bloom?, ca?, exposure? }
    if (s.ui) s.ui(s.root, tl, window.SF_K, ctx);
    master.add(tl, t);
    (s.sfx || []).forEach((e) => sfx.push({ ...e, t: +(s.start + e.at).toFixed(4), shot: s.id }));
    t = s.end;
  }
  // Keep FX lists sorted.
  FX.bars.sort((a, b) => a.t - b.t);
  FX.fades.sort((a, b) => a.t - b.t);
  built = { duration: t, sfx, shots: shots.map((s) => ({ id: s.id, start: +s.start.toFixed(4), dur: s.dur, act: s.act || null, music: s.music || null })), bpm: MUSIC.bpm };
  window.DURATION = t;
  window.CUES = built;
  master.seek(0, false);
  return built;
}

function shotFx(s) {
  return {
    // Tiered impact: S (act turns, 3-5 per film), A (strong beats), B (punctuation). Also shakes the 2D layer.
    hit: (at, tier = 'A') => { const T = TIER[tier]; FX.hits.push({ t: s.start + at, ...T }); FX.shakes.push({ t: s.start + at, amp: T.px, d: T.len * 0.8, rot: tier === 'S' ? 0.5 : 0.2 }); },
    flash: (at, d = 0.25, opts = {}) => FX.flashes.push({ t: s.start + at, d, ...opts }),
    shake: (at, amp = 18, d = 0.6, rot = 0.6) => FX.shakes.push({ t: s.start + at, amp, d, rot }),
    glitch: (at, d = 0.25, amp = 1) => FX.glitches.push({ t: s.start + at, d, amp }),
    bars: (at, px, d = 0) => FX.bars.push({ t: s.start + at, px, d }),   // letterbox height (138 = 2.39:1); persists until the next bars()
    fade: (at, d, from, to) => FX.fades.push({ t: s.start + at, d, from, to }),
  };
}

function activeShot(t) {
  for (const s of shots) if (t >= s.start && t < s.end) return s;
  return shots[shots.length - 1];
}

export function seek(t) {
  master.seek(t, false);
  const s = activeShot(t);
  const lt = t - s.start;
  const fx = fxAt(t);
  // 3D
  if (s.gl) {
    s.gl.update(lt, lt / s.dur, fx);
    renderPass.scene = s.gl.scene;
    renderPass.camera = s.gl.camera;
    const b = s.gl.bloom || {};
    bloomPass.strength = b.strength ?? 0.9;
    bloomPass.radius = b.radius ?? 0.55;
    bloomPass.threshold = b.threshold ?? 0.2;
    renderer.toneMappingExposure = s.gl.exposure ?? 1.0;
    gradePass.uniforms.uCA.value = (s.gl.ca ?? 0.0008) + fx.gl * 0.012 + hitPulse(t, 'ca');
    gradePass.uniforms.uVig.value = s.gl.vignette ?? 0.45;
    gradePass.uniforms.uSat.value = s.gl.sat ?? 1.0;
    const tint = s.gl.tint ?? [1, 1, 1];
    gradePass.uniforms.uTint.value.set(tint[0], tint[1], tint[2]);
    gradePass.uniforms.uExp.value = 1 + Math.max(0, hitPulse(t, 'exp') - 1) * 1.0;
    gradePass.uniforms.uLift.value = s.gl.lift ?? 0;
    composer.render();
    document.getElementById('gl').style.visibility = 'visible';
  } else {
    document.getElementById('gl').style.visibility = 'hidden';
  }
  // FX overlays
  const world = document.getElementById('world');
  world.style.transform = `translate(${fx.sx.toFixed(2)}px, ${fx.sy.toFixed(2)}px) rotate(${fx.sr.toFixed(3)}deg) scale(${(1 + Math.abs(fx.sx) * 0.0012).toFixed(4)})`;
  const flash = document.getElementById('flash');
  flash.style.opacity = fx.flash.toFixed(3);
  flash.style.background = fx.flashCol;
  const uiEl = document.getElementById('ui');
  uiEl.style.filter = fx.gl > 0.01 ? `drop-shadow(${(-8 * fx.gl).toFixed(1)}px 0 rgba(255,40,80,0.85)) drop-shadow(${(8 * fx.gl).toFixed(1)}px 0 rgba(40,220,255,0.85))` : 'none';
  uiEl.style.transform = fx.gl > 0.01 ? `translateX(${(Math.sin(t * 173) * 14 * fx.gl).toFixed(1)}px)` : 'none';
  const barH = fx.bars;
  document.querySelector('#bars .top').style.height = barH + 'px';
  document.querySelector('#bars .bot').style.height = barH + 'px';
  document.getElementById('black').style.opacity = fx.black.toFixed(3);
  // Animated film grain: jump the texture offset every frame (deterministic).
  const fr = Math.round(t * 30);
  document.getElementById('grain').style.backgroundPosition = `${(fr * 397) % 1920}px ${(fr * 211) % 1080}px`;
}

window.SF = { build, seek, shot, beats, MUSIC, trauma };
