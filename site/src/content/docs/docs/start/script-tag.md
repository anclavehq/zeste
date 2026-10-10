---
title: Script tag
description: zeste on a site without a JavaScript framework (WordPress, static site, PHP templates), banner included.
---

`@zeste/browser` brings the engine, the catalog and a ready-made banner, preferences and placeholders, in the
page's language. Only the declared services and one language are downloaded: the engine and the interface weigh
17 kB gzipped.

## Set up

Copy the `dist/` folder of `@zeste/browser` to your site (for example as `/zeste/`), then in the `<head>` of every
page:

```html
<script>
  window.zesteConfig = {
    services: { gtag: { gtagUa: 'G-XXXXXXX' }, youtube: {} },
    privacyUrl: '/privacy',
    style: 'zeste', // or 'pelure'
  };
</script>
<script src="/zeste/zeste.js"></script>
```

`npx zeste init` run in a folder without a `package.json` writes this configuration as `zeste.config.js`, from the
scripts it finds in your pages.

A round button to reopen the preferences appears once the visitor has chosen. Any link to `#zeste` opens them too:

```html
<a href="#zeste">Cookie settings</a>
```

## Embedded videos and maps

Use tarteaucitron's markup; zeste shows a placeholder until the service is accepted:

```html
<div class="youtube_player" videoID="dQw4w9WgXcQ"></div>
```

## From your own scripts

`window.zeste` exposes `open()`, `close()`, `acceptAll()`, `denyAll()`, `grant(key)`, `deny(key)` and `has(key)`.

## Replacing tarteaucitron.js

Replace tarteaucitron's `<script>` tag with zeste's, at the same place, and keep `tarteaucitron.init({…})`,
`tarteaucitron.user.*` and `tarteaucitron.job` as they are. Visitors keep their choices (same cookie, custom
`cookieName` included), `#tarteaucitron` links still open the preferences and the `youtube_player` markup still
works. See [Migrate from tarteaucitron](../../guides/migrate/).

All options: [Script tag configuration](../../reference/script-config/).
