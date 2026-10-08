// 3D primitives for trailer shots. Everything deterministic (seeded), animated only through update(lt).
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { rand } from '../engine.js';

export { THREE };
export const COL = {
  ink: 0x040406, paper: 0xf4f1ea, clay: 0xff7a4d, ember: 0xff4d2e, gold: 0xffc35a, ice: 0x8fd3ff, danger: 0xff3b5c, steel: 0x2a2c33,
};

export function stage({ fov = 40, near = 0.1, far = 800, fog = 0.012, bg = COL.ink } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  if (fog) scene.fog = new THREE.FogExp2(bg, fog);
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, near, far);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(6, 12, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9a70, 1.4); rim.position.set(-10, 4, -12); scene.add(rim);
  return { scene, camera, key, rim };
}

let _dot;
export function dotTexture() {
  if (_dot) return _dot;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _dot = new THREE.CanvasTexture(c);
  return _dot;
}

// Soft particle field. Returns { points, positions, base } so shots can animate positions deterministically.
export function particles({ count = 2000, spread = [100, 40, 100], center = [0, 0, 0], color = COL.clay, size = 0.35, seed = 1, opacity = 1, additive = true } = {}) {
  const r = rand(seed);
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center[0] + (r() - 0.5) * spread[0];
    pos[i * 3 + 1] = center[1] + (r() - 0.5) * spread[1];
    pos[i * 3 + 2] = center[2] + (r() - 0.5) * spread[2];
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, map: dotTexture(), transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true });
  const points = new THREE.Points(g, mat);
  return { points, positions: pos, base: pos.slice(), geometry: g, material: mat };
}

// Infinite-feeling ground grid with distance fade (shader).
export function grid({ size = 400, cell = 2, color = 0x3a3a44, y = 0, fade = 120, opacity = 1 } = {}) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uCol: { value: new THREE.Color(color) }, uCell: { value: cell }, uFade: { value: fade }, uOp: { value: opacity } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uCell; uniform float uFade; uniform float uOp; varying vec3 vW;
      void main(){ vec2 c = vW.xz/uCell; vec2 g = abs(fract(c-0.5)-0.5)/fwidth(c); float l = 1.0-min(min(g.x,g.y),1.0);
      float d = length(vW.xz - cameraPosition.xz); float f = 1.0 - smoothstep(uFade*0.3, uFade, d);
      gl_FragColor = vec4(uCol, l*f*uOp); }`,
    extensions: { derivatives: true },
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  m.rotation.x = -Math.PI / 2; m.position.y = y;
  return m;
}

// Glowing box (station, block, server). emissive drives bloom.
export function glowBox({ w = 2, h = 1.2, d = 2, color = 0x141418, emissive = COL.clay, intensity = 0.0, metal = 0.6, rough = 0.35, edges = true, edgeColor = COL.clay, edgeOpacity = 0.6 } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, metalness: metal, roughness: rough });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  g.add(mesh);
  let edge = null;
  if (edges) {
    edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: edgeOpacity }));
    g.add(edge);
  }
  g.userData = { mesh, mat, edge };
  return g;
}

// Fat line through points (screen-space width in px).
export function fatLine(points, { color = COL.clay, width = 3, opacity = 1, dashed = false } = {}) {
  const geo = new LineGeometry();
  geo.setPositions(points.flatMap((p) => [p.x ?? p[0], p.y ?? p[1], p.z ?? p[2]]));
  const mat = new LineMaterial({ color, linewidth: width, transparent: true, opacity, dashed, worldUnits: false });
  mat.resolution.set(1920, 1080);
  const line = new Line2(geo, mat);
  line.computeLineDistances();
  return line;
}

// Thin line between two points (cheap).
export function line(a, b, { color = 0x55555f, opacity = 0.6 } = {}) {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

// 3D text plane from a canvas (for in-world labels and giant set-piece type).
export function textPlane(text, { font = '800 120px "Inter Tight"', color = '#f4f1ea', width = 8, pad = 20, glow = 0, letterSpacing = 0 } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = font;
  if (letterSpacing) g.letterSpacing = letterSpacing + 'px';
  const m = g.measureText(text);
  const fs = parseInt(font.match(/(\d+)px/)[1], 10);
  c.width = Math.ceil(m.width + pad * 2);
  c.height = Math.ceil(fs * 1.3 + pad * 2);
  g.font = font;
  if (letterSpacing) g.letterSpacing = letterSpacing + 'px';
  g.textBaseline = 'middle';
  if (glow) { g.shadowColor = color; g.shadowBlur = glow; }
  g.fillStyle = color;
  g.fillText(text, pad, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const h = (width * c.height) / c.width;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, h), mat);
  mesh.userData.aspect = c.width / c.height;
  return mesh;
}

// Additive light shaft (volumetric-looking cone).
export function beam({ radiusTop = 0.2, radiusBottom = 6, height = 30, color = COL.clay, opacity = 0.18 } = {}) {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 48, 1, true);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uCol: { value: new THREE.Color(color) }, uOp: { value: opacity } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uOp; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float edge = pow(abs(dot(vN, vV)), 1.5); float along = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
      gl_FragColor = vec4(uCol, uOp * edge * (0.35 + along)); }`,
  });
  return new THREE.Mesh(geo, mat);
}

