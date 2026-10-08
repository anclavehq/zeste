import { describe, expect, it } from 'vitest';
import { auditBanner, auditReopen, contrastRatio, parseColor } from '../src/compliance.ts';

describe('colors', () => {
  it('reads rgb() / rgba() / modern syntax formats', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual([255, 0, 0, 1]);
    expect(parseColor('rgba(0, 0, 0, 0.5)')).toEqual([0, 0, 0, 0.5]);
    expect(parseColor('rgb(10 20 30 / 0.2)')).toEqual([10, 20, 30, 0.2]);
    // other formats (oklch…) are converted by the browser: tested in /e2e
  });

  it('computes WCAG contrast', () => {
    expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21, 0);
    expect(contrastRatio([119, 119, 119, 1], [255, 255, 255, 1])).toBeCloseTo(4.48, 1);
  });
});

// Layout (size, real contrast) is verified in a real browser (e2e).
describe('audit (structure)', () => {
  it('flags a banner without "Deny all"', () => {
    document.body.innerHTML = '<div data-zeste-banner><button data-zeste-action="acceptAll">OK</button></div>';
    expect(auditBanner(document.querySelector('[data-zeste-banner]')!).map((i) => i.id)).toEqual(['no-deny-all']);
  });

  it('flags the lack of a link to reopen the preferences', () => {
    document.body.innerHTML = '<main></main>';
    expect(auditReopen().map((i) => i.id)).toEqual(['no-reopen']);
    document.body.innerHTML = '<footer><button data-zeste-action="openPreferences">Cookies</button></footer>';
    expect(auditReopen()).toEqual([]);
  });
});
