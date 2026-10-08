// 31 · m-pullback — THE MIDPOINT. One continuous move (power2.inOut, settles at 3.4): from tight on the blazing tower, dolly back +
// crane up and over to straight down from 210u (35mm -> 50mm). As we rise, the whole column of light sinks into its station like a
// piston and its light pours into the box: the blazing code tower becomes ONE lit box on a long line of 7 DARK stations (ice
// hairlines, conveyor hairline, black floor). Pillars slide out of frame; the foreman never enters. The first 0.5 s moves in
// digital silence.
import { shot, beats, camFX } from '../engine.js';
import { W, THREE, T, gradeMID, motes, codeBox, smoothOrbs, towerHalo, hidePillars, ease, clamp, lerp } from './lib/b3.js';

const P2 = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);   // power2.inOut
const TOPY = 3.25;                                                              // the box's lid (strip top)

shot({
  id: 'm-pullback', dur: beats(8), act: 'MID',
  music: { section: 'turn', chord: 'Dm', div: 4, energy: 0.1, add: ['drone', 'ticks'], drop: ['pulse', 'ostinato', 'kick', 'drums', 'strings'] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'silence', { dur: 0.5, gain: 0 });
    ctx.sfx(0.5, 'tick', { gain: -10 });
    const { scene, camera } = W.stage({ act: 'MID' });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, banks: false, foreman: false } });
    const CB = codeBox(); scene.add(CB.group);
    hidePillars(H, [[-15, 30], [15, 30]]);                   // the crane passes through these two
    const halo = towerHalo(scene);
    smoothOrbs(H.tower.I, 18);
    const TW = H.tower, cl = W.lin(W.C.clay), em = W.lin(W.C.ember);
    // the seam where the column enters the box: a hot clay line on the lid's rim
    const S = W.STATIONS[W.ST.CODE];
    const lx0 = S.x0 + 0.6, lx1 = S.x1 - 0.6;
    const lid = W.glowSegs([[[lx0, TOPY, -5], [lx1, TOPY, -5]], [[lx0, TOPY, 5], [lx1, TOPY, 5]], [[lx0, TOPY, -5], [lx0, TOPY, 5]], [[lx1, TOPY, -5], [lx1, TOPY, 5]]], { color: W.C.ember, k: 0, width: 2 });
    scene.add(lid);
    const intake = W.flare({ color: W.C.clay, k: 0, size: 24 }); intake.position.set(S.cx, TOPY + 0.5, 0); scene.add(intake);
    const boxL = new THREE.PointLight(W.C.clay, 0, 40, 1.3); boxL.position.set(S.cx, 7, 0); scene.add(boxL);
    const M = motes({ count: 1500, box: [-40, 2, 0.4, 36, -14, 24], color: W.C.amber, k: 1.2, size: 0.08, seed: 311, drift: [0.05, -0.25, 0.05] });
    scene.add(M.points);
    // camera: spherical arc about a travelling target; elevation -14 -> 89.9 deg, distance 24 -> 210 (log)
    const P0 = [-19.6, 4.5, 23], T0 = [-19.6, 10.5, 0], P1 = [0, 210, 0.4], T1 = [0, 0, 0];
    const d0 = Math.hypot(P0[1] - T0[1], P0[2] - T0[2]), d1 = Math.hypot(P1[1] - T1[1], P1[2] - T1[2]);
    const el0 = Math.atan2(P0[1] - T0[1], P0[2] - T0[2]), el1 = Math.atan2(P1[1] - T1[1], P1[2] - T1[2]);
    const R = {
      scene, camera, ...gradeMID({ bloom: { strength: 0.9, radius: 0.45, threshold: 0.85 } }),
      update(lt) {
        const t = T(ctx, lt);
        const u = P2(clamp(lt / 3.4));
        // --- the column sinks into the box (0.5 -> 3.0 s, ease in-out), orbs vanish as they pass the lid
        const c = ease.inOut(clamp((lt - 0.5) / 2.5));
        const drop = 31.5 * c;
        const kOrb = 11 * lerp(1.25, 0.5, clamp(u * 2.5));            // blazing up close, density-compensated once small
        let gone = 0;
        for (let i = 0; i < 1000; i++) {
          const p = TW.orbPos(i), y = p[1] - drop;
          const s = clamp((y - TOPY + 0.15) / 0.7);
          if (s <= 0.001) { TW.I.hide(i); gone++; continue; }
          const near = clamp(1 - (y - TOPY) / 3);                         // orbs about to enter flare hot
          const pu = 1 + 0.1 * Math.sin((t * 1.0 + i * 0.137) * Math.PI * 2);   // slow breath (the pulse has stopped)
          TW.I.set(i, { p: [p[0], y, p[2]], s, c: near > 0.5 ? em : cl, k: kOrb * pu * (1 + 1.4 * near) });
        }
        TW.I.commit();
        TW.crest.position.y = 34 - drop; TW.crest.visible = 34 - drop > TOPY + 0.3;
        TW.crest.material.color.set(W.C.clay).multiplyScalar(W.ko(8));
        const box = gone / 1000;
        halo.update({ k: 0.28 * (1 - c), h: Math.max(0.5, 30 - drop), core: 1.2 });
        const sinking = c > 0.001 && c < 0.999 ? 1 : 0;
        // the line: dark stations, ice hairlines; CODE becomes ONE lit box as the tower's light pours in
        H.line.update(lt, { lit: 0, dim: 0.3, strips: [0, 0, 1, 0, 0, 0, 0], draw: 1, codeK: lerp(0.6, 4.5, box), conveyorK: 0.45 });
        CB.update({ edge: 0.4 + 2.4 * box, body: 0.15 + 0.45 * box });
        lid.userData.set(sinking * 4 + 0.6 * box); lid.visible = c > 0.001;
        intake.userData.set(sinking * (3 + 4 * Math.sin(Math.PI * c)));
        boxL.intensity = 30 + 180 * box;
        M.update(t, { k: 1.2 * (1 - u * 0.7), drift: [0.05, -0.25, 0.05] });
        H.extra.length = 0; H.extra.push({ p: [S.cx, TOPY, 0], c: W.C.clay, k: 4 * sinking + 2 * box, pool: 18, poolK: 0.8, refl: 0.5, size: 8 });
        H.update(lt, { sky: 1 });
        // --- the move
        const el = lerp(el0, el1, u), dist = d0 * Math.pow(d1 / d0, u);
        const tg = [lerp(T0[0], T1[0], u), lerp(T0[1], T1[1], u), lerp(T0[2], T1[2], u)];
        const pos = [lerp(P0[0], P1[0], u), tg[1] + Math.sin(el) * dist, tg[2] + Math.cos(el) * dist];
        const fov = lerp(W.FOV[35], W.FOV[50], u);
        // FogExp2 is distance-based: keep 85% contrast at the subject distance (tight = black void behind)
        scene.fog.density = W.fogKeep(dist, 0.85) * lerp(1.6, 1, clamp(u * 1.5));
        pos[1] += 1.2 * Math.max(0, lt - 3.4);                             // a hair of drift after the settle
        camFX(camera, t, W.camLook(camera, pos, tg, fov));
      },
    };
    return R;
  },
});
