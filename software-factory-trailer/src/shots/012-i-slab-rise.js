// #12 i-slab-rise — MOOD CHANGE #1 (the music starts moving). Locked low angle 18mm: a brass monolith punches up through the floor in
// front of the CODE station (0 -> 12u in 4 f, 3% overshoot, animated on twos). Floor tiles shatter up around its base, their cracks
// flash, a shock ring runs out across the wet floor, dust and sparks burst, and a hot clay light line rides its top edge
// (it lands where the cursor's top edge sits in the next shot: the match cut).
import { shot, beats, camFX, clamp, lerp, ease, rand } from '../engine.js';
import { W, THREE, G, atmo, motes } from './lib/b2-act1a.js';

const SX = -25.5, SZ = 7.5, SW = 6, SH = 12, SD = 1;
const CAM = [-15, 0.45, 22], TGT = [-20.6, 4.6, 3], SHIFT = -0.17;   // shallow pitch + lens shift: the monolith stays upright
const ROT = Math.atan2(CAM[0] - TGT[0], CAM[2] - TGT[2]);  // face parallel to the image plane so the crest reads as a level line
// height on twos (15 fps steps): punch 0 -> 12 in 4 frames, 3% overshoot, settle
function slabH(lt) {
  const q = Math.floor(lt * 15) / 15;
  const f = Math.round(q * 30);
  const seq = { 0: 3.2, 2: 9.6, 4: SH * 1.03, 6: SH * 0.995, 8: SH * 1.006 };
  return seq[f] ?? SH;
}

