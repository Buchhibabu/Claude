// Chapter 03 synthesis: the factory line from chapter 02 comes back, read as three layers.
// Graph = the line itself. Hierarchy = a planner with workers under Build. Swarm = a cloud of
// parallel checkers under Verify (mirroring the hierarchy, so the line itself stays clean).
SF.scene({
  id: 'synthesis', duration: 24, mood: 'cool',
  chapter: { n: '03', title: 'The architecture', short: 'Architecture' },
  build(root, tl, K) {
    const SKY = '#82a9dc', CLAY = '#e17b57', GOLD = '#e6bb5c', PAPER = '#efe9dd';
    const OUT = 22.3;                 // everything leaves together (gone by 23.4)
    const s = L.svg(root);
    const backG = K.el('g', {}, s);   // halos sit behind the line
    const Y = 420;
    const F = Factory.build(s, { y: Y });
    const B = F.st[2], V = F.st[3];
    const boxBot = Y + F.h / 2;

    // Two-line tag: colored label + short description.
    function tag(x, y, label, color, text, align, w = 470) {
      const left = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
      const b = K.box(root, { x: left, y, w, style: { textAlign: align, whiteSpace: 'nowrap' } });
      K.el('div', { class: 'label', html: label, style: `color:${color}` }, b);
      K.el('div', { class: 'small', html: text, style: 'margin-top:12px;color:var(--paper-2)' }, b);
      gsap.set(b, { autoAlpha: 0 });
      return b;
    }

    // ---------- 0.5 s: kicker + the line returns, already running (GRAPH) ----------
    const kick = K.box(root, { x: 160, y: 170, cls: 'label', html: 'Three schools, one line', style: { color: 'var(--clay)' } });
    gsap.set(kick, { autoAlpha: 0 });
    K.in(tl, kick, 0.5, { y: 10, d: 1.0 });

    gsap.set(F.g, { autoAlpha: 0 });
    tl.to(F.g, { autoAlpha: 1, duration: 1.4, ease: K.easeOut }, 0.5);
    tl.to(F.st.map((st) => st.box), { stroke: '#5f5b52', duration: 1.2 }, 1.2);
    Factory.run(tl, F, 0.5, OUT + 1.1 - 0.5, { flow: true });

    const bx0 = F.x0 - F.w / 2, bx1 = F.x1 + F.w / 2, by = 270, mid = (F.x0 + F.x1) / 2;
    const brace = K.el('path', { d: `M${bx0},${by + 12} V${by} H${mid - 12} L${mid},${by - 12} L${mid + 12},${by} H${bx1} V${by + 12}`, fill: 'none', stroke: SKY, 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.85 }, s);
    gsap.set(brace, { drawSVG: '50% 50%' });
    tl.fromTo(brace, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 1.8, ease: K.ease, immediateRender: false }, 1.4);
    const tGraph = tag(mid, 170, 'Graph', 'var(--sky)', 'the line itself: fixed stations, deterministic gates', 'center', 900);
    K.in(tl, tGraph, 2.0, { y: 12 });

    // Shared row for the two lower tags, beside the planner / the cloud.
    const TAG_Y = 600;

    // ---------- 4.8 s: HIERARCHY unfolds under Build ----------
    const H0 = 4.8;
    const hx = B.x, py = 604, ph = 46, pw = 330, wy = 714;
    const wxs = [-186, -62, 62, 186].map((d) => hx + d);
    const hG = K.el('g', {}, s);
    const stem = K.el('line', { x1: hx, y1: boxBot + 58, x2: hx, y2: py - ph / 2, stroke: CLAY, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, hG);
    const wEdges = wxs.map((wx) => K.el('path', { d: `M${hx},${py + ph / 2} C${hx},${py + 58} ${wx},${wy - 64} ${wx},${wy - 22}`, fill: 'none', stroke: '#6e4636', 'stroke-width': 1.5, 'stroke-linecap': 'round' }, hG));
    const plannerO = K.el('g', { transform: `translate(${hx},${py})` }, hG);
    const planner = K.el('g', {}, plannerO);
    K.el('rect', { x: -pw / 2, y: -ph / 2, width: pw, height: ph, rx: ph / 2, fill: '#1a1512', stroke: CLAY, 'stroke-width': 1.5 }, planner);
    const pt = K.el('text', { x: 0, y: 7, 'text-anchor': 'middle', 'font-family': 'Inter', 'font-size': 20, 'font-weight': 500, fill: PAPER }, planner);
    pt.innerHTML = '<tspan fill="#e17b57" font-weight="600">planner</tspan><tspan fill="#9c978b"> · one writer per change</tspan>';
    const workers = wxs.map((wx) => {
      const o = K.el('g', { transform: `translate(${wx},${wy})` }, hG);
      const g = K.el('g', {}, o);
      K.el('rect', { x: -26, y: -22, width: 52, height: 44, rx: 12, fill: '#141412', stroke: '#8a5643', 'stroke-width': 1.5 }, g);
      K.el('circle', { r: 2, fill: '#5f5b52' }, g);
      const a = K.el('circle', { r: 3.6, fill: CLAY, opacity: 0.9 }, g);
      return { g, a, x: wx };
    });
    const pkDown = wEdges.map(() => K.el('circle', { r: 3.6, fill: CLAY, opacity: 0 }, hG));
    const pkUp = wEdges.map(() => K.el('circle', { r: 3, fill: PAPER, opacity: 0 }, hG));
    const lens = wEdges.map((p) => p.getTotalLength());

    tl.to(B.box, { stroke: CLAY, duration: 1.0 }, H0);
    tl.to(B.glow, { opacity: 0.08, duration: 1.0 }, H0);
    K.draw(tl, stem, H0, 0.8);
    gsap.set(planner, { autoAlpha: 0 });
    tl.fromTo(planner, { autoAlpha: 0, scale: 0.92, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 1.1, ease: K.easeOut, immediateRender: false }, H0 + 0.5);
    K.draw(tl, wEdges, H0 + 1.2, 1.1, { stagger: 0.12 });
    gsap.set(workers.map((w) => w.g), { autoAlpha: 0 });
    tl.fromTo(workers.map((w) => w.g), { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: K.easeOut, stagger: 0.12, immediateRender: false }, H0 + 1.8);
    const tHier = tag(wxs[0] - 64, TAG_Y, 'Hierarchy', 'var(--clay)', 'one planner keeps the work coherent', 'right');
    K.in(tl, tHier, H0 + 1.1, { y: 12 });

    L.loop(tl, H0, OUT + 1.1 - H0, (t) => {
      workers.forEach((w, i) => {
        const ang = t * (1.3 + 0.2 * i) + i * 1.7;
        w.a.setAttribute('cx', (Math.cos(ang) * 13).toFixed(2));
        w.a.setAttribute('cy', (Math.sin(ang) * 8).toFixed(2));
      });
      const tp = t - 2.8; // packets start once the workers are in
      const vis = Math.max(0, Math.min(1, tp / 0.8));
      wEdges.forEach((p, i) => {
        const u = ((tp * 0.42 + i * 0.27) % 1 + 1) % 1;
        const q = p.getPointAtLength(u * lens[i]);
        pkDown[i].setAttribute('cx', q.x.toFixed(1)); pkDown[i].setAttribute('cy', q.y.toFixed(1));
        pkDown[i].setAttribute('opacity', (Math.sin(u * Math.PI) * 0.95 * vis).toFixed(3));
        const v = ((tp * 0.42 + i * 0.27 + 0.5) % 1 + 1) % 1;
        const r = p.getPointAtLength((1 - v) * lens[i]);
        pkUp[i].setAttribute('cx', r.x.toFixed(1)); pkUp[i].setAttribute('cy', r.y.toFixed(1));
        pkUp[i].setAttribute('opacity', (Math.sin(v * Math.PI) * 0.7 * vis).toFixed(3));
      });
    });

    // ---------- 9.0 s: SWARM spreads out under Verify ----------
    const S0 = 9.0;
    const CXs = 1196, CYs = 652, SRX = 108, SRY = 38;   // flat cloud, clear of worker 4 (x ≤ 1040) and the tag (x ≥ 1350)
    const halo = K.el('circle', { cx: V.x, cy: Y, r: 150, fill: 'url(#glow-gold)', opacity: 0 }, backG);
    const cloudHalo = K.el('ellipse', { cx: CXs, cy: CYs, rx: 190, ry: 92, fill: 'url(#glow-gold)', opacity: 0 }, backG);
    const sG = K.el('g', {}, s);
    const sStem = K.el('path', { d: `M${V.x},${boxBot + 58} C${V.x},${boxBot + 100} ${CXs - 64},${CYs - SRY - 26} ${CXs - 36},${CYs - SRY - 4}`, fill: 'none', stroke: GOLD, 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.9 }, sG);
    const sLen = sStem.getTotalLength();
    const sPk = [K.el('circle', { r: 3.4, fill: GOLD, opacity: 0 }, sG), K.el('circle', { r: 3, fill: PAPER, opacity: 0 }, sG)];
    const R = L.rand(53);
    const N = 12;
    // Two loose, counter-rotating rings of six, each dot with its own jitter and breathing.
    const sw = Array.from({ length: N }, (_, i) => {
      const outer = i % 2 === 1, k = Math.floor(i / 2);
      const j = 0.95 + R() * 0.1;
      return {
        rx: (outer ? SRX : SRX * 0.62) * j, ry: (outer ? SRY : SRY * 0.6) * j,
        a0: (k / 6) * Math.PI * 2 + (outer ? Math.PI / 6 : 0) + (R() - 0.5) * 0.3,
        w: outer ? -0.21 - R() * 0.03 : 0.3 + R() * 0.04,
        wob: 2 + R() * 3, wf: 0.6 + R() * 0.6, wp: R() * 6.28, r: 2.8 + R() * 1.5, delay: R() * 0.35,
      };
    });
    const links = Array.from({ length: N }, () => K.el('line', { stroke: GOLD, 'stroke-width': 1, opacity: 0 }, sG));
    const glows = sw.map(() => K.el('circle', { r: 10, fill: 'url(#glow-gold)', opacity: 0 }, sG));
    const dots = sw.map((d) => K.el('circle', { r: d.r, fill: GOLD, opacity: 0 }, sG));

    tl.to(V.box, { stroke: GOLD, duration: 1.0 }, S0);
    tl.set(V.glow, { attr: { fill: GOLD } }, S0);
    tl.to(V.glow, { opacity: 0.07, duration: 1.0 }, S0);
    tl.to(halo, { opacity: 0.25, duration: 1.6, ease: K.easeOut }, S0);
    tl.to(cloudHalo, { opacity: 0.32, duration: 1.6, ease: K.easeOut }, S0 + 0.6);
    K.draw(tl, sStem, S0, 0.8);
    const P = sw.map(() => ({ x: CXs, y: CYs, a: 0 }));
    const C0 = 0.6; // the cloud opens once the stem has reached it
    L.loop(tl, S0, OUT + 1.1 - S0, (t) => {
      const tc = t - C0;
      sw.forEach((d, i) => {
        const tt = Math.max(0, tc - d.delay);
        const e = 1 - Math.pow(1 - Math.min(1, tt / 1.6), 3);
        const ang = d.a0 + d.w * t;
        const wob = Math.sin(t * d.wf + d.wp) * d.wob * e;
        const x = CXs + Math.cos(ang) * (d.rx + wob) * e;
        const y = CYs + Math.sin(ang) * (d.ry + wob * 0.5) * e;
        const a = Math.max(0, Math.min(1, tt / 0.4)) * 0.95;
        P[i].x = x; P[i].y = y; P[i].a = a;
        dots[i].setAttribute('cx', x.toFixed(1)); dots[i].setAttribute('cy', y.toFixed(1));
        dots[i].setAttribute('opacity', a.toFixed(3));
        glows[i].setAttribute('cx', x.toFixed(1)); glows[i].setAttribute('cy', y.toFixed(1));
        glows[i].setAttribute('opacity', (a * 0.8).toFixed(3));
      });
      // Faint links: each dot to its nearest neighbour.
      const lv = Math.max(0, Math.min(1, (tc - 1.2) / 1.2));
      P.forEach((p, i) => {
        let best = -1, bd = 1e9;
        P.forEach((q, j) => { if (j !== i) { const dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < bd) { bd = dd; best = j; } } });
        const q = P[best];
        const op = 0.42 * Math.max(0, 1 - bd / 90) * Math.min(p.a, q.a) * lv;
        links[i].setAttribute('x1', p.x.toFixed(1)); links[i].setAttribute('y1', p.y.toFixed(1));
        links[i].setAttribute('x2', q.x.toFixed(1)); links[i].setAttribute('y2', q.y.toFixed(1));
        links[i].setAttribute('opacity', op.toFixed(3));
      });
      // Work down the stem, findings back up to Verify.
      const tp = t - 2.4, vis = Math.max(0, Math.min(1, tp / 0.8));
      sPk.forEach((d, k) => {
        const u = ((tp * 0.5 + k * 0.5) % 1 + 1) % 1;
        const q = sStem.getPointAtLength((k ? 1 - u : u) * sLen);
        d.setAttribute('cx', q.x.toFixed(1)); d.setAttribute('cy', q.y.toFixed(1));
        d.setAttribute('opacity', (Math.sin(u * Math.PI) * (k ? 0.7 : 0.95) * vis).toFixed(3));
      });
    });
    const tSwarm = tag(CXs + SRX + 46, TAG_Y, 'Swarm', 'var(--gold)', 'parallel reviewers, testers, explorers', 'left');
    K.in(tl, tSwarm, S0 + 0.9, { y: 12 });

    // ---------- 13.0 s: the synthesis ----------
    const hl = K.box(root, { x: 160, y: 800, w: 1600, cls: 'h2 center', html: '<em class="sky">Graph</em> for control. <em class="clay">Hierarchy</em> for coherence. <em class="gold">Swarm</em> for throughput.', style: { fontSize: '52px' } });
    K.words(tl, hl, 13.0, { stagger: 0.07 });

    const sm = K.box(root, { x: 160, y: 884, w: 1600, cls: 'body center', html: '<span class="muted">Rule of thumb:</span> parallelize reading; one writer per change.', style: { fontSize: '26px', color: 'var(--paper)' } });
    K.in(tl, sm, 15.0, { d: 1.2, y: 14 });
    const src = L.source(root, 'Rule of thumb: Cognition, Apr 2026');
    tl.to(src, { opacity: 1, duration: 1 }, 15.0);

    // ---------- 22.3 s: everything leaves ----------
    K.out(tl, [s, kick, tGraph, tHier, tSwarm, hl, sm, src], OUT, { d: 1.1 });
  },
});
