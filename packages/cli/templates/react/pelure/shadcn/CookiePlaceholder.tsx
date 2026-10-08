'use client';

/*
 * Placeholder for blocked content (video, map…), "pelure" style — pass it to <ConsentGate>:
 * <ConsentGate service="youtube" embed={…} placeholder={(props) => <CookiePlaceholder {...props} />} />
 */
import { useZeste, type PlaceholderProps } from '@zeste/react';
import type { Messages } from '@zeste/services/i18n/types';
import { Button } from '%UI%/button';

export function CookiePlaceholder({ service, allow }: PlaceholderProps) {
  const t = useZeste<Messages>().messages;

  return (
    // foreground = black in light mode; in dark mode switch to the card color to avoid a white block
    <div className="bg-foreground dark:bg-card grid aspect-video w-full max-w-xl place-items-center rounded-[14px] p-6">
      <div className="bg-background text-foreground border-background grid justify-items-center gap-3 rounded-[10px] border-[2.5px] px-5 py-4 text-center shadow-[5px_5px_0_var(--primary)]">
        <p className="text-sm font-semibold">
          {service.name} {t.fallback}
        </p>
        <Button
          variant="secondary"
          className="border-foreground h-auto rounded-[10px] border-[2.5px] px-[18px] py-2.5 font-bold shadow-[4px_4px_0_var(--foreground)]"
          onClick={allow}
        >
          {t.allow} {service.name}
        </Button>
      </div>
    </div>
  );
}
