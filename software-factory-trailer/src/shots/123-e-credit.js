// e-credit — the true credit on black, whisper mono: MADE WITH CLAUDE OPUS 5.5 AGENTS ('5.5' in clay) / FROM ONE HUMAN BRIEF.
// Each line decodes left -> right; the last 15 frames fade to black (the only fade in the film).
import { shot, beats } from '../engine.js';
import { decodeRich } from './lib/b8-peak-end.js';

shot({
  id: 'e-credit', dur: beats(6), act: 'END',
  music: { section: 'end', chord: 'Dsus', div: 4, energy: 0.05, add: ['pad'], drop: ['ticks', 'drone', 'piano', 'strings'] },
  ui(root, tl, K, ctx) {
    ctx.fx.bars(0, 0);
    ctx.fx.fade(2.5, 0.5, 0, 1);
    K.el('div', { style: { position: 'absolute', left: '0px', top: '0px', width: '1920px', height: '1080px', background: '#000' } }, root);
    const st = { fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, fontSize: '30px', letterSpacing: '0.15em', paddingLeft: '0.15em', color: '#FAF9F5', textTransform: 'uppercase', whiteSpace: 'pre' };
    const a = K.text(root, { x: 960, y: 520, w: 1600, cls: 'mono', html: 'MADE WITH CLAUDE OPUS <span class="hot">5.5</span> AGENTS', style: st });
    const b = K.text(root, { x: 960, y: 570, w: 1600, cls: 'mono', html: 'FROM ONE HUMAN BRIEF', style: { ...st, color: 'rgba(250,249,245,0.82)' } });
    decodeRich(tl, a, 0.0, { d: 0.55, seed: 33 });
    decodeRich(tl, b, 0.5, { d: 0.45, seed: 41 });
  },
});
