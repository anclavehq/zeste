/**
 * Compatibility shim for the tarteaucitron.js service catalog.
 *
 * `@zeste/services` copies the code of each service from `tarteaucitron.services.js` and
 * calls it with this shim in place of the `tarteaucitron` object: it only contains the
 * helpers the catalog needs. The tarteaucitron engine and UI are never loaded.
 *
 * The helpers below are taken from tarteaucitron.js
 * (https://github.com/AmauriC/tarteaucitron.js) — MIT, Copyright (c) 2014 AmauriC.
 */
import { purgeCookie } from '../storage.ts';
import { defaultMessages, type ZesteMessages } from '../messages.ts';
import type { ServiceDefinition } from '../types.ts';

/** A service as defined in `tarteaucitron.services.js`. */
export interface TacService {
  key: string;
  type: string;
  name: string;
  uri?: string;
  needConsent?: boolean;
  cookies?: string[];
  js: () => void;
  fallback?: () => void;
}

/** The `tarteaucitron` object as seen by the service code: only what the catalog needs. */
export interface TacRuntime {
  services: Record<string, TacService>;
  /** Service configuration (`gtagUa`, `matomoId`…). */
  user: Record<string, unknown>;
  parameters: Required<Pick<NonNullable<TarteaucitronOptions['parameters']>, 'googleConsentMode' | 'softConsentMode' | 'bingConsentMode'>> &
    Record<string, unknown>;
  lang: Record<string, string>;
  job: string[];
  added: Record<string, boolean>;
  launch: Record<string, boolean>;
  state: Record<string, boolean>;
  isAjax: boolean;
  /** Consent lifetime in ms (tarteaucitron's global `timeExpire` variable). */
  timeExpire: number;
  /** Current phase (`js` or `fallback`), to make `fallback()` idempotent per element. */
  phase?: 'grant' | 'deny';
  fixSelfXSS(html: unknown): string;
  getLanguage(): string;
  getLocale(): string;
  addScript(url: string, id?: string, callback?: unknown, execute?: boolean, attrName?: string, attrVal?: unknown): void;
  addInternalScript(url: string, id?: string, callback?: unknown, execute?: boolean, attrName?: string, attrVal?: unknown): void;
  makeAsync: {
    antiGhost: number;
    buffer: string;
    init(url: string, id: string): void;
    getAndParse(url: string, id: string): void;
  };
  fallback(matchClass: string[], content: string | ((elem: HTMLElement) => string | void), noInner?: boolean): void;
  engage(id: string): string;
  extend(a: Record<string, unknown>, b: Record<string, unknown>): void;
  getElemWidth(elem: HTMLElement): string | number;
  getElemHeight(elem: HTMLElement): string | number;
  getElemAttr(elem: Element, attr: string): string;
  getStyleSize(value: unknown): string;
  cookie: { purge(names: string[]): void; read(): string };
  sendEvent(name: string): void;
  triggerJobsAfterAjaxCall(): void;
}

export interface TarteaucitronOptions {
  /** Partial equivalent of `tarteaucitron.parameters`. */
  parameters?: {
    /** Leave as `false`: Consent Mode is handled by the `googleConsentMode()` plugin. */
    googleConsentMode?: boolean;
    softConsentMode?: boolean;
    bingConsentMode?: boolean;
    [key: string]: unknown;
  };
  /** Language passed to the services that need it (`getLanguage`). */
  language?: string;
  /** Lifetime passed to the services that read it (e.g. GA4's `cookie_expires`). */
  expiresInDays?: number;
  /** HTML placeholder texts, e.g. `messages` from `@zeste/services/i18n/fr`. English by default. */
  messages?: ZesteMessages;
  /** HTML of the placeholder shown in place of a blocked embed (replaces the default rendering). */
  renderPlaceholder?: (service: { key: string; name: string }, messages: ZesteMessages) => string;
}

/** Function generated for each service: receives the shim, returns the tarteaucitron definition. */
export type TacServiceFactory = (tarteaucitron: TacRuntime, timeExpire: number) => TacService;

/** What `@zeste/services` generates for each catalog service. */
export interface TacServiceMeta {
  key: string;
  name: string;
  type: string;
  uri: string;
  needConsent: boolean;
  cookies: string[] | ((tarteaucitron: { user: Record<string, unknown> }) => string[]);
  embed: boolean;
  hasFallback: boolean;
  preConsentRequests: boolean;
  embedClasses?: string[];
  load: () => Promise<{ default: TacServiceFactory }>;
  deps: Record<string, () => Promise<{ default: TacServiceFactory }>>;
}

const STYLE_UNITS = /^\d+(\.\d+)?(px|%|em|rem|vh|vw|vmin|vmax|ch|ex|pt|pc|cm|mm|in|q)$/;

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Same text as tarteaucitron: "YouTube is disabled." + an "Allow" button. */
function defaultPlaceholder(service: { key: string; name: string }, messages: ZesteMessages): string {
  const name = escapeHtml(service.name);
  return (
    `<div class="zeste-placeholder" data-zeste-service="${escapeHtml(service.key)}">` +
    `<p>${name} ${escapeHtml(messages.fallback)}</p>` +
    `<button type="button" data-zeste-allow="${escapeHtml(service.key)}">${escapeHtml(messages.allow)} ${name}</button>` +
    `</div>`
  );
}