// Camera helpers
export function look(camera, pos, target, fov) {
  camera.position.set(...pos);
  camera.lookAt(...target);
  if (fov && camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
}
export function spline(points, closed = false) {
  return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'catmullrom', 0.5);
}
// Glowing sphere (agent).
export function orb({ r = 0.25, color = COL.clay, intensity = 2.5, seg = 16 } = {}) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: intensity }));
}

// ---------------------------------------------------------------- crowds, silhouettes, streams, panels
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

// Instanced mesh with a simple per-instance setter. Glow: use basic:true and colors > 1 (HDR) to drive bloom.
//   const I = G.instanced({ count: 2000, geometry: new THREE.BoxGeometry(1,1,1), basic: true, color: 0xffffff });
//   I.set(i, { p:[x,y,z], s:[sx,sy,sz] | s, r:[rx,ry,rz], c:[r,g,b] | hex, k: brightness }); I.commit();
export function instanced({ count = 1000, geometry = new THREE.BoxGeometry(1, 1, 1), basic = false, color = 0xffffff, metal = 0.5, rough = 0.4, emissive = 0x000000, intensity = 0, transparent = false, opacity = 1, additive = false } = {}) {
  const material = basic
    ? new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: transparent || additive, opacity, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !additive })
    : new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough, emissive, emissiveIntensity: intensity, transparent, opacity });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  for (let i = 0; i < count; i++) mesh.setColorAt(i, _c.set(0xffffff));
  const api = {
    mesh, material, count,
    set(i, { p = [0, 0, 0], s = 1, r = [0, 0, 0], c = null, k = 1 } = {}) {
      _v.set(p[0], p[1], p[2]);
      if (Array.isArray(s)) _s.set(s[0], s[1], s[2]); else _s.set(s, s, s);
      _q.setFromEuler(_e.set(r[0], r[1], r[2]));
      mesh.setMatrixAt(i, _m4.compose(_v, _q, _s));
      if (c !== null || k !== 1) {
        if (c === null) _c.set(0xffffff); else if (Array.isArray(c)) _c.setRGB(c[0], c[1], c[2]); else _c.set(c);
        mesh.setColorAt(i, _c.multiplyScalar(k));
      }
    },
    hide(i) { mesh.setMatrixAt(i, _m4.makeScale(0, 0, 0)); },
    commit() { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; },
  };
  return api;
}

// Human silhouette (stylized, no face): capsule body + head. Height in world units. Black by default (reads against light).
export function human({ h = 1.8, color = 0x000000, basic = true, pose = 'stand' } = {}) {
  const g = new THREE.Group();
  const mat = basic ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const u = h / 1.8;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2 * u, 0.55 * u, 4, 10), mat); torso.position.y = 1.15 * u; torso.scale.x = 1.35;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13 * u, 16, 12), mat); head.position.y = 1.66 * u;
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.085 * u, 0.62 * u, 4, 8), mat); legL.position.set(-0.11 * u, 0.42 * u, 0);
  const legR = legL.clone(); legR.position.x = 0.11 * u;
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.06 * u, 0.55 * u, 4, 8), mat); armL.position.set(-0.36 * u, 1.12 * u, 0); armL.rotation.z = 0.12;
  const armR = armL.clone(); armR.position.x = 0.36 * u; armR.rotation.z = -0.12;
  if (pose === 'sit') { legL.rotation.x = legR.rotation.x = -Math.PI / 2; legL.position.set(-0.11 * u, 0.62 * u, 0.3 * u); legR.position.set(0.11 * u, 0.62 * u, 0.3 * u); torso.position.y = 0.95 * u; head.position.y = 1.46 * u; armL.position.y = armR.position.y = 0.95 * u; armL.rotation.x = armR.rotation.x = -0.9; armL.position.z = armR.position.z = 0.22 * u; }
  g.add(torso, head, legL, legR, armL, armR);
  g.userData = { mat, torso, head, armL, armR, legL, legR };
  return g;
}

