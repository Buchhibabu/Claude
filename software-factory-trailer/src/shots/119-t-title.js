// t-title — the light-line forge. On BRAAM #4 a clay -> ivory HDR light line (titleForge) grows from the centre (exactly where the
// foreman core sat in p-core-stutter) to 70% width in 8 f with an anamorphic streak; at 0.3 it splits vertically and the two rules
// open the lockup CLAUDE / OPUS 5.5 between them (2D clip locked to the 3D rule positions); a brass mask-band sweeps the letterforms
// over 24 f from 0.5; embers drift up; +1.5 EV bloom on the hit decaying over 20 f; 2% push. 4.3: type out, embers alone.
import { shot, beats, camFX, clamp, lerp, ease } from '../engine.js';
import * as W from './lib/world.js';

const SPLIT_PX = 330;                 // final gap between the two rules (px): frames CLAUDE (cap top ~441) and OPUS 5.5 (baseline ~663)
const PUSH = 0.02;
const forgeGap = (lt) => (lt < 0.3 ? 0 : SPLIT_PX * ease.expoOut(clamp((lt - 0.3) / 0.5)));
const pushScale = (lt, T) => 1 / (1 - PUSH * clamp(lt / T));

shot({
  id: 't-title', dur: beats(12, 150), act: 'TITLE',
  music: { section: 'end', chord: 'Dsus', div: 4, energy: 0.8, add: ['pad', 'strings', 'drone'], drop: [] },
  three(ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.hit(0, 'S');
    ctx.fx.flash(0, 0.067, { peak: 0.9 });
    ctx.sfx(0, 'braam', { root: 'D1', gain: 0 });
    ctx.sfx(0, 'impact', { gain: 0 });
    ctx.sfx(0, 'sub_drop', { gain: -4 });
    ctx.sfx(0.1, 'shimmer', { gain: -6 });
    const { scene, camera } = W.stage({ act: 'TITLE', fog: 0 });
    const F = W.titleForge({}); scene.add(F.group);
    const out = {
      scene, camera, ...W.grade('TITLE', { bloom: { strength: 1.0, radius: 0.32, threshold: 0.74 }, vignette: 0.55 }),
      update(lt) {
        const t = ctx.shot.start + lt;
        const on = lt < 4.3;
        const grow = !on ? 0 : lt < 0.3 ? ease.expoOut(clamp(lt / 0.267)) : lerp(1, 0.72, ease.inOut(clamp((lt - 0.3) / 1.0)));
        const k = lt < 0.3 ? 12 : lerp(12, 4.5, ease.out(clamp((lt - 0.3) / 0.8)));
        F.update(lt, { grow, split: forgeGap(lt) / 120, k, warm: clamp(lt / 0.6), embers: lt < 0.25 ? 0.4 : 0.75, t: lt + 2 });
        // +1.5 EV bloom on the hit, decaying over 20 f
        out.bloom.strength = W.bloomHit(0.85, lt, { peak: 2.6, d: 0.67 });
        camFX(camera, t, W.camTitle(camera, lt, { dur: ctx.T, push: PUSH }));
      },
    };
    return out;
  },
  ui(root, tl, K, ctx) {
    const ivory = '#FAF9F5';
    // lockup container (full frame) clipped to the gap between the two rules and pushed with the camera
    const mk = (sweep) => {
      const box = K.el('div', { style: { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', transformOrigin: '960px 540px' } }, root);
      const sweepCss = sweep ? { color: 'transparent', backgroundImage: 'linear-gradient(105deg, rgba(232,180,122,0) 38%, rgba(184,138,90,0.85) 45%, #F3D9B1 49%, #fff3dc 50%, #F3D9B1 51%, rgba(184,138,90,0.85) 55%, rgba(232,180,122,0) 62%)', backgroundSize: '320% 100%', backgroundRepeat: 'no-repeat', WebkitBackgroundClip: 'text', backgroundClip: 'text' } : {};
      const a = K.text(box, { x: 960, y: 470, w: 1700, cls: 'title', html: 'CLAUDE', style: { fontSize: '80px', fontWeight: 300, letterSpacing: '0.3em', paddingLeft: '0.3em', color: ivory, ...sweepCss } });
      const b = K.text(box, { x: 960, y: 590, w: 1800, cls: '', html: sweep ? 'OPUS 5.5' : 'OPUS <span class="hot">5.5</span>', style: { fontFamily: "'Inter Tight', sans-serif", fontWeight: 900, fontSize: '200px', lineHeight: '1', letterSpacing: '-0.025em', color: ivory, fontVariantNumeric: 'tabular-nums', textShadow: sweep ? 'none' : '0 0 28px rgba(255,170,120,0.22)', ...sweepCss } });
      return { box, a, b };
    };
    const base = mk(false), sw = mk(true);
    const apply = (lt) => {
      const g = forgeGap(lt), inset = Math.max(0, 540 - g / 2 + 2);
      const s = pushScale(lt, ctx.T);
      const vis = lt >= 0.3 && lt < 4.3;
      for (const L of [base, sw]) {
        L.box.style.clipPath = `inset(${inset.toFixed(1)}px 0px ${inset.toFixed(1)}px 0px)`;
        L.box.style.transform = `scale(${s.toFixed(5)})`;
        L.box.style.visibility = vis ? 'visible' : 'hidden';
        const ls = lerp(0.42, 0.3, ease.out(clamp((lt - 0.3) / 1.4)));
        L.a.style.letterSpacing = ls.toFixed(3) + 'em'; L.a.style.paddingLeft = ls.toFixed(3) + 'em';
      }
      // brass mask-band sweep across the letterforms: 24 f from 0.5
      const u = clamp((lt - 0.5) / 0.8);
      sw.box.style.opacity = u > 0 && u < 1 ? '1' : '0';
      const pos = lerp(100, 0, ease.inOut(u)).toFixed(2) + '% 0%';
      sw.a.style.backgroundPosition = pos; sw.b.style.backgroundPosition = pos;
    };
    const o = { lt: 0 };
    apply(0);
    tl.fromTo(o, { lt: 0 }, { lt: ctx.T, duration: ctx.T, ease: 'none', immediateRender: false, onUpdate: () => apply(o.lt) }, 0);
  },
});
