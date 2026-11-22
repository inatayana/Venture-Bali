# ADR — Workspace Layout & Prisma Client Isolation

> **Status:** Accepted (workspace layout, branch flow) · Proposed (Prisma custom output)
> **Date:** 2026-11-22
> **Owner:** BaliWild Engineering
> **Supersedes:** none

## 1. Context

The project grew to five parallel checkouts of the **same repository**
(`inatayana/Venture-Bali`). They were git worktrees, but they were placed as
siblings of unrelated projects under `D:\_Project`, which made them look like
five separate products. Several problems followed:

1. Folder names did not match the branch checked out inside them.
2. Two branches carried the same line of work
   (`feat/explore-airbnb-ui` and `feature/baliwild-explore-ui`).
3. `main` was 121 commits behind the integration work and had not been updated
   since 2026-11-06.
4. Every worktree had its own `node_modules` (≈640 MB each).
5. Only the primary worktree had `.env` and `.vercel`, so the others could not
   run the app or deploy.
6. Because `node_modules` was shared but `prisma generate` had run against one
   branch, `npm run typecheck` on `main` failed with four **phantom** errors
   (`DRIVER_ASSIGNED` missing, `driverInfo` missing). The code on `main` was
   correct; the generated Prisma client was from a different branch.

## 2. Decisions

### 2.1 One project container, worktrees as siblings

```
D:\_Project\venture-bali\            # container, not a repository
├─ repo\                             # primary worktree, branch: main
├─ worktrees\<name>\                 # one per active branch
└─ README.md
```

**Rationale:** a worktree placed *inside* `repo\` would be scanned by
`tsconfig.json` (`"**/*.ts"`), Jest (`**/*.test.ts`), and Prettier (`.`),
producing duplicate type checks and lint noise. Siblings avoid that without any
ignore-list hacks.

**Rejected alternatives:**

- *Five independent clones* — duplicated history, no shared branches, manual
  remote syncing.
- *npm workspaces / monorepo* — there is one Next.js application, not several.
- *Worktrees inside `repo\`* — breaks tooling as described above.

### 2.2 Single `node_modules`, shared by junction

Installed once in `repo\node_modules`; every worktree points to it with a
Windows junction. `.env` is a hardlink to `repo\.env`. `.vercel\` lives only in
`repo\`.

**Rationale:** saves ≈640 MB per worktree and guarantees one dependency tree.

### 2.3 One integration branch, `main` always deployable

- `feature/baliwild-explore-ui` is the **integration branch**.
- `feat/explore-airbnb-ui` is retired (its tip is an ancestor of the
  integration branch).
- `release/vX.Y.Z` is cut from the integration branch, verified, then merged to
  `main` through a pull request (squash).

**Rationale:** `main` had drifted 121 commits. Long-lived divergent integration
branches are the root cause of merge pain, so there must be exactly one.

### 2.4 Prisma client isolation

**Immediate rule:** run `npm run db:generate` after every branch switch or
schema change (documented in `DEVELOPMENT_WORKFLOW.md`).

**Planned permanent fix:** move the generated client out of the shared
`node_modules` into the worktree itself:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}
```

Then update the imports (15 files in `src/`, 7 in `prisma/` and `scripts/`),
add `src/generated/` to `.gitignore`, ESLint `ignorePatterns`, and a
`predev`/`prebuild`/`pretypecheck` hook so the client is always regenerated.

**Rationale:** each worktree then owns its generated client, so parallel
branches with different schemas can never produce phantom type errors.

**Impact if not done:** developers lose time on errors that do not exist,
and a wrong generated client can mask a real schema mismatch.

## 3. Consequences

- Disk usage of `D:\_Project` dropped from 4.7 GB to 2.9 GB.
- `npm run typecheck`, `npm run lint`, and `npm test` on `release/v1.1.0`
  pass (111 suites, 878 tests).
- Any new worktree must be created with `git worktree add` and given a
  `node_modules` junction plus an `.env` hardlink.
- The Prisma output change is still open work; until it lands, the
  `db:generate` rule is mandatory.

## 4. Migration record

| Step | Result |
| --- | --- |
| Primary moved to `venture-bali\repo` | done |
| `git worktree repair` | done |
| `growth`, `about`, `content-architect` moved to `worktrees\` | done |
| Three orphaned worktrees in the agent cache removed | done |
| Junctions and `.env` hardlinks created | done |
| `repo` switched to `main` | done |
| `release/v1.1.0` cut from the integration branch | done |
| `growth`, `about`, `content-architect` merged into `release/v1.1.0` | done |
