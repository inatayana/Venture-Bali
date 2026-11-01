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