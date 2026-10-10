# Releasing

All packages (`zeste` and `@zeste/*`) share one version, managed with [Changesets](https://github.com/changesets/changesets).
Publish with **pnpm**, not npm: pnpm turns `workspace:*` into real versions and applies each package's
`publishConfig` (exports pointing to the compiled `dist/`).

## Day to day

A pull request that changes a published package adds a changeset:

```sh
pnpm changeset   # pick the packages, patch / minor / major, one line for the changelog
```

## Publishing by hand

```sh
npm login                      # an account that belongs to the `zeste` npm organization
pnpm changeset version         # bumps the versions, writes CHANGELOG.md files; commit the result
pnpm install
pnpm typecheck && pnpm test && pnpm --filter e2e test
pnpm release                   # builds every package, then pnpm publish --access public
git tag v<version> && git push --follow-tags
```

To see what would be sent without sending anything:
`pnpm -r --filter "./packages/*" publish --access public --dry-run --no-git-checks`.

## Publishing from GitHub Actions (later)

`.github/workflows/release.yml` publishes with npm provenance, and only when started by hand (Actions → Release →
Run workflow). Before using it, set up [trusted publishing](https://docs.npmjs.com/trusted-publishers) on npmjs.com
for each package, pointing to this repository and the `release.yml` workflow: no npm token is stored in GitHub.
