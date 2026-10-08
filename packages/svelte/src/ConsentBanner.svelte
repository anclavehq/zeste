<!--
  Headless banner: only rendered if the visitor has not chosen yet (including during server rendering).
  The content and style are yours; attach the actions to your buttons:
  <Button {@attach zeste.actions.denyAll}>…</Button>
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { auditBanner, reportIssues, whenSettled } from '@zeste/core';
  import { getZeste } from './context.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    children: Snippet;
  }

  let { children, ...rest }: Props = $props();

  const zeste = getZeste();
  let element = $state<HTMLElement>();

  // compliance guard: audits the real render, once layout is done and animations have finished.
  $effect(() => {
    if (!zeste.guard || !element) return;
    const banner = element;
    let cancelled = false;
    requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        await whenSettled(banner);
        if (!cancelled && banner.isConnected) reportIssues(auditBanner(banner));
      }),
    );
    return () => {
      cancelled = true;
    };
  });
</script>

{#if zeste.showBanner}
  <section bind:this={element} aria-label="Cookies" {...rest} data-zeste-banner>
    {@render children()}
  </section>
{/if}
