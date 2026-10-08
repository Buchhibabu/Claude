// iii-bank-3 — MACRO 85mm on bank 3's brass relay (the ii-alarm-c rig, now warm). The armature slams shut on the beat and chatters on
// twos; the helical filament that burned red flares warm white, sparks jump the contacts, the brass and the copper coil catch the light.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE } = W;

shot({
  id: 'iii-bank-3', dur: beats(1, 150), act: 'III',
  music: { section: 'turn', chord: 'Bb', div: 8, energy: 0.6699999999999999, add: ['strings', 'pulse', 'kick', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'boom', { gain: -1 });
    const { scene, camera, lights } = B.cascadeStage(3, { fog: 0.006 });
    lights.key.intensity = 0.0; lights.amb.intensity = 0.006; lights.rim.intensity = 0.08;
    const H = W.hall(scene, { state: 'dark', parts: { foreman: false } });
    H.banks.relays[2].g.visible = false;
    const RP = [W.BANK_X[2], 60.4, 6];
    const RL = B.relayHero({ pos: RP }); scene.add(RL.group);
    const filC = [RP[0] + 0.3, RP[1] + 0.8, RP[2] - 0.5];
    const key = new THREE.PointLight(0xffc890, 0, 7, 1.7); key.position.set(filC[0] + 0.2, filC[1] + 0.15, filC[2] + 0.1); scene.add(key);
    const back = new THREE.PointLight(0xffb070, 0, 14, 1.4); back.position.set(RP[0] - 1.0, RP[1] + 2.2, RP[2] - 2.6); scene.add(back);
    const fl = W.flare({ color: W.C.bankOn, k: 0, size: 1.6, ref: 0.3 }); fl.position.set(...filC); scene.add(fl);
    const tip = RL.tipWorld();
    const sp = B.sparks({ count: 160, at: [RP[0] + 0.73, RP[1] + 1.02, RP[2]], speed: [1.0, 3.2], up: 1.5, size: 0.022, seed: 33 }); scene.add(sp.points);
    const cfl = W.flare({ color: W.C.bankOn, k: 0, size: 1.2, ref: 0.3 }); cfl.position.set(RP[0] + 0.73, RP[1] + 1.03, RP[2] + 0.05); scene.add(cfl);
    const bk = B.bokeh({ count: 18, center: [RP[0] - 34, RP[1] - 10, RP[2] - 44], spread: [60, 14, 24], size: [2.5, 6.5], seed: 3 }); scene.add(bk.group);
    const grade = W.bankGrade(3);
    grade.bloom = { strength: 0.95, radius: 0.4, threshold: 0.84 }; grade.exposure = 0.9; grade.vignette = 0.6;
    // slam on the beat, chatter on twos: closed, bounce, closed, small bounce, closed
    const chatter = (lt) => [1, 0.55, 1, 0.82, 1, 1][Math.min(5, Math.floor(lt * 15))];
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      const on = B.bankOn(3, lt);
      H.banks.update(lt, { on, t, dust: 0.4 });
      const st = on.slice(0, 7).map((v) => clamp(v));
      H.line.update(lt, { lit: st, strips: st, red: 0 });
      const o = on[2], c = chatter(lt);
      RL.update(lt, { closed: c, fil: 9 * o * (c > 0.99 ? 1 : 0.55) });
      key.intensity = 0.16 * o * (c > 0.99 ? 1 : 0.6); back.intensity = 0.5 * o;
      fl.userData.set(lerp(1.8, 0.9, clamp(lt / 0.25)) * o, W.C.bankOn);
      const arc = c > 0.99 ? Math.exp(-((lt * 15) % 2) * 1.2) : 0;           // a contact arc each time it closes
      cfl.userData.set(2.5 * arc * o, W.C.bankOn);
      sp.update(lt, { k: 4 });
      bk.update(0.8 * o + 0.2);
      H.update(lt, { lit: B.hallLit(3, on), sky: 0.4 });
      const u = clamp(lt / ctx.T);
      camFX(camera, t, W.camLook(camera, [RP[0] + 3.7 - 0.3 * u, RP[1] + 1.45, RP[2] + 8.2 - 0.45 * u], [RP[0] + 0.0, RP[1] + 0.6, RP[2] - 0.1], W.FOV[85]));
    } };
  },
});
