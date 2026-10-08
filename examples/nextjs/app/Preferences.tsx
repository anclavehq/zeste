'use client';

import { useEffect, useRef } from 'react';
import { useZeste } from '@zeste/react';
import type { Messages } from '@zeste/services/i18n/types';

export function Preferences() {
  const zeste = useZeste<Messages>();
  const t = zeste.messages;
  const dialog = useRef<HTMLDialogElement>(null);

  // The native <dialog> follows `zeste.preferencesOpen` (including Escape / closing).
  useEffect(() => {
    if (zeste.preferencesOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!zeste.preferencesOpen && dialog.current?.open) dialog.current.close();
  }, [zeste.preferencesOpen]);

  return (
    <dialog ref={dialog} onClose={zeste.closePreferences} aria-labelledby="zeste-prefs-title">
      <h2 id="zeste-prefs-title">{t.title}</h2>
      <p className="details">{t.disclaimer}</p>

      {zeste.categories.map((category) => (
        <fieldset key={category.key}>
          <legend>{t.categories[category.key]?.title ?? category.key}</legend>
          <p className="details">{t.categories[category.key]?.details}</p>
          {category.services.map((service) => (
            <label key={service.key}>
              <input
                type="checkbox"
                name={service.key}
                checked={zeste.draft[service.key] ?? false}
                onChange={(event) => zeste.setDraft(service.key, event.target.checked)}
              />
              {service.name}
              {service.privacyUrl && (
                <a href={service.privacyUrl} target="_blank" rel="noreferrer">
                  {t.privacyUrl} {t.newWindow}
                </a>
              )}
            </label>
          ))}
        </fieldset>
      ))}

      {zeste.exempt.length > 0 && (
        <p className="details">
          {t.mandatoryTitle} : {zeste.exempt.map((s) => s.name).join(', ')}
        </p>
      )}

      <div className="actions">
        <button type="button" {...zeste.actions.denyAll}>
          {t.denyAll}
        </button>
        <button type="button" {...zeste.actions.acceptAll}>
          {t.acceptAll}
        </button>
        <button type="button" {...zeste.actions.savePreferences}>
          {t.save}
        </button>
      </div>
    </dialog>
  );
}
