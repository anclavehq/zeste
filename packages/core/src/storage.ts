import type { ConsentStorage } from './types.ts';

/**
 * tarteaucitron cookie format: `tarteaucitron=!gtag=true!youtube=false`.
 * Kept as is: a site migrating from tarteaucitron retains the choices its
 * visitors already made, without asking for consent again.
 */
export function parseConsentCookie(value: string | undefined | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!value) return result;
  for (const part of decodeURIComponent(value).split('!')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    result[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return result;
}

export function serializeConsentCookie(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([key, value]) => `!${key}=${value}`)
    .join('');
}

/** Extracts a cookie value from `document.cookie` or a `Cookie` header. */
export function readCookie(cookieHeader: string, name: string): string | undefined {
  for (const chunk of cookieHeader.split(';')) {
    const trimmed = chunk.trim();
    if (trimmed.startsWith(name + '=')) return trimmed.slice(name.length + 1);
  }
  return undefined;
}

export interface CookieStorageOptions {
  /** `tarteaucitron` by default, for compatibility. */
  name?: string;
  /** 395 days (about 13 months, the maximum recommended by the CNIL in France). */
  expiresInDays?: number;
  /** E.g. `.example.com` to share the choice across subdomains. */
  domain?: string;
}

export function cookieStorage(options: CookieStorageOptions = {}): ConsentStorage {
  const { name = 'tarteaucitron', expiresInDays = 395, domain } = options;
  return {
    read() {
      if (typeof document === 'undefined') return {};
      return parseConsentCookie(readCookie(document.cookie, name));
    },
    write(values) {
      if (typeof document === 'undefined') return;
      const expires = new Date(Date.now() + expiresInDays * 86_400_000).toUTCString();
      const secure = location.protocol === 'https:' ? '; Secure' : '';
      const domainAttr = domain ? `; domain=${domain}` : '';
      document.cookie = `${name}=${serializeConsentCookie(values)}; expires=${expires}; path=/${domainAttr}${secure}; samesite=lax`;
    },
  };
}

export function memoryStorage(initial: Record<string, string> = {}): ConsentStorage {
  let values = { ...initial };
  return {
    read: () => ({ ...values }),
    write: (next) => {
      values = { ...next };
    },
  };
}

/** Deletes a cookie on the current domain and its parent domains. */
export function purgeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  const expired = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  document.cookie = expired;
  const parts = location.hostname.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    document.cookie = `${expired}; domain=.${parts.slice(i).join('.')}`;
  }
}
