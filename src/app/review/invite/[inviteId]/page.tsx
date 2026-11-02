import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { verifyInviteToken } from '@/lib/reviewInvite';
import { isReviewPhotoStorageConfigured } from '@/lib/reviewPhotos';
import { FoundingGuestReviewForm } from '@/components/features/FoundingGuestReviewForm';
import { BrandWordmark } from '@/components/layout/BrandWordmark';

export const dynamic = 'force-dynamic';

interface InvitePageProps {
  params: { inviteId: string };
  searchParams: { token?: string };
}

function Unavailable({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <h1 className="font-heading text-lg font-bold text-neutral-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-brand-ink px-5 text-sm font-semibold text-brand"
        >
          Back to adventures
        </Link>
      </div>
    </main>
  );
}

export default async function FoundingGuestReviewPage({ params, searchParams }: InvitePageProps) {
  if (!verifyInviteToken(params.inviteId, searchParams.token)) {
    return (
      <Unavailable
        title="Link invalid or expired"
        message="Ask the BaliWild team for a fresh review link. Each invite is single-use and expires automatically."
      />
    );
  }

  const invite = await prisma.reviewInvite.findUnique({
    where: { id: params.inviteId },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      guestName: true,
      guestCountryCode: true,
      venture: { select: { title: true } },
    },
  });

  if (!invite) {
    return <Unavailable title="Invite not found" message="This review link no longer exists." />;
  }
  if (invite.status !== 'UNUSED' || invite.expiresAt.getTime() <= Date.now()) {
    return (
      <Unavailable
        title="This invite is no longer available"
        message="It may have been used already or expired. Contact the BaliWild team if you still want to leave a review."
      />
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-[44px] items-center text-sm text-neutral-600 hover:text-neutral-900">
            ← BaliWild
          </Link>
          <Link href="/" aria-label="BaliWild home" className="inline-flex min-h-[44px] items-center text-brand-ink">
            <BrandWordmark className="text-lg" />
          </Link>
        </div>

        <h1 className="mt-4 font-heading text-2xl font-bold text-neutral-900">Review your trip</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Founding guest · {invite.venture.title}
        </p>

        <div className="mt-6">
          <FoundingGuestReviewForm
            inviteId={invite.id}
            token={searchParams.token ?? ''}
            ventureTitle={invite.venture.title}
            defaultName={invite.guestName ?? ''}
            defaultCountryCode={invite.guestCountryCode ?? 'ID'}
            photosEnabled={isReviewPhotoStorageConfigured()}
          />
        </div>
      </div>
    </main>
  );
}
