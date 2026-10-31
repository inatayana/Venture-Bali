# Venture Bali — Deployment Strategy

> **Version:** 1.0.0
> **Last Updated:** October 2026
> **Status:** ACTIVE — Follow for all deployments

---

## 1. Overview

This document defines the deployment strategy for Venture Bali across two phases:
- **Phase 1 (Current):** Vercel Free Tier + Supabase Cloud
- **Phase 2 (Future):** Hostinger VPS + Supabase Cloud

The application codebase remains **identical** — only the deployment target changes.

---

## 2. Phase 1: Vercel + Supabase (Current)

### 2.1 Architecture
```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   GitHub    │────▶│     Vercel       │────▶│     Supabase     │
│  (main)     │     │  (Node.js SSR)   │     │  (PostgreSQL,    │
└─────────────┘     │  API Routes      │     │   Auth, Storage) │
                    └──────────────────┘     └──────────────────┘
```

### 2.2 Vercel Configuration

**Project Settings:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm ci`
- Node.js Version: 22.x (LTS) — required by `prisma db seed` (native TypeScript stripping)

**Environment Variables (Vercel Dashboard → Settings → Environment Variables):**

| Variable | Environment | Value Source |
|----------|-------------|--------------|
| `DATABASE_URL` | Production, Preview, Development | Supabase → Settings → Database → Connection Pooling (Transaction Mode) |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Supabase → Settings → API → service_role key |
| `MIDTRANS_SERVER_KEY` | Production | Midtrans Dashboard → Settings → Server Key |
| `MIDTRANS_CLIENT_KEY` | All | Midtrans Dashboard → Settings → Client Key |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | All | Same as `MIDTRANS_CLIENT_KEY` |
| `MIDTRANS_IS_PRODUCTION` | Production | `true` |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | All | `true` (prod) / `false` (sandbox) |
| `GEMINI_API_KEY` | Production, Preview | Google AI Studio |
| `TELEGRAM_BOT_TOKEN` | Production | BotFather |
| `WHATSAPP_ACCESS_TOKEN` | Production | Meta Business Manager |
| `WHATSAPP_PHONE_NUMBER_ID` | Production | Meta Business Manager |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Production | Meta Business Manager |
| `WHATSAPP_API_VERSION` | All | `v18.0` |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Production | Random string (configure in Meta) |
| `EXCHANGERATE_API_KEY` | Production | exchangerate.host or similar |
| `NEXT_PUBLIC_APP_URL` | All | `https://your-domain.vercel.app` or custom domain |

### 2.3 Supabase Configuration

**Project Setup:**
1. Create Supabase project at https://supabase.com
2. Note Project Ref (e.g., `abcdefghijklmnop`)
3. Go to Settings → Database → Connection Pooling
   - Enable **Transaction Mode** (port 6543)
   - Copy connection string
4. Go to Settings → API
   - Copy Project URL, anon key, service_role key
5. Go to Storage → Create bucket `venture-assets` (public)
6. Go to Authentication → Providers → Enable Email, Google, Apple
7. Go to SQL Editor → Run Prisma migrations (see §2.5)

### 2.4 Database Migrations on Vercel

**Option A: GitHub Actions (Recommended)**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Option B: Vercel Build Hook (Simpler)**
- Add `prisma migrate deploy` to `build` script in `package.json`:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```
- Ensure `DATABASE_URL` is set in Vercel Environment Variables

### 2.5 Running Migrations

**Local Development:**
```bash
# Generate Prisma Client
npm run db:generate  # or: npx prisma generate

# Create migration
npm run db:migrate   # or: npx prisma migrate dev --name <name>

# Push schema without migration (dev only)
npm run db:push      # or: npx prisma db push
```

**Production (Vercel):**
- Automatic via GitHub Actions (Option A) or build script (Option B)
- Or manual: `npx prisma migrate deploy` with production `DATABASE_URL`

### 2.6 Domain Configuration

**Vercel-Managed Domain:**
1. Vercel Dashboard → Project → Settings → Domains
2. Add custom domain (e.g., `venturebali.com`)
3. Configure DNS at registrar:
   - A record: `@` → `76.76.21.21` (Vercel IP)
   - CNAME: `www` → `cname.vercel-dns.com`

**Hostinger Domain (if domain registered there):**
1. Hostinger hPanel → Domains → Manage → DNS Zone
2. Add same records as above
3. Or transfer domain to Vercel (optional)

### 2.7 Webhook URLs for External Services

| Service | Webhook URL (Production) | Webhook URL (Preview) |
|---------|--------------------------|----------------------|
| Midtrans | `https://your-domain.vercel.app/api/webhooks/midtrans` | `https://<preview>.vercel.app/api/webhooks/midtrans` |
| WhatsApp | `https://your-domain.vercel.app/api/webhooks/whatsapp` | Same pattern |
| Telegram | `https://your-domain.vercel.app/api/webhooks/telegram` | Same pattern |

Configure these in respective provider dashboards.

### 2.8 Vercel Limits (Free Tier)
| Resource | Limit | Notes |
|----------|-------|-------|
| Bandwidth | 100 GB/month | Sufficient for ~100k visits |
| Serverless Function Execution | 100 GB-hours/month | API routes, SSR |
| Build Time | 6,000 min/month | ~100 builds |
| Edge Functions | Unlimited | For middleware |
| Custom Domains | Unlimited | |

Monitor at: Vercel Dashboard → Project → Analytics → Usage

---

## 3. Phase 2: Hostinger VPS (Future Migration)

