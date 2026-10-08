// Loads shots in manifest order (or ?only=a.js,b.js), waits for fonts, builds the master timeline.
import { build } from './engine.js';
gsap.registerPlugin(DrawSVGPlugin);
const only = new URLSearchParams(location.search).get('only');
const files = only ? only.split(',') : (await import('./shots/manifest.js')).default;
for (const f of files) await import('./shots/' + f);
for (const f of ['800 100px "Inter Tight"', '300 100px "Inter Tight"', '900 100px "Inter Tight"', '400 100px "Anton"', '400 100px "Bebas Neue"', 'italic 400 100px "Instrument Serif"', '500 40px "JetBrains Mono"', '500 40px "Space Grotesk"']) await document.fonts.load(f);
await document.fonts.ready;
build();
window.READY = true;
