---
title: Langues
description: Les textes de la bannière en 36 langues, choisis d'après la page ou le navigateur.
---

Les textes de la bannière viennent de tarteaucitron, qui les traduit en 36 langues. Si vous ne passez pas de `messages`, zeste utilise l'anglais.

## Une seule langue

```ts
import { messages } from '@zeste/services/i18n/fr';

createZeste({ services, messages });
```

## Plusieurs langues

`@zeste/services/i18n` choisit une langue et ne télécharge que celle-là.

```ts
import { acceptedLanguages, detectLanguage, loadMessages, pickLanguage } from '@zeste/services/i18n';

// Sans rendu serveur : la langue de la page (<html lang>), puis celle du navigateur, l'anglais sinon
const messages = await loadMessages(detectLanguage());

// Avec rendu serveur, choisissez côté serveur et passez les textes à la page, comme le cookie de consentement
// (`load` de SvelteKit, props d'un composant serveur Next.js, `useAsyncData` de Nuxt)
const language = pickLanguage([pageLanguage, ...acceptedLanguages(request.headers.get('accept-language'))]);
const messages = await loadMessages(language);
```

La version [balise script](../../start/script-tag/) choisit la langue toute seule. Pour en imposer une, indiquez `language: 'de'`.

## Des textes typés dans vos composants

`zeste.messages` contient les textes avec leurs types, par exemple `zeste.messages.acceptAll` ou
`zeste.messages.categories.analytic?.title`. Dans un composant enfant, passez le type `Messages` de
`@zeste/services/i18n/types` pour les obtenir typés. Utilisez `getZeste<Messages>()` en Svelte et
`useZeste<Messages>()` en React et Vue.

Les messages destinés aux développeurs (avertissements du [garde-fou](../compliance/)) sont en anglais.

## Langues disponibles

`ar`, `bg`, `ca`, `cn`, `cs`, `da`, `de`, `el`, `en`, `es`, `et`, `fi`, `fr`, `hr`, `hu`, `it`, `ja`, `ko`, `lb`,
`lt`, `lv`, `nl`, `no`, `oc`, `pl`, `pt`, `ro`, `ru`, `se`, `sk`, `sq`, `sv`, `tr`, `uk`, `vi`, `zh`.
