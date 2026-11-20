# Changesets

Each pull request that changes a published package adds a changeset: `pnpm changeset`, pick the packages and the
kind of change, write one line for the changelog
(`pnpm changeset --empty` when no release is needed; CI checks for one). All zeste packages share one version. See
[RELEASING.md](../RELEASING.md).
