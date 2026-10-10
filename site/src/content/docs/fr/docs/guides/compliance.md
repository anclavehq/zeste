---
title: Conformité
description: Les réglages que zeste applique par défaut, Google Consent Mode, et le garde-fou qui vérifie votre bannière en développement.
---

Les règles européennes de consentement viennent de la directive ePrivacy (article 5(3)), du RGPD et des lignes
directrices du CEPD sur les bannières cookies. Certaines de leurs exigences peuvent être vérifiées par un
logiciel. Rien de ce qui demande un consentement ne doit tourner avant que le visiteur ait consenti. Refuser doit
être aussi simple qu'accepter. Le visiteur doit pouvoir retirer son consentement à tout moment. Les autorités
nationales, comme la CNIL en France, font respecter ces règles.

:::note
zeste applique des réglages stricts par défaut et vérifie ce qui se mesure. Les textes de votre bannière, votre
politique de confidentialité et la finalité de chaque cookie restent à faire valider, et zeste ne peut pas le
faire pour vous.
:::

## Réglages par défaut

- zeste n'envoie aucune requête vers un tiers avant le consentement. Les tests le vérifient au niveau réseau du
  navigateur pour chaque service du catalogue.
- Certains services de tarteaucitron ont un mode « sans cookie » qui contacte le tiers avant le consentement, par
  exemple Matomo Cloud, GetQuanty et le Consent Mode avancé. zeste désactive ces modes.
  `allowPreConsentRequests: true` les active tous, et une liste de clés de services n'active que ceux-là.
- Les préférences n'affichent rien de pré-coché. Un service que le visiteur n'a pas choisi est refusé.
- Quand un visiteur retire son consentement, zeste supprime les cookies du service et remet les contenus intégrés
  derrière leur placeholder. Un script déjà lancé ne s'arrête qu'au rechargement de la page. `zeste.needsReload`
  vous indique quand proposer de recharger.
- Le consentement dure 13 mois (395 jours). zeste le redemande ensuite. Il le redemande aussi quand vous changez
  `policyVersion`.
- Certains services n'ont pas besoin de consentement, par exemple un Matomo auto-hébergé configuré pour. Ils ont
  `needsConsent: false`, se chargent tout de suite et apparaissent dans `zeste.exempt`.

## Google Consent Mode v2

```ts
import { googleConsentMode } from '@zeste/core';

createZeste({ services, plugins: [googleConsentMode()] });
```

Le plugin met tous les signaux de consentement Google à `denied` au chargement de la page. Après chaque choix, il
les met à jour d'après les services Google acceptés par le visiteur (Google Analytics, Ads et Tag Manager). La
version balise script active le plugin par défaut.

## Le garde-fou de conformité

En développement, zeste vérifie le rendu réel de la bannière, quel que soit votre design system, et prévient dans
la console quand :

- la bannière n'a pas de bouton « Tout refuser » au premier niveau, ou que ce bouton est invisible ;
- « Tout refuser » est nettement plus petit que « Tout accepter », ou moins contrasté (zeste lit toutes les
  couleurs CSS, y compris les couleurs `oklch` de Tailwind v4) ;
- rien ne permet de rouvrir les préférences une fois le choix fait.

```
[zeste/consent] "Deny all" is much smaller than "Accept all" (area 24%, text 9px vs 14px). Both choices must be equally prominent.
```

Le garde-fou tourne en développement et reste désactivé en production. `guard: true` l'active partout.

Le garde-fou trouve les boutons grâce aux actions de zeste : `{@attach zeste.actions.denyAll}` en Svelte,
`{...zeste.actions.denyAll}` en React et `v-bind="zeste.actions.denyAll"` en Vue. Il ne peut pas vérifier un
bouton branché avec un simple gestionnaire de clic.
