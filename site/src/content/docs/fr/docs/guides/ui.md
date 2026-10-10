---
title: Votre propre interface
description: Construire la bannière et les préférences avec votre lib d'UI ou votre propre design system.
---

zeste est headless. Il vous donne un état et des actions, et vous construisez l'interface avec les composants de votre choix.

## Partir d'une variante générée

```sh
npx @zeste/cli add                  # détecte le framework, puis shadcn (components.json), Ark UI, Bits UI / Radix / Reka UI
npx @zeste/cli add --ui ark         # ou explicitement
npx @zeste/cli add --style pelure   # zeste (par défaut, sobre, touche citron) | pelure (aplat, contours épais)
```

| Framework | `--ui` |
|---|---|
| Svelte | `bits`, `ark`, `shadcn` |
| React | `radix`, `ark`, `shadcn` (variante Base UI ou Radix) |
| Vue | `reka`, `ark`, `shadcn` |

Une bannière, des préférences et un placeholder sont copiés dans votre projet, écrits avec les composants de votre
lib (vos propres composants shadcn s'il y en a). Les fichiers vous appartiennent : `zeste add` ne les écrase jamais
sans `--force`. La logique, l'accessibilité et les vérifications de conformité restent dans les packages zeste et
se mettent à jour avec eux.

Les couleurs sont dans `theme.css`, sous forme de variables `--zeste-*` limitées aux éléments générés. Changer
`--zeste-ink` et `--zeste-accent` suffit souvent pour les accorder à votre site. Le mode sombre suit la classe
`dark` ou `data-theme="dark"` de la page. Les variantes shadcn n'ont pas de `theme.css` et utilisent le thème
shadcn de votre projet.

## Avec votre propre design system

Partez de la variante la plus proche et remplacez les imports par vos composants. Attachez les actions zeste à vos
boutons :

```svelte
<ConsentBanner class="…">  <!-- rendu seulement tant que le visiteur n'a pas choisi -->
  <MyButton {@attach zeste.actions.denyAll}>{zeste.messages.denyAll}</MyButton>
  <MyButton {@attach zeste.actions.acceptAll}>{zeste.messages.acceptAll}</MyButton>
</ConsentBanner>
<MyDialog bind:open={zeste.preferencesOpen}>
  <MySwitch bind:checked={zeste.draft.youtube} />
</MyDialog>
```

```tsx
<ConsentBanner className="…">
  <MyButton {...zeste.actions.denyAll}>{zeste.messages.denyAll}</MyButton>
  <MyButton {...zeste.actions.acceptAll}>{zeste.messages.acceptAll}</MyButton>
</ConsentBanner>
<MyDialog open={zeste.preferencesOpen} onOpenChange={zeste.setPreferencesOpen}>
  <MySwitch checked={zeste.draft.youtube} onCheckedChange={(on) => zeste.setDraft('youtube', on)} />
</MyDialog>
```

```vue
<ConsentBanner class="…">
  <MyButton v-bind="zeste.actions.denyAll">{{ zeste.messages.denyAll }}</MyButton>
  <MyButton v-bind="zeste.actions.acceptAll">{{ zeste.messages.acceptAll }}</MyButton>
</ConsentBanner>
<MyDialog v-model:open="zeste.preferencesOpen">
  <MySwitch v-model="zeste.draft.youtube" />
</MyDialog>
```

Les actions disponibles sont `acceptAll`, `denyAll`, `openPreferences`, `savePreferences` et `closePreferences`.
Chaque action gère le clic et signale le bouton au [garde-fou](../compliance/). Un simple gestionnaire de clic,
comme `onclick={zeste.denyAll}`, fonctionne aussi, mais le garde-fou ne peut pas vérifier ce bouton.

## Les préférences

- `zeste.categories` regroupe les services par finalité (`analytic`, `ads`, `video`…), chacune avec un `status`
  (`granted`, `denied`, `unknown` ou `mixed`).
- `zeste.draft` contient les choix en cours de modification, et `savePreferences` les applique. Ouvrir les
  préférences remplit le brouillon avec les choix actuels. Les services sur lesquels le visiteur ne s'est pas
  prononcé sont décochés.
- `zeste.exempt` liste les services qui n'ont pas besoin de consentement (par exemple Matomo auto-hébergé), à
  afficher pour information.
