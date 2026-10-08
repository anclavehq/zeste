import { describe, expect, it } from 'vitest';
import { effect, isReactive, nextTick } from 'vue';
import { memoryStorage, type ServiceDefinition } from '@zeste/core';
import { createZeste } from '../src/zeste.ts';

const service = (key: string, category: string): ServiceDefinition => ({
  key,
  name: key,
  category,
  needsConsent: true,
  cookies: [],
  onGrant: () => {},
});

const setup = () =>
  createZeste({
    services: [service('gtag', 'analytic'), service('youtube', 'video')],
    storage: memoryStorage(),
    expose: false,
  });

describe('reactive state', () => {
  it('getters are tracked: a change re-runs what read them', async () => {
    const zeste = setup();
    const seen: boolean[] = [];
    effect(() => seen.push(zeste.has('youtube')));
    zeste.grant('youtube');
    await nextTick();
    expect(seen).toEqual([false, true]);
    expect(zeste.categories.find((c) => c.key === 'video')?.status).toBe('granted');
  });

  it('v-model on preferencesOpen opens with a fresh draft; the draft is editable in place', () => {
    const zeste = setup();
    zeste.grant('gtag');
    zeste.preferencesOpen = true;
    expect(zeste.draft).toEqual({ gtag: true, youtube: false });
    expect(isReactive(zeste.draft)).toBe(true);
    zeste.draft.youtube = true;
    expect(zeste.has('youtube')).toBe(false);
    zeste.savePreferences();
    expect(zeste.has('youtube')).toBe(true);
    expect(zeste.preferencesOpen).toBe(false);
  });

  it('is never wrapped in a proxy (private fields would break)', () => {
    expect(isReactive(setup())).toBe(false);
  });
});
