<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { auditReopen, reportIssues, type ZesteMessages } from '@zeste/core';
  import { setZeste } from './context.ts';
  import type { Zeste } from './zeste.svelte.ts';

  interface Props {
    zeste: Zeste<ZesteMessages>;
    children: Snippet;
  }

  let { zeste, children }: Props = $props();

  // The instance is fixed at creation: changing it would lose the consent state.
  // svelte-ignore state_referenced_locally
  setZeste(zeste);

  onMount(() => {
    zeste.start();
    return zeste.destroy;
  });

  // compliance guard: once the choice is made, a button must allow changing it.
  $effect(() => {
    if (!zeste.guard || !zeste.decided) return;
    const timer = setTimeout(() => reportIssues(auditReopen()), 1000);
    return () => clearTimeout(timer);
  });
</script>

{@render children()}
