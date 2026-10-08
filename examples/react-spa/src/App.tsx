import { useState } from 'react';
import { ConsentGate, createZeste, ZesteProvider } from '@zeste/react';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/fr';
import { services } from './consent.ts';
import { Banner } from './Banner.tsx';
import { Preferences } from './Preferences.tsx';

export function App() {
  // No server: the choice is read from the cookie in the browser.
  const [zeste] = useState(() =>
    createZeste({
      services: services(),
      plugins: [googleConsentMode()],
      messages,
      // compliance guard: active in dev by default; forced here for the demo and the e2e tests.
      guard: true,
    }),
  );
  const [showSecond, setShowSecond] = useState(false);

  return (
    <ZesteProvider zeste={zeste}>
      <nav>
        <button type="button" {...zeste.actions.openPreferences}>
          {zeste.messages.alertSmall}
        </button>
      </nav>
      <main>
        <h1>zeste + React</h1>

        <ConsentGate
          service="youtube"
          embed={{ videoID: 'dQw4w9WgXcQ', width: 560, height: 315 }}
          data-testid="video-1"
          placeholder={({ service, allow }) => (
            <div className="placeholder" data-testid="video-1-placeholder">
              <p>Cette vidéo est hébergée par {service.name}.</p>
              <button type="button" onClick={allow}>
                Voir la vidéo
              </button>
            </div>
          )}
        />

        <p>
          <button type="button" onClick={() => setShowSecond(!showSecond)}>
            Afficher une 2ᵉ vidéo
          </button>
        </p>

        {showSecond && <ConsentGate service="youtube" embed={{ videoID: 'jNQXAC9IVRw' }} data-testid="video-2" />}
      </main>
      <Banner />
      <Preferences />
    </ZesteProvider>
  );
}
