// 00 · Title. Black and calm: one clay dot breathes in (the first dot of the thread), then the title.
SF.scene({
  id: 'title', duration: 11, mood: 'dark', chapter: null,
  hits: [1.6],
  build(root, tl, K) {
    const CX = 960, DY = 418;
    const s = L.svg(root);

    // The dot: position on an outer <g>, animate the inner one (scale/opacity).
    const outer = K.el('g', { transform: `translate(${CX},${DY})` }, s);
    const dot = K.el('g', {}, outer);
    const halo = K.el('circle', { r: 40, fill: 'url(#glow-clay)', opacity: 0.75 }, dot);
    const ring = K.el('circle', { r: 6, fill: 'none', stroke: '#e17b57', 'stroke-width': 1.2, opacity: 0 }, dot);
    const core = K.el('circle', { r: 6, fill: '#e17b57' }, dot);
    gsap.set(dot, { autoAlpha: 0, scale: 0.2, transformOrigin: '50% 50%' });
    tl.to(dot, { autoAlpha: 1, scale: 1, duration: 1.8, ease: 'power2.out' }, 0.5);

    // Gentle breathing: halo swells and softens, a faint ring drifts outward once per breath.
    const P = 3.6;
    // Runs from 0.5 until the fade-out completes (10.6).
    L.loop(tl, 0.5, 10.1, (t) => {
      const ph = (t % P) / P;
      const b = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2); // 0..1..0
      halo.setAttribute('r', (40 + 14 * b).toFixed(2));
      halo.setAttribute('opacity', (0.75 + 0.25 * b).toFixed(3));
      core.setAttribute('r', (6 + 0.6 * b).toFixed(2));
      const warm = Math.min(1, Math.max(0, (t - 1.6) / 1.2)); // ring starts after the dot has settled
      ring.setAttribute('r', (6 + 26 * ph).toFixed(2));
      ring.setAttribute('opacity', (0.38 * (1 - ph) * warm).toFixed(3));
    });

    // Title, word by word.
    const title = K.box(root, { x: 160, y: 470, w: 1600, cls: 'display center', html: 'The Software Factory Moment' });
    K.words(tl, title, 1.6, { stagger: 0.16, d: 1.2, y: 18 });

    // Subtitle.
    const sub = K.box(root, { x: 260, y: 626, w: 1400, cls: 'body center', html: 'What the coding-agent wave tells us about the next one.', style: { color: 'var(--muted)' } });
    K.in(tl, sub, 3.8, { d: 1.3, y: 16 });

    // Small label.
    const lab = K.box(root, { x: 160, y: 716, w: 1600, cls: 'label center', html: 'An executive briefing &nbsp;·&nbsp; October 2026' });
    K.in(tl, lab, 5.2, { d: 1.2, y: 10 });

    // Everything leaves together, softly.
    K.out(tl, [s, title, sub, lab], 9.4, { d: 1.2, y: -10 });
  },
});
