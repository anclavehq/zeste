/**
 * The whole catalog in a real Chromium. Network requests to third parties are intercepted
 * (empty responses): we observe what a data-protection authority looks at, namely which requests
 * go to third parties before and after consent.
 */
import { expect, test, type Page } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { catalog } from '../../packages/services/src/catalog.ts';

const REPORT = 'test-results/catalog.jsonl';
mkdirSync('test-results', { recursive: true });

async function interceptThirdParties(page: Page) {
  const requests: string[] = [];
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => {
      const request = route.request();
      requests.push(request.url());
      const type = request.resourceType();
      return route.fulfill({
        status: 200,
        contentType: type === 'script' ? 'text/javascript' : type === 'image' ? 'image/gif' : 'text/html',
        body: type === 'document' ? '<!doctype html><title>tiers</title>' : '',
      });
    },
  );
  return requests;
}

for (const entry of catalog) {
  test(`${entry.key} — ${entry.name}`, async ({ page }) => {
    const requests = await interceptThirdParties(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto(`/catalog.html?key=${entry.key}`);
    await page.waitForFunction(() => window.__catalog !== undefined);
    await page.waitForTimeout(300);

    const beforeConsent = [...requests];
    const probeBefore = await page.evaluate(() => window.__catalog!.probe());

    await page.evaluate(async (key) => {
      const { consent } = window.__catalog!;
      consent.grant(key);
      await consent.settled();
    }, entry.key);
    await page.waitForTimeout(300);

    const afterConsent = requests.slice(beforeConsent.length);
    const probeAfter = await page.evaluate(() => window.__catalog!.probe());
    const zesteErrors = await page.evaluate(() => window.__catalog!.errors);

    appendFileSync(
      REPORT,
      JSON.stringify({
        key: entry.key,
        needConsent: entry.needConsent,
        beforeConsent,
        afterConsent,
        domChanged: probeBefore !== probeAfter,
        zesteErrors,
        pageErrors,
      }) + '\n',
    );

    // 1. the shim does not crash
    expect(zesteErrors).toEqual([]);
    if (entry.needConsent) {
      // 2. before consent: strictly no request to a third party
      expect(beforeConsent, 'third-party requests before consent').toEqual([]);
      // 3. once accepted, the service actually does something
      expect(afterConsent.length > 0 || probeBefore !== probeAfter, 'no effect after consent').toBe(true);
    } else {
      // exempt service (e.g. self-hosted Matomo): loaded right away, as soon as the page opens
      expect(beforeConsent.length, 'exempt service not loaded').toBeGreaterThan(0);
    }
  });
}
