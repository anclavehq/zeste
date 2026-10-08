import { describe, expect, it, vi } from 'vitest';
import { createConsent, googleConsentMode, memoryStorage } from '../src/index.ts';
import type { ServiceDefinition } from '../src/types.ts';

function fakeService(key: string, extra: Partial<ServiceDefinition> = {}): ServiceDefinition & { calls: string[] } {
  const calls: string[] = [];
  return {
    key,
    name: key,
    category: 'analytic',
    needsConsent: true,
    cookies: [],
    calls,
    load: async () => {
      calls.push('load');
    },
    onGrant: () => calls.push('grant'),
    onDeny: () => calls.push('deny'),
    ...extra,
  };
}

describe('createConsent', () => {
  it('runs nothing on the server and gives a usable initial state (SSR)', () => {
    const a = fakeService('a');
    const consent = createConsent({ services: [a], initial: { a: 'true' }, storage: memoryStorage() });
    expect(consent.getSnapshot().status).toEqual({ a: 'granted' });
    expect(consent.getSnapshot().decided).toBe(true);
    expect(a.calls).toEqual([]);
  });

  it('loads the code before running it, only once for a script', async () => {
    const a = fakeService('a', { onDeny: undefined });
    const consent = createConsent({ services: [a], storage: memoryStorage() });
    consent.start();
    await consent.settled();
    expect(a.calls).toEqual([]); // no fallback → nothing to load
    consent.grant('a');
    await consent.settled();
    consent.rescan();
    await consent.settled();
    expect(a.calls).toEqual(['load', 'grant']);
  });

  it('applies the latest state if the choice changes while loading', async () => {
    const a = fakeService('a');
    const consent = createConsent({ services: [a], storage: memoryStorage() });
    consent.start();
    consent.grant('a');
    consent.deny('a');
    await consent.settled();
    expect(a.calls).not.toContain('grant');
  });

  it('replays the embeds on rescan', async () => {
    const a = fakeService('a', { embed: true });
    const consent = createConsent({ services: [a], storage: memoryStorage({ a: 'true' }) });
    consent.start();
    await consent.settled();
    consent.rescan();
    await consent.settled();
    expect(a.calls.filter((c) => c === 'grant')).toHaveLength(2);
  });

  it('grants exempt services automatically and does not count them as a decision', () => {
    const consent = createConsent({
      services: [fakeService('a'), fakeService('exempt', { needsConsent: false })],
      storage: memoryStorage(),
    });
    expect(consent.getSnapshot().status).toEqual({ a: 'unknown', exempt: 'granted' });
    consent.denyAll();
    expect(consent.has('exempt')).toBe(true);
  });

  it('honors the Svelte store contract', () => {
    const consent = createConsent({ services: [fakeService('a')], storage: memoryStorage() });
    const listener = vi.fn();
    const unsubscribe = consent.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    consent.grant('a');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    consent.deny('a');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('drives Google Consent Mode v2', () => {
    window.dataLayer = undefined;
    const consent = createConsent({
      services: [fakeService('gtag')],
      storage: memoryStorage(),
      plugins: [googleConsentMode()],
    });
    consent.start();
    const dataLayer = () => (window.dataLayer ?? []).map((a) => [...a]);
    expect(dataLayer()).toEqual([['consent', 'default', expect.objectContaining({ analytics_storage: 'denied' })]]);
    consent.grant('gtag');
    expect(dataLayer()[1]).toEqual(['consent', 'update', expect.objectContaining({ analytics_storage: 'granted', ad_storage: 'denied' })]);
  });
});

describe('window.__zesteManifest manifest', () => {
  it('publishes the services declared at startup, and removes them on destroy', () => {
    const consent = createConsent({
      services: [fakeService('matomo', { name: 'Matomo', endpoints: ['stats.monsite.fr'] })],
      storage: memoryStorage(),
    });
    consent.start();
    expect(window.__zesteManifest?.at(-1)).toEqual({
      services: [{ key: 'matomo', name: 'Matomo', category: 'analytic', needsConsent: true, endpoints: ['stats.monsite.fr'] }],
    });
    const count = window.__zesteManifest!.length;
    consent.destroy();
    expect(window.__zesteManifest).toHaveLength(count - 1);
  });

  it('expose: false publishes nothing', () => {
    const before = window.__zesteManifest?.length ?? 0;
    createConsent({ services: [fakeService('a')], storage: memoryStorage(), expose: false }).start();
    expect(window.__zesteManifest?.length ?? 0).toBe(before);
  });
});
