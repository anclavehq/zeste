/*
 * Headless banner: only rendered if the visitor has not chosen yet (including during server rendering).
 * The content and style are yours; bind the actions on your buttons:
 * <Button v-bind="zeste.actions.denyAll">…</Button>
 */
import { defineComponent, h, ref, watch } from 'vue';
import { auditBanner, reportIssues, whenSettled } from '@zeste/core';
import { useZeste } from './context.ts';

export const ConsentBanner = defineComponent({
  name: 'ConsentBanner',
  setup(_, { slots }) {
    const zeste = useZeste();
    const element = ref<HTMLElement>();

    // compliance guard: audits the real render, once layout is done and animations have finished.
    watch(element, (banner, _, onCleanup) => {
      if (!zeste.guard || !banner) return;
      let cancelled = false;
      requestAnimationFrame(() =>
        requestAnimationFrame(async () => {
          await whenSettled(banner);
          if (!cancelled && banner.isConnected) reportIssues(auditBanner(banner));
        }),
      );
      onCleanup(() => {
        cancelled = true;
      });
    });

    // Attributes passed to the component (class, aria-label…) fall through onto the <section>.
    return () =>
      zeste.showBanner
        ? h('section', { ref: element, 'aria-label': 'Cookies', 'data-zeste-banner': '' }, slots.default?.())
        : null;
  },
});
