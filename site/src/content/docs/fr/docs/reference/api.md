---
title: API
description: createZeste, l'objet zeste, les composants et le moteur.
---

Les trois bindings exposent la même API. Les différences sont signalées là où elles existent.

## `createZeste(options)`

Crée l'état du consentement. Côté serveur, créez-en un **par requête** (dans un composant, jamais au niveau du
module).

| Option | Type | |
|---|---|---|
| `services` | `ServiceDefinition[]` | Les services, depuis `@zeste/services` |
| `initial` | `Record<string, string>` | Le choix lu côté serveur : `parseConsentCookie(valeurDuCookie)` |
| `messages` | `Messages` | Textes, depuis `@zeste/services/i18n/<langue>`. Anglais par défaut |
| `plugins` | `ConsentPlugin[]` | Par exemple `googleConsentMode()` |
| `policyVersion` | `string` | La changer invalide les choix existants et réaffiche la bannière |
| `onRecord` | `(record) => void` | Appelé après chaque choix : voir [Preuve de consentement](../../guides/proof-of-consent/) |
| `allowPreConsentRequests` | `boolean \| string[]` | Autorise les services qui contactent un tiers avant consentement. Désactivé par défaut |
| `storage` | `ConsentStorage` | Où le choix est gardé. Par défaut : `cookieStorage()`, compatible tarteaucitron |
| `guard` | `boolean` | Le [garde-fou](../../guides/compliance/). Par défaut : actif en développement |
| `delegateClicks` | `boolean` | Gère les boutons `[data-zeste-allow="<clé>"]` des placeholders HTML. Actif par défaut |
| `expose` | `boolean` | Publie les services déclarés dans `window.__zesteManifest`, comme le font les autres outils de consentement, pour que les outils d'audit les comparent à ce que la page charge. Actif par défaut |

`cookieStorage({ name, domain, expiresInDays })` change le nom du cookie (`tarteaucitron` par défaut), le partage
entre sous-domaines (`.exemple.fr`) ou change sa durée (395 jours par défaut).

## L'objet `zeste`

Renvoyé par `createZeste`, et par `getZeste()` (Svelte) ou `useZeste()` (React, Vue) dans les composants enfants.

### État

| Membre | |
|---|---|
| `showBanner` | `true` tant que le visiteur n'a pas choisi (et une fois l'état connu) |
| `decided` | Le visiteur a choisi pour chaque service soumis à consentement |
| `services` | Chaque service avec son `status` : `granted`, `denied` ou `unknown` |
| `categories` | Les services regroupés par finalité, chacune avec un `status` (`mixed` s'ils diffèrent) |
| `exempt` | Les services sans consentement requis |
| `needsReload` | Un script refusé était déjà chargé : seul un rechargement l'arrête vraiment |
| `has(key)`, `statusOf(key)` | L'état d'un service |
| `messages` | Les textes |
| `preferencesOpen` | Les préférences sont-elles ouvertes. Svelte : liable. React : `setPreferencesOpen(open)`. Vue : `v-model:open` |
| `draft` | Les choix en cours de modification dans les préférences. React : `setDraft(key, checked)` |

### Actions

| Membre | |
|---|---|
| `acceptAll()`, `denyAll()` | |
| `grant(key)`, `deny(key)` | Un service |
| `setCategory(category, granted)` | Tous les services d'une catégorie |
| `openPreferences()`, `closePreferences()`, `savePreferences()` | La fenêtre des préférences ; `savePreferences` applique le brouillon |
| `draftCategory(category, granted)` | Coche ou décoche toute une catégorie dans le brouillon |
| `actions.<nom>` | Les mêmes actions (`acceptAll`, `denyAll`, `openPreferences`, `savePreferences`, `closePreferences`) à attacher à vos boutons, vérifiées par le garde-fou. Svelte : `{@attach zeste.actions.denyAll}`. React : `{...zeste.actions.denyAll}`. Vue : `v-bind="zeste.actions.denyAll"` |
| `manager` | Le moteur sous-jacent |

## Composants

| Composant | |
|---|---|
| `<ZesteProvider zeste>` | Rend `zeste` disponible aux composants enfants et le démarre dans le navigateur |
| `<ConsentBanner>` | N'affiche son contenu que quand la bannière doit s'afficher ; la signale au garde-fou |
| `<ConsentGate service embed? embedClass? placeholder>` | Voir [Contenus intégrés](../../guides/embeds/) |

## Le moteur `@zeste/core`

`createConsent(options)` prend les mêmes options (sauf `messages` et `guard`) et renvoie un gestionnaire sans
framework : `getSnapshot()`, `subscribe(listener)`, `has`, `grant`, `deny`, `grantAll`, `denyAll`, `setCategory`,
`set(choices)`, `start()`, `rescan(key?)`, `settled()`, `destroy()`. `subscribe` suit le contrat des stores Svelte
et fonctionne avec `useSyncExternalStore` de React.

Également exportés : `parseConsentCookie`, `serializeConsentCookie`, `cookieStorage`, `memoryStorage`,
`googleConsentMode`, et les briques du garde-fou (`auditBanner`, `auditReopen`).
