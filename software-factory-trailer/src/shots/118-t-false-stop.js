// t-false-stop — the false stop: 0.8 s of pure black and true silence (hard-mutes the music and every tail).
import { shot, beats } from '../engine.js';

shot({
  id: 't-false-stop', dur: beats(2, 150), act: 'TITLE',
  music: { section: 'end', chord: 'Dsus', div: 4, energy: 0.0, add: [], drop: ['drone', 'pad', 'pulse', 'ostinato', 'kick', 'drums', 'strings', 'piano', 'hats', 'heart', 'ticks'] },
  ui(root, tl, K, ctx) {
    ctx.fx.bars(0, 0);
    ctx.sfx(0, 'silence', { dur: 0.8, gain: 0 });
    K.el('div', { style: { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', background: '#000' } }, root);
  },
});
