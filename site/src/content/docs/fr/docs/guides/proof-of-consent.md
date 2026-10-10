---
title: Preuve de consentement
description: Garder une trace de chaque choix, pour montrer qu'un visiteur a consenti.
---

Le RGPD (art. 7) demande de pouvoir montrer qu'un visiteur a consenti. `onRecord` est appelé après chaque choix
avec de quoi le prouver. zeste n'envoie rien de lui-même : envoyer et conserver la trace revient à votre site.

```ts
createZeste({
  services,
  policyVersion: '2026-10',
  onRecord: (record) => navigator.sendBeacon('/consent', JSON.stringify(record)),
});
```

```ts
// record
{
  id: '9f2c…',                       // tiré au hasard, gardé dans le cookie de consentement
  date: '2026-10-09T14:03:12.000Z',
  action: 'denyAll',
  choices: { gtag: false, youtube: false },
  policyVersion: '2026-10',
}
```

- `id` est tiré au hasard et gardé dans le cookie de consentement : il relie les choix d'un même navigateur au fil
  des changements, pas une personne.
- `action` indique comment le choix a été fait : `acceptAll`, `denyAll`, `set` (depuis les préférences), `grant`
  ou `deny` (un service, depuis un placeholder), `category`.
- `choices` contient chaque service soumis à consentement, après le choix.
- `policyVersion` est la version de votre politique à laquelle le visiteur a répondu. La changer redemande à tous
  les visiteurs.

Relire un choix déjà enregistré, à la visite suivante, n'est pas un nouveau choix et n'est pas transmis.

Avec la [balise script](../../start/script-tag/), mettez le même `onRecord` dans `window.zesteConfig`.

## Conserver les traces

Enregistrez-les sur votre serveur avec la date de réception. La trace ne contient pas de donnée personnelle en
elle-même ; stockée à côté d'une adresse IP ou d'un compte, si. La durée de conservation est une question
juridique propre à votre site.
