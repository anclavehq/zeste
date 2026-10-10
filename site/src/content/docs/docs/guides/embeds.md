---
title: Embedded content
description: Videos, maps and widgets behind a placeholder until the visitor accepts the service.
---

`<ConsentGate>` shows your placeholder until the visitor accepts the service, then shows the content. The server
renders the placeholder. Adding a new embed to the page does not reload the ones already playing.

```svelte
<ConsentGate service="youtube" embed={{ videoID: 'dQw4w9WgXcQ' }}>
  {#snippet placeholder({ service, allow })}
    <CookiePlaceholder {service} {allow} />
  {/snippet}
</ConsentGate>
```

```tsx
<ConsentGate
  service="youtube"
  embed={{ videoID: 'dQw4w9WgXcQ' }}
  placeholder={(props) => <CookiePlaceholder {...props} />}
/>
```

```vue
<ConsentGate service="youtube" :embed="{ videoID: 'dQw4w9WgXcQ' }">
  <template #placeholder="props"><CookiePlaceholder v-bind="props" /></template>
</ConsentGate>
```

- `service` is the catalog key (`youtube`, `vimeo`, `googlemaps`…).
- `embed` holds the attributes of tarteaucitron's markup for that service (`videoID`, `width`, `height`…). The
  [catalog](../../reference/services/) marks which services are embeds.
- The placeholder receives `service` (name, category, privacy policy link) and `allow`, which accepts this
  service only.

`npx @zeste/cli add` writes a `CookiePlaceholder` component to start from.

## Your own content

Without `embed`, `<ConsentGate>` renders its children once the visitor accepts the service. Use this for a widget
you build yourself or a component from the service's SDK.

```svelte
<ConsentGate service="googlemaps">
  <MyMap />
  {#snippet placeholder({ service, allow })}
    <CookiePlaceholder {service} {allow} />
  {/snippet}
</ConsentGate>
```

When a service has several kinds of embeds (for example Facebook posts and videos), `embedClass` picks one
(`fb-post`).

## With the script tag

Keep tarteaucitron's markup: `<div class="youtube_player" videoID="dQw4w9WgXcQ"></div>`. zeste renders its own
placeholder there, in the banner's style.
