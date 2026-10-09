/**
 * The same app built with each binding, in Chromium: @zeste/svelte in SvelteKit (adapter-node),
 * @zeste/react in Next.js (App Router), @zeste/vue in Nuxt, and each one without a framework (Vite; React 18).
 * Projects without a server (`metadata.ssr: false`) skip the server-rendering and routing tests.
 * Third parties are intercepted (empty responses) to observe requests without depending on the network.
 */
import { expect, test, type Page } from '@playwright/test';

const ALL_GRANTED = '!gtag=true!youtube=true!matomocloud=true';

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

/** Compliance guard warnings emitted by the page. */
function complianceWarnings(page: Page) {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().startsWith('[zeste/consent]')) warnings.push(message.text());
  });
  return warnings;
}

/**
 * Opens the page and waits for the engine to start: with React, the buttons and their attributes
 * are already in the server HTML, but clicks only work once hydrated.
 */
async function open(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForFunction(() => window.__zesteManifest?.length);
}

const ssrOnly = () => test.skip(!test.info().project.metadata.ssr, 'no server rendering in this app');

const youtubeIframe = (page: Page, testId: string) => page.locator(`[data-testid="${testId}"] iframe`);

test.describe('server rendering', () => {
  test.beforeEach(ssrOnly);

  test('without a cookie: banner and placeholder are already in the HTML', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toContain('data-testid="banner"');
    expect(html).toContain('data-testid="video-1-placeholder"');
    expect(html).not.toContain('youtube_player');
  });

  test('with a cookie: no banner or placeholder, the video element is ready', async ({ request }) => {
    const html = await (await request.get('/', { headers: { cookie: `tarteaucitron=${ALL_GRANTED}` } })).text();
    expect(html).not.toContain('data-testid="banner"');
    expect(html).not.toContain('video-1-placeholder');
    expect(html).toContain('class="youtube_player"');
  });
});

