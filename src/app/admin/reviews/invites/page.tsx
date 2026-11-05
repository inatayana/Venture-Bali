import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  buildInviteQrUrl,
  buildInviteUrl,
  createInviteToken,
} from '@/lib/reviewInvite';
import {
  AdminReviewInvites,
  type AdminInviteRow,
  type AdminInviteVenture,
} from '@/components/admin/AdminReviewInvites';

export const dynamic = 'force-dynamic';

export default async function AdminReviewInvitesPage() {
  const [ventures, reviewCounts, invites] = await Promise.all([
    prisma.venture.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
    prisma.review.groupBy({
      by: ['ventureId', 'isApproved'],
      _count: { _all: true },
    }),
    prisma.reviewInvite.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { venture: { select: { title: true } } },
    }),
  ]);

  const reviewMap = new Map<string, { approved: number; pending: number }>();
  for (const row of reviewCounts) {
    const current = reviewMap.get(row.ventureId) ?? { approved: 0, pending: 0 };
    if (row.isApproved) current.approved += row._count._all;
    else current.pending += row._count._all;
    reviewMap.set(row.ventureId, current);
  }

  const activeByVenture = new Map<string, number>();
  const now = Date.now();
  for (const invite of invites) {
    if (invite.status === 'UNUSED' && invite.expiresAt.getTime() > now) {
      activeByVenture.set(invite.ventureId, (activeByVenture.get(invite.ventureId) ?? 0) + 1);
    }
  }

  const ventureRows: AdminInviteVenture[] = ventures.map((venture) => {
    const counts = reviewMap.get(venture.id) ?? { approved: 0, pending: 0 };
    return {
      id: venture.id,
      title: venture.title,
      approved: counts.approved,
      pending: counts.pending,
      activeInvites: activeByVenture.get(venture.id) ?? 0,
    };
  });

  const inviteRows: AdminInviteRow[] = invites.map((invite) => {
    const live = invite.status === 'UNUSED' && invite.expiresAt.getTime() > now;
    const token = live ? createInviteToken(invite.id, invite.expiresAt) : null;
    return {
      id: invite.id,
      ventureId: invite.ventureId,
      ventureTitle: invite.venture.title,
      guestName: invite.guestName,
      guestCountryCode: invite.guestCountryCode,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
      url: token ? buildInviteUrl(invite.id, token) : null,
      qrUrl: token ? buildInviteQrUrl(invite.id, token) : null,
    };
  });

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Review invites</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Single-use links for real founding guests who completed an activity without an online
            booking. Each review is labelled <strong>Verified</strong> and published immediately.
          </p>
        </div>
        <Link
          href="/admin/reviews"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-800"
        >
          ← Back to reviews
        </Link>
      </header>

      <AdminReviewInvites ventures={ventureRows} invites={inviteRows} />
    </div>
  );
}
