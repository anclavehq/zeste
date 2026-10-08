import { ConsentGate } from '@zeste/react';

export default function Other() {
  return (
    <>
      <h1>Autre page</h1>
      <ConsentGate service="youtube" embed={{ videoID: 'jNQXAC9IVRw' }} data-testid="video-other" />
    </>
  );
}
