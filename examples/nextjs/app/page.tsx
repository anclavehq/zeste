'use client';

import { useState } from 'react';
import { ConsentGate } from '@zeste/react';

export default function Home() {
  const [showSecond, setShowSecond] = useState(false);

  return (
    <>
      <h1>zeste + Next.js</h1>

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
    </>
  );
}
