// 01 · Bottom line up front. Three numbered claims arrive one at a time; earlier ones step back a little
// (still readable) so attention moves down the page. All three then hold together, with the hand-off
// "Here's the evidence." set under the list rather than on a screen of its own.
SF.scene({
  id: 'bluf', duration: 25, mood: 'calm', chapter: null,
  build(root, tl, K) {
    const lead = (t) => `<span style="color:var(--paper)">${t}</span>`;
    // Word counts → minimum holds (2 s + 0.3 s/word): 20 → 8.0 s, 19 → 7.7 s, 19 → 7.7 s.
    const ROWS = [
      { n: '01', y: 320, at: 1.2, html: lead('We’ve seen this curve.') + ' Coding agents went from “they just don’t work”<br>to a budget line in under six months.' },
      { n: '02', y: 490, at: 7.4, html: lead('The next curve is already forming: the software factory.') + '<br>Agents running the whole delivery line, not just the editor.' },
      { n: '03', y: 660, at: 13.6, html: lead('Its bottleneck isn’t code. It’s orchestration and interfaces.') + '<br>Opus 5.5 orchestrates well, at 40% lower cost than Opus 5.' },
    ];

    const kicker = K.box(root, { x: 160, y: 210, cls: 'label', html: 'The bottom line', style: { color: 'var(--clay)' } });
    K.in(tl, kicker, 0.5, { y: 10, d: 1.0 });

    const wraps = [];
    ROWS.forEach((r, i) => {
      const wrap = K.box(root, { x: 160, y: r.y, w: 1600 });
      const num = K.box(wrap, { x: 0, y: 10, w: 140, cls: 'num clay', html: r.n, style: { fontSize: '96px', lineHeight: '1' } });
      const txt = K.box(wrap, { x: 170, y: 14, w: 1300, html: r.html, style: { fontFamily: 'var(--serif)', fontSize: '46px', lineHeight: '1.2', color: 'var(--muted)' } });
      // Earlier rows step back (to a still-readable 0.7) once this one is under way.
      if (i > 0) tl.to(wraps.slice(0, i), { opacity: 0.7, duration: 1.2, ease: K.ease }, r.at + 1.5);
      // Numeral first, then the sentence word by word.
      tl.fromTo(num, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 1.2, ease: K.easeOut }, r.at);
      K.words(tl, txt, r.at + 0.45, { stagger: 0.045, d: 1.0, y: 12 });
      wraps.push(wrap);
    });

    // All three together at full strength, well before anything leaves (no brighten-then-exit pump).
    tl.to(wraps.slice(0, 2), { opacity: 1, duration: 0.8, ease: K.ease }, 19.4);

    // The hand-off, under the list, aligned with the text column.
    const next = K.box(root, { x: 330, y: 850, w: 1400, html: '<em>Here’s the evidence.</em>', style: { fontFamily: 'var(--serif)', fontSize: '46px', lineHeight: '1.2', color: 'var(--paper)' } });
    K.in(tl, next, 20.3, { d: 1.0, y: 12 });

    // Everything leaves together (gone by 24.3).
    K.out(tl, [kicker, ...wraps, next], 23.4, { d: 0.9, y: -12 });
  },
});
