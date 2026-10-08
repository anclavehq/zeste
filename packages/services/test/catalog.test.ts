/**
 * Functional test of the whole catalog (happy-dom): each service gets a dummy config
 * and the HTML elements it expects, then we check that it produces an observable effect.
 * The real-browser version, with network interception, lives in /e2e.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createConsent, memoryStorage } from '@zeste/core';
import { resetTarteaucitron } from '@zeste/core/tarteaucitron';
import { catalog } from '../src/catalog.ts';
import * as services from '../src/index.ts';
import { CONSENT_MODE_SWITCHES, factoryOf, fixtureHtml, fixtureOptions } from './fixtures.ts';

const QUEUES = ['_paq', 'dataLayer', '_mtm', '_gaq'] as const;

const observe = () =>
  JSON.stringify([
    document.documentElement.outerHTML,
    Object.keys(window).length,
    document.cookie,
    // tag queues (Matomo, GTM, AT Internet…): a push counts as an effect
    ...QUEUES.map((k) => window[k]?.length),
  ]);

// Context passed to the services (unused by the catalog services).
const ctx = { consent: createConsent({ services: [], storage: memoryStorage() }) };

describe('full catalog', () => {
  it('every service loads, runs without error and produces an effect', async () => {
    const errors: string[] = [];
    const inert: string[] = [];

    // `new Image().src = …` pixels are a real effect but invisible in the DOM.
    let pixels = 0;
    const NativeImage = window.Image;
    window.Image = class extends NativeImage {
      constructor(...args: ConstructorParameters<typeof Image>) {
        super(...args);
        pixels++;
      }
    };

    for (const entry of catalog) {
      const factory = factoryOf(services, entry.exportName);
      const html = fixtureHtml(readFileSync(join(process.cwd(), 'src/impl', `${entry.key}.ts`), 'utf8'));

      // Each phase on a fresh shim: without consent, then with consent from the start.
      for (const phase of ['onDeny', 'onGrant'] as const) {
        resetTarteaucitron();
        // A real page always contains at least one <script> (many snippets insert before it).
        document.head.innerHTML = '<script></script>';
        document.body.innerHTML = html;
        const service = factory(fixtureOptions(entry));
        try {
          await service.load?.();
          const before = observe() + pixels;
          service[phase]?.(ctx);
          const after = observe() + pixels;
          if (phase === 'onGrant' && before === after && !CONSENT_MODE_SWITCHES.has(entry.key)) inert.push(entry.key);
        } catch (error) {
          errors.push(`${entry.key}.${phase}: ${(error as Error).message}`);
        }
      }
    }
    window.Image = NativeImage;

    console.log(`${catalog.length} services — ${errors.length} errors, ${inert.length} with no observable effect`);
    if (errors.length) console.log('ERRORS\n  ' + errors.join('\n  '));
    if (inert.length) console.log('NO EFFECT\n  ' + inert.join(', '));
    expect(errors).toEqual([]);
    expect(inert).toEqual([]);
  });
});