// Particles flowing along curves (data streams, conveyor flows). update(t) moves them; speed in curve-lengths/sec.
export function flow({ curves, count = 600, speed = 0.15, size = 0.25, color = COL.clay, seed = 3, jitter = 0.15, opacity = 1 } = {}) {
  const r = rand(seed);
  const P = particles({ count, spread: [0, 0, 0], color, size, seed, opacity });
  const lane = new Uint16Array(count), off = new Float32Array(count), j = new Float32Array(count * 3), sp = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    lane[i] = Math.floor(r() * curves.length); off[i] = r(); sp[i] = speed * (0.8 + 0.4 * r());
    j[i * 3] = (r() - 0.5) * jitter; j[i * 3 + 1] = (r() - 0.5) * jitter; j[i * 3 + 2] = (r() - 0.5) * jitter;
  }
  const pts = curves.map((c) => c.getSpacedPoints(400));
  P.update = (t, gate = 1) => {
    for (let i = 0; i < count; i++) {
      const u = (off[i] + t * sp[i]) % 1;
      const arr = pts[lane[i]]; const q = arr[Math.floor(u * (arr.length - 1))];
      const vis = (i / count) < gate;
      P.positions[i * 3] = vis ? q.x + j[i * 3] : 1e5;
      P.positions[i * 3 + 1] = q.y + j[i * 3 + 1];
      P.positions[i * 3 + 2] = q.z + j[i * 3 + 2];
    }
    P.geometry.attributes.position.needsUpdate = true;
  };
  return P;
}

// Canvas-backed plane for in-world screens/panels/cards. draw(g, w, h, t) is called by redraw(t).
export function canvasPlane({ w = 4, h = 2.25, px = 512, draw, glow = false, opacity = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = px; c.height = Math.round(px * h / w);
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, toneMapped: !glow, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.userData.redraw = (t = 0) => { g.clearRect(0, 0, c.width, c.height); draw && draw(g, c.width, c.height, t); tex.needsUpdate = true; };
  mesh.userData.redraw(0);
  return mesh;
}

// Fake code drawn into a 2D context: colored token bars on lines (reads as code at any distance).
export function drawCode(g, w, h, { seed = 1, lines = 24, reveal = 1, palette = ['#ff7a4d', '#8fd3ff', '#f4f1ea', '#6b6f7a', '#ffc35a'], bg = null, cursor = true, t = 0 } = {}) {
  const r = rand(seed);
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  const lh = h / (lines + 2), bh = lh * 0.5;
  const shown = Math.floor(lines * reveal);
  let cx = 0, cy = 0;
  for (let i = 0; i < lines; i++) {
    let x = w * 0.06 + Math.floor(r() * 4) * w * 0.035;
    const y = lh * (i + 1.5);
    const n = 1 + Math.floor(r() * 5);
    for (let k = 0; k < n; k++) {
      const bw = w * (0.03 + r() * 0.16);
      if (i < shown) { g.fillStyle = palette[Math.floor(r() * palette.length)]; g.globalAlpha = 0.85; g.fillRect(x, y - bh / 2, bw, bh); }
      else r();
      x += bw + w * 0.015;
      if (i === shown - 1) { cx = x; cy = y; }
    }
  }
  g.globalAlpha = 1;
  if (cursor && Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = '#f4f1ea'; g.fillRect(cx, cy - lh * 0.4, lh * 0.45, lh * 0.8); }
}

// Glowing ring (torus) for halos, targets, gauges.
export function ring({ r = 2, tube = 0.03, color = COL.clay, k = 4, arc = Math.PI * 2 } = {}) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 128, arc), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false }));
  return m;
}

// HDR basic material helper: color * k (k>1 blooms).
export function hdr(color, k = 3, opts = {}) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false, ...opts });
}
