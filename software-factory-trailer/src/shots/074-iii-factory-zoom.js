// iii-factory-zoom — TOP-DOWN POWERS-OF-TEN log zoom (35mm, straight down, camera.up fixed): one amber work card with code on its face
// fills the frame -> the REVIEW station flowing -> the whole lit line (7 stations, 8 bank pools, cards gliding L->R) -> the hall, as the
// 1,000-rail network lights radially from CODE and streams amber (the cold-open cascade paid off), fog clearing. At the top edge the
// foreman's footprint is still a dark stepped square. THE SOFTWARE FACTORY. lands as the zoom settles.
import { shot, beats, ease, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b6.js';
const { THREE } = W;

const p2 = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);   // power2.inOut

shot({
  id: 'iii-factory-zoom', dur: beats(6, 150), act: 'III',
  music: { section: 'act3', chord: 'Bbmaj', div: 16, energy: 0.85, add: ['pad', 'strings', 'pulse', 'ostinato', 'kick', 'drums', 'hats', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0.5, 'A');
    ctx.sfx(0, 'whoosh', { gain: -6 });
    ctx.sfx(0.5, 'impact', { gain: -2 });
    const { scene, camera } = W.stage({ act: 'III', fog: 0.004 });
    const H = W.hall(scene, { state: 'lit', parts: { rails: true } });
    const LC = B.lineCards({}); scene.add(LC.mesh);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 1.9), new THREE.MeshBasicMaterial({ map: B.cardFaceTexture(), color: W.hcol(0xffffff, 0.95), toneMapped: false, transparent: true }));
    face.rotation.x = -Math.PI / 2; face.position.set(0, 3.703, 0); scene.add(face);
    const grade = W.grade('III');
    return { scene, camera, ...grade, update(lt) {
      const t = B.T(ctx, lt);
      H.banks.update(lt, { on: 1, t, housing: false, beam: 0.35 });
      H.line.update(lt, { lit: 1, strips: 1 });
      H.rails.update(lt, { cascade: (lt - 0.3) * 1.15, flow: 30, t, k: 5 });
      H.foreman.update(lt, { lit: 0, rimColor: W.C.amber, rimK: 0.25 });
      LC.update(lt);
      const hx = LC.heroX(lt);
      face.position.x = hx;
      H.update(lt, { lit: 1, sky: 0.6 });
      const e = p2(clamp(lt / 1.4));
      let d = 2 * Math.pow(260, e); if (lt > 1.4) d *= 1 + 0.02 * (lt - 1.4);
      scene.fog.density = Math.min(0.03, W.fogKeep(d + 4, 0.82));
      const cx = lerp(hx, 1.4, ease.inOut(clamp(e * 1.6)));
      camFX(camera, t, W.camTop(camera, cx, 3.7 + d, 0.01, W.FOV[35]));
    } };
  },
  ui(root, tl, K) {
    const sc = B.scrim(K, root, { y: 868, h: 300, a: 0.4 });
    K.cutIn(tl, sc, 0.5);
    const el = K.text(root, { y: 868, cls: 'slam', html: 'THE SOFTWARE FACTORY.', style: { fontWeight: 900, fontSize: '136px', letterSpacing: '-0.03em', color: '#FAF9F5', textShadow: '0 8px 50px rgba(0,0,0,0.6)' } });
    const chars = K._chars(el);
    gsap.set(chars, { autoAlpha: 0, transformPerspective: 700, transformOrigin: '50% 60%' });
    tl.fromTo(chars, { autoAlpha: 0, rotationX: -100, y: 30, filter: 'blur(6px)' },
      { autoAlpha: 1, rotationX: 0, y: 0, filter: 'blur(0px)', duration: 0.4, ease: 'expo.out', stagger: { each: 1 / 30, from: 'center' }, immediateRender: false }, 0.5);
    K.push(tl, el, 0.9, 1.5, { from: 1, to: 1.03 });
  },
});
