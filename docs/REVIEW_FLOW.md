# Review Flow — BaliWild

> **Status:** Implemented (v3.7.1)
> **Source of truth for:** when a review invite is sent, who can review, how a
> review is published, and how to operate the queue.
> **Guardrail:** no fabricated reviews. A review always comes from a real paid
> booking that operations marked `COMPLETED`.

## 1. End-to-end flow

```
Ops marks booking COMPLETED (/admin/operations → Redeem)
  ├─ booking.lifecycleStatus = COMPLETED
  ├─ voucher = REDEEMED
  ├─ review invite sent (email + WhatsApp attempt)
  └─ response returns review URL + QR for the guest to scan on the spot
        ↓
Guest scans QR / opens email link
        ↓
/review/[bookingId]?token=…  (no account needed)
        ↓
POST /api/reviews
  └─ every review → isApproved = true (live immediately)
        ↓
PDP shows reviews with a “Verified” badge
```

Fallback cron (`/api/cron/review-requests`, 10:00 WITA) re-sends invites that
never left and sends **one** reminder at D+3.

## 2. Eligibility

`canReviewBooking()` in `src/lib/reviewSchema.ts` requires all of:

- `paymentStatus === 'PAID'`
- `lifecycleStatus === 'COMPLETED'`
- `bookingDate <= today` (WITA/date key)
- no existing review for the booking (one review per booking)

`CONFIRMED`, `CANCELLED` and `NO_SHOW` bookings can never be reviewed.

## 3. Review token

Created by `createReviewToken(customerId, bookingId)` in
`src/lib/customerLink.ts`:

- scheme `rl1`
- payload `{ cid, bid, scp: 'review', exp }`
- TTL **180 days**
- only valid for the exact `bookingId`
- does **not** unlock `/my/bookings`

Legacy 30-day account tokens (`cl1`) are still accepted for reviews so old
links do not break. New emails/QRs always use `rl1`.

## 3a. Review source and badges

`Review.source` (migration `20261108100000_review_source`):

| Source (stored) | Meaning |
|---|---|
| `VERIFIED_BOOKING` | Paid booking, marked COMPLETED |
| `FOUNDING_GUEST` | Real invited guest who did the activity without an online booking |
| `IMPORTED` | Real review collected from another platform with permission |

The raw value is kept for reporting, but the UI does not expose the
distinction anymore: every review is labelled **Verified**. The admin filter
and the public review card no longer branch on `source` (owner decision,
Nov 2026).

## 3b. Guest photos

- Max **3 photos** per review, **5 MB** each
- Compressed in the browser to WebP, max edge 1600px (`src/lib/compressImage.ts`)
- Uploaded one at a time to `POST /api/reviews/photos` using the scoped token
- Stored in the public Supabase bucket named by `SUPABASE_REVIEW_BUCKET`
  (default `reviews`)
- Server re-validates MIME type and size and only accepts URLs from that bucket
- Reviews **with photos are published immediately**, like every other review
- Admin can remove individual photos before or after publishing
- Photos render as a 4:3 grid (max 3) in review cards and the admin queue

Create the bucket in Supabase Storage and mark it public. Without
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, photo uploads return
`503` and reviews can still be submitted without photos.

## 3c. Review length

Comments are **20–500 characters**. The form shows a live counter, cards clamp
to three lines with “Read more”, and the 500-character cap keeps the mobile/PWA
layout compact.


## 3d. Founding-guest invites

For real people who completed an activity without an online booking (staff
guests, early testers, invited locals/creators).

- Admin page: `/admin/reviews/invites` (sidebar **Invites**)
- Create up to **10 active invites per product** at once; expiry 1–90 days
  (default 30)
- Every invite is single-use, tied to one product, and can be revoked while
  unused
- Token: `ri1` HMAC over `{ inviteId, exp }`; the admin can regenerate the
  link/QR at any time because only the invite id and expiry are stored
- Guest page: `/review/invite/[inviteId]?token=…` (no account)
- Guest fills name, country, rating, review and optional photos
- Review is stored with `source = FOUNDING_GUEST`, `bookingId = null`,
  `customerId = null`, `inviteId = <invite>`
- **Published immediately**, like every other review
- QR endpoint: `/api/reviews/invite/qr?inviteId=…&token=…`
- Reusing a submitted/expired link returns `409`; the QR stops rendering

Coverage on the invite page shows published reviews, pending reviews and active
invites per product, so the team can see progress toward 10 published reviews.

