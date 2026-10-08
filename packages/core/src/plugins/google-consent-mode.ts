import type { ConsentPlugin } from '../types.ts';

type Signal =
  | 'ad_storage'
  | 'analytics_storage'
  | 'ad_user_data'
  | 'ad_personalization'
  | 'functionality_storage'
  | 'personalization_storage'
  | 'security_storage';

export interface GoogleConsentModeOptions {
  /** Google signals driven by each service. Defaults match the tarteaucitron keys. */
  map?: Record<string, Signal[]>;
  waitForUpdate?: number;
}

const DEFAULT_MAP: Record<string, Signal[]> = {
  gtag: ['analytics_storage'],
  multiplegtag: ['analytics_storage'],
  googleads: ['ad_storage', 'ad_user_data', 'ad_personalization'],
  // "Switch" services from the tarteaucitron catalog, one per signal.
  gcmanalyticsstorage: ['analytics_storage'],
  gcmadstorage: ['ad_storage'],
  gcmadsuserdata: ['ad_user_data', 'ad_personalization'],
  gcmpersonalization: ['personalization_storage'],
  gcmfunctionality: ['functionality_storage'],
  gcmsecurity: ['security_storage'],
};

const V2_SIGNALS: Signal[] = ['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization'];

/** Google Consent Mode v2: `default` set to `denied`, then `update` on every change. */
export function googleConsentMode(options: GoogleConsentModeOptions = {}): ConsentPlugin {
  const map = options.map ?? DEFAULT_MAP;
  return {
    name: 'google-consent-mode',
    setup(manager) {
      const w: Window & { dataLayer?: unknown[] } = window;
      const dataLayer = (w.dataLayer ??= []);
      // gtag() pushes the `arguments` object, not an array: Google requires it.
      const gtag = function (..._args: unknown[]) {
        // eslint-disable-next-line prefer-rest-params
        dataLayer.push(arguments);
      };

      // The 4 v2 signals, plus those actually driven by a present service.
      const present = Object.entries(map)
        .filter(([key]) => manager.getSnapshot().status[key] !== undefined)
        .flatMap(([, signals]) => signals);
      const universe = [...new Set([...V2_SIGNALS, ...present])];
      const denied = () =>
        Object.fromEntries(universe.map((s) => [s, 'denied'])) as Partial<Record<Signal, 'granted' | 'denied'>>;
      const compute = () => {
        const signals = denied();
        for (const [key, keys] of Object.entries(map)) {
          if (manager.has(key)) for (const s of keys) signals[s] = 'granted';
        }
        return signals;
      };

      gtag('consent', 'default', { ...denied(), wait_for_update: options.waitForUpdate ?? 800 });

      let last = JSON.stringify(denied());
      return manager.subscribe(() => {
        const signals = compute();
        const serialized = JSON.stringify(signals);
        if (serialized === last) return;
        last = serialized;
        gtag('consent', 'update', signals);
      });
    },
  };
}
