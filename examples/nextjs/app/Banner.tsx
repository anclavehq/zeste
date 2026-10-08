'use client';

import { ConsentBanner, useZeste } from '@zeste/react';
import type { Messages } from '@zeste/services/i18n/types';

export function Banner() {
  const zeste = useZeste<Messages>();
  const t = zeste.messages;

  return (
    <>
      {zeste.needsReload && (
        <div className="reload" role="status">
          Vos choix seront entièrement appliqués après rechargement.
          <button type="button" onClick={() => location.reload()}>
            {t.reload}
          </button>
        </div>
      )}

      {/* ConsentBanner is only rendered if the visitor has not chosen yet */}
      <ConsentBanner className="zeste-banner" aria-label={t.icon} data-testid="banner">
        <p>{t.alertBigPrivacy}</p>
        <div className="actions">
          {/* Same visual weight for refusing and accepting (EU consent guidance) */}
          <button type="button" {...zeste.actions.denyAll}>
            {t.denyAll}
          </button>
          <button type="button" {...zeste.actions.openPreferences}>
            {t.personalize}
          </button>
          <button type="button" {...zeste.actions.acceptAll}>
            {t.acceptAll}
          </button>
        </div>
      </ConsentBanner>
    </>
  );
}
