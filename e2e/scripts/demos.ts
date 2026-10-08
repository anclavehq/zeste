/**
 * Records the demo videos (MP4) on the built example apps.
 *   node scripts/demos.ts <output-dir>
 * Visible cursor and smoothed mouse movements; third parties are intercepted
 * (the YouTube video is simulated), nothing is sent to Google.
 */
import { chromium, type Locator, type Page } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const outDir = resolve(process.argv[2] ?? 'demos');
mkdirSync(outDir, { recursive: true });
const SIZE = { width: 1280, height: 800 };

/** Cursor drawn in the page (headless video does not show one). */
const CURSOR = () => {
  const install = () => {
    const dot = document.createElement('div');
    dot.style.cssText =
      'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
      'background:rgb(24 48 31/.25);border:2px solid #18301f;pointer-events:none;transition:transform .12s;left:-40px;top:-40px';
    document.body.append(dot);
    addEventListener('mousemove', (e) => {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
    });
    addEventListener('mousedown', () => (dot.style.transform = 'scale(.7)'));
    addEventListener('mouseup', () => (dot.style.transform = ''));
  };
  if (document.body) install();
  else addEventListener('DOMContentLoaded', install);
};

/** "Console" panel drawn in the page, showing the real guard rail warnings. */
const CONSOLE_PANEL = () => {
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    original(...args);
    const text = String(args[0]);
    if (!text.startsWith('[zeste/consent]')) return;
    let panel = document.getElementById('demo-console');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'demo-console';
      panel.style.cssText =
        'position:fixed;z-index:2147483646;top:72px;right:16px;width:520px;background:#1f231b;color:#f3d27a;' +
        'font:13px/1.5 ui-monospace,Menlo,monospace;border-radius:10px;padding:12px 14px;box-shadow:0 10px 30px rgb(0 0 0/.35)';
      panel.innerHTML = '<div style="color:#9aa58c;margin-bottom:6px">Console (dev)</div>';
      document.body.append(panel);
    }
    const line = document.createElement('div');
    line.style.cssText = 'margin-top:6px;white-space:pre-wrap';
    line.textContent = '⚠ ' + text.split('\n')[0];
    panel.append(line);
  };
};

function serve(app: string, port: number) {
  const server = spawn('node', [resolve('..', 'examples', app, 'build')], {
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });
  return { url: `http://localhost:${port}`, stop: () => server.kill() };
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Moves the mouse smoothly to the element, then clicks. */
async function glideClick(page: Page, target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error('invisible element');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 28 });
  await pause(250);
  await target.click();
}

async function record(
  name: string,
  app: string,
  cookies: Record<string, string>,
  scenario: (page: Page) => Promise<void>,
  options: { css?: string; console?: boolean } = {},
) {
  const port = 4500 + Math.floor(Math.random() * 400);
  const { url, stop } = serve(app, port);
  const tmp = join(outDir, `.tmp-${name}`);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: SIZE, recordVideo: { dir: tmp, size: SIZE } });
  await context.addCookies(Object.entries(cookies).map(([n, value]) => ({ name: n, value, url })));
  await context.addInitScript(CURSOR);
  if (options.console) await context.addInitScript(CONSOLE_PANEL);
  if (options.css) {
    await context.addInitScript((css: string) => {
      document.addEventListener('readystatechange', () => {
        if (document.readyState !== 'interactive') return;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.append(style);
      });
    }, options.css);
  }
  await context.route(
    (u) => u.hostname !== 'localhost',
    (route) => {
      const type = route.request().resourceType();
      const isVideo = route.request().url().includes('youtube');
      return route.fulfill({
        status: 200,
        contentType: type === 'script' ? 'text/javascript' : 'text/html; charset=utf-8',
        body:
          type === 'document' && isVideo
            ? '<body style="margin:0;display:grid;place-items:center;height:100vh;background:#111;color:#eee;font:600 18px system-ui">▶ Vidéo YouTube</body>'
            : '',
      });
    },
  );

  const page = await context.newPage();
  for (let i = 0; i < 100; i++) {
    try {
      await page.goto(url + '/');
      break;
    } catch {
      await pause(100);
    }
  }
  await page.locator('[data-zeste-action="openPreferences"]').first().waitFor({ state: 'attached' });
  await scenario(page);
  const video = page.video();
  await context.close();
  await browser.close();
  stop();

  const webm = await video!.path();
  const mp4 = join(outDir, `${name}.mp4`);
  // H.264 + faststart: plays in every browser, starts before the download finishes.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '0.6', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '28', '-preset', 'slow', '-movflags', '+faststart', '-an', mp4]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1.2', '-i', mp4, '-frames:v', '1', '-q:v', '4', join(outDir, `${name}.jpg`)]);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`${name}.mp4`);
}

// 1. Full flow: banner → customize → YouTube only → the video appears
await record('parcours', 'skin-bits', { 'zeste-style': 'zeste' }, async (page) => {
  await pause(1400);
  await glideClick(page, page.getByRole('button', { name: 'Personnaliser' }));
  await pause(1100);
  const youtube = page.getByRole('dialog').getByRole('switch', { name: 'YouTube' });
  await glideClick(page, youtube);
  await pause(900);
  await glideClick(page, page.getByRole('dialog').getByRole('button', { name: 'Enregistrer' }));
  await pause(2200);
});

// 2. Placeholder: allow a single video, then refuse the rest (Pelure style, Ark UI)
await record('placeholder', 'skin-ark', { 'zeste-style': 'pelure' }, async (page) => {
  await pause(1300);
  await glideClick(page, page.getByRole('button', { name: 'Autoriser YouTube' }));
  await pause(1600);
  await glideClick(page, page.getByRole('region', { name: 'Cookies' }).getByRole('button', { name: 'Tout refuser' }));
  await pause(1800);
});

// 3. Styles and themes: same site, four renderings (shadcn-svelte)
await record('styles', 'skin-shadcn', { 'zeste-style': 'zeste', 'zeste-theme': 'light' }, async (page) => {
  const steps: [string, string][] = [
    ['Style de la démo', 'pelure'],
    ['Thème de la démo', 'sombre'],
    ['Style de la démo', 'zeste'],
  ];
  await pause(1500);
  for (const [group, label] of steps) {
    await glideClick(page, page.getByRole('group', { name: group }).getByRole('button', { name: label }));
    await page.waitForLoadState('load');
    await page.locator('[data-zeste-action="openPreferences"]').first().waitFor({ state: 'attached' });
    await pause(1500);
  }
});

// 4. compliance guard: a shrunken "Deny all" is flagged as soon as the page loads
await record(
  'garde-fou',
  'skin-bits',
  { 'zeste-style': 'zeste' },
  async (page) => {
    await pause(3200);
  },
  { console: true, css: '[data-zeste-action="denyAll"] { font-size: 9px !important; padding: 2px 6px !important; }' },
);
