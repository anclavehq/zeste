import { DEV } from 'esm-env';
import type { Attachment } from 'svelte/attachments';
import {
  ACTION_ATTRIBUTE,
  createConsent,
  defaultMessages,
  type ConsentAction,
  type ConsentManager,
  type ConsentOptions,
  type ConsentSnapshot,
  type ConsentStatus,
  type ServiceState,
  type ZesteMessages,
} from '@zeste/core';

export interface ZesteOptions<M extends ZesteMessages = ZesteMessages> extends ConsentOptions {
  /**
   * UI texts, e.g. `messages` from `@zeste/services/i18n/fr` (36 languages).
   * Exposed as is, typed, on `zeste.messages` for your components. English by default.
   */
  messages?: M;
  /**
   * compliance guard: warns in the console if the banner has no "Deny all" button,
   * if it is less visible than "Accept all", or if nothing allows reopening the preferences.
   * Enabled in development by default, never in production unless explicitly requested.
   */
  guard?: boolean;
}

export interface CategoryState {
  /** Category key (`analytic`, `ads`, `video`…). */
  key: string;
  services: ServiceState[];
  /** `mixed` if the services in the category do not all have the same status. */
  status: ConsentStatus | 'mixed';
}

/**
 * Reactive consent state (Svelte 5 runes).
 *
 * On the server, create it **per request** (inside a component, not at module level),
 * then pass it to `<ZesteProvider>`.
 */
export class Zeste<M extends ZesteMessages = ZesteMessages> {
  /** The underlying engine, for advanced needs. */
  readonly manager: ConsentManager;

  /** UI texts (default placeholders, and your components). */
  readonly messages: M;

  readonly guard: boolean;

  /**
   * Actions to attach to your own buttons, whatever the design system:
   * `<Button {@attach zeste.actions.denyAll}>`. Wires the click and marks the button
   * for the compliance guard. (A plain `onclick={zeste.denyAll}` also works, without the guard rail.)
   */
  readonly actions: Record<ConsentAction, Attachment<HTMLElement>>;

  #snapshot: ConsentSnapshot;

  /** Whether the preferences window is open. Bind it to your Dialog / Drawer. */
  preferencesOpen = $state(false);

  /** Choices being edited in the preferences window, committed by `savePreferences()`. */
  draft: Record<string, boolean> = $state({});

  constructor(options: ZesteOptions<M>) {
    this.manager = createConsent(options);
    // `M` is `ZesteMessages` when no messages are provided: the English default fits.
    this.messages = options.messages ?? (defaultMessages as M);
    this.guard = options.guard ?? DEV;
    this.actions = {
      acceptAll: action('acceptAll', () => this.acceptAll()),
      denyAll: action('denyAll', () => this.denyAll()),
      openPreferences: action('openPreferences', () => this.openPreferences()),
      savePreferences: action('savePreferences', () => this.savePreferences()),
      closePreferences: action('closePreferences', () => this.closePreferences()),
    };
    this.#snapshot = $state.raw(this.manager.getSnapshot());
    this.manager.subscribe((snapshot) => {
      this.#snapshot = snapshot;
    });
  }

  get services(): readonly ServiceState[] {
    return this.#snapshot.services;
  }

  /** Services grouped by category, ignoring those exempt from consent. */
  get categories(): CategoryState[] {
    const groups = new Map<string, ServiceState[]>();
    for (const service of this.#snapshot.services) {
      if (!service.needsConsent) continue;
      groups.set(service.category, [...(groups.get(service.category) ?? []), service]);
    }
    return [...groups].map(([key, services]) => {
      const statuses = new Set(services.map((s) => s.status));
      return { key, services, status: statuses.size === 1 ? [...statuses][0]! : 'mixed' };
    });
  }

  /** Services exempt from consent (to mention for transparency). */
  get exempt(): readonly ServiceState[] {
    return this.#snapshot.services.filter((s) => !s.needsConsent);
  }

  /** Whether the user has decided on every service. */
  get decided(): boolean {
    return this.#snapshot.decided;
  }

  /** Whether the banner should be shown. */
  get showBanner(): boolean {
    return !this.#snapshot.decided;
  }

  /** An already-loaded script was refused: offer to reload the page. */
  get needsReload(): boolean {
    return this.#snapshot.needsReload;
  }

  has = (key: string): boolean => this.#snapshot.status[key] === 'granted';

  statusOf = (key: string): ConsentStatus | undefined => this.#snapshot.status[key];

  grant = (key: string): void => this.manager.grant(key);

  deny = (key: string): void => this.manager.deny(key);

  setCategory = (category: string, granted: boolean): void => this.manager.setCategory(category, granted);

  acceptAll = (): void => {
    this.manager.grantAll();
    this.preferencesOpen = false;
  };

  denyAll = (): void => {
    this.manager.denyAll();
    this.preferencesOpen = false;
  };

  /** Opens the preferences with the current choices (undecided = refused: no pre-checked box). */
  openPreferences = (): void => {
    this.draft = Object.fromEntries(
      this.#snapshot.services.filter((s) => s.needsConsent).map((s) => [s.key, s.status === 'granted']),
    );
    this.preferencesOpen = true;
  };

  closePreferences = (): void => {
    this.preferencesOpen = false;
  };

  /** Checks / unchecks every service of a category in the draft. */
  draftCategory = (category: string, granted: boolean): void => {
    for (const s of this.#snapshot.services) {
      if (s.category === category && s.needsConsent) this.draft[s.key] = granted;
    }
  };

  /** Applies the draft and closes the preferences. */
  savePreferences = (): void => {
    this.manager.set({ ...this.draft });
    this.preferencesOpen = false;
  };

  /** Client-side: reads the cookie, runs the services. Called by `<ZesteProvider>`. */
  start = (): void => this.manager.start();

  destroy = (): void => this.manager.destroy();
}

function action(name: ConsentAction, run: () => void): Attachment<HTMLElement> {
  return (node) => {
    node.setAttribute(ACTION_ATTRIBUTE, name);
    const onClick = () => run();
    node.addEventListener('click', onClick);
    return () => {
      node.removeEventListener('click', onClick);
      node.removeAttribute(ACTION_ATTRIBUTE);
    };
  };
}

export function createZeste<M extends ZesteMessages = ZesteMessages>(options: ZesteOptions<M>): Zeste<M> {
  return new Zeste(options);
}
