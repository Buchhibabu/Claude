// 006 c-next-one — the tease of the next wave: 135mm straight down from 600u on the WHOLE line lit (7 stations amber, rails flowing
// L->R), telephoto-flattened, veiled by drifting haze decks (half revealed, x2 fog, -1 stop); frame yaws 6 deg/s.
// THE NEXT ONE? resolves from blur + wide tracking (asked, never claimed).
import { shot, beats, camFX, clamp, lerp } from '../engine.js';
import * as W from './lib/world.js';
import * as B from './lib/b1-cold.js';

shot({
  id: 'c-next-one', dur: beats(3), act: 'COLD',
  music: { section: 'cold', chord: 'Dm', div: 8, energy: 0.65, add: ['pulse'], drop: [] },
  three(ctx) {
    const { scene, camera } = W.stage({ act: 'COLD' });
    const H = W.hall(scene, { state: 'cold', parts: { banks: false, rails: true, foreman: false, tower: true } });
    const SF = B.stationFlow({ skip: [W.ST.CODE] }); scene.add(SF.mesh);
    const CB = B.circuitBoard({ seed: 219, radius: 120, buses: 170, rails: false }); scene.add(CB.group);
    CB.ring.visible = false;
    const hz = B.hazeDecks({ heights: [140, 260, 400], size: 300, opacity: 0.38, color: 0x2a1d14, glow: 0x4a2e18 });
    H.floor.setGrid(0.35);

    // warm light pooled under every lit station (reads 'lit' from 600u up)
    H.extra.push(...W.STATIONS.map((st) => ({ p: [st.cx, 4, 0], c: st.i === W.ST.CODE ? W.C.clay : W.C.amber, k: 5, pool: 12, poolK: 0.7, refl: 0, size: 6 }))); scene.add(hz.group);
    const gr = W.grade('COLD');
    return {
      scene, camera, ...gr,
      update(lt) {
        const t = ctx.shot.start + lt;
        H.rails.update(lt, { cascade: 99, flow: 30, t, k: 4 });
        CB.update(lt, { cascade: 99, k: 1.6, hotK: 0, t, pulse: 1, ring: 0, coreK: 4 });
        H.line.update(lt, { lit: 1, strips: 0, conveyorK: 3 });
        SF.update(lt, { speed: 7, k: 3, t, body: 0.55 });
        H.tower.update(lt, { count: 1000, k: 9, crest: 0, t });
        hz.update(lt, { drift: 1 });
        H.update(lt, { lit: 1 });
        scene.fog.density = W.fogKeep(600, 0.55);
        this.bloom.strength = W.bloomHit(1.2, lt, { peak: 1.5, d: 0.4 });
        camFX(camera, t, W.camTop(camera, 0, 600, 0, W.FOV[135], 6 * lt));
      },
    };
  },
  ui(root, tl, K, ctx) {
    ctx.fx.bars(0, 138);
    ctx.fx.hit(0, 'B');
    ctx.sfx(0, 'boom', { gain: -3 });
    ctx.sfx(0.05, 'bell', { gain: -10 });
    const sc = B.scrim(K, root, { x: 960, y: 540, w: 1900, h: 360, a: 0.6 });
    K.cutIn(tl, sc, 0); K.cutOut(tl, sc, 1.45);
    const q = K.text(root, { x: 960, y: 540, w: 1900, cls: 'title', html: 'THE NEXT ONE?',
      style: { fontSize: '110px', color: '#FAF9F5', whiteSpace: 'nowrap', textShadow: '0 0 40px rgba(0,0,0,0.7)' } });
    gsap.set(q, { autoAlpha: 0 });
    tl.fromTo(q, { autoAlpha: 0, letterSpacing: '0.45em', filter: 'blur(28px)' }, { autoAlpha: 1, letterSpacing: '0.08em', filter: 'blur(0px)', duration: 24 / 30, ease: 'expo.out', immediateRender: false }, 0.05);
    K.push(tl, q, 0.05, 1.4, { from: 1.0, to: 1.04 });
    K.cutOut(tl, q, 1.45);
  },
});
