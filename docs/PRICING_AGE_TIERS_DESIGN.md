# Desain Sistem Pricing Berjenjang Umur (Age-Tiered Pricing)

> **Version:** 1.0.0
> **Status:** DRAFT — untuk review Owner sebelum implementasi
> **Tanggal:** 3 November 2026
> **Author:** Senior UI/UX & Audit Orchestrator
> **Related:** `docs/BOOKING_ARCHITECTURE.md`, `docs/UI_UX_DESIGN_SYSTEM.md`, `prisma/schema.prisma`, `src/lib/pricing.ts`

---

## 1. Ringkasan Eksekutif

**Tujuan:** Mendukung dua model pricing yang koeksistensi di BaliWild:

| Model | Nama Internal | Kapan Dipakai | Contoh |
|-------|---------------|---------------|--------|
| **Flat per Guest** | `FLAT_PER_GUEST` | Semua aktivitas standar (ATV, rafting, tubing, trekking). Harga sama untuk semua umur. | ATV Ubud — Rp 550.000/orang (dewasa & anak sama). |
| **Tiered by Age** | `AGE_TIERED` | Varian yang **include transfer** (SHARED_TRANSFER / PRIVATE_TRANSFER). Harga berbeda per kelompok umur. | Paket Rafting + Hotel Pickup — Kids Rp 450.000, Youth Rp 550.000, Adult Rp 650.000. |

**Aturan Bisnis Tambahan:**
- **Add-ons** selalu `FLAT_PER_GUEST` (dikenakan per orang yang booking add-on).
- **Batasan Umur** (validasi di frontend + backend):
  - Kids: 3–10 tahun (wajib diampingi dewasa)
  - Youth: 11–16 tahun
  - Adult: 17–75 tahun
- **Minimum 1 Adult** per booking (validasi existing).
- **Transfer pricing** (zona, vehicle class, night surcharge) tetap dihitung **per pax total** (tidak per tier umur) — sesuai arsitektur `calculateTransferFee` / `calculateSharedTransferFee` yang sudah ada.

---

## 2. Perubahan Data Model

### 2.1 Prisma Schema — `PriceTier` (extend)

```prisma
model PriceTier {
  id          String       @id @default(cuid())
  minPax      Int
  maxPax      Int
  pricePerPax Int          // Base price per pax (untuk FLAT_PER_GUEST, atau harga Adult untuk AGE_TIERED)
  
  // NEW: Age-tiered pricing fields (nullable = FLAT_PER_GUEST)
  pricingModel      PricingModel    @default(FLAT_PER_GUEST)
  kidsPricePerPax   Int?            // Harga Kids (3-10 th) — wajib jika AGE_TIERED
  youthPricePerPax  Int?            // Harga Youth (11-16 th) — wajib jika AGE_TIERED
  // Adult price = pricePerPax (existing field)
  
  variantId   String
  variant     Variant @relation("VariantToPriceTier", fields: [variantId], references: [id], onDelete: Cascade)

  @@index([variantId])
}

enum PricingModel {
  FLAT_PER_GUEST
  AGE_TIERED
}
```

**Migrasi:** `pricingModel` default `FLAT_PER_GUEST` → data existing tidak berubah. Field baru nullable.

### 2.2 TypeScript Types — `src/types/venture.ts`

```typescript
export type PricingModel = 'FLAT_PER_GUEST' | 'AGE_TIERED';

export interface PriceTier {
  minPax: number;
  maxPax: number;
  pricePerPax: number;           // Adult price (base)
  pricingModel?: PricingModel;   // default FLAT_PER_GUEST
  kidsPricePerPax?: number;      // required if AGE_TIERED
  youthPricePerPax?: number;     // required if AGE_TIERED
}
```

### 2.3 BookingConfig — `src/components/features/ExperienceBookingWidget.tsx`

