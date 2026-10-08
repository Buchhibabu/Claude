// Coda: the briefing was itself produced by a small software factory. Then fade to black.
SF.scene({
  id: 'coda', duration: 13, mood: 'calm', chapter: null,
  build(root, tl, K) {
    const s = L.svg(root);
    const h = L.heading(root, { x: 160, y: 190, w: 1600, kicker: 'One more thing', title: 'This briefing was made by a software factory.', size: 'h2', align: 'center' });
    L.revealHeading(tl, h, 0.4);

    // The line: stations with their crews.
    const Y = 560;
    const st = [
      { name: 'Research', n: 8, crew: '8 researchers', kind: 'swarm', col: '#e6bb5c' },
      { name: 'Fact-check', n: 8, crew: '8 fact-checkers', kind: 'swarm', col: '#e6bb5c' },
      { name: 'Script', n: 1, crew: '1 planner', kind: 'lead', col: '#e17b57' },
      { name: 'Build', n: 6, crew: '6 scene builders', kind: 'hier', col: '#e17b57' },
      { name: 'Critique', n: 9, crew: '9 critics · 8 fixers', kind: 'swarm', col: '#e6bb5c' },
      { name: 'Render', n: 0, crew: 'pipeline', kind: 'graph', col: '#82a9dc' },
    ];
    const X0 = 300, X1 = 1620, dx = (X1 - X0) / (st.length - 1);
    const belt = K.el('line', { x1: X0 - 110, x2: X1 + 110, y1: Y, y2: Y, stroke: '#34322c', 'stroke-width': 2, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round' }, s);
    gsap.set(belt, { drawSVG: '0%' });
    tl.to(belt, { drawSVG: '100%', duration: 1.8, ease: K.ease }, 1.0);
    const rnd = L.rand(63);
    const crews = [];
    st.forEach((d, i) => {
      const x = X0 + i * dx;
      const outer = K.el('g', { transform: `translate(${x},${Y})` }, s);
      const g = K.el('g', {}, outer);
      K.el('rect', { x: -84, y: -56, width: 168, height: 112, rx: 20, fill: '#141412', stroke: '#3a3832', 'stroke-width': 1.5 }, g);
      const nm = K.el('text', { x: 0, y: -80, 'text-anchor': 'middle', fill: '#efe9dd', 'font-family': 'Inter', 'font-size': 21, 'font-weight': 600, 'letter-spacing': '0.14em' }, g); nm.textContent = d.name.toUpperCase();
      // Crew counts in Inter: Instrument Serif's "1" reads as a lowercase "l".
      const cnt = K.el('text', { x: 0, y: 96, 'text-anchor': 'middle', fill: d.col, 'font-family': 'Inter', 'font-size': 23, 'font-weight': 500, 'letter-spacing': '0.01em' }, g);
      cnt.textContent = d.crew;
      // Crew dots inside the box: orbiting for swarms, a single bright core for the lead.
      const dots = Array.from({ length: Math.max(1, Math.min(d.n, 9)) }, (_, k) => ({
        el: K.el('circle', { r: d.kind === 'lead' ? 7 : 4, fill: d.col, opacity: 0 }, g),
        a: d.kind === 'hier' ? (k / Math.max(1, d.n)) * 6.283 : rnd() * 6.28, r: 14 + rnd() * 22, w: d.kind === 'hier' ? 0.9 : 0.6 + rnd() * 0.9, k,
      }));
      if (d.kind === 'graph') {
        dots.forEach((p) => p.el.setAttribute('r', 0));
        K.el('path', { d: 'M-12,-16 L16,0 L-12,16 Z', fill: 'none', stroke: '#82a9dc', 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
      }
      crews.push({ d, dots, g });
      gsap.set(g, { autoAlpha: 0 });
      tl.fromTo(g, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: K.easeOut, immediateRender: false }, 1.4 + i * 0.4);
    });
    const LOOP0 = 1.4, LOOP1 = 11.6;
    L.loop(tl, LOOP0, LOOP1 - LOOP0, (t) => {
      const fade = Math.max(0, Math.min(1, t / 1.5, (LOOP1 - LOOP0 - t) / 1.0));
      crews.forEach(({ d, dots }) => dots.forEach((p) => {
        if (d.kind === 'lead') { p.el.setAttribute('cx', 0); p.el.setAttribute('cy', 0); p.el.setAttribute('opacity', (0.95 * fade).toFixed(3)); return; }
        const ang = p.a + t * p.w * (d.kind === 'hier' ? 0.6 : 1);
        const rx = d.kind === 'hier' ? 40 : p.r * 1.7, ry = d.kind === 'hier' ? 26 : p.r * 0.95;
        p.el.setAttribute('cx', (Math.cos(ang) * rx).toFixed(2));
        p.el.setAttribute('cy', (Math.sin(ang) * ry).toFixed(2));
        p.el.setAttribute('opacity', (0.9 * fade).toFixed(3));
      }));
    });

    // Credit (14 words + source; held ~6.8 s before the fade).
    const by = K.box(root, { x: 160, y: 790, w: 1600, cls: 'body center', html: 'Researched, fact-checked, scripted, scored and rendered with <span style="color:var(--paper)">Claude Opus 5.5</span> — from one human brief.', style: { fontSize: '28px' } });
    const srcl = K.box(root, { x: 160, y: 846, w: 1600, cls: 'src center', html: 'Sources: docs/sources.md', style: { fontSize: '18px', color: 'var(--muted)' } });
    K.in(tl, by, 3.8, { d: 1.3 });
    K.in(tl, srcl, 4.3, { y: 10, d: 1.2 });

    // Fade out, then to black: pure black from ~11.9 s to the end (>= 1 s).
    K.out(tl, [h.wrap, by, srcl], 10.6, { d: 1.2 });
    tl.to(s, { autoAlpha: 0, duration: 1.2, ease: 'power1.in' }, 10.6);
    const black = K.box(root, { x: 0, y: 0, w: 1920, h: 1080, style: { background: '#000', opacity: 0 } });
    tl.to(black, { opacity: 1, duration: 1.3, ease: 'power1.inOut' }, 10.6);
  },
});
