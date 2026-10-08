// Load the whole film and verify it against docs/shotlist.json: ids, order, start/dur, music fields, sfx cues,
// plus page errors and per-shot render time (sampled).   node render/verify.mjs [--time]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, openPage, ROOT } from './browser.mjs';
const list = JSON.parse(readFileSync(resolve(ROOT, 'docs/shotlist.json'), 'utf8')).shots;
const browser = await launch();
const page = await openPage(browser, {});
const cues = await page.evaluate(() => window.CUES);
const probs = [];
const byId = Object.fromEntries(cues.shots.map((s) => [s.id, s]));
list.forEach((w, i) => {
  const g = byId[w.id];
  if (!g) return probs.push(`missing shot ${w.n} ${w.id}`);
  if (cues.shots[i]?.id !== w.id) probs.push(`order: position ${i + 1} is ${cues.shots[i]?.id}, expected ${w.id}`);
  if (Math.abs(g.start - w.start) > 0.002) probs.push(`${w.id}: start ${g.start} != ${w.start}`);
  if (Math.abs(g.dur - w.dur) > 0.002) probs.push(`${w.id}: dur ${g.dur} != ${w.dur}`);
  const m = g.music || {};
  for (const k of ['section', 'chord', 'div', 'energy']) if (w.music?.[k] !== undefined && m[k] !== w.music[k]) probs.push(`${w.id}: music.${k} ${m[k]} != ${w.music[k]}`);
  const got = cues.sfx.filter((e) => e.shot === w.id).map((e) => `${e.kind}@${(e.t - g.start).toFixed(2)}`).sort();
  const exp = (w.sfx || []).map((e) => `${e.kind}@${e.at.toFixed(2)}`).sort();
  const miss = exp.filter((x) => !got.includes(x));
  if (miss.length) probs.push(`${w.id}: sfx missing ${miss.join(', ')}`);
});
if (Math.abs(cues.duration - (list.at(-1).start + list.at(-1).dur)) > 0.002) probs.push(`duration ${cues.duration}`);
if (process.argv.includes('--time')) {
  const slow = [];
  for (const s of cues.shots) {
    const t = s.start + s.dur / 2;
    const t0 = Date.now(); await page.evaluate((x) => window.SF.seek(x), t); await page.screenshot({ type: 'jpeg', quality: 80 });
    const ms = Date.now() - t0; if (ms > 1300) slow.push(`${s.id} ${ms}ms`);
  }
  console.log('slow shots (>1.3 s/frame incl. capture):', slow.join(', ') || 'none');
}
console.log(`${cues.shots.length} shots, ${cues.duration.toFixed(2)} s, ${cues.sfx.length} cues`);
if (page._errors.length) console.log('PAGE ERRORS:\n' + page._errors.slice(0, 20).join('\n'));
console.log(probs.length ? `${probs.length} problems:\n  ` + probs.join('\n  ') : 'matches shotlist');
await browser.close();
