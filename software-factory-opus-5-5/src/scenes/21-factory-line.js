// Chapter 02: one station -> the whole line. People leave the stations for the edges (intent in, judgment out);
// agents work every station in between. Ends on the bridge into Ch03 (who structures the fleet?).
SF.scene({ id: 'factory-line', duration: 32, mood: 'warm', chapter: { n: '02', title: 'The software factory', short: 'Factory' }, build(root, tl, K) {
  const D = 32;
  const T = {
    h1: 0.9, belt: 1.4, stations: 1.8, spot: 4.2, h1Out: 8.0,
    h2: 9.2, swap: 9.6, items: 10.4, humans: 11.0, fb: 13.0,
    def: 15.2, defOut: 23.6, bridge: 24.6, out: 30.3,
  };
  const s = L.svg(root);
  const F = Factory.build(s, { y: 600, x0: 384, x1: 1536, humanOff: 174, beltPad: 130, personScale: 1.3, humanLabels: ['intent', 'judgment'] });
  // Edge labels echo the definition's italic words; set on the station-subtitle baseline.
  [F.humanL._label, F.humanR._label].forEach((t) => {
    t.setAttribute('y', F.y + F.h / 2 + 40);
    t.setAttribute('font-family', 'Instrument Serif'); t.setAttribute('font-style', 'italic');
    t.setAttribute('font-size', 28); t.setAttribute('fill', '#efe9dd');
  });
  const h1 = L.heading(root, { x: 160, y: 170, kicker: 'The last wave', title: 'The coding agent transformed <em class="clay">one station.</em>', size: 'h2' });
  const h2 = L.heading(root, { x: 160, y: 170, kicker: 'The next wave · so far, only “a handful” of teams', title: 'The factory automates <em class="clay">the line.</em>', size: 'h2' });
  const src = L.source(root, 'Dan Shapiro, “The five levels” (Jan 2026)');

  // Phase 1: people staff every station except Build, where the coding agent works.
  const others = F.st.filter((st) => st.id !== 'build');
  const ppl = others.map((st) => Factory.person(st.g, 0, 10, '#9c978b', 0.72));
  // Station agents ('on'), the people, the core dots and the feedback visibility are a pure function of scene time.
  // Factory.run's loop reads 'on' and '_fbVis', so the setter runs once just before that loop (forward seeks) and once
  // just after it in timeline order (backward seeks render children last-to-first). Nothing ever lags a frame.
  const smooth = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
  const drive = (t) => {
    const on = smooth((t - T.swap - 0.1) / 1.2);                       // agents arrive as the people leave
    const pv = (1 - 0.68 * smooth((t - T.spot) / 1.0)) * (1 - smooth((t - T.swap + 0.2) / 0.8));
    others.forEach((st, i) => {
      st.on = on;
      ppl[i].setAttribute('opacity', pv.toFixed(3));
      st.core.setAttribute('opacity', on.toFixed(3));
    });
    F._fbVis = smooth((t - T.fb) / 1.4);
  };
  drive(0);
  L.loop(tl, 0, D, drive);

  L.revealHeading(tl, h1, T.h1);
  K.draw(tl, F.belt, T.belt, 2.2);
  tl.fromTo(F.st.map((st) => st.g), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.25, ease: K.easeOut }, T.stations);
  // Spotlight Build. Dim the other stations' text and outline only, so their opaque fill keeps hiding the belt.
  const dimmed = others.flatMap((st) => [st.name, st.sub]);
  tl.to(dimmed, { opacity: 0.32, duration: 1.0 }, T.spot);
  tl.to(others.map((st) => st.box), { stroke: '#262520', duration: 1.0 }, T.spot);
  tl.to(F.st[2].box, { stroke: '#e17b57', duration: 1.0 }, T.spot);
  tl.to(F.st[2].glow, { opacity: 0.10, duration: 1.0 }, T.spot);
  K.out(tl, h1.wrap, T.h1Out);

  // Phase 2: the whole line.
  L.revealHeading(tl, h2, T.h2);
  tl.to(src, { opacity: 1, duration: 1.0 }, T.h2 + 0.4);
  tl.to(dimmed, { opacity: 1, duration: 1.2 }, T.swap);
  tl.to(F.st.map((st) => st.box), { stroke: '#5f5b52', duration: 1.2 }, T.swap);
  tl.to(F.st[2].glow, { opacity: 0, duration: 1.2 }, T.swap);
  Factory.run(tl, F, T.stations, T.out + 1.2 - T.stations, { flow: true, itemsAt: T.items - T.stations, feedback: true });
  const T_LATE = T.stations + 0.01;
  L.loop(tl, T_LATE, D - T_LATE, (t) => drive(t + T_LATE));

  // Humans move to the edges.
  tl.to([F.humanL, F.humanL._label], { opacity: 1, duration: 1.2 }, T.humans);
  tl.to([F.humanR, F.humanR._label], { opacity: 1, duration: 1.2 }, T.humans + 0.4);
  // Production feedback closes the loop.
  tl.to([F.fb, F.fbLabel], { opacity: 1, duration: 1.4 }, T.fb);

  // Working definition (20 words incl. kicker → 8.0 s).
  const def = K.box(root, { x: 260, y: 770, w: 1400, html: '<div class="label" style="color:var(--clay);margin-bottom:18px;text-align:center">Working definition</div><div class="h3 center" style="font-family:var(--serif);font-weight:400;font-size:44px;line-height:1.22">A governed production line: humans supply <em>intent</em> and <em>judgment</em>; fleets of agents plan, build, verify, ship and operate.</div>' });
  K.in(tl, def, T.def, { d: 1.4 });
  K.out(tl, def, T.defOut, { d: 0.8 });

  // Bridge into Ch03 ("Who runs the line?"): structure is the open question.
  const br = K.box(root, { x: 160, y: 812, w: 1600, cls: 'h2 center', html: 'A fleet without structure <em class="clay">multiplies its own mistakes.</em>', style: { fontSize: '50px' } });
  K.words(tl, br, T.bridge, { stagger: 0.07 });

  K.out(tl, [h2.wrap, br, s, src], T.out, { d: 1.2 });
}});
