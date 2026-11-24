import Link from 'next/link';
import { Home, Search, RotateCcw } from 'lucide-react';
import { BrandWordmark } from '@/components/layout/BrandWordmark';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Link href="/" aria-label="BaliWild home" className="inline-block">
            <BrandWordmark className="text-3xl text-brand-ink" />
          </Link>
        </div>

        <div className="w-24 h-24 mx-auto mb-6 bg-neutral-100 rounded-full flex items-center justify-center">
          <Search className="w-10 h-10 text-neutral-400" />
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 mb-3">Halaman tidak ditemukan</h1>
        <p className="text-neutral-600 mb-8">
          Maaf, kami tidak menemukan halaman yang Anda cari. Mungkin URL-nya salah ketik,
          atau petualangan itu sudah berpindah tempat.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 w-full rounded-xl bg-brand-ink px-6 text-base font-semibold text-white hover:bg-neutral-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          <Link
            href="/#adventures"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 w-full rounded-xl border-2 border-brand-ink px-6 text-base font-semibold text-brand-ink hover:bg-brand-ink/5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Cari Petualangan Lain
          </Link>
        </div>
      </div>
    </main>
  );
}