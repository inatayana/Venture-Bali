export type Locale = 'en' | 'id';

export const LOCALES: ReadonlyArray<{ code: Locale; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'id', label: 'ID' },
];

const MESSAGES = {
  en: {
    headerTagline: 'Own the wild. Adventure, booked in minutes.',
    heroCategories: 'Bali · 9 adventure categories',
    heroBook: 'Book the',
    heroOwn: 'Own the wild!',
    heroSub:
      'Rafting, ATV, tubing and trekking across Bali — instant confirmation, free reschedule up to 24 hours before, run by licensed local operators.',
    idrNote: 'Prices in IDR · other currencies are approximate',
    trustInstant: 'Instant confirmation',
    trustRefund: '80% refund ≥24h',
    trustSecure: 'Secure checkout · VISA / QRIS',
    reviews: 'verified reviews',
    categories: 'adventure categories in Bali',
    heroBest: 'Best Sellers',
    heroCombos: 'Adrenaline Combos',
    heroBatur: 'Mount Batur',
    heroTubing: 'River Tubing',
    searchWhere: 'Where',
    searchWhen: 'When',
    searchGuests: 'Guests',
    searchAnywhere: 'Anywhere in Bali',
    searchAnyDate: 'Any date',
    searchGuestOne: 'guest',
    searchGuestMany: 'guests',
    searchButton: 'Search',
    searchPlaceholder: 'Search destinations or adventures…',
    searchNearby: 'Nearby & popular',
    searchSuggested: 'Suggested adventures',
    searchFlexible: 'Flexible dates',
    searchDone: 'Done',
    searchMobileWhere: 'Where to in Bali?',
    searchAdventures: 'Search adventures',
    bookingAlert: 'Booking alert',
    bookingIn: 'in',
  },
  id: {
    headerTagline: 'Taklukkan alam liar. Petualangan, dipesan dalam hitungan menit.',
    heroCategories: 'Bali · 9 kategori petualangan',
    heroBook: 'Pesan',
    heroOwn: 'Taklukkan alam liar!',
    heroSub:
      'Rafting, ATV, tubing, dan trekking di seluruh Bali — konfirmasi instan, reschedule gratis hingga 24 jam sebelum, dipandu operator lokal berlisensi.',
    idrNote: 'Harga dalam IDR · mata uang lain hanya perkiraan',
    trustInstant: 'Konfirmasi instan',
    trustRefund: 'Refund 80% ≥24 jam',
    trustSecure: 'Checkout aman · VISA / QRIS',
    reviews: 'ulasan terverifikasi',
    categories: 'kategori petualangan di Bali',
    heroBest: 'Paling Dicari',
    heroCombos: 'Kombinasi Adrenalin',
    heroBatur: 'Gunung Batur',
    heroTubing: 'River Tubing',
    searchWhere: 'Mau ke mana',
    searchWhen: 'Kapan',
    searchGuests: 'Tamu',
    searchAnywhere: 'Di mana saja di Bali',
    searchAnyDate: 'Tanggal bebas',
    searchGuestOne: 'tamu',
    searchGuestMany: 'tamu',
    searchButton: 'Cari',
    searchPlaceholder: 'Cari destinasi atau petualangan…',
    searchNearby: 'Terdekat & populer',
    searchSuggested: 'Petualangan pilihan',
    searchFlexible: 'Tanggal fleksibel',
    searchDone: 'Selesai',
    searchMobileWhere: 'Mau ke mana di Bali?',
    searchAdventures: 'Cari petualangan',
    bookingAlert: 'Pesanan baru',
    bookingIn: 'di',
  },
} as const;

export type MessageKey = keyof (typeof MESSAGES)['en'];

export function translate(locale: Locale, key: MessageKey): string {
  return MESSAGES[locale][key];
}
