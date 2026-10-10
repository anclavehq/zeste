---
title: Conformité
description: Ce que zeste applique par défaut, et le garde-fou qui vérifie votre bannière pendant le développement.
---

Les règles de consentement en Europe (directive ePrivacy art. 5(3), RGPD, lignes directrices du CEPD sur les
bannières cookies) se résument à quelques points vérifiables : rien de non essentiel ne tourne avant consentement,
refuser doit être aussi simple qu'accepter, et retirer son consentement doit rester possible à tout moment. Les
autorités comme la CNIL les font activement respecter.

:::note
zeste applique des choix stricts par défaut et vérifie ce qui se mesure. Il ne rend pas un site conforme à lui
seul : vos textes, votre politique de confidentialité et la finalité réelle de chaque cookie restent à valider.
:::

## Strict par défaut

- **Aucune requête vers un tiers avant consentement**, vérifié au niveau réseau du navigateur pour chaque service
  du catalogue.
- Les **modes « sans cookie »** de tarteaucitron qui contactent un tiers avant consentement (Matomo Cloud,
  GetQuanty, Consent Mode avancé…) sont désactivés. `allowPreConsentRequests: true` les active tous, une liste de
  clés seulement ceux-là.
- **Rien de pré-coché** dans les préférences ; un service que le visiteur n'a pas choisi est refusé.
- **Le retrait** supprime les cookies du service et remet les contenus intégrés derrière leur placeholder. Un
  script déjà lancé ne s'arrête qu'avec un rechargement : `zeste.needsReload` vous indique quand le proposer.
- **Le consentement dure 13 mois** (395 jours), puis il est redemandé. Il l'est aussi quand `policyVersion` change.
- **Les services exemptés** (`needsConsent: false`, par exemple Matomo auto-hébergé configuré pour) se chargent
  tout de suite et sont listés dans `zeste.exempt`.

## Google Consent Mode v2

```ts
import { googleConsentMode } from '@zeste/core';

createZeste({ services, plugins: [googleConsentMode()] });
```

Le plugin met tous les signaux Google à `denied` par défaut, puis les met à jour à chaque choix, d'après les
services acceptés par le visiteur (Google Analytics, Ads, Tag Manager). Il est actif par défaut dans la version
balise script.

## Le garde-fou

En développement, zeste observe le rendu réel de la bannière, quel que soit le design system, et prévient dans la
console si :

- la bannière n'a pas de bouton « Tout refuser » au premier niveau, ou s'il est invisible ;
- « Tout refuser » est nettement plus petit ou moins contrasté que « Tout accepter » (toute couleur CSS, `oklch`
  de Tailwind v4 compris) ;
- rien ne permet de rouvrir les préférences une fois le choix fait.

```
[zeste/consent] "Deny all" is much smaller than "Accept all" (area 24%, text 9px vs 14px). Both choices must be equally prominent.
```

Il est actif en développement et désactivé en production ; `guard: true` le force. Il trouve les boutons grâce aux
actions zeste (`{@attach zeste.actions.denyAll}`, `{...zeste.actions.denyAll}`, `v-bind="zeste.actions.denyAll"`) :
un bouton branché avec un simple gestionnaire de clic n'est pas vérifié.
