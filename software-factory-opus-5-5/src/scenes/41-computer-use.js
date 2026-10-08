// Chapter 04: computer use. OSWorld climbs from 14.9% to 72.7% in 16 months (short desktop tasks: at the
// human baseline), then the bar moves: OSWorld 2.0's long workflows are under half, but climbing fast.
SF.scene({
  id: 'computer-use', duration: 23, mood: 'green',
  chapter: { n: '04', title: 'The interfaces', short: 'Interfaces' },
  hits: [12.2],
  build(root, tl, K) {
    const s = L.svg(root);
    const defs = K.el('defs', {}, s);
    // The source line follows the phase: phase 1 cites the announcements + the original paper's human baseline.
    const src = L.source(root, 'Anthropic model announcements · OSWorld (Xie et al., 2024): human baseline from the original paper');
    tl.to(src, { opacity: 1, duration: 1 }, 0.8);
    const src2 = L.source(root, 'OSWorld 2.0 (xlang.ai) · Claude Opus 5.5 System Card (Sep 2026)');

    // ---------------- Phase 1: OSWorld (original) reaches the human baseline ----------------
    const h1 = K.box(root, { x: 160, y: 160, w: 1600, cls: 'h2', html: 'Computer use: <span class="muted">from</span> 14.9% <span class="muted">to</span> <em class="clay">72.7%</em> <span class="muted">in 16 months.</span>' });
    K.words(tl, h1, 0.6, { stagger: 0.06 });
    // Bridge from the interfaces ring: where there is no API, the agent drives the screen.
    const kick = K.box(root, { x: 160, y: 122, w: 1600, cls: 'label', html: 'No API? The agent uses the screen.', style: { color: 'var(--clay)' } });
    K.in(tl, kick, 0.3, { y: 8, d: 1.0 });

    const X0 = 230, X1 = 1110, Y0 = 860, Y1 = 330;
    const vy = (v) => Y0 - (v / 100) * (Y0 - Y1);
    const ch = K.el('g', {}, s);
    const grid = K.el('g', {}, ch);
    [50, 100].forEach((v) => K.el('line', { x1: X0, x2: X1, y1: vy(v), y2: vy(v), stroke: '#1f1e1b', 'stroke-width': 1 }, grid));
    [0, 50, 100].forEach((v) => {
      const t = K.el('text', { x: X0 - 18, y: vy(v) + 6, 'text-anchor': 'end', fill: '#6b675e', 'font-family': 'JetBrains Mono', 'font-size': 18 }, grid);
      t.textContent = v + '%';
    });
    const ax = L.dateAxis(grid, {
      x0: X0, x1: X1, y: Y0, from: '2024-10-01', to: '2026-03-01',
      ticks: [
        { d: '2024-10-01', label: 'OCT 2024' }, { d: '2025-01-01', label: 'JAN 2025' }, { d: '2025-04-01', label: 'APR' },
        { d: '2025-07-01', label: 'JUL' }, { d: '2025-10-01', label: 'OCT' }, { d: '2026-01-01', label: 'JAN 2026' }, { d: '2026-03-01', label: 'MAR' },
      ],
    });
    const chartLab = K.el('text', { x: X0, y: Y1 - 26, fill: '#7d786d', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 600, 'letter-spacing': '0.16em' }, grid);
    chartLab.textContent = 'SHORT DESKTOP TASKS COMPLETED · OSWORLD → OSWORLD-VERIFIED';
    gsap.set(grid, { autoAlpha: 0 });
    tl.to(grid, { autoAlpha: 1, duration: 1.4, ease: 'power1.inOut' }, 1.0);

    // Human baseline (dashed; revealed left to right with a clip so the dashes stay intact).
    const yH = vy(72.36);
    defs.innerHTML = `
      <clipPath id="cu-hclip"><rect id="cu-hclipR" x="${X0 - 4}" y="0" width="0" height="1080"/></clipPath>
      <clipPath id="cu-aclip"><rect id="cu-aclipR" x="${X0}" y="0" width="0" height="1080"/></clipPath>
      <linearGradient id="cu-areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e17b57" stop-opacity=".22"/><stop offset="1" stop-color="#e17b57" stop-opacity="0"/></linearGradient>`;
    const hg = K.el('g', { 'clip-path': 'url(#cu-hclip)' }, ch);
    const human = K.el('line', { x1: X0, x2: 1190, y1: yH, y2: yH, stroke: '#c9c3b6', 'stroke-width': 1.5, 'stroke-dasharray': '7 8', opacity: 0.6 }, hg);
    tl.to(defs.querySelector('#cu-hclipR'), { attr: { width: 1190 - X0 + 8 }, duration: 1.6, ease: 'power2.inOut' }, 1.5);
    const hLab = K.el('text', { x: X0 + 2, y: yH - 16, fill: '#c9c3b6', 'font-family': 'Inter', 'font-size': 19, 'font-weight': 500 }, ch);
    hLab.innerHTML = 'human baseline <tspan font-family="JetBrains Mono" fill="#9c978b" dx="4">72.4%</tspan>';
    gsap.set(hLab, { autoAlpha: 0 });
    tl.fromTo(hLab, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: K.easeOut, immediateRender: false }, 2.2);

    // Data (OSWorld, original benchmark).
    const data = [
      { d: '2024-10-22', v: 14.9, n: 'Claude 3.5 Sonnet', lx: 14, ly: 36, anchor: 'start' },
      { d: '2025-05-22', v: 42.2, n: 'Sonnet 4', lx: 14, ly: 36, anchor: 'start' },
      { d: '2025-09-29', v: 61.4, n: 'Sonnet 4.5', lx: -14, ly: -20, anchor: 'end' },
      { d: '2025-11-24', v: 66.3, n: 'Opus 4.5', lx: 12, ly: 34, anchor: 'start' },
      { d: '2026-02-05', v: 72.7, n: 'Opus 4.6', lx: 0, ly: -30, anchor: 'middle' },
    ];
    const pts = data.map((p) => ({ ...p, x: ax.xOf(p.d), y: vy(p.v) }));
    const lineD = pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
    const area = K.el('path', { d: lineD + ` L${pts[pts.length - 1].x.toFixed(1)},${Y0} L${pts[0].x.toFixed(1)},${Y0} Z`, fill: 'url(#cu-areaG)', 'clip-path': 'url(#cu-aclip)' }, ch);
    const line = K.el('path', { d: lineD, fill: 'none', stroke: '#e17b57', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, ch);
    const segL = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
    const total = segL.reduce((a, b) => a + b, 0);
    const cum = [0]; segL.forEach((l, i) => cum.push(cum[i] + l));
    const tipAt = (len) => {
      let i = 0; while (i < segL.length - 1 && len > cum[i + 1]) i++;
      const u = segL[i] ? Math.max(0, Math.min(1, (len - cum[i]) / segL[i])) : 0;
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * u, y: pts[i].y + (pts[i + 1].y - pts[i].y) * u };
    };
    const aclip = defs.querySelector('#cu-aclipR');
    const drawLine = (p) => {
      const len = p * total;
      line.setAttribute('stroke-dasharray', `${len.toFixed(2)} ${(total + 20).toFixed(2)}`);
      line.setAttribute('opacity', p > 0.0005 ? 1 : 0);
      aclip.setAttribute('width', Math.max(0, tipAt(len).x - X0).toFixed(1));
    };
    drawLine(0);
    const T_LINE = 2.6, D_LINE = 4.0, EASE = 'power1.inOut';
    const proxy = { p: 0 };
    tl.to(proxy, { p: 1, duration: D_LINE, ease: EASE, onUpdate: () => drawLine(proxy.p) }, T_LINE);
    // When does the eased line reach each point? (invert the ease by bisection)
    const ef = gsap.parseEase(EASE);
    const reach = (frac) => { let a = 0, b = 1; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (ef(m) < frac) a = m; else b = m; } return T_LINE + D_LINE * (a + b) / 2; };

    const last = pts[pts.length - 1];
    const halo = K.el('circle', { cx: last.x, cy: last.y, r: 46, fill: 'url(#glow-clay)', opacity: 0 }, ch);
    const pulse = K.el('circle', { cx: last.x, cy: last.y, r: 8, fill: 'none', stroke: '#e17b57', 'stroke-width': 1.5, opacity: 0 }, ch);
    pts.forEach((p, i) => {
      const isLast = i === pts.length - 1;
      const g = K.el('g', {}, ch);
      K.el('circle', { cx: p.x, cy: p.y, r: isLast ? 6.5 : 5.5, fill: isLast ? '#e17b57' : '#0d0d0c', stroke: '#e17b57', 'stroke-width': 2 }, g);
      const t = K.el('text', { x: p.x + p.lx, y: p.y + p.ly, 'text-anchor': p.anchor, fill: isLast ? '#efe9dd' : '#d9d3c6', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 600 }, g);
      t.innerHTML = `${p.n}<tspan font-family="JetBrains Mono" font-weight="400" fill="${isLast ? '#e17b57' : '#9c978b'}" dx="10">${p.v.toFixed(1)}%</tspan>`;
      gsap.set(g, { autoAlpha: 0 });
      const at = i === 0 ? T_LINE : reach(cum[i] / total) - 0.1;
      tl.fromTo(g, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: K.easeOut, immediateRender: false }, at);
    });
    // The last point touches the human line: glow + one soft ring, then a slow breath.
    const T_TOUCH = T_LINE + D_LINE - 0.1;
    tl.to(halo, { opacity: 1, duration: 0.9, ease: 'power2.out' }, T_TOUCH);
    tl.fromTo(pulse, { attr: { r: 8 }, opacity: 0.8 }, { attr: { r: 44 }, opacity: 0, duration: 1.8, ease: 'power2.out', immediateRender: false }, T_TOUCH);
    tl.to(human, { opacity: 0.9, duration: 1.0 }, T_TOUCH);
    L.loop(tl, T_TOUCH + 0.9, 10.9 - T_TOUCH, (t) => {
      halo.setAttribute('opacity', (0.78 + 0.22 * Math.cos((t * 2 * Math.PI) / 3.2)).toFixed(3));
      halo.setAttribute('r', (46 + 4 * Math.cos((t * 2 * Math.PI) / 3.2)).toFixed(1));
    });

    // Right-side note, sitting at the end of the human line.
    const note = K.box(root, { x: 1220, y: yH - 30, w: 540, cls: 'h3', html: 'Short desktop tasks:<br><span class="sage">at human baseline.</span>', style: { fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '50px', lineHeight: '1.2' } });
    K.in(tl, note, 7.0, { d: 1.3 });

    // ~0.4 s of empty frame before the bar moves.
    K.out(tl, [h1, kick], 10.8, { d: 0.8 });
    K.out(tl, [ch, note, src], 10.9, { d: 0.9 });

    // ---------------- Phase 2: OSWorld 2.0 — the bar moved ----------------
    const h2 = K.box(root, { x: 160, y: 160, w: 1600, cls: 'h2', html: 'So the bar moved.<div class="muted" style="font-size:46px;line-height:1.2;margin-top:8px">OSWorld 2.0: workflows of 1.6 human-hours (median), with hundreds of actions.</div>' });
    K.words(tl, h2, 12.2, { stagger: 0.06 });
    tl.to(src2, { opacity: 1, duration: 1 }, 12.6);

    const BX0 = 480, BX1 = 1600, bw = (BX1 - BX0) / 100, BH = 52;
    const bars = [
      { n: 'Opus 5', v: 37.2, y: 470 },
      { n: 'Fable 5.1', v: 42.8, y: 572, sub: 'higher-tier model' },
      { n: 'Opus 5.5', v: 48.7, y: 674, hot: true },
    ];
    const bg = K.el('g', {}, s);
    const frame = K.el('g', {}, bg);
    const bLab = K.el('text', { x: 160, y: bars[0].y - BH / 2 - 40, fill: '#7d786d', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 600, 'letter-spacing': '0.16em' }, frame);
    bLab.textContent = 'SHARE OF LONG WORKFLOWS FULLY COMPLETED · SAME TEST SETUP';
    bars.forEach((b) => K.el('rect', { x: BX0, y: b.y - BH / 2, width: BX1 - BX0, height: BH, rx: 6, fill: '#151513', stroke: '#22211e', 'stroke-width': 1 }, frame));
    const x50 = BX0 + 50 * bw, gTop = bars[0].y - BH / 2 - 18, gBot = bars[2].y + BH / 2 + 18;
    K.el('line', { x1: x50, x2: x50, y1: gTop, y2: gBot, stroke: '#4a4740', 'stroke-width': 1.2, 'stroke-dasharray': '4 6' }, frame);
    [[0, BX0, 'start'], [50, x50, 'middle'], [100, BX1, 'end']].forEach(([v, x, a]) => {
      const t = K.el('text', { x, y: gBot + 34, 'text-anchor': a, fill: '#6b675e', 'font-family': 'JetBrains Mono', 'font-size': 18 }, frame);
      t.textContent = v + '%';
    });
    gsap.set(frame, { autoAlpha: 0 });
    tl.to(frame, { autoAlpha: 1, duration: 1.3, ease: 'power1.inOut' }, 13.0);

    bars.forEach((b, i) => {
      const at = 13.8 + i * 0.7;
      const g = K.el('g', {}, bg);
      const name = K.el('text', { x: 160, y: b.y + 9, fill: b.hot ? '#efe9dd' : '#9c978b', 'font-family': 'Inter', 'font-size': 26, 'font-weight': b.hot ? 600 : 500 }, g);
      name.textContent = b.n;
      // Fable 5.1 is a bigger sibling, not a rival: say so under its name.
      const sub = b.sub ? K.el('text', { x: 160, y: b.y + 40, fill: '#7d786d', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 500 }, g) : null;
      if (sub) sub.textContent = b.sub;
      const val = K.el('text', { x: BX0 - 28, y: b.y + 15, 'text-anchor': 'end', fill: b.hot ? '#e17b57' : '#c9c3b6', 'font-family': 'Instrument Serif', 'font-size': 46 }, g);
      const glow = b.hot ? K.el('circle', { cx: BX0, cy: b.y, r: 54, fill: 'url(#glow-clay)', opacity: 0 }, g) : null;
      const bar = K.el('rect', { x: BX0, y: b.y - BH / 2, width: 0, height: BH, rx: 6, fill: b.hot ? '#e17b57' : '#4a4740' }, g);
      const nameG = sub ? [name, sub] : [name];
      gsap.set([...nameG, val], { autoAlpha: 0 });
      tl.fromTo(nameG, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 1.0, ease: K.easeOut, immediateRender: false }, at - 0.3);
      // The real value only (no count-up through numbers that never existed), as the bar settles.
      val.textContent = b.v.toFixed(1) + '%';
      tl.fromTo(val, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: K.easeOut, immediateRender: false }, at + 0.8);
      tl.to(bar, { attr: { width: b.v * bw }, duration: 1.9, ease: 'power2.out' }, at);
      if (glow) {
        tl.to(glow, { attr: { cx: BX0 + b.v * bw }, duration: 1.9, ease: 'power2.out' }, at);
        tl.to(glow, { opacity: 0.9, duration: 1.0 }, at + 0.6);
        L.loop(tl, at + 1.6, 21.6 - at - 1.6, (t) => glow.setAttribute('opacity', (0.7 + 0.2 * Math.cos((t * 2 * Math.PI) / 3.4)).toFixed(3)));
      }
    });

    const cap = K.box(root, { x: 160, y: 818, w: 1600, cls: 'h3', html: 'Not solved. <em class="clay">Climbing fast.</em>', style: { fontFamily: 'var(--serif)', fontWeight: 400, fontSize: '52px', lineHeight: '1.15' } });
    K.in(tl, cap, 17.6, { d: 1.3 });

    K.out(tl, [h2, bg, cap, src2], 21.6, { d: 1.1 });
  },
});
