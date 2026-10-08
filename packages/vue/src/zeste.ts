import { DEV } from 'esm-env';
import { computed, markRaw, reactive, ref, shallowRef, type ComputedRef, type ShallowRef } from 'vue';
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

/** Attributes to bind on your own button: `<Button v-bind="zeste.actions.denyAll">`. */
export interface ActionProps {
  onClick: () => void;
  [ACTION_ATTRIBUTE]: ConsentAction;
}

/**
 * Reactive consent state (Vue refs under the hood): read it in templates as plain properties.
 *
 * On the server, create it **per request** (in `setup`, not at module level),
 * then pass it to `<ZesteProvider>`.
 */
export class Zeste<M extends ZesteMessages = ZesteMessages> {
  /** The underlying engine, for advanced needs. */
  readonly manager: ConsentManager;

  /** UI texts (default placeholders, and your components). */
  readonly messages: M;

  readonly guard: boolean;

  /**
   * Attributes to bind on your own buttons, whatever the design system:
   * `<Button v-bind="zeste.actions.denyAll">`. Wires the click and marks the button
   * for the compliance guard. (A plain `@click="zeste.denyAll"` also works, without the guard rail.)
   */
  readonly actions: Record<ConsentAction, ActionProps>;

  /** Choices being edited in the preferences window, committed by `savePreferences()`: `v-model="zeste.draft[key]"`. */
  readonly draft: Record<string, boolean> = reactive({});

  #snapshot: ShallowRef<ConsentSnapshot>;
  #open = ref(false);
  #categories: ComputedRef<CategoryState[]>;

  constructor(options: ZesteOptions<M>) {
    // Used as is in templates and provide/inject: never wrapped in a reactive proxy.
    markRaw(this);
    this.manager = createConsent(options);
    // `M` is `ZesteMessages` when no messages are provided: the English default fits.
    this.messages = options.messages ?? (defaultMessages as M);
    this.guard = options.guard ?? DEV;
    this.actions = {
      acceptAll: action('acceptAll', this.acceptAll),
      denyAll: action('denyAll', this.denyAll),
      openPreferences: action('openPreferences', this.openPreferences),
      savePreferences: action('savePreferences', this.savePreferences),
      closePreferences: action('closePreferences', this.closePreferences),
    };
    this.#snapshot = shallowRef(this.manager.getSnapshot());
    this.manager.subscribe((snapshot) => {
      this.#snapshot.value = snapshot;
    });
    this.#categories = computed(() => {
      const groups = new Map<string, ServiceState[]>();
      for (const service of this.#snapshot.value.services) {
        if (!service.needsConsent) continue;
        groups.set(service.category, [...(groups.get(service.category) ?? []), service]);
      }
      return [...groups].map(([key, services]) => {
        const statuses = new Set(services.map((s) => s.status));
        return { key, services, status: statuses.size === 1 ? [...statuses][0]! : 'mixed' };
      });
    });
  }

  get services(): readonly ServiceState[] {
    return this.#snapshot.value.services;
  }

  /** Services grouped by category, ignoring those exempt from consent. */
  get categories(): CategoryState[] {
    return this.#categories.value;
  }

  /** Services exempt from consent (to mention for transparency). */
  get exempt(): readonly ServiceState[] {
    return this.#snapshot.value.services.filter((s) => !s.needsConsent);
  }

  /** Whether the user has decided on every service. */
  get decided(): boolean {
    return this.#snapshot.value.decided;
  }

  /** Whether the banner should be shown. */
  get showBanner(): boolean {
    return !this.#snapshot.value.decided;
  }

  /** An already-loaded script was refused: offer to reload the page. */
  get needsReload(): boolean {
    return this.#snapshot.value.needsReload;
  }

  /** Whether the preferences window is open: `v-model:open="zeste.preferencesOpen"` on your Dialog. */
  get preferencesOpen(): boolean {
    return this.#open.value;
  }

  set preferencesOpen(open: boolean) {
    this.setPreferencesOpen(open);
  }

  has = (key: string): boolean => this.#snapshot.value.status[key] === 'granted';

  statusOf = (key: string): ConsentStatus | undefined => this.#snapshot.value.status[key];

  grant = (key: string): void => this.manager.grant(key);

  deny = (key: string): void => this.manager.deny(key);

  setCategory = (category: string, granted: boolean): void => this.manager.setCategory(category, granted);

  acceptAll = (): void => {
    this.manager.grantAll();
    this.#open.value = false;
  };

  denyAll = (): void => {
    this.manager.denyAll();
    this.#open.value = false;
  };

  /** Opens the preferences with the current choices (undecided = refused: no pre-checked box). */
  openPreferences = (): void => {
    for (const key of Object.keys(this.draft)) delete this.draft[key];
    for (const s of this.#snapshot.value.services) {
      if (s.needsConsent) this.draft[s.key] = s.status === 'granted';
    }
    this.#open.value = true;
  };

  closePreferences = (): void => {
    this.#open.value = false;
  };

  /** For dialogs that emit their state: `@update:open="zeste.setPreferencesOpen"`. */
  setPreferencesOpen = (open: boolean): void => (open ? this.openPreferences() : this.closePreferences());

  /** Checks / unchecks every service of a category in the draft. */
  draftCategory = (category: string, granted: boolean): void => {
    for (const s of this.#snapshot.value.services) {
      if (s.category === category && s.needsConsent) this.draft[s.key] = granted;
    }
  };

  /** Applies the draft and closes the preferences. */
  savePreferences = (): void => {
    this.manager.set({ ...this.draft });
    this.#open.value = false;
  };

  /** Client-side: reads the cookie, runs the services. Called by `<ZesteProvider>`. */
  start = (): void => this.manager.start();

  destroy = (): void => this.manager.destroy();
}

function action(name: ConsentAction, run: () => void): ActionProps {
  return { onClick: () => run(), [ACTION_ATTRIBUTE]: name };
}

export function createZeste<M extends ZesteMessages = ZesteMessages>(options: ZesteOptions<M>): Zeste<M> {
  return new Zeste(options);
}
