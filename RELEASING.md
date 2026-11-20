# Releasing

All packages (`zeste` and `@zeste/*`) share one version, managed with [Changesets](https://github.com/changesets/changesets).
Publish with **pnpm**, not npm: pnpm turns `workspace:*` into real versions and applies each package's
`publishConfig` (exports pointing to the compiled `dist/`).

## Day to day

A pull request that changes a published package adds a changeset (CI fails without one):

```sh
pnpm changeset          # pick the packages, patch / minor / major, one line for the changelog
pnpm changeset --empty  # for a change that does not need a release (tests, README)
```

The weekly workflow writes the changeset itself when it updates the catalog to a new tarteaucitron.js release.

## Publishing

`.github/workflows/release.yml` runs on every push to `main`. While changesets are pending, it keeps a pull request
titled "Release" open, with the version bump and the changelogs. Merging that pull request publishes every package to
npm with provenance and pushes the `v<version>` tag.

It needs two things:

- [trusted publishing](https://docs.npmjs.com/trusted-publishers) set up on npmjs.com for each package, pointing to
  this repository and the `release.yml` workflow: no npm token is stored in GitHub;
- the `CATALOG_UPDATE_TOKEN` secret, so that CI runs on the release pull request.

If a publish fails halfway, start the workflow again from Actions → Release → Run workflow: it publishes when the
version in `packages/core/package.json` is not on npm yet.

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
