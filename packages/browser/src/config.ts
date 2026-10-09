/** What a page declares in `window.zesteConfig`, before the zeste script. */
export interface ZesteConfig {
  /** Services by catalog key, with their options: `{ gtag: { gtagUa: 'G-…' }, youtube: {} }`. */
  services?: Record<string, Record<string, unknown>>;
  /** Language code (`fr`, `de`…). By default, the page language, then the browser's. */
  language?: string;
  /** `zeste` (understated, lemon accent) or `pelure` (flat banner, thick outlines). */
  style?: 'zeste' | 'pelure';
  /**
   * `site` (default): dark when the page has the `dark` class or `data-theme="dark"` on <html>;
   * `system`: follows the visitor's system; `light` or `dark`: fixed.
   */
  theme?: 'site' | 'system' | 'light' | 'dark';
  /** Your privacy policy, linked from the banner. */
  privacyUrl?: string;
  /** `tarteaucitron` by default: visitors keep the choices made with tarteaucitron. */
  cookieName?: string;
  /** E.g. `.example.com` to share the choice across subdomains. */
  cookieDomain?: string;
  /** Changing it asks every visitor again (new services, new purposes). */
  policyVersion?: string;
  /** Google Consent Mode v2 for Google Analytics, Ads and Tag Manager. On by default. */
  googleConsentMode?: boolean;
  /**
   * Round button to reopen the preferences once the choice is made (required: changing one's mind must
   * stay possible). On by default; turn it off if the page has its own link to `#zeste`.
   */
  showIcon?: boolean;
  /** Address fragment that opens the preferences, `#zeste` by default (`#tarteaucitron` also works). */
  hashtag?: string;
  /** Services allowed to contact their third party before consent (cookieless modes). None by default. */
  allowPreConsentRequests?: boolean | string[];
  /** Console warnings when the banner breaks a measurable consent rule. */
  guard?: boolean;
}

declare global {
  interface Window {
    zesteConfig?: ZesteConfig;
  }
}
