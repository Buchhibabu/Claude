// The factory line: reused in the "what is a software factory" chapter and again in the
// architecture + finale chapters, so the viewer keeps seeing the same machine grow.
window.Factory = (function () {
  const K = SF.K;

  const STATIONS = [
    { id: 'intent', name: 'Intent', sub: 'what & why' },
    { id: 'spec', name: 'Spec', sub: 'scenarios, acceptance' },
    { id: 'build', name: 'Build', sub: 'agents write code' },
    { id: 'verify', name: 'Verify', sub: 'tests, twins, evals' },
    { id: 'ship', name: 'Ship', sub: 'CI/CD, rollout' },
    { id: 'operate', name: 'Operate', sub: 'monitor, fix, learn' },
  ];

  function person(parent, x, y, color = '#efe9dd', s = 1) {
    const g = K.el('g', { transform: `translate(${x},${y}) scale(${s})` }, parent);
    K.el('circle', { cx: 0, cy: -22, r: 11, fill: 'none', stroke: color, 'stroke-width': 2.2 }, g);
    K.el('path', { d: 'M-20,16 C-20,-4 20,-4 20,16', fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
    return g;
  }

  // Build the line into an SVG. Returns handles for animation.
  function build(svg, { y = 560, x0 = 300, x1 = 1620, w = 168, h = 120, humanOff = 190, beltPad = 150, personScale = 1, humanLabels = null } = {}) {
    const n = STATIONS.length;
    const xs = STATIONS.map((_, i) => x0 + (i * (x1 - x0)) / (n - 1));
    const g = K.el('g', {}, svg);
    const belt = K.el('line', { x1: x0 - beltPad, y1: y, x2: x1 + beltPad, y2: y, stroke: '#34322c', 'stroke-width': 2, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round' }, g);
    const itemsG = K.el('g', {}, g);
    const st = STATIONS.map((s, i) => {
      const outer = K.el('g', { transform: `translate(${xs[i]},${y})` }, g);
      const sg = K.el('g', {}, outer);
      const glow = K.el('rect', { x: -w / 2 - 18, y: -h / 2 - 18, width: w + 36, height: h + 36, rx: 34, fill: '#e17b57', opacity: 0 }, sg);
      const box = K.el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 22, fill: '#141412', stroke: '#3a3832', 'stroke-width': 1.5 }, sg);
      const name = K.el('text', { x: 0, y: -h / 2 - 26, 'text-anchor': 'middle', fill: '#efe9dd', 'font-family': 'Inter', 'font-size': 22, 'font-weight': 600, 'letter-spacing': '0.16em' }, sg);
      name.textContent = s.name.toUpperCase();
      const sub = K.el('text', { x: 0, y: h / 2 + 40, 'text-anchor': 'middle', fill: '#9c978b', 'font-family': 'Inter', 'font-size': 21 }, sg);
      sub.textContent = s.sub;
      const agents = Array.from({ length: 3 }, () => K.el('circle', { r: 5, fill: '#e17b57', opacity: 0 }, sg));
      const core = K.el('circle', { r: 3, fill: '#5f5b52' }, sg);
      return { ...s, x: xs[i], g: sg, glow, box, name, sub, agents, core, on: 1 };
    });
    // Feedback arc: Operate -> Intent, over the top.
    const fb = K.el('path', { d: `M${xs[n - 1]},${y - h / 2 - 64} C${xs[n - 1]},${y - 330} ${xs[0]},${y - 330} ${xs[0]},${y - h / 2 - 64}`, fill: 'none', stroke: '#82a9dc', 'stroke-width': 1.6, 'stroke-dasharray': '4 8', opacity: 0, 'marker-end': 'url(#arrow)' }, g);
    const fbLabel = K.el('text', { x: (xs[0] + xs[n - 1]) / 2, y: y - 222, 'text-anchor': 'middle', fill: '#82a9dc', 'font-family': 'Inter', 'font-size': 20, 'font-weight': 500, 'letter-spacing': '0.06em', opacity: 0 }, g);
    fbLabel.textContent = 'production signals become new intent';
    const fbDots = Array.from({ length: 5 }, () => K.el('circle', { r: 3.5, fill: '#82a9dc', opacity: 0 }, g));
    const humanL = person(g, x0 - humanOff, y + 12, '#efe9dd', personScale);
    const humanR = person(g, x1 + humanOff, y + 12, '#efe9dd', personScale);
    if (humanLabels) {
      [[humanL, x0 - humanOff, humanLabels[0]], [humanR, x1 + humanOff, humanLabels[1]]].forEach(([hg, hx, txt]) => {
        const t = K.el('text', { x: hx, y: y + 12 + 52 * personScale, 'text-anchor': 'middle', fill: '#9c978b', 'font-family': 'Inter', 'font-size': 20 }, g);
        t.textContent = txt;
        hg._label = t;
      });
    }
    gsap.set([humanL, humanR, humanL._label, humanR._label].filter(Boolean), { opacity: 0 });
    const items = Array.from({ length: 9 }, () => K.el('rect', { width: 14, height: 14, rx: 3, x: -7, y: -7, fill: '#e17b57', opacity: 0 }, itemsG));
    return { g, belt, st, xs, y, w, h, fb, fbLabel, fbDots, humanL, humanR, items, x0, x1, beltPad, _fbVis: 0 };
  }

  // Continuous motion for agents + items + feedback packets (pure function of time).
  function run(tl, F, at, dur, { flow = true, agentsOn = true, feedback = false, itemsAt = 0 } = {}) {
    const bp = F.beltPad ?? 150, L0 = F.x0 - bp, L1 = F.x1 + bp, span = L1 - L0;
    const fbLen = F.fb.getTotalLength();
    L.loop(tl, at, dur, (t) => {
      const fadeIn = Math.min(1, t / 1.2), fadeOut = Math.min(1, (dur - t) / 1.0), vis = Math.min(fadeIn, fadeOut);
      if (agentsOn) F.st.forEach((s, i) => s.agents.forEach((a, k) => {
        const ang = t * (1.1 + 0.25 * i) + (k * Math.PI * 2) / 3 + i;
        a.setAttribute('cx', (Math.cos(ang) * 26).toFixed(2));
        a.setAttribute('cy', (Math.sin(ang) * 16).toFixed(2));
        a.setAttribute('opacity', (0.9 * vis * (s.on ?? 1)).toFixed(3));
      }));
      if (flow) {
        const tt = Math.max(0, t - itemsAt);
        const vis2 = Math.min(Math.min(1, tt / 1.2), fadeOut);
        F.items.forEach((it, i) => {
          const u = ((tt * 70 + (i * span) / F.items.length) % span + span) % span;
          const x = L0 + u;
          // Items are hidden while "inside" a station (the box covers them) and turn green after Verify.
          const verified = x > F.xs[3];
          it.setAttribute('transform', `translate(${x.toFixed(1)},${F.y})`);
          it.setAttribute('fill', verified ? '#8fc0a6' : '#e17b57');
          const edge = Math.min(1, (x - L0) / 80, (L1 - x) / 80);
          it.setAttribute('opacity', (Math.max(0, edge) * vis2).toFixed(3));
        });
      }
      if (feedback) {
        F.fbDots.forEach((d, i) => {
          const u = ((t * 0.16 + i / F.fbDots.length) % 1);
          const p = F.fb.getPointAtLength(u * fbLen);
          d.setAttribute('cx', p.x.toFixed(1)); d.setAttribute('cy', p.y.toFixed(1));
          d.setAttribute('opacity', (Math.sin(u * Math.PI) * vis * F._fbVis).toFixed(3));
        });
      }
    });
  }

  return { STATIONS, build, run, person };
})();
