import { cookieStorage, purgeCookie } from './storage.ts';
import type {
  ConsentManager,
  ConsentPlugin,
  ConsentSnapshot,
  ConsentStatus,
  ConsentStorage,
  Listener,
  ServiceDefinition,
} from './types.ts';

const VERSION_KEY = '_v';

export interface ConsentOptions {
  services: ServiceDefinition[];
  /** tarteaucitron-compatible cookie by default. */
  storage?: ConsentStorage;
  /** Changing this value invalidates existing choices and shows the banner again. */
  policyVersion?: string;
  plugins?: ConsentPlugin[];
  /**
   * Choices known in advance, e.g. read from the cookie on the server (SSR):
   * the first render is then already correct, with no banner flash.
   */
  initial?: Record<string, string>;
  /**
   * By default, no request to a third party is made before consent. Some services offer
   * a degraded mode that does make one (e.g. cookieless Matomo Cloud): `true` allows them all,
   * a list of keys allows only those.
   */
  allowPreConsentRequests?: boolean | string[];
  /** Handles the `[data-zeste-allow="<key>"]` buttons of HTML placeholders. Enabled by default. */
  delegateClicks?: boolean;
  /**
   * Publishes the declared services in `window.__zesteManifest` (`ZesteManifest`), as other CMPs
   * do (`tarteaucitron.job`, `__tcfapi`…). `zeste scan` uses it to spot trackers loaded
   * outside zeste. Contains only what the banner already displays. Enabled by default.
   */
  expose?: boolean;
}

/** What `window.__zesteManifest` publishes: one manifest per zeste instance on the page. */
export interface ZesteManifest {
  services: { key: string; name: string; category: string; needsConsent: boolean; endpoints: string[] }[];
}

