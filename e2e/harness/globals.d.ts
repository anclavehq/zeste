import type { ConsentManager } from '@zeste/core';

// What the harnesses expose to the Playwright tests, and the globals set by third-party tags.
declare global {
  interface Window {
    /** `catalog.html` harness */
    __catalog?: { consent: ConsentManager; errors: string[]; probe: () => string };
    /** `client.html` harness */
    __zeste?: { consent: ConsentManager };
    __bannerSeen?: boolean;
    __sameDocument?: boolean;
    dataLayer?: unknown[];
    _paq?: unknown[];
    _mtm?: unknown[];
    _gaq?: unknown[];
  }
}

export {};
