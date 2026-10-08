// iii-rail-macro — MACRO 85mm on the brass rail, tracking L->R at card speed: the work cards ride the rail in a steady stream (static in
// frame) while the etched brass rail streams past beneath them and a lit station gate sweeps through, its light curtain scanning each card.
import { shot, beats, ease, camFX, clamp, lerp, rand } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE } = W;

function railTexture() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 2048, 128);
  const r = rand(5);
  g.fillStyle = '#fff'; g.strokeStyle = '#fff';
  g.fillRect(0, 10, 2048, 3); g.fillRect(0, 115, 2048, 3);
  for (let x = 0; x < 2048; x += 16) { const L = x % 128 === 0 ? 30 : x % 64 === 0 ? 20 : 10; g.fillRect(x, 16, x % 128 === 0 ? 3 : 1.5, L); }
  for (let x = 8; x < 2048; ) { const w = 6 + Math.floor(r() * 4) * 7; if (r() < 0.75) g.fillRect(x, 64 + (r() < 0.5 ? 0 : 14), w, r() < 0.5 ? 8 : 18); x += w + 6 + Math.floor(r() * 3) * 6; }
  for (let x = 64; x < 2048; x += 256) { g.lineWidth = 2; g.beginPath(); g.arc(x, 64, 18, 0, Math.PI * 2); g.stroke(); g.fillRect(x - 2, 46, 4, 36); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 8;
  return tex;
}

shot({
  id: 'iii-rail-macro', dur: beats(1, 150), act: 'III',
  music: { section: 'act3', chord: 'Bbmaj', div: 16, energy: 0.85, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'chirps', { gain: -10 });
    const { scene, camera, lights } = W.stage({ act: 'III', fog: 0.02 });
    lights.key.intensity = 0.25;
    const H = W.hall(scene, { state: 'lit', parts: { foreman: false } });
    const ZR = 20, YT = 1.0, X0 = -30;
    // the rail: brass bar with an etched glyph band on its camera face (emissive etch)
    const tex = railTexture(); tex.repeat.set(12, 1);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x8a6438, metalness: 0.85, roughness: 0.32, emissive: new THREE.Color(W.C.brass), emissiveMap: tex, emissiveIntensity: 0.55 });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(48, 0.42, 0.6), railMat); rail.position.set(X0 + 4, YT - 0.21, ZR); scene.add(rail);
    const lip = W.glowSegs([[[X0 - 20, YT + 0.005, ZR + 0.3], [X0 + 28, YT + 0.005, ZR + 0.3]], [[X0 - 20, YT - 0.42, ZR + 0.3], [X0 + 28, YT - 0.42, ZR + 0.3]]], { color: W.C.brassHi, k: 1.6, width: 1.2 }); scene.add(lip);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(48, 0.6, 1.6), new THREE.MeshStandardMaterial({ color: 0x0c0b0a, metalness: 0.4, roughness: 0.5 })); bed.position.set(X0 + 4, YT - 0.72, ZR); scene.add(bed);
    // cards riding the rail
    const N = 9, SP = 4.2, SPEED = 6;
    const Cd = W.cards({ count: N }); scene.add(Cd.mesh);
    // the lit station gate (two posts + lintel, amber edges) with a light curtain the cards pass through
    const GX = X0 + 1.55;
    const gate = new THREE.Group(); gate.position.set(GX, 0, ZR); scene.add(gate);
    const gm = W.edgeStd({ color: 0x1a1612, metal: 0.6, rough: 0.4, edge: W.C.amber, edgeK: W.kl(3) * 0.6, edgeW: 1.6 });
    [[-1.6], [1.6]].forEach(([z]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.4, 0.35), gm); p.position.set(0, YT + 1.5, z); gate.add(p); });
    const lin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 3.6), gm); lin.position.set(0, YT + 3.2, 0); gate.add(lin);
    const curtain = B.warmPool({ w: 3.0, d: 3.0, color: W.C.amber, k: 0.25, soft: 0.5 }); curtain.rotation.set(0, Math.PI / 2, 0); curtain.position.set(0, YT + 1.5, 0); gate.add(curtain);
    const gl = new THREE.PointLight(0xffc890, 0.9, 8, 1.6); gl.position.set(0.2, YT + 2.9, 0.8); gate.add(gl);
    const bk = B.bokeh({ count: 22, center: [X0 + 2, 6, -40], spread: [70, 24, 10], size: [3, 8], seed: 15 }); scene.add(bk.group);
    const grade = W.grade('III', { bloom: { strength: 1.0, threshold: 0.8 } });
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      H.banks.update(lt, { on: 1, t });
      H.line.update(lt, { lit: 1, strips: 1 });
      const cx = X0 + SPEED * lt;
      for (let i = 0; i < N; i++) {
        const x = cx - SP * 4 + i * SP + 0.35;
        const scan = Math.exp(-Math.pow((x - GX) / 0.9, 2));           // a card inside the gate catches the curtain
        const e = W.CARD.amberEdge(2.5 + 5 * scan), b = W.CARD.amberBody(2.5 + 6 * scan);
        Cd.set(i, { p: [x, YT + 0.25, ZR], edge: e, body: b });
      }
      Cd.commit();
      bk.update(0.9);
      H.update(lt, { lit: 1, sky: 0.5 });
      camFX(camera, t, W.camLook(camera, [cx + 0.2, YT + 0.85, ZR + 6.4], [cx + 0.55, YT + 0.12, ZR], W.FOV[85]));
    } };
  },
});
