/**
 * compliance guard: audits the banner as actually rendered, whatever the design system.
 *
 * Elements are located through attributes set by the zeste primitives:
 * - `data-zeste-banner` on the banner;
 * - `data-zeste-action="acceptAll" | "denyAll" | "openPreferences" | …` on the buttons.
 *
 * Rules: ePrivacy Directive art. 5(3), GDPR, EDPB guidance on cookie banners (refusing must be as easy as
 * accepting). Reference below: the CNIL (France) guidelines on "cookies and other trackers" (2020).
 */

export const CNIL_GUIDELINES_URL =
  'https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/lignes-directrices-et-recommandation';

export type ConsentAction = 'acceptAll' | 'denyAll' | 'openPreferences' | 'savePreferences' | 'closePreferences';

export interface ComplianceIssue {
  id: 'no-deny-all' | 'deny-hidden' | 'deny-smaller' | 'deny-low-contrast' | 'no-reopen';
  message: string;
  element?: Element;
}

export const ACTION_ATTRIBUTE = 'data-zeste-action';
export const BANNER_ATTRIBUTE = 'data-zeste-banner';

type Rgba = [r: number, g: number, b: number, a: number];

let canvas: CanvasRenderingContext2D | null | undefined;

/** Lets the browser convert any CSS color (oklch, oklab, hsl, color()…) to RGBA. */
function viaCanvas(value: string): Rgba | undefined {
  if (canvas === undefined) {
    canvas = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  }
  if (!canvas) return undefined;
  canvas.fillStyle = '#010203'; // sentinel: an invalid color leaves fillStyle unchanged
  canvas.fillStyle = value;
  if (canvas.fillStyle === '#010203') return undefined;
  canvas.clearRect(0, 0, 1, 1);
  canvas.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 0] = canvas.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

/**
 * Computed CSS color to RGBA components. `rgb()` is parsed directly; other formats
 * (Tailwind v4 emits `oklch()`) go through the browser. `undefined` if unreadable.
 */
export function parseColor(value: string): Rgba | undefined {
  const match = /^rgba?\(([^)]+)\)$/.exec(value.trim());
  if (!match) return viaCanvas(value);
  const parts = match[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return undefined;
  const [r, g, b, a = 1] = parts as [number, number, number, number?];
  return [r, g, b, a];
}

function luminance([r, g, b]: Rgba): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two opaque colors (1 to 21). */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Background actually visible behind an element: first ancestor with an opaque background, white otherwise. */
function backgroundOf(element: Element): Rgba {
  for (let el: Element | null = element; el; el = el.parentElement) {
    const color = parseColor(getComputedStyle(el).backgroundColor);
    if (color && color[3] > 0.5) return color;
  }
  return [255, 255, 255, 1];
}

function isVisible(element: Element): boolean {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity) > 0.1 &&
    rect.width > 1 &&
    rect.height > 1
  );
}

function measure(element: Element) {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const color = parseColor(style.color) ?? [0, 0, 0, 1];
  return {
    area: rect.width * rect.height,
    fontSize: parseFloat(style.fontSize) || 16,
    contrast: contrastRatio(color, backgroundOf(element)),
  };
}

const action = (root: ParentNode, name: ConsentAction) =>
  root.querySelector(`[${ACTION_ATTRIBUTE}="${name}"]`) ?? undefined;

/**
 * Audits the displayed banner: refusing must be as easy and as visible as accepting.
 * Call it once the banner is rendered (after layout).
 *
 * `buttons` points at the buttons directly, without zeste attributes (e.g. an audit tool checking another CMP).
 */
export function auditBanner(banner: Element, buttons?: { deny?: Element; accept?: Element }): ComplianceIssue[] {
  const deny = buttons ? buttons.deny : action(banner, 'denyAll');
  const accept = buttons ? buttons.accept : action(banner, 'acceptAll');

  if (!deny) {
    return [
      {
        id: 'no-deny-all',
        message:
          'The banner has no "Deny all" button. Refusing must be as easy as accepting, from the first layer.',
        element: banner,
      },
    ];
  }
  if (!isVisible(deny)) {
    return [{ id: 'deny-hidden', message: 'The "Deny all" button is present but invisible.', element: deny }];
  }
  if (!accept || !isVisible(accept)) return [];

  const issues: ComplianceIssue[] = [];
  const d = measure(deny);
  const a = measure(accept);
  if (d.area < a.area * 0.5 || d.fontSize < a.fontSize * 0.85) {
    issues.push({
      id: 'deny-smaller',
      message: `"Deny all" is much smaller than "Accept all" (area ${Math.round(
        (d.area / a.area) * 100,
      )}%, text ${d.fontSize}px vs ${a.fontSize}px). Both choices must be equally prominent.`,
      element: deny,
    });
  }
  if (d.contrast < 3 || d.contrast < a.contrast / 2) {
    issues.push({
      id: 'deny-low-contrast',
      message: `"Deny all" is hard to read (contrast ${d.contrast.toFixed(1)}:1 vs ${a.contrast.toFixed(
        1,
      )}:1 for "Accept all"). Both choices must be equally visible.`,
      element: deny,
    });
  }
  return issues;
}

/** Once a choice is made, it must stay possible to change it at any time (permanent link). */
export function auditReopen(root: ParentNode = document): ComplianceIssue[] {
  if (action(root, 'openPreferences')) return [];
  return [
    {
      id: 'no-reopen',
      message:
        'No button to reopen the preferences once the banner is closed. Withdrawing consent must remain possible at any time (e.g. a "Cookie settings" link in the footer).',
    },
  ];
}

/**
 * Waits for animations and transitions on an element and its descendants to finish
 * (fading banner, buttons with `transition`…) so the final render is measured.
 * Capped: an infinite animation does not block the audit.
 */
export async function whenSettled(element: Element, timeoutMs = 2000): Promise<void> {
  const animations = typeof element.getAnimations === 'function' ? element.getAnimations({ subtree: true }) : [];
  await Promise.race([
    Promise.allSettled(animations.map((a) => a.finished)),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

const reported = new Set<string>();

/** Logs each problem once per page, along with the offending element. */
export function reportIssues(issues: ComplianceIssue[]): void {
  for (const issue of issues) {
    if (reported.has(issue.id)) continue;
    reported.add(issue.id);
    console.warn(`[zeste/consent] ${issue.message}\n→ ${CNIL_GUIDELINES_URL}`, ...(issue.element ? [issue.element] : []));
  }
}
