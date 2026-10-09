/**
 * Automatic language, in Chromium with a given browser locale: the page language wins,
 * then the browser's, then English; only the chosen language is downloaded.
 */
import { expect, test } from '@playwright/test';

const out = (page: import('@playwright/test').Page) => page.locator('#out');

test.describe('browser in German', () => {
  test.use({ locale: 'de-DE' });

  test('page without a language: the browser language', async ({ page }) => {
    const chunks: string[] = [];
    page.on('request', (r) => {
      if (/\/assets\/[a-z]{2}-[\w-]+\.js$/.test(new URL(r.url()).pathname)) chunks.push(new URL(r.url()).pathname);
    });
    await page.goto('/i18n.html');
    await expect(out(page)).toHaveAttribute('data-language', 'de');
    await expect(out(page)).toHaveText('Alle akzeptieren');
    expect(chunks.map((c) => c.split('/').pop()!.slice(0, 2))).toEqual(['de']);
  });

  test('page in French: the page language wins', async ({ page }) => {
    await page.goto('/i18n.html?lang=fr-FR');
    await expect(out(page)).toHaveText('Tout accepter');
  });

  test('page in a language without texts: the browser language', async ({ page }) => {
    await page.goto('/i18n.html?lang=tlh');
    await expect(out(page)).toHaveAttribute('data-language', 'de');
  });
});

test.describe('browser in Norwegian Bokmål', () => {
  test.use({ locale: 'nb-NO' });

  test('nb is served the Norwegian texts', async ({ page }) => {
    await page.goto('/i18n.html');
    await expect(out(page)).toHaveAttribute('data-language', 'no');
  });
});

test.describe('browser in a language without texts', () => {
  test.use({ locale: 'ga-IE' });

  test('English by default', async ({ page }) => {
    await page.goto('/i18n.html');
    await expect(out(page)).toHaveAttribute('data-language', 'en');
    await expect(out(page)).toHaveText('OK, accept all');
  });
});
