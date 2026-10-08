// Grab still frames for review.
//   node render/stills.mjs 12.5 40 61.2 ...        -> dist/stills/t012.50.png ...
//   node render/stills.mjs --every 2 --from 30 --to 60
//   node render/stills.mjs --scene <id> [--every 1.5]   (every N seconds across that scene)
//   node render/stills.mjs --review [--every 1]  -> dist/review/<scene>/... for every scene
//   add --only 30-arch.js[,31-x.js] to load just those scene files, --out dist/stills/<name> for a private folder
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf('--' + k); return i > -1 ? argv[i + 1] : undefined; };
const outDir = resolve(ROOT, opt('out') || 'dist/stills');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + resolve(ROOT, 'src/index.html') + (opt('only') ? '?only=' + opt('only') : ''));
await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
const { duration, cues } = await page.evaluate(() => ({ duration: window.DURATION, cues: window.CUES }));

let times = [];
const every = opt('every') ? +opt('every') : null;
if (argv.includes('--review')) {
  // One still per `every` seconds for every scene, foldered by scene id (global timestamps in names).
  const base = resolve(ROOT, 'dist/review');
  mkdirSync(base, { recursive: true });
  writeFileSync(resolve(base, 'cues.json'), JSON.stringify({ duration, cues }, null, 2));
  for (const c of cues) {
    const dir = resolve(base, c.id);
    mkdirSync(dir, { recursive: true });
    for (let t = c.start + 0.5; t < c.start + c.duration; t += every || 1) {
      await page.evaluate((x) => window.SF.seek(x), t);
      await page.screenshot({ path: resolve(dir, `t${t.toFixed(2).padStart(7, '0')}.png`) });
    }
    console.log('review', c.id);
  }
  if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
  await browser.close();
  process.exit(0);
}
if (opt('scene')) {
  const c = cues.find((c) => c.id === opt('scene'));
  if (!c) throw new Error('no scene ' + opt('scene') + '; have ' + cues.map((c) => c.id).join(','));
  for (let t = c.start; t < c.start + c.duration; t += every || 1.5) times.push(t);
} else if (every) {
  const a = +(opt('from') ?? 0), b = +(opt('to') ?? duration);
  for (let t = a; t < b; t += every) times.push(t);
} else {
  times = argv.filter((x) => !x.startsWith('--') && !isNaN(+x)).map(Number);
}

for (const t of times) {
  await page.evaluate((x) => window.SF.seek(x), t);
  const f = resolve(outDir, `t${t.toFixed(2).padStart(7, '0')}.png`);
  await page.screenshot({ path: f });
  console.log(f);
}
console.log(`duration=${duration.toFixed(2)}s`);
console.log(cues.map((c) => `${c.id}@${c.start.toFixed(1)}+${c.duration}`).join('  '));
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
