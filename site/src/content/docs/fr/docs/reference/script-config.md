---
title: Configuration de la balise script
description: Toutes les options de window.zesteConfig.
---

Définissez `window.zesteConfig` avant la balise `<script>` de zeste. Voir [Balise script](../../start/script-tag/).

| Option | Par défaut | |
|---|---|---|
| `services` | | Les services par clé du catalogue, avec leurs options : `{ gtag: { gtagUa: 'G-…' }, youtube: {} }` |
| `language` | page, puis navigateur | Code de langue (`fr`, `de`…) |
| `style` | `'zeste'` | `'zeste'` (sobre, touche citron) ou `'pelure'` (bannière en aplat, contours épais) |
| `theme` | `'site'` | `'site'` : sombre quand `<html>` a la classe `dark` ou `data-theme="dark"`. `'system'` : suit le système du visiteur. `'light'` ou `'dark'` : fixe |
| `privacyUrl` | | Votre politique de confidentialité, liée depuis la bannière |
| `cookieName` | `'tarteaucitron'` | Les visiteurs gardent les choix faits avec tarteaucitron |
| `cookieDomain` | | Par exemple `.exemple.fr` pour partager le choix entre sous-domaines |
| `policyVersion` | | La changer redemande à tous les visiteurs |
| `googleConsentMode` | `true` | Google Consent Mode v2 pour Google Analytics, Ads et Tag Manager |
| `showIcon` | `true` | Bouton rond pour rouvrir les préférences une fois le choix fait. À désactiver seulement si la page a son propre lien vers `#zeste` |
| `hashtag` | `'#zeste'` | Fragment d'adresse qui ouvre les préférences (`#tarteaucitron` marche aussi) |
| `allowPreConsentRequests` | `false` | Services autorisés à contacter leur tiers avant consentement (modes sans cookie) |
| `guard` | | Avertissements dans la console quand la bannière enfreint une règle de consentement mesurable |
| `onRecord` | | Appelé après chaque choix : voir [Preuve de consentement](../../guides/proof-of-consent/) |

## `window.zeste`

| Membre | |
|---|---|
| `open()`, `close()` | Les préférences |
| `acceptAll()`, `denyAll()` | |
| `grant(key)`, `deny(key)`, `has(key)` | Un service |
| `manager` | Le moteur (`@zeste/core`) |

Les éléments avec `data-zeste-open` et les liens vers `#zeste` ouvrent les préférences.
