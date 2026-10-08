// Chapter 01: the coding-agent wave as a diffusion ladder on a real date axis.
// Pacing: each caption deck holds >= 2 s + 0.3 s/word (kicker + text), counted from fade-in to fade-out.
// Rung tags carry the only relative clock (+N wks); kickers are plain dates.
SF.scene({
  id: 'ladder', duration: 52, mood: 'warm', overlap: 0,
  chapter: { n: '01', title: 'The last wave', short: 'Coding' },
  hits: [7.2, 46.3], // Capability rung lands; the gap bracket + headline
  build(root, tl, K) {
    const s = L.svg(root);
    const P = (t) => `<span style="color:var(--paper)">${t}</span>`;
    const M = (t) => `<span style="color:var(--muted)">${t}</span>`;
    const WHO = '<b style="color:var(--paper)">Andrej Karpathy</b> &nbsp;·&nbsp; ';
    const Ld = Ladder.build(root, s, {
      from: '2025-10-01', to: '2026-05-10', axisY: 850, top: 460,
      ticks: [
        { d: '2025-10-01', label: 'OCT' }, { d: '2025-11-01', label: 'NOV' }, { d: '2025-12-01', label: 'DEC' },
        { d: '2026-01-01', label: 'JAN 2026' }, { d: '2026-02-01', label: 'FEB' }, { d: '2026-03-01', label: 'MAR' },
        { d: '2026-04-01', label: 'APR' }, { d: '2026-05-01', label: 'MAY' },
      ],
      rungs: [
        // Kicker is an invisible spacer: the date already sits on the rung ('Oct 17'), and both Karpathy quotes keep the same baseline.
        { date: '2025-10-17', tag: 'Skeptics', when: 'Oct 17', muted: true, level: 800, anchor: 'start',
          kicker: '&nbsp;', quote: 'They just don’t work.', who: WHO + 'on AI agents', size: 72 },
        { date: '2025-11-24', tag: 'Capability', when: 'Day 0', level: 745,
          kicker: 'November 24', title: 'Claude Opus 4.5 ships.',
          sub: 'Anthropic: it outscored every human candidate on its 2-hour take-home.<br>' + M('Press coverage: routine.') },
        { date: '2025-12-26', tag: 'Practitioners', when: '+5 wks', level: 675,
          kicker: 'December 26', quote: 'I’ve never felt this much behind as a programmer.', who: WHO + 'the same skeptic', size: 72 },
        { date: '2026-01-19', tag: 'Press', when: '+8 wks', level: 605,
          kicker: 'Mid-January', title: 'The Atlantic. WSJ. Bloomberg. NYT.',
          sub: 'WSJ: “They call it getting ' + `<em style="color:var(--paper)">Claude-pilled</em>.”` },
        { date: '2026-02-03', tag: 'Markets', when: '+10 wks', level: 535, anchor: 'start',
          kicker: 'February 3', title: 'A <span class="clay">$285 billion</span> stock rout.',
          sub: 'Sparked by an Anthropic tool for lawyers. Jefferies’ desk calls it the “SaaSpocalypse.”' },
        { date: '2026-04-06', tag: 'Budgets', when: '+19 wks', level: 460, anchor: 'end', glow: 'gold',
          kicker: 'April 6', title: 'The money follows.',
          sub: 'Anthropic-reported run-rate: ' + P('~$9B → $30B+') + ' in one quarter.' },
      ],
    });
    const src = L.source(root, 'Dwarkesh Podcast · Anthropic (take-home: best of parallel tries) · @karpathy on X · The Atlantic · WSJ · Bloomberg · NYT');
    tl.to(src, { opacity: 1, duration: 1 }, 1.2);
    gsap.set(Ld.ax.g, { autoAlpha: 0 });
    tl.to(Ld.ax.g, { autoAlpha: 1, duration: 1.6 }, 0.4);
    // Deck i is readable from step+0.9 until the next step-0.2.
    // Words (kicker incl.) -> required hold: 9->4.7, 19->7.7, 16->6.8, 12->5.6, 20->8.0, 12->5.6.
    Ladder.step(tl, Ld, 0, 0.4);
    Ladder.step(tl, Ld, 1, 6.2);
    Ladder.step(tl, Ld, 2, 15.0);
    Ladder.step(tl, Ld, 3, 22.9);
    Ladder.step(tl, Ld, 4, 29.6);
    Ladder.step(tl, Ld, 5, 38.7);
    // The gap.
    tl.to(Ld.decks[5], { autoAlpha: 0, y: -10, duration: 0.8, ease: 'power2.in' }, 45.3);
    const br = Ladder.bracket(tl, s, Ld, 1, 5, 45.7, '≈ 5 months from capability to budget', 912);
    // Keep the payoff label inside the safe area (local override; the shared lib default serves ladder2).
    br.t.setAttribute('y', 948);
    br.t.setAttribute('font-size', 34);
    const end = L.heading(root, { x: 160, y: 200, title: 'Capability arrived in November.<br><span class="muted">Belief arrived in April.</span>', size: 'h1' });
    L.revealHeading(tl, end, 46.4);
    K.out(tl, [s, end.wrap, src], 50.9, { d: 0.8 });
  },
});
