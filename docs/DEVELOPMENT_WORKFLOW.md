# BaliWild - Development Workflow

> **Version:** 1.0.0
> **Last Updated:** August 27, 2026

## 1. Git Workflow

We use **GitHub Flow** for continuous delivery.

### Branch Strategy

| Branch | Purpose | Protection | Auto-deploy |
|--------|---------|------------|-------------|
| `main` | Production code | Protected | Yes |
| `staging` | Pre-production | Protected | Yes |
| `feature/*` | New features | Not protected | No |
| `bugfix/*` | Bug fixes | Not protected | No |
| `hotfix/*` | Critical fixes | Not protected | Yes (emergency) |
| `release/*` | Release prep | Not protected | Yes |

### Branch Naming

- Features: `feature/short-desc` (e.g. `feature/refund-policy`)
- Bug fixes: `bugfix/issue-number-desc`
- Hotfixes: `hotfix/issue-number-desc`
- Releases: `release/vX.Y.Z`

### Basic Steps
1. Create branch from `main`
2. Develop with frequent commits
3. Open PR targeting `main` (or `staging`)
4. Code review with minimum 1 approval
5. Automated checks (lint, type-check, tests)
6. Merge via "Squash and merge"
7. Delete branch after merge

## 2. Local Build Output Directories

| Command | Output directory | Purpose |
|---------|------------------|---------|
| `npm run dev` | `.next-dev` | Hot reload, never deployed |
| `npm run build` + `npm start` | `.next` | Production build (Vercel / VPS) |

`next.config.js` selects `distDir` per Next.js phase, so the dev server and a
production server can run at the same time without touching each other's files.

**Never** point both at the same directory. `next dev` rewrites `.next` on
startup; a production server booted from that directory then answers HTTP 500 on
every route with `Could not find a production build in the '.next' directory`.

```bash
# Production build + server (keeps Vercel's expected `.next` output)
npm run build
npm start -- -p 3001

# Dev server, in parallel (writes to `.next-dev`)
npm run dev -- -p 3002
```

Both output directories are git-ignored.

## 3. Parallel Work with Git Worktrees

We develop several branches at once with **git worktrees**, not separate clones.
All worktrees share one repository and one history.

### Layout

```
D:\_Project\venture-bali\            # container (not a repository)
├─ repo\                             # primary worktree — branch: main
│  ├─ .git\                          # the only real repository
│  ├─ .env / .env.local              # single source of environment
│  ├─ .vercel\                       # deploy only from here
│  └─ node_modules\                  # single install
├─ worktrees\
│  ├─ integration\                   # release candidate
│  ├─ growth\
│  ├─ about\
│  └─ content-architect\
└─ README.md
```

### Rules

1. **Never** put a worktree inside `repo\`. Worktrees must be siblings of
   `repo\` under `worktrees\`. Otherwise `tsc`, Jest, ESLint, and Prettier scan
   duplicate `src/` trees from other branches.
2. `node_modules` is installed **once** in `repo\`. Every worktree uses a
   junction to `repo\node_modules`. Do not run `npm install` inside a worktree.
3. `.env` is a **hardlink** to `repo\.env`. Never create a separate `.env` per
   worktree.
4. `.vercel\` exists only in `repo\`. Deploy only from there.
5. Keep at most **2–3 active worktrees**. Remove finished ones.

### Commands

```bash
git -C D:\_Project\venture-bali\repo worktree list
git -C D:\_Project\venture-bali\repo worktree add `
  D:\_Project\venture-bali\worktrees\<name> <branch>
git -C D:\_Project\venture-bali\repo worktree move <from> <to>
git -C D:\_Project\venture-bali\repo worktree remove <path>
git -C D:\_Project\venture-bali\repo worktree repair   # after moving folders
```

### Windows warning

Deleting a `node_modules` junction with `Remove-Item -Recurse` also deletes the
**target** contents. Use:

```powershell
(Get-Item -LiteralPath $path -Force).Delete()
```

## 4. Prisma Client and Branch Switching

`prisma generate` writes a client into the shared `node_modules`. If two
worktrees use different `prisma/schema.prisma` versions, the generated client
only matches the branch that generated it last. Switching branches without
regenerating produces **phantom type errors** (for example a Prisma enum that
has more values than the TypeScript union in `src/types/venture.ts`).

**Mandatory:** after any branch switch, schema change, or `git pull` that touches
`prisma/`, run:

```bash
npm run db:generate
```

See `docs/ADR_WORKSPACE_AND_PRISMA.md` for the planned permanent fix
(per-worktree Prisma client output).