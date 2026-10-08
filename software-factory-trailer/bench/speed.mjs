import { launch, openPage } from '../render/browser.mjs';
const b = await launch();
for (const q of ['glscale=1', 'glscale=0.75', 'glscale=0.75&aa=0', 'glscale=0.5']) {
  const p = await openPage(b, { query: q });
  const cdp = await p.context().newCDPSession(p);
  await p.evaluate(() => window.SF.seek(0.1));
  const t0 = performance.now();
  for (let i = 0; i < 16; i++) { await p.evaluate((x) => window.SF.seek(x), 0.2 + i * 0.1); await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 }); }
  console.log(q.padEnd(22), ((performance.now() - t0) / 16).toFixed(0), 'ms/render');
  await p.context().close();
}
await b.close();