shot({
  id: 'i-slab-rise', dur: beats(1), act: 'I',
  music: { section: 'act1', chord: 'Dm', div: 8, energy: 0.5, add: ['drone', 'ticks', 'pulse', 'ostinato', 'kick'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'A');
    ctx.sfx(0, 'impact', { gain: 0 });
    ctx.sfx(0, 'boom', { gain: -2 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { cursor: true } });
    const A = atmo(scene, H, {
      stationTop: 46, coneR: [0.8, 11], stationPos: [-19.6, 0, 1],
      shafts: [{ x: -52, z: -24, r: 7, op: 0.16, from: [40, 230, 60] }, { x: 4, z: -40, r: 8, op: 0.14, from: [40, 230, 60] }],
      haze: [{ x: -20, z: -40, ry: 0, w: 160, h: 26, k: 0.03 }, { x: -20, z: -110, ry: 0, w: 260, h: 40, k: 0.04 }],
      motesN: 200,
    });
    // the slab: dark brass body, screen-space brass edges, soft outline, three inscribed seams, hot clay crest
    const g = new THREE.Group(); g.position.set(SX, 0, SZ); g.rotation.y = ROT; scene.add(g);
    const body = W.edgeStd({ color: W.C.brassDark, metal: 0.85, rough: 0.32, edge: W.C.brassHi, edgeK: W.kl(3) * 0.18, edgeW: 1.4 });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(SW, SH, SD), body); g.add(slab);
    const outline = W.glowSegs(W.boxEdgePairs([0, 0, 0], [SW, SH, SD]), { color: W.C.brassHi, k: 0.8, width: 1.2 }); slab.add(outline);
    const seams = W.glowSegs([0.25, 0.5, 0.75].map((v) => [[-SW / 2 + 0.4, -SH / 2 + SH * v, SD / 2 + 0.01], [SW / 2 - 0.4, -SH / 2 + SH * v, SD / 2 + 0.01]]), { color: W.C.brass, k: 0.9, width: 1 }); slab.add(seams);
    const crest = W.fat([[-SW / 2, SH / 2 + 0.02, SD / 2 + 0.02], [SW / 2, SH / 2 + 0.02, SD / 2 + 0.02]], { color: W.C.clay, k: 10, width: 4 }); slab.add(crest);
    const crestCore = W.fat([[-SW / 2, SH / 2 + 0.02, SD / 2 + 0.03], [SW / 2, SH / 2 + 0.02, SD / 2 + 0.03]], { color: 0xffe6d6, k: 6, width: 1.4 }); slab.add(crestCore);
    const crestFl = W.flare({ color: W.C.clay, k: 6, size: 9 }); g.add(crestFl);
    const under = new THREE.PointLight(0xffb48a, 0, 18, 1.4); under.position.set(SX + 2.5, 0.6, SZ + 3); scene.add(under);
    const sheen = new THREE.PointLight(0xffd9b8, 220, 60, 1.3); sheen.position.set(SX - 10, 16, SZ + 14); scene.add(sheen);   // grazing key: a brass sheen down the face
    const rimL = new THREE.PointLight(0x9fc3e0, 140, 30, 1.5); rimL.position.set(SX - 6, 10, SZ - 5); scene.add(rimL);
    // shattered floor tiles (2u grid cells) thrown up around the base; crack lines flash between them
    const r = rand(1212);
    const NT = 44;
    const tiles = W.boxes({ count: NT, size: [1.0, 0.1, 1.0], color: 0x0b0c0f, metal: 0.5, rough: 0.35, edgeW: 1.2 }); scene.add(tiles.mesh);
    const tl = Array.from({ length: NT }, () => { const a = r() * Math.PI * 2, d = 3.2 + r() * 4, sc = 0.5 + r() * 0.9; return { x: SX + Math.cos(a) * d, z: SZ + Math.sin(a) * d * 0.8, vy: 3 + r() * 8, vx: Math.cos(a) * (1 + r() * 4), vz: Math.sin(a) * (1 + r() * 4), rx: (r() - 0.5) * 12, rz: (r() - 0.5) * 12, d, sc }; });
    const cracks = [];
    for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d0 = 3 + r() * 1.2, d1 = d0 + 2 + r() * 7; const b = a + (r() - 0.5) * 0.4; cracks.push([[SX + Math.cos(a) * d0, 0.03, SZ + Math.sin(a) * d0], [SX + Math.cos(b) * d1, 0.03, SZ + Math.sin(b) * d1]]); }
    const crackL = W.glowSegs(cracks, { color: W.C.clay, k: 6, width: 1.6 }); scene.add(crackL);
    const ring = W.fat(Array.from({ length: 97 }, (_, i) => { const a = (i / 96) * Math.PI * 2; return [Math.cos(a), 0.04, Math.sin(a)]; }), { color: W.C.amber, k: 4, width: 2.5 });
    ring.position.set(SX, 0, SZ); scene.add(ring);
    const dust = motes({ count: 900, box: [[-1, 0, -1], [1, 1, 1]], color: 0xcdbfae, k: 0.5, size: 0.09, seed: 77, rise: 0, sway: 0 });
    scene.add(dust.points);
    const dd = Array.from({ length: 900 }, () => { const a = r() * Math.PI * 2, s = 2 + r() * 10, up = 0.5 + r() * 6; return [Math.cos(a) * s, up, Math.sin(a) * s * 0.8, r()]; });
    const sparks = W.orbs({ count: 60, r: 0.05, seg: 6 }); scene.add(sparks.mesh);
    const sp = Array.from({ length: 60 }, () => [(r() - 0.5) * SW, 4 + r() * 6, (r() - 0.5) * 3, r()]);
    return {
      scene, camera, ...W.grade('I', { bloom: { strength: 1.2, radius: 0.45, threshold: 0.78 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const q = Math.floor(lt * 15) / 15;                         // animate on twos
        const h = slabH(lt);
        slab.position.y = h - SH / 2;
        const kick = Math.exp(-q * 7);
        crest.userData.set(10 * (0.75 + 0.6 * kick)); crestCore.userData.set(6 * (0.8 + 0.6 * kick));
        crestFl.position.set(0, h + 0.05, SD / 2 + 0.1); crestFl.userData.set(5 + 10 * kick);
        under.intensity = 45 * Math.exp(-q * 4);
        // tiles
        for (let i = 0; i < NT; i++) {
          const T = tl[i], tq = Math.max(0, q - T.d * 0.006);
          const y = Math.max(0.06, 0.06 + T.vy * tq - 16 * tq * tq);
          tiles.set(i, { p: [T.x + T.vx * tq, y, T.z + T.vz * tq], r: [T.rx * tq, T.d, T.rz * tq], s: T.sc, edge: W.lin(W.C.clay, W.kl(4) * Math.exp(-tq * 6) + 0.12), body: [0, 0, 0] });
        }
        tiles.commit();
        crackL.userData.set(6 * Math.exp(-q * 2.8) * (0.7 + 0.3 * Math.sin(q * 90)), W.C.clay);
        const rr = 3 + 34 * ease.out(clamp(q / 0.5)); ring.scale.set(rr, 1, rr * 0.85); ring.userData.set(4 * (1 - clamp(q / 0.5)));
        // dust burst (drag) + sparks falling off the crest
        const pos = dust.positions;
        for (let i = 0; i < 900; i++) { const [dx, up, dz, ph] = dd[i]; const s = 1 - Math.exp(-q * (3 + ph * 3)); pos[i * 3] = SX + dx * s; pos[i * 3 + 1] = up * s * (1 - 0.3 * q); pos[i * 3 + 2] = SZ + dz * s; }
        dust.geometry.attributes.position.needsUpdate = true; dust.set(0.55 * (1 - 0.5 * q));
        const c = Math.cos(ROT), sn = Math.sin(ROT);
        for (let i = 0; i < 60; i++) {
          const [ox, vy, oz, ph] = sp[i]; const tq = q - ph * 0.08; if (tq < 0) { sparks.hide(i); continue; }
          const lx = ox * (1 + tq), ly = h + vy * tq - 22 * tq * tq, lz = SD / 2 + oz * tq * 2;
          if (ly < 0) { sparks.hide(i); continue; }
          sparks.set(i, { p: [SX + lx * c + lz * sn, ly, SZ - lx * sn + lz * c], c: W.lin(i % 3 ? W.C.amber : W.C.clay), k: 9 * Math.exp(-tq * 3) });
        }
        sparks.commit();
        H.cursor.update(lt, { on: 1, k: 3 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.steel, rimK: 0.0 });
        A.update(lt, t, {});
        H.extra.push({ p: [SX, h, SZ], c: W.C.clay, k: 6 * (0.7 + kick), pool: 0, refl: 1.2, size: 3 });
        H.extra.push({ p: [SX, 0.3, SZ + 1], c: W.C.clay, k: 5 * Math.exp(-q * 3), pool: 6, poolK: 1.2, refl: 0.3, size: 2 });
        H.update(lt, { sky: 1.2, pillarK: 0.5 });
        W.camLook(camera, CAM, TGT, W.FOV[18]); camera.setViewOffset(1920, 1080, 0, SHIFT * 1080, 1920, 1080);
        camFX(camera, t, W.FOV[18]);
      },
    };
  },
});
