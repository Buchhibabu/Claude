// Chapter 06 opener: the same diffusion ladder, second climb (software factories).
// Capability first (Jan–Feb 2026), then belief, capital and economics; the budget rung is projected.
SF.scene({
  id: 'ladder2', duration: 38, mood: 'warm',
  chapter: { n: '06', title: 'The next wave', short: 'Next wave' },
  hits: [24.9],
  build(root, tl, K) {
    const s = L.svg(root);
    const muted = (t) => `<span style="color:var(--muted)">${t}</span>`;
    const Ld = Ladder.build(root, s, {
      from: '2025-05-15', to: '2027-04-15', axisY: 870, top: 470,
      ticks: [
        { d: '2025-07-01', label: 'JUL 2025' }, { d: '2025-10-01', label: 'OCT' },
        { d: '2026-01-01', label: 'JAN 2026' }, { d: '2026-04-01', label: 'APR' },
        { d: '2026-07-01', label: 'JUL' }, { d: '2026-10-01', label: 'OCT' },
        { d: '2027-01-01', label: 'JAN 2027' }, { d: '2027-04-01', label: 'APR' },
      ],
      rungs: [
        { date: '2025-06-12', tag: 'Skeptics', when: 'Jun 2025', muted: true, level: 820, anchor: 'start',
          quote: 'Don’t build multi-agents.', who: '<b style="color:var(--paper)">Cognition</b>, makers of Devin', size: 84 },
        { date: '2026-02-05', tag: 'Capability', when: 'Jan–Feb 2026', level: 748,
          title: 'Agent teams build real software.', sub: `A browser ${muted('(Cursor)')}. A C compiler ${muted('(Anthropic)')}. A dark factory ${muted('(StrongDM)')}.` },
        { date: '2026-04-22', tag: 'Converts', when: 'Apr 2026', level: 676,
          quote: 'Multi-agent systems work best today<br>when writes stay single-threaded.', who: '<b style="color:var(--paper)">Cognition</b>, ten months later', size: 60 },
        { date: '2026-09-15', tag: 'Capital', when: 'Sep 15', level: 606, anchor: 'end',
          title: 'Factory, a coding-agent startup, raises at <span class="clay">$5B</span>.', sub: '<em style="color:var(--paper)">“A move from individual coding agents to software factories.”</em>' },
        { date: '2026-09-22', tag: 'Economics', when: 'Sep 22 · Opus 5.5', level: 536, anchor: 'start', glow: 'gold', title: '' },
        { date: '2027-02-22', tag: 'Budgets?', when: 'early 2027?', projected: true, level: 466, anchor: 'end', title: '' },
      ],
    });

    // The projected segment is dashed, and DrawSVG would overwrite its dash pattern.
    // Keep the real path dashed and draw a solid mask path over it instead.
    const proj = Ld.segs[4];
    gsap.set(proj, { clearProps: 'strokeDasharray,strokeDashoffset' });
    const mdefs = K.el('defs', {}, s);
    const mask = K.el('mask', { id: 'ladder2-proj', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1920, height: 1080 }, mdefs);
    const mpath = K.el('path', { d: proj.getAttribute('d'), fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linejoin': 'round' }, mask);
    proj.setAttribute('mask', 'url(#ladder2-proj)');
    gsap.set(mpath, { drawSVG: '0%' });
    Ld.segs[4] = mpath;
    // Sep 15 and Sep 22 sit 16 px apart: their drop lines only add clutter next to the "now" stub.
    gsap.set([Ld.marks[3].drop, Ld.marks[4].drop], { autoAlpha: 0 });

    // Axis + the persistent framing label (stays on screen, so it costs no reading time).
    gsap.set(Ld.ax.g, { autoAlpha: 0 });
    tl.to(Ld.ax.g, { autoAlpha: 1, duration: 1.6 }, 0.4);
    const frame = K.el('text', { x: 180, y: 440, fill: '#7d786d', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 600, 'letter-spacing': '0.16em', opacity: 0 }, s);
    frame.textContent = 'SAME LADDER · SECOND CLIMB · SOFTWARE FACTORIES';
    tl.to(frame, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0.4);
    const src = L.source(root, 'Cognition (Jun 2025, Apr 2026) · Cursor (Jan 2026) · Anthropic (Feb, Sep 2026) · StrongDM (Feb 2026) · SiliconANGLE (Sep 2026)');
    tl.to(src, { opacity: 1, duration: 1 }, 1.2);

    // Local step: like Ladder.step, but the caption deck timing is explicit
    // (fade out 0.8 s, 0.2 s of air, fade in) so every deck meets the reading rule.
    function rung(i, at) {
      if (i > 0) tl.fromTo(Ld.segs[i - 1], { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.3, ease: 'power2.inOut', immediateRender: false }, at - 1.0);
      const m = Ld.marks[i];
      tl.to(m.mg, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, at);
      tl.fromTo(m.halo, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false }, at);
      tl.to(m.halo, { opacity: 0.25, duration: 1.6, ease: 'power1.inOut' }, at + 0.8);
    }
    function deck(i, at, out) {
      tl.fromTo(Ld.decks[i], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out', immediateRender: false }, at);
      tl.to(Ld.decks[i], { autoAlpha: 0, y: -10, duration: 0.8, ease: 'power2.in' }, out);
    }
    // Holds (fade-in start -> fade-out start) vs. 2 s + 0.3 s/word:
    // 7 w 4.2/4.1 · 16 w 6.8/6.8 · 13 w 5.9/5.9 · 16 w 6.8/6.8
    rung(0, 0.4);   deck(0, 0.8, 5.0);
    rung(1, 6.0);   deck(1, 6.0, 12.8);
    rung(2, 13.8);  deck(2, 13.8, 19.7);
    rung(3, 20.7);  deck(3, 20.7, 27.5);
    rung(4, 24.9);  // Opus 5.5, one week after the raise: the economics arrive (music hit).

    // "We are here": today (Oct 7), a short stub rising from the axis into clear space.
    const AX = 870;
    const hx = Ld.ax.xOf('2026-10-07');
    const topY = 724;
    const here = K.el('g', {}, s);
    const hHalo = K.el('circle', { cx: hx, cy: AX, r: 22, fill: 'url(#glow-gold)', opacity: 0 }, here);
    const hLine = K.el('line', { x1: hx, y1: AX, x2: hx, y2: AX, stroke: '#e6bb5c', 'stroke-width': 1.6, 'stroke-dasharray': '5 6', opacity: 0.9 }, here);
    const hDot = K.el('circle', { cx: hx, cy: AX, r: 4.5, fill: '#e6bb5c', opacity: 0 }, here);
    const hLab = K.el('text', { x: hx + 14, y: topY + 6, fill: '#e6bb5c', 'font-family': 'Inter', 'font-size': 18, 'font-weight': 600, 'letter-spacing': '0.18em', opacity: 0 }, here);
    hLab.textContent = 'WE ARE HERE';
    const HERE = 25.9;
    tl.to(hDot, { opacity: 1, duration: 0.8, ease: 'power2.out' }, HERE);
    tl.fromTo(hLine, { attr: { y2: AX } }, { attr: { y2: topY }, duration: 1.2, ease: 'power2.inOut', immediateRender: false }, HERE + 0.2);
    tl.fromTo(hLab, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 1.0, ease: K.easeOut, immediateRender: false }, HERE + 1.0);
    // Slow breathing glow at the "now" point (pure function of time, fades in with the dot).
    L.loop(tl, HERE, 37.7 - HERE, (t) => {
      const a = Math.min(1, t / 0.8);
      hHalo.setAttribute('opacity', (a * (0.6 + 0.35 * Math.sin(t * 1.6))).toFixed(3));
      hHalo.setAttribute('r', (22 + 5 * Math.sin(t * 1.6)).toFixed(2));
    });

    // Final beat: the projection, its hedge, and the callback headline (21 w: 8.3 s hold).
    rung(5, 28.5);
    const END = 28.5;
    const end = L.heading(root, { x: 160, y: 176, title: 'Last time, capability to budget took about five months.<br><span class="muted">If Opus 5.5 is this wave’s trigger, budgets land in early 2027.</span>', size: 'h2' });
    end.t.style.fontSize = '58px';
    L.revealHeading(tl, end, END, { stagger: 0.05 });
    Ladder.bracket(tl, s, Ld, 4, 5, 30.2, '≈ 5 months, if the pattern holds', 938);

    K.out(tl, [s, end.wrap, src], 36.8, { d: 0.9 });
  },
});
