import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { detect, init } from '../src/init.ts';

const fixture = join(import.meta.dirname, 'fixtures/legacy-site');

function project(files: Record<string, string>) {
  const cwd = mkdtempSync(join(tmpdir(), 'zeste-init-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(cwd, path, '..'), { recursive: true });
    writeFileSync(join(cwd, path), content);
  }
  return cwd;
}

describe('zeste init on a site using tarteaucitron', () => {
  const result = detect(fixture);
  const service = (key: string) => result.services.find((s) => s.key === key);

  it('takes over the tarteaucitron jobs and their options', () => {
    expect(result.services.map((s) => s.key)).toEqual(['facebookpixel', 'gtag', 'hotjar', 'matomocloud', 'youtube']);
    expect(service('gtag')).toMatchObject({ options: { gtagUa: 'G-ABC123XYZ' }, code: ['gtagMore'], missing: [] });
    expect(service('matomocloud')?.options).toEqual({ matomoId: 12, matomoHost: 'https://monsite.matomo.cloud/' });
  });

  it('reads the ids of the snippets pasted in the pages', () => {
    expect(service('hotjar')?.options).toEqual({ hotjarId: '3456789' });
    expect(service('facebookpixel')?.options).toEqual({ facebookpixelId: '1234567890123456' });
  });

  it('ignores commented-out code', () => {
    expect(service('facebook')).toBeUndefined(); // job commented out
    expect(result.cookieDomain).toBe('.monsite.fr'); // not the commented ".old-domain.fr"
    expect(result.services.some((s) => s.options.gtagUa === 'G-OLDOLDOLD')).toBe(false);
    expect(service('facebookpixel')?.found).toEqual([{ file: 'templates/footer.php', line: 18 }]);
  });

  it('says what to remove, what to wrap and what to keep', () => {
    expect(result.remove.map((f) => `${f.file}:${f.line}`)).toEqual([
      'templates/footer.php:10',
      'templates/footer.php:18',
      'templates/header.php:6',
    ]);
    expect(result.embeds.map((f) => `${f.file}:${f.line}`)).toEqual(['templates/video.php:3']);
    expect(result.unknown.map((f) => f.message)).toEqual([expect.stringContaining('"monwidgetmaison"')]);
    expect(result).toMatchObject({ cookieName: 'monsite_rgpd', googleConsentMode: true });
  });
});

describe('zeste init, generated file', () => {
  // Written inside the package, so that its import of @zeste/services resolves like in a real project.
  const out = join(import.meta.dirname, '.generated');
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  it('runs: the declared services, with their options', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'zeste-init-'));
    cpSync(fixture, cwd, { recursive: true });
    const result = init({ cwd });
    expect(result).toMatchObject({ file: 'lib/consent.ts', written: true });
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'consent.ts'), readFileSync(join(cwd, result.file), 'utf8'));
    const { services } = await import(join(out, 'consent.ts'));
    const list = services();
    expect(list.map((s: { key: string }) => s.key)).toEqual(['facebookpixel', 'gtag', 'hotjar', 'matomocloud', 'youtube']);
    expect(list.every((s: { needsConsent: boolean }) => s.needsConsent)).toBe(true);
  });

  it('never overwrites an existing file without --force', () => {
    const cwd = project({ 'src/lib/consent.ts': 'mine', 'src/app.html': '<iframe src="https://player.vimeo.com/video/1"></iframe>' });
    expect(init({ cwd }).written).toBe(false);
    expect(readFileSync(join(cwd, 'src/lib/consent.ts'), 'utf8')).toBe('mine');
    expect(init({ cwd, force: true }).written).toBe(true);
    expect(readFileSync(join(cwd, 'src/lib/consent.ts'), 'utf8')).toContain('vimeo()');
  });
});

describe('zeste init, snippets', () => {
  it('GA4 and Google Ads from gtag.js, Tag Manager, self-hosted Matomo, maps and videos', () => {
    const cwd = project({
      'index.html': `<script async src="https://www.googletagmanager.com/gtag/js?id=G-XYZ987"></script>
<script>gtag('config', 'G-XYZ987');</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-123456"></script>
<script>(function(w,d,s,l,i){j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;})(window,document,'script','dataLayer','GTM-AB12CD');</script>
<script>var _paq = window._paq = window._paq || [];
  (function() { var u="https://stats.example.org/";
    _paq.push(['setTrackerUrl', u+'matomo.php']); _paq.push(['setSiteId', '3']); })();</script>
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaKey-1&callback=init"></script>
<iframe src="https://player.vimeo.com/video/76979871"></iframe>`,
    });
    const { services, embeds } = detect(cwd);
    expect(Object.fromEntries(services.map((s) => [s.key, s.options]))).toEqual({
      googleads: { googleadsId: 'AW-123456' },
      googlemaps: { googlemapsKey: 'AIzaKey-1' },
      googletagmanager: { googletagmanagerId: 'GTM-AB12CD' },
      gtag: { gtagUa: 'G-XYZ987' },
      matomo: { matomoId: '3', matomoHost: 'https://stats.example.org/' },
      vimeo: {},
    });
    expect(embeds.map((e) => e.message)).toEqual([expect.stringContaining('<ConsentGate service="vimeo">')]);
  });

  it('never reads dependencies or build output', () => {
    const cwd = project({
      'node_modules/some-lib/index.js': "fbq('init', '999');",
      '.svelte-kit/output/app.js': "fbq('init', '999');",
      'dist/app.js': "fbq('init', '999');",
    });
    expect(detect(cwd).services).toEqual([]);
  });

  it('a required option not found is left to fill in', () => {
    const { services } = detect(project({ 'a.js': "(tarteaucitron.job = tarteaucitron.job || []).push('gtag');" }));
    expect(services[0]).toMatchObject({ key: 'gtag', missing: ['gtagUa'] });
  });
});
