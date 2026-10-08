// Chapter 01 → 02 bridge: paying isn't scaling. Few organizations scale coding agents, because code is a
// small slice of the work, so automating it alone leaves the rest of the delivery line at human speed.
SF.scene({
  id: 'bridge', duration: 13, mood: 'calm',
  chapter: { n: '01', title: 'The last wave', short: 'Coding' },
  build(root, tl, K) {
    const s = L.svg(root);
    const W = 600, Y = 372, CX = 960;

    // The turn from the evidence scene ("Budgets took about five months").
    const kicker = K.box(root, { x: 160, y: 248, w: 1600, cls: 'label center', html: 'But paying isn’t scaling', style: { color: 'var(--clay)' } });
    K.in(tl, kicker, 0.4, { y: 10, d: 1.0 });

    const left = L.stat(root, { x: 620 - W / 2, y: Y, w: W, align: 'center', value: '~2 in 10', label: 'organizations are scaling coding agents', color: 'paper', size: 150 });
    const right = L.stat(root, { x: 1300 - W / 2, y: Y, w: W, align: 'center', value: '16%', label: 'of a developer’s time is spent writing code', color: 'gold', size: 150 });
    [left, right].forEach((st) => Object.assign(st.l.style, { fontSize: '28px', marginTop: '22px' }));

    // Hairline between the two numbers, broken around the hedged connective "one reason:".
    const CY = Y + 80;
    const ruleA = K.el('line', { x1: CX, x2: CX, y1: Y + 6, y2: CY - 34, stroke: '#2c2b27', 'stroke-width': 1.5 }, s);
    const ruleB = K.el('line', { x1: CX, x2: CX, y1: CY + 30, y2: Y + 196, stroke: '#2c2b27', 'stroke-width': 1.5 }, s);
    gsap.set([ruleA, ruleB], { drawSVG: '0%' });
    const because = K.box(root, { x: CX - 120, y: CY - 22, w: 240, html: '<em>one reason:</em>', style: { fontFamily: 'var(--serif)', fontSize: '34px', lineHeight: '1.2', textAlign: 'center', color: 'var(--muted)' } });

    // Sources: McKinsey with the first number, Atlassian joins with the second.
    const src = L.source(root, 'McKinsey, Aug 2026<span class="src-b"> &nbsp;·&nbsp; Atlassian State of DevEx 2025</span>');
    const srcB = src.querySelector('.src-b');
    gsap.set(srcB, { opacity: 0 });

    K.in(tl, left.n, 0.6, { d: 1.3 });
    K.in(tl, left.l, 1.0, { d: 1.2, y: 12 });
    tl.to(src, { opacity: 1, duration: 1 }, 0.8);

    tl.to(ruleA, { drawSVG: '100%', duration: 0.8, ease: K.ease }, 1.8);
    K.in(tl, because, 2.0, { d: 1.2, y: 10 });
    tl.to(ruleB, { drawSVG: '100%', duration: 0.8, ease: K.ease }, 2.4);
    K.in(tl, right.n, 3.0, { d: 1.3 });
    K.in(tl, right.l, 3.4, { d: 1.2, y: 12 });
    tl.to(srcB, { opacity: 1, duration: 1 }, 3.2);

    // The bridge line (14 words → 6.2 s minimum; on screen from 5.0 to 11.4).
    const line = K.box(root, { x: 160, y: 722, w: 1600, cls: 'h2 center', html: 'Automate the code, and the rest of the line<br><em class="clay">still moves at human speed.</em>', style: { fontSize: '54px', lineHeight: '1.16' } });
    K.words(tl, line, 5.0, { stagger: 0.07 });

    // Everything leaves together (gone by 12.6).
    K.out(tl, [kicker, left.wrap, right.wrap, because, s, line, src], 11.4, { d: 1.2 });
  },
});
