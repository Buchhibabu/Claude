// Chapter 03 opener: who runs the line? Three schools of multi-agent architecture (graph, hierarchy,
// swarm) as live topologies, then one shared row of evidence. The roles for each school are left to
// the synthesis scene, which states them once.
SF.scene({
  id: 'arch', duration: 35, mood: 'cool',
  chapter: { n: '03', title: 'The architecture', short: 'Architecture' },
  hits: [13.0],
  build(root, tl, K) {
    const SKY = '#82a9dc', CLAY = '#e17b57', GOLD = '#e6bb5c', PAPER = '#efe9dd', P2 = '#d9d3c6';
    const NODE = '#151513', EDGE = '#45423b', ARROW = '#6b675e';
    const COL = [420, 960, 1500];           // column centres
    const DY = 398;                          // diagram centre line (diagram band ≈ 310–490)
    const REVEAL = [2.2, 5.0, 7.8];
    const CARD_AT = [13.0, 18.5, 24.0];      // evidence cards (hit on the first)
    const OUT = 33.2, END = 34.5;            // fade-out start; loops stop once everything is gone

    // ---------- helpers (pure functions of time) ----------
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
    // Decaying pulse after a periodic event at local time e (period P). Zero before the first occurrence.
    const pulse = (t, P, e, tau) => (t < e ? 0 : Math.exp(-((t - e) % P) / tau));
    // Progress through a periodic traversal that starts at e and lasts d. null when not travelling.
    const travel = (t, P, e, d) => { if (t < e) return null; const s = (t - e) % P; return s <= d ? s / d : null; };
    // Trim a chord so edges stop at node boundaries.
    const trim = (a, b, ra, rb) => {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      return [{ x: a.x + (dx / d) * ra, y: a.y + (dy / d) * ra }, { x: b.x - (dx / d) * rb, y: b.y - (dy / d) * rb }];
    };
    // Small arrowhead continuing the end tangent of an L.edge path.
    const arrowFor = (p, parent, color) => {
      const b = p._b, c = p._c, dx = b.x - c.x, dy = b.y - c.y, d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d, tip = { x: b.x + ux * 8, y: b.y + uy * 8 };
      const bx = b.x - ux * 1, by = b.y - uy * 1;
      return K.el('path', { d: `M${tip.x.toFixed(1)},${tip.y.toFixed(1)} L${(bx - uy * 4.6).toFixed(1)},${(by + ux * 4.6).toFixed(1)} L${(bx + uy * 4.6).toFixed(1)},${(by - ux * 4.6).toFixed(1)} Z`, fill: color }, parent);
    };
    const setP = (el, q, op) => { el.setAttribute('cx', q.x.toFixed(1)); el.setAttribute('cy', q.y.toFixed(1)); el.setAttribute('opacity', op.toFixed(3)); };

    const s = L.svg(root);

    // ---------- 0.7 s: heading (the kicker names the thesis word; the chapter label already says 'architecture') ----------
    const h = L.heading(root, { x: 160, y: 170, kicker: 'Orchestration', title: 'Who runs the line? <em class="clay">Three schools.</em>', size: 'h2' });
    L.revealHeading(tl, h, 0.7);

    // =====================================================================================
    // GRAPH: a fixed DAG, two branches that merge. One wave of work flows stage by stage.
    // =====================================================================================
    const gx = COL[0];
    const gWrap = K.el('g', {}, s);
    const gEdgesG = K.el('g', {}, gWrap), gPackG = K.el('g', {}, gWrap), gNodesG = K.el('g', {}, gWrap);
    const GN = [
      { x: gx - 182, y: DY, stage: 0 },
      { x: gx - 62, y: DY - 64, stage: 1 }, { x: gx - 62, y: DY + 64, stage: 1 },
      { x: gx + 62, y: DY - 64, stage: 2 }, { x: gx + 62, y: DY + 64, stage: 2 },
      { x: gx + 182, y: DY, stage: 3 },
    ];
    GN.forEach((n) => {
      const o = K.el('g', { transform: `translate(${n.x},${n.y})` }, gNodesG);
      n.g = K.el('g', {}, o);
      n.glow = K.el('circle', { r: 46, fill: 'url(#glow-sky)', opacity: 0 }, n.g);
      K.el('rect', { x: -15, y: -15, width: 30, height: 30, rx: 8, fill: NODE, stroke: '#6b675e', 'stroke-width': 1.6 }, n.g);
      n.hi = K.el('rect', { x: -15, y: -15, width: 30, height: 30, rx: 8, fill: '#82a9dc2e', stroke: SKY, 'stroke-width': 1.8, opacity: 0 }, n.g);
      K.el('circle', { r: 2.6, fill: '#6b675e' }, n.g);
    });
    const GE = [[0, 1, -0.15], [0, 2, 0.15], [1, 3, 0], [2, 4, 0], [3, 5, -0.15], [4, 5, 0.15]].map(([a, b, curve]) => {
      const [A, B] = trim(GN[a], GN[b], 21, 30);
      const p = L.edge(gEdgesG, A, B, { color: EDGE, width: 1.6, curve });
      const head = arrowFor(p, gEdgesG, ARROW);
      const pk = K.el('circle', { r: 4.2, fill: SKY, opacity: 0 }, gPackG);
      return { p, head, pk, stage: GN[a].stage };
    });

    // =====================================================================================
    // HIERARCHY: planner -> two sub-planners -> four workers; tasks down, results back up.
    // =====================================================================================
    const hx = COL[1];
    const hWrap = K.el('g', {}, s);
    const hEdgesG = K.el('g', {}, hWrap), hPackG = K.el('g', {}, hWrap), hNodesG = K.el('g', {}, hWrap);
    const HP = { x: hx, y: DY - 80, r: 13 };
    const HS = [{ x: hx - 112, y: DY, r: 9 }, { x: hx + 112, y: DY, r: 9 }];
    const HW = [-168, -56, 56, 168].map((d) => ({ x: hx + d, y: DY + 80, r: 7 }));
    const hNode = (n, { stroke, fill = NODE, glow = null, width = 1.8 }) => {
      const o = K.el('g', { transform: `translate(${n.x},${n.y})` }, hNodesG);
      n.g = K.el('g', {}, o);
      n.glow = glow ? K.el('circle', { r: n.r * 4.2, fill: `url(#glow-${glow})`, opacity: 0.35 }, n.g) : null;
      n.ring = K.el('circle', { r: n.r + 7, fill: 'none', stroke: CLAY, 'stroke-width': 1.2, opacity: 0 }, n.g);
      n.body = K.el('circle', { r: n.r, fill, stroke, 'stroke-width': width }, n.g);
      n.core = K.el('circle', { r: n.r * 0.42, fill: stroke, opacity: 0.25 }, n.g);
      return n;
    };
    hNode(HP, { stroke: CLAY, fill: '#2a1a14', glow: 'clay', width: 2 });
    HS.forEach((n) => hNode(n, { stroke: '#b86a4e' }));
    HW.forEach((n) => hNode(n, { stroke: '#8a8478' }));
    const hEdge = (a, b) => {
      const [A, B] = trim(a, b, a.r + 5, b.r + 5);
      return L.edge(hEdgesG, A, B, { color: EDGE, width: 1.6 });
    };
    const HE_top = HS.map((sn) => hEdge(HP, sn));
    const HE_low = HW.map((w, j) => hEdge(HS[j < 2 ? 0 : 1], w));
    const mkPk = (color, r) => K.el('circle', { r, fill: color, opacity: 0 }, hPackG);
    const pkTopDown = HE_top.map(() => mkPk(CLAY, 4.2)), pkLowDown = HE_low.map(() => mkPk(CLAY, 3.8));
    const pkLowUp = HE_low.map(() => mkPk(P2, 3.4)), pkTopUp = HE_top.map(() => mkPk(P2, 3.6));
    // One cycle of delegation (local seconds, period HPER).
    const HPER = 6.4, H0 = 0.9;
    const WDUR = [0.8, 1.15, 0.95, 1.3];
    const T_TD = 0.0, D_TD = 0.95;               // planner -> sub-planners
    const T_LD = 1.15, D_LD = 0.85;              // sub-planners -> workers
    const W_START = T_LD + D_LD;                  // workers execute
    const D_UP = 0.85;
    const wDone = WDUR.map((d) => W_START + d);   // results leave each worker
    const subReady = [0, 1].map((k) => Math.max(wDone[2 * k], wDone[2 * k + 1]) + D_UP + 0.15);
    const D_TU = 0.95;

    // =====================================================================================
    // SWARM: ~22 peers drifting; links form between neighbours closer than a threshold.
    // =====================================================================================
    const sx = COL[2];
    const sWrap = K.el('g', {}, s);
    const linkG = K.el('g', {}, sWrap), sNodesG = K.el('g', {}, sWrap);
    const rnd = L.rand(3031);
    const SN = [];
    for (let tries = 0; SN.length < 22 && tries < 4000; tries++) {
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd());
      const x = sx + Math.cos(a) * rr * 176, y = DY + Math.sin(a) * rr * 76;
      if (SN.some((n) => Math.hypot(n.bx - x, (n.by - y) * 1.3) < 44)) continue;
      SN.push({ bx: x, by: y, ax: 14 + rnd() * 18, ay: 8 + rnd() * 9, w1: 0.32 + rnd() * 0.36, w2: 0.28 + rnd() * 0.34, p1: rnd() * 6.28, p2: rnd() * 6.28, p3: rnd() * 6.28, r: 3.4 + rnd() * 2.4 });
    }
    SN.forEach((n) => {
      n.el = K.el('circle', { cx: n.bx, cy: n.by, r: n.r, fill: GOLD, opacity: 0.92 }, sNodesG);
    });
    const LINKS = Array.from({ length: 46 }, () => K.el('line', { stroke: GOLD, 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0 }, linkG));
    const TH = 90;
    const swarmPos = (n, t) => ({
      x: n.bx + n.ax * Math.sin(n.w1 * t + n.p1) + 0.35 * n.ax * Math.sin(2.1 * n.w1 * t + n.p3),
      y: n.by + n.ay * Math.cos(n.w2 * t + n.p2),
    });
    // Place nodes at their t=0 pose so the reveal frame matches the first loop frame.
    SN.forEach((n) => { const q = swarmPos(n, 0); n.el.setAttribute('cx', q.x.toFixed(1)); n.el.setAttribute('cy', q.y.toFixed(1)); });

    // ---------- column text ----------
    // Graph: only the routing and gates are deterministic (LLM agents still run the stations).
    // Hierarchy: Claude Code agent teams dropped (no verified source row). Swarm: Kimi dropped (it is orchestrator-based).
    const COLS = [
      { name: 'Graph', line: 'Predefined paths. Deterministic routing.', ex: 'StrongDM’s factory runs on<br>pipelines defined as graphs' },
      { name: 'Hierarchy', line: 'A planner delegates. Workers execute.', ex: 'Cursor’s planners + workers' },
      { name: 'Swarm', line: 'Peers self-organize.', ex: 'Anthropic’s 16-agent C compiler<br>no orchestrator · ~2,000 sessions' },
    ];
    const TW = 500;
    const colText = COLS.map((c, i) => {
      const x = COL[i] - TW / 2;
      const name = K.box(root, { x, y: 516, w: TW, html: c.name, style: { textAlign: 'center', fontFamily: 'var(--serif)', fontSize: '54px', lineHeight: '1', color: 'var(--paper)' } });
      const line = K.box(root, { x, y: 582, w: TW, cls: 'body', html: c.line, style: { textAlign: 'center', fontSize: '24px', lineHeight: '1.35' } });
      const ex = K.box(root, { x, y: 624, w: TW, cls: 'small', html: c.ex, style: { textAlign: 'center', fontSize: '22px', lineHeight: '1.38', color: 'var(--muted)' } });
      gsap.set([name, line, ex], { autoAlpha: 0 });
      return { name, line, ex };
    });

    // ---------- reveals ----------
    // Graph.
    gsap.set(GN.map((n) => n.g), { autoAlpha: 0 });
    gsap.set(GE.map((e) => e.head), { autoAlpha: 0 });
    tl.fromTo(GN.map((n) => n.g), { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: K.easeOut, stagger: 0.14, immediateRender: false }, REVEAL[0]);
    K.draw(tl, GE.map((e) => e.p), REVEAL[0] + 0.2, 0.9, { stagger: 0.14 });
    tl.to(GE.map((e) => e.head), { autoAlpha: 1, duration: 0.5, stagger: 0.14 }, REVEAL[0] + 0.9);
    // Hierarchy.
    const hAll = [HP, ...HS, ...HW];
    gsap.set(hAll.map((n) => n.g), { autoAlpha: 0 });
    tl.fromTo(hAll.map((n) => n.g), { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: K.easeOut, stagger: 0.1, immediateRender: false }, REVEAL[1]);
    K.draw(tl, [...HE_top, ...HE_low], REVEAL[1] + 0.25, 0.9, { stagger: 0.1 });
    // Swarm: peers fade in in a scattered order, links follow.
    const order = SN.map((n, i) => i).sort((a, b) => ((a * 7919) % 23) - ((b * 7919) % 23));
    gsap.set(SN.map((n) => n.el), { autoAlpha: 0 });
    tl.fromTo(order.map((i) => SN[i].el), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: K.easeOut, stagger: 0.05, immediateRender: false }, REVEAL[2]);
    gsap.set(linkG, { autoAlpha: 0 });
    tl.to(linkG, { autoAlpha: 1, duration: 1.4, ease: K.easeOut }, REVEAL[2] + 0.6);
    // Text, 0.6 s after each diagram.
    colText.forEach((c, i) => {
      tl.fromTo([c.name, c.line, c.ex], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: K.easeOut, stagger: 0.2, immediateRender: false }, REVEAL[i] + 0.6);
    });

    // ---------- continuous motion ----------
    // Graph: a wave leaves the source, splits, runs both branches stage by stage, merges.
    const GPER = 4.0, G0 = 1.3, STEP = 1.0, TRAV = 0.78;
    L.loop(tl, REVEAL[0], END - REVEAL[0], (t) => {
      const vis = clamp((t - 0.9) / 0.8);
      const tt = t - G0;
      GN.forEach((n) => {
        const e = n.stage === 0 ? 0 : (n.stage - 1) * STEP + TRAV;
        const a = pulse(tt, GPER, e, n.stage === 3 ? 0.9 : 0.6) * vis;
        n.hi.setAttribute('opacity', a.toFixed(3));
        n.glow.setAttribute('opacity', (a * 0.75).toFixed(3));
      });
      GE.forEach((ed) => {
        const u = travel(tt, GPER, ed.stage * STEP, TRAV);
        if (u === null) { ed.pk.setAttribute('opacity', 0); return; }
        setP(ed.pk, L.along(ed.p, smooth(u)), vis * Math.min(1, u * 6, (1 - u) * 10));
      });
    });

    // Hierarchy: delegate down, execute, report back up.
    L.loop(tl, REVEAL[1], END - REVEAL[1], (t) => {
      const vis = clamp((t - 0.9) / 0.8);
      const tt = t - H0;
      const packet = (el, p, e, d, rev, peak) => {
        const u = travel(tt, HPER, e, d);
        if (u === null) { el.setAttribute('opacity', 0); return; }
        const v = smooth(u);
        setP(el, L.along(p, rev ? 1 - v : v), vis * peak * Math.min(1, u * 6, (1 - u) * 8));
      };
      HE_top.forEach((p, k) => {
        packet(pkTopDown[k], p, T_TD, D_TD, false, 0.95);
        packet(pkTopUp[k], p, subReady[k], D_TU, true, 0.85);
      });
      HE_low.forEach((p, j) => {
        packet(pkLowDown[j], p, T_LD, D_LD, false, 0.95);
        packet(pkLowUp[j], p, wDone[j], D_UP, true, 0.85);
      });
      // Node responses.
      const pa = Math.max(pulse(tt, HPER, 0, 0.5), ...subReady.map((r) => pulse(tt, HPER, r + D_TU, 0.8)));
      HP.ring.setAttribute('opacity', (pa * 0.8 * vis).toFixed(3));
      HP.glow.setAttribute('opacity', (0.35 + 0.5 * pa * vis).toFixed(3));
      HP.core.setAttribute('opacity', (0.25 + 0.6 * pa * vis).toFixed(3));
      HS.forEach((n, k) => {
        const a = Math.max(pulse(tt, HPER, D_TD, 0.55), pulse(tt, HPER, subReady[k] - 0.15, 0.6));
        n.ring.setAttribute('opacity', (a * 0.7 * vis).toFixed(3));
        n.core.setAttribute('opacity', (0.25 + 0.6 * a * vis).toFixed(3));
      });
      HW.forEach((n, j) => {
        // Busy while executing: a soft ring that breathes for the length of the task.
        const s0 = tt < W_START ? -1 : (tt - W_START) % HPER;
        const busy = s0 >= 0 && s0 <= WDUR[j] + 0.25 ? Math.sin(Math.PI * clamp(s0 / (WDUR[j] + 0.25))) : 0;
        n.ring.setAttribute('opacity', (busy * 0.75 * vis).toFixed(3));
        n.core.setAttribute('opacity', (0.25 + 0.65 * busy * vis).toFixed(3));
        n.core.setAttribute('fill', busy > 0.02 ? CLAY : '#8a8478');
      });
    });

    // Swarm: organic drift, links by proximity (closest first, pool of 46).
    L.loop(tl, REVEAL[2], END - REVEAL[2], (t) => {
      const P = SN.map((n) => swarmPos(n, t));
      SN.forEach((n, i) => { n.el.setAttribute('cx', P[i].x.toFixed(1)); n.el.setAttribute('cy', P[i].y.toFixed(1)); });
      const pairs = [];
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
        if (d < TH) pairs.push([d, i, j]);
      }
      pairs.sort((a, b) => a[0] - b[0]);
      const deg = SN.map(() => 0);
      LINKS.forEach((ln, k) => {
        const pr = pairs[k];
        if (!pr) { ln.setAttribute('opacity', 0); return; }
        const [d, i, j] = pr;
        const w = 1 - d / TH; deg[i] += w; deg[j] += w;
        ln.setAttribute('x1', P[i].x.toFixed(1)); ln.setAttribute('y1', P[i].y.toFixed(1));
        ln.setAttribute('x2', P[j].x.toFixed(1)); ln.setAttribute('y2', P[j].y.toFixed(1));
        ln.setAttribute('opacity', (0.62 * Math.pow(1 - d / TH, 1.2)).toFixed(3));
      });
      // Connected peers glow a little brighter than loners.
      SN.forEach((n, i) => n.el.setAttribute('opacity', (0.55 + 0.42 * clamp(deg[i] / 0.9)).toFixed(3)));
    });

    // ---------- 12.6 s: one shared row of evidence ----------
    // One spanning label so the row reads as shared evidence, not one card per column. The swarm warning
    // (17.2×) sits under Swarm, the planner result (Cursor) under Hierarchy; the +81% names its coordinator.
    // Number colours follow the schools: clay = a central coordinator, gold = independent / flat peers.
    const evLabel = K.box(root, { x: 160, y: 708, w: 1600, cls: 'label', html: 'What the evidence says', style: { color: 'var(--muted)' } });
    const evRule = K.el('line', { x1: 506, y1: 717, x2: 1760, y2: 717, stroke: '#2e2c27', 'stroke-width': 1 }, s);
    gsap.set(evLabel, { autoAlpha: 0 });
    tl.fromTo(evLabel, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: K.easeOut, immediateRender: false }, 12.4);
    K.draw(tl, evRule, 12.6, 1.4);
    // Examples step back so the eye moves down to the evidence (still legible).
    tl.to(colText.map((c) => c.ex), { opacity: 0.55, duration: 1.0, ease: K.ease }, 12.6);

    const cn = (x, lift = 0, size = 0.6) => `<span style="font-size:${size}em;color:var(--muted);margin:0 .14em;position:relative;top:${-lift}em">${x}</span>`;
    const CARDS = [
      { v: `<span class="rose">−39${cn('to', 0, 0.5)}−70%</span> ${cn('/', 0.12, 0.8)} <span class="clay">+81%</span>`, l: 'Sequential tasks: every multi‑agent setup lost 39–70%. Parallel tasks: a central coordinator gained up to 81%.' },
      { v: `<span class="gold">20</span> ${cn('→', 0.32, 0.62)} 2–3`, l: 'Twenty flat agents with locks had the throughput of two or three. Planners and workers: 1M+ lines in close to a week.' },
      { v: `<span class="gold">17.2×</span> ${cn('vs')} <span class="clay">4.4×</span>`, l: 'How much errors compound, relative to one agent: independent agents vs. a central coordinator.' },
    ];
    const CW = 500, CH = 210;
    const cards = CARDS.map((c, i) => {
      const b = K.box(root, { x: COL[i] - CW / 2, y: 744, w: CW, h: CH, cls: 'card', style: { padding: '24px 28px', boxSizing: 'border-box' } });
      K.el('div', { class: 'num', html: c.v, style: 'font-size:62px;color:var(--paper);white-space:nowrap' }, b);
      K.el('div', { class: 'body', html: c.l, style: 'font-size:22px;line-height:1.34;margin-top:14px' }, b);
      gsap.set(b, { autoAlpha: 0 });
      K.in(tl, b, CARD_AT[i], { d: 1.3 });
      return b;
    });
    const src = L.source(root, 'Google Research (Jan 2026) · Cursor (Jan 2026) · StrongDM, Attractor spec · Anthropic Engineering, C compiler');
    tl.to(src, { opacity: 1, duration: 1 }, 3.0);

    // ---------- 33.2 s: everything leaves together ----------
    const texts = colText.flatMap((c) => [c.name, c.line, c.ex]);
    tl.to([gWrap, hWrap, sWrap, h.wrap, ...texts, evLabel, evRule, ...cards, src], { autoAlpha: 0, duration: 1.2, ease: 'sine.inOut' }, OUT);
  },
});
