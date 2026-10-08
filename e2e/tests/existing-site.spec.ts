/**
 * Migration of an existing site from tarteaucitron: choices visitors already made
 * (`tarteaucitron` cookie) are picked up as is, without showing the banner again.
 */
import { expect, test } from '@playwright/test';

test('a visitor who had chosen under tarteaucitron keeps their choices', async ({ page, context }) => {
  const requests: string[] = [];
  await page.route(
    (url) => url.hostname !== 'localhost',
    (route) => {
      requests.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    },
  );
  // Cookie as tarteaucitron wrote it: GA4 accepted, YouTube refused.
  await context.addCookies([{ name: 'tarteaucitron', value: '!gtag=true!youtube=false', url: 'http://localhost:4322' }]);
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Cookies' })).toHaveCount(0);
  await expect.poll(() => requests.some((u) => u.includes('googletagmanager.com/gtag/js'))).toBe(true);
  await expect(page.getByRole('button', { name: 'Autoriser YouTube' })).toBeVisible();
  expect(requests.some((u) => u.includes('youtube'))).toBe(false);
});

test('the site design system is intact (newsletter: Modal + Toggle)', async ({ page }) => {
  await page.goto('/');
  // the (fixed) banner covers the bottom of the page: make a choice first, like a visitor would
  await page.getByRole('button', { name: 'Tout refuser' }).click();
  await page.getByRole('button', { name: 'Newsletter' }).click();
  const modal = page.getByRole('dialog', { name: 'Newsletter' });
  await expect(modal.getByRole('switch', { name: 'Lettre hebdomadaire' })).toBeChecked();
});
