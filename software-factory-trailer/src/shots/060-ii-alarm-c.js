// 60 ii-alarm-c — cut 3 of 4 (0.25 s, luminance-matched). MACRO 85mm on bank 5's brass relay (the exact rig and framing that
// iii-bank-3 mirrors warm): frame 0 the armature hangs open over a dark housing, red alarm bokeh breathing behind; frame 1 it SLAMS
// shut — a red contact arc + spark spray, the helical filament overshoots and burns red, the brass catches it. Banks 5-6 glow red beyond.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as B from './lib/b5-act2b.js';
import { relayHero, sparks } from './lib/b6.js';
const { W, THREE } = B;

shot({
  id: 'ii-alarm-c', dur: beats(0.5), act: 'II',
  music: { section: 'act2', chord: 'Dm', div: 32, energy: 0.94, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera, lights } = B.act2(ctx, { fog: 0.006 });
    lights.key.intensity = 0.0; lights.amb.intensity = 0.006; lights.rim.intensity = 0.08;
    ctx.sfx(0, 'boom', { gain: -6 });
    const H = W.hall(scene, { state: 'dark', parts: { foreman: false } });
    H.banks.relays[4].g.visible = false;
    const RP = [W.BANK_X[4], 60.4, 6];
    const RL = relayHero({ pos: RP }); scene.add(RL.group);
    const filC = [RP[0] + 0.3, RP[1] + 0.8, RP[2] - 0.5];
    const key = new THREE.PointLight(W.C.red, 0, 7, 1.7); key.position.set(filC[0] + 0.2, filC[1] + 0.15, filC[2] + 0.1); scene.add(key);
    const back = new THREE.PointLight(W.C.red, 0, 14, 1.4); back.position.set(RP[0] - 1.0, RP[1] + 2.2, RP[2] - 2.6); scene.add(back);
    const fl = W.flare({ color: W.C.red, k: 0, size: 1.6, ref: 0.3 }); fl.position.set(...filC); scene.add(fl);
    const sp = sparks({ count: 140, at: [RP[0] + 0.73, RP[1] + 1.02, RP[2]], speed: [1.0, 3.4], up: 1.5, color: 0xff7a5a, size: 0.022, seed: 60 }); scene.add(sp.points);
    const cfl = W.flare({ color: 0xff7a5a, k: 0, size: 1.3, ref: 0.3 }); cfl.position.set(RP[0] + 0.73, RP[1] + 1.03, RP[2] + 0.05); scene.add(cfl);
    // alarm bokeh far behind: banks 1-6 seen out of focus through the haze
    const BK = [];
    for (let i = 0; i < 14; i++) { const s = B.bokeh({ color: W.C.red, k: 0.3, size: 2.6 + (i % 4) * 1.1 }); s.position.set(RP[0] - 46 + i * 6.5 + Math.sin(i * 7.3) * 3, RP[1] - 6 + Math.sin(i * 3.1) * 5, RP[2] - 40 - (i % 3) * 8); scene.add(s); BK.push(s); }
    const SLAM = 1 / 30;
    const CL = [0, 1, 0.82, 1, 1, 1, 1, 1];                 // armature: open, slam, bounce, closed
    const g = B.grade2({ vignette: 0.62, bloom: { strength: 0.95, radius: 0.4, threshold: 0.82 }, exposure: 1.12 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const c = B.frameTab(lt, CL);
        const dt = lt - SLAM;
        const ig = W.ignite(dt);
        H.banks.update(lt, { on: 0, alarm: [1, 1, 1, 1, c > 0.5 ? 1 : 0, c > 0.5 ? 1 : 0, 0, 0], t, beam: 2.2, relay: [1, 1, 1, 1, c, c, 0, 0] });
        H.line.update(lt, { lit: 0, dim: 0.3, red: 1 });
        RL.update(lt, { closed: c, fil: 9 * ig, filColor: W.C.red });
        key.intensity = 0.22 * ig; back.intensity = 0.6 * ig;
        fl.userData.set(1.8 * ig, W.C.red);
        cfl.userData.set(dt < 0 ? 0 : 3.2 * B.impulse(lt, SLAM, 0.06), 0xff7a5a);
        sp.update(dt < 0 ? -1 : dt, { k: 5 });
        const pulse = lerp(0.6, 1, 0.5 + 0.5 * Math.cos((t / 0.5) * Math.PI * 2));
        BK.forEach((s, i) => s.userData.set(0.22 * pulse * (i < 10 || c > 0.5 ? 1 : 0.15)));
        H.update(lt, { sky: 0.5 });
        // the iii-bank-3 framing (85mm, front-right, slightly above), creep + a jolt on the slam
        const u = clamp(lt / ctx.T);
        const j = 0.05 * B.impulse(lt, SLAM, 0.05);
        W.camLook(camera, [RP[0] + 3.7 - 0.3 * u, RP[1] + 1.45 - j, RP[2] + 8.2 - 0.45 * u], [RP[0], RP[1] + 0.6 - j * 0.6, RP[2] - 0.1], W.FOV[85]);
        W.handheld(camera, t, 0.2, 60);
        camFX(camera, t, W.FOV[85]);
      },
    };
  },
});
