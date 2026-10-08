# Building scenes

The video is a deterministic HTML/GSAP timeline captured frame by frame. Everything on screen is a pure function of time `t`.

## Read first
- `src/engine.js`: `SF.scene({...})` and the helpers on `K` (`K.box`, `K.el`, `K.in`, `K.out`, `K.words`, `K.count`, `K.draw`, `K.ease*`).
- `src/lib.js`: `L.svg`, `L.loop` (continuous motion), `L.heading`/`L.revealHeading`, `L.quote`/`L.revealQuote`, `L.stat`, `L.dateAxis`, `L.node`, `L.edge`, `L.along`, `L.packets`, `L.source`, `L.rand`.
- `src/lib-factory.js`: the six-station factory line (`Factory.build`, `Factory.run`, `Factory.person`).
- `src/lib-ladder.js`: the diffusion ladder (`Ladder.build`, `Ladder.step`, `Ladder.bracket`).
- `src/styles.css`: type scale and color tokens.
- Reference scenes, which set the quality bar: `src/scenes/10-ladder.js`, `11-evidence.js`, `20-history.js`, `21-factory-line.js`.
- `docs/storyboard.md`: the whole story, so your scene connects to its neighbours.

## Scene contract
```js
SF.scene({
  id: 'my-scene', duration: 24, mood: 'calm',            // moods: calm, warm, cool, green, bright, dark
  chapter: { n: '03', title: 'The architecture', short: 'Architecture' },   // or null for title/BLUF/close
  hits: [12.0],                                           // optional: local times for a soft low "boom" in the score
  build(root, tl, K) { /* build DOM/SVG, schedule tweens on tl at local times */ },
});
```
Chapter objects must match exactly:
`01 The last wave / Coding` · `02 The software factory / Factory` · `03 The architecture / Architecture` · `04 The interfaces / Interfaces` · `05 The model / Opus 5.5` · `06 The next wave / Next wave`.

## Layout
- Canvas is 1920×1080. Keep content inside **x 160–1760, y 150–960**.
- Reserved areas: the top-left chapter label (96, 64), the top-right source line at y≈62 (`L.source`), and the bottom band below y≈975 (the persistent "thread").
- Type: `display`, `h1`, `h2`, `h3`, `body`, `small`, `label`, `mono`, `num`, `quote`. Labels must be at least 18 px and body text at least 22 px.
- Color meanings: **clay** `#e17b57` is our accent and the thesis. **Sage** is verified or positive. **Gold** marks time and highlights. **Sky** is info and feedback. **Rose** is partial or caution. Muted and dim are for secondary text. Never use alarm red.

## Pacing (the client's main note: calm, connected, no rushed transitions)
- Elements enter over 1.0–1.4 s with `K.easeOut` and leave over at least 0.8 s. No hard cuts.
- The first element enters at 0.4 s or later. Every element is gone by `duration − 0.3`, which leaves about 1 s of air before the next scene.
- Hold text for at least 2 s + 0.3 s per word before it leaves. One idea per screen.
- Swap captions in place: fade out over 0.8 s, wait about 0.2–0.4 s, then fade in.

## Determinism and performance
- Never use `Math.random()`, `Date`, `setTimeout`, CSS transitions or CSS animations. Use `L.rand(seed)` and `L.loop`.
- On an SVG `<g>`, animating `x`/`y` overwrites its `transform` attribute. Put the position on an outer `<g transform>` and animate an inner `<g>`.
- `fromTo` renders its from-state at build time. When an element must look different before its tween starts, use `immediateRender: false` and `gsap.set` the initial state.
- Don't use CSS `filter: blur` on large elements or SVG `feTurbulence`. Keep each scene under about 400 DOM nodes.

## Check your work, and actually look at it
```
node render/stills.mjs --only <your-file.js> --out dist/stills/<your-id> --every 1.5
```
Open the PNGs (build a contact sheet with PIL to see many at once). Check each of these:
- No overlaps or clipped text.
- Everything stays inside the safe area and is legible.
- The composition is balanced.
- Each element is visible when it should be.
- The scene ends clean.
- No console errors (they print at the end).

Iterate until it looks like a premium keynote slide brought to life.

## Rules for parallel builders
Only create your assigned scene files. Do not edit any other file (engine, libs, styles, manifest, other scenes). If you need a helper, define it inside your scene file.
