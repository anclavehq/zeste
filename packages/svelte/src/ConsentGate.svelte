<!--
  Shows third-party content only if the service is accepted, otherwise a placeholder.

  Two uses:
  - catalog service (YouTube, Vimeo, Maps…): pass `embed`, zeste renders the iframe;
  - your own content: pass `children`, rendered as is once the service is accepted.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { ServiceState } from '@zeste/core';
  import { getZeste } from './context.ts';

  export interface PlaceholderProps {
    service: ServiceState;
    /** Accepts this service only. */
    allow: () => void;
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'placeholder'> {
    /** Service key, e.g. `youtube`. */
    service: string;
    /** Embed parameters, e.g. `{ videoID: 'dQw4w9WgXcQ', width: 560 }`. */
    embed?: Record<string, string | number | boolean>;
    /** tarteaucitron embed class, if the service has several (e.g. `fb-post`). */
    embedClass?: string;
    /** Content shown once the service is accepted (instead of the catalog embed). */
    children?: Snippet;
    /** Shown while the service is not accepted. */
    placeholder?: Snippet<[PlaceholderProps]>;
  }

  let { service, embed, embedClass, children, placeholder, class: className, ...rest }: Props = $props();

  const zeste = getZeste();
  const info = $derived(zeste.services.find((s) => s.key === service));
  const granted = $derived(zeste.has(service));
  const targetClass = $derived(embedClass ?? info?.embedClasses?.[0]);
  const dataAttributes = $derived(
    Object.fromEntries(Object.entries(embed ?? {}).map(([key, value]) => [`data-${key}`, String(value)])),
  );

  let element = $state<HTMLDivElement>();

  // The service fills the element once mounted; already-rendered embeds are left untouched.
  $effect(() => {
    if (granted && element) zeste.manager.rescan(service);
  });

  $effect(() => {
    if (!info) console.warn(`[zeste] <ConsentGate service="${service}"> : service not declared in createZeste().`);
    else if (!children && !targetClass) {
      console.warn(`[zeste] <ConsentGate service="${service}"> : this service has no embed, pass content (children).`);
    }
  });

  const allow = () => zeste.grant(service);
</script>

{#if info}
  {#if granted}
    {#if children}
      {@render children()}
    {:else if targetClass}
      <div bind:this={element} {...rest} {...dataAttributes} class={[targetClass, className]}></div>
    {/if}
  {:else if placeholder}
    {@render placeholder({ service: info, allow })}
  {:else}
    <div {...rest} class={['zeste-placeholder', className]} data-zeste-service={service}>
      <!-- Same text as tarteaucitron: "YouTube is disabled." + "Allow" -->
      <p>{info.name} {zeste.messages.fallback}</p>
      <button type="button" onclick={allow}>{zeste.messages.allow} {info.name}</button>
    </div>
  {/if}
{/if}
