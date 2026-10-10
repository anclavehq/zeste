---
title: Contenus intégrés
description: Vidéos, cartes et widgets derrière un placeholder tant que le visiteur n'a pas accepté le service.
---

`<ConsentGate>` affiche votre placeholder tant que le service n'est pas accepté, puis le contenu. Le placeholder est
rendu côté serveur, et monter un nouveau contenu ne recharge pas ceux déjà en lecture.

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

- `service` est la clé du catalogue (`youtube`, `vimeo`, `googlemaps`…).
- `embed` contient les attributs du balisage tarteaucitron pour ce service (`videoID`, `width`, `height`…). Le
  [catalogue](../../reference/services/) indique quels services sont des intégrations.
- Le placeholder reçoit `service` (nom, catégorie, lien vers sa politique de confidentialité) et `allow`, qui
  accepte ce service uniquement.

`npx zeste add` écrit un composant `CookiePlaceholder` pour démarrer.

## Votre propre contenu

Sans `embed`, `<ConsentGate>` affiche ses enfants une fois que le visiteur a accepté le service. Utilisez-le pour
un widget que vous construisez vous-même ou pour un composant du SDK du service.

```svelte
<ConsentGate service="googlemaps">
  <MyMap />
  {#snippet placeholder({ service, allow })}
    <CookiePlaceholder {service} {allow} />
  {/snippet}
</ConsentGate>
```

Quand un service a plusieurs types d'intégration (par exemple les publications et les vidéos Facebook),
`embedClass` en choisit un (`fb-post`).

## Avec la balise script

Gardez le balisage de tarteaucitron : `<div class="youtube_player" videoID="dQw4w9WgXcQ"></div>`. zeste y affiche
son propre placeholder, dans le style de la bannière.
