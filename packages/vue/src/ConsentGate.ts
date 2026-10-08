/*
 * Shows third-party content only if the service is accepted, otherwise a placeholder.
 *
 * Two uses:
 * - catalog service (YouTube, Vimeo, Maps…): pass `embed`, zeste renders the iframe;
 * - your own content: pass it in the default slot, rendered as is once the service is accepted.
 */
import { computed, defineComponent, h, ref, watch, watchEffect, type PropType, type SlotsType, type VNodeChild } from 'vue';
import type { ServiceState } from '@zeste/core';
import { useZeste } from './context.ts';

export interface PlaceholderProps {
  service: ServiceState;
  /** Accepts this service only. */
  allow: () => void;
}

export const ConsentGate = defineComponent({
  name: 'ConsentGate',
  // Attributes go on the rendered element, not on slot content.
  inheritAttrs: false,
  props: {
    /** Service key, e.g. `youtube`. */
    service: { type: String, required: true },
    /** Embed parameters, e.g. `{ videoID: 'dQw4w9WgXcQ', width: 560 }`. */
    embed: Object as PropType<Record<string, string | number | boolean>>,
    /** tarteaucitron embed class, if the service has several (e.g. `fb-post`). */
    embedClass: String,
  },
  slots: Object as SlotsType<{
    /** Content shown once the service is accepted (instead of the catalog embed). */
    default?: () => VNodeChild;
    /** Shown while the service is not accepted. */
    placeholder?: (props: PlaceholderProps) => VNodeChild;
  }>,
  setup(props, { slots, attrs }) {
    const zeste = useZeste();
    const info = computed(() => zeste.services.find((s) => s.key === props.service));
    const granted = computed(() => zeste.has(props.service));
    const targetClass = computed(() => props.embedClass ?? info.value?.embedClasses?.[0]);
    const element = ref<HTMLDivElement>();

    // The service fills the element once mounted; already-rendered embeds are left untouched.
    watch(
      [granted, element],
      ([isGranted, el]) => {
        if (isGranted && el) zeste.manager.rescan(props.service);
      },
      { flush: 'post' },
    );

    watchEffect(() => {
      if (!info.value) console.warn(`[zeste] <ConsentGate service="${props.service}"> : service not declared in createZeste().`);
      else if (!slots.default && !targetClass.value) {
        console.warn(`[zeste] <ConsentGate service="${props.service}"> : this service has no embed, pass content (default slot).`);
      }
    });

    const allow = () => zeste.grant(props.service);

    return () => {
      const service = info.value;
      if (!service) return null;
      if (granted.value) {
        if (slots.default) return slots.default();
        if (!targetClass.value) return null;
        const data = Object.fromEntries(
          Object.entries(props.embed ?? {}).map(([key, value]) => [`data-${key}`, String(value)]),
        );
        // No children: the service owns this element's content.
        return h('div', { ...attrs, ...data, ref: element, class: [targetClass.value, attrs.class] });
      }
      if (slots.placeholder) return slots.placeholder({ service, allow });
      return h('div', { ...attrs, class: ['zeste-placeholder', attrs.class], 'data-zeste-service': props.service }, [
        // Same text as tarteaucitron: "YouTube is disabled." + "Allow"
        h('p', `${service.name} ${zeste.messages.fallback}`),
        h('button', { type: 'button', onClick: allow }, `${zeste.messages.allow} ${service.name}`),
      ]);
    };
  },
});
