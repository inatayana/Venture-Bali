# 🤖 Agent Provisioning Prompt: New Brand Onboarding

> **Usage**: Copy this entire file content, paste ke AI agent (Claude, Cursor, Copilot, dll), replace placeholder `<BRAND_SLUG>`, `<BRAND_NAME>`, `<HEX_COLOR>`, dll, lalu enter. Agent akan eksekusi end-to-end.

---

## 🎯 Mission

**Provision brand baru di BaliWild Platform end-to-end** — dari DB provisioning hingga smoke test — tanpa manual intervention.

**Target**: Brand baru live dalam < 2 jam.

---

## 📋 Input Variables (ISI DULU)

```yaml
# === REQUIRED ===
BRAND_SLUG: "<brand-slug>"           # lowercase, alphanumeric + hyphen, e.g. "baliexperience"
BRAND_NAME: "<Brand Display Name>"   # e.g. "BaliExperience"
HEX_COLOR: "#<HEX>"                  # e.g. "#2E7D32"
LOGO_URL: "https://cdn.example.com/logos/<slug>.svg"  # optional, HTTPS, SVG

# === OPTIONAL (default akan dipakai jika kosong) ===
BRAND_SHORT_NAME: "<Short>"          # e.g. "BaliExp"
TAGLINE: "<Tagline>"                 # e.g. "Discover Authentic Bali"
DESCRIPTION: "<Description>"         # e.g. "Curated local experiences"
FAVICON_URL: "https://cdn.example.com/favicons/<slug>.ico"

# Payment (ISI VIA ENV VARS, JANGAN DI SINI)
# MIDTRANS_CLIENT_KEY, MIDTRANS_SERVER_KEY, GA_ID

# Categories (pilih subset dari core taxonomy)
CATEGORIES:
  - slug: "culture"
    name: "Culture & Heritage"
    short: "Culture"
    emoji: "🏛️"
    isActive: true
    sortOrder: 1
  - slug: "nature"
    name: "Nature & Adventure"
    short: "Nature"
    emoji: "🌿"
    isActive: true
    sortOrder: 2
  # tambah/kategoris sesuai kebutuhan
```

---

## ⚙️ Prerequisites Check (AGEN: CEK DULU)

```bash
# 1. Pastikan di root monorepo BaliWild
pwd  # harus di /path/to/venture-bali

# 2. Cek branch
git branch --show-current  # harus di main atau feature branch

# 3. Cek DB connection
npm run db:check  # atau npx prisma db execute --stdin <<< "SELECT 1;"

# 4. Cek Prisma client generated
npx prisma generate --dry-run 2>&1 | head -5

# 5. Cek ENV vars tersedia
# MIDTRANS_CLIENT_KEY, MIDTRANS_SERVER_KEY, GA_MEASUREMENT_ID
```

**Jika gagap, STOP dan report error. Jangan lanjut.**

---

## 🚀 Execution Steps (AGEN: EKSEKUSI BERURUTAN)

---

### STEP 1: Provision Tenant (15 min)

```bash
# 1.1 Generate tenant ID
TENANT_ID="tenant-${BRAND_SLUG}"

# 1.2 Execute SQL (pakai prisma db execute atau psql)
cat <<'SQL' | npx prisma db execute --stdin
INSERT INTO "Tenant" (id, domain, name, themeColor, logoUrl, isActive)
VALUES ('${TENANT_ID}', '${BRAND_SLUG}', '${BRAND_NAME}', '${HEX_COLOR}', '${LOGO_URL}', true)
ON CONFLICT (id) DO NOTHING;
SQL

# 1.3 Verify
npx prisma db execute --stdin <<< "SELECT id, domain, name, themeColor, isActive FROM \"Tenant\" WHERE id = '${TENANT_ID}';"
```

**Expected Output**: Record dengan `tenant-<slug>`, domain `<slug>`, name `<Brand Name>`, themeColor `<HEX>`, isActive=true.

---

### STEP 2: Generate & Validate Brand Config (10 min)

