// Chapter 05: the Opus 5.5 scorecard. Six capabilities a factory needs, each with its evidence and who
// published it, rated honestly (strong / partial), plus METR's independent view.
// Bottom line: Opus 5.5 makes the factory affordable to run.
SF.scene({
  id: 'opus55', duration: 32, mood: 'bright',
  chapter: { n: '05', title: 'The model', short: 'Opus 5.5' },
  hits: [1.0],
  build(root, tl, K) {
    const s = L.svg(root);

    // ---------- heading ----------
    const h = L.heading(root, {
      x: 160, y: 150, size: 'h2',
      kicker: 'Who runs the floor? · Claude Opus 5.5, Sep 22 2026',
      title: 'Not Anthropic’s most capable model.<br><em class="clay">The best fit for the factory floor.</em>',
    });
    L.revealHeading(tl, h, 0.4);

    const src = L.source(root, 'Anthropic: Opus 5.5 launch page + System Card (Sep 22 2026) · Vals.ai · Zapier AutomationBench · METR');
    tl.to(src, { opacity: 1, duration: 1 }, 1.6);

    // ---------- scorecard ----------
    const X0 = 160, X1 = 1760, Y0 = 380, RH = 78;
    const GX = X0 + 26, COL_LABEL = X0 + 66, COL_EV = 436, COL_SRC = 1512;
    const k = (t) => `<span class="k">${t}</span>`;
    // Six rows, at most ~15 words each. The source cell says who published the evidence.
    const rows = [
      { st: 'strong', cap: 'Orchestrate', ev: `${k('100-agent teams')} ran ${k('24 hours')} and picked their own structure for each task.`, src: 'System card (Anthropic)' },
      { st: 'strong', cap: 'Delegate<br>& endure', ev: `One session directed ${k('a dozen more')} (Stripe); another ran ${k('18+ hours')} unattended (Clio).`, src: 'Stripe · Clio, via Anthropic' },
      { st: 'strong', cap: 'Terminal', ev: `Top score in Anthropic’s launch table (${k('66.4%')}) · Sonnet 5.5 close behind on Vals.`, src: 'Anthropic · Vals.ai' },
      { st: 'partial', cap: 'Desktop GUI', ev: `Best strict OSWorld 2.0 score among Claude models (${k('48.7%')}) — under half of long workflows.`, src: 'System card (Anthropic)' },
      { st: 'partial', cap: 'Multi-app API<span style="text-transform:none">s</span>', ev: `${k('42.5%')} on AutomationBench — Gemini 4 Argon leads (51.3%).`, src: 'Zapier · Oct 7 (live)' },
      { st: 'strong', cap: 'Cost', ev: `Fable 5.1-level work at ${k('40% lower cost')} than Opus 5.`, src: 'Anthropic (vendor claim)' },
    ];

    const table = K.box(root, { x: 0, y: 0, w: 1920, h: 1080, style: { pointerEvents: 'none' } });
    const tableSvg = K.el('g', {}, s);

    // Soft focus band that follows the row being revealed.
    const band = K.box(table, { x: X0, y: Y0, w: X1 - X0, h: RH, style: {
      background: 'linear-gradient(90deg, rgba(225,123,87,0.075) 0%, rgba(225,123,87,0.03) 45%, rgba(225,123,87,0) 85%)',
      borderLeft: '2px solid rgba(225,123,87,0.55)', borderRadius: '2px', opacity: 0,
    } });

    // Top rule.
    const topRule = K.el('line', { x1: X0, x2: X1, y1: Y0, y2: Y0, stroke: '#3a3832', 'stroke-width': 1.5 }, tableSvg);
    gsap.set(topRule, { drawSVG: '0%' });
    tl.to(topRule, { drawSVG: '100%', duration: 1.6, ease: K.ease }, 2.0);

    const SAGE = '#8fc0a6', ROSE = '#d98c9c';
    const glyph = (parent, cx, cy, st, r = 11) => {
      const outer = K.el('g', { transform: `translate(${cx},${cy})` }, parent);
      const inner = K.el('g', {}, outer);
      let halo = null;
      if (st === 'strong') {
        halo = K.el('circle', { r: r * 2.6, fill: 'url(#glow-sage)', opacity: 0.45 }, inner);
        K.el('circle', { r, fill: SAGE }, inner);
      } else {
        K.el('circle', { r: r - 0.75, fill: 'none', stroke: ROSE, 'stroke-width': 1.5 }, inner);
        K.el('path', { d: `M0,${-(r - 0.75)} A${r - 0.75},${r - 0.75} 0 0 0 0,${r - 0.75} Z`, fill: ROSE }, inner);
      }
      return { outer, inner, halo };
    };

    const R = rows.map((row, i) => {
      const top = Y0 + i * RH, cy = top + RH / 2;
      const sep = K.el('line', { x1: X0, x2: X1, y1: top + RH, y2: top + RH, stroke: '#2a2925', 'stroke-width': 1 }, tableSvg);
      gsap.set(sep, { drawSVG: '0%' });
      const g = glyph(tableSvg, GX, cy, row.st);
      gsap.set(g.inner, { autoAlpha: 0 });
      const cell = (x, w, html, cls, style = {}) => K.box(table, { x, y: top, w, h: RH, cls, html: `<div>${html}</div>`, style: { display: 'flex', alignItems: 'center', ...style } });
      const lab = cell(COL_LABEL, COL_EV - COL_LABEL - 8, row.cap, 'label', { color: 'var(--paper-2)', lineHeight: '1.2' });
      // Every evidence line is one line (longest ≈1065 px); its box may run under the source cell's empty left side.
      const ev = cell(COL_EV, 1100, row.ev, 'body', { fontSize: '24px', lineHeight: '1.32', color: 'var(--paper-2)' });
      const sc = cell(COL_SRC, X1 - COL_SRC, row.src, 'src', { justifyContent: 'flex-end', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '18px', color: 'var(--muted)' });
      [lab, ev, sc].forEach((n) => gsap.set(n, { autoAlpha: 0 }));
      return { top, sep, g, lab, ev, sc };
    });
    root.querySelectorAll('.k').forEach((n) => Object.assign(n.style, { color: 'var(--paper)', fontWeight: '500' }));

    const T0 = 2.8, STEP = 2.6;
    R.forEach((r, i) => {
      const t = T0 + i * STEP;
      if (i === 0) tl.fromTo(band, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: K.easeOut, immediateRender: false }, t);
      else tl.to(band, { y: r.top - Y0, duration: 1.1, ease: K.ease }, t - 0.2);
      tl.to(r.sep, { drawSVG: '100%', duration: 1.4, ease: K.ease }, t);
      tl.fromTo(r.g.inner, { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 1.0, ease: 'back.out(1.6)', immediateRender: false }, t + 0.1);
      K.in(tl, r.lab, t + 0.2, { y: 12, d: 1.1 });
      K.in(tl, r.ev, t + 0.35, { y: 12, d: 1.2 });
      K.in(tl, r.sc, t + 0.6, { y: 8, d: 1.0 });
    });

    // Strong discs breathe gently once they are in.
    const halos = R.map((r) => r.g.halo).filter(Boolean);
    L.loop(tl, T0, 20.0, (t) => {
      halos.forEach((hh, i) => hh.setAttribute('opacity', (0.38 + 0.16 * Math.sin(t * 1.1 + i * 0.9)).toFixed(3)));
    });

    // Legend (left) and the independent view (right) share the row under the table.
    const legY = Y0 + rows.length * RH + 20;
    const leg = K.box(table, { x: GX - 8, y: legY, w: 600, h: 24, style: { display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--sans)', fontSize: '18px', color: 'var(--muted)', letterSpacing: '0.04em' } });
    const mini = (st) => {
      const sv = K.el('svg', { width: 16, height: 16, viewBox: '-8 -8 16 16', style: 'display:block' }, leg);
      if (st === 'strong') K.el('circle', { r: 6.5, fill: SAGE }, sv);
      else { K.el('circle', { r: 6, fill: 'none', stroke: ROSE, 'stroke-width': 1.3 }, sv); K.el('path', { d: 'M0,-6 A6,6 0 0 0 0,6 Z', fill: ROSE }, sv); }
    };
    mini('strong'); K.el('span', { text: 'strong', style: 'margin-right:22px' }, leg);
    mini('partial'); K.el('span', { text: 'partial' }, leg);
    const T_LEG = T0 + 5 * STEP + 1.2;
    K.in(tl, leg, T_LEG, { y: 6, d: 1.0 });
    const metr = K.box(table, { x: X1 - 1040, y: legY - 4, w: 1040, h: 32, cls: 'body', html: '<div><span style="color:var(--paper-2);font-weight:600">METR:</span> “an incremental improvement” over Fable 5.1, “rather than a discontinuous jump.”</div>', style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap', fontSize: '22px', lineHeight: '1.2', color: 'var(--muted)' } });
    K.in(tl, metr, T_LEG + 0.2, { y: 6, d: 1.1 });

    // The thesis number warms to clay before the table yields to the bottom line.
    const costKey = R[5].ev.querySelector('.k');
    tl.to(costKey, { color: '#e17b57', duration: 1.2, ease: K.ease }, 20.0);

    // ---------- bottom line ----------
    // The table and heading yield the whole frame to one line.
    tl.to([table, tableSvg], { autoAlpha: 0, duration: 0.8, ease: 'power1.inOut' }, 22.8);
    K.out(tl, h.wrap, 22.8, { d: 0.8 });
    const line = K.box(root, { x: 160, y: 474, w: 1600, cls: 'h2 center', html: 'Opus 4.5 made the coding agent real.<br><em class="clay">Opus 5.5 makes the factory affordable to run.</em>', style: { fontSize: '60px', lineHeight: '1.16' } });
    K.words(tl, line, 24.0, { stagger: 0.07 });

    K.out(tl, [line, s, src], 30.6, { d: 1.1 });
  },
});