test('visitor already decided: the banner never appears, not even for a frame', async ({ page, context, baseURL }) => {
  await interceptThirdParties(page);
  await context.addCookies([{ name: 'tarteaucitron', value: ALL_GRANTED, url: baseURL! }]);
  // Checked right before every frame is painted: a banner inserted then removed within the same
  // task (client-only apps read the cookie on mount) is never shown, so it does not count.
  await page.addInitScript(() => {
    window.__bannerSeen = false;
    const check = () => {
      if (document.querySelector('[data-testid="banner"]')) window.__bannerSeen = true;
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
  await page.goto('/');
  await expect(youtubeIframe(page, 'video-1')).toBeVisible();
  expect(await page.evaluate(() => window.__bannerSeen)).toBe(false);
});

test('before any choice: no third-party request', async ({ page }) => {
  const requests = await interceptThirdParties(page);
  await open(page);
  await expect(page.getByTestId('banner')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  expect(requests).toEqual([]);
});

test('"Tout accepter": video rendered, GA4 loaded, choice saved', async ({ page, context }) => {
  const requests = await interceptThirdParties(page);
  await open(page);
  await page.getByRole('button', { name: 'Tout accepter' }).click();

  await expect(page.getByTestId('banner')).toBeHidden();
  await expect(youtubeIframe(page, 'video-1')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  await expect.poll(() => requests.some((u) => u.includes('googletagmanager.com/gtag/js'))).toBe(true);
  const cookie = (await context.cookies()).find((c) => c.name === 'tarteaucitron');
  expect(decodeURIComponent(cookie!.value)).toContain('gtag=true');
});

test('custom placeholder: "Voir la vidéo" only accepts YouTube', async ({ page }) => {
  const requests = await interceptThirdParties(page);
  await open(page);
  await page.getByRole('button', { name: 'Voir la vidéo' }).click();

  await expect(youtubeIframe(page, 'video-1')).toBeVisible();
  await expect(page.getByTestId('banner')).toBeVisible(); // GA4 and Matomo still pending
  await page.waitForTimeout(500);
  expect(requests.filter((u) => /googletagmanager|matomo/.test(u))).toEqual([]);
});

test('default placeholder: tarteaucitron texts, in the chosen language', async ({ page }) => {
  await interceptThirdParties(page);
  await open(page);
  await page.getByRole('button', { name: 'Afficher une 2ᵉ vidéo' }).click();
  const placeholder = page.getByTestId('video-2');
  await expect(placeholder).toContainText('YouTube est désactivé.');
  await placeholder.getByRole('button', { name: 'Autoriser YouTube' }).click();
  await expect(youtubeIframe(page, 'video-2')).toBeVisible();
});

test('preferences: nothing pre-checked, service-by-service choices, remembered', async ({ page }) => {
  const requests = await interceptThirdParties(page);
  await open(page);
  await page.getByRole('button', { name: 'Personnaliser' }).click();

  const dialog = page.getByRole('dialog', { name: 'Panneau de gestion des cookies' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('group', { name: "Mesure d'audience" })).toBeVisible();
  for (const box of await dialog.getByRole('checkbox').all()) await expect(box).not.toBeChecked();

  await dialog.getByRole('checkbox', { name: /YouTube/ }).check();
  await dialog.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('banner')).toBeHidden();
  await expect(youtubeIframe(page, 'video-1')).toBeVisible();
  await page.waitForTimeout(500);
  expect(requests.filter((u) => /googletagmanager|matomo/.test(u))).toEqual([]);

  await page.getByRole('button', { name: 'Gestion des services' }).click();
  await expect(dialog.getByRole('checkbox', { name: /YouTube/ })).toBeChecked();
  await expect(dialog.getByRole('checkbox', { name: /Google Analytics/ })).not.toBeChecked();
});

test('Escape closes the preferences without saving anything', async ({ page }) => {
  await interceptThirdParties(page);
  await open(page);
  await page.getByRole('button', { name: 'Personnaliser' }).click();
  const dialog = page.getByRole('dialog', { name: 'Panneau de gestion des cookies' });
  await dialog.getByRole('checkbox', { name: /YouTube/ }).check();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('banner')).toBeVisible();
  await expect(youtubeIframe(page, 'video-1')).toHaveCount(0);
});

test('mounting a 2nd video does not reload the 1st', async ({ page }) => {
  await interceptThirdParties(page);
  await open(page);
  await page.getByRole('button', { name: 'Tout accepter' }).click();
  await expect(youtubeIframe(page, 'video-1')).toBeVisible();
  await youtubeIframe(page, 'video-1').evaluate((el) => (el.dataset.marker = 'original'));

  await page.getByRole('button', { name: 'Afficher une 2ᵉ vidéo' }).click();
  await expect(youtubeIframe(page, 'video-2')).toHaveAttribute('src', /jNQXAC9IVRw/);
  expect(await youtubeIframe(page, 'video-1').evaluate((el) => el.dataset.marker)).toBe('original');
});

test('client-side navigation to another page: the video is rendered there, without a reload', async ({ page }) => {
  ssrOnly();
  await interceptThirdParties(page);
  await open(page);
  await page.getByRole('button', { name: 'Tout accepter' }).click();
  await page.evaluate(() => (window.__sameDocument = true));

  await page.getByRole('link', { name: 'Autre page' }).click();
  await expect(page).toHaveURL(/\/other$/);
  await expect(youtubeIframe(page, 'video-other')).toHaveAttribute('src', /jNQXAC9IVRw/);
  expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
});

test('withdrawal: the video becomes a placeholder again, GA4 asks for a reload', async ({ page }) => {
  await interceptThirdParties(page);
  await open(page);
  await page.getByRole('button', { name: 'Tout accepter' }).click();
  await expect(youtubeIframe(page, 'video-1')).toBeVisible();

  await page.getByRole('button', { name: 'Gestion des services' }).click();
  const dialog = page.getByRole('dialog', { name: 'Panneau de gestion des cookies' });
  await dialog.getByRole('checkbox', { name: /YouTube/ }).uncheck();
  await dialog.getByRole('checkbox', { name: /Google Analytics/ }).uncheck();
  await dialog.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page.getByTestId('video-1-placeholder')).toBeVisible();
  await expect(youtubeIframe(page, 'video-1')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('après rechargement');
});

test.describe('compliance guard', () => {
  test('no warning on the app as written, before and after the choice', async ({ page }) => {
    await interceptThirdParties(page);
    const warnings = complianceWarnings(page);
    await open(page);
    await expect(page.getByTestId('banner')).toBeVisible();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Tout refuser' }).click();
    await page.waitForTimeout(1500); // the "permanent link" check runs 1 s after the choice
    expect(warnings).toEqual([]);
  });

  test('shrunken "Tout refuser" → warning', async ({ page }) => {
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

  test('no way left to reopen the preferences → warning', async ({ page }) => {
    await interceptThirdParties(page);
    const warnings = complianceWarnings(page);
    await open(page);
    await page.getByRole('navigation').getByRole('button', { name: 'Gestion des services' }).evaluate((el) => el.remove());
    await page.getByRole('button', { name: 'Tout refuser' }).click();
    await expect.poll(() => warnings.join('\n'), { timeout: 5000 }).toContain('reopen the preferences');
  });
});
