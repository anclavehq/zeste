'use client';

import { useState } from 'react';
import { ConsentGate } from '@zeste/react';
import { Placeholder } from './Placeholder.tsx';

export default function Home() {
  const [showSecond, setShowSecond] = useState(false);

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">zeste + Tailwind</h1>

      <ConsentGate
        service="youtube"
        embed={{ videoID: 'dQw4w9WgXcQ', width: 560, height: 315 }}
        data-testid="video-1"
        placeholder={(props) => <Placeholder {...props} />}
      />

      <p className="my-4">
        <button type="button" className="underline underline-offset-2" onClick={() => setShowSecond(!showSecond)}>
          Afficher une 2ᵉ vidéo
        </button>
      </p>

      {showSecond && (
        <ConsentGate
          service="youtube"
          embed={{ videoID: 'jNQXAC9IVRw' }}
          data-testid="video-2"
          placeholder={(props) => <Placeholder {...props} />}
        />
      )}
    </>
  );
}
