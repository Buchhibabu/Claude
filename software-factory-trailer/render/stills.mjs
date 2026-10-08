// Stills for review.
//   node render/stills.mjs 1.5 3.2 ...                 -> dist/stills/t0001.50.png
//   node render/stills.mjs --every 0.5 [--from a --to b]
//   node render/stills.mjs --shot <id> [--every 0.25]
//   node render/stills.mjs --review [--every 0.5]       -> dist/review/<shot>/...  + cues.json
//   node render/stills.mjs --review --sheet [--every 0.25] -> also dist/review/<shot>.jpg (contact sheet, 4 columns)
//   --only a.js,b.js   load just those shot files     --out <dir>   private output folder
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { launch, openPage, ROOT } from './browser.mjs';
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf('--' + k); return i > -1 ? argv[i + 1] : undefined; };
const outDir = resolve(ROOT, opt('out') || 'dist/stills');
mkdirSync(outDir, { recursive: true });
const browser = await launch();
const page = await openPage(browser, { only: opt('only') });
const cues = await page.evaluate(() => window.CUES);
const every = opt('every') ? +opt('every') : null;
const snap = async (t, path) => { await page.evaluate((x) => window.SF.seek(x), t); await page.screenshot({ path }); };
if (argv.includes('--review')) {
  const base = resolve(ROOT, opt('out') || 'dist/review');
  mkdirSync(base, { recursive: true });
  writeFileSync(resolve(base, 'cues.json'), JSON.stringify(cues, null, 2));
  for (const s of cues.shots) {
    const dir = resolve(base, s.id); mkdirSync(dir, { recursive: true });
    for (let t = s.start + 0.05; t < s.start + s.dur; t += every || 0.5) await snap(t, resolve(dir, `t${t.toFixed(2).padStart(7, '0')}.png`));
    if (argv.includes('--sheet')) {
      const n = readdirSync(dir).filter((f) => f.endsWith('.png')).length, rows = Math.ceil(n / 4);
      const out = resolve(base, s.id + '.jpg');
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-pattern_type', 'glob', '-i', dir + '/*.png', '-vf', `scale=640:-1,drawtext=text='%{n}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6,tile=4x${rows}:padding=4:color=gray`, '-frames:v', '1', '-q:v', '3', out]);
      console.log('sheet', out);
    }
  }
} else {
  let times = [];
  if (opt('shot')) { const s = cues.shots.find((x) => x.id === opt('shot')); for (let t = s.start + 0.02; t < s.start + s.dur; t += every || 0.25) times.push(t); }
  else if (every) { const a = +(opt('from') ?? 0), b = +(opt('to') ?? cues.duration); for (let t = a; t < b; t += every) times.push(t); }
  else times = argv.filter((x) => !x.startsWith('--') && !isNaN(+x)).map(Number);
  for (const t of times) { const p = resolve(outDir, `t${t.toFixed(2).padStart(7, '0')}.png`); await snap(t, p); console.log(p); }
}
console.log(`duration=${cues.duration.toFixed(2)}s shots=${cues.shots.map((s) => s.id + '@' + s.start.toFixed(2)).join(' ')}`);
if (page._errors.length) console.log('ERRORS:\n' + page._errors.join('\n'));
await browser.close();