export function createConsent(options: ConsentOptions): ConsentManager {
  const services = new Map(options.services.map((s) => [s.key, s]));
  const storage = options.storage ?? cookieStorage();
  const listeners = new Set<Listener>();
  const loaded = new Set<string>();
  const queues = new Map<string, Promise<void>>();
  const teardowns: Array<() => void> = [];
  let status: Record<string, ConsentStatus> = readStatus(options.initial ?? {});
  let needsReload = false;
  let started = false;
  let snapshot = buildSnapshot();

  function readStatus(raw: Record<string, string>): Record<string, ConsentStatus> {
    const outdated = options.policyVersion !== undefined && raw[VERSION_KEY] !== options.policyVersion;
    const result: Record<string, ConsentStatus> = {};
    for (const service of services.values()) {
      if (!service.needsConsent) result[service.key] = 'granted';
      else if (outdated) result[service.key] = 'unknown';
      else if (raw[service.key] === 'true') result[service.key] = 'granted';
      else if (raw[service.key] === 'false') result[service.key] = 'denied';
      else result[service.key] = 'unknown';
    }
    return result;
  }

  function buildSnapshot(): ConsentSnapshot {
    const list = [...services.values()].map((s) => ({
      key: s.key,
      name: s.name,
      category: s.category,
      embedClasses: s.embedClasses,
      privacyUrl: s.privacyUrl,
      needsConsent: s.needsConsent,
      cookies: s.cookies,
      status: status[s.key] ?? 'unknown',
    }));
    return {
      services: list,
      status: { ...status },
      decided: list.every((s) => s.status !== 'unknown'),
      needsReload,
    };
  }

  function emit() {
    snapshot = buildSnapshot();
    for (const listener of listeners) listener(snapshot);
  }

  function persist() {
    // Rewrite the full value to preserve keys of other services
    // (e.g. a tarteaucitron still present on another part of the site).
    const values = { ...storage.read() };
    for (const [key, value] of Object.entries(status)) {
      if (value !== 'unknown') values[key] = String(value === 'granted');
    }
    if (options.policyVersion !== undefined) values[VERSION_KEY] = options.policyVersion;
    storage.write(values);
  }

  // One queue per service: loading is asynchronous, but the effects of a
  // given service always run in the order of the changes.
  function run(service: ServiceDefinition): Promise<void> {
    const next = (queues.get(service.key) ?? Promise.resolve()).then(() => exec(service));
    queues.set(service.key, next);
    return next;
  }

  function canRunOnDeny(service: ServiceDefinition) {
    if (!service.onDeny) return false;
    if (!service.preConsentRequests) return true;
    const allow = options.allowPreConsentRequests ?? false;
    return Array.isArray(allow) ? allow.includes(service.key) : allow;
  }

  async function exec(service: ServiceDefinition) {
    const ctx = { consent: manager };
    try {
      const wanted = status[service.key] === 'granted';
      if (wanted ? loaded.has(service.key) && !service.embed : !canRunOnDeny(service)) return;
      await service.load?.();
      // The status may have changed while loading: apply the current state.
      if (status[service.key] === 'granted') {
        if (loaded.has(service.key) && !service.embed) return;
        service.onGrant(ctx);
        loaded.add(service.key);
        dispatch(`${service.key}_loaded`);
      } else if (canRunOnDeny(service)) {
        service.onDeny!(ctx);
      }
    } catch (error) {
      console.error(`[zeste] service "${service.key}" failed`, error);
    }
  }

  function apply(changes: Record<string, boolean>) {
    let changed = false;
    const toRun: ServiceDefinition[] = [];
    for (const [key, granted] of Object.entries(changes)) {
      const service = services.get(key);
      if (!service || !service.needsConsent) continue;
      const next: ConsentStatus = granted ? 'granted' : 'denied';
      if (status[key] === next) continue;
      const wasLoaded = loaded.has(key);
      status = { ...status, [key]: next };
      changed = true;
      if (granted) {
        toRun.push(service);
      } else if (wasLoaded) {
        service.cookies.forEach(purgeCookie);
        if (service.embed) {
          loaded.delete(key);
          toRun.push(service);
        } else {
          needsReload = true;
        }
      }
    }
    if (!changed) return;
    persist();
    if (started) toRun.forEach(run);
    emit();
  }

  function each(predicate: (s: ServiceDefinition) => boolean, granted: boolean) {
    const changes: Record<string, boolean> = {};
    for (const s of services.values()) if (predicate(s)) changes[s.key] = granted;
    apply(changes);
  }

  function onClick(event: Event) {
    const target = (event.target as Element | null)?.closest?.('[data-zeste-allow]');
    const key = target?.getAttribute('data-zeste-allow');
    if (key) manager.grant(key);
  }

  const manager: ConsentManager = {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);
      return () => listeners.delete(listener);
    },
    has: (key) => status[key] === 'granted',
    grant: (key) => apply({ [key]: true }),
    deny: (key) => apply({ [key]: false }),
    grantAll: () => each(() => true, true),
    denyAll: () => each(() => true, false),
    setCategory: (category, granted) => each((s) => s.category === category, granted),
    set: apply,
    start() {
      if (started || typeof window === 'undefined') return;
      started = true;
      if (!options.initial) {
        status = readStatus(storage.read());
        emit();
      }
      for (const plugin of options.plugins ?? []) {
        const teardown = plugin.setup(manager);
        if (teardown) teardowns.push(teardown);
      }
      if (options.expose !== false) {
        const manifest: ZesteManifest = {
          services: [...services.values()].map((s) => ({
            key: s.key,
            name: s.name,
            category: s.category,
            needsConsent: s.needsConsent,
            endpoints: s.endpoints ?? [],
          })),
        };
        const globals = window as typeof window & { __zesteManifest?: ZesteManifest[] };
        (globals.__zesteManifest ??= []).push(manifest);
        teardowns.push(() => globals.__zesteManifest?.splice(globals.__zesteManifest.indexOf(manifest) >>> 0, 1));
      }
      if (options.delegateClicks !== false) {
        document.addEventListener('click', onClick);
        teardowns.push(() => document.removeEventListener('click', onClick));
      }
      services.forEach(run);
    },
    rescan(key) {
      if (!started) return;
      for (const s of services.values()) if (s.embed && (key === undefined || s.key === key)) run(s);
    },
    async settled() {
      let pending: Promise<void>[];
      do {
        pending = [...queues.values()];
        await Promise.all(pending);
      } while (pending.length !== queues.size || pending.some((p, i) => p !== [...queues.values()][i]));
    },
    destroy() {
      teardowns.splice(0).forEach((fn) => fn());
      listeners.clear();
    },
  };

  return manager;
}

function dispatch(name: string) {
  if (typeof document !== 'undefined') document.dispatchEvent(new Event(name));
}
