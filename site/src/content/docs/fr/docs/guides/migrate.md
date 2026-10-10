---
title: Migrer depuis tarteaucitron
description: Passer un site de tarteaucitron.js à zeste sans perdre les choix des visiteurs.
---

zeste lit et écrit le même cookie que tarteaucitron (même nom, même format) : **les visiteurs gardent leurs
choix** et ne revoient pas la bannière.

## Site sans framework

Remplacez la balise `<script>` de tarteaucitron par la [balise script](../../start/script-tag/) de zeste, au même
endroit dans le `<head>`. Gardez votre configuration telle quelle : `tarteaucitron.init({…})`,
`tarteaucitron.user.*` et `tarteaucitron.job` sont lus par zeste. Les liens `#tarteaucitron` et le balisage
`youtube_player` continuent de marcher.

## App Svelte, React ou Vue

1. **Retirer tarteaucitron et déclarer les mêmes services.** `npx zeste init` lit votre configuration tarteaucitron
   (services, options `tarteaucitron.user.*`, nom et domaine du cookie, Consent Mode) et l'écrit pour zeste. Son
   rapport indique, fichier et ligne, ce qu'il faut retirer et ce qu'il reste à compléter.
2. **Générer l'interface :** `npx zeste add`.
3. **Brancher votre design system.** Remplacez les boutons, la modale et les interrupteurs générés par les vôtres.
   Voir [Votre propre interface](../ui/).
4. **Mettre les contenus intégrés derrière `<ConsentGate>`.** L'ancien balisage `.youtube_player` continue de
   fonctionner, mais `<ConsentGate>` vous donne un placeholder rendu côté serveur, dans le style du site. Voir
   [Contenus intégrés](../embeds/).

:::caution
Un composant bouton qui ne transmet pas ses props à son élément HTML laisse les actions zeste débranchées : le clic
ne fait rien. TypeScript ne le voit pas ; le [garde-fou](../compliance/) si.
:::

## Ce qui change pour le site

- Le script et le CSS de tarteaucitron ne sont plus chargés.
- Les modes « sans cookie » de tarteaucitron qui contactent un tiers avant consentement (Matomo Cloud, GetQuanty,
  Consent Mode avancé…) sont désactivés par défaut. Activez-les explicitement avec `allowPreConsentRequests` si
  vous en dépendez.
- Un nom de cookie (`cookieName`) ou un domaine (`cookieDomain`) personnalisé doit aussi être passé à zeste ;
  `zeste init` les reprend.