### 3.1 When to Migrate
- Vercel Free Tier limits exceeded (bandwidth, build minutes, function execution)
- Need for full server control (custom Nginx, Redis, background workers)
- Regulatory requirement for data residency in Indonesia
- Cost optimization at scale (VPS may be cheaper than Vercel Pro)

### 3.2 VPS Specification (Recommended)
| Spec | Minimum | Recommended |
|------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 80 GB SSD | 160 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Network | 1 Gbps | 1 Gbps |

**Hostinger VPS Plans:** KVM 2 or KVM 4 (approx. $7-15/month)

### 3.3 Server Setup Checklist

**Initial Server Setup:**
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Create deploy user
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo su - deploy

# 3. Install Node.js 22 (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2 globally
sudo npm install -g pm2

# 5. Install Nginx
sudo apt install -y nginx

# 6. Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

**Application Deployment:**
```bash
# 1. Clone repository
cd /home/deploy
git clone https://github.com/inatayana/Venture-Bali.git
cd Venture-Bali

# 2. Install dependencies
npm ci

# 3. Generate Prisma Client
npx prisma generate

# 4. Run migrations
npx prisma migrate deploy

# 5. Build Next.js
npm run build

# 6. Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'venture-bali',
    script: 'npm',
    args: 'start',
    cwd: '/home/deploy/Venture-Bali',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# 7. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Nginx Configuration:**
```nginx
# /etc/nginx/sites-available/venture-bali
server {
    listen 80;
    server_name venturebali.com www.venturebali.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for SSE/long-polling
        proxy_read_timeout 86400;
    }

    # Static assets caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /images/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/venture-bali /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**SSL with Certbot:**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d venturebali.com -d www.venturebali.com
# Select "Redirect HTTP to HTTPS"
```

### 3.4 Environment Variables on VPS
Create `/home/deploy/Venture-Bali/.env`:
```bash
# Copy from .env.example and fill real values
cp .env.example .env
nano .env  # Edit with real values
```

**Required Variables (same as Vercel):**
- `DATABASE_URL` (Supabase Transaction Pooler)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION=true`
- `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true`
- `GEMINI_API_KEY`
- `TELEGRAM_BOT_TOKEN`
- `WHATSAPP_*`
- `EXCHANGERATE_API_KEY`
- `NEXT_PUBLIC_APP_URL=https://venturebali.com`

### 3.5 CI/CD for VPS (GitHub Actions)
```yaml
# .github/workflows/deploy-vps.yml
name: Deploy to Hostinger VPS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/deploy/Venture-Bali
            git pull origin main
            npm ci
            npx prisma generate
            npx prisma migrate deploy
            npm run build
            pm2 reload venture-bali
```

### 3.6 Monitoring on VPS
- **PM2 Monitoring:** `pm2 monit` or PM2 Plus (free tier)
- **Nginx Logs:** `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **System:** `htop`, `df -h`, `free -h`
- **Uptime:** UptimeRobot (free) or Better Stack

### 3.7 Rollback Procedure
```bash
# Quick rollback to previous PM2 deployment
pm2 list
pm2 restart venture-bali --update-env  # if env changed
# Or git revert + rebuild:
cd /home/deploy/Venture-Bali
git revert HEAD
npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
pm2 reload venture-bali
```

---

## 4. Supabase Migration (If Needed)

If migrating database from Supabase to self-hosted PostgreSQL:

1. **Dump from Supabase:**
```bash
pg_dump -h db.<ref>.supabase.co -p 5432 -U postgres -d postgres \
  --no-owner --no-acl --clean --if-exists > venture-backup.sql
```

2. **Restore to Self-Hosted:**
```bash
psql -h localhost -U postgres -d venture_bali < venture-backup.sql
```

3. **Update `DATABASE_URL`** in deployment to point to new PostgreSQL instance.

---

## 5. Disaster Recovery

| Scenario | Recovery Action |
|----------|-----------------|
| Vercel deployment fails | Check build logs, fix locally, push fix |
| Database migration fails | `prisma migrate resolve --rolled-back <migration>` then fix |
| Supabase outage | Wait for Supabase recovery (SLA 99.9%); cached data serves reads |
| VPS disk full | `docker system prune`, `npm cache clean`, remove old PM2 logs |
| SSL certificate expired | `sudo certbot renew --nginx` |
| Domain not resolving | Check DNS propagation, Vercel/Hostinger DNS settings |

---

## 6. Checklist for Every Deployment

### Pre-Deployment
- [ ] All tests pass locally (`npm run lint && npm run typecheck && npm test`)
- [ ] No uncommitted secrets in code
- [ ] `DATABASE_URL` uses correct environment (preview vs production)
- [ ] Midtrans webhook URLs updated for new preview deployment (if applicable)

### Post-Deployment
- [ ] Homepage loads (`/`)
- [ ] Product detail page loads (`/experiences/[id]/[slug]`)
- [ ] Checkout flow works (test with Midtrans Sandbox)
- [ ] Webhook endpoints respond (check Vercel/VPS logs)
- [ ] Supabase connection healthy (check dashboard)
- [ ] SSL certificate valid (check browser)

---

## 7. Related Documents

| Document | Purpose |
|----------|---------|
| `docs/TECH_DECISION_LOG.md` | Why these technologies |
| `docs/PROJECT_STRUCTURE.md` | Code organization |
| `docs/DEVELOPMENT_WORKFLOW.md` | Git workflow |
| `AGENTS.md` | Agent rules |
| `prisma/schema.prisma` | Database schema |
| `.env.example` | Environment template |

---

**Approved by:** Venture Bali Engineering Team
**Date:** October 2026
**Next Review:** When migrating to VPS or quarterly