/**
 * Screenshots of an example app, for visual review.
 *   node scripts/capture.ts <app-dir> <prefix> <output-dir> [tarteaucitron]
 *   ZESTE_STYLE=pelure ZESTE_THEME=dark node scripts/capture.ts …   (demo apps: style and theme)
 * Starts the built app, captures banner / preferences / after acceptance, and collects
 * the compliance guard warnings in <prefix>-console.json.
 */
import { chromium, type Page } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [appDir, prefix, outDir, mode] = process.argv.slice(2);
if (!appDir || !prefix || !outDir) throw new Error('usage: capture.ts <app> <prefix> <output> [tarteaucitron]');
mkdirSync(outDir, { recursive: true });

const port = String(4400 + Math.floor(Math.random() * 500));
const server = spawn('node', [resolve(appDir, 'build')], { env: { ...process.env, PORT: port }, stdio: 'ignore' });
const url = `http://localhost:${port}`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
for (const [cookie, value] of [
  ['zeste-style', process.env.ZESTE_STYLE],
  ['zeste-theme', process.env.ZESTE_THEME],
] as const) {
  if (value) await context.addCookies([{ name: cookie, value, url: `http://localhost:${port}` }]);
}
const page = await context.newPage();
const consoleLines: string[] = [];
page.on('console', (m) => {
  if (m.text().startsWith('[zeste')) consoleLines.push(`${m.type()}: ${m.text()}`);
});
// Third parties are intercepted (except tarteaucitron itself, for the "before" state); YouTube is rendered as a neutral image
await page.route(
  (u) => u.hostname !== 'localhost' && !(mode === 'tarteaucitron' && u.hostname === 'cdn.jsdelivr.net'),
  (route) => {
    const type = route.request().resourceType();
    const isVideo = route.request().url().includes('youtube');
    return route.fulfill({
      status: 200,
      contentType: type === 'script' ? 'text/javascript' : 'text/html; charset=utf-8',
      body: type === 'document' && isVideo
        ? '<body style="margin:0;display:grid;place-items:center;height:100vh;background:#111;color:#eee;font:16px system-ui">▶ vidéo YouTube (simulée)</body>'
        : '',
    });
  },
);

async function open(p: Page) {
  for (let i = 0; i < 100; i++) {
    try {
      await p.goto(url + '/');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('server unreachable');
}

const shot = (name: string) => page.screenshot({ path: join(outDir, `${prefix}-${name}.png`) });

await open(page);
await page.waitForTimeout(1200);
await shot('1-banner');

await page.getByRole('button', { name: 'Personnaliser' }).first().click();
await page.waitForTimeout(800);
await shot('2-preferences');
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

const accept = page.getByRole('button', { name: /Tout accepter|Accepter/ }).first();
await accept.click();
await page.waitForTimeout(1500);
await shot('3-accepte');

writeFileSync(join(outDir, `${prefix}-console.json`), JSON.stringify(consoleLines, null, 2));
await browser.close();
server.kill();
console.log(`${prefix}: 3 captures, ${consoleLines.length} zeste message(s)`);
