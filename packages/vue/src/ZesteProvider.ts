import { defineComponent, onBeforeUnmount, onMounted, watchEffect, type PropType } from 'vue';
import { auditReopen, reportIssues, type ZesteMessages } from '@zeste/core';
import { provideZeste } from './context.ts';
import type { Zeste } from './zeste.ts';

/** Provides the zeste instance to its descendants and starts the engine in the browser. */
export const ZesteProvider = defineComponent({
  name: 'ZesteProvider',
  props: {
    zeste: { type: Object as PropType<Zeste<ZesteMessages>>, required: true },
  },
  setup(props, { slots }) {
    // The instance is fixed at creation: changing it would lose the consent state.
    const zeste = props.zeste;
    provideZeste(zeste);

    onMounted(zeste.start);
    onBeforeUnmount(zeste.destroy);

    // compliance guard: once the choice is made, a button must allow changing it.
    onMounted(() =>
      watchEffect((onCleanup) => {
        if (!zeste.guard || !zeste.decided) return;
        const timer = setTimeout(() => reportIssues(auditReopen()), 1000);
        onCleanup(() => clearTimeout(timer));
      }),
    );

    return () => slots.default?.();
  },
});