```bash
# 2.1 Generate config YAML dari template
cat > brand-config-${BRAND_SLUG}.yaml <<'YAML'
brand:
  name: "${BRAND_NAME}"
  shortName: "${BRAND_SHORT_NAME:-${BRAND_NAME}}"
  tagline: "${TAGLINE:-Discover Authentic Bali}"
  description: "${DESCRIPTION:-Curated local experiences by verified hosts}"
  logoUrl: "${LOGO_URL}"
  faviconUrl: "${FAVICON_URL}"

theme:
  primaryColor: "${HEX_COLOR}"
  secondaryColor: "#${HEX_COLOR:1}20"  # darker shade
  accentColor: "#${HEX_COLOR:1}80"      # lighter shade
  fontHeading: "Montserrat"
  fontBody: "Inter"
  borderRadius: "md"

categories:
  - slug: "culture"
    name: "Culture & Heritage"
    short: "Culture"
    emoji: "🏛️"
    description: "Temples, ceremonies, traditional arts"
    isActive: true
    sortOrder: 1
  - slug: "nature"
    name: "Nature & Adventure"
    short: "Nature"
    emoji: "🌿"
    description: "Waterfalls, rice terraces, volcanoes"
    isActive: true
    sortOrder: 2
  # ... tambahkan kategori lain sesuai input

pricing:
  currency:
    base: "IDR"
    display: ["IDR", "USD"]
    exchangeRate:
      USD: 15500
  rounding: "1000"
  minPriceIdr: 50000
  maxDiscountPercent: 40
  promoStacking: false
  couponStacking: false

booking:
  minAdvanceHours: 2
  maxAdvanceDays: 365
  cancellationPolicy:
    freeCancellationHours: 24
    refundPercentTiers:
      - hoursBefore: 24
        refundPercent: 80
      - hoursBefore: 12
        refundPercent: 50
      - hoursBefore: 0
        refundPercent: 0
  holdDurationMinutes: 15
  maxPaxPerBooking: 15
  requireWaiver: true
  waiverVersion: "1.0"

payment:
  midtrans:
    clientKey: "<FROM_ENV>"
    serverKey: "<FROM_ENV>"
    isProduction: false
    enabledMethods:
      - "credit_card"
      - "gopay"
      - "shopeepay"
      - "bank_transfer"
      - "qrris"
  manualTransfer:
    enabled: true
    bankAccounts:
      - bank: "BCA"
        accountNumber: "1234567890"
        accountName: "PT ${BRAND_NAME}"

communication:
  email:
    fromName: "${BRAND_NAME}"
    fromEmail: "hello@${BRAND_SLUG}.com"
    supportEmail: "support@${BRAND_SLUG}.com"
    helloEmail: "hello@${BRAND_SLUG}.com"
    partnersEmail: "partners@${BRAND_SLUG}.com"
  whatsapp:
    businessNumber: "+6281234567890"
  notifications:
    bookingConfirmation: true
    paymentReminder: true
    pickupReminder: true
    reviewRequest: true
    reviewRequestDelayHours: 24

seo:
  defaultTitle: "${BRAND_NAME} - Authentic Local Experiences"
  defaultDescription: "Discover authentic experiences through curated local adventures."
  ogImageUrl: "https://cdn.example.com/og/${BRAND_SLUG}.jpg"
  twitterHandle: "@${BRAND_SLUG}"
  googleAnalyticsId: "<FROM_ENV>"

features:
  aiContentGeneration: true
  reviewInvites: true
  couponCodes: true
  groupBooking: false
  giftCards: false
  loyaltyProgram: false
  multiLanguage: true
  pwa: true

localization:
  defaultLocale: "en"
  supportedLocales: ["en", "id"]
  dateFormat: "DD MMM YYYY"
  timeFormat: "HH:mm"
  numberFormat: "id-ID"

operations:
  timezone: "Asia/Makassar"
  businessHours:
    start: "08:00"
    end: "22:00"
    days: [0, 1, 2, 3, 4, 5, 6]
YAML

# 2.2 Validasi config
npm run brand:validate -- --config brand-config-${BRAND_SLUG}.yaml
# Expected: ✅ Valid brand configuration
```

---

### STEP 3: Apply Config to Database (2 min)

```bash
# Convert YAML ke JSON & escape
CONFIG_JSON=$(cat brand-config-${BRAND_SLUG}.yaml | yq -o=json | jq -c . | sed 's/"/\\"/g')

# Apply ke DB
npx prisma db execute --stdin <<SQL
UPDATE "Tenant" 
SET config = '${CONFIG_JSON}'::jsonb
WHERE id = 'tenant-${BRAND_SLUG}';
SQL

# Verify
npx prisma db execute --stdin <<SQL
SELECT id, config->>'brand' as brand_name, config->'theme'->>'primaryColor' as primary_color 
FROM "Tenant" WHERE id = 'tenant-${BRAND_SLUG}';
SQL
```

---

### STEP 4: Seed Data (3 min)

```bash
TENANT_ID=tenant-${BRAND_SLUG} npm run db:seed
# Expected: ✅ Created X ventures, Y variants, Z pickup zones, etc.
```

---

### STEP 5: DNS & SSL (Opsional, 10 min)

