/**
 * Venture Bali i18n — EN/ID Language Toggle
 * Single source of truth untuk semua copy publik.
 */

export type Locale = 'en' | 'id';

export type TranslationKey =
  | 'nav.home'
  | 'nav.adventures'
  | 'nav.about'
  | 'nav.contact'
  | 'nav.language'
  | 'nav.currency'
  | 'product.from'
  | 'product.perGuest'
  | 'product.duration'
  | 'product.location'
  | 'product.rating'
  | 'product.reviews'
  | 'product.whatsIncluded'
  | 'product.whatsExcluded'
  | 'product.overview'
  | 'product.itinerary'
  | 'product.meetingPoint'
  | 'product.thingsToKnow'
  | 'product.relatedAdventures'
  | 'product.bookNow'
  | 'product.showDates'
  | 'product.instantConfirmation'
  | 'product.freeCancellation'
  | 'product.hotelPickupAvailable'
  | 'booking.selectDate'
  | 'booking.selectTime'
  | 'booking.howManyTravellers'
  | 'booking.adults'
  | 'booking.children'
  | 'booking.totalPrice'
  | 'booking.next'
  | 'booking.review'
  | 'booking.change'
  | 'booking.save'
  | 'payment.selectMethod'
  | 'payment.creditCard'
  | 'payment.debitCard'
  | 'payment.gopay'
  | 'payment.qris'
  | 'payment.bankTransfer'
  | 'payment.applePay'
  | 'payment.secure'
  | 'confirmation.success'
  | 'confirmation.bookingId'
  | 'confirmation.downloadPdf'
  | 'confirmation.addToWallet'
  | 'refund.cancelPolicy'
  | 'refund.cancelFee'
  | 'refund.refundAmount'
  | 'refund.reschedule'
  | 'refund.noShow'
  | 'refund.processingTime'
  | 'common.loading'
  | 'common.error'
  | 'common.retry'
  | 'common.back'
  | 'common.continue'
  | 'common.cancel'
  | 'common.close'
  | 'common.spotsAvailable';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.adventures': 'Adventures',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.language': 'Language',
    'nav.currency': 'Currency',
    'product.from': 'From',
    'product.perGuest': '/guest',
    'product.duration': 'Duration',
    'product.location': 'Location',
    'product.rating': 'Rating',
    'product.reviews': 'reviews',
    'product.whatsIncluded': "What's Included",
    'product.whatsExcluded': "What's Not Included",
    'product.overview': 'Overview',
    'product.itinerary': 'Itinerary',
    'product.meetingPoint': 'Meeting Point',
    'product.thingsToKnow': 'Things to Know',
    'product.relatedAdventures': 'Related Adventures',
    'product.bookNow': 'Book Now',
    'product.showDates': 'Show Dates',
    'product.instantConfirmation': 'Instant Confirmation',
    'product.freeCancellation': 'Free Cancellation',
    'product.hotelPickupAvailable': 'Hotel Pickup Available',
    'booking.selectDate': 'Select Date',
    'booking.selectTime': 'Select Time',
    'booking.howManyTravellers': 'How Many Travellers?',
    'booking.adults': 'Adults',
    'booking.children': 'Children',
    'booking.totalPrice': 'Total Price',
    'booking.next': 'Next',
    'booking.review': 'Review Booking',
    'booking.change': 'Change',
    'booking.save': 'Save',
    'payment.selectMethod': 'Select Payment Method',
    'payment.creditCard': 'Credit Card',
    'payment.debitCard': 'Debit Card',
    'payment.gopay': 'GoPay',
    'payment.qris': 'QRIS',
    'payment.bankTransfer': 'Bank Transfer',
    'payment.applePay': 'Apple Pay',
    'payment.secure': 'Secure Payment',
    'confirmation.success': 'Booking Confirmed!',
    'confirmation.bookingId': 'Booking ID',
    'confirmation.downloadPdf': 'Download PDF',
    'confirmation.addToWallet': 'Add to Wallet',
    'refund.cancelPolicy': 'Cancellation Policy',
    'refund.cancelFee': 'Cancel fee 20% (refund 80%) if cancelled ≥24h before activity',
    'refund.refundAmount': 'Refund Amount',
    'refund.reschedule': 'Reschedule available ≥24h before activity (free)',
    'refund.noShow': 'No-show: 100% fee (0% refund)',
    'refund.processingTime': 'Refunds processed within 3 business days',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.back': 'Back',
    'common.continue': 'Continue',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.spotsAvailable': 'spots available',
  },
  id: {
    'nav.home': 'Beranda',
    'nav.adventures': 'Petualangan',
    'nav.about': 'Tentang',
    'nav.contact': 'Kontak',
    'nav.language': 'Bahasa',
    'nav.currency': 'Mata Uang',
    'product.from': 'Mulai dari',
    'product.perGuest': '/orang',
    'product.duration': 'Durasi',
    'product.location': 'Lokasi',
    'product.rating': 'Penilaian',
    'product.reviews': 'ulasan',
    'product.whatsIncluded': 'Termasuk',
    'product.whatsExcluded': 'Tidak Termasuk',
    'product.overview': 'Ringkasan',
    'product.itinerary': 'Jadwal',
    'product.meetingPoint': 'Titik Pertemuan',
    'product.thingsToKnow': 'Yang Perlu Diketahui',
    'product.relatedAdventures': 'Petualangan Serupa',
    'product.bookNow': 'Pesan Sekarang',
    'product.showDates': 'Lihat Jadwal',
    'product.instantConfirmation': 'Konfirmasi Instan',
    'product.freeCancellation': 'Pembatalan Gratis',
    'product.hotelPickupAvailable': 'Jemput Hotel Tersedia',
    'booking.selectDate': 'Pilih Tanggal',
    'booking.selectTime': 'Pilih Jam',
    'booking.howManyTravellers': 'Berapa Orang?',
    'booking.adults': 'Dewasa',
    'booking.children': 'Anak-anak',
    'booking.totalPrice': 'Total Harga',
    'booking.next': 'Lanjut',
    'booking.review': 'Review Pemesanan',
    'booking.change': 'Ubah',
    'booking.save': 'Simpan',
    'payment.selectMethod': 'Pilih Metode Pembayaran',
    'payment.creditCard': 'Kartu Kredit',
    'payment.debitCard': 'Kartu Debit',
    'payment.gopay': 'GoPay',
    'payment.qris': 'QRIS',
    'payment.bankTransfer': 'Transfer Bank',
    'payment.applePay': 'Apple Pay',
    'payment.secure': 'Pembayaran Aman',
    'confirmation.success': 'Pemesanan Berhasil!',
    'confirmation.bookingId': 'Kode Booking',
    'confirmation.downloadPdf': 'Unduh PDF',
    'confirmation.addToWallet': 'Tambah ke Wallet',
    'refund.cancelPolicy': 'Kebijakan Pembatalan',
    'refund.cancelFee': 'Biaya batal 20% (refund 80%) jika dibatalkan ≥24 jam sebelum aktivitas',
    'refund.refundAmount': 'Jumlah Refund',
    'refund.reschedule': 'Reschedule tersedia ≥24 jam sebelum aktivitas (gratis)',
    'refund.noShow': 'Tidak datang: biaya 100% (refund 0%)',
    'refund.processingTime': 'Refund diproses dalam 3 hari kerja',
    'common.loading': 'Memuat...',
    'common.error': 'Terjadi kesalahan',
    'common.retry': 'Coba Lagi',
    'common.back': 'Kembali',
    'common.continue': 'Lanjutkan',
    'common.cancel': 'Batal',
    'common.close': 'Tutup',
    'common.spotsAvailable': 'slot tersedia',
  },
};

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: TranslationKey): string {
  return translations[currentLocale][key] ?? key;
}

export function formatPrice(amount: number, currency: string = 'IDR'): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
