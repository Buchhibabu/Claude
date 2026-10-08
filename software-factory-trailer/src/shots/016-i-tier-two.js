// #16 i-tier-two — M1 (100) / M5 scale. Low-angle 24mm, Dutch 6, 3% push: the CODE station grows its first full tier — orbs 10 -> 100,
// a 10x10 slab assembling row by row on 16ths. Each new row drops in from above (2 f), lands with a hot flash and a light pulse that
// ripples back through the rows already standing; the tier's clay light climbs the haze above it. The human silhouette stands at the
// left third, rim-lit ice against a cold backlight: tiny against the machine. Lens shift keeps his feet on the floor in frame.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import { W, THREE, atmo, halo } from './lib/b2-act1a.js';

const CAM0 = [-32, 2.4, 16], TGT = [-19.6, 8, 0], HUMAN = [-27.6, 0, 6.3];
const SHIFT = 365;              // lens shift (px): content up so the human's feet clear the bottom bar (tier mid-frame, void above)
const ROW0 = 0.06, ROWS = 0.125;   // 9 new rows on 16ths: 0.06 .. 1.06

shot({
  id: 'i-tier-two', dur: beats(3), act: 'I',
  music: { section: 'act1', chord: 'Bb', div: 16, energy: 0.55, add: [], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'impact', { gain: -12 });
    ctx.sfx(0, 'tick', { gain: -8 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, cursor: true } });
    const man = W.humanAnchor({ act: 'I', pos: HUMAN, facing: 2.4 }); scene.add(man.group);
    const back = halo({ w: 2.4, h: 4.0, color: 0xa9c6de, k: 0.26 }); back.position.set(HUMAN[0] + 0.4, 1.3, HUMAN[2] - 0.75); back.rotation.y = -0.56; scene.add(back);
    const A = atmo(scene, H, {
      stationTop: 46, coneR: [0.8, 11], stationPos: [-19.6, 0, 0],
      shafts: [{ x: -46, z: -24, r: 7, op: 0.2, poolK: 2, from: [40, 230, 60] }, { x: 2, z: -40, r: 8, op: 0.16, from: [40, 230, 60] }, { x: -70, z: -60, r: 8, op: 0.14, from: [40, 230, 60], light: false }],
      haze: [{ x: -20, z: -30, ry: 0, w: 160, h: 30, k: 0.05 }, { x: -20, z: -80, ry: 0, w: 260, h: 50, k: 0.06 }],
      near: { count: 90, box: [[-31, 0.3, 8], [-20, 8, 15]], color: 0xcfe3f2, k: 0.25, size: 0.1, seed: 161, rise: 0.06, sway: 0.2 },
      motesN: 300,
    });
    // clay light rising off the tier into the haze above it (grows with the count)
    const glow = W.shaft({ rTop: 6, rBot: 8.5, h: 22, color: W.C.clay, k: 1, opacity: 0, top: 0.0, bottom: 1.0, apexFade: 0.3 });
    glow.position.set(-19.6, 3.6 + 11, 0); scene.add(glow);
    const heat = W.flare({ color: W.C.clay, k: 0, size: 30, ref: 0.4 }); heat.position.set(-19.6, 5, 0); scene.add(heat);
    const tierL = new THREE.PointLight(0xff9e70, 0, 40, 1.3); tierL.position.set(-19.6, 6, 2); scene.add(tierL);
    const TI = H.tower.I, P = H.tower.orbPos, clayL = W.lin(W.C.clay), hotL = W.lin(0xffe2cc);
    return {
      scene, camera, ...W.grade('I', { bloom: { strength: 1.0, radius: 0.5, threshold: 0.8 } }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const rows = 1 + clamp(Math.floor((lt - ROW0) / ROWS) + 1, 0, 9);   // rows standing (1 .. 10)
        H.tower.update(lt, { count: rows * 10, k: 10, t, pulse: 0.15 });
        // per-orb pose: newest row drops in (2 f) and flashes; a pulse ripples back from it through the standing rows
        let lastLand = -9;
        for (let r = 1; r < 10; r++) { const tl = ROW0 + (r - 1) * ROWS; if (lt >= tl) lastLand = tl; }
        for (let i = 0; i < rows * 10; i++) {
          const r = Math.floor(i / 10), p = P(i);
          const land = r === 0 ? -9 : ROW0 + (r - 1) * ROWS, d = lt - land;
          const drop = r === 0 ? 0 : 7 * (1 - ease.in(clamp(d / (3 / 30))));   // slams down from 7u in 3 f
          const flash = r === 0 ? 0 : d < 3 / 30 ? 0.5 : Math.exp(-(d - 3 / 30) / 0.06);
          const ripple = Math.exp(-Math.pow((lt - lastLand) * 9 - (rows - 1 - r), 2) * 0.8) * (lt - lastLand < 0.4 ? 1 : 0);
          TI.set(i, { p: [p[0], p[1] + drop, p[2]], s: 1 + 0.3 * flash, c: clayL, k: 7 * (1 + 0.12 * W.beatPulse(t, { div: 2 })) + 5 * flash + 3 * ripple });
        }
        TI.commit();
        const n = rows / 10, land = Math.exp(-Math.max(0, lt - lastLand) / 0.08);
        glow.userData.set(0.6 + 1.2 * n, 0.05 + 0.2 * n);
        heat.userData.set(0.8 + 2.2 * n + 1.5 * land);
        tierL.intensity = 30 + 120 * n + 80 * land;
        H.cursor.update(lt, { on: W.blink(t, { div: 2 }), k: 10, flare: 0.3 });
        man.update(lt, { rimK: 3.2 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.2 });
        A.update(lt, t, { stationK: 1 });
        H.extra.push(...man.sources());
        H.extra.push({ p: [-19.6, 4, 0], c: W.C.clay, k: 2 + 5 * n, pool: 7 + 4 * n, poolK: 1, refl: 1, size: 6 });
        H.update(lt, { sky: 2.6, pillarK: 0.55 });
        // low 24mm, 3% push toward the target, Dutch 6
        const u = 0.03 * ease.inOut(clamp(lt / ctx.T));
        const pos = CAM0.map((v, i) => lerp(v, TGT[i], u));
        W.camLook(camera, pos, TGT, W.FOV[24], { roll: -6 });
        camera.setViewOffset(1920, 1080, 0, SHIFT, 1920, 1080);
        W.handheld(camera, t, 0.25, 4);
        camFX(camera, t, W.FOV[24]);
      },
    };
  },
});
