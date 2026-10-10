---
title: Preuve de consentement
description: Garder une trace de chaque choix pour montrer qu'un visiteur a consenti.
---

L'article 7 du RGPD vous demande de pouvoir montrer qu'un visiteur a consenti. zeste appelle `onRecord` après
chaque choix, avec une trace de ce choix. zeste n'envoie cette trace nulle part. C'est votre site qui l'envoie à
votre serveur et qui la conserve.

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
  id: '9f2c…',                       // aléatoire, gardé dans le cookie de consentement
  date: '2026-10-09T14:03:12.000Z',
  action: 'denyAll',
  choices: { gtag: false, youtube: false },
  policyVersion: '2026-10',
}
```

La trace contient ces champs :

- `id` est aléatoire et gardé dans le cookie de consentement. Il relie les choix successifs faits dans un même
  navigateur. Il n'identifie pas une personne.
- `action` indique comment le visiteur a choisi. Elle vaut `acceptAll`, `denyAll`, `set` (depuis les
  préférences), `grant` ou `deny` (un service, depuis un placeholder), ou `category`.
- `choices` liste chaque service soumis à consentement, avec son état après le choix.
- `policyVersion` est la version de votre politique à laquelle le visiteur a répondu. Quand vous la changez,
  zeste redemande à tous les visiteurs.

Lors d'une visite suivante, zeste relit le choix enregistré dans le cookie. Ce n'est pas un nouveau choix, et
`onRecord` n'est pas appelé.

Avec la [balise script](../../start/script-tag/), mettez la même fonction `onRecord` dans `window.zesteConfig`.

## Conserver les traces

Enregistrez chaque trace sur votre serveur avec sa date de réception. Une trace ne contient pas de donnée
personnelle en elle-même. Elle en devient une si vous la stockez avec une adresse IP ou un compte. La durée de
conservation est une question juridique propre à votre site.
