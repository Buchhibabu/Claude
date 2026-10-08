// 57 ii-human-red — the red reaches the person. HIGH ANGLE -50 deg, 24mm, the human dead centre at the foot of the card scree under
// the REVIEW mass (the ii-line-waits-2 set, humanUnderSet). Frame 0-1: the cold ice rim. Frame 2: the human's own station lamp (a
// slim post at their right hand) fails red with a strike flicker; the rim follows ice -> #FF453A a frame later — rim + its small floor
// pool only, never a field. Slow descending orbit (crane down + 4 deg yaw) so the silhouette turns against the red pool.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as B from './lib/b5-act2b.js';
import * as M from './lib/b4-act2a.js';
const { W, THREE } = B;

shot({
  id: 'ii-human-red', dur: beats(1), act: 'II',
  music: { section: 'act2', chord: 'C', div: 32, energy: 0.9, add: ['pulse', 'ostinato', 'kick', 'drums', 'drone', 'heart'], drop: [] },
  three(ctx) {
    const { scene, camera, lights } = B.act2(ctx, { fog: 0.008 });
    lights.key.intensity = 0.025; lights.amb.intensity = 0.006; lights.rim.intensity = 0.12;   // high angle sees the scree's tops: keep them dark
    ctx.sfx(0, 'heartbeat', { gain: -4 });
    ctx.sfx(0, 'boom', { gain: -6 });
    const U = M.humanUnderSet(scene, { state: 'dark', reviewMax: 600, testMax: 340 });
    const HC = M.HUMAN_C;
    // seen from 50 deg above, the default fresnel (pow 2.2) lights the whole body: tighten it to a thin rim so it stays a silhouette
    U.human.human.traverse((o) => { if (o.isMesh && o.material.uniforms && o.material.uniforms.uPow) o.material.uniforms.uPow.value = 4.5; });
    // seen from above, the scree's big top faces read as grey slabs: darken their bodies (edges carry the read)
    for (let i = 0; i < U.spillI.count; i++) U.spillI.color(i, W.CARD.edge(1.0), W.CARD.body(0.12));
    U.spillI.commit();
    // the human's station lamp: slim dark post + lamp head
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.25, 0.07), new THREE.MeshStandardMaterial({ color: 0x0b0c0e, metalness: 0.6, roughness: 0.4 }));
    const LP = [HC[0] + 1.25, 0, HC[2] + 0.35];
    post.position.set(LP[0], 0.62, LP[2]); scene.add(post);
    const lamp = W.orbs({ count: 1, r: 0.085, seg: 12 }); scene.add(lamp.mesh);
    const lampF = W.flare({ color: W.C.ice, k: 0, size: 1.1, ref: 0.12 }); lampF.position.set(LP[0], 1.3, LP[2]); scene.add(lampF);
    const lampL = new THREE.PointLight(W.C.ice, 0, 5, 1.5); lampL.position.set(LP[0], 1.35, LP[2]); scene.add(lampL);
    const ice = new THREE.Color(W.C.ice), red = new THREE.Color(W.C.red), mix = new THREE.Color();
    const LAMP = [0, 0, 1, 0.15, 1, 0.4, 1];             // per-frame strike flicker of the lamp (fails at frame 2)
    const RIM = [0, 0, 0, 0.5, 0.85, 1];                 // the rim follows a frame later
    const g = B.grade2({ vignette: 0.62 });
    return {
      scene, camera, ...g,
      update(lt) {
        const t = B.gt(ctx, lt);
        const lw = B.frameTab(lt, LAMP), rw = B.frameTab(lt, RIM);
        mix.copy(ice).lerp(red, rw);
        const rimHex = mix.getHex();
        U.update(lt, { t, review: 600, test: 320, red: 1, rim: rimHex, rimK: lerp(3.6, 5.5, rw), poolK: lerp(1, 0.55, rw), sky: 2.4, pinDiv: 2 });
        // red is the rim + a tight pool only: tame the set's floor pool and the human's back light (it washed the scree)
        const pool = U.H.extra[0]; pool.k = lerp(2.4, 3.2, rw); pool.pool = 1.7; pool.poolK = 1.1; pool.refl = 0.9;
        if (U.human.light) U.human.light.intensity *= 0.16;
        const lc = lw > 0.5 ? W.C.red : W.C.ice;
        lamp.set(0, { p: [LP[0], 1.3, LP[2]], c: W.lin(lc), k: lw > 0.5 ? 12 * lw : 4 }); lamp.commit();
        lampF.userData.set(lw > 0.5 ? 3.2 * lw : 0.8, lc);
        lampL.color.set(lc); lampL.intensity = lw > 0.5 ? 2.2 * lw : 0.6;
        U.H.extra.push({ p: [LP[0], 1.3, LP[2]], c: lc, k: lw > 0.5 ? 3 * lw : 0.8, pool: 1.6, poolK: 1.2, refl: 0.6, size: 0.2 });
        U.H.update(lt, { sky: 2.4 });
        // high angle -50 deg, 24mm: crane down 6% + yaw 4 deg around the human
        const u = ease.out(clamp(lt / ctx.T));
        const D = 8.6 * (1 - 0.06 * u);
        const pitch = THREE.MathUtils.degToRad(50 - 2 * u), yaw = THREE.MathUtils.degToRad(-3 + 4 * u);
        const tg = [HC[0], 0.85, HC[2]];
        const pos = [tg[0] + Math.sin(yaw) * Math.cos(pitch) * D, tg[1] + Math.sin(pitch) * D, tg[2] + Math.cos(yaw) * Math.cos(pitch) * D];
        W.camLook(camera, pos, tg, W.FOV[24]);
        W.handheld(camera, t, 0.3, 57);
        camFX(camera, t, W.FOV[24]);
      },
    };
  },
});
