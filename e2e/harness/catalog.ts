/**
 * Playwright harness: `catalog.html?key=<service>` mounts a single catalog service
 * with a dummy config and the HTML elements it expects, then exposes `window.__catalog`.
 */
import { createConsent, googleConsentMode } from '@zeste/core';
import * as services from '@zeste/services';
import { catalog } from '../../packages/services/src/catalog.ts';
import { factoryOf, fixtureHtml, fixtureOptions } from '../../packages/services/test/fixtures.ts';

const sources = import.meta.glob<string>('../../packages/services/src/impl/*.ts', { query: '?raw', import: 'default' });

const errors: string[] = [];
const nativeError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].startsWith('[zeste]')) {
    errors.push(`${args[0]} ${args[1] instanceof Error ? args[1].message : String(args[1] ?? '')}`);
  }
  nativeError(...args);
};

const key = new URLSearchParams(location.search).get('key')!;
const entry = catalog.find((e) => e.key === key);
if (!entry) throw new Error(`unknown service: ${key}`);
const loadSource = sources[`../../packages/services/src/impl/${key}.ts`];
if (!loadSource) throw new Error(`source not found: ${key}`);
document.querySelector('#fixtures')!.innerHTML = fixtureHtml(await loadSource());

const factory = factoryOf(services, entry.exportName);
const consent = createConsent({
  services: [factory(fixtureOptions(entry))],
  plugins: [googleConsentMode()],
});
consent.start();
await consent.settled();

const QUEUES = ['_paq', 'dataLayer', '_mtm', '_gaq'] as const;

window.__catalog = {
  consent,
  errors,
  probe: () =>
    JSON.stringify([
      document.body.innerHTML,
      document.head.innerHTML,
      Object.keys(window).length,
      ...QUEUES.map((k) => window[k]?.length),
    ]),
};
