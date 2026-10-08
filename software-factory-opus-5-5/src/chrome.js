// Persistent layers that live above/below every scene:
//  - slow ambient light (continuity between scenes; color follows the chapter's mood)
//  - chapter label (top-left)
//  - "the thread": one dot per chapter along the bottom; a line keeps creeping from dot to dot
//    as the story advances, so the viewer literally watches the dots get connected.
window.SF_CHROME = function (master, cues, K) {
  const bg = document.getElementById('bg');
  const chrome = document.getElementById('chrome');
  const T = cues.length ? cues[cues.length - 1].start + cues[cues.length - 1].duration : 1;

  // ---------- ambient light ----------
  const orbs = [
    { c: '#e17b57', x: 300, y: 250, s: 900 },
    { c: '#82a9dc', x: 1300, y: 600, s: 1000 },
    { c: '#8fc0a6', x: 800, y: 900, s: 800 },
  ].map((o) => K.box(bg, { x: o.x, y: o.y, w: o.s, h: o.s, cls: 'orb', style: { background: `radial-gradient(circle at 50% 50%, ${o.c} 0%, ${o.c}99 18%, ${o.c}33 42%, transparent 68%)` } }));
  // Drift: slow figure-eight paths over the whole runtime.
  orbs.forEach((o, i) => {
    const steps = 14;
    for (let k = 0; k < steps; k++) {
      const t = (T / steps) * k;
      master.to(o, { x: Math.sin(k * 1.3 + i * 2) * 260, y: Math.cos(k * 0.9 + i) * 160, duration: T / steps, ease: 'sine.inOut' }, t);
    }
  });
  const moods = {
    calm: [0.10, 0.06, 0.04], warm: [0.16, 0.04, 0.03], cool: [0.05, 0.13, 0.05],
    green: [0.05, 0.05, 0.12], bright: [0.15, 0.11, 0.08], dark: [0.03, 0.02, 0.02],
  };
  gsap.set(orbs, { opacity: 0 });
  cues.forEach((c) => {
    const m = moods[c.mood] || moods.calm;
    orbs.forEach((o, i) => master.to(o, { opacity: m[i], duration: 3, ease: 'sine.inOut' }, Math.max(0, c.start - 1)));
  });

  // ---------- chapter label ----------
  const label = K.el('div', { id: 'chapter' }, chrome);
  const n = K.el('span', { class: 'n' }, label);
  const t = K.el('span', { class: 't' }, label);
  gsap.set(label, { autoAlpha: 0 });
  let prev = null;
  cues.forEach((c) => {
    const ch = c.chapter;
    const key = ch ? ch.n : null;
    if (key === prev) return;
    master.to(label, { autoAlpha: 0, duration: 0.6, ease: 'power1.in' }, Math.max(0, c.start - 0.2));
    if (ch) master.to(label, { autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, c.start + 0.5);
    prev = key;
  });
  // Label text is a pure function of time (seek-safe in both directions).
  const chapterAt = (time) => { let ch = null; for (const c of cues) if (time >= c.start + 0.45) ch = c.chapter; return ch; };
  const proxy = { t: 0 };
  master.to(proxy, { t: T, duration: T, ease: 'none', onUpdate: () => { const ch = chapterAt(proxy.t); if (ch) { n.textContent = ch.n; t.textContent = ch.title; } } }, 0);

  // ---------- the thread ----------
  const chapters = [];
  cues.forEach((c) => {
    if (!c.chapter) return;
    let ch = chapters.find((x) => x.n === c.chapter.n);
    if (!ch) { ch = { ...c.chapter, start: c.start, end: c.start + c.duration }; chapters.push(ch); }
    ch.end = Math.max(ch.end, c.start + c.duration);
  });
  if (!chapters.length) return;
  const svg = K.el('svg', { id: 'thread', width: 1920, height: 1080 }, chrome);
  const Y = 1012, X0 = 520, X1 = 1400;
  const xs = chapters.map((_, i) => X0 + (chapters.length === 1 ? 0 : (i * (X1 - X0)) / (chapters.length - 1)));
  const g = K.el('g', {}, svg);
  K.el('line', { x1: X0, y1: Y, x2: X1, y2: Y, stroke: '#2a2925', 'stroke-width': 1.5 }, g);
  const live = K.el('line', { x1: X0, y1: Y, x2: X0, y2: Y, stroke: '#e17b57', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
  const dots = chapters.map((ch, i) => {
    const ring = K.el('circle', { cx: xs[i], cy: Y, r: 9, fill: 'none', stroke: '#e17b57', 'stroke-width': 1.5, opacity: 0 }, g);
    const d = K.el('circle', { cx: xs[i], cy: Y, r: 4.5, fill: '#3a3832' }, g);
    const l = K.el('text', { x: xs[i], y: Y + 32, 'text-anchor': 'middle', class: 'lbl' }, g);
    l.textContent = ch.short || ch.title;
    return { ring, d, l };
  });
  gsap.set(g, { autoAlpha: 0 });
  master.to(g, { autoAlpha: 1, duration: 1.5 }, chapters[0].start + 0.5);
  master.to(g, { autoAlpha: 0, duration: 1.5 }, chapters[chapters.length - 1].end - 1.2);
  chapters.forEach((ch, i) => {
    // Arrive at this chapter's dot.
    master.to(dots[i].d, { attr: { r: 6 }, fill: '#e17b57', duration: 0.8, ease: 'back.out(2)' }, ch.start + 0.3);
    master.fromTo(dots[i].ring, { attr: { r: 6 }, opacity: 0.9 }, { attr: { r: 22 }, opacity: 0, duration: 1.6, ease: 'power2.out', immediateRender: false }, ch.start + 0.3);
    master.to(dots[i].l, { fill: '#c9c3b6', duration: 0.8 }, ch.start + 0.3);
    if (i > 0) master.to(dots[i - 1].l, { fill: '#5f5b52', duration: 0.8 }, ch.start + 0.3);
    // Creep toward the next dot over the chapter (stops a little short; the arrival closes the gap).
    if (i < chapters.length - 1) {
      const span = ch.end - ch.start;
      master.to(live, { attr: { x2: xs[i] + (xs[i + 1] - xs[i]) * 0.85 }, duration: Math.max(1, span - 1.5), ease: 'none' }, ch.start + 0.3);
      master.to(live, { attr: { x2: xs[i + 1] }, duration: 1.0, ease: 'power2.inOut' }, chapters[i + 1].start - 0.7);
    }
  });
};
