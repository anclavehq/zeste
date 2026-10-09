/*
 * zeste for pages without a framework, loaded by dist/zeste.js. Reads the configuration (window.zesteConfig,
 * or a tarteaucitron configuration captured by the loader), downloads only the declared services and the
 * page language, then shows the ready-made interface.
 */
import { cookieStorage, createConsent, googleConsentMode, type ConsentManager, type ServiceDefinition } from '@zeste/core';
import { configureTarteaucitron } from '@zeste/core/tarteaucitron';
import { loaders } from '@zeste/services/loaders';
import { detectLanguage, loadMessages, pickLanguage } from '@zeste/services/i18n';
import type { ZesteConfig } from './config.ts';
import type { Captured } from './loader.ts';
import { mountUi, placeholderHtml } from './ui.ts';
import css from './styles.css?inline';

/** What the page can call: `zeste.open()` from its own "Cookie settings" link, `zeste.has('youtube')`… */
export interface ZesteApi {
  open(): void;
  close(): void;
  acceptAll(): void;
  denyAll(): void;
  grant(key: string): void;
  deny(key: string): void;
  has(key: string): boolean;
  manager: ConsentManager;
}

type Globals = typeof window & {
  tarteaucitron?: Partial<Captured>;
  tarteaucitronForceLanguage?: string;
  zeste?: ZesteApi;
};

async function start() {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }
  const globals = window as Globals;
  if (globals.zeste) return;
  const config: ZesteConfig = globals.zesteConfig ?? {};

  // A configuration written for tarteaucitron.js keeps working: jobs, user options and init parameters.
  const captured = globals.tarteaucitron?.__zesteCapture ? (globals.tarteaucitron as Captured) : undefined;
  if (captured) delete globals.tarteaucitron;
  const params = captured?.params ?? {};
  const param = <T>(key: string) => params[key] as T | undefined;

  // tarteaucitron.user options are global: every service receives them, as in tarteaucitron.
  const declared = new Map<string, Record<string, unknown>>();
  for (const key of captured?.job ?? []) declared.set(key, { ...captured?.user });
  for (const [key, options] of Object.entries(config.services ?? {})) declared.set(key, { ...captured?.user, ...options });

  const services = (
    await Promise.all(
      [...declared].map(async ([key, options]): Promise<ServiceDefinition | undefined> => {
        const loader = loaders[key];
        if (loader) return (await loader())(options);
        console.warn(`[zeste] unknown service "${key}": check its name in the tarteaucitron catalog.`);
        return undefined;
      }),
    )
  ).filter((s) => s !== undefined);

  const forced = config.language ?? globals.tarteaucitronForceLanguage;
  const language = forced ? pickLanguage([forced], detectLanguage()) : detectLanguage();
  const messages = await loadMessages(language);

  const style = config.style === 'pelure' ? 'pelure' : 'zeste';
  const theme = config.theme ?? 'site';
  document.head.append(Object.assign(document.createElement('style'), { textContent: css, id: 'zeste-styles' }));
  configureTarteaucitron({ messages, language, renderPlaceholder: placeholderHtml({ style, theme }) });

  const manager = createConsent({
    services,
    storage: cookieStorage({
      name: config.cookieName ?? param<string>('cookieName'),
      domain: config.cookieDomain ?? param<string>('cookieDomain'),
    }),
    policyVersion: config.policyVersion,
    allowPreConsentRequests: config.allowPreConsentRequests,
    plugins: (config.googleConsentMode ?? param<boolean>('googleConsentMode') ?? true) ? [googleConsentMode()] : [],
  });

  const ui = mountUi({
    manager,
    messages,
    style,
    theme,
    privacyUrl: config.privacyUrl || param<string>('privacyUrl') || undefined,
    showIcon: config.showIcon ?? param<boolean>('showIcon') ?? true,
    guard: config.guard ?? false,
  });

  // Links to #zeste (or the old #tarteaucitron hashtag) and [data-zeste-open] elements open the preferences.
  const hashtags = new Set(['#zeste', '#tarteaucitron', config.hashtag ?? param<string>('hashtag')].filter(Boolean));
  document.addEventListener('click', (event) => {
    const target = (event.target as Element | null)?.closest?.('[data-zeste-open], a[href^="#"]');
    if (!target || !(target.hasAttribute('data-zeste-open') || hashtags.has(target.getAttribute('href')!))) return;
    event.preventDefault();
    ui.open();
  });
  const openFromHash = () => {
    if (hashtags.has(location.hash)) ui.open();
  };
  addEventListener('hashchange', openFromHash);

  globals.zeste = {
    open: ui.open,
    close: ui.close,
    acceptAll: () => manager.grantAll(),
    denyAll: () => manager.denyAll(),
    grant: (key) => manager.grant(key),
    deny: (key) => manager.deny(key),
    has: (key) => manager.has(key),
    manager,
  };
  manager.start();
  openFromHash();
}

start().catch((error) => console.error('[zeste] failed to start', error));
