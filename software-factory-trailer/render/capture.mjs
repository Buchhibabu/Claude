// Render the trailer to video.
//   node render/capture.mjs [--fps 30] [--blur 2] [--workers 3] [--from s] [--to s] [--out dist/video_silent.mp4]
// --blur N renders N sub-frames per output frame and averages them (ffmpeg tmix) -> real motion blur.
// Shots cut on 1/fps boundaries, so sub-frame groups never straddle a cut. tmix averages frame n with the N-1 before it,
// so we keep the LAST sub-frame of each group (its window is exactly that group; keeping the first would blend across cuts).
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, openPage, ROOT } from './browser.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const FPS = +arg('fps', 30), BLUR = Math.max(1, +arg('blur', 2)), WORKERS = +arg('workers', 3);
const OUT = resolve(ROOT, arg('out', 'dist/video_silent.mp4'));
const SUB = FPS * BLUR;

const browser = await launch();
const probe = await openPage(browser, { only: arg('only') });
const cues = await probe.evaluate(() => window.CUES);
await probe.context().close();
mkdirSync(resolve(ROOT, 'dist'), { recursive: true });
writeFileSync(resolve(ROOT, 'dist/cues.json'), JSON.stringify(cues, null, 2));

const from = +arg('from', 0), to = Math.min(+arg('to', cues.duration), cues.duration);
const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS), total = f1 - f0;
console.log(`trailer ${cues.duration.toFixed(2)}s · frames ${total} @${FPS}fps × blur ${BLUR} · ${WORKERS} workers`);
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
  const vf = BLUR > 1 ? ['-vf', `tmix=frames=${BLUR}:weights=${Array(BLUR).fill(1).join(' ')},select='eq(mod(n\\,${BLUR})\\,${BLUR - 1})',setpts=N/${FPS}/TB`] : [];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(SUB), '-c:v', 'mjpeg', '-i', '-', ...vf,
    '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const page = await openPage(browser, { only: arg('only') });
  const cdp = await page.context().newCDPSession(page);
  for (let f = a; f < b; f++) {
    for (let k = 0; k < BLUR; k++) {
      // Sub-frames sample the first half of the frame interval (180° shutter).
      const t = (f + (BLUR > 1 ? (k / BLUR) * 0.5 : 0)) / FPS;
      await page.evaluate((x) => window.SF.seek(x), t);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 });
      const buf = Buffer.from(data, 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    done++;
    if (done % 150 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`  ${done}/${total} · ${(done / el).toFixed(2)} fps · eta ${Math.round((total - done) / (done / el))}s`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  if (page._errors.length) console.log(`worker ${w} page errors:`, page._errors.slice(0, 5).join(' | '));
  await page.context().close();
  return seg;
}
const segs = (await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)))).filter(Boolean);
await browser.close();
writeFileSync(resolve(segDir, 'list.txt'), segs.map((s) => `file '${s}'`).join('\n'));
await new Promise((r, j) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', resolve(segDir, 'list.txt'), '-c', 'copy', OUT], { stdio: 'inherit' }).on('close', (c) => (c === 0 ? r() : j(new Error('concat failed')))));
console.log(`wrote ${OUT} in ${Math.round((Date.now() - t0) / 1000)}s`);
