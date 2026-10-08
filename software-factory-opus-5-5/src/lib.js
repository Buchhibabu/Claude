// Shared visual components for scenes. Everything is built at load time and animated on the
// scene's timeline; continuous motion uses L.loop(), which drives a pure function of local time
// so any frame can be rendered in any order.
window.L = (function () {
  const K = SF.K;
  const NS = 'http://www.w3.org/2000/svg';

  // Deterministic pseudo-random (seeded) for layouts.
  function rand(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // Full-scene SVG layer.
  function svg(root, opts = {}) {
    const s = K.el('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'position:absolute;left:0;top:0;overflow:visible' }, root);
    if (opts.defs !== false) {
      const d = K.el('defs', {}, s);
      d.innerHTML = `
        <radialGradient id="glow-clay"><stop offset="0" stop-color="#e17b57" stop-opacity=".55"/><stop offset="1" stop-color="#e17b57" stop-opacity="0"/></radialGradient>
        <radialGradient id="glow-sky"><stop offset="0" stop-color="#82a9dc" stop-opacity=".5"/><stop offset="1" stop-color="#82a9dc" stop-opacity="0"/></radialGradient>
        <radialGradient id="glow-sage"><stop offset="0" stop-color="#8fc0a6" stop-opacity=".5"/><stop offset="1" stop-color="#8fc0a6" stop-opacity="0"/></radialGradient>
        <radialGradient id="glow-gold"><stop offset="0" stop-color="#e6bb5c" stop-opacity=".5"/><stop offset="1" stop-color="#e6bb5c" stop-opacity="0"/></radialGradient>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#6b675e"/></marker>
        <marker id="arrow-clay" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#e17b57"/></marker>`;
    }
    return s;
  }

  // Continuous motion: fn(localTime, progress) called every frame between at and at+dur.
  function loop(tl, at, dur, fn) {
    const o = { t: 0 };
    tl.fromTo(o, { t: 0 }, { t: dur, duration: dur, ease: 'none', immediateRender: false, onUpdate: () => fn(o.t, o.t / dur) }, at);
  }

  // Kicker + title + optional subtitle block.
  function heading(root, { x = 160, y = 200, w = 1600, kicker, title, sub, size = 'h1', align = 'left' }) {
    const wrap = K.box(root, { x, y, w, style: { textAlign: align } });
    const k = kicker ? K.el('div', { class: 'label', html: kicker, style: 'margin-bottom:28px;color:var(--clay)' }, wrap) : null;
    const t = K.el('div', { class: size, html: title }, wrap);
    const s = sub ? K.el('div', { class: 'body', html: sub, style: 'margin-top:28px;max-width:1200px;' + (align === 'center' ? 'margin-left:auto;margin-right:auto' : '') }, wrap) : null;
    return { wrap, k, t, s };
  }

  function revealHeading(tl, h, at, opts = {}) {
    if (h.k) K.in(tl, h.k, at, { y: 10, d: 1.0 });
    K.words(tl, h.t, at + (h.k ? 0.35 : 0), { stagger: opts.stagger ?? 0.06 });
    if (h.s) K.in(tl, h.s, at + (opts.subDelay ?? 1.4), { d: 1.2 });
  }

  // Source line (top-right, opposite the chapter label).
  function source(root, text) {
    return K.box(root, { x: 824, y: 62, w: 1000, cls: 'src', html: text, style: { textAlign: 'right', opacity: 0, whiteSpace: 'nowrap', fontSize: '16px', letterSpacing: '0.02em', color: '#7d786d' } });
  }

  // Quote card.
  function quote(root, { x, y, w = 1300, text, who, role, size = 56 }) {
    const wrap = K.box(root, { x, y, w });
    const mark = K.el('div', { html: '“', style: 'font-family:var(--serif);font-size:180px;line-height:0.6;color:var(--clay);height:70px;opacity:.9' }, wrap);
    const q = K.el('div', { class: 'quote', html: text, style: `font-size:${size}px` }, wrap);
    const by = K.el('div', { class: 'who', html: `<span style="color:var(--paper);font-weight:600">${who}</span>${role ? ' &nbsp;·&nbsp; ' + role : ''}`, style: 'margin-top:30px' }, wrap);
    return { wrap, mark, q, by };
  }
  function revealQuote(tl, qq, at) {
    K.in(tl, qq.mark, at, { y: 0, d: 1.0 });
    K.words(tl, qq.q, at + 0.3, { stagger: 0.05 });
    K.in(tl, qq.by, at + 1.6, { y: 8 });
  }

  // Big stat: number + unit + label.
  function stat(root, { x, y, w = 520, value = '', label = '', color = 'paper', size = 168, align = 'left' }) {
    const wrap = K.box(root, { x, y, w, style: { textAlign: align } });
    const n = K.el('div', { class: 'num ' + color, html: value, style: `font-size:${size}px` }, wrap);
    const l = K.el('div', { class: 'body', html: label, style: 'margin-top:18px;font-size:26px;color:var(--muted)' }, wrap);
    return { wrap, n, l };
  }

  // Horizontal date axis. Dates as 'YYYY-MM-DD'.
  function dateAxis(parentSvg, { x0, x1, y, from, to, ticks = [], color = '#3a3832' }) {
    const t0 = Date.parse(from), t1 = Date.parse(to);
    const xOf = (d) => x0 + ((Date.parse(d) - t0) / (t1 - t0)) * (x1 - x0);
    const g = K.el('g', {}, parentSvg);
    const line = K.el('line', { x1: x0, y1: y, x2: x1, y2: y, stroke: color, 'stroke-width': 1.5 }, g);
    const tickEls = ticks.map((tk) => {
      const x = xOf(tk.d);
      const tg = K.el('g', {}, g);
      K.el('line', { x1: x, y1: y - 6, x2: x, y2: y + 6, stroke: color, 'stroke-width': 1.5 }, tg);
      const tx = K.el('text', { x, y: y + 36, 'text-anchor': 'middle', fill: '#7d786d', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 500, 'letter-spacing': '0.08em' }, tg);
      tx.textContent = tk.label;
      return tg;
    });
    return { g, line, ticks: tickEls, xOf };
  }

  // Node with label for diagrams. shape: 'circle' | 'pill' | 'box'
  function node(parentSvg, { x, y, r = 10, label, sub, color = '#e17b57', fill = '#151513', shape = 'circle', w = 220, h = 64, labelPos = 'below', fontSize = 22, glow = false }) {
    const g = K.el('g', { transform: `translate(${x},${y})` }, parentSvg);
    let halo = null;
    if (glow) halo = K.el('circle', { r: r * 4, fill: `url(#glow-${glow})`, opacity: 0.9 }, g);
    let body;
    if (shape === 'circle') body = K.el('circle', { r, fill, stroke: color, 'stroke-width': 2 }, g);
    else body = K.el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: shape === 'pill' ? h / 2 : 16, fill, stroke: color, 'stroke-width': 1.5 }, g);
    let t = null, s = null;
    if (label) {
      const ly = shape === 'circle' ? (labelPos === 'below' ? r + 34 : labelPos === 'above' ? -r - 20 : 7) : (sub ? -4 : 8);
      t = K.el('text', { x: shape === 'circle' && labelPos === 'right' ? r + 18 : 0, y: ly, 'text-anchor': shape === 'circle' && labelPos === 'right' ? 'start' : 'middle', fill: '#efe9dd', 'font-family': 'Inter', 'font-size': fontSize, 'font-weight': 500 }, g);
      t.textContent = label;
      if (sub) {
        s = K.el('text', { x: 0, y: ly + 26, 'text-anchor': 'middle', fill: '#9c978b', 'font-family': 'Inter', 'font-size': fontSize - 6 }, g);
        s.textContent = sub;
      }
    }
    return { g, body, t, s, halo, x, y };
  }

  function edge(parentSvg, a, b, { color = '#3d3b35', width = 1.5, dash = null, curve = 0, marker = null } = {}) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const cx = mx - dy * curve, cy = my + dx * curve;
    const d = `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`;
    const p = K.el('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', ...(dash ? { 'stroke-dasharray': dash } : {}), ...(marker ? { 'marker-end': `url(#${marker})` } : {}) }, parentSvg);
    p._a = a; p._b = b; p._c = { x: cx, y: cy };
    return p;
  }

  // Point on a quadratic edge at u in [0,1].
  function along(p, u) {
    const a = p._a, b = p._b, c = p._c, v = 1 - u;
    return { x: v * v * a.x + 2 * v * u * c.x + u * u * b.x, y: v * v * a.y + 2 * v * u * c.y + u * u * b.y };
  }

  // Packets that travel along an edge repeatedly between at and at+dur (pure function of time).
  function packets(tl, parentSvg, p, at, dur, { n = 3, speed = 0.6, color = '#e17b57', r = 4, phase = 0 } = {}) {
    const dots = Array.from({ length: n }, () => K.el('circle', { r, fill: color, opacity: 0 }, parentSvg));
    loop(tl, at, dur, (t) => {
      dots.forEach((d, i) => {
        const u = ((t * speed + i / n + phase) % 1 + 1) % 1;
        const q = along(p, u);
        const fadeIn = Math.min(1, t / 0.8), fadeOut = Math.min(1, (dur - t) / 0.8);
        d.setAttribute('cx', q.x); d.setAttribute('cy', q.y);
        d.setAttribute('opacity', (Math.sin(u * Math.PI) * 0.95 * Math.min(fadeIn, fadeOut)).toFixed(3));
      });
    });
    return dots;
  }

  return { rand, svg, loop, heading, revealHeading, source, quote, revealQuote, stat, dateAxis, node, edge, along, packets };
})();
