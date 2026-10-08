// Shared headless-Chromium setup for the trailer (WebGL via SwiftShader, ES modules over file://).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function launch() {
  return chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--disable-gpu-vsync', '--font-render-hinting=none'] });
}
export async function openPage(browser, { only, query = process.env.SF_QUERY || '' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const qs = [only ? 'only=' + only : '', query].filter(Boolean).join('&');
  await page.goto('file://' + resolve(ROOT, 'src/index.html') + (qs ? '?' + qs : ''));
  try { await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 }); }
  catch (e) { throw new Error('page did not become READY: ' + errors.join(' | ')); }
  page._errors = errors;
  return page;
}
