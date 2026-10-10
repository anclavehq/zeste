---
title: Balise script
description: zeste sur un site sans framework JavaScript (WordPress, site statique, templates PHP), bannière comprise.
---

`@zeste/browser` apporte le moteur, le catalogue et une bannière, des préférences et des placeholders prêts à
l'emploi, dans la langue de la page. Seuls les services déclarés et une langue sont téléchargés : le moteur et
l'interface pèsent 17 ko compressés.

## Installation

Copiez le dossier `dist/` de `@zeste/browser` sur votre site (par exemple en `/zeste/`), puis dans le `<head>` de
chaque page :

```html
<script>
  window.zesteConfig = {
    services: { gtag: { gtagUa: 'G-XXXXXXX' }, youtube: {} },
    privacyUrl: '/confidentialite',
    style: 'zeste', // ou 'pelure'
  };
</script>
<script src="/zeste/zeste.js"></script>
```

`npx zeste init`, lancé dans un dossier sans `package.json`, écrit cette configuration dans `zeste.config.js` à
partir des scripts trouvés dans vos pages.

Un bouton rond pour rouvrir les préférences apparaît une fois le choix fait. Tout lien vers `#zeste` les ouvre
aussi :

```html
<a href="#zeste">Gestion des cookies</a>
```

## Vidéos et cartes intégrées

Utilisez le balisage de tarteaucitron ; zeste affiche un placeholder tant que le service n'est pas accepté :

```html
<div class="youtube_player" videoID="dQw4w9WgXcQ"></div>
```

## Depuis vos propres scripts

`window.zeste` expose `open()`, `close()`, `acceptAll()`, `denyAll()`, `grant(key)`, `deny(key)` et `has(key)`.

## Remplacer tarteaucitron.js

Remplacez la balise `<script>` de tarteaucitron par celle de zeste, au même endroit, et gardez
`tarteaucitron.init({…})`, `tarteaucitron.user.*` et `tarteaucitron.job` tels quels. Les visiteurs gardent leurs
choix (même cookie, `cookieName` personnalisé compris), les liens `#tarteaucitron` ouvrent toujours les préférences
et le balisage `youtube_player` fonctionne toujours. Voir [Migrer depuis tarteaucitron](../../guides/migrate/).

Toutes les options : [Configuration de la balise script](../../reference/script-config/).
