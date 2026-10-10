---
title: CLI
description: zeste init et zeste add.
---

## `zeste init`

Trouve les services que le projet utilise déjà et écrit leur déclaration pour zeste.

```sh
npx @zeste/cli init             # écrit lib/consent.ts (dans src/, app/ de Nuxt ou à la racine)
npx @zeste/cli init --dry-run   # rapport seulement
```

Il lit le projet une fois et reconnaît :

- une configuration tarteaucitron : `tarteaucitron.job`, `tarteaucitron.user.*`, nom et domaine du cookie,
  Consent Mode ;
- les scripts les plus courants collés directement dans les pages : Google Analytics, Google Ads, Tag Manager,
  Matomo, Hotjar, Meta Pixel, Clarity, Google Maps, vidéos YouTube et Vimeo.

Son rapport indique, fichier et ligne, les scripts à retirer (zeste les charge après consentement), les contenus à
mettre derrière `<ConsentGate>` et les options à compléter. Il ne reconnaît pas tous les tiers. Vérifiez la
liste, puis ajoutez les services manquants depuis le [catalogue](../services/).

| Option | |
|---|---|
| `--out <fichier>` | Fichier de sortie. Par défaut : `lib/consent.ts` dans `src/`, `app/` (Nuxt) ou à la racine |
| `--format module\|script` | `module` : TypeScript pour les packages npm (par défaut avec un `package.json`). `script` : `zeste.config.js` pour la [balise script](../../start/script-tag/) (par défaut sans) |
| `--dry-run` | Affiche le rapport et le fichier, n'écrit rien |
| `--force` | Écrase un fichier existant |

## `zeste add`

Copie une bannière, des préférences et un placeholder écrits avec votre lib d'UI.

```sh
npx @zeste/cli add
npx @zeste/cli add --ui ark --style pelure
```

| Option | |
|---|---|
| `--framework svelte\|react\|vue` | Détecté depuis `package.json` |
| `--ui <lib>` | Svelte : `shadcn`, `ark`, `bits`. React : `shadcn`, `ark`, `radix`. Vue : `shadcn`, `ark`, `reka`. Détectée depuis `components.json` et les dépendances |
| `--style zeste\|pelure` | `zeste` (par défaut) : sobre, touche citron. `pelure` : bannière en aplat, contours épais |
| `--dir <dossier>` | Par défaut : `src/lib/components/zeste` (Svelte), `components/zeste` dans `src/`, `app/` (Nuxt) ou à la racine (React, Vue) |
| `--force` | Écrase les fichiers existants |

Voir [Votre propre interface](../../guides/ui/).
