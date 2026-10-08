// Kinetic typography + 2D helpers for trailer shots. Attached to window.SF_K (classic script, GSAP global).
// All animation goes on the shot's timeline `tl` at local times, so any frame can be rendered in any order.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const K = {
    el(tag, attrs = {}, parent) {
      const svg = ['svg', 'g', 'path', 'line', 'circle', 'rect', 'text', 'tspan', 'polyline', 'polygon', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'ellipse'].includes(tag);
      const n = svg ? document.createElementNS(NS, tag) : document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
        else n.setAttribute(k, v);
      }
      if (parent) parent.appendChild(n);
      return n;
    },
    // Absolutely positioned text block. align: 'center' centers on (x,y); 'left' anchors left-middle.
    text(parent, { x = 960, y = 540, w = 1700, cls = 'slam', html = '', align = 'center', style = {} } = {}) {
      const d = K.el('div', { class: 'tx ' + cls, html }, parent);
      Object.assign(d.style, { position: 'absolute', width: w + 'px', left: (align === 'center' ? x - w / 2 : x) + 'px', top: y + 'px', textAlign: align, transform: 'translateY(-50%)' }, style);
      return d;
    },
    svg(parent) {
      return K.el('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'position:absolute;left:0;top:0;overflow:visible' }, parent);
    },

    // ---------- entrances
    // Slam: from big + blurred to crisp, fast (trailer card hit).
    slam(tl, el, at, { from = 1.35, blur = 18, d = 0.32, ease = 'expo.out' } = {}) {
      tl.fromTo(el, { autoAlpha: 0, scale: from, filter: `blur(${blur}px)` }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: d, ease, immediateRender: false }, at);
      gsap.set(el, { autoAlpha: 0 });
      return el;
    },
    // Giant: starts huge (fills frame) and settles — for numbers/title drops.
    giant(tl, el, at, { from = 4, d = 0.7, ease = 'expo.out' } = {}) {
      tl.fromTo(el, { autoAlpha: 0, scale: from, filter: 'blur(10px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: d, ease, immediateRender: false }, at);
      gsap.set(el, { autoAlpha: 0 });
      return el;
    },
    // Mask up: each line rises out of a hard mask.
    maskUp(tl, el, at, { d = 0.55, stagger = 0.06, ease = 'expo.out' } = {}) {
      const lines = K._lines(el);
      lines.forEach((ln) => { ln.wrap.style.overflow = 'hidden'; });
      tl.fromTo(lines.map((l) => l.inner), { yPercent: 110 }, { yPercent: 0, duration: d, ease, stagger, immediateRender: false }, at);
      gsap.set(lines.map((l) => l.inner), { yPercent: 110 });
      return el;
    },
    // Letters: per-character stagger (y + blur), for titles.
    letters(tl, el, at, { d = 0.5, stagger = 0.025, y = 40, ease = 'expo.out' } = {}) {
      const chars = K._chars(el);
      tl.fromTo(chars, { autoAlpha: 0, y, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: d, ease, stagger, immediateRender: false }, at);
      gsap.set(chars, { autoAlpha: 0 });
      return chars;
    },
    // Tracking: letter-spacing collapses from wide to tight while fading in (cinematic title).
    tracking(tl, el, at, { from = '0.8em', to = '0.06em', d = 1.6, ease = 'expo.out' } = {}) {
      tl.fromTo(el, { autoAlpha: 0, letterSpacing: from }, { autoAlpha: 1, letterSpacing: to, duration: d, ease, immediateRender: false }, at);
      gsap.set(el, { autoAlpha: 0 });
      return el;
    },
    fadeIn(tl, el, at, { d = 0.4, y = 0 } = {}) {
      tl.fromTo(el, { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration: d, ease: 'power2.out', immediateRender: false }, at);
      gsap.set(el, { autoAlpha: 0 });
      return el;
    },
    // Hard cut in/out (trailers cut, they don't fade).
    cutIn(tl, el, at) { gsap.set(el, { autoAlpha: 0 }); tl.set(el, { autoAlpha: 1 }, at); return el; },
    cutOut(tl, el, at) { tl.set(el, { autoAlpha: 0 }, at); return el; },
    // Slow push while on screen (keeps cards alive).
    push(tl, el, at, d, { from = 1, to = 1.06 } = {}) { tl.fromTo(el, { scale: from }, { scale: to, duration: d, ease: 'none', immediateRender: false }, at); return el; },

    // Rolling counter. fmt(v) -> string.
    roll(tl, el, at, from, to, d = 0.9, fmt = (v) => Math.round(v).toLocaleString('en-US'), ease = 'expo.out') {
      const o = { v: from };
      el.textContent = fmt(from);
      tl.to(o, { v: to, duration: d, ease, onUpdate: () => { el.textContent = fmt(o.v); }, immediateRender: false }, at);
      return el;
    },
    // Typewriter: reveals characters of text over d seconds.
    typewriter(tl, el, at, d) {
      const full = el.textContent;
      const o = { n: 0 };
      el.textContent = '';
      tl.to(o, { n: full.length, duration: d, ease: 'none', onUpdate: () => { el.textContent = full.slice(0, Math.round(o.n)); }, immediateRender: false }, at);
      return el;
    },
    // Glitch-in: RGB split + jitter that settles.
    glitch(tl, el, at, { d = 0.35 } = {}) {
      const o = { g: 1 };
      gsap.set(el, { autoAlpha: 0 });
      tl.set(el, { autoAlpha: 1 }, at);
      tl.fromTo(o, { g: 1 }, { g: 0, duration: d, ease: 'power2.in', immediateRender: false, onUpdate: () => {
        const g = o.g, j = Math.sin(o.g * 97) * 18 * g;
        el.style.textShadow = g > 0.02 ? `${-10 * g}px 0 rgba(255,40,80,.9), ${10 * g}px 0 rgba(40,220,255,.9)` : 'none';
        el.style.transform = `translateY(-50%) translateX(${j.toFixed(1)}px) skewX(${(g * 8 * Math.sin(o.g * 40)).toFixed(1)}deg)`;
        el.style.clipPath = g > 0.05 ? `inset(${(Math.abs(Math.sin(g * 31)) * 30).toFixed(0)}% 0 ${(Math.abs(Math.cos(g * 17)) * 30).toFixed(0)}% 0)` : 'none';
      } }, at);
      return el;
    },

    // Decode: scrambled glyphs resolve left→right into the final text (tech-thriller title/label reveal).
    decode(tl, el, at, { d = 0.6, glyphs = '▮▯#%&@$*+=<>/\\|01', seed = 7 } = {}) {
      const full = el.textContent;
      let s = seed;
      const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      const table = Array.from({ length: 64 }, () => Array.from(full, () => glyphs[Math.floor(rnd() * glyphs.length)]));
      const o = { u: 0 };
      gsap.set(el, { autoAlpha: 0 });
      tl.set(el, { autoAlpha: 1 }, at);
      tl.fromTo(o, { u: 0 }, { u: 1, duration: d, ease: 'none', immediateRender: false, onUpdate: () => {
        const k = Math.floor(o.u * full.length * 1.0001), row = table[Math.floor(o.u * 63)];
        el.textContent = full.slice(0, k) + Array.from(full.slice(k), (c, i) => (c === ' ' ? ' ' : row[k + i])).join('');
      } }, at);
      return el;
    },
    // Stamp: hard cut-in at 1.18× that snaps to 1× in ~3 frames (punch on a hit; no blur).
    stamp(tl, el, at, { from = 1.18, d = 0.1 } = {}) {
      gsap.set(el, { autoAlpha: 0 });
      tl.set(el, { autoAlpha: 1, scale: from }, at);
      tl.to(el, { scale: 1, duration: d, ease: 'power3.out' }, at);
      return el;
    },
    // Wipe: hard-edged clip reveal (dir 'right' = left→right), optional light edge (glow line riding the wipe).
    wipe(tl, el, at, { d = 0.45, dir = 'right', ease = 'expo.out' } = {}) {
      const from = { right: 'inset(0 100% 0 0)', left: 'inset(0 0 0 100%)', up: 'inset(100% 0 0 0)', down: 'inset(0 0 100% 0)', center: 'inset(0 50% 0 50%)' }[dir];
      gsap.set(el, { clipPath: from });
      tl.fromTo(el, { clipPath: from }, { clipPath: 'inset(0 0% 0 0%)', duration: d, ease, immediateRender: false }, at);
      return el;
    },
    // Exit: fast scale-up + fade (card blows past camera) — use sparingly, hard cuts are the default.
    blowOut(tl, el, at, { to = 1.6, d = 0.18 } = {}) {
      tl.to(el, { scale: to, autoAlpha: 0, filter: 'blur(12px)', duration: d, ease: 'power2.in' }, at);
      return el;
    },

    // ---------- internals
    _chars(el) {
      if (el._chars) return el._chars;
      const out = [];
      const walk = (n) => {
        for (const c of [...n.childNodes]) {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            for (const ch of c.textContent) {
              if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); continue; }
              const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; frag.appendChild(s); out.push(s);
            }
            n.replaceChild(frag, c);
          } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
        }
      };
      walk(el);
      el._chars = out;
      return out;
    },
    _lines(el) {
      // Lines are split on <br>; each line wrapped for masking.
      if (el._lines) return el._lines;
      const parts = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = '';
      el._lines = parts.map((p) => {
        const wrap = K.el('span', { class: 'ln' }, el);
        const inner = K.el('span', { class: 'lni', html: p }, wrap);
        return { wrap, inner };
      });
      return el._lines;
    },
  };
  window.SF_K = K;
})();