```bash
# Subdomain otomatis: ${BRAND_SLUG}.platform.example.com
# Custom domain (jika ada):
# 1. CNAME www.brandbaru.com -> cname.platform.example.com
# 2. A record brandbaru.com -> ALB IP
# 3. Update tenant domain:
npx prisma db execute --stdin <<SQL
UPDATE "Tenant" SET domain = 'brandbaru.com' WHERE id = 'tenant-${BRAND_SLUG}';
SQL
# SSL: Let's Encrypt auto (DNS-01 challenge, ~2 menit)
```

---

### STEP 6: Smoke Test (Wajib, 10 min)

```bash
# 1. Health
curl -s https://${BRAND_SLUG}.platform.example.com/api/v1/health | jq .

# 2. Ventures (tenant-scoped)
curl -s -H "X-Tenant-ID: tenant-${BRAND_SLUG}" \
  https://api.example.com/api/v1/ventures | jq '.data.items | length'

# 3. Brand colors di CSS vars
curl -s https://${BRAND_SLUG}.platform.example.com/ | grep -o '--brand-primary:[^;]*'

# 4. Booking flow (dry run)
curl -X POST https://${BRAND_SLUG}.platform.example.com/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant-${BRAND_SLUG}" \
  -d '{
    "variantId": "<variant-id-from-step-2>",
    "bookingDate": "'$(date -d '+7 days' +%Y-%m-%d)'",
    "slotTimeId": "<slot-id>",
    "fulfillmentMode": "SELF_DRIVE",
    "paxCount": 2,
    "customer": {"email":"test@${BRAND_SLUG}.com","name":"Test User","countryCode":"ID","whatsapp":"+6281234567890"}
  }' | jq .

# 4b. Jika booking sukses, test payment
# curl -X POST .../api/v1/payment/midtrans -d '{"bookingId":"<id>"}'

# 5. Frontend load
curl -s -o /dev/null -w "%{http_code}" https://${BRAND_SLUG}.platform.example.com/
# Expected: 200
```

**PASS Criteria**: Semua curl return 200, data tenant-scoped, brand colors benar, booking+payment flow jalan.

---

### STEP 6: Post-Provision Verification (2 min)

```bash
# 1. Verify tenant config
curl -s -H "X-Tenant-ID: tenant-${BRAND_SLUG}" \
  https://api.example.com/api/v1/ventures | jq '.data.items[0] | {id, title, category}'

# 2. Verify brand config applied
curl -s -H "X-Tenant-ID: tenant-${BRAND_SLUG}" \
  https://api.example.com/api/v1/health | jq '.tenant'

# 3. Cleanup temp files
rm brand-config-${BRAND_SLUG}.yaml
```

---

## ✅ DONE - Sign Off

```
===========================================
BRAND PROVISIONING COMPLETE
===========================================
Brand: ${BRAND_NAME} (tenant-${BRAND_SLUG})
Domain: ${BRAND_SLUG}.platform.example.com
Custom Domain: <jika ada>
Theme Color: ${HEX_COLOR}
Categories: <count> active
Status: ✅ LIVE
Provisioned: $(date -u +"%Y-%m-%d %H:%M UTC")
Agent: <AI agent name>
===========================================
```

---

## 🔄 Rollback Plan (Jika Gagal)

```bash
# 1. Hapus tenant
npx prisma db execute --stdin <<SQL
DELETE FROM "Tenant" WHERE id = 'tenant-${BRAND_SLUG}';
SQL

# 2. Hapus seeded data (cascade via FK)
# Prisma handle cascade, tapi verify:
npx prisma db execute --stdin <<SQL
SELECT COUNT(*) FROM "Venture" WHERE "tenantId" = 'tenant-${BRAND_SLUG}';
SQL
# Expected: 0
```

---

## 📝 Agent Notes

- **Jangan pernah** commit API keys, secrets, real customer data
- **Selalu** gunakan `X-Tenant-ID` header untuk API calls
- **Validasi** setiap step sebelum lanjut
- **Log** setiap step output untuk audit trail
- **Rollback** plan siap sebelum step beresiko (DB write)

---

## 📚 Reference Docs (Available in Context)

| Doc | Purpose |
|-----|---------|
| `docs/BRAND_ADAPTATION_GUIDE.md` | Full step-by-step guide |
| `docs/MULTI_TENANCY_GUIDE.md` | Architecture reference |
| `docs/EXTENSION_POINTS.md` | Hook contracts |
| `docs/PLATFORM_CONSTITUTION.md` | Governance rules |

---

## 📝 Version

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-11-05 | Initial version |

---

> **Note to Agent**: This prompt is self-contained. Execute sequentially. Report any deviation immediately. Do not skip validation steps.