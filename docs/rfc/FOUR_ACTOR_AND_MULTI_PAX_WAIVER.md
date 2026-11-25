# RFC: Four-Actor Architecture, Multi-Pax Waiver & QR Check-in

> **Version:** 1.0.0 · **Date:** 2026-11-25 · **Status:** APPROVED for implementation (v1.2.0)  
> **Owner:** CTO · **Base:** `origin/staging` @ `9764902` (Next 15.5.27 + Customer Account Phase 1–4)  
> **Related:** [ADR-002](../ADR_CUSTOMER_ACCOUNT.md), [ADR-003](../ADR_WORKSPACE_AND_PRISMA.md), [ADMIN_ACCESS_MODEL.md](../ADMIN_ACCESS_MODEL.md), [SAFETY_WAIVER.md](../SAFETY_WAIVER.md), [BOOKING_ARCHITECTURE.md](../BOOKING_ARCHITECTURE.md)

---

## 1. Summary

BaliWild formally adopts four actors. This RFC fixes their boundaries, replaces the single booking-level waiver with per-participant records, introduces a customer-facing booking code, and defines a signed QR check-in flow for Field Ops. It **does not** expose supplier cost, vendor identity, payout, or commission data to Customer or Field Ops.

---

## 2. Four actors & strict session isolation

| Actor | Session credential | Cookie | Can do | Must never |
|---|---|---|---|---|
| **Guest** | none / `cl1`, `bl1` magic links | none | Browse, book as guest, local wishlist, guest waiver via scoped token | Read another booking, use `/ops`, use `/admin` |
| **Customer** | `CustomerAccount` + `CustomerSession` | `__Host-bw_customer` (prod) / `bw_customer` (dev) | Profile, own trips, own wishlist DB, per-participant waivers, reviews, optional password | Read `vb_admin_session`, `vb_ops_session`, vendor/partner names or payout fields |
| **Field Ops / Driver / Guide** | `FieldOpsUser` + `FieldOpsSession` | `vb_ops_session` | Read assigned-day manifest, scan check-in QR, record no-show, per-participant waiver status | See `Vendor` cost/contract/payout, `Payment.grossAmount`, commission, admin features |
| **Admin** | `AdminUser` + signed `vb_admin_session` | `vb_admin_session` | Products, bookings, refunds, vendors, finance, ops assignment, roles | Grant admin rights from a customer/ops cookie |

**Golden rules**
1. Three cookies, three secrets: `CUSTOMER_SESSION_SECRET`, `FIELD_OPS_SESSION_SECRET`, `ADMIN_SESSION_SECRET`. No fallback between them.
2. Middleware and DAL (`requireCustomer()`, `requireFieldOps()`, `requireAdminRole()`) are separate modules; an operations request never reads the customer cookie and vice versa.
3. Every API response for Customer/Field Ops goes through a DTO allowlist. Never `include: { vendor: true }`, `Payment`, `Refund`, `commission*`, `fixedFeePerPax`, `revenueSharePct`, or `payout` in those DTOs.
4. Guest magic links (`cl1`/`bl1`) stay valid for trips; they do **not** grant Field Ops or Admin capabilities.

---

## 3. RBAC matrix (authoritative)

| Capability | Guest | Customer | Field Ops / Driver | Admin |
|---|:---:|:---:|:---:|:---:|
| Browse catalogue / prices | ✅ | ✅ | — | ✅ |
| Create booking (guest or account) | ✅ | ✅ | — | ✅ |
| Read own bookings | token only | ✅ | assigned bookings only | ✅ |
| Sign own participant waiver | scoped token | ✅ | verify status only | ✅ (audit) |
| Read manifest (name, pax, pickup, waiver status) | — | own only | ✅ assigned day | ✅ |
| Scan QR / check-in / no-show | — | — | ✅ | ✅ |
| See supplier name / contract / payout / commission | ❌ | ❌ | ❌ | ✅ |
| Manage products, prices, slots | ❌ | ❌ | ❌ | ✅ |
| Refunds / payments | ❌ | ❌ | ❌ | ✅ |
| Assign Field Ops staff | ❌ | ❌ | ❌ | ✅ |
| Change own profile / password | — | ✅ | own staff profile | ✅ |

---

## 4. Normalized `BookingParticipant`

Current waivers are booking-level JSON blobs (`waiverDigitalSignature`, `waiverEmergencyContact`, `waiverHealthDeclaration`, …). For multi-pax bookings this cannot represent one signature per guest, nor a guardian signing for a minor. Replace with rows:

```prisma
model BookingParticipant {
  id                    String   @id @default(cuid())
  bookingId             String
  booking               Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  tenantId              String
  tenant                Tenant   @relation(fields: [tenantId], references: [id])
  fullName              String
  participantType       ParticipantType // ADULT | YOUTH | KID | INFANT
  dateOfBirth           DateTime?
  email                 String?
  whatsapp              String?
  waiverVersion         String?
  waiverSignedAt        DateTime?
  waiverDigitalSignature String?
  waiverSignatureMethod String?
  waiverIpAddress       String?   // never logged elsewhere; PII handled per SECURITY_PROTOCOL
  emergencyContactName  String?
  emergencyContactPhone String?
  dietaryNotes          String?
  medicalNotes          String?
  guardianName          String?   // required when participantType is KID/INFANT
  guardianRelationship  String?
  guardianConsentAt     DateTime?
  checkedInAt           DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([bookingId])
  @@index([tenantId])
  @@index([waiverSignedAt])
}

enum ParticipantType { ADULT YOUTH KID INFANT }
```

