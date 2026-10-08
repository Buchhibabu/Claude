// Deterministic scene engine.
// Every frame is a pure function of time: the renderer calls SF.seek(t) and screenshots.
// Scenes register with SF.scene({ id, chapter, duration, build(root, tl, K) }).
// Consecutive scenes overlap by `overlap` seconds so transitions breathe instead of cutting.
(function () {
  const W = 1920, H = 1080;
  const scenes = [];
  let master = null;

  const K = {
    W, H,
    // Calm, editorial easing. Nothing snaps.
    ease: 'power2.inOut',
    easeOut: 'power3.out',
    easeIn: 'power2.in',

    el(tag, attrs = {}, parent) {
      const isSvg = ['svg', 'g', 'path', 'line', 'circle', 'rect', 'text', 'tspan', 'polyline', 'polygon', 'defs', 'linearGradient', 'radialGradient', 'stop', 'filter', 'feGaussianBlur', 'marker', 'ellipse', 'clipPath', 'mask', 'use', 'pattern'].includes(tag);
      const node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else node.setAttribute(k, v);
      }
      if (parent) parent.appendChild(node);
      return node;
    },

    // Absolutely positioned div helper (top-left anchored, px units).
    box(parent, { x = 0, y = 0, w, h, cls = '', html = '', style = {} } = {}) {
      const d = K.el('div', { class: cls, html }, parent);
      Object.assign(d.style, { position: 'absolute', left: x + 'px', top: y + 'px' }, w != null ? { width: w + 'px' } : {}, h != null ? { height: h + 'px' } : {}, style);
      return d;
    },

    // Fade + rise in. Long and soft by default.
    in(tl, targets, at, opts = {}) {
      return tl.fromTo(targets, { autoAlpha: 0, y: opts.y ?? 24, filter: opts.blur ? 'blur(8px)' : 'none' },
        { autoAlpha: 1, y: 0, filter: 'none', duration: opts.d ?? 1.2, ease: opts.ease ?? K.easeOut, stagger: opts.stagger ?? 0 }, at);
    },
    out(tl, targets, at, opts = {}) {
      return tl.to(targets, { autoAlpha: 0, y: opts.y ?? -12, duration: opts.d ?? 0.9, ease: K.easeIn, stagger: opts.stagger ?? 0 }, at);
    },

    // Word-by-word reveal of an element's text (keeps inline <em>/<b> markup).
    words(tl, node, at, opts = {}) {
      const walk = (n) => {
        for (const c of [...n.childNodes]) {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach((p) => {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s);
            });
            n.replaceChild(frag, c);
          } else if (c.nodeType === 1) walk(c);
        }
      };
      walk(node);
      const ws = node.querySelectorAll('.w');
      tl.fromTo(ws, { autoAlpha: 0, y: opts.y ?? 14, filter: 'blur(6px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: opts.d ?? 0.9, ease: K.easeOut, stagger: opts.stagger ?? 0.07 }, at);
      return ws;
    },

    // Animated number. fmt(v) -> string.
    count(tl, node, from, to, at, d = 1.6, fmt = (v) => Math.round(v).toLocaleString('en-US')) {
      const o = { v: from };
      node.textContent = fmt(from);
      tl.to(o, { v: to, duration: d, ease: 'power2.out', onUpdate: () => { node.textContent = fmt(o.v); } }, at);
    },

    // Stroke-draw an SVG path / line.
    draw(tl, paths, at, d = 1.4, opts = {}) {
      return tl.fromTo(paths, { drawSVG: opts.from ?? '0%' }, { drawSVG: opts.to ?? '100%', duration: d, ease: opts.ease ?? K.ease, stagger: opts.stagger ?? 0 }, at);
    },
  };

  window.SF = {
    K,
    scenes,
    scene(def) { scenes.push(def); },

    build() {
      gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);
      const host = document.getElementById('scenes');
      master = gsap.timeline({ paused: true });
      let t = 0;
      const cues = [];
      scenes.forEach((s, i) => {
        const root = K.el('section', { class: 'scene', id: 'scene-' + s.id }, host);
        const tl = gsap.timeline();
        s.build(root, tl, K);
        // Scene visibility window (scenes manage their own internal fades).
        gsap.set(root, { autoAlpha: 0 });
        master.set(root, { autoAlpha: 1 }, t);
        master.add(tl, t);
        master.set(root, { autoAlpha: 0 }, t + s.duration);
        cues.push({ id: s.id, chapter: s.chapter || null, start: +t.toFixed(3), duration: s.duration, mood: s.mood || 'calm', hits: (s.hits || []).map((h) => +(t + h).toFixed(3)) });
        s.start = t;
        t += s.duration - (i < scenes.length - 1 ? (s.overlap ?? 0) : 0);
      });
      if (window.SF_CHROME) window.SF_CHROME(master, cues, K);
      window.DURATION = t;
      window.CUES = cues;
      master.seek(0, false);
      return { duration: t, cues };
    },

    seek(t) { master.seek(t, false); },
  };
})();
