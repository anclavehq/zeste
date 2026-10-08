'use client';

/*
 * Placeholder for blocked content (video, map…), "zeste" style — pass it to <ConsentGate>:
 * <ConsentGate service="youtube" embed={…} placeholder={(props) => <CookiePlaceholder {...props} />} />
 */
import { useZeste, type PlaceholderProps } from '@zeste/react';
import type { Messages } from '@zeste/services/i18n/types';
import './theme.css';

/* Citrus slice in the background */
const sunburst = {
  background:
    'repeating-conic-gradient(from 0deg at 50% 50%, var(--zeste-accent) 0 10deg, color-mix(in srgb, var(--zeste-accent) 55%, var(--zeste-paper)) 10deg 20deg)',
};

export function CookiePlaceholder({ service, allow }: PlaceholderProps) {
  const t = useZeste<Messages>().messages;

  return (
    <div data-zeste-skin="zeste" style={sunburst} className="grid aspect-video w-full max-w-xl place-items-center rounded-2xl p-6">
      <div className="grid justify-items-center gap-3 rounded-[14px] bg-(--zeste-paper) px-5 py-4 text-center text-(--zeste-ink) shadow-[0_6px_24px_rgb(24_48_31/0.18)]">
        <p className="text-sm">
          {service.name} {t.fallback}
        </p>
        <button
          type="button"
          onClick={allow}
          className="inline-flex items-center justify-center rounded-full bg-(--zeste-ink) px-[18px] py-2.5 text-sm font-semibold text-(--zeste-paper) transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--zeste-ink)"
        >
          {t.allow} {service.name}
        </button>
      </div>
    </div>
  );
}
