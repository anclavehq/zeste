---
title: Your own UI
description: Build the banner and the preferences with your UI library or your own design system.
---

zeste is headless: it gives you a state and actions, and works with any components.

## Start from a generated variant

```sh
npx zeste add                  # detects the framework, then shadcn (components.json), Ark UI, Bits UI / Radix / Reka UI
npx zeste add --ui ark         # or explicitly
npx zeste add --style pelure   # zeste (default, understated, lemon accent) | pelure (flat, thick outlines)
```

| Framework | `--ui` |
|---|---|
| Svelte | `bits`, `ark`, `shadcn` |
| React | `radix`, `ark`, `shadcn` (Base UI or Radix flavor) |
| Vue | `reka`, `ark`, `shadcn` |

This copies a banner, preferences and a placeholder into your project, written with your library's components
(your own shadcn components if there are any). The files are yours: `zeste add` never overwrites them without
`--force`. The logic, the accessibility and the compliance checks stay in the zeste packages and are updated with
them.

Colors live in `theme.css` (`--zeste-*` variables, scoped to the skin's elements): changing `--zeste-ink` and
`--zeste-accent` is often enough. Dark mode follows the `dark` class or `data-theme="dark"`. The shadcn variants
have no `theme.css`: they follow your project's theme.

## With your own design system

Start from the closest variant and swap the imports for your components. Attach zeste's actions to your buttons:

```svelte
<ConsentBanner class="…">  <!-- rendered only while the visitor has not chosen -->
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

The available actions are `acceptAll`, `denyAll`, `openPreferences`, `savePreferences` and `closePreferences`.
They wire the click and mark the button for the [compliance guard](../compliance/). A plain click handler
(`onclick={zeste.denyAll}`) works too, but the guard cannot check that button.

## The preferences

- `zeste.categories` groups the services by purpose (`analytic`, `ads`, `video`…), each with a `status`
  (`granted`, `denied`, `unknown` or `mixed`).
- `zeste.draft` holds the choices being edited; `savePreferences` applies them. Opening the preferences fills the
  draft with the current choices, with undecided services unchecked: nothing is pre-checked.
- `zeste.exempt` lists the services that need no consent (for example self-hosted Matomo), to show them as
  information.
