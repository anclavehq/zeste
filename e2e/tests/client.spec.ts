/**
 * The client's services (GA4, YouTube, Matomo Cloud) on the real network, without interception:
 * real third-party scripts, real cookies. What a regulator inspection would observe.
 */
import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const THIRD_PARTY = /google|youtube|ytimg|doubleclick|gstatic|matomo/;

function recordThirdParties(page: Page) {
  const requests: string[] = [];
  page.on('request', (r) => {
    if (THIRD_PARTY.test(new URL(r.url()).hostname)) requests.push(r.url());
  });
  return requests;
}

const cookieNames = async (context: BrowserContext) => (await context.cookies()).map((c) => c.name);

test('before any choice: no third-party request, no third-party cookie', async ({ page, context }) => {
  const requests = recordThirdParties(page);
  await page.goto('/client.html');
  await expect(page.locator('#banner')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  expect(requests).toEqual([]);
  expect(await cookieNames(context)).toEqual([]);
  await expect(page.locator('[data-zeste-allow="youtube"]')).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('"Tout accepter": GA4, YouTube and Matomo really load', async ({ page, context }) => {
  const requests = recordThirdParties(page);
  await page.goto('/client.html');

  const gtagLoaded = page.waitForResponse((r) => r.url().includes('googletagmanager.com/gtag/js') && r.ok());
  const matomoLoaded = page.waitForResponse((r) => r.url().startsWith('https://cdn.matomo.cloud/matomo.js') && r.ok());
  // the real matomo.js sends a tracking hit to the configured tracker (.invalid domain: nothing reaches a real third party)
  const matomoHit = page.waitForRequest((r) => r.url().startsWith('https://zeste-e2e.invalid/matomo.php') && r.url().includes('idsite=1'));
  await page.click('#accept');
  await gtagLoaded;
  await matomoLoaded;
  await matomoHit;

  const iframe = page.locator('.youtube_player iframe');
  await expect(iframe).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  await expect.poll(() => page.frames().some((f) => f.url().includes('youtube-nocookie.com/embed'))).toBe(true);

  await expect.poll(() => cookieNames(context), { timeout: 10_000 }).toContain('_ga');
  const consentUpdates = await page.evaluate(() =>
    (window.dataLayer ?? [])
      .filter((e): e is ArrayLike<unknown> => typeof e === 'object' && e !== null && 'length' in e)
      .map((e) => Array.from(e))
      .filter((e) => e[0] === 'consent')
      .map((e) => [e[1], (e[2] as { analytics_storage?: string }).analytics_storage]),
  );
  expect(consentUpdates).toEqual([
    ['default', 'denied'],
    ['update', 'granted'],
  ]);

  await expect(page.locator('#banner')).toBeHidden();
  expect(requests.length).toBeGreaterThan(0);
});

test('"Tout refuser": nothing loads, even after a while', async ({ page, context }) => {
  const requests = recordThirdParties(page);
  await page.goto('/client.html');
  await page.click('#deny');
  await page.waitForTimeout(2000);

  expect(requests).toEqual([]);
  expect(await cookieNames(context)).toEqual(['tarteaucitron']);
  await expect(page.locator('#banner')).toBeHidden();
});

test('the choice is remembered: on reload, no banner and the accepted services load', async ({ page }) => {
  await page.goto('/client.html');
  await page.click('#accept');
  const gtagLoaded = page.waitForResponse((r) => r.url().includes('googletagmanager.com/gtag/js'));
  await page.reload();
  await gtagLoaded;
  await expect(page.locator('#banner')).toBeHidden();
  await expect(page.locator('.youtube_player iframe')).toBeVisible();
});

test('GA4 consent withdrawal: _ga cookies removed and reload flagged', async ({ page, context }) => {
  await page.goto('/client.html');
  await page.click('#accept');
  await expect.poll(() => cookieNames(context), { timeout: 10_000 }).toContain('_ga');

  const needsReload = await page.evaluate(() => {
    const { consent } = window.__zeste!;
    consent.deny('gtag');
    return consent.getSnapshot().needsReload;
  });
  expect(needsReload).toBe(true);
  const remaining = (await cookieNames(context)).filter((n) => n.startsWith('_ga'));
  expect(remaining).toEqual([]);
});

test('YouTube consent withdrawal: the video disappears without a reload', async ({ page }) => {
  await page.goto('/client.html');
  await page.click('#accept');
  await expect(page.locator('.youtube_player iframe')).toBeVisible();
  await page.evaluate(() => window.__zeste!.consent.deny('youtube'));
  await expect(page.locator('.youtube_player iframe')).toHaveCount(0);
  await expect(page.locator('[data-zeste-allow="youtube"]')).toBeVisible();
});
