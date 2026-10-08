// Close: the thread, completed. All six chapter dots connect, each with a one-line recap,
// then the central idea lands. Normal fades (no black) so it flows into the coda.
SF.scene({
  id: 'close', duration: 18, mood: 'bright', chapter: null,
  build(root, tl, K) {
    const s = L.svg(root);
    const Y = 405, X0 = 330, X1 = 1590;
    const items = [
      { l: 'Coding', r: 'capability → budget<br>in ≈ 5 months' },
      { l: 'Factory', r: 'agents run<br>the whole line' },
      { l: 'Architecture', r: 'graph, hierarchy<br>and swarm' },
      { l: 'Interfaces', r: 'every station<br>is an interface' },
      { l: 'Opus 5.5', r: 'the factory,<br>affordable to run' },
      { l: 'Next wave', r: 'budgets early 2027?<br>if the pattern holds' },
    ];
    const xs = items.map((_, i) => X0 + (i * (X1 - X0)) / (items.length - 1));

    // Base thread + per-segment live line (each segment eases into the next dot).
    const base = K.el('line', { x1: X0, y1: Y, x2: X1, y2: Y, stroke: '#2a2925', 'stroke-width': 1.5 }, s);
    const segs = xs.slice(1).map((x, i) => K.el('path', { d: `M${xs[i]},${Y} H${x}`, fill: 'none', stroke: '#e17b57', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, s));
    gsap.set(segs, { drawSVG: '0%' });

    const dots = items.map((it, i) => {
      const x = xs[i];
      const halo = K.el('circle', { cx: x, cy: Y, r: 36, fill: 'url(#glow-clay)', opacity: 0 }, s);
      const ring = K.el('circle', { cx: x, cy: Y, r: 8, fill: 'none', stroke: '#e17b57', 'stroke-width': 1.6, opacity: 0 }, s);
      const dot = K.el('circle', { cx: x, cy: Y, r: 6, fill: '#3a3832' }, s);
      const lab = K.box(root, { x: x - 150, y: Y - 52, w: 300, cls: 'label', html: it.l, style: { textAlign: 'center', color: '#5f5b52', paddingLeft: '0.2em', whiteSpace: 'nowrap' } });
      const rec = K.box(root, { x: x - 130, y: Y + 30, w: 260, cls: 'small', html: it.r, style: { textAlign: 'center', lineHeight: '1.35', whiteSpace: 'nowrap' } });
      gsap.set(rec, { autoAlpha: 0 });
      return { x, halo, ring, dot, lab, rec };
    });

    // Dim dots and labels arrive first, then the line connects them left to right.
    gsap.set([base, ...dots.map((d) => d.dot)], { autoAlpha: 0 });
    gsap.set(dots.map((d) => d.lab), { autoAlpha: 0 });
    tl.to([base, ...dots.map((d) => d.dot)], { autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, 0.4);
    tl.fromTo(dots.map((d) => d.lab), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: K.easeOut, stagger: 0.06, immediateRender: false }, 0.4);
    const T0 = 0.8, STEP = 1.2;
    segs.forEach((sg, i) => K.draw(tl, sg, T0 + i * STEP, STEP, { ease: 'sine.inOut' }));
    dots.forEach((d, i) => {
      const at = T0 + i * STEP;
      tl.to(d.dot, { fill: '#e17b57', attr: { r: 8 }, duration: 0.7, ease: 'back.out(2)' }, at);
      tl.fromTo(d.ring, { attr: { r: 8 }, opacity: 0.9 }, { attr: { r: 34 }, opacity: 0, duration: 1.8, ease: 'power2.out', immediateRender: false }, at);
      tl.fromTo(d.halo, { opacity: 0 }, { opacity: 0.85, duration: 0.6, ease: 'power2.out', immediateRender: false }, at);
      tl.to(d.halo, { opacity: 0.3, duration: 1.8, ease: 'power1.inOut' }, at + 0.7);
      tl.to(d.lab, { color: '#d9d3c6', duration: 0.8 }, at);
      K.in(tl, d.rec, at + 0.25, { y: 10, d: 1.2 });
    });
    const src = L.source(root, 'Anthropic · Ramp AI Index (2026)');
    tl.to(src, { opacity: 1, duration: 1 }, 1.4);

    // The central idea (10 words; set by ~10.3 s, holds ~7.8 s from its first word).
    const head = K.box(root, { x: 160, y: 572, w: 1600, cls: 'h1 center', html: 'Capability arrives first. Belief follows.<br><em class="clay">The gap is the opportunity.</em>' });
    K.words(tl, head, 8.5, { stagger: 0.08, d: 1.0 });

    // Calm exit into the coda: everything is gone by 17.7 s.
    K.out(tl, src, 16.2, { d: 1.0, y: 0 });
    K.out(tl, head, 16.3, { d: 1.2, y: 0 });
    K.out(tl, [s, ...dots.map((d) => d.lab), ...dots.map((d) => d.rec)], 16.5, { d: 1.2, y: 0 });
  },
});
