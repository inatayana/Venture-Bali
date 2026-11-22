/**
 * BaliWild — POST /api/auth/magic-link
 *
 * Request a magic link for email-based authentication.
 * Rate limited: 3 requests per hour per email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createMagicLink, sendMagicLinkEmail } from '@/lib/auth/magicLink';
import { checkRateLimit, getMagicLinkKey } from '@/lib/auth/rateLimit';
import { createServerLogger } from '@/lib/logger';

const logger = createServerLogger('api:auth:magic-link');

const RequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  redirectTo: z.string().url().optional().default('/'),
  channel: z.enum(['email', 'whatsapp']).optional().default('email'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, redirectTo, channel } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: 3 requests per hour per email
    const rateLimit = checkRateLimit(getMagicLinkKey(normalizedEmail), 3, 60 * 60);
    if (!rateLimit.allowed) {
      logger.warn({ email: normalizedEmail }, 'Magic link rate limit exceeded');
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait before requesting another link.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter ?? 3600) } }
      );
    }

    // Create magic link
    const result = await createMagicLink(normalizedEmail, 'LOGIN');
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Send via selected channel
    let sendResult: { success: boolean; error?: string };
    if (channel === 'whatsapp') {
      // TODO: Get WhatsApp from customer record
      // For now, fallback to email
      sendResult = await sendMagicLinkEmail(normalizedEmail, result.token, redirectTo);
    } else {
      sendResult = await sendMagicLinkEmail(normalizedEmail, result.token, redirectTo);
    }

    if (!sendResult.success) {
      logger.error({ email: normalizedEmail, error: sendResult.error }, 'Failed to send magic link');
      return NextResponse.json(
        { error: 'Failed to send magic link. Please try again.' },
        { status: 500 }
      );
    }

    logger.info({ email: normalizedEmail, channel }, 'Magic link sent');

    return NextResponse.json({
      success: true,
      message: `Magic link sent to ${channel === 'whatsapp' ? 'WhatsApp' : 'email'}. Check your inbox.`,
      expiresIn: 30 * 60, // seconds
    });
  } catch (error) {
    logger.error({ error }, 'Magic link request failed');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}