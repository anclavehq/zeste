export type ConsentStatus = 'unknown' | 'granted' | 'denied';

/** Context passed to a service's callbacks. */
export interface ServiceContext {
  consent: ConsentManager;
}

export interface ServiceDefinition {
  /** Unique identifier, e.g. `gtag`, `youtube`. Used as the key in the cookie. */
  key: string;
  name: string;
  /** Purpose: `analytic`, `ads`, `video`, `social`, `support`, `api`, `other`… */
  category: string;
  /** Link to the third party's privacy policy. */
  privacyUrl?: string;
  /** `false` = exempt service (e.g. audience measurement), granted by default. */
  needsConsent: boolean;
  /** Names of the cookies set, purged when consent is withdrawn. */
  cookies: string[];
  /**
   * "Embed" service (video, map, widget…): it acts on DOM elements
   * and can safely be replayed when new elements appear.
   */
  embed?: boolean;
  /** CSS classes of the elements the service fills (e.g. `youtube_player`), for the gate components. */
  embedClasses?: string[];
  /**
   * Loads the service code before `onGrant` / `onDeny` (dynamic import).
   * The fields above stay synchronous: usable on the server and in the UI.
   */
  load?(): Promise<void>;
  /**
   * `onDeny` may contact a third party (cookieless mode, advanced Consent Mode…).
   * It then only runs if `allowPreConsentRequests` allows it.
   */
  preConsentRequests?: boolean;
  /**
   * Hosts contacted that depend on the configuration (self-hosted Matomo, Plausible endpoint…).
   * Published in the page manifest so that audit tools recognize these domains.
   */
  endpoints?: string[];
  /** Called when consent is granted: loads the script, renders the iframe… */
  onGrant(ctx: ServiceContext): void;
  /** Called while consent is not granted: placeholder, degraded mode… */
  onDeny?(ctx: ServiceContext): void;
}

export interface ServiceState {
  key: string;
  name: string;
  category: string;
  embedClasses?: readonly string[];
  privacyUrl?: string;
  needsConsent: boolean;
  cookies: readonly string[];
  status: ConsentStatus;
}

/** Immutable snapshot of the state: recreated on every change. */
export interface ConsentSnapshot {
  services: readonly ServiceState[];
  status: Readonly<Record<string, ConsentStatus>>;
  /** `true` if the user has decided on every service that requires consent. */
  decided: boolean;
  /** An already-loaded script was refused: only a page reload really stops it. */
  needsReload: boolean;
}

export interface ConsentStorage {
  read(): Record<string, string>;
  write(values: Record<string, string>): void;
}

export interface ConsentPlugin {
  name: string;
  /** Called in `start()`, before the services run. */
  setup(manager: ConsentManager): void | (() => void);
}

export type Listener = (snapshot: ConsentSnapshot) => void;

/** What a visitor did: one of the banner buttons, the preferences, or a single service (placeholder). */
export type ConsentRecordAction = 'acceptAll' | 'denyAll' | 'set' | 'grant' | 'deny' | 'category';

/**
 * One choice made by the visitor, passed to `onRecord`: what the site needs to prove consent
 * (GDPR art. 7). Contains no personal data; sending and keeping it is up to the site.
 */
export interface ConsentRecord {
  /** Random identifier of this browser's consent, kept in the cookie: the same across later changes. */
  id: string;
  /** When the choice was made (ISO 8601). */
  date: string;
  action: ConsentRecordAction;
  /** State of every service that needs consent, after the choice: `true` accepted, `false` refused. */
  choices: Record<string, boolean>;
  /** The `policyVersion` the visitor answered, if the site uses one. */
  policyVersion?: string;
}

export interface ConsentManager {
  getSnapshot(): ConsentSnapshot;
  /**
   * Follows the Svelte store contract (immediate call + unsubscribe) and
   * also works with React's `useSyncExternalStore`.
   */
  subscribe(listener: Listener): () => void;
  has(key: string): boolean;
  grant(key: string): void;
  deny(key: string): void;
  grantAll(): void;
  denyAll(): void;
  setCategory(category: string, granted: boolean): void;
  /** Applies several choices at once (e.g. a "Customize" form). */
  set(choices: Record<string, boolean>): void;
  /** Client-side only: reads storage, installs plugins, runs the services. */
  start(): void;
  /**
   * Renders embed elements that appeared since (SPA navigation, mounted component…).
   * Already-rendered elements are left untouched. Without a key: all embed services.
   */
  rescan(key?: string): void;
  /** Resolves when all services currently loading / running have finished. */
  settled(): Promise<void>;
  destroy(): void;
}
