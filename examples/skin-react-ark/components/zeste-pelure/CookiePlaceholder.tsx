'use client';

/*
 * Placeholder for blocked content (video, map…), "pelure" style — pass it to <ConsentGate>:
 * <ConsentGate service="youtube" embed={…} placeholder={(props) => <CookiePlaceholder {...props} />} />
 */
import { useZeste, type PlaceholderProps } from '@zeste/react';
import type { Messages } from '@zeste/services/i18n/types';
import './theme.css';

export function CookiePlaceholder({ service, allow }: PlaceholderProps) {
  const t = useZeste<Messages>().messages;

  return (
    <div data-zeste-skin="pelure" className="grid aspect-video w-full max-w-xl place-items-center rounded-[14px] bg-(--zeste-ink) p-6">
      <div className="grid justify-items-center gap-3 rounded-[10px] border-[2.5px] border-(--zeste-ink) bg-(--zeste-paper) px-5 py-4 text-center text-(--zeste-ink) shadow-[5px_5px_0_var(--zeste-card)]">
        <p className="text-sm font-semibold">
          {service.name} {t.fallback}
        </p>
        <button
          type="button"
          onClick={allow}
          className="inline-flex items-center justify-center rounded-[10px] border-[2.5px] border-(--zeste-ink) bg-(--zeste-card) px-[18px] py-2.5 text-sm font-bold text-(--zeste-ink) shadow-[4px_4px_0_var(--zeste-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--zeste-ink)] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-(--zeste-card)"
        >
          {t.allow} {service.name}
        </button>
      </div>
    </div>
  );
}
