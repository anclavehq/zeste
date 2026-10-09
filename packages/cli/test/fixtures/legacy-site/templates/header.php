<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title><?= $title ?></title>
  <script src="/tarteaucitron/tarteaucitron.js"></script>
  <script>
  tarteaucitron.init({
      "privacyUrl": "/confidentialite", /* Privacy policy url */
      "hashtag": "#tarteaucitron", /* Open the panel with this hashtag */
      "cookieName": "monsite_rgpd", /* Cookie name */
      "orientation": "middle",
      "highPrivacy": true,
      // "cookieDomain": ".old-domain.fr", /* Shared cookie for subdomain website */
      "cookieDomain": ".monsite.fr",
      "googleConsentMode": true
  });

  tarteaucitron.user.gtagUa = 'G-ABC123XYZ';
  tarteaucitron.user.gtagMore = function () { gtag('set', 'anonymize_ip', true); };
  (tarteaucitron.job = tarteaucitron.job || []).push('gtag');

  tarteaucitron.user.matomoId = 12;
  tarteaucitron.user.matomoHost = 'https://monsite.matomo.cloud/';
  (tarteaucitron.job = tarteaucitron.job || []).push('matomocloud');

  (tarteaucitron.job = tarteaucitron.job || []).push('youtube');
  // (tarteaucitron.job = tarteaucitron.job || []).push('facebook');
  (tarteaucitron.job = tarteaucitron.job || []).push('monwidgetmaison');
  </script>
</head>
