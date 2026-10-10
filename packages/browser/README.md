# @zeste/browser

[zeste](https://anclavehq.github.io/zeste/) as one `<script>` tag, for sites without a JavaScript framework
(WordPress, static sites): consent engine, the tarteaucitron.js catalog and a ready-made banner. Drop-in
replacement for tarteaucitron.js: its configuration is read as is.

```html
<script>
  window.zesteConfig = { services: { gtag: { gtagUa: 'G-XXXXXXX' }, youtube: {} }, privacyUrl: '/privacy' };
</script>
<script src="/zeste/zeste.js"></script>
```

Copy `dist/` to your site, or load it from a CDN. [Script tag guide](https://anclavehq.github.io/zeste/docs/start/script-tag/) · MIT