function createShim(options: TarteaucitronOptions): TacRuntime {
  const renderPlaceholder = options.renderPlaceholder ?? defaultPlaceholder;
  const messages = options.messages ?? defaultMessages;

  const tac: TacRuntime = {
    services: {},
    user: {},
    parameters: {
      googleConsentMode: false,
      softConsentMode: true,
      bingConsentMode: false,
      cookieslist: false,
      useExternalJs: false,
      ...options.parameters,
    },
    lang: {},
    job: [],
    added: {},
    launch: {},
    state: {},
    isAjax: true,
    timeExpire: (options.expiresInDays ?? 395) * 86_400_000,

    fixSelfXSS: escapeHtml,

    getLanguage: () => (options.language ?? document.documentElement.lang ?? 'en').slice(0, 2) || 'en',

    getLocale() {
      const lang = tac.getLanguage();
      const locales: Record<string, string> = {
        fr: 'fr_FR', en: 'en_US', de: 'de_DE', es: 'es_ES', it: 'it_IT', pt: 'pt_PT', nl: 'nl_NL', el: 'el_EL',
      };
      return locales[lang] ?? 'en_US';
    },

    // The catalog sometimes passes '' instead of a function, or `true` as an attribute value.
    addScript(url, id, callback, execute, attrName, attrVal) {
      if (execute === false) {
        if (typeof callback === 'function') callback();
        return;
      }
      const script = document.createElement('script');
      if (id) script.id = id;
      script.async = true;
      script.src = url;
      if (attrName !== undefined && attrVal !== undefined) script.setAttribute(attrName, String(attrVal));
      if (typeof callback === 'function') {
        let done = false;
        script.onload = () => {
          if (!done) {
            done = true;
            callback();
          }
        };
      }
      document.head.appendChild(script);
    },

    addInternalScript(url, id, callback, execute, attrName, attrVal) {
      tac.addScript(url, id, callback, execute, attrName, attrVal);
    },

    makeAsync: {
      antiGhost: 0,
      buffer: '',
      init(url, id) {
        const savedWrite = document.write;
        const savedWriteln = document.writeln;
        document.write = (...content: string[]) => {
          tac.makeAsync.buffer += content.join('');
        };
        document.writeln = (...content: string[]) => {
          tac.makeAsync.buffer += content.join('') + '\n';
        };
        setTimeout(() => {
          document.write = savedWrite;
          document.writeln = savedWriteln;
        }, 20000);
        tac.makeAsync.getAndParse(url, id);
      },
      getAndParse(url, id) {
        if (tac.makeAsync.antiGhost > 9) {
          tac.makeAsync.antiGhost = 0;
          return;
        }
        tac.makeAsync.antiGhost += 1;
        tac.addInternalScript(url, '', () => {
          const el = document.getElementById(id);
          if (el) {
            el.innerHTML += tac.makeAsync.buffer;
            tac.makeAsync.buffer = '';
          }
        });
      },
    },

    fallback(matchClass, content, noInner) {
      const selector = matchClass.map((cls) => '.' + cls).join(', ');
      document.querySelectorAll<HTMLElement>(selector).forEach((elem) => {
        // Difference from tarteaucitron: an element already rendered in the current state is not
        // rewritten, so a rescan does not restart a video that is playing.
        if (tac.phase) {
          if (elem.dataset.zesteState === tac.phase) return;
          elem.dataset.zesteState = tac.phase;
        }
        const width = tac.getElemAttr(elem, 'width');
        const height = tac.getElemAttr(elem, 'height');
        if (width !== '') elem.style.width = tac.getStyleSize(width);
        if (height !== '') elem.style.height = tac.getStyleSize(height);
        if (typeof content === 'function') {
          if (noInner === true) content(elem);
          else elem.innerHTML = content(elem) ?? '';
        } else {
          elem.innerHTML = content;
        }
      });
    },

    engage(id) {
      return renderPlaceholder({ key: id, name: tac.services[id]?.name ?? id }, messages);
    },

    extend(a, b) {
      for (const prop in b) if (Object.prototype.hasOwnProperty.call(b, prop)) a[prop] = b[prop];
    },

    getElemWidth: (elem) => tac.getElemAttr(elem, 'width') || elem.clientWidth,
    getElemHeight: (elem) => tac.getElemAttr(elem, 'height') || elem.clientHeight,

    getElemAttr(elem, attr) {
      let attribute =
        elem.getAttribute('data-' + attr) ||
        elem.getAttribute(attr) ||
        elem.getAttribute(attr.startsWith('data-') ? attr.slice(5) : attr);
      // security: only accept real URLs (behavior taken from tarteaucitron)
      if ((attr === 'url' || attr === 'data-url' || attr === 'data-src') && !/^https?:\/\/[^\s]+$/.test(String(elem.getAttribute(attr)))) {
        return '';
      }
      // security: no data-srcdoc (XSS)
      if (attr === 'srcdoc' || attr === 'data-srcdoc') attribute = elem.getAttribute('srcdoc');
      return typeof attribute === 'string' ? escapeHtml(attribute) : '';
    },

    getStyleSize(value) {
      if (value == null) return 'auto';
      const v = String(value).trim();
      if (STYLE_UNITS.test(v)) return v;
      if (/^\d+(\.\d+)?$/.test(v)) return v + 'px';
      return 'auto';
    },

    cookie: {
      purge: (names) => names.forEach(purgeCookie),
      read: () => '',
    },

    sendEvent(name) {
      document.dispatchEvent(new Event(name));
    },

    triggerJobsAfterAjaxCall() {},
  };

  return tac;
}

