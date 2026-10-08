// Chapter 04 opener: the hidden requirement. A coding agent mostly works in one place (the repo);
// a factory works everywhere. One agent at the centre; the repo lights first, then the ring of
// interfaces lights up around it. MCP (the standard plumbing) lights with the stat; then Browser and
// Desktop apps (the screens, often with no API) light up to hand over to computer use.
SF.scene({
  id: 'interfaces', duration: 19, mood: 'green',
  chapter: { n: '04', title: 'The interfaces', short: 'Interfaces' },
  build(root, tl, K) {
    const s = L.svg(root);
    const CX = 960, CY = 600;          // agent
    const RX = 540, RY = 268;          // ring (ellipse, to use the width)
    const R1 = 300;                    // the lone repo sits closer in, then glides out to the ring
    const AR = 36, PH = 50;            // agent radius, pill height
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const io = gsap.parseEase('power2.inOut');
    const rnd = L.rand(40);

    // Layers, back to front.
    const gOrbit = K.el('g', {}, s);
    const gSpoke = K.el('g', {}, s);
    const gPk = K.el('g', {}, s);
    const gPill = K.el('g', {}, s);
    const gAgent = K.el('g', {}, s);

    const orbit = K.el('ellipse', { cx: CX, cy: CY, rx: RX, ry: RY, fill: 'none', stroke: '#34322c', 'stroke-width': 1.2, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round', opacity: 0 }, gOrbit);

    // Interfaces placed clockwise from the right (0° = right, 90° = bottom).
    // Repo lights alone first; the rest light in one clockwise sweep that ends at MCP tools,
    // right under the stat that talks about it.
    const RING = [
      { name: 'Repo', a: 0 },
      { name: 'Terminal', a: 30 }, { name: 'CI/CD', a: 60 }, { name: 'Cloud console', a: 90 },
      { name: 'Observability', a: 120 }, { name: 'Tickets', a: 150 }, { name: 'Docs & chat', a: 180 },
      { name: 'Other agents', a: 210 }, { name: 'Desktop apps', a: 240 }, { name: 'Browser', a: 270 },
      { name: 'APIs', a: 300 }, { name: 'MCP tools', a: 330 },
    ];
    const T_REPO = 1.6, T_GLIDE = 6.6, T_RING = 7.1, STAG = 0.22, EDGE_D = 0.9;
    const T_STAT = 11.0, T_SCREEN = 14.2, OUT = 17.6;

    const pills = RING.map((it, i) => {
      const rad = (it.a * Math.PI) / 180;
      const x = CX + RX * Math.cos(rad), y = CY + RY * Math.sin(rad);
      const isRepo = i === 0;
      const outer = K.el('g', { transform: `translate(${(isRepo ? CX + R1 : x).toFixed(1)},${y.toFixed(1)})` }, gPill);
      const inner = K.el('g', {}, outer);
      const rect = K.el('rect', { y: -PH / 2, height: PH, rx: PH / 2, fill: '#151513', stroke: isRepo ? '#e17b57' : '#3a3832', 'stroke-width': 1.3 }, inner);
      const t = K.el('text', { y: 7, fill: isRepo ? '#efe9dd' : '#d9d3c6', 'font-family': 'Inter', 'font-size': 20, 'font-weight': 500 }, inner);
      t.textContent = it.name;
      const w = Math.round(t.getComputedTextLength() + 66);
      rect.setAttribute('x', -w / 2); rect.setAttribute('width', w);
      t.setAttribute('x', (-w / 2 + 44).toFixed(1));
      const dotDim = K.el('circle', { cx: -w / 2 + 26, cy: 0, r: 4.5, fill: '#3a3832' }, inner);
      const dot = K.el('circle', { cx: -w / 2 + 26, cy: 0, r: 4.5, fill: '#e17b57', opacity: 0 }, inner);
      gsap.set(inner, { autoAlpha: 0, transformOrigin: '50% 50%' });
      const at = isRepo ? T_REPO : T_RING + (i - 1) * STAG;
      // Spoke + packets (two out in clay = actions, one back in sky = observations).
      const line = K.el('line', { stroke: isRepo ? '#8a5038' : '#3d3b35', 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0 }, gSpoke);
      const pk = [0, 1, 2].map((k) => K.el('circle', { r: k === 2 ? 3 : 3.6, fill: k === 2 ? '#82a9dc' : '#e17b57', opacity: 0 }, gPk));
      return { ...it, isRepo, x, y, w, outer, inner, rect, t, dot, dotDim, at, line, pk, ph: rnd() };
    });

    // Pill position (the repo glides from R1 out to the ring while the ring forms).
    const posOf = (p, t) => (p.isRepo ? { x: CX + R1 + (RX - R1) * io(clamp((t - T_GLIDE) / 1.6)), y: p.y } : { x: p.x, y: p.y });
    function geom(p, t) {
      const P = posOf(p, t);
      const dx = P.x - CX, dy = P.y - CY, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      const ax = CX + ux * (AR + 14), ay = CY + uy * (AR + 14);
      const tb = Math.min(p.w / 2 / Math.max(1e-6, Math.abs(ux)), PH / 2 / Math.max(1e-6, Math.abs(uy))) + 8;
      const bx = P.x - ux * tb, by = P.y - uy * tb;
      return { P, ax, ay, bx, by };
    }
    // Packet speed per spoke: ~105 px/s on the spoke's final length (constant, so packets never jump).
    pills.forEach((p) => { const g = geom(p, 99); p.speed = 105 / Math.hypot(g.bx - g.ax, g.by - g.ay); });

    // Agent.
    const agentO = K.el('g', { transform: `translate(${CX},${CY})` }, gAgent);
    const agent = K.el('g', {}, agentO);
    const halo = K.el('circle', { r: 130, fill: 'url(#glow-clay)', opacity: 0.75 }, agent);
    const ring = K.el('circle', { r: AR + 12, fill: 'none', stroke: '#e17b57', 'stroke-width': 1, opacity: 0.35 }, agent);
    K.el('circle', { r: AR, fill: '#e17b57' }, agent);
    const al = K.el('text', { y: 6, 'text-anchor': 'middle', fill: '#0d0d0c', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 600, 'letter-spacing': '0.02em' }, agent);
    al.textContent = 'agent';
    gsap.set(agent, { transformOrigin: '50% 50%' });
    tl.fromTo(agent, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: K.easeOut }, 0.7);

    // Everything that moves continuously is a pure function of local time.
    function frame(t) {
      const b = Math.sin((t * 2 * Math.PI) / 5);
      halo.setAttribute('r', (130 + 10 * b).toFixed(1));
      ring.setAttribute('r', (AR + 12 + 2 * b).toFixed(1));
      ring.setAttribute('opacity', (0.3 + 0.12 * b).toFixed(3));
      pills.forEach((p) => {
        const g = geom(p, t);
        if (p.isRepo) p.outer.setAttribute('transform', `translate(${g.P.x.toFixed(1)},${g.P.y.toFixed(1)})`);
        const f = io(clamp((t - p.at) / EDGE_D));
        p.line.setAttribute('x1', g.ax.toFixed(1)); p.line.setAttribute('y1', g.ay.toFixed(1));
        p.line.setAttribute('x2', (g.ax + (g.bx - g.ax) * f).toFixed(1)); p.line.setAttribute('y2', (g.ay + (g.by - g.ay) * f).toFixed(1));
        p.line.setAttribute('opacity', f > 0.001 ? 1 : 0);
        const lt = t - p.at - EDGE_D;
        const vis = clamp(lt / 0.8);
        p.pk.forEach((d, k) => {
          let u = k < 2 ? lt * p.speed + k / 2 + p.ph : 1 - (lt * p.speed * 0.7 + 0.25 + p.ph);
          u = ((u % 1) + 1) % 1;
          d.setAttribute('cx', (g.ax + (g.bx - g.ax) * u).toFixed(1));
          d.setAttribute('cy', (g.ay + (g.by - g.ay) * u).toFixed(1));
          d.setAttribute('opacity', (Math.sin(u * Math.PI) * (k < 2 ? 0.95 : 0.8) * vis).toFixed(3));
        });
      });
    }
    frame(0);
    L.loop(tl, 0, 19, (t) => frame(t));

    // Pills enter as their spoke arrives; the status dot lights when connected.
    pills.forEach((p) => {
      tl.fromTo(p.inner, { autoAlpha: 0, scale: 0.86 }, { autoAlpha: 1, scale: 1, duration: 1.0, ease: K.easeOut, immediateRender: false }, p.at + 0.35);
      tl.to(p.dot, { opacity: 1, duration: 0.6, ease: 'power1.out' }, p.at + EDGE_D - 0.05);
    });

    // Kicker (stays) + caption 1: one place.
    const h = L.heading(root, { x: 160, y: 170, kicker: 'The hidden requirement', title: 'A coding agent mostly works in one place: <em class="clay">the repo.</em>', size: 'h2' });
    gsap.set(h.k, { autoAlpha: 0 });
    L.revealHeading(tl, h, 0.8);
    const cap1 = h.t;
    K.out(tl, cap1, 6.6, { d: 0.8 });

    // The ring forms: the orbit fades in, the repo settles into it and becomes one of many.
    tl.to(orbit, { opacity: 1, duration: 2.0, ease: 'power1.inOut' }, 6.8);
    tl.to(pills[0].rect, { stroke: '#3a3832', duration: 1.4, ease: 'power1.inOut' }, 7.2);
    tl.to(pills[0].t, { fill: '#d9d3c6', duration: 1.4, ease: 'power1.inOut' }, 7.2);
    tl.to(pills[0].line, { stroke: '#3d3b35', duration: 1.4, ease: 'power1.inOut' }, 7.2);

    // Caption 2 swaps in under the same kicker: everywhere.
    const cap2 = K.box(root, { x: 160, y: 216, w: 1600, cls: 'h2', html: 'A factory works <em class="clay">everywhere.</em>' });
    K.words(tl, cap2, 7.7);

    // Stat (top right, opposite the caption) + MCP tools lights up.
    const st = K.box(root, { x: 1290, y: 170, w: 470 });
    const num = K.el('div', { class: 'num', style: 'font-size:68px;line-height:1;color:var(--paper);white-space:nowrap' }, st);
    K.el('span', { html: 'Nearly ', style: 'color:var(--muted)' }, num);
    const numV = K.el('span', {}, num);
    K.el('div', { class: 'body', html: 'monthly SDK downloads for MCP, <span class="muted">the open standard that plugs agents into tools.</span>', style: 'font-size:22px;line-height:1.38;margin-top:14px' }, st);
    gsap.set(st, { autoAlpha: 0 });
    K.in(tl, st, T_STAT, { d: 1.3 });
    K.count(tl, numV, 100, 500, T_STAT + 0.1, 1.8, (v) => Math.round(v) + 'M');
    const src = L.source(root, 'Model Context Protocol blog, Jul 28 2026 (Tier-1 SDKs)');
    tl.to(src, { opacity: 1, duration: 1 }, T_STAT);
    const lightUp = (p, stroke, line, at) => {
      tl.to(p.rect, { stroke, duration: 1.2, ease: 'power1.inOut' }, at);
      tl.to(p.dot, { attr: { fill: stroke }, duration: 1.2, ease: 'power1.inOut' }, at);
      tl.to(p.t, { fill: '#efe9dd', duration: 1.2, ease: 'power1.inOut' }, at);
      tl.to(p.line, { stroke: line, duration: 1.2, ease: 'power1.inOut' }, at);
    };
    lightUp(pills[pills.length - 1], '#e17b57', '#7a4733', T_STAT + 0.4);
    // Hand-off to computer use: the screens light up next.
    const byName = (n) => pills.find((p) => p.name === n);
    [byName('Desktop apps'), byName('Browser')].forEach((p, i) => lightUp(p, '#e6bb5c', '#6e5a30', T_SCREEN + i * 0.25));

    // Out.
    K.out(tl, [s, h.k, cap2, st, src], OUT, { d: 1.1 });
  },
});
