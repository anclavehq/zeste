'use client';

/*
 * Placeholder for blocked content (video, map…), "zeste" style — pass it to <ConsentGate>:
 * <ConsentGate service="youtube" embed={…} placeholder={(props) => <CookiePlaceholder {...props} />} />
 */
import { useZeste, type PlaceholderProps } from '@zeste/react';
import type { Messages } from '@zeste/services/i18n/types';
import { Button } from '%UI%/button';

/* Citrus slice in the background, in the theme's primary color */
const sunburst = {
  background:
    'repeating-conic-gradient(from 0deg at 50% 50%, color-mix(in oklab, var(--primary) 22%, var(--background)) 0 10deg, color-mix(in oklab, var(--primary) 8%, var(--background)) 10deg 20deg)',
};

export function CookiePlaceholder({ service, allow }: PlaceholderProps) {
  const t = useZeste<Messages>().messages;

  return (
    <div style={sunburst} className="grid aspect-video w-full max-w-xl place-items-center rounded-2xl p-6">
      <div className="bg-popover text-popover-foreground grid justify-items-center gap-3 rounded-xl px-5 py-4 text-center shadow-lg">
        <p className="text-sm">
          {service.name} {t.fallback}
        </p>
        <Button onClick={allow}>
          {t.allow} {service.name}
        </Button>
      </div>
    </div>
  );
}
