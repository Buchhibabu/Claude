// The diffusion ladder: capability -> practitioners -> press -> markets -> budgets.
// Rungs climb a staircase on a real date axis; a caption deck above tells each rung's story.
// Used twice: once for the coding-agent wave, once (dashed, projected) for the factory wave.
window.Ladder = (function () {
  const K = SF.K;

  function build(root, svg, { from, to, x0 = 180, x1 = 1740, axisY = 930, top = 470, ticks = [], rungs, color = '#e17b57', dashed = false, deckY = 170 }) {
    const ax = L.dateAxis(svg, { x0, x1, y: axisY, from, to, ticks });
    const n = rungs.length;
    const levels = rungs.map((r, i) => r.level ?? (axisY - 60 - (i * (axisY - 60 - top)) / Math.max(1, n - 1)));
    const pts = rungs.map((r, i) => ({ x: ax.xOf(r.date), y: levels[i] }));
    const g = K.el('g', {}, svg);
    // Staircase segments (horizontal then vertical) between consecutive rungs.
    const segs = pts.slice(1).map((p, i) => {
      const a = pts[i];
      return K.el('path', { d: `M${a.x},${a.y} H${p.x} V${p.y}`, fill: 'none', stroke: r(i + 1).muted ? '#4a4740' : color, 'stroke-width': 2.2, 'stroke-linejoin': 'round', ...(dashed || r(i + 1).projected ? { 'stroke-dasharray': '6 8' } : {}) }, g);
    });
    function r(i) { return rungs[i]; }
    // Drop lines to axis + dots + tags.
    const marks = pts.map((p, i) => {
      const mg = K.el('g', {}, g);
      const drop = K.el('line', { x1: p.x, y1: p.y, x2: p.x, y2: axisY, stroke: '#2e2d29', 'stroke-width': 1, 'stroke-dasharray': '2 5' }, mg);
      const halo = K.el('circle', { cx: p.x, cy: p.y, r: 26, fill: `url(#glow-${rungs[i].glow || 'clay'})`, opacity: 0 }, mg);
      const dot = K.el('circle', { cx: p.x, cy: p.y, r: 7, fill: rungs[i].muted ? '#6b675e' : rungs[i].projected ? '#0d0d0c' : color, stroke: rungs[i].muted ? '#6b675e' : color, 'stroke-width': 2 }, mg);
      const anchor = rungs[i].anchor || 'middle';
      const dx = anchor === 'start' ? 16 : anchor === 'end' ? -16 : 0;
      const tag = K.el('text', { x: p.x + dx, y: p.y - 28, 'text-anchor': anchor, fill: rungs[i].muted ? '#7d786d' : '#efe9dd', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 700, 'letter-spacing': '0.14em' }, mg);
      tag.textContent = rungs[i].tag.toUpperCase();
      let when = null;
      if (rungs[i].when) {
        when = K.el('text', { x: p.x + dx, y: p.y - 54, 'text-anchor': anchor, fill: rungs[i].muted ? '#7d786d' : color, 'font-family': 'JetBrains Mono', 'font-size': 18, 'font-weight': 500 }, mg);
        when.textContent = rungs[i].when;
      }
      gsap.set(mg, { autoAlpha: 0 });
      return { mg, dot, halo, tag, when, drop };
    });
    // Caption deck: one block per rung, same position.
    const decks = rungs.map((rg) => {
      const d = K.box(root, { x: 160, y: deckY, w: 1600 });
      if (rg.kicker) K.el('div', { class: 'label', html: rg.kicker, style: 'color:var(--clay);margin-bottom:24px' }, d);
      if (rg.quote) {
        K.el('div', { class: 'quote', html: '“' + rg.quote + '”', style: `font-size:${rg.size || 60}px;max-width:1500px` }, d);
        if (rg.who) K.el('div', { class: 'who', html: rg.who, style: 'margin-top:22px' }, d);
      } else {
        K.el('div', { class: 'h2', html: rg.title, style: `font-size:${rg.size || 64}px;max-width:1550px` }, d);
        if (rg.sub) K.el('div', { class: 'body', html: rg.sub, style: 'margin-top:20px;font-size:27px;max-width:1350px' }, d);
      }
      gsap.set(d, { autoAlpha: 0 });
      return d;
    });
    gsap.set(segs, { drawSVG: '0%' });
    return { ax, pts, segs, marks, decks, g };
  }

  // Reveal rung i at time `at`; caption for rung i holds until the next reveal.
  function step(tl, Ld, i, at, { deckOut = null } = {}) {
    if (i > 0) tl.fromTo(Ld.segs[i - 1], { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.3, ease: 'power2.inOut', immediateRender: false }, at);
    const m = Ld.marks[i];
    tl.to(m.mg, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, at + (i > 0 ? 1.0 : 0));
    tl.fromTo(m.halo, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false }, at + (i > 0 ? 1.0 : 0));
    tl.to(m.halo, { opacity: 0.25, duration: 1.6, ease: 'power1.inOut' }, at + (i > 0 ? 1.8 : 0.8));
    if (i > 0) tl.to(Ld.decks[i - 1], { autoAlpha: 0, y: -10, duration: 0.8, ease: 'power2.in' }, at - 0.2);
    tl.fromTo(Ld.decks[i], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out', immediateRender: false }, at + 0.9);
    if (deckOut != null) tl.to(Ld.decks[i], { autoAlpha: 0, duration: 0.8 }, deckOut);
  }

  // Bracket spanning two rungs (e.g. "~5 months").
  function bracket(tl, svg, Ld, a, b, at, label, y = null, color = '#e6bb5c') {
    const xa = Ld.pts[a].x, xb = Ld.pts[b].x;
    const yy = y ?? (Ld.ax.line.y1.baseVal.value + 70);
    const g = K.el('g', {}, svg);
    const p = K.el('path', { d: `M${xa},${yy - 14} V${yy} H${xb} V${yy - 14}`, fill: 'none', stroke: color, 'stroke-width': 2 }, g);
    const t = K.el('text', { x: (xa + xb) / 2, y: yy + 40, 'text-anchor': 'middle', fill: color, 'font-family': 'Instrument Serif', 'font-size': 38, 'font-style': 'italic' }, g);
    t.textContent = label;
    gsap.set(t, { autoAlpha: 0 });
    tl.fromTo(p, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 1.4, ease: 'power2.inOut', immediateRender: false }, at);
    gsap.set(p, { drawSVG: '50% 50%' });
    tl.to(t, { autoAlpha: 1, duration: 1.0 }, at + 0.8);
    return { g, p, t };
  }

  return { build, step, bracket };
})();
