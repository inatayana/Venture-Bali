/**
 * BaliWild i18n — Unified EN/ID Translation System
 * Single source of truth for all public copy.
 * 
 * This consolidates the previous locale.ts + i18n.ts dual system.
 * All translations live here; components import from this file only.
 */

export type Locale = 'en' | 'id';

export const LOCALES: readonly Locale[] = ['en', 'id'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  id: 'ID',
};

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  id: 'Indonesian',
};

const translations = {
  common: {
    loading: { en: 'Loading...', id: 'Memuat...' },
    error: { en: 'Something went wrong', id: 'Terjadi kesalahan' },
    retry: { en: 'Retry', id: 'Coba Lagi' },
    back: { en: 'Back', id: 'Kembali' },
    continue: { en: 'Continue', id: 'Lanjutkan' },
    cancel: { en: 'Cancel', id: 'Batal' },
    close: { en: 'Close', id: 'Tutup' },
    save: { en: 'Save', id: 'Simpan' },
    change: { en: 'Change', id: 'Ubah' },
    review: { en: 'Review', id: 'Review' },
    next: { en: 'Next', id: 'Lanjut' },
    spotsAvailable: { en: 'spots available', id: 'slot tersedia' },
    from: { en: 'From', id: 'Mulai dari' },
    perGuest: { en: '/guest', id: '/orang' },
    perVehicle: { en: '/vehicle', id: '/kendaraan' },
  },
  nav: {
    home: { en: 'Home', id: 'Beranda' },
    adventures: { en: 'Adventures', id: 'Petualangan' },
    about: { en: 'About', id: 'Tentang' },
    contact: { en: 'Contact', id: 'Kontak' },
    language: { en: 'Language', id: 'Bahasa' },
    currency: { en: 'Currency', id: 'Mata Uang' },
    theme: { en: 'Theme', id: 'Tema' },
    myBookings: { en: 'My Bookings', id: 'Pemesanan Saya' },
    signIn: { en: 'Sign In', id: 'Masuk' },
    categories: { en: 'Categories', id: 'Kategori' },
    explore: { en: 'Explore', id: 'Jelajahi' },
    exploreAria: { en: 'Explore activities', id: 'Jelajahi aktivitas' },
    wishlist: { en: 'Wishlists', id: 'Wishlist' },
    wishlistAria: { en: 'Your saved adventures', id: 'Petualangan tersimpan Anda' },
    search: { en: 'Search', id: 'Cari' },
    searchAria: { en: 'Search activities', id: 'Cari aktivitas' },
    trips: { en: 'Trips', id: 'Perjalanan' },
    tripsAria: { en: 'Your trips', id: 'Perjalanan Anda' },
    profile: { en: 'Profile', id: 'Profil' },
    profileAria: { en: 'User profile', id: 'Profil pengguna' },
    messages: { en: 'Messages', id: 'Pesan' },
    messagesAria: { en: 'Your messages', id: 'Pesan Anda' },
    notifications: { en: 'Notifications', id: 'Notifikasi' },
    notificationsAria: { en: 'Your notifications', id: 'Notifikasi Anda' },
    accountSettings: { en: 'Account settings', id: 'Pengaturan akun' },
    accountSettingsAria: { en: 'Account settings', id: 'Pengaturan akun' },
    languagesCurrency: { en: 'Languages & currency', id: 'Bahasa & mata uang' },
    languagesCurrencyAria: { en: 'Languages and currency settings', id: 'Pengaturan bahasa dan mata uang' },
    helpCenter: { en: 'Help Center', id: 'Pusat Bantuan' },
    helpCenterAria: { en: 'Help Center', id: 'Pusat Bantuan' },
    logOut: { en: 'Log out', id: 'Keluar' },
    logOutAria: { en: 'Log out', id: 'Keluar' },
  },
  hero: {
    tagline: { en: 'Own the wild. Adventure, booked in minutes.', id: 'Taklukkan alam liar. Petualangan, dipesan dalam hitungan menit.' },
    categories: { en: 'Bali · 9 adventure categories', id: 'Bali · 9 kategori petualangan' },
    badge: { en: "Bali's #1 Outdoor & Adventure OTA", id: 'OTA Petualangan & Aktivitas Outdoor #1 di Bali' },
    book: { en: 'Book the', id: 'Pesan' },
    own: { en: 'Own the wild!', id: 'Taklukkan alam liar!' },
    sub: { en: 'Rafting, ATV, tubing & trekking across Bali. Instant confirmation, free reschedule, and 100% locally operated.', id: 'Rafting, ATV, tubing & trekking di seluruh Bali. Konfirmasi instan, reschedule gratis, dan 100% dijalankan operator lokal.' },
    idrNote: { en: 'Prices in IDR · other currencies are approximate', id: 'Harga dalam IDR · mata uang lain hanya perkiraan' },
    best: { en: 'Best Sellers', id: 'Paling Dicari' },
    combos: { en: 'Adrenaline Combos', id: 'Kombinasi Adrenalin' },
    batur: { en: 'Mount Batur', id: 'Gunung Batur' },
    tubing: { en: 'River Tubing', id: 'River Tubing' },
    water: { en: 'Water Adventures', id: 'Wisata Air' },
    trekking: { en: 'Mountain Trekking', id: 'Trekking Gunung' },
    licensed: { en: 'Licensed local operators', id: 'Operator lokal berlisensi' },
    verifiedReviews: { en: 'verified reviews', id: 'ulasan terverifikasi' },
    categoriesLabel: { en: 'adventure categories in Bali', id: 'kategori petualangan di Bali' },
    searchWhere: { en: 'Where', id: 'Mau ke mana' },
    searchWhen: { en: 'When', id: 'Kapan' },
    searchGuests: { en: 'Guests', id: 'Tamu' },
    searchAnywhere: { en: 'Anywhere in Bali', id: 'Di mana saja di Bali' },
    searchAnyDate: { en: 'Any date', id: 'Tanggal bebas' },
    searchGuestOne: { en: 'guest', id: 'tamu' },
    searchGuestMany: { en: 'guests', id: 'tamu' },
    searchButton: { en: 'Search', id: 'Cari' },
    searchPlaceholder: { en: 'Search destinations or adventures…', id: 'Cari destinasi atau petualangan…' },
    searchNearby: { en: 'Nearby & popular', id: 'Terdekat & populer' },
    searchSuggested: { en: 'Suggested adventures', id: 'Petualangan pilihan' },
    searchFlexible: { en: 'Flexible dates', id: 'Tanggal fleksibel' },
    searchDone: { en: 'Done', id: 'Selesai' },
    searchMobileWhere: { en: 'Where to in Bali?', id: 'Mau ke mana di Bali?' },
    searchAdventures: { en: 'Search adventures', id: 'Cari petualangan' },
    bookingAlert: { en: 'Booking alert', id: 'Pesanan baru' },
    bookingIn: { en: 'in', id: 'di' },
  },
  trust: {
    instant: { en: 'Instant confirmation', id: 'Konfirmasi instan' },
    reschedule: { en: 'Free reschedule ≥24h', id: 'Reschedule gratis ≥24 jam' },
    refund: { en: '80% refund ≥24h', id: 'Refund 80% ≥24 jam' },
    secure: { en: 'Secure checkout · VISA / QRIS', id: 'Checkout aman · VISA / QRIS' },
    reviews: { en: 'verified reviews', id: 'ulasan terverifikasi' },
    categories: { en: 'adventure categories in Bali', id: 'kategori petualangan di Bali' },
  },
  product: {
    from: { en: 'From', id: 'Mulai dari' },
    perGuest: { en: '/guest', id: '/orang' },
    duration: { en: 'Duration', id: 'Durasi' },
    location: { en: 'Location', id: 'Lokasi' },
    rating: { en: 'Rating', id: 'Penilaian' },
    reviews: { en: 'reviews', id: 'ulasan' },
    whatsIncluded: { en: "What's Included", id: 'Termasuk' },
    whatsExcluded: { en: "What's Not Included", id: 'Tidak Termasuk' },
    overview: { en: 'Overview', id: 'Ringkasan' },
    itinerary: { en: 'Itinerary', id: 'Jadwal' },
    meetingPoint: { en: 'Meeting Point', id: 'Titik Pertemuan' },
    thingsToKnow: { en: 'Things to Know', id: 'Yang Perlu Diketahui' },
    relatedAdventures: { en: 'Related Adventures', id: 'Petualangan Serupa' },
    bookNow: { en: 'Book Now', id: 'Pesan Sekarang' },
    showDates: { en: 'Show Dates', id: 'Lihat Jadwal' },
    instantConfirmation: { en: 'Instant Confirmation', id: 'Konfirmasi Instan' },
    freeCancellation: { en: 'Free Cancellation', id: 'Pembatalan Gratis' },
    hotelPickupAvailable: { en: 'Hotel Pickup Available', id: 'Jemput Hotel Tersedia' },
    selectDate: { en: 'Select Date', id: 'Pilih Tanggal' },
    selectTime: { en: 'Select Time', id: 'Pilih Jam' },
    howManyTravellers: { en: 'How Many Travellers?', id: 'Berapa Orang?' },
    adults: { en: 'Adults', id: 'Dewasa' },
    children: { en: 'Children', id: 'Anak-anak' },
    totalPrice: { en: 'Total Price', id: 'Total Harga' },
    spotsAvailable: { en: 'spots available', id: 'slot tersedia' },
  },
  booking: {
    selectDate: { en: 'Select Date', id: 'Pilih Tanggal' },
    selectTime: { en: 'Select Time', id: 'Pilih Jam' },
    howManyTravellers: { en: 'How Many Travellers?', id: 'Berapa Orang?' },
    adults: { en: 'Adults', id: 'Dewasa' },
    children: { en: 'Children', id: 'Anak-anak' },
    totalPrice: { en: 'Total Price', id: 'Total Harga' },
    next: { en: 'Next', id: 'Lanjut' },
    review: { en: 'Review Booking', id: 'Review Pemesanan' },
    change: { en: 'Change', id: 'Ubah' },
    save: { en: 'Save', id: 'Simpan' },
    name: { en: 'Full Name', id: 'Nama Lengkap' },
    email: { en: 'Email', id: 'Email' },
    whatsapp: { en: 'WhatsApp', id: 'WhatsApp' },
    country: { en: 'Country', id: 'Negara' },
    hotelAddress: { en: 'Hotel/Villa Address', id: 'Alamat Hotel/Villa' },
    tba: { en: 'To be confirmed by H-1', id: 'Dikonfirmasi H-1' },
    terms: { en: 'I accept the booking terms', id: 'Saya menerima syarat pemesanan' },
    waiver: { en: 'I accept the safety waiver', id: 'Saya menerima pernyataan keselamatan' },
    selectPackage: { en: 'Select Package', id: 'Pilih Paket' },
    pickupArea: { en: 'Pickup Area', id: 'Area Jemput' },
    vehicleClass: { en: 'Vehicle Class', id: 'Kelas Kendaraan' },
    addOns: { en: 'Add-ons', id: 'Tambahan' },
  },
  payment: {
    selectMethod: { en: 'Select Payment Method', id: 'Pilih Metode Pembayaran' },
    creditCard: { en: 'Credit Card', id: 'Kartu Kredit' },
    debitCard: { en: 'Debit Card', id: 'Kartu Debit' },
    gopay: { en: 'GoPay', id: 'GoPay' },
    qris: { en: 'QRIS', id: 'QRIS' },
    bankTransfer: { en: 'Bank Transfer', id: 'Transfer Bank' },
    applePay: { en: 'Apple Pay', id: 'Apple Pay' },
    secure: { en: 'Secure Payment', id: 'Pembayaran Aman' },
    payNow: { en: 'Pay Now', id: 'Bayar Sekarang' },
    processing: { en: 'Processing...', id: 'Memproses...' },
    holdExpires: { en: 'Hold expires', id: 'Hold berakhir' },
  },
  confirmation: {
    success: { en: 'Booking Confirmed!', id: 'Pemesanan Berhasil!' },
    bookingId: { en: 'Booking ID', id: 'Kode Booking' },
    downloadPdf: { en: 'Download PDF', id: 'Unduh PDF' },
    addToWallet: { en: 'Add to Wallet', id: 'Tambah ke Wallet' },
    voucherQr: { en: 'Show this QR code at the venue', id: 'Tunjukkan kode QR ini di lokasi' },
    pending: { en: 'Awaiting payment', id: 'Menunggu pembayaran' },
    reminders: { en: 'Important reminders', id: 'Pengingat penting' },
    presentCode: { en: 'Present this booking code at the meeting point', id: 'Tunjukkan kode pemesanan ini di titik pertemuan' },
    arriveEarly: { en: 'Arrive 15 minutes before the scheduled time', id: 'Datang 15 menit sebelum jadwal' },
    bringId: { en: 'Bring a valid ID for verification', id: 'Bawa ID valid untuk verifikasi' },
    oneTimeUse: { en: 'This voucher is valid for one-time use only', id: 'Voucher ini berlaku untuk sekali penggunaan' },
  },
  refund: {
    cancelPolicy: { en: 'Cancellation Policy', id: 'Kebijakan Pembatalan' },
    cancelFee: { en: 'Cancel fee 20% (refund 80%) if cancelled ≥24h before activity', id: 'Biaya batal 20% (refund 80%) jika dibatalkan ≥24 jam sebelum aktivitas' },
    refundAmount: { en: 'Refund Amount', id: 'Jumlah Refund' },
    reschedule: { en: 'Reschedule available ≥24h before activity (free)', id: 'Reschedule tersedia ≥24 jam sebelum aktivitas (gratis)' },
    noShow: { en: 'No-show: 100% fee (0% refund)', id: 'Tidak datang: biaya 100% (refund 0%)' },
    processingTime: { en: 'Refunds processed within 3 business days', id: 'Refund diproses dalam 3 hari kerja' },
  },
  category: {
    atv: { en: 'ATV & Off-Road', id: 'ATV & Off-Road' },
    rafting: { en: 'Rafting', id: 'Rafting' },
    tubing: { en: 'River Tubing', id: 'River Tubing' },
    cycling: { en: 'Cycling', id: 'Cycling' },
    trekking: { en: 'Trekking & Hiking', id: 'Trekking & Hiking' },
    'water-sports': { en: 'Water Sports', id: 'Water Sports' },
    snorkeling: { en: 'Snorkeling & Diving', id: 'Snorkeling & Diving' },
    extreme: { en: 'Extreme Adventures', id: 'Extreme Adventures' },
    combo: { en: 'Adventure Combo Packages', id: 'Adventure Combo Packages' },
  },
  reviews: {
    verified: { en: 'verified reviews', id: 'ulasan terverifikasi' },
    writeReview: { en: 'Write a review', id: 'Tulis ulasan' },
    uploadPhotos: { en: 'Upload photos', id: 'Unggah foto' },
    rating: { en: 'Rating', id: 'Penilaian' },
    comment: { en: 'Comment', id: 'Komentar' },
    guestName: { en: 'Guest name', id: 'Nama tamu' },
    submit: { en: 'Submit review', id: 'Kirim ulasan' },
    thanks: { en: 'Thanks for your review!', id: 'Terima kasih atas ulasan Anda!' },
  },
  legal: {
    terms: { en: 'Terms of Service', id: 'Syarat Layanan' },
    privacy: { en: 'Privacy Policy', id: 'Kebijakan Privasi' },
    waiver: { en: 'Safety Waiver', id: 'Pernyataan Keselamatan' },
  },
  error: {
    notFound: {
      title: { en: 'Page Not Found', id: 'Halaman Tidak Ditemukan' },
      description: { en: "Sorry, we couldn't find the page you're looking for.", id: 'Maaf, kami tidak menemukan halaman yang Anda cari.' },
    },
    generic: {
      title: { en: 'Something went wrong', id: 'Terjadi kesalahan' },
      description: { en: 'Sorry, something went wrong on our end. Our team has been notified.', id: 'Maaf, ada yang tidak beres di sisi kami. Tim kami sudah mendapat notifikasi.' },
    },
  },
} as const;