## 4. Delivery channels

| Channel | What is sent | Notes |
|---|---|---|
| Email (Resend) | Button + inline QR | Primary channel; needs `RESEND_API_KEY` and a verified `EMAIL_FROM` domain |
| WhatsApp | Text with review URL | Business-initiated messages outside the 24h window require an approved Meta template; add template support before relying on this channel |
| Ops screen | QR + “Open link” in the success panel | Works even when email/WhatsApp is down |
| `/my/bookings` | “Write a review” + “Show QR” | Requires the customer magic link |

All sends are logged in `NotificationLog` with `SENT`/`FAILED`. Delivery
failures never block checkout, ops, or review submission.

## 5. Publication policy

`src/lib/reviewModeration.ts` always returns `autoPublish: true`: every review
submitted by a guest is live immediately. There is no pending state and no
approval step.

| Case | Result |
|---|---|
| Any rating, with or without photos | **Published immediately** |
| Founding-guest invite | **Published immediately** |
| Contact details / profanity / short comment | **Published immediately** |

Admin queue: `/admin/reviews` → Delete only (single row or bulk). Deleting a
row is the only moderation action left.

### Admin tooling

- Coverage per product: published count vs target **10/product**, progress bar,
  click to filter that product.
- Filters: status (published/all) and product.
- Bulk delete up to 100 selected reviews.
- Photo removal: open a photo or remove it from the review.
- Every row shows the same **Verified** badge.


## 6. Cron

`vercel.json` → `/api/cron/review-requests`, `0 2 * * *` (10:00 WITA).

1. Find `PAID + COMPLETED + bookingDate <= yesterday + no review`, cap 200.
2. `sendReviewRequest` is idempotent (subject `How was your trip?`).
3. Find `PAID + COMPLETED + bookingDate <= today-3 + no review`, cap 200.
4. `sendReviewReminder` only sends if the first request was already sent
   (subject `A quick reminder: how was your trip?`), so nobody gets a reminder
   before the invite.

Requires `CRON_SECRET`; without it the route returns 401.

## 7. Required environment

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Review email + invite delivery |
| `EMAIL_FROM` | Verified sender, e.g. `BaliWild <booking@baliwild.com>` |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp delivery |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp delivery |
| `CRON_SECRET` | Authenticates the Vercel cron |
| `CUSTOMER_LINK_SECRET` | Signs `rl1` tokens (falls back to `ADMIN_SESSION_SECRET`) |
| `NEXT_PUBLIC_APP_URL` | Absolute links/QRs in email |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for review photos |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only upload key |
| `SUPABASE_REVIEW_BUCKET` | Public bucket name (default `reviews`) |

**Photo setup:** create a public bucket named `reviews` in Supabase Storage.
Uploads use the service-role key server-side; the browser never sees it.

**Current local status:** Resend, WhatsApp and `CRON_SECRET` are not configured,
so outbound sends are recorded as `FAILED`. Review photos need
`SUPABASE_REVIEW_BUCKET` (default `reviews`) to exist as a public bucket.
QR/ops and all review submissions work without those keys.

## 8. Testing

Automated:

```bash
npx jest src/lib/customerLink.test.ts src/lib/reviewSchema.test.ts \
  src/lib/reviewModeration.test.ts src/lib/reviewPhotos.test.ts \
  src/lib/reviewFeed.test.ts src/components/features/ReviewForm.test.tsx \
  src/lib/reviewInvite.test.ts src/lib/reviewInviteSchema.test.ts
```

Manual (booking review, after a booking is `COMPLETED`):

1. Ops → Redeem → QR panel appears.
2. Scan/open the link → review form loads.
3. Add 1–3 photos → thumbnails appear, upload returns a Supabase public URL.
4. Submit 5★ clean comment → response `published: true`, PDP shows it with photos.
5. Submit 2★ → response `published: true`, the review appears on the PDP immediately.
6. Admin filters by product/status, deletes a row and removes a photo.
7. Check `NotificationLog` for SENT/FAILED reasons.

Manual (founding guest):

1. `/admin/reviews/invites` → choose product → create 10 links.
2. Open a link or scan its QR → guest form loads.
3. Submit → the review is live immediately with a **Verified** badge.
4. Reusing the same link returns `409`; the invite becomes `SUBMITTED`.
5. Revoke an unused invite → its link/QR stops working.

Never seed fake reviews into staging or production. Use a real test booking,
then delete the test review row if the environment must stay clean.
