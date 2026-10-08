'use client';

import { ConsentGate } from '@zeste/react';
import { Placeholder } from '../Placeholder.tsx';

export default function Other() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Autre page</h1>
      <ConsentGate
        service="youtube"
        embed={{ videoID: 'jNQXAC9IVRw' }}
        data-testid="video-other"
        placeholder={(props) => <Placeholder {...props} />}
      />
    </>
  );
}