let config: TarteaucitronOptions = {};
let runtime: TacRuntime | undefined;

type ZesteRuntime = TacRuntime & { __zeste?: true };
const globals = globalThis as typeof globalThis & { tarteaucitron?: ZesteRuntime };

/** Global shim settings (language, placeholder…). Call before `consent.start()`. */
export function configureTarteaucitron(options: TarteaucitronOptions): void {
  if (runtime) throw new Error('[zeste] configureTarteaucitron() must be called before the services are loaded.');
  config = options;
}

/** A single shim per page, shared by all services (like the real `tarteaucitron`). */
function getRuntime(): TacRuntime {
  if (runtime) return runtime;
  if (globals.tarteaucitron && !globals.tarteaucitron.__zeste) {
    throw new Error('[zeste] tarteaucitron.js is already loaded on the page: remove it, zeste replaces it.');
  }
  const shim: ZesteRuntime = createShim(config);
  shim.__zeste = true;
  // The service code receives the shim as a parameter; the global only serves
  // any third-party scripts that might call it directly.
  globals.tarteaucitron ??= shim;
  runtime = shim;
  return shim;
}

async function register(key: string, loader: TacServiceMeta['load']): Promise<TacService> {
  const rt = getRuntime();
  const existing = rt.services[key];
  if (existing) return existing;
  const { default: factory } = await loader();
  const service = (rt.services[key] ??= factory(rt, rt.timeExpire));
  if (!rt.job.includes(key)) rt.job.push(key);
  return service;
}

function withPhase(phase: 'grant' | 'deny', fn: () => void) {
  const rt = getRuntime();
  rt.phase = phase;
  try {
    fn();
  } finally {
    rt.phase = undefined;
  }
}

/**
 * Hosts inferred from the options (`matomoHost`, `plausibleEndpoint`, `matomoCustomJSPath`…). Not the
 * `…Domain` options: for Plausible, that is the measured site's domain, not the tracker's.
 */
function endpointsOf(user: Record<string, unknown>): string[] {
  const hosts = new Set<string>();
  for (const [key, value] of Object.entries(user)) {
    if (typeof value !== 'string' || !/host|endpoint|url|path|src/i.test(key)) continue;
    try {
      const host = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`).hostname;
      if (host.includes('.')) hosts.add(host);
    } catch {
      // value that is not an address: ignored
    }
  }
  return [...hosts];
}

export function defineTacService(meta: TacServiceMeta, options: object = {}): ServiceDefinition {
  const user: Record<string, unknown> = { ...options };
  let service: TacService | undefined;
  const loaded = (): TacService => {
    if (!service) throw new Error(`[zeste] service "${meta.key}" executed before it was loaded`);
    return service;
  };
  let loading: Promise<void> | undefined;

  return {
    key: meta.key,
    name: meta.name,
    category: meta.type,
    privacyUrl: meta.uri || undefined,
    needsConsent: meta.needConsent,
    // After loading, read the live list (some services extend it, e.g. matomo).
    get cookies() {
      if (service?.cookies) return service.cookies;
      return typeof meta.cookies === 'function' ? meta.cookies({ user }) : meta.cookies;
    },
    embed: meta.embed,
    embedClasses: meta.embedClasses,
    preConsentRequests: meta.preConsentRequests,
    endpoints: endpointsOf(user),
    load() {
      return (loading ??= (async () => {
        Object.assign(getRuntime().user, user);
        for (const [key, loader] of Object.entries(meta.deps)) await register(key, loader);
        service = await register(meta.key, meta.load);
      })());
    },
    onGrant: () => withPhase('grant', () => loaded().js()),
    onDeny: meta.hasFallback ? () => withPhase('deny', () => loaded().fallback?.()) : undefined,
  };
}

/** For tests: forgets the current shim. */
export function resetTarteaucitron(): void {
  if (globals.tarteaucitron === runtime) delete globals.tarteaucitron;
  runtime = undefined;
  config = {};
}
