# Security policy

zeste decides when third-party scripts may run on a site, so a flaw can mean a tracker loading without consent.
Please report it privately.

## Reporting a vulnerability

Use [GitHub's private vulnerability reporting](https://github.com/anclavehq/zeste/security/advisories/new)
(Security tab → "Report a vulnerability"). Do not open a public issue.

Please include the package and version, what a visitor or an attacker can make happen, and the smallest page or
configuration that reproduces it. You will get an answer within a week.

## What counts

- A third-party request or cookie before consent, or after a refusal or a withdrawal, with zeste set up as
  documented.
- A choice that is not stored or not applied as the visitor made it.
- Script injection through zeste's configuration, its components or the `<script>` version.

The service code comes from [tarteaucitron.js](https://github.com/AmauriC/tarteaucitron.js): a flaw inside one
service's own code should also be reported there.

## Supported versions

Only the latest release receives fixes.
