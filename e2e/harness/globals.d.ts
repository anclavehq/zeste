import type { ConsentManager, ZesteManifest } from '@zeste/core';

// What the harnesses expose to the Playwright tests, and the globals set by third-party tags.
declare global {
  interface Window {
    /** `catalog.html` harness */
    __catalog?: { consent: ConsentManager; errors: string[]; probe: () => string };
    /** `real-network.html` harness */
    __zeste?: { consent: ConsentManager };
    /** Set by `start()`: the app is hydrated and the engine is running. */
    __zesteManifest?: ZesteManifest[];
    __bannerSeen?: boolean;
    __sameDocument?: boolean;
    dataLayer?: unknown[];
    _paq?: unknown[];
    _mtm?: unknown[];
    _gaq?: unknown[];
  }
}

export {};
