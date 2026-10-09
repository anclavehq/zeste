/**
 * zeste as a <script> tag (@zeste/browser) on a site without a JavaScript framework, in Chromium:
 * the ready-made interface, and a page that kept its tarteaucitron configuration word for word.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function interceptThirdParties(page: Page) {
  const requests: string[] = [];
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => {
      requests.push(route.request().url());
      const type = route.request().resourceType();
      return route.fulfill({
        status: 200,
        contentType: type === 'script' ? 'text/javascript' : 'text/html',
        body: type === 'document' ? '<!doctype html><title>tiers</title>' : '',
      });
    },
  );
  return requests;
}

function complianceWarnings(page: Page) {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().startsWith('[zeste/consent]')) warnings.push(message.text());
  });
  return warnings;
}

async function open(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForFunction(() => window.__zesteManifest?.length);
}

const banner = (page: Page) => page.getByRole('region', { name: 'Cookies' });
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Panneau de gestion des cookies' });
const youtubeIframe = (page: Page) => page.locator('[data-testid="video-1"] iframe');

async function toggle(page: Page, name: string | RegExp) {
  await dialog(page).getByRole('switch', { name }).focus();
  await page.keyboard.press('Space');
}

async function expectNoSeriousA11yIssues(page: Page, include: string) {
  const { violations } = await new AxeBuilder({ page }).include(include).analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test('banner: nothing is sent before consent, buttons of equal weight, accessible, no warning', async ({ page }) => {
  const requests = await interceptThirdParties(page);
  const warnings = complianceWarnings(page);
  await open(page);
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute('href', '/confidentialite');

  const deny = banner(page).getByRole('button', { name: 'Tout refuser' });
  const accept = banner(page).getByRole('button', { name: 'Tout accepter' });
  const [d, a] = [await deny.boundingBox(), await accept.boundingBox()];
  expect(d!.height).toBe(a!.height);
  await expectNoSeriousA11yIssues(page, '[data-zeste-banner]');
  await page.waitForTimeout(500);
  expect(requests).toEqual([]);
  expect(warnings).toEqual([]);
});

test('"Tout accepter" by keyboard: GA4 and the video load, the choice is kept, a button reopens', async ({ page, context }) => {
  const requests = await interceptThirdParties(page);
  await open(page);
  await banner(page).getByRole('button', { name: 'Tout accepter' }).focus();
  await page.keyboard.press('Enter');

  await expect(banner(page)).toBeHidden();
  await expect(youtubeIframe(page)).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  await expect.poll(() => requests.some((u) => u.includes('gtag/js?id=G-TEST000000'))).toBe(true);
  const cookie = (await context.cookies()).find((c) => c.name === 'tarteaucitron');
  expect(decodeURIComponent(cookie!.value)).toContain('gtag=true');

  await open(page);
  await expect(banner(page)).toBeHidden();
  await expect(page.getByRole('button', { name: 'Gestion des services' })).toBeVisible();
});

test('preferences: accessible, nothing pre-checked, keyboard choices, remembered', async ({ page }) => {
  const requests = await interceptThirdParties(page);
  await open(page);
  await banner(page).getByRole('button', { name: 'Personnaliser' }).click();

  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByRole('heading', { name: "Mesure d'audience" })).toBeVisible();
  for (const s of await dialog(page).getByRole('switch').all()) await expect(s).not.toBeChecked();
  await expectNoSeriousA11yIssues(page, 'dialog');

  await toggle(page, 'YouTube');
  await dialog(page).getByRole('button', { name: 'Enregistrer' }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(banner(page)).toBeHidden();
  await expect(youtubeIframe(page)).toBeVisible();
  await page.waitForTimeout(500);
  expect(requests.filter((u) => /googletagmanager|matomo/.test(u))).toEqual([]);

  // The site's own "Gestion des cookies" link (#zeste) reopens them
  await page.getByRole('link', { name: 'Gestion des cookies' }).click();
  await expect(dialog(page).getByRole('switch', { name: 'YouTube' })).toBeChecked();
  await expect(dialog(page).getByRole('switch', { name: /Google Analytics/ })).not.toBeChecked();
});

test('Escape closes the preferences without saving anything', async ({ page }) => {
  await interceptThirdParties(page);
  await open(page);
  await banner(page).getByRole('button', { name: 'Personnaliser' }).click();
  await toggle(page, 'YouTube');
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  await expect(banner(page)).toBeVisible();
  await expect(youtubeIframe(page)).toHaveCount(0);
});

test('placeholder: "Autoriser YouTube" only accepts YouTube', async ({ page }) => {
  const requests = await interceptThirdParties(page);
  await open(page);
  await expect(page.getByText('YouTube est désactivé.')).toBeVisible();
  await page.getByRole('button', { name: 'Autoriser YouTube' }).click();
  await expect(youtubeIframe(page)).toBeVisible();
  await expect(banner(page)).toBeVisible();
  await page.waitForTimeout(300);
  expect(requests.filter((u) => /googletagmanager|matomo/.test(u))).toEqual([]);
});

test('withdrawal from the reopen button: the video becomes a placeholder again, reload offered', async ({ page }) => {
  await interceptThirdParties(page);
  await open(page);
  await banner(page).getByRole('button', { name: 'Tout accepter' }).click();
  await expect(youtubeIframe(page)).toBeVisible();

  await page.getByRole('button', { name: 'Gestion des services' }).click();
  await toggle(page, 'YouTube');
  await toggle(page, /Google Analytics/);
  await dialog(page).getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page.getByText('YouTube est désactivé.')).toBeVisible();
  await expect(youtubeIframe(page)).toHaveCount(0);
  await expect(page.getByRole('status').getByRole('button', { name: 'Recharger la page' })).toBeVisible();
});

test('an address ending in #zeste opens the preferences', async ({ page }) => {
  await interceptThirdParties(page);
  await open(page, '/#zeste');
  await expect(dialog(page)).toBeVisible();
});

test('pelure style and dark theme', async ({ page }) => {
  await interceptThirdParties(page);
  await open(page, '/?style=pelure');
  await expect(banner(page)).toHaveAttribute('data-zeste-skin', 'pelure');
  const light = await banner(page).evaluate((el) => getComputedStyle(el).backgroundColor);
  await open(page, '/?theme=dark');
  const dark = await banner(page).evaluate((el) => getComputedStyle(el).backgroundColor);
  await open(page, '/');
  const zeste = await banner(page).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(new Set([light, dark, zeste]).size).toBe(3);
});

test('compliance guard: a shrunken "Tout refuser" is reported', async ({ page }) => {
  await interceptThirdParties(page);
  const warnings = complianceWarnings(page);
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = '[data-zeste-action="denyAll"] { font-size: 9px !important; padding: 0 !important; }';
      document.head.append(style);
    });
  });
  await open(page);
  await expect.poll(() => warnings.join('\n')).toContain('much smaller than "Accept all"');
});

test.describe('page that kept its tarteaucitron configuration', () => {
  test('visitors keep their choice (custom cookie name), the options are taken over', async ({ page, context, baseURL }) => {
    const requests = await interceptThirdParties(page);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await context.addCookies([{ name: 'monsite_rgpd', value: '!gtag=true!youtube=true', url: baseURL! }]);
    await open(page, '/tarteaucitron.html');
    await expect(youtubeIframe(page)).toBeVisible();
    await expect(banner(page)).toBeHidden();
    await expect.poll(() => requests.some((u) => u.includes('gtag/js?id=G-LEGACY0000'))).toBe(true);
    expect(errors).toEqual([]);
  });

  test('a new visitor: banner, the choice goes into the same cookie, #tarteaucitron reopens', async ({ page, context }) => {
    await interceptThirdParties(page);
    await open(page, '/tarteaucitron.html');
    await banner(page).getByRole('button', { name: 'Tout refuser' }).click();
    const cookie = (await context.cookies()).find((c) => c.name === 'monsite_rgpd');
    expect(decodeURIComponent(cookie!.value)).toContain('youtube=false');
    await page.getByRole('link', { name: 'Gestion des cookies' }).click();
    await expect(dialog(page)).toBeVisible();
  });
});

test.describe('page without a language, German browser', () => {
  test.use({ locale: 'de-DE' });

  test('German texts; only the declared service and that language are downloaded', async ({ page }) => {
    await interceptThirdParties(page);
    const chunks: string[] = [];
    page.on('request', (r) => {
      const name = new URL(r.url()).pathname.match(/\/chunks\/([a-z]+)-/)?.[1];
      if (name) chunks.push(name);
    });
    await open(page, '/international.html');
    await expect(banner(page)).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Alle akzeptieren' })).toBeVisible();
    expect(chunks).toContain('de');
    expect(chunks).toContain('youtube');
    expect(chunks.filter((c) => ['fr', 'en', 'gtag', 'matomocloud'].includes(c))).toEqual([]);
  });
});
