import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => console.log('console', m.text()));
await p.goto('file://' + process.cwd() + '/bench/gl.html');
await p.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
console.log('renderer', await p.evaluate(() => window.GL));
const cdp = await p.context().newCDPSession(p);
const t0 = performance.now();
for (let i = 0; i < 30; i++) { await p.evaluate(t => window.seek(t), i/30); await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 }); }
console.log('ms/frame', ((performance.now()-t0)/30).toFixed(0));
await p.screenshot({ path: 'bench/gl.png' });
await b.close();
