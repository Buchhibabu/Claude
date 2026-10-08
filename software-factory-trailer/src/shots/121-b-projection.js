// b-projection — the crane pull-up x10 from the lone cursor while the whole dark hall ignites outward in a radial amber wave from it
// (railNetwork cascade at 160 u/s + stations + banks + pillars, a light ring riding the wavefront); the foreman's lower tiers catch
// it last at the top edge of frame. The labelled projection lands on the hit: IF THE PATTERN HOLDS: / BUDGETS IN EARLY 2027. / PROJECTION.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';
import { scrim, WHISPER, shockRing } from './lib/b8-peak-end.js';
const { THREE } = W;

const WAVE = 0.5;                      // the ignition starts on the hit (card B)
const SPEED = 160;
const ORIGIN = [-19.6, 0, 0];
const p2 = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);   // power2.inOut

shot({
  id: 'b-projection', dur: beats(6), act: 'BUTTON',
  music: { section: 'end', chord: 'Dm', div: 4, energy: 0.3, add: ['ticks', 'piano', 'pad'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0.5, 'B');
    ctx.sfx(0.5, 'chirps', { gain: -8 });
    ctx.sfx(0.5, 'impact', { gain: -12 });
    ctx.sfx(0.5, 'bell', { gain: -12 });
    const { scene, camera } = W.stage({ act: 'BUTTON' });
    const H = W.hall(scene, { state: 'dark', parts: { cursor: true, rails: true } });
    const front = shockRing({ color: W.C.amberRail, r: 0.01, grow: 1, life: 99, k: 3, tube: 0.0035 });
    front.position.set(ORIGIN[0], 0.15, ORIGIN[2]); scene.add(front);
    const coldFog = new THREE.Color(W.C.fog), warmFog = new THREE.Color(W.C.fogWarm), fc = new THREE.Color();
    const out = {
      scene, camera, ...W.grade('BUTTON'),
      update(lt) {
        const t = ctx.shot.start + lt;
        const w = lt - WAVE;                                     // seconds since the wave left the cursor
        const reach = (x, z = 0) => WAVE + Math.hypot(x - ORIGIN[0], z - ORIGIN[2]) / SPEED;
        H.cursor.update(lt, { on: W.blink(lt, { bpm: 120 }), k: 10, flare: w >= 0 ? 0.25 + 1.2 * Math.exp(-w * 6) : 0 });
        H.rails.update(lt, { cascade: w, k: 6, flow: w > 0.8 ? 24 : 0, t });
        // stations ignite when the front reaches them
        const st = W.STATIONS.map((s) => W.ignite(lt - reach(s.cx)));
        H.line.update(lt, { lit: st.map((v) => clamp(v)), strips: st, stripK: 3, codeK: 8 });
        H.banks.update(lt, { on: W.BANK_X.map((x) => W.ignite(lt - reach(x) - 0.04)), t });
        // the foreman's seams catch it last (core-out ignition timed to the front reaching its foot)
        const tf = reach(0, -140);
        H.foreman.update(lt, lt > tf ? { lit: (lt - tf) * 1.6 } : { lit: 0, rimColor: W.C.clay, rimK: 0.4 });
        // the light ring riding the wavefront across the floor
        if (w > 0) { const r = SPEED * w; front.visible = true; front.scale.set(r, r, 1); front.material.color.set(W.C.amberRail).multiplyScalar(W.ko(3.2) * Math.exp(-w * 0.9)); }
        else front.visible = false;
        const L = clamp(w / 1.4);
        H.update(lt, { lit: L, sky: lerp(2.6, 1.2, L) });
        // grade: void -> warm radial ignition
        const g = ease.inOut(clamp(w / 1.6));
        out.sat = lerp(0.9, 1.05, g); out.exposure = lerp(0.9, 1.0, g); out.vignette = lerp(0.5, 0.42, g);
        out.tint[0] = lerp(1.0, 1.04, g); out.tint[2] = lerp(1.02, 0.95, g);
        out.bloom.strength = lerp(0.9, 1.1, g); out.bloom.threshold = lerp(0.8, 0.75, g);
        fc.copy(coldFog).lerp(warmFog, g); scene.fog.color.copy(fc); scene.background.copy(fc);
        scene.fog.density = lerp(0.005, 0.0032, g);
        // crane x10: from over the cursor up and back, tilting up so the hall (and the foreman's foot) fill the top of frame
        const u = p2(clamp(lt / ctx.T));
        const pos = [-19.6, lerp(8, 80, u), lerp(14, 62, u)];
        const tgt = [-19.6, lerp(2.5, 0, u), lerp(5.3, -62, u)];
        camFX(camera, t, W.camLook(camera, pos, tgt, W.FOV[24]));
      },
    };
    return out;
  },
  ui(root, tl, K, ctx) {
    const sc = scrim(root, K, { x: 960, y: 540, w: 1900, h: 520, a: 0.5 });
    K.fadeIn(tl, sc, 0, { d: 0.3 });
    const a = K.text(root, { x: 960, y: 420, w: 1800, cls: 'title', html: 'IF THE PATTERN HOLDS:', style: { fontSize: '90px', fontWeight: 300, letterSpacing: '0.12em', paddingLeft: '0.12em', color: '#FAF9F5' } });
    K.slam(tl, a, 0.0, { from: 1.04, blur: 16, d: 0.5, ease: 'power3.out' });
    const b = K.text(root, { x: 960, y: 560, w: 1860, cls: 'cond', html: 'BUDGETS IN EARLY <span class="hot">2027.</span>', style: { fontSize: '160px', color: '#FAF9F5', letterSpacing: '0.01em' } });
    K.slam(tl, b, 0.5, { from: 1.12, blur: 14, d: 0.22 });
    const c = K.text(root, { x: 960, y: 650, w: 800, cls: 'mono', html: 'PROJECTION', style: { ...WHISPER, paddingLeft: '0.18em' } });
    K.decode(tl, c, 0.6, { d: 0.5, seed: 27 });
    for (const el of [a, b, c, sc]) K.cutOut(tl, el, 2.5);
  },
});
