import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
const V = resolve(process.argv[4] ?? '../video');
const mode = process.argv[2] ?? 'preview';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.goto('file://' + V + '/composition.html');
await p.evaluate(() => window.ready);
const tl = await p.evaluate(() => window.TL ?? null);
writeFileSync(V + '/sfx.json', JSON.stringify(await p.evaluate(() => window.SFX), null, 1));
if (mode === 'preview') {
  mkdirSync(V + '/preview', { recursive: true });
  const times = JSON.parse(process.argv[3]);
  for (const t of times) {
    await p.evaluate((t) => window.render(t), t);
    await p.screenshot({ path: V + '/preview/' + String(t.toFixed(2)).padStart(6, '0') + '.jpg', type: 'jpeg', quality: 80 });
  }
} else {
  rmSync(V + '/frames', { recursive: true, force: true });
  mkdirSync(V + '/frames', { recursive: true });
  const fps = 30, total = Number(process.argv[3]);
  const n = Math.ceil(total * fps);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => window.render(t), i / fps);
    await p.screenshot({ path: V + '/frames/' + String(i).padStart(5, '0') + '.jpg', type: 'jpeg', quality: 92 });
    if (i % 300 === 0) console.log('frame', i, '/', n, Math.round((Date.now() - t0) / 1000) + 's');
  }
}
console.log('errors:', errors);
await b.close();
