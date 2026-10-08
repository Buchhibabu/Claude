// Chapter 01 evidence: the adoption S-curve (Ramp AI Index) + two corroborating developer numbers.
SF.scene({
  id: 'evidence', duration: 28, mood: 'warm',
  chapter: { n: '01', title: 'The last wave', short: 'Coding' },
  build(root, tl, K) {
    const s = L.svg(root);
    const X0 = 230, X1 = 1060, Y0 = 800, Y1 = 400; // chart box
    const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
    const mx = (ym, day = 15) => { const [y, m] = ym.split('-').map(Number); const idx = (y - 2025) * 12 + (m - 10) + (day - 15) / 30; return X0 + (idx / 10) * (X1 - X0); };
    const vy = (v) => Y0 - (v / 50) * (Y0 - Y1);
    // Nov 2025 = 15.1: Ramp's Jan 2026 release has December at 16.7%, up 1.6 pts.
    const data = [['2025-10', 14.3], ['2025-11', 15.1], ['2025-12', 16.7], ['2026-01', 19.5], ['2026-02', 24.4], ['2026-03', 30.6], ['2026-04', 34.4], ['2026-05', 41.0], ['2026-06', 42.4], ['2026-07', 43.5], ['2026-08', 43.8]];
    const pts = data.map(([m, v]) => ({ x: mx(m), y: vy(v), v, m }));

    const title = K.box(root, { x: 160, y: 190, w: 900, html: '<div class="label" style="color:var(--clay);margin-bottom:16px">Belief, measured</div><div class="h3" style="font-size:34px">Share of US businesses on Ramp paying Anthropic</div><div class="small" style="margin-top:8px">Ramp AI Index · monthly, from card &amp; bill-pay data</div>' });
    K.in(tl, title, 0.8);

    // Everything on the chart lives in one group so it can step back for the takeaway.
    const chart = K.el('g', {}, s);

    // Grid + axes.
    const grid = K.el('g', {}, chart);
    [0, 10, 20, 30, 40, 50].forEach((v) => {
      K.el('line', { x1: X0, x2: X1, y1: vy(v), y2: vy(v), stroke: v === 0 ? '#3a3832' : '#1f1e1b', 'stroke-width': 1 }, grid);
      const t = K.el('text', { x: X0 - 18, y: vy(v) + 6, 'text-anchor': 'end', fill: '#7d786d', 'font-family': 'JetBrains Mono', 'font-size': 18 }, grid); t.textContent = v + '%';
    });
    ['OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG'].forEach((lab, i) => {
      const t = K.el('text', { x: mx(months[i]), y: Y0 + 36, 'text-anchor': 'middle', fill: '#7d786d', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 600, 'letter-spacing': '0.1em' }, grid); t.textContent = lab;
    });
    gsap.set(grid, { autoAlpha: 0 });
    tl.to(grid, { autoAlpha: 1, duration: 1.4 }, 1.0);

    // Steepest-climb band Feb..May.
    const band = K.el('rect', { x: mx('2026-01', 20), y: Y1 - 20, width: mx('2026-04', 25) - mx('2026-01', 20), height: Y0 - Y1 + 20, fill: '#e6bb5c', opacity: 0 }, chart);
    const bandLab = K.el('text', { x: (mx('2026-01', 20) + mx('2026-04', 25)) / 2, y: Y1 - 34, 'text-anchor': 'middle', fill: '#e6bb5c', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 600, 'letter-spacing': '0.06em', opacity: 0 }, chart);
    bandLab.textContent = 'steepest climb: months 2–5';

    // Capability marker.
    const cx = mx('2025-11', 24);
    const cap = K.el('g', {}, chart);
    K.el('line', { x1: cx, x2: cx, y1: Y1 - 10, y2: Y0, stroke: '#e17b57', 'stroke-width': 1.5, 'stroke-dasharray': '4 6' }, cap);
    const capT = K.el('text', { x: cx + 12, y: Y1 + 16, fill: '#e17b57', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 600 }, cap); capT.textContent = 'Opus 4.5';
    gsap.set(cap, { autoAlpha: 0 });
    tl.to(cap, { autoAlpha: 1, duration: 1.0 }, 1.8);

    // Ramp restated its method in the Jun 26 release: Oct–Apr and May–Aug are separate runs.
    const runA = pts.slice(0, 7), runB = pts.slice(7);
    const bx = (pts[6].x + pts[7].x) / 2;
    const brk = K.el('g', {}, chart);
    K.el('line', { x1: bx, x2: bx, y1: Y1 + 20, y2: Y0, stroke: '#5f5b52', 'stroke-width': 1, 'stroke-dasharray': '2 5' }, brk);
    const bt = K.el('text', { x: bx + 12, y: vy(26), fill: '#9c978b', 'font-family': 'Inter', 'font-size': 18 }, brk); bt.textContent = 'method restated';
    gsap.set(brk, { autoAlpha: 0 });

    // One left-to-right clip reveals line, area and dots together, so nothing draws ahead of the curve.
    const defs = K.el('defs', {}, s);
    defs.innerHTML = `<linearGradient id="ev-areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e17b57" stop-opacity=".28"/><stop offset="1" stop-color="#e17b57" stop-opacity="0"/></linearGradient><clipPath id="ev-clip"><rect id="ev-clipR" x="${X0 - 12}" y="0" width="0" height="1080"/></clipPath>`;
    const clipR = defs.querySelector('#ev-clipR');
    const path = (arr) => arr.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
    const areaD = (arr) => path(arr) + ` L${arr[arr.length - 1].x.toFixed(1)},${Y0} L${arr[0].x.toFixed(1)},${Y0} Z`;
    const plot = K.el('g', { 'clip-path': 'url(#ev-clip)' }, chart);
    K.el('path', { d: areaD(runA), fill: 'url(#ev-areaG)' }, plot);
    K.el('path', { d: areaD(runB), fill: 'url(#ev-areaG)', 'fill-opacity': 0.45 }, plot);
    K.el('path', { d: path(runA), fill: 'none', stroke: '#e17b57', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, plot);
    K.el('path', { d: path(runB), fill: 'none', stroke: '#e17b57', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.7 }, plot);
    pts.forEach((p, i) => K.el('circle', { cx: p.x, cy: p.y, r: 4.5, fill: '#0d0d0c', stroke: '#e17b57', 'stroke-width': 2, opacity: i < 7 ? 1 : 0.7 }, plot));

    // Climb to April, mark the restatement, then reveal the restated months.
    tl.to(clipR, { attr: { width: pts[6].x + 12 - (X0 - 12) }, duration: 4.2, ease: 'sine.inOut' }, 2.4);
    tl.to(band, { opacity: 0.05, duration: 1.4 }, 4.6);
    tl.to(bandLab, { opacity: 1, duration: 1.2 }, 5.0);
    tl.to(brk, { autoAlpha: 1, duration: 1.0 }, 6.8);
    tl.to(clipR, { attr: { width: X1 - X0 + 30 }, duration: 2.0, ease: 'sine.inOut' }, 7.4);

    // Callouts.
    const apr = pts[6];
    const aprT = K.box(root, { x: apr.x - 330, y: apr.y - 112, w: 310, cls: 'small', html: '<span style="color:var(--paper);font-weight:600">April:</span> passes OpenAI<br><span class="mono" style="font-size:18px;color:var(--paper-2)">34.4% vs 32.3%</span><br><span style="font-size:18px">as first reported</span>', style: { textAlign: 'right', lineHeight: '1.35' } });
    K.in(tl, aprT, 6.4, { y: 8 });
    const last = pts[pts.length - 1];
    const endT = K.box(root, { x: last.x - 60, y: last.y - 52, w: 120, cls: 'mono center', html: '43.8%', style: { fontSize: '22px', color: 'var(--paper)' } });
    K.in(tl, endT, 9.0, { y: 6 });

    // Corroborating developer numbers (right column), aligned to the chart.
    const src = L.source(root, 'Ramp AI Index (Nov 2025–Sep 2026 releases) · Semafor (Apr 24 2026) · JetBrains Research (Aug 2026)');
    tl.to(src, { opacity: 1, duration: 1 }, 1.2);
    const devLab = K.box(root, { x: 1160, y: Y1 - 8, w: 600, cls: 'label', html: 'Developers' });
    K.in(tl, devLab, 10.0, { y: 10 });
    const stats = [
      { v: '75%', l: 'of Google’s new code is AI-generated', src: 'Sundar Pichai, April 2026' },
      { v: '18% → ~39%', l: 'of professional developers use Claude Code at work', src: 'JetBrains survey, January → mid-2026' },
    ];
    const statBoxes = stats.map((st, i) => {
      const b = K.box(root, { x: 1160, y: Y1 + 48 + i * 214, w: 600 });
      K.el('div', { class: 'num', html: st.v, style: 'font-size:76px;color:var(--paper)' }, b);
      K.el('div', { class: 'body', html: st.l, style: 'font-size:22px;margin-top:10px;line-height:1.35;white-space:nowrap' }, b);
      K.el('div', { class: 'src', html: st.src, style: 'margin-top:6px;font-size:18px' }, b);
      K.in(tl, b, 10.4 + i * 2.2, { d: 1.3 });
      return b;
    });

    // The takeaway: everything else steps back so it becomes the focal point.
    const TK = 16.6;
    const take = K.box(root, { x: 160, y: 878, w: 1600, cls: 'h3 center', html: 'Developers flipped in <span class="clay">weeks</span>. Budgets took <span class="gold">about five months</span>.', style: { fontFamily: 'var(--serif)', fontSize: '46px', fontWeight: 400 } });
    K.in(tl, take, TK, { d: 1.4 });
    tl.to([chart, title, devLab, aprT, endT, ...statBoxes], { opacity: 0.45, duration: 1.2, ease: K.ease }, TK);
    K.out(tl, [s, title, aprT, endT, take, src, devLab, ...statBoxes], 26.4, { d: 1.2 });
  },
});
