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
  ├─ rating 4–5 + clean comment + verified booking → isApproved = true (live)
  └─ otherwise → isApproved = false + email to support@
        ↓
PDP shows approved reviews with “Verified trip”
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

## 4. Delivery channels

| Channel | What is sent | Notes |
|---|---|---|
| Email (Resend) | Button + inline QR | Primary channel; needs `RESEND_API_KEY` and a verified `EMAIL_FROM` domain |
| WhatsApp | Text with review URL | Business-initiated messages outside the 24h window require an approved Meta template; add template support before relying on this channel |
| Ops screen | QR + “Open link” in the success panel | Works even when email/WhatsApp is down |
| `/my/bookings` | “Write a review” + “Show QR” | Requires the customer magic link |

All sends are logged in `NotificationLog` with `SENT`/`FAILED`. Delivery
failures never block checkout, ops, or review submission.

## 5. Moderation policy

`src/lib/reviewModeration.ts`:

| Case | Result |
|---|---|
| Verified + rating 4–5 + clean comment | **Auto-publish** |
| Rating 1–3 | Queue + support email |
| Link, email, phone number, `wa.me`, `t.me` | Queue + support email |
| Severe profanity | Queue + support email |
| Not verified / comment < 20 chars | Queue |

Admin queue: `/admin/reviews` → Approve / Reject. Reject deletes the row.

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
| `RESEND_API_KEY` | Review email + moderation alerts |
| `EMAIL_FROM` | Verified sender, e.g. `BaliWild <booking@baliwild.com>` |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp delivery |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp delivery |
| `CRON_SECRET` | Authenticates the Vercel cron |
| `CUSTOMER_LINK_SECRET` | Signs `rl1` tokens (falls back to `ADMIN_SESSION_SECRET`) |
| `NEXT_PUBLIC_APP_URL` | Absolute links/QRs in email |

**Current local status:** Resend, WhatsApp and `CRON_SECRET` are not configured,
so outbound sends are recorded as `FAILED`. The QR/ops path and review form
still work; configure the keys before production traffic.

## 8. Testing

Automated:

```bash
npx jest src/lib/customerLink.test.ts src/lib/reviewSchema.test.ts \
  src/lib/reviewModeration.test.ts src/components/features/ReviewForm.test.tsx
```

Manual (local, after a booking is `COMPLETED`):

1. Ops → Redeem → QR panel appears.
2. Scan/open the link → review form loads.
3. Submit 5★ clean comment → response `published: true`, PDP shows it.
4. Submit 2★ → response `pendingModeration: true`, `/admin/reviews` lists it.
5. Check `NotificationLog` for SENT/FAILED reasons.

Never seed fake reviews into staging or production. Use a real test booking,
then delete the test review row if the environment must stay clean.
