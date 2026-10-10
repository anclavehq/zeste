import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createConsent, memoryStorage, type ConsentManager } from '@zeste/core';
import { configureTarteaucitron, resetTarteaucitron } from '@zeste/core/tarteaucitron';
import { messages as fr } from '../src/i18n/fr.ts';
import { gtag, matomo, matomocloud, plausible, youtube } from '../src/index.ts';

const scripts = () => [...document.head.querySelectorAll('script')].map((s) => s.getAttribute('src'));
let consent: ConsentManager;

beforeEach(() => {
  resetTarteaucitron();
  document.head.innerHTML = '';
  document.body.innerHTML = '<div class="youtube_player" data-videoID="dQw4w9WgXcQ" data-width="640" data-height="360"></div>';
  delete window._paq;
});
afterEach(() => consent?.destroy());

async function start(
  services: Parameters<typeof createConsent>[0]['services'],
  stored = {},
  extra: Partial<Parameters<typeof createConsent>[0]> = {},
) {
  consent = createConsent({ services, storage: memoryStorage(stored), ...extra });
  consent.start();
  await consent.settled();
  return consent;
}

describe('gtag (GA4)', () => {
  it('exposes its metadata without loading anything, cookies computed from the config', () => {
    const service = gtag({ gtagUa: 'G-ABC123' });
    expect(service.name).toBe('Google Analytics (GA4)');
    expect(service.cookies).toContain('_ga_ABC123');
  });

  it('only injects the script after consent', async () => {
    const consent = await start([gtag({ gtagUa: 'G-ABC123' })]);
    expect(scripts()).toEqual([]);
    consent.grant('gtag');
    await consent.settled();
    expect(scripts()).toEqual(['https://www.googletagmanager.com/gtag/js?id=G-ABC123']);
  });

  it('asks for a reload if consent is withdrawn after loading', async () => {
    const consent = await start([gtag({ gtagUa: 'G-ABC123' })], { gtag: 'true' });
    consent.deny('gtag');
    expect(consent.getSnapshot().needsReload).toBe(true);
  });
});

describe('youtube', () => {
  it('shows a placeholder, then the iframe after clicking "Autoriser"', async () => {
    await start([youtube()]);
    expect(document.querySelector('iframe')).toBeNull();
    document.querySelector<HTMLButtonElement>('[data-zeste-allow="youtube"]')!.click();
    await consent.settled();
    expect(document.querySelector('iframe')!.getAttribute('src')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('HTML placeholder in English by default, like tarteaucitron', async () => {
    await start([youtube()]);
    expect(document.querySelector('.zeste-placeholder')!.textContent).toBe('YouTube is disabled.Allow YouTube');
  });

  it('HTML placeholder translated with the tarteaucitron messages', async () => {
    configureTarteaucitron({ messages: fr });
    await start([youtube()]);
    expect(document.querySelector('.zeste-placeholder p')!.textContent).toBe('YouTube est désactivé.');
    expect(document.querySelector('[data-zeste-allow="youtube"]')!.textContent).toBe('Autoriser YouTube');
  });

  it('goes back to the placeholder when consent is withdrawn, without a reload', async () => {
    const consent = await start([youtube()], { youtube: 'true' });
    expect(document.querySelector('iframe')).not.toBeNull();
    consent.deny('youtube');
    await consent.settled();
    expect(document.querySelector('iframe')).toBeNull();
    expect(consent.getSnapshot().needsReload).toBe(false);
  });

  it('renders embeds added later (SPA navigation) via rescan()', async () => {
    const consent = await start([youtube()], { youtube: 'true' });
    const first = document.querySelector('iframe');
    document.body.insertAdjacentHTML('beforeend', '<div class="youtube_player" data-videoID="abc"></div>');
    consent.rescan('youtube');
    await consent.settled();
    expect(document.querySelectorAll('iframe')).toHaveLength(2);
    // the already-rendered video is not rewritten (playback does not restart)
    expect(document.querySelector('iframe')).toBe(first);
  });
});

describe('endpoints (page manifest)', () => {
  it('hosts taken from the options, without the domain measured by Plausible', () => {
    expect(matomo({ matomoId: 1, matomoHost: 'https://stats.example.com/' }).endpoints).toEqual(['stats.example.com']);
    expect(plausible({ plausibleDomain: 'monsite.fr', plausibleEndpoint: 'p.monsite.fr' }).endpoints).toEqual(['p.monsite.fr']);
    expect(gtag({ gtagUa: 'G-ABC123' }).endpoints).toEqual([]);
  });
});

describe('matomo', () => {
  it('self-hosted Matomo is exempt from consent (as in tarteaucitron) and loads directly', async () => {
    const consent = await start([matomo({ matomoId: 1, matomoHost: 'https://stats.example.com/' })]);
    expect(consent.getSnapshot().decided).toBe(true);
    expect(scripts()).toEqual(['https://stats.example.com/piwik.js']);
    expect(window._paq).toContainEqual(['setSiteId', 1]);
  });

  it('Matomo Cloud: by default, no request to Matomo before consent', async () => {
    const consent = await start([matomocloud({ matomoId: 1, matomoHost: 'https://example.matomo.cloud/' })]);
    expect(scripts()).toEqual([]);
    expect(window._paq).toBeUndefined();
    consent.grant('matomocloud');
    await consent.settled();
    expect(scripts()).toEqual(['https://cdn.matomo.cloud/matomo.js']);
    expect(window._paq).toContainEqual(['setConsentGiven']);
  });

  it('Matomo Cloud: cookieless mode before consent if explicitly allowed', async () => {
    const consent = await start(
      [matomocloud({ matomoId: 1, matomoHost: 'https://example.matomo.cloud/' })],
      {},
      { allowPreConsentRequests: ['matomocloud'] },
    );
    expect(window._paq).toContainEqual(['requireConsent']);
    expect(window._paq).not.toContainEqual(['setConsentGiven']);
    consent.grant('matomocloud');
    await consent.settled();
    expect(window._paq).toContainEqual(['setConsentGiven']);
  });
});
