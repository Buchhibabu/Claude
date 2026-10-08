// Chapter 06: the ask. Three moves for an engineering org, then what would make this thesis wrong.
SF.scene({
  id: 'moves', duration: 26, mood: 'calm',
  chapter: { n: '06', title: 'The next wave', short: 'Next wave' },
  build(root, tl, K) {
    const h = L.heading(root, { x: 160, y: 160, kicker: 'What to do now', title: 'Three moves.', size: 'h2' });
    L.revealHeading(tl, h, 0.5);

    const moves = [
      { n: '01', t: 'Pick one product line.', b: 'Run it as a factory pilot. Measure lead time, escaped defects and cost per change.' },
      { n: '02', t: 'Build verification first.', b: 'Scenarios, holdout tests, digital twins. Autonomy depends on the repo as much as the model.' },
      { n: '03', t: 'Open interfaces — safely.', b: 'MCP and APIs first, sandboxed computer use second. Scoped credentials; every action audited.' },
    ];
    const XS = [160, 725, 1290], Y = 330, CW = 470, CH = 330;
    const reveal = [2.0, 6.0, 10.0];
    const cards = moves.map((m, i) => {
      const c = K.box(root, { x: XS[i], y: Y, w: CW, h: CH, cls: 'card', style: { padding: '40px 40px 36px', overflow: 'hidden' } });
      // Accent hairline across the top edge; draws in as the card arrives.
      const rule = K.box(c, { x: 40, y: 0, w: CW - 80, h: 2, style: { background: 'var(--clay)', transformOrigin: '0 50%', opacity: 0.9 } });
      const num = K.el('div', { html: m.n, style: 'font-family:var(--serif);font-size:72px;line-height:0.9;color:var(--clay);letter-spacing:-0.01em' }, c);
      const title = K.el('div', { html: m.t, style: 'font-family:var(--serif);font-size:38px;line-height:1.12;color:var(--paper);margin-top:26px' }, c);
      const body = K.el('div', { class: 'body', html: m.b, style: 'font-size:22px;line-height:1.45;color:var(--paper-2);margin-top:16px' }, c);
      gsap.set(c, { autoAlpha: 0 });
      gsap.set([num, title, body], { autoAlpha: 0 }); // children wait for their own staggered fade (no flash)
      gsap.set(rule, { scaleX: 0 });
      return { c, rule, num, title, body };
    });
    cards.forEach((cd, i) => {
      const at = reveal[i];
      tl.fromTo(cd.c, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.3, ease: K.easeOut, immediateRender: false }, at);
      tl.fromTo([cd.num, cd.title, cd.body], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 1.1, ease: K.easeOut, stagger: 0.18, immediateRender: false }, at + 0.25);
      tl.fromTo(cd.rule, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: K.ease, immediateRender: false }, at + 0.3);
      // The newest card holds the accent; earlier ones settle back.
      if (i > 0) tl.to(cards[i - 1].rule, { opacity: 0.25, duration: 1.0, ease: 'power1.inOut' }, at + 0.3);
    });
    // Once all three are read, they settle together as one set.
    tl.to(cards[2].rule, { opacity: 0.25, duration: 1.2, ease: 'power1.inOut' }, 14.0);

    // What would make this wrong (label + chips: 21 words, held ~9.8 s).
    const STRIP = 14.8;
    const strip = K.box(root, { x: 160, y: 760, w: 1600 });
    const line = K.box(strip, { x: 0, y: 0, w: 1600, h: 1, cls: 'rule', style: { transformOrigin: '0 50%' } });
    const lab = K.box(strip, { x: 0, y: 34, cls: 'label', html: 'What would make this wrong', style: { color: 'var(--rose)', whiteSpace: 'nowrap' } });
    const row = K.box(strip, { x: 0, y: 78, w: 1600, style: { display: 'flex', gap: '14px', flexWrap: 'nowrap' } });
    const risks = ['Tokens: $1,000/day per engineer (StrongDM’s bar)', 'Verification debt', 'Prompt injection through GUIs', 'No org-level proof yet'];
    const chips = risks.map((r) => K.el('div', { class: 'chip', html: `<span class="dot" style="background:var(--rose);width:8px;height:8px;opacity:.9"></span>${r}`, style: 'font-size:22px;padding:12px 22px;white-space:nowrap' }, row));
    gsap.set([lab, ...chips], { autoAlpha: 0 });
    gsap.set(line, { scaleX: 0 });
    tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: K.ease, immediateRender: false }, STRIP - 0.2);
    K.in(tl, lab, STRIP, { y: 10, d: 1.0 });
    chips.forEach((ch, i) => K.in(tl, ch, STRIP + 0.5 + i * 0.5, { y: 14, d: 1.1 }));
    const src = L.source(root, 'StrongDM Software Factory (Feb 2026) · Claude Opus 5.5 System Card · METR uplift update (Feb 2026) · Faros AI');
    tl.to(src, { opacity: 1, duration: 1 }, STRIP + 0.5);

    K.out(tl, [h.wrap, ...cards.map((c) => c.c), strip, src], 24.6, { d: 1.1 });
  },
});
