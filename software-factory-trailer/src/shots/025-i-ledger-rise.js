// 25 · i-ledger-rise — Halloran ride: one clay orb lifts off the top of the 1,000-orb tower and the camera chases it (6u behind,
// 2u below) over the top tier — runway pips racing ahead every 16th, through the crest ring — up to the brass ledger hanging in
// the dark. At 1.75 it slots into cell 7: the cell fills clay and a flare races along the seams to both ends (k3 -> 10).
import { shot, beats, camFX } from '../engine.js';
import { W, THREE, T, gradeI, motes, ledgerExtras, towerHalo, ease, clamp, lerp } from './lib/b3.js';

shot({
  id: 'i-ledger-rise', dur: beats(4), act: 'I',
  music: { section: 'act1', chord: 'A', div: 16, energy: 0.75, add: ['strings'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'riser', { dur: 2.0, gain: -4 });
    const { scene, camera } = W.stage({ act: 'I' });
    const H = W.hall(scene, { state: 'dark', parts: { tower: true, ledger: true, banks: false } });
    const LX = ledgerExtras(H.ledger); scene.add(LX.group);
    const halo = towerHalo(scene);
    const SLOT = H.ledger.cellPos(6);                      // (-17.93, 36, 14)
    // the ledger hangs: two brass cables up into the dark
    for (const x of [-37.6, -1.6]) scene.add(W.fat([[x, 36.6, 14], [x, 160, 14]], { color: W.C.brassMid, k: 0.8, width: 1.2 }));
    // the travelling orb + its light
    const orb = W.glowMesh(new THREE.SphereGeometry(0.35, 20, 14), W.C.clay, 12, { radius: 0.35 }); scene.add(orb);
    const orbFl = W.flare({ color: W.C.clay, k: 6, size: 5 }); scene.add(orbFl);
    const orbL = new THREE.PointLight(W.C.clay, 30, 9, 1.6); scene.add(orbL);
    const LIFT = 955;                                       // top tier, row 5, col 5 (-18.8, 30.6, 0.8)
    const path = W.G.spline([[-18.8, 30.6, 0.8], [-18.7, 33.2, 1.6], [-18.4, 35.6, 3.8], [-18.1, 36.05, 7.5], [-17.96, 36.0, 10.5], [SLOT[0], SLOT[1], 12.9]]);
    const camPath = W.G.spline([[-19.4, 35.8, -6.8], [-19.1, 35.6, -3.2], [-18.6, 35.45, 0.8], [-18.2, 35.4, 4.4], [-17.97, 35.5, 7.5]]);
    const M = motes({ count: 1200, box: [-34, -4, 28, 44, -10, 20], color: W.C.amber, k: 1.6, size: 0.05, seed: 251 });
    scene.add(M.points);
    const TS = 1.75;
    const R = {
      scene, camera, ...gradeI({ bloom: { strength: 0.95, radius: 0.5, threshold: 0.8 } }),
      update(lt) {
        const t = T(ctx, lt);
        const u = Math.pow(clamp(lt / TS), 2);              // power2.in
        const ds = lt - TS;                                  // since the stamp
        // tower + runway pips: a bright front sweeps the top tier's rows toward the ledger every 16th
        H.tower.update(lt, { count: 1000, k: 12, crest: 1, t });
        const front = (lt * 8) % 12 - 1;
        for (let i = 900; i < 1000; i++) {
          const row = Math.floor((i - 900) / 10);
          const b = Math.exp(-Math.pow(row - front, 2) / 0.8);
          if (b > 0.05 && i !== LIFT) H.tower.I.set(i, { p: H.tower.orbPos(i), c: W.lin(W.C.clay), k: 12 * 0.45 * (1 + 2.2 * b) });
        }
        H.tower.I.hide(LIFT); H.tower.I.commit();
        halo.update({ k: 0.2, h: 30 });
        // the orb
        const p = lt < TS ? path.getPointAt(u) : new THREE.Vector3(SLOT[0], SLOT[1], 12.9 + 1.0 * ease.out(clamp(ds / 0.06)));
        orb.position.copy(p); orb.visible = ds < 0.08;
        orbFl.position.copy(p); orbFl.userData.set(ds < 0.08 ? 6 : 0);
        orbL.position.copy(p); orbL.intensity = ds < 0.08 ? 30 : 0;
        // the ledger: cell 7 fills, seams flare end to end
        const fill = ds >= 0 ? W.ignite(ds) : 0;
        H.ledger.update(lt, { fill, seam: ds >= 0 ? lerp(10, 5, ease.out(clamp(ds / 0.25))) : 3, burst: -1 });
        LX.update(lt, { fill, front: ds, speed: 90, k: 16, flare: ds >= 0 ? Math.exp(-ds / 0.15) : 0 });
        H.foreman.update(lt, { lit: 0, rimColor: W.C.clay, rimK: 0.15 });
        M.update(t, { k: 1.4, drift: [0.1, 0.5, 0.2] });
        H.extra.length = 0; H.extra.push({ p: p.toArray(), c: W.C.clay, k: 8, pool: 0, refl: 0.6, size: 0.4 });
        H.update(lt, { sky: 1.4 });
        // camera: chases the orb, then settles tight on the slot with a small recoil on the stamp
        const cu = Math.pow(clamp(lt / TS), 1.7);
        const cp = camPath.getPointAt(cu);
        if (ds > 0) cp.z += -0.25 * Math.sin(Math.min(ds, 0.25) / 0.25 * Math.PI) * Math.exp(-ds * 4);
        const look = p.clone().lerp(new THREE.Vector3(SLOT[0], SLOT[1] - 0.1, SLOT[2]), ease.inOut(clamp((cu - 0.3) / 0.7)));
        const roll = lerp(-4, 0, ease.inOut(clamp(lt / TS)));
        camFX(camera, t, W.camLook(camera, cp.toArray(), look.toArray(), W.FOV[35], { roll }));
      },
    };
    return R;
  },
});
