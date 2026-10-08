// Render the HTML timeline to video.
//   node render/capture.mjs [--fps 30] [--workers 3] [--from 0] [--to <sec>] [--scale 1] [--out dist/video_silent.mp4]
// Each worker owns a contiguous frame range, seeks the deterministic timeline frame by frame,
// and streams JPEG frames into its own ffmpeg encoder. Segments are concatenated losslessly.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const FPS = +arg('fps', 30);
const WORKERS = +arg('workers', 3);
const SCALE = +arg('scale', 1);
const OUT = resolve(ROOT, arg('out', 'dist/video_silent.mp4'));
const PAGE = 'file://' + resolve(ROOT, 'src/index.html');

const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--font-render-hinting=none'] });

async function openPage() {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SCALE });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  return page;
}

// Probe duration + cues.
const probe = await openPage();
const meta = await probe.evaluate(() => ({ duration: window.DURATION, cues: window.CUES }));
await probe.context().close();
mkdirSync(resolve(ROOT, 'dist'), { recursive: true });
writeFileSync(resolve(ROOT, 'dist/cues.json'), JSON.stringify(meta, null, 2));

const from = +arg('from', 0);
const to = Math.min(+arg('to', meta.duration), meta.duration);
const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
const total = f1 - f0;
console.log(`duration ${meta.duration.toFixed(2)}s · rendering ${from}s→${to.toFixed(2)}s = ${total} frames @${FPS}fps · ${WORKERS} workers`);

const segDir = resolve(ROOT, 'dist/.segments');
rmSync(segDir, { recursive: true, force: true });
mkdirSync(segDir, { recursive: true });

const per = Math.ceil(total / WORKERS);
let done = 0;
const t0 = Date.now();

async function worker(w) {
  const a = f0 + w * per, b = Math.min(f0 + (w + 1) * per, f1);
  if (a >= b) return null;
  const seg = resolve(segDir, `seg_${String(w).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const page = await openPage();
  const cdp = await page.context().newCDPSession(page);
  // Pre-roll: walk the timeline up to the start so every callback-driven state is primed.
  for (let s = 0; s < a / FPS; s += 2) await page.evaluate((t) => window.SF.seek(t), s);
  for (let f = a; f < b; f++) {
    await page.evaluate((t) => window.SF.seek(t), f / FPS);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 96, optimizeForSpeed: false });
    const buf = Buffer.from(data, 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    done++;
    if (done % 300 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`  ${done}/${total} frames · ${(done / el).toFixed(1)} fps · eta ${Math.round((total - done) / (done / el))}s`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.context().close();
  return seg;
}

const segs = (await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)))).filter(Boolean);
await browser.close();
writeFileSync(resolve(segDir, 'list.txt'), segs.map((s) => `file '${s}'`).join('\n'));
await new Promise((r, j) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', resolve(segDir, 'list.txt'), '-c', 'copy', OUT], { stdio: 'inherit' })
  .on('close', (c) => (c === 0 ? r() : j(new Error('concat failed')))));
console.log(`wrote ${OUT} in ${Math.round((Date.now() - t0) / 1000)}s`);