```typescript
export interface BookingConfig {
  // Existing
  adults: number;
  date: string | null;
  slotTime: string | null;
  fulfillmentMode: FulfillmentMode;
  pickupZoneId: string | null;
  vehicleClassId: string | null;
  hotelAddress: string;
  promoCode: string;
  selectedAddons: string[];
  // NEW: Age-tiered passengers
  kids: number;      // 3-10 th
  youth: number;     // 11-16 th
  // Derived
  totalPax: number;  // adults + kids + youth (computed)
}
```

### 2.4 Booking Model (Prisma) — tambah field

```prisma
model Booking {
  // ... existing fields ...
  paxCount           Int      // TOTAL pax (adults + kids + youth) — existing
  adultsCount        Int      @default(0)  // NEW
  kidsCount          Int      @default(0)  // NEW
  youthCount         Int      @default(0)  // NEW
  // paxCount = adultsCount + kidsCount + youthCount (application-level invariant)
}
```

---

## 3. Perubahan Logika Pricing (`src/lib/pricing.ts`)

### 3.1 Interface Baru

```typescript
export interface AgeTieredPriceBreakdown {
  adults:   { count: number; pricePerPax: number; subtotal: number };
  kids:     { count: number; pricePerPax: number; subtotal: number };
  youth:    { count: number; pricePerPax: number; subtotal: number };
  totalPax: number;
  subtotal: number;
}

export interface QuoteInput {
  // ... existing ...
  // NEW: age breakdown (required if variant uses AGE_TIERED)
  adultsCount?: number;
  kidsCount?: number;
  youthCount?: number;
}
```

### 3.2 Fungsi Baru: `calculateAgeTieredBreakdown`

```typescript
/**
 * Menghitung breakdown harga untuk pricing model AGE_TIERED.
 * Dipanggil dari computeQuote saat tier.pricingModel === 'AGE_TIERED'.
 */
export function calculateAgeTieredBreakdown(
  tier: PriceTier,
  adults: number,
  kids: number,
  youth: number
): AgeTieredPriceBreakdown {
  if (tier.pricingModel !== 'AGE_TIERED') {
    throw new Error('Tier is not AGE_TIERED');
  }
  if (tier.kidsPricePerPax === undefined || tier.youthPricePerPax === undefined) {
    throw new Error('AGE_TIERED tier missing kids/youth prices');
  }

  const adultsSubtotal = tier.pricePerPax * adults;        // pricePerPax = adult price
  const kidsSubtotal   = tier.kidsPricePerPax * kids;
  const youthSubtotal  = tier.youthPricePerPax * youth;

  return {
    adults:   { count: adults, pricePerPax: tier.pricePerPax, subtotal: adultsSubtotal },
    kids:     { count: kids,   pricePerPax: tier.kidsPricePerPax,   subtotal: kidsSubtotal },
    youth:    { count: youth,  pricePerPax: tier.youthPricePerPax,  subtotal: youthSubtotal },
    totalPax: adults + kids + youth,
    subtotal: adultsSubtotal + kidsSubtotal + youthSubtotal,
  };
}
```

### 3.3 Update `computeQuote` — logika percabangan

```typescript
export function computeQuote(input: QuoteInput): QuoteBreakdown {
  const { priceTiers, paxCount, fulfillmentMode } = input;
  const tier = getPriceTierForPax(priceTiers, paxCount);  // paxCount = total pax

  // NEW: Deteksi pricing model
  const isAgeTiered = tier.pricingModel === 'AGE_TIERED';
  const { adultsCount = 0, kidsCount = 0, youthCount = 0 } = input;
  const totalPaxFromAges = adultsCount + kidsCount + youthCount;

  if (isAgeTiered) {
    // Validasi: total pax dari age breakdown harus sama dengan paxCount
    if (totalPaxFromAges !== paxCount) {
      throw new Error('Age breakdown total does not match paxCount');
    }
    // Hitung pakai age-tiered breakdown
    const ageBreakdown = calculateAgeTieredBreakdown(tier, adultsCount, kidsCount, youthCount);
    // ... lanjut hitung promo, coupon, transfer, addons sama seperti existing
    // transfer & addons dihitung per totalPax (bukan per tier umur)
    // night surcharge per totalPax
    // minimum spend per total
  } else {
    // EXISTING LOGIC (FLAT_PER_GUEST) — tidak berubah
  }
}
```

