---
title: Introduction
description: Ce que fait zeste, ce qui reste à votre charge, et par où commencer.
---

zeste est une bibliothèque de consentement cookies pour Svelte, React, Vue et les sites sans framework. Elle
reprend le catalogue de services de [tarteaucitron.js](https://github.com/AmauriC/tarteaucitron.js), soit 247
services et des textes en 36 langues, et remplace son moteur et son interface. Vous construisez la bannière avec
vos propres composants.

## Ce que fait zeste

- Il charge chaque service tiers seulement après l'accord du visiteur. Avant, la page n'envoie aucune requête à
  Google, YouTube, Matomo ni à aucun autre service du catalogue.
- Il enregistre le choix dans le même cookie que tarteaucitron. Les visiteurs d'un site qui passe de
  tarteaucitron à zeste gardent leurs choix.
- Il gère le retrait du consentement. Quand un visiteur refuse un service qu'il avait accepté, zeste supprime ses
  cookies et remet les vidéos intégrées derrière leur placeholder.
- Il met à jour Google Consent Mode v2.
- En développement, il vous prévient quand la bannière enfreint une règle mesurable, par exemple quand « Tout
  refuser » manque ou est plus petit que « Tout accepter ».
- Il transmet à votre code une trace de chaque choix, à conserver comme preuve de consentement.

## Ce qui reste à votre charge

En Svelte, React et Vue, zeste ne dessine rien. Vous écrivez la bannière et les préférences avec vos composants.
`npx @zeste/cli add` en écrit une première version avec votre lib d'UI, et ces fichiers sont à vous.

zeste fournit les traductions de tarteaucitron pour les textes de la bannière. Votre politique de confidentialité
et la description de la finalité de chaque cookie restent à votre charge.

## Packages

| Package | Rôle |
|---|---|
| `@zeste/core` | Le moteur. Il fonctionne sans framework et gère l'état, le cookie, les plugins et la compatibilité tarteaucitron |
| `@zeste/services` | Le catalogue, avec un module par service, et les textes |
| `@zeste/svelte` | Bindings Svelte 5 |
| `@zeste/react` | Bindings React 18 et 19, pour Next.js et les apps sans serveur |
| `@zeste/vue` | Bindings Vue 3, pour Nuxt et les apps sans serveur |
| `@zeste/browser` | Une balise `<script>` pour les sites sans framework, bannière comprise |
| `@zeste/cli` | La CLI, avec `zeste init` et `zeste add` |

## Par où commencer

- Pour une app SvelteKit, Next.js ou Nuxt, suivez [SvelteKit](./start/sveltekit/), [Next.js](./start/nextjs/) ou
  [Nuxt](./start/nuxt/).
- Pour une app sans serveur construite avec Vite, voyez [Applications monopage](./start/spa/).
- Pour WordPress, un site statique ou des templates PHP, voyez [Balise script](./start/script-tag/).
- Pour un site qui utilise déjà tarteaucitron, voyez [Migrer depuis tarteaucitron](./guides/migrate/).

:::note
zeste n'est pas encore sur npm. Les commandes de ces pages décrivent la première version publiée.
:::
