import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { clientIp, rateLimit } from '@/lib/rateLimit.distributed';
import { sendEmail } from '@/lib/notifications';
import { subscribeToNewsletter } from '@/lib/subscribers';

const subscribeSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email is required.',
    })
    .trim()
    .toLowerCase()
    .max(254, 'Email is too long.')
    .email('Please enter a valid email address.'),
  source: z.string().trim().min(1).max(64).optional(),
});

/** Plain-text-friendly welcome note; no invented urgency, no promises. */
function welcomeHtml() {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#171717">
      <p style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#737373">BaliWild Adventures</p>
      <h1 style="font-size:24px;margin:8px 0 16px">You are on the list</h1>
      <p style="font-size:15px;line-height:1.6;color:#404040">
        Thanks for subscribing. We will send occasional notes about new adventures,
        seasonal openings and practical travel intel for Bali. No spam, ever.
      </p>
      <p style="font-size:15px;line-height:1.6;color:#404040">&mdash; The BaliWild team</p>
      <p style="font-size:12px;color:#737373">If this email was not intended for you, you can safely ignore it.</p>
    </div>`;
}

/**
 * Public newsletter / lead capture. Rate-limited per IP, stores the address
 * (one row per email) and sends a best-effort welcome note. A failed welcome
 * mail never fails the capture — the address is already saved.
 */
export async function POST(request: NextRequest) {
  const limit = await rateLimit(`subscribe:${clientIp(request)}`, 5, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again shortly.' },
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const input = subscribeSchema.parse(await request.json());
    const result = await subscribeToNewsletter(input.email, input.source ?? 'HOMEPAGE');

    if (!result.ok) {
      console.error('Newsletter subscribe failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'SUBSCRIBE_FAILED', message: 'Could not save your email. Please try again.' },
        },
        { status: 502 }
      );
    }

    const welcome = await sendEmail(input.email, 'Welcome to BaliWild Adventures', welcomeHtml());
    if (!welcome.success) {
      console.error('Welcome email failed:', welcome.error);
    }

    return NextResponse.json({ success: true, data: { email: input.email } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      );
    }
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not process subscription' } },
      { status: 500 }
    );
  }
}