**Poin Kunci:**
- `paxCount` tetap **total pax** (dipakai untuk capacity check slot, vehicle count, transfer fee).
- `adultsCount + kidsCount + youthCount` **harus sama** dengan `paxCount` (validasi ganda frontend + backend).
- **Transfer fee & addons** tetap dihitung per `totalPax` (bukan per kelompok umur) — sesuai permintaan Anda "add-on biasanya kena /guest".
- **Night surcharge** per `totalPax`.

---

## 4. Perubahan UI — ExperienceBookingWidget

### 4.1 Stepper Umur (Plan Step)

```tsx
// Di ExperienceBookingWidget.tsx, Plan step
<div className="space-y-4">
  {/* Adults (existing) */}
  <Stepper
    label="Dewasa (17-75 th)"
    value={config.adults}
    onChange={(v) => onChange({ adults: v })}
    min={1}
    max={maxPax}
    helpText="Minimal 1 dewasa per booking"
  />

  {/* NEW: Kids */}
  <Stepper
    label="Anak-anak (3-10 th)"
    value={config.kids}
    onChange={(v) => onChange({ kids: v })}
    min={0}
    max={maxPax - config.adults - config.youth}
    helpText="Wajib diampingi minimal 1 dewasa"
  />

  {/* NEW: Youth */}
  <Stepper
    label="Remaja (11-16 th)"
    value={config.youth}
    onChange={(v) => onChange({ youth: v })}
    min={0}
    max={maxPax - config.adults - config.kids}
  />

  {/* Derived total — read only */}
  <div className="text-sm text-neutral-600">
    Total tamu: <strong>{config.adults + config.kids + config.youth}</strong> / {maxPax}
  </div>
</div>
```

### 4.2 Validasi Real-time

```typescript
// Di onChange / useEffect
const totalPax = adults + kids + youth;
const maxPax = tier.maxPax;
const minPax = tier.minPax;

const errors = [];
if (adults < 1) errors.push('Minimal 1 dewasa');
if (kids > 0 && adults < 1) errors.push('Anak-anak wajib diampingi dewasa');
if (totalPax < minPax) errors.push(`Minimal ${minPax} tamu`);
if (totalPax > maxPax) errors.push(`Maksimal ${maxPax} tamu`);
```

### 4.3 Ringkasan Harga (Plan Step & Details Step)

```tsx
// Price breakdown display
{isAgeTiered && (
  <div className="space-y-1 text-sm">
    <div className="flex justify-between">
      <span>Dewasa ({adults})</span>
      <span>{formatPrice(adultPrice * adults)}</span>
    </div>
    {kids > 0 && (
      <div className="flex justify-between">
        <span>Anak-anak ({kids})</span>
        <span>{formatPrice(kidsPrice * kids)}</span>
      </div>
    )}
    {youth > 0 && (
      <div className="flex justify-between">
        <span>Remaja ({youth})</span>
        <span>{formatPrice(youthPrice * youth)}</span>
      </div>
    )}
    <div className="flex justify-between border-t pt-1">
      <span>Subtotal aktivitas</span>
      <span>{formatPrice(activitySubtotal)}</span>
    </div>
  </div>
)}
```

---

## 5. Admin — Variant Editor

### 5.1 Form PriceTier (VariantPackageEditor)

```tsx
// Di VariantPackageEditor.tsx — per PriceTier row
<div className="grid gap-4">
  <select value={tier.pricingModel} onChange={...}>
    <option value="FLAT_PER_GUEST">Flat per Guest (semua umur sama)</option>
    <option value="AGE_TIERED">Berjenjang Umur (Kids / Youth / Adult)</option>
  </select>

  {tier.pricingModel === 'FLAT_PER_GUEST' && (
    <input label="Harga per Tamu (IDR)" value={tier.pricePerPax} ... />
  )}

  {tier.pricingModel === 'AGE_TIERED' && (
    <div className="grid gap-3 sm:grid-cols-3">
      <input label="Harga Dewasa (17-75 th)" value={tier.pricePerPax} required ... />
      <input label="Harga Anak (3-10 th)" value={tier.kidsPricePerPax} required ... />
      <input label="Harga Remaja (11-16 th)" value={tier.youthPricePerPax} required ... />
    </div>
  )}
</div>
```

