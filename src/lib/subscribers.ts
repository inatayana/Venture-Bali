/**
 * BaliWild — newsletter / lead capture
 * -------------------------------------
 * Public site email capture. One `Subscriber` row per address, so
 * re-subscribing from another surface only refreshes the source. Nothing
 * here ever throws: the API route decides how to answer the request.
 */

import { prisma } from '@/lib/prisma';

export type SubscribeResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * Persist an email address captured from the public site.
 * `source` records where the capture came from (e.g. HOMEPAGE, CHECKOUT).
 */
export async function subscribeToNewsletter(
  email: string,
  source: string = 'HOMEPAGE'
): Promise<SubscribeResult> {
  try {
    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      create: { email, source },
      update: { source },
    });
    return { ok: true, email: subscriber.email };
  } catch (error) {
    console.error('Could not persist Subscriber:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