**Rules**
- One row per paying/attending guest; counts must reconcile with `Booking.paxCount`, `adultsCount`, `kidsCount`, `youthCount`, `infantCount`.
- Minors (`KID`, `INFANT`) require `guardianName`, `guardianRelationship`, `guardianConsentAt` before waiver is considered complete.
- Infants never counted for capacity/price (existing rule), but still get a participant row for safety records.
- Waivers are versioned (`SAFETY_WAIVER.md`); re-signing after a version bump invalidates older signatures by updating the row.
- PII is accessed need-to-know; never logged. Field Ops DTO exposes only `fullName`, `participantType`, `waiverComplete`, `checkedInAt`.

---

## 5. Customer-facing booking code

- Add `Booking.bookingCode` values in format `BW-<YYYY>-<XXXX>` (e.g. `BW-2026-7K3Q`), unique. Generated server-side with a CSPRNG; retry on unique collision.
- Existing `BK-<base36>-<random>` values are **legacy-compatible**: QR payloads reference booking `id`, not the code; customer-facing surfaces may display either until backfilled.
- Backfill existing rows deterministically in the migration; keep the old value in an audit field only if needed (no data loss).
- `bookingCode` is an identifier, **not** an access credential — all read endpoints still require a signed session or scoped token.

---

## 6. QR check-in state transitions

QR payload (signed, opaque, short-lived):

```
ci1.<base64url({ bid, pid?, exp, scp:"checkin" })>.<HMAC-SHA256 signature>
```

- Signed with `FIELD_OPS_SESSION_SECRET` (separate from customer/admin secrets), verified server-side via Web Crypto.
- `exp`: departure slot + 12 hours (or 24 h for multi-day trips). Never a permanent QR.
- `pid` optionally scopes the QR to one participant; absent means booking-level check-in.

Lifecycle (extends existing `BookingLifecycle`):

```
AWAITING_PAYMENT → CONFIRMED → DRIVER_ASSIGNED → CHECKED_IN → COMPLETED
                                                    ↘ NO_SHOW
CANCELLED (from any pre-check-in state)
```

Rules:
- Only Field Ops/Driver/Guide or Admin may call `/api/ops/check-in`.
- Scanning verifies signature + staff role + tenant match + booking ownership assignment.
- First scan sets `Booking.lifecycleStatus = CHECKED_IN` and `Voucher.status = REDEEMED` (idempotent).
- Per-participant scan sets `BookingParticipant.checkedInAt`.
- A no-show is recorded once with reason; it does not mutate `PaymentStatus`.
- Refunds/cancellations remain Admin-only (`REFUND_POLICY.md`, `NO_SHOW_POLICY.md`).

---

## 7. Field Ops portal (`/ops`) — mobile-first

- Login with `vb_ops_session`; staff accounts provisioned by Admin, no public signup.
- Two views: **Manifest** (assigned day) and **Scanner** (QR).
- Manifest columns allowed: guest name, booking code, pax count, pickup time, hotel/meeting point, per-participant waiver status, lifecycle status.
- Explicitly forbidden in UI and API DTO: vendor/partner name, `Vendor.contract*`, `fixedFeePerPax`, `revenueSharePct`, `commission*`, `Payment.grossAmount`, payout/bank fields.
- Scanner uses built-in `BarcodeDetector` where available with a manual code-entry fallback — **zero new npm dependencies**; QR generation uses the existing `qrcode` package or inline SVG.

---

## 8. Delivery plan (Phase 2, after this RFC)

1. Prisma migration: `BookingParticipant`, `bookingCode` format/backfill, `FieldOpsUser`, `FieldOpsSession`, enums, indexes.
2. libs: `fieldOpsSession.ts` (Web Crypto), `fieldOpsGuard.ts` (DAL), `checkInToken.ts`, `waiverService.ts`.
3. APIs: `/api/ops/login`, `/api/ops/manifest`, `/api/ops/check-in`, `/api/bookings/[id]/participants`, `/api/bookings/[id]/qr`.
4. UI: `/ops` portal, `DigitalWaiverModal` inline on `/trips`.
5. Gates: `lint`, `typecheck`, `test`, `audit:check`, `build` green per commit.

---

## 9. Implementation status (Phase 2)

- [x] Prisma migration `20261125110000_four_actor_multi_pax_waiver`
- [x] `BW-<YYYY>-<XXXX>` generator with legacy `BK-...` acceptance
- [x] Signed `ci1` QR tokens (`QR_SIGNING_SECRET`) with expiry + idempotent transitions
- [x] `DigitalWaiverModal` + `/api/bookings/[id]/participants` with guardian validation
- [x] `vb_ops_session` (`OPS_SESSION_SECRET`), `/ops` manifest + scanner, allowlisted DTOs
- [x] Unit tests: QR tamper/expiry, RBAC isolation, guardian rules, transition idempotency, DTO allowlist

## 10. Out of scope

- Argon2id/passkeys (`v1.3.0`), supplier marketplace payouts, public vendor directory, any change to Midtrans settlement logic.
- VPS provisioning (deferred until `v1.2.0` stable on Vercel).
