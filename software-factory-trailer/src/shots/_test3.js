import { shot, beats } from '../engine.js';
shot({ id: 'test3', dur: beats(4), act: 'I', music: { section: 'act1', chord: 'Dm' },
  ui(root, tl, K, ctx) {
    ctx.fx.bars(0, 138);
    K.decode(tl, K.text(root, { y: 380, cls: 'cond', html: 'THE LINE WAITS.' }), 0.1, { d: 0.8 });
    K.stamp(tl, K.text(root, { y: 640, cls: 'slam hot', html: 'REVIEW.' }), 0.5);
    K.wipe(tl, K.text(root, { y: 820, cls: 'title', html: 'CLAUDE OPUS 5.5' }), 0.6, { dir: 'center', d: 0.8 });
  } });
