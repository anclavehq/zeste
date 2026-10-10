---
title: Migrer depuis tarteaucitron
description: Passer un site de tarteaucitron.js à zeste en gardant les choix déjà faits par les visiteurs.
---

zeste lit et écrit le même cookie que tarteaucitron, avec le même nom et le même format. Les visiteurs gardent
leurs choix et ne revoient pas la bannière.

## Site sans framework

Remplacez la balise `<script>` de tarteaucitron par la [balise script](../../start/script-tag/) de zeste, au même
endroit dans le `<head>`. zeste lit votre configuration existante, donc `tarteaucitron.init({…})`,
`tarteaucitron.user.*` et `tarteaucitron.job` peuvent rester inchangés. Les liens vers `#tarteaucitron` et le
balisage `youtube_player` continuent de fonctionner.

## App Svelte, React ou Vue

1. Retirez tarteaucitron et déclarez les mêmes services. `npx @zeste/cli init` lit votre configuration tarteaucitron
   et l'écrit pour zeste. Il reprend les services, les options `tarteaucitron.user.*`, le nom et le domaine du
   cookie, et le Consent Mode. Son rapport liste ce qu'il faut retirer et ce qu'il reste à compléter, avec le
   fichier et la ligne de chaque élément.
2. Lancez `npx @zeste/cli add` pour générer la bannière et les préférences.
3. Remplacez les boutons, la modale et les interrupteurs générés par les composants de votre design system. Voir
   [Votre propre interface](../ui/).
4. Mettez les vidéos et les cartes intégrées derrière `<ConsentGate>`. L'ancien balisage `.youtube_player`
   continue de fonctionner, et `<ConsentGate>` ajoute un placeholder que le serveur rend dans le style du site.
   Voir [Contenus intégrés](../embeds/).

:::caution
Un composant bouton doit transmettre ses props à son élément HTML. Sinon, les actions de zeste ne sont pas
attachées et le clic ne fait rien. TypeScript ne détecte pas cette erreur. Le [garde-fou](../compliance/) la
signale dans la console.
:::

## Ce qui change pour le site

- La page ne charge plus le script ni la feuille de style de tarteaucitron.
- Les modes « sans cookie » de tarteaucitron, qui contactent un tiers avant le consentement (Matomo Cloud,
  GetQuanty, Consent Mode avancé), sont désactivés par défaut. Si votre site en dépend, activez-les avec
  `allowPreConsentRequests`.
- Si vous utilisiez un nom de cookie (`cookieName`) ou un domaine (`cookieDomain`) personnalisé, zeste en a aussi
  besoin. `zeste init` les reprend de votre configuration.
