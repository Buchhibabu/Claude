// 64 d-who-runs — THE DROP. True black (2D only, no 3D pass). One second of nothing (the silence air-pocket). At 1.0 a small ivory
// cursor block (0.6:1, the c-rewind cursor's aspect) appears dead centre on the tick; from 1.2 the question types at 1 char/frame in
// mono lowercase, the line staying centred like a centred input (text grows symmetric, cursor riding its end, solid while typing),
// then the cursor blinks on the tick. At 3.2 the line clears: the text cuts out and the cursor alone returns to dead centre, blinks
// once on 3.5 and is gone for the last 7 frames — the bank-1 panel of iii-bank-1 slams on in its exact screen position.
import { shot, beats } from '../engine.js';

const TEXT = 'who runs the line?';
const IVORY = '#FAF9F5';

shot({
  id: 'd-who-runs', dur: beats(8), act: 'DROP',
  music: { section: 'turn', chord: 'Dm', div: 4, energy: 0.05, add: ['ticks'], drop: ['drone', 'pulse', 'ostinato', 'kick', 'drums', 'strings', 'heart'] },
  ui(root, tl, K, ctx) {
    ctx.fx.bars(0, 138);
    ctx.sfx(0, 'silence', { dur: 1.0, gain: 0 });
    ctx.sfx(1.0, 'tick', { gain: -6 });
    ctx.sfx(1.2, 'chirps', { gain: -18 });
    ctx.sfx(2.25, 'sub_drop', { gain: -8 });
    ctx.sfx(2.75, 'sub_drop', { gain: -8 });
    ctx.sfx(3.25, 'reverse_swell', { dur: 0.75, gain: -4 });
    // true black over the (unrendered) GL canvas
    K.el('div', { style: { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', background: '#000' } }, root);
    // a centred line: [text][gap][cursor]; flex keeps text + cursor centred as it grows
    const line = K.el('div', { style: { position: 'absolute', left: '0px', top: '540px', width: '1920px', height: '0px', display: 'flex', justifyContent: 'center', alignItems: 'center', lineHeight: '1' } }, root);
    const txt = K.el('span', { class: 'mono', text: TEXT, style: { fontSize: '48px', color: IVORY, whiteSpace: 'pre', letterSpacing: '0.01em', marginRight: '6px', transform: 'translateY(-1px)' } }, line);
    const cur = K.el('span', { style: { display: 'inline-block', width: '29px', height: '48px', background: IVORY, flex: '0 0 auto' } }, line);
    const TYPE_AT = 1.2, TYPE_D = TEXT.length / 30, OUT = 3.2;
    // text: absent from layout until typing starts (cursor alone is dead centre), types at 1 char/frame, cut at 3.2 (cursor recentres)
    gsap.set(txt, { display: 'none' });
    tl.set(txt, { display: 'inline' }, TYPE_AT);
    K.typewriter(tl, txt, TYPE_AT, TYPE_D);
    tl.set(txt, { display: 'none' }, OUT);
    gsap.set(cur, { autoAlpha: 0 });
    // cursor: on the tick at 1.0, solid through the typing, then blinks on the tick (first half of each beat); off at the clear,
    // relights once at 3.5, black for the last 7 frames
    const typedEnd = TYPE_AT + TYPE_D;
    const states = [[1.0, 1], [2.0, 1], [2.25, 0], [2.5, 1], [2.75, 0], [3.0, 1], [OUT, 0], [3.5, 1], [3.75, 0]];
    tl.set(cur, { autoAlpha: 1 }, 1.0);
    tl.set(cur, { autoAlpha: 0 }, typedEnd + 0.05 < 2.0 ? Math.max(typedEnd + 0.05, 1.75) : 1.95);
    for (const [at, on] of states.slice(1)) tl.set(cur, { autoAlpha: on }, at);
  },
});