// Extract namespaces and keys for type safety
export type TranslationNamespace = keyof typeof translations;
export type TranslationKey<NS extends TranslationNamespace> = keyof typeof translations[NS];

/**
 * Get translation for a given namespace and key.
 * Falls back to English if locale or key not found.
 */
export function t(
  locale: Locale,
  namespace: TranslationNamespace,
  key: string
): string {
  const ns = translations[namespace];
  if (ns && Object.prototype.hasOwnProperty.call(ns, key)) {
    const translation = ns[key as keyof typeof ns] as Record<Locale, string>;
    return translation[locale] ?? translation.en;
  }
  return String(key);
}

/**
 * Get all translations for a namespace in a specific locale.
 * Useful for components that need multiple keys from the same namespace.
 */
export function getNamespace(locale: Locale, namespace: TranslationNamespace): Record<string, string> {
  const ns = translations[namespace];
  const result: Record<string, string> = {};
  for (const key of Object.keys(ns)) {
    const translation = ns[key as keyof typeof ns] as Record<Locale, string>;
    result[key] = translation[locale] ?? translation.en ?? key;
  }
  return result;
}

/**
 * Format price according to locale/currency.
 */
export function formatPrice(amount: number, currency: string = 'IDR', locale: Locale = 'id'): string {
  const formatterLocale = locale === 'id' ? 'id-ID' : 'en-US';
  return new Intl.NumberFormat(formatterLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date according to locale.
 */
export function formatDate(date: Date, locale: Locale = 'en'): string {
  return date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format long date according to locale.
 */
export function formatLongDate(date: Date, locale: Locale = 'en'): string {
  return date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Mapping from old flat keys (e.g., "heroBadge") to new namespace/key format ("hero", "badge").
 * This maintains backward compatibility with components using the old flat key format.
 */
const LEGACY_KEY_MAP: Record<string, [string, string]> = {
  // Header
  headerTagline: ['hero', 'tagline'],
  // Hero section
  heroTagline: ['hero', 'tagline'],
  heroCategories: ['hero', 'categories'],
  heroBadge: ['hero', 'badge'],
  heroBook: ['hero', 'book'],
  heroOwn: ['hero', 'own'],
  heroSub: ['hero', 'sub'],
  heroIdrNote: ['hero', 'idrNote'],
  heroBest: ['hero', 'best'],
  heroCombos: ['hero', 'combos'],
  heroBatur: ['hero', 'batur'],
  heroTubing: ['hero', 'tubing'],
  heroWater: ['hero', 'water'],
  heroTrekking: ['hero', 'trekking'],
  heroLicensed: ['hero', 'licensed'],
  heroVerifiedReviews: ['hero', 'verifiedReviews'],
  heroCategoriesLabel: ['hero', 'categoriesLabel'],
  heroSearchWhere: ['hero', 'searchWhere'],
  heroSearchAnywhere: ['hero', 'searchAnywhere'],
  heroSearchWhen: ['hero', 'searchWhen'],
  heroSearchAnyDate: ['hero', 'searchAnyDate'],
  heroSearchGuests: ['hero', 'searchGuests'],
  heroSearchGuestOne: ['hero', 'searchGuestOne'],
  heroSearchGuestMany: ['hero', 'searchGuestMany'],
  heroSearchButton: ['hero', 'searchButton'],
  heroSearchPlaceholder: ['hero', 'searchPlaceholder'],
  heroSearchNearby: ['hero', 'searchNearby'],
  heroSearchSuggested: ['hero', 'searchSuggested'],
  heroSearchFlexible: ['hero', 'searchFlexible'],
  heroSearchDone: ['hero', 'searchDone'],
  heroSearchMobileWhere: ['hero', 'searchMobileWhere'],
  heroSearchAdventures: ['hero', 'searchAdventures'],
  heroBookingAlert: ['hero', 'bookingAlert'],
  heroBookingIn: ['hero', 'bookingIn'],
  
  // Trust section
  trustInstant: ['trust', 'instant'],
  trustReschedule: ['trust', 'reschedule'],
  trustRefund: ['trust', 'refund'],
  trustSecure: ['trust', 'secure'],
  trustReviews: ['trust', 'reviews'],
  trustCategories: ['trust', 'categories'],
  
  // Search section (legacy flat keys)
  searchWhere: ['hero', 'searchWhere'],
  searchAnywhere: ['hero', 'searchAnywhere'],
  searchWhen: ['hero', 'searchWhen'],
  searchAnyDate: ['hero', 'searchAnyDate'],
  searchGuests: ['hero', 'searchGuests'],
  searchGuestOne: ['hero', 'searchGuestOne'],
  searchGuestMany: ['hero', 'searchGuestMany'],
  searchButton: ['hero', 'searchButton'],
  searchPlaceholder: ['hero', 'searchPlaceholder'],
  searchNearby: ['hero', 'searchNearby'],
  searchSuggested: ['hero', 'searchSuggested'],
  searchFlexible: ['hero', 'searchFlexible'],
  searchDone: ['hero', 'searchDone'],
  searchMobileWhere: ['hero', 'searchMobileWhere'],
  searchAdventures: ['hero', 'searchAdventures'],
}

/**
 * Compatibility function matching the old translate API.
 * Takes a locale and a dot-notation key (e.g., "hero.tagline") OR old flat key (e.g., "heroBadge")
 * and returns the translation. Falls back to English if locale or key not found.
 */
export function translate(locale: Locale, key: string): string {
  // First check if it's a legacy flat key
  if (LEGACY_KEY_MAP[key]) {
    const [namespace, translationKey] = LEGACY_KEY_MAP[key];
    const ns = translations[namespace as keyof typeof translations];
    if (ns && Object.prototype.hasOwnProperty.call(ns, translationKey)) {
      const translation = ns[translationKey as keyof typeof ns] as Record<Locale, string>;
      return translation[locale] ?? translation.en;
    }
  }
  
  // Then check for dot-notation format (namespace.key)
  const [namespace, ...keyParts] = key.split('.');
  const translationKey = keyParts.join('.');
  
  if (!(namespace in translations)) {
    return key;
  }
  
  const ns = translations[namespace as keyof typeof translations];
  if (ns && Object.prototype.hasOwnProperty.call(ns, translationKey)) {
    const translation = ns[translationKey as keyof typeof ns] as Record<Locale, string>;
    return translation[locale] ?? translation.en;
  }
  
  return key;
}

