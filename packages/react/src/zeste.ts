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

declare const process: { env: { NODE_ENV?: string } };

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

/** Props to spread on your own button: `<Button {...zeste.actions.denyAll}>`. */
export interface ActionProps {
  onClick: () => void;
  [ACTION_ATTRIBUTE]: ConsentAction;
}

interface State {
  consent: ConsentSnapshot;
  preferencesOpen: boolean;
  draft: Readonly<Record<string, boolean>>;
}

/**
 * Consent state, read in components through `useZeste()`.
 *
 * Create it **once per request** on the server and once per page on the client:
 * `const [zeste] = useState(() => createZeste({ … }))`, then pass it to `<ZesteProvider>`.
 */
export class Zeste<M extends ZesteMessages = ZesteMessages> {
  /** The underlying engine, for advanced needs. */
  readonly manager: ConsentManager;

  /** UI texts (default placeholders, and your components). */
  readonly messages: M;

  readonly guard: boolean;

  /**
   * Props to spread on your own buttons, whatever the design system:
   * `<Button {...zeste.actions.denyAll}>`. Wires the click and marks the button
   * for the compliance guard. (A plain `onClick={zeste.denyAll}` also works, without the guard rail.)
   */
  readonly actions: Record<ConsentAction, ActionProps>;

  #state: State;
  #categories?: { for: ConsentSnapshot; value: CategoryState[] };
  #listeners = new Set<() => void>();
  #users = 0;
  #stopping?: ReturnType<typeof setTimeout>;

  constructor(options: ZesteOptions<M>) {
    this.manager = createConsent(options);
    // `M` is `ZesteMessages` when no messages are provided: the English default fits.
    this.messages = options.messages ?? (defaultMessages as M);
    this.guard = options.guard ?? isDev();
    this.actions = {
      acceptAll: action('acceptAll', this.acceptAll),
      denyAll: action('denyAll', this.denyAll),
      openPreferences: action('openPreferences', this.openPreferences),
      savePreferences: action('savePreferences', this.savePreferences),
      closePreferences: action('closePreferences', this.closePreferences),
    };
    this.#state = { consent: this.manager.getSnapshot(), preferencesOpen: false, draft: {} };
    this.manager.subscribe((consent) => {
      if (consent !== this.#state.consent) this.#set({ consent });
    });
  }

  #set(patch: Partial<State>) {
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener();
  }

  /** For `useSyncExternalStore`. */
  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  /** For `useSyncExternalStore`: changes identity on every change. */
  getState = (): unknown => this.#state;

  get services(): readonly ServiceState[] {
    return this.#state.consent.services;
  }

  /** Services grouped by category, ignoring those exempt from consent. */
  get categories(): CategoryState[] {
    const consent = this.#state.consent;
    if (this.#categories?.for === consent) return this.#categories.value;
    const groups = new Map<string, ServiceState[]>();
    for (const service of consent.services) {
      if (!service.needsConsent) continue;
      groups.set(service.category, [...(groups.get(service.category) ?? []), service]);
    }
    const value = [...groups].map(([key, services]): CategoryState => {
      const statuses = new Set(services.map((s) => s.status));
      return { key, services, status: statuses.size === 1 ? [...statuses][0]! : 'mixed' };
    });
    this.#categories = { for: consent, value };
    return value;
  }

  /** Services exempt from consent (to mention for transparency). */
  get exempt(): readonly ServiceState[] {
    return this.#state.consent.services.filter((s) => !s.needsConsent);
  }

  /** Whether the user has decided on every service. */
  get decided(): boolean {
    return this.#state.consent.decided;
  }

  /** Whether the banner should be shown. */
  get showBanner(): boolean {
    return !this.#state.consent.decided;
  }

  /** An already-loaded script was refused: offer to reload the page. */
  get needsReload(): boolean {
    return this.#state.consent.needsReload;
  }

  /** Whether the preferences window is open. Wire it to your Dialog / Drawer with `setPreferencesOpen`. */
  get preferencesOpen(): boolean {
    return this.#state.preferencesOpen;
  }

  /** Choices being edited in the preferences window, committed by `savePreferences()`. */
  get draft(): Readonly<Record<string, boolean>> {
    return this.#state.draft;
  }

  has = (key: string): boolean => this.#state.consent.status[key] === 'granted';

  statusOf = (key: string): ConsentStatus | undefined => this.#state.consent.status[key];

  grant = (key: string): void => this.manager.grant(key);

  deny = (key: string): void => this.manager.deny(key);

  setCategory = (category: string, granted: boolean): void => this.manager.setCategory(category, granted);

  acceptAll = (): void => {
    this.manager.grantAll();
    this.#set({ preferencesOpen: false });
  };

  denyAll = (): void => {
    this.manager.denyAll();
    this.#set({ preferencesOpen: false });
  };

  /** Opens the preferences with the current choices (undecided = refused: no pre-checked box). */
  openPreferences = (): void => {
    const draft = Object.fromEntries(
      this.#state.consent.services.filter((s) => s.needsConsent).map((s) => [s.key, s.status === 'granted']),
    );
    this.#set({ draft, preferencesOpen: true });
  };

  closePreferences = (): void => {
    if (this.#state.preferencesOpen) this.#set({ preferencesOpen: false });
  };

  /** For controlled dialogs: `<Dialog open={zeste.preferencesOpen} onOpenChange={zeste.setPreferencesOpen}>`. */
  setPreferencesOpen = (open: boolean): void => (open ? this.openPreferences() : this.closePreferences());

  /** Checks / unchecks a service in the draft. */
  setDraft = (key: string, granted: boolean): void => {
    this.#set({ draft: { ...this.#state.draft, [key]: granted } });
  };

  /** Checks / unchecks every service of a category in the draft. */
  draftCategory = (category: string, granted: boolean): void => {
    const draft = { ...this.#state.draft };
    for (const s of this.#state.consent.services) {
      if (s.category === category && s.needsConsent) draft[s.key] = granted;
    }
    this.#set({ draft });
  };

  /** Applies the draft and closes the preferences. */
  savePreferences = (): void => {
    this.manager.set({ ...this.#state.draft });
    this.#set({ preferencesOpen: false });
  };

  /**
   * Client-side: reads the cookie, runs the services. Called by `<ZesteProvider>`.
   * The release is deferred, so that a remount (React Strict Mode) keeps the running engine.
   */
  retain = (): void => {
    clearTimeout(this.#stopping);
    this.#users++;
    this.manager.start();
  };

  release = (): void => {
    if (--this.#users > 0) return;
    this.#stopping = setTimeout(() => {
      if (this.#users === 0) this.manager.destroy();
    });
  };
}

function action(name: ConsentAction, run: () => void): ActionProps {
  return { onClick: () => run(), [ACTION_ATTRIBUTE]: name };
}

function isDev(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

export function createZeste<M extends ZesteMessages = ZesteMessages>(options: ZesteOptions<M>): Zeste<M> {
  return new Zeste(options);
}
