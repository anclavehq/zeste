---
title: Introduction
description: Ce qu'est zeste, ce qu'il fait pour vous et ce qu'il vous laisse.
---

zeste est une bibliothèque de consentement cookies **headless** (sans interface imposée). Elle reprend le catalogue
de services de [tarteaucitron.js](https://github.com/AmauriC/tarteaucitron.js) (247 services, textes en 36 langues)
et remplace son moteur et son interface : vous construisez la bannière avec vos propres composants.

## Ce que fait zeste

- Charge chaque service tiers **uniquement après consentement**, et rien avant : aucune requête vers Google,
  YouTube ou Matomo tant que le visiteur n'a pas accepté.
- Enregistre le choix dans le même cookie que tarteaucitron : les visiteurs d'un site migré gardent leurs choix.
- Retire proprement le consentement : cookies supprimés, contenus intégrés remplacés par leur placeholder.
- Pilote Google Consent Mode v2.
- Vous prévient pendant le développement quand la bannière enfreint une règle mesurable (bouton « Tout refuser »
  absent, plus petit ou plus pâle que « Tout accepter », aucun moyen de rouvrir les préférences).
- Vous transmet chaque choix, à conserver comme preuve de consentement.

## Ce qu'il vous laisse

- **L'interface.** En Svelte, React ou Vue, zeste ne dessine rien. `npx zeste add` écrit une première version avec
  votre lib d'UI, et ces fichiers vous appartiennent.
- **Les textes et votre politique de confidentialité.** zeste fournit les traductions de tarteaucitron ; décrire à
  quoi servent vos cookies reste à votre charge.

## Packages

| Package | Rôle |
|---|---|
| `@zeste/core` | Moteur sans framework : état, cookie, plugins, compatibilité tarteaucitron |
| `@zeste/services` | Le catalogue, un module par service, et les textes |
| `@zeste/svelte` | Bindings Svelte 5 |
| `@zeste/react` | Bindings React 18 et 19, Next.js |
| `@zeste/vue` | Bindings Vue 3, Nuxt |
| `@zeste/browser` | Une balise `<script>` pour les sites sans framework, bannière comprise |
| `zeste` | La CLI : `zeste init`, `zeste add` |

## Par où commencer

- Une app SvelteKit, Next.js ou Nuxt : [SvelteKit](./start/sveltekit/), [Next.js](./start/nextjs/),
  [Nuxt](./start/nuxt/).
- Une app sans serveur (Vite) : [Applications monopage](./start/spa/).
- WordPress, un site statique, des templates PHP : [Balise script](./start/script-tag/).
- Un site déjà sous tarteaucitron : [Migrer depuis tarteaucitron](./guides/migrate/).

:::note
zeste n'est pas encore sur npm. Les commandes de ces pages décrivent la première version publiée.
:::
