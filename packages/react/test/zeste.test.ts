import { describe, expect, it, vi } from 'vitest';
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

describe('store', () => {
  it('notifies with a new state identity on every change', () => {
    const zeste = setup();
    const listener = vi.fn();
    zeste.subscribe(listener);
    const before = zeste.getState();
    zeste.grant('youtube');
    expect(listener).toHaveBeenCalled();
    expect(zeste.getState()).not.toBe(before);
    expect(zeste.has('youtube')).toBe(true);
    expect(zeste.showBanner).toBe(true);
  });

  it('keeps the categories identity until the consent changes', () => {
    const zeste = setup();
    const categories = zeste.categories;
    zeste.openPreferences();
    expect(zeste.categories).toBe(categories);
    zeste.grant('gtag');
    expect(zeste.categories).not.toBe(categories);
  });

  it('edits a draft, nothing applied before saving', () => {
    const zeste = setup();
    zeste.openPreferences();
    expect(zeste.draft).toEqual({ gtag: false, youtube: false });
    zeste.setDraft('youtube', true);
    expect(zeste.has('youtube')).toBe(false);
    zeste.savePreferences();
    expect(zeste.has('youtube')).toBe(true);
    expect(zeste.has('gtag')).toBe(false);
    expect(zeste.preferencesOpen).toBe(false);
  });

  it('survives an immediate remount (React Strict Mode)', async () => {
    const zeste = setup();
    const destroy = vi.spyOn(zeste.manager, 'destroy');
    zeste.retain();
    zeste.release();
    zeste.retain();
    await new Promise((resolve) => setTimeout(resolve));
    expect(destroy).not.toHaveBeenCalled();
    zeste.release();
    await new Promise((resolve) => setTimeout(resolve));
    expect(destroy).toHaveBeenCalledOnce();
  });
});
