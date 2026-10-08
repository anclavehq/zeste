/**
 * Texts used by zeste itself (default placeholders).
 * The `@zeste/services/i18n/<language>` modules provide them in 36 languages.
 */
export interface ZesteMessages {
  /** Placeholder button, e.g. "Allow". */
  allow: string;
  /** Text following the service name in the placeholder, e.g. "is disabled.". */
  fallback: string;
}

/** English values from tarteaucitron (`lang/tarteaucitron.en.js`), used by default. */
export const defaultMessages: ZesteMessages = {
  allow: 'Allow',
  fallback: 'is disabled.',
};
