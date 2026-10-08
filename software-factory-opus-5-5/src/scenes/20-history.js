// Chapter 02 opener: automating the whole line is a 57-year-old idea. Every software era built the line,
// but people always did the work. Agents are the new workers.
SF.scene({
  id: 'history', duration: 26, mood: 'calm',
  chapter: { n: '02', title: 'The software factory', short: 'Factory' },
  hits: [21.0],
  build(root, tl, K) {
    const s = L.svg(root);
    // Picks up the Ch01 bridge ("…the rest of the line still moves at human speed").
    const h = L.heading(root, { x: 160, y: 170, kicker: 'Automate the whole line? An old idea.', title: 'The software factory is <em class="clay">57 years old.</em>', size: 'h2' });
    L.revealHeading(tl, h, 0.5);

    // Ordinal timeline with an axis break: the long 1969 → 2001 gap is marked, not drawn to scale.
    const Y = 594, X0 = 220, X1 = 1700, BRK = 560;
    const seg1 = K.el('line', { x1: X0, x2: BRK - 12, y1: Y, y2: Y, stroke: '#3a3832', 'stroke-width': 1.5 }, s);
    const seg2 = K.el('line', { x1: BRK + 12, x2: X1, y1: Y, y2: Y, stroke: '#3a3832', 'stroke-width': 1.5 }, s);
    const brk = K.el('g', {}, s);
    [-6, 6].forEach((dx) => K.el('line', { x1: BRK + dx, x2: BRK + dx, y1: Y - 9, y2: Y + 9, stroke: '#5f5b52', 'stroke-width': 1.6, 'stroke-linecap': 'round', transform: `rotate(30 ${BRK + dx} ${Y})` }, brk));
    gsap.set([seg1, seg2], { drawSVG: '0%' });
    gsap.set(brk, { opacity: 0 });
    tl.to(seg1, { drawSVG: '100%', duration: 0.7, ease: 'power2.in' }, 1.6);
    tl.to(brk, { opacity: 1, duration: 0.6 }, 2.2);
    tl.to(seg2, { drawSVG: '100%', duration: 1.6, ease: 'power2.out' }, 2.3);

    const events = [
      { y: 1969, x: 316, t: 'Hitachi Software Works', d: 'First company to adopt the term', up: true },
      { y: 2001, x: 820, t: 'FANUC lights-out plant', d: 'Hardware, not software: robots build robots', up: false },
      { y: 2004, x: 1040, t: 'Microsoft “Software Factories”', d: 'Code generated from diagrams', up: true },
      { y: 2017, x: 1320, t: 'Air Force Kessel Run', d: 'DevSecOps factories — run by people', up: false },
      { y: 2026, x: 1568, t: 'StrongDM’s dark factory', d: '“Code must not be written by humans.”', up: true, hot: true },
    ];
    events.forEach((e, i) => {
      const x = e.x;
      const g = K.el('g', {}, s);
      const col = e.hot ? '#e17b57' : '#c9c3b6';
      K.el('line', { x1: x, x2: x, y1: Y, y2: e.up ? Y - 70 : Y + 70, stroke: '#3a3832', 'stroke-width': 1 }, g);
      if (e.hot) K.el('circle', { cx: x, cy: Y, r: 30, fill: 'url(#glow-clay)' }, g);
      K.el('circle', { cx: x, cy: Y, r: e.hot ? 8 : 6, fill: e.hot ? '#e17b57' : '#0d0d0c', stroke: col, 'stroke-width': 2 }, g);
      const yr = K.el('text', { x, y: e.up ? Y - 158 : Y + 112, 'text-anchor': 'middle', fill: col, 'font-family': 'Instrument Serif', 'font-size': 44 }, g); yr.textContent = e.y;
      const tt = K.el('text', { x, y: e.up ? Y - 116 : Y + 150, 'text-anchor': 'middle', fill: '#efe9dd', 'font-family': 'Inter', 'font-size': 22, 'font-weight': 600 }, g); tt.textContent = e.t;
      const dd = K.el('text', { x, y: e.up ? Y - 86 : Y + 178, 'text-anchor': 'middle', fill: '#9c978b', 'font-family': 'Inter', 'font-size': 20, 'font-style': e.hot ? 'italic' : 'normal' }, g); dd.textContent = e.d;
      gsap.set(g, { autoAlpha: 0 });
      tl.fromTo(g, { autoAlpha: 0, y: e.up ? 14 : -14 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: K.easeOut, immediateRender: false }, 2.8 + i * 2.3);
    });
    const src = L.source(root, 'Hitachi (1969) · FANUC (2001) · Greenfield &amp; Short, Microsoft (2004) · US Air Force (2017) · StrongDM (Feb 2026)');
    tl.to(src, { opacity: 1, duration: 1.0 }, 3.6);

    // The connecting insight (10 words → 5.0 s), then the answer (5 words → 3.5 s), with air between.
    const a = K.box(root, { x: 160, y: 868, w: 1600, cls: 'h2 center', html: 'Every <em>software</em> era built the line. <span class="muted">People did the work.</span>', style: { fontSize: '54px' } });
    K.words(tl, a, 14.9, { stagger: 0.07 });
    const b = K.box(root, { x: 160, y: 868, w: 1600, cls: 'h2 center', html: 'Agents are the new workers.', style: { fontSize: '54px', color: 'var(--clay)' } });
    gsap.set(b, { autoAlpha: 0 });
    K.out(tl, a, 20.0, { d: 0.8 });
    K.in(tl, b, 21.0, { d: 1.3 });
    K.out(tl, [s, h.wrap, b, src], 24.7, { d: 1.0 });
  },
});
