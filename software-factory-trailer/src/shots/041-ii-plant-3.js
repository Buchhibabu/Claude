// 41 ii-plant-3 — PLANT 3: the scope. 200mm telephoto from 500u out (foremanPlant recipe, fog 1.27/710): the whole line is jammed —
// the REVIEW, TEST and DEPLOY card masses compressed side by side, striped and red-pinpointed, and behind them the UNLIT foreman's
// stepped obsidian mass fills the frame as a dark wall rising out of the top, its dead-brass courses faintly catching the red.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b4-act2a.js';
import { foremanCourses } from './lib/b2-act1a.js';
const { THREE, C } = W;

shot({
  id: 'ii-plant-3', dur: beats(2), act: 'II',
  music: { section: 'act2', chord: 'Bb', div: 8, energy: 0.7, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'impact', { gain: -10 });

    const { scene, camera } = W.stage({ act: 'II', fog: 0.0018 });
    const H = W.hall(scene, { state: 'dark', parts: { banks: false } });
    H.pillars.mesh.visible = false;   // the near pillar rows would bar the telephoto frame
    const rev = B.towerMass({ name: 'review', nx: 5, nz: 3, maxH: 48, seed: 3, pinsPerLevel: 3, pinEvery: 4, taper: 0.4 });
    const test = B.towerMass({ name: 'test', nx: 3, nz: 3, maxH: 40, seed: 5, pinsPerLevel: 3, pinEvery: 4, taper: 0.4 });
    const dep = B.towerMass({ name: 'deploy', nx: 3, nz: 3, maxH: 30, seed: 7, pinsPerLevel: 3, pinEvery: 4, taper: 0.4 });
    scene.add(rev.group, test.group, dep.group);
    // the foreman's stone courses in dead brass (the same read as plants 1 and 2), catching red
    const courses = foremanCourses({ k: 0.3, color: 0x6a3a30 }); scene.add(courses);
    // red under-glow on the foreman's lower face: the pinpoints' spill travelling 200u back
    const spill = B.glowCard({ w: 150, h: 60, color: C.red, k: 0.08, falloff: 1.8 }); spill.position.set(20, 30, -139); scene.add(spill);
    // haze layers between the towers and the foreman (atmospheric separation of the two planes)
    const hz1 = B.glowCard({ w: 260, h: 70, color: 0x2a3a4a, k: 0.16, falloff: 1.4 }); hz1.position.set(20, 20, -60); scene.add(hz1);
    const redAir = B.glowCard({ w: 240, h: 40, color: C.red, k: 0.05, falloff: 1.6 }); redAir.position.set(20, 26, -100); scene.add(redAir);
    // alarm air: a low red haze hanging around the jammed crowns (the pinpoints' light in the fog)
    const crownAir = B.glowCard({ w: 90, h: 34, color: C.red, k: 0.07, falloff: 1.8 }); crownAir.position.set(21, 40, -6); scene.add(crownAir);
    const hz2 = B.glowCard({ w: 300, h: 120, color: 0x1c2733, k: 0.14, falloff: 1.2 }); hz2.position.set(10, 60, -120); scene.add(hz2);

    const CAM = [60, 25, 500], TG = [10, 50, -200];
    return {
      scene, camera, ...W.grade('II'),
      update(lt) {
        const t = ctx.shot.start + lt;
        rev.update(lt, { h: 46, t, pinDiv: 2, k: 2.0, body: 1.4 });
        test.update(lt, { h: 37, t, pinDiv: 2, k: 2.0, body: 1.4 });
        dep.update(lt, { h: 28, t, pinDiv: 2, k: 2.0, body: 1.4 });
        const pulse = W.beatPulse(t, { div: 2, decay: 5 });
        H.foreman.update(lt, { lit: 0, rimColor: C.red, rimK: 0.2 + 0.12 * pulse, bounce: 1.6 });
        courses.userData.set(0.9 + 0.35 * pulse);
        crownAir.userData.set(0.06 + 0.035 * pulse, C.red);
        H.line.update(lt, { lit: 0, dim: 0.5, red: [0, 0, 0, 0.8, 0.8, 0.8, 0] });
        H.extra.length = 0;
        H.extra.push(...rev.sources(), ...test.sources(), ...dep.sources());
        H.update(lt, { sky: 3.2 });
        const fov = W.camPlant(camera, scene, [CAM[0] - 8 * lt, CAM[1], CAM[2]], TG, W.FOV[200]);   // slight truck: parallax towers vs wall
        W.handheld(camera, t, 0.3, 41);
        camFX(camera, t, fov);
      },
    };
  },
});