**Validasi Admin:**
- `AGE_TIERED` → `kidsPricePerPax` & `youthPricePerPax` **wajib > 0**.
- `kidsPricePerPax` ≤ `pricePerPax` (adult) — opsional tapi disarankan warning.
- `youthPricePerPax` ≤ `pricePerPax` — opsional.

---

## 6. AI Agent Tools (`src/lib/tools.ts`)

```typescript
// calculatePrice tool — extend parameter
interface CalculatePriceArgs {
  productId: string;
  variantId: string;
  paxCount: number;           // total pax (existing)
  adultsCount?: number;       // NEW
  kidsCount?: number;         // NEW
  youthCount?: number;        // NEW
  fulfillmentMode: FulfillmentMode;
  // ...
}

// Response
interface CalculatePriceResult {
  // existing...
  ageBreakdown?: {
    adults:   { count: number; pricePerPax: number; subtotal: number };
    kids:     { count: number; pricePerPax: number; subtotal: number };
    youth:    { count: number; pricePerPax: number; subtotal: number };
  };
}
```

---

## 7. API & Booking Persistence

### 7.1 Payload Booking (createBooking / API)

```typescript
interface CreateBookingPayload {
  // existing...
  paxCount: number;        // total (required)
  adultsCount: number;     // NEW required
  kidsCount: number;       // NEW required (default 0)
  youthCount: number;      // NEW required (default 0)
  // invariant: adultsCount + kidsCount + youthCount === paxCount
}
```

### 7.2 Server-side Validation (API route / booking service)

```typescript
function validateBookingPayload(payload: CreateBookingPayload) {
  const { paxCount, adultsCount, kidsCount, youthCount } = payload;
  if (adultsCount + kidsCount + youthCount !== paxCount) {
    throw new Error('Age breakdown total does not match paxCount');
  }
  if (adultsCount < 1) throw new Error('Minimal 1 adult required');
  // ... existing validations
}
```

---

## 8. Voucher & E-Voucher

- Voucher menampilkan **breakdown umur** jika `AGE_TIERED`:
  - "Dewasa: 2 × Rp 650.000"
  - "Anak-anak: 1 × Rp 450.000"
  - "Total: 3 tamu — Rp 1.750.000"
- PDF e-voucher: tambahkan baris breakdown di tabel harga.

---

## 9. Email Transaksional

- Konfirmasi booking: sertakan breakdown umur.
- Template email baru `booking-confirmed-age-tiered` (atau extend template existing dengan kondisional).

---

## 10. Migrasi Database (Prisma)

```bash
# 1. Tambah field ke PriceTier
# 2. Tambah field ke Booking (adultsCount, kidsCount, youthCount)
# 3. Backfill data existing:
#    - Semua PriceTier lama → pricingModel = FLAT_PER_GUEST
#    - Semua Booking lama → adultsCount = paxCount, kidsCount = 0, youthCount = 0
```

```sql
-- Contoh migrasi SQL (generate via prisma migrate dev)
ALTER TABLE "PriceTier" ADD COLUMN "pricingModel" TEXT NOT NULL DEFAULT 'FLAT_PER_GUEST';
ALTER TABLE "PriceTier" ADD COLUMN "kidsPricePerPax" INTEGER;
ALTER TABLE "PriceTier" ADD COLUMN "youthPricePerPax" INTEGER;

ALTER TABLE "Booking" ADD COLUMN "adultsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "kidsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "youthCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill
UPDATE "PriceTier" SET "pricingModel" = 'FLAT_PER_GUEST' WHERE "pricingModel" IS NULL;
UPDATE "Booking" SET "adultsCount" = "paxCount", "kidsCount" = 0, "youthCount" = 0;
```

---

## 11. Testing Checklist

| Area | Test Case |
|------|-----------|
| **Pricing Engine** | `calculateAgeTieredBreakdown` — kombinasi dewasa/anak/remaja berbagai jumlah |
| | `computeQuote` FLAT_PER_GUEST → hasil sama dengan existing (regression) |
| | `computeQuote` AGE_TIERED + promo + coupon + transfer + addons |
| | Validasi `adults + kids + youth === paxCount` (frontend + backend) |
| | Transfer fee dihitung per totalPax (bukan per tier umur) |
| | Add-ons dihitung per totalPax |
| | Night surcharge per totalPax |
| **UI** | Stepper dewasa/anak/remaja — min/max benar, total real-time |
| | Validasi minimal 1 dewasa, anak wajib diampingi dewasa |
| | Ringkasan harga menampilkan breakdown umur saat AGE_TIERED |
| | Switch variant FLAT ↔ AGE_TIERED → UI reset benar |
| **Admin** | Form PriceTier: toggle pricing model, validasi required fields |
| | Variant dengan booking existing tidak bisa dihapus (existing guard) |
| **AI Agent** | `calculatePrice` tool return ageBreakdown saat AGE_TIERED |
| **Booking Persist** | Payload dengan age breakdown tersimpan ke Booking model |
| | Invariant `adultsCount + kidsCount + youthCount = paxCount` terjamin |
| **Voucher/Email** | Breakdown umur muncul di voucher & email saat AGE_TIERED |

---

## 12. Rollout Plan (Fase Implementasi)

| Fase | Cakupan | Branch |
|------|---------|--------|
| **1. Data Model & Pricing Engine** | Prisma migrate, `pricing.ts` core logic, types | `feature/pricing-age-tiers-core` |
| **2. UI Booking Widget** | Stepper umur, validasi, ringkasan harga breakdown | `feature/pricing-age-tiers-ui` |
| **3. Admin Variant Editor** | Form PriceTier dengan toggle pricing model | `feature/pricing-age-tiers-admin` |
| **4. Booking Persistence & API** | Payload age breakdown, server validation, migration backfill | `feature/pricing-age-tiers-booking` |
| **5. Voucher, Email, AI Agent** | Breakdown di voucher/email, tool `calculatePrice` | `feature/pricing-age-tiers-ecosystem` |
| **6. E2E Test & QA** | Full flow FLAT & AGE_TIERED, regression suite | `feature/pricing-age-tiers-qa` |

---

## 13. Keputusan Owner yang Diperlukan

1. **Konfirmasi nama field**: `kids` / `youth` / `adults` (atau `children` / `teens` / `adults`)?
2. **Batas umur**: 3–10 / 11–16 / 17–75 (atau rentang lain)?
3. **Apakah `kidsPricePerPax` & `youthPricePerPax` boleh > `pricePerPax` (adult)?** (Saya sarankan warning tapi tidak block — fleksibel untuk promo khusus).
4. **Apakah perlu field `infant` (0-2 th, gratis/tidak dihitung pax)?** Saat ini tidak — tambah nanti jika perlu.
5. **Target tanggal mulai implementasi?**

---

## 14. Risiko & Mitigasi

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| Regression pricing FLAT existing | Rendah | Tinggi | Test suite 652 existing + test case baru FLAT sebagai baseline |
| Inkonsistensi paxCount vs age breakdown | Sedang | Tinggi | Validasi ganda (FE + BE) + invariant DB (CHECK constraint opsional) |
| Migrasi data booking lama | Rendah | Sedang | Backfill otomatis di migrasi, default `adultsCount = paxCount` |
| AI agent mengirim harga salah ke customer | Sedang | Tinggi | Update tool `calculatePrice` + test integrasi agent |
| Voucher/email lama tidak punya breakdown | Rendah | Rendah | Template email kondisional — fallback ke tampilan flat |

---

*Dokumen ini siap untuk review Owner. Setelah disetujui, saya akan buat branch `feature/pricing-age-tiers-core` dan mulai Fase 1 (Data Model & Pricing Engine) dengan QA gate penuh.*