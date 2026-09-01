# Product Requirements Document (PRD) & Product Planning Specification (PPS)
**Project Name:** Venture Bali  
**Platform:** Web App & Mobile PWA (Progressive Web App)  
**Target Deployment Environment:** Hostinger Business Web Hosting (Linux, Node.js, MySQL/MariaDB, Cron Job)  
**Tech Stack Recommended:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Prisma ORM, Zustand, Midtrans Snap API.

---

## 1. Executive Summary & Visi Proyek
Venture Bali adalah platform *booking engine* dan agregator pariwisata petualangan di Bali (contoh: ATV, Rafting, Cruising) yang dirancang dengan pendekatan *mobile-first*. Visi proyek ini adalah menghadirkan sistem pemesanan yang cepat, adaptif, berstandar konversi tinggi (menggabungkan estetika Airbnb dan alur konversi GetYourGuide), serta dilengkapi **Autonomous Marketing & SEO Engine** berbasis kecerdasan buatan (*AI-driven*). Sistem ini dirancang mandiri agar dapat mendatangkan trafik organik secara masif dan memasarkan dirinya sendiri (*self-marketing*) tanpa memerlukan tim operasional atau pemasaran khusus.

## 2. Product Overview & Core Value Propositions
*   **Dynamic Variant Selection:** Pilihan fleksibel antara *Meet at Location* (Direct) atau *With Transfer* (Pick-up) lengkap dengan opsi **"TBA (To Be Announced) / Konfirmasi H-1"** untuk mengeliminasi potensi pelanggan *drop-out*.
*   **Smart Pricing Engine (Tiered Pricing):** Harga dinamis berdasarkan jumlah peserta (*pax ranges*, misal: 1-2 pax, 3-4 pax) dengan tampilan harga diskon coret (*strikethrough*).
*   **Autonomous AI Content & SEO Wizard:** Modul pintar di panel admin yang terhubung dengan LLM (Gemini Free Tier / multi-provider) untuk men-generate artikel *long-tail SEO*, skema markup, dan draf promosi secara otomatis.
*   **Centralized SEO Article Database & Archive:** Penyimpanan seluruh konten AI dalam tabel database khusus (`Article`) dan halaman arsip blog (`/blog`) untuk membangun *topical authority* dan *internal linking matrix* secara otomatis.
*   **Zero-Cost Marketing & Ad Wizard:** Generator otomatis untuk teks iklan (*Ad Copy*) dan postingan sosial media yang mempermudah ekspansi pemasaran.

## 3. Business Goals & Key Performance Indicators (KPIs)
*   **Organic Traffic Growth:** Peningkatan trafik pencarian organik sebesar 30% MoM melalui automasi artikel *long-tail SEO* dan *Programmatic SEO*.
*   **Operational Cost Efficiency:** Pengoperasian murni otonom dengan biaya operasional mendekati nol (*zero-cost marketing*) menggunakan infrastruktur hosting yang efisien dan kuota AI gratis.
*   **Conversion Rate:** Target *visitor-to-booking* > 8% melalui alur pembayaran instan via Midtrans Snap.
*   **System Performance:** Skor Lighthouse SEO & Performance > 90, dengan nilai LCP (*Largest Contentful Paint*) < 2.5 detik.

## 4. Target User Personas & User Journey
*   **Persona 1: Global Explorer (25-45 tahun)** – Turis asing, mengutamakan kemudahan pembayaran (*Credit Card/VA*), layanan antar-jemput hotel (*Transfer*), dan informasi berbahasa Inggris.
*   **Persona 2: Local Adventurer (18-35 tahun)** – Wisatawan domestik, menggunakan kendaraan pribadi (*Direct*), pembayaran instan via QRIS/e-Wallet.
*   **User Journey:** Pencarian Google (Organic/SEO) -> Halaman Produk -> Konfigurasi Varian & Pax (Sticky Bottom Bar) -> Isi Detail Kontak & TBA Hotel -> Pembayaran Instan (Midtrans) -> Penerbitan E-Voucher ber-QR Code.

## 5. Functional Requirements (Spesifikasi Fungsional)
| Modul / Fitur | Deskripsi Fungsional & Logika Bisnis | Kriteria Penerimaan (*Acceptance Criteria*) |
| :--- | :--- | :--- |
| **Product & Variant Engine** | Pengelolaan produk dengan opsi *Direct* vs *Transfer* dan manajemen slot waktu. | Opsi transfer otomatis membuka form alamat hotel atau pilihan checkbox "TBA". |
| **Tiered Pricing System** | Kalkulasi harga otomatis berdasarkan jumlah peserta (*pax*). | Harga berubah dinamis di UI; menampilkan harga coret jika promo aktif. |
| **AI Content & SEO Wizard** | Panel admin untuk men-generate artikel blog, meta deskripsi, dan tagar sosmed via AI. | Artikel tersimpan otomatis ke database, terhubung ke sitemap, dan bernilai SEO valid. |
| **Automated Internal Linking** | Sistem memindai kata kunci produk pada artikel baru dan menautkannya secara otomatis. | Tautan internal (*internal links*) aktif mengarah ke halaman produk terkait (`/product/[slug]`). |
| **Checkout & TBA Logic** | Validasi data pemesan dan bypass alamat jika status pemesan dicentang TBA. | Data tersimpan aman di database; status transaksi terhubung ke Midtrans webhook. |
| **E-Voucher & QR Code** | Pembuatan bukti pemesanan instan setelah pembayaran terkonfirmasi (*settlement*). | E-Voucher dapat diakses via tautan unik dengan QR Code valid. |

## 6. Non-Functional Requirements & SEO Infrastructure
*   **Server-Side Rendering (SSR):** Dibangun menggunakan Next.js App Router agar halaman produk dan blog dirender secara utuh demi memudahkan perayapan oleh *crawler* Google.
*   **Technical SEO Automation:**
    *   **Dynamic Metadata:** Penggunaan fungsi `generateMetadata` untuk mengatur `<title>`, deskripsi, dan OpenGraph secara dinamis dari database.
    *   **Structured Data (JSON-LD):** Penyematan Schema.org tipe `Product`, `TouristAttraction`, `BlogPosting`, dan `FAQPage` untuk mendapatkan *Rich Snippets*.
    *   **Automated Sitemap & Robots:** Pembuatan file `sitemap.ts` dan `robots.ts` secara dinamis, di mana halaman sensitif (seperti `/checkout` dan `/voucher`) diset ke status `noindex, nofollow`.
*   **Security & Validation:** Validasi harga secara ketat di sisi server (*server-side price validation*) guna mencegah manipulasi nilai transaksi.

## 7. Database Architecture (Prisma Schema Design)
*Struktur database dirancang kompatibel dengan MySQL (mendukung Hostinger Business Hosting) maupun PostgreSQL (via Supabase/Neon):*

*   **`Product`**: Menyimpan data utama aktivitas (ID, slug, title, metaDesc, basePrice, rating, images).
*   **`Variant`**: Menyimpan opsi jenis layanan (Direct / Transfer) dan fasilitas inklusif.
*   **`TierPrice`**: Pengaturan rentang jumlah peserta (`minPax`, `maxPax`, `price`).
*   **`Article` (Pusat SEO Otonom)**: Menyimpan artikel blog hasil generate AI (`id`, `slug`, `title`, `content`, `metaDesc`, `tags`, `publishedAt`).
*   **`Booking` & `Customer`**: Perekaman data transaksi, status pembayaran (*PENDING, SETTLEMENT, CANCELLED*), serta detail penjemputan termasuk flag `isTba`.

## 8. Information Architecture (Situs & Rute URL)
*   ` / ` : Beranda (Pencarian, Kategori, Top Adventures).
*   ` /product/[slug] ` : Halaman Detail Produk & Konversi Pemesanan (*Single-Page Flow*).
*   ` /blog ` : Halaman Arsip Utama Konten SEO / Artikel AI.
*   ` /blog/[slug] ` : Halaman Detail Artikel / Panduan Wisata (Mendatangkan trafik organik).
*   ` /checkout/[session_id] ` : Halaman Form Data Pemesan (`noindex, nofollow`).
*   ` /voucher/[booking_id] ` : Halaman E-Voucher Digital (`noindex, nofollow`).
*   ` /admin/... ` : Panel Pengendali Operator & AI Content Wizard.

## 9. AI Agent Implementation Protocol (Instruksi Eksekusi untuk AI Coding Assistant)

Panduan langkah demi langkah bagi AI Agent untuk membangun proyek ini:

1.  **Phase 1 - Inisialisasi & Fondasi SEO:**
    *   Inisialisasi proyek Next.js 14+ (App Router, TypeScript, Tailwind CSS).
    *   Instalasi dependensi utama: `prisma`, `zustand`, `zod`, `lucide-react`, `date-fns`, `schema-dts`.
    *   Konfigurasi file `src/app/sitemap.ts` dan `src/app/robots.ts`.
2.  **Phase 2 - Skema Database & Kompatibilitas Hostinger:**
    *   Penyusunan file `schema.prisma` (mendukung MySQL untuk Hostinger Business Web Hosting / Prisma ORM).
    *   Pembuatan tabel `Product`, `Variant`, `TierPrice`, `Article`, and `Booking`.
3.  **Phase 3 - Pengembangan UI & Halaman Produk (SSR):**
    *   Penerapan fungsi `generateMetadata` dinamis untuk SEO on-page.
    *   Pembangunan komponen antarmuka responsif (Bento Grid galeri, *Sticky Bottom Bar*, dan *Variant Comparator*).
4.  **Phase 4 - Integrasi AI Content Wizard & Cron Job:**
    *   Pembuatan API helper penghubung Gemini API (*free tier*) di backend.
    *   Penyusunan modul otomatisasi artikel *long-tail* yang langsung tersimpan ke tabel `Article` serta otomatis memperbarui sitemap.
    *   Pendaftaran tugas otomatis (*Cron Job*) di hPanel Hostinger untuk pemeliharaan konten rutin.
5.  **Phase 5 - Integrasi Pembayaran & Finalisasi:**
    *   Integrasi Midtrans Snap API dan penanganan *webhook* transaksi.
    *   Penerbitan E-Voucher berbasis QR Code.

---

## 10. AI Agent Specification (Customer Service AI)

### 10.1 Agent Overview

Venture Bali AI Agent adalah asisten virtual 24/7 yang menangani pertanyaan pelanggan, membantu pemesanan, dan memberikan informasi produk secara otomatis melalui berbagai channel.

### 10.2 Agent Capabilities

| Capability | Description |
|------------|-------------|
| **Product Inquiry** | Menjawab pertanyaan tentang produk (ATV, Rafting, Tubing, dll) |
| **Pricing Information** | Memberikan informasi harga berdasarkan jumlah peserta |
| **Availability Check** | Memeriksa slot waktu yang tersedia |
| **Booking Assistance** | Membantu proses pemesanan step-by-step |
| **Refund Policy** | Menjelaskan kebijakan refund dan cancellation |
| **Meeting Point Info** | Memberikan informasi lokasi dan petunjuk arah |
| **Weather Advisory** | Memberikan informasi cuaca dan implikasi terhadap kegiatan |
| **Language Support** | Bahasa Indonesia, Bahasa Inggris |

### 10.3 Available Channels

| Channel | Priority | Target Audience |
|---------|----------|----------------|
| **WhatsApp Business** | PRIMARY | Pelanggan Indonesia & tourist |
| **Telegram Bot** | SECONDARY | Tourist Internasional |
| **Web Chat Widget** | SUPPORT | Website visitors |

### 10.4 AI Function Tools

Agent menggunakan Function Calling untuk interaksi dengan database:

```typescript
// Tool Definitions for Gemini
const tools = [
  {
    name: "checkAvailability",
    description: "Check slot availability for a product",
    parameters: {
      productSlug: "string",
      date: "string (YYYY-MM-DD)"
    }
  },
  {
    name: "getProductInfo",
    description: "Get detailed product information",
    parameters: {
      productSlug: "string"
    }
  },
  {
    name: "calculatePrice",
    description: "Calculate price for group size",
    parameters: {
      variantId: "string",
      paxCount: "number"
    }
  },
  {
    name: "createBooking",
    description: "Create a provisional booking",
    parameters: {
      customerName: "string",
      customerEmail: "string",
      customerWhatsApp: "string",
      productSlug: "string",
      variantId: "string",
      bookingDate: "string",
      paxCount: "number",
      hotelAddress: "string (optional)"
    }
  },
  {
    name: "getRefundPolicy",
    description: "Get refund and cancellation policy",
    parameters: {}
  },
  {
    name: "sendBookingConfirmation",
    description: "Send booking confirmation via WhatsApp",
    parameters: {
      bookingId: "string"
    }
  }
];
```

### 10.5 Conversation Flow

```
User -> Channel (WhatsApp/Telegram/Web)
         |
         v
    Channel Adapter
         |
         v
    AgentService (Core AI)
         |
         v
    Intent Detection -> Gemini LLM
         |
         v
    Tool Execution (if needed)
    - checkAvailability
    - getProductInfo
    - calculatePrice
    - createBooking
         |
         v
    Response Formatting
         |
         v
    Channel Adapter (WhatsApp/Telegram/Web format)
         |
         v
User
```

### 10.6 Intent Classification

| Intent | Description | Response Type |
|--------|-------------|---------------|
| `greeting` | User menyapa | Welcome message |
| `product_inquiry` | Bertanya tentang produk | Product info |
| `price_inquiry` | Bertanya tentang harga | Price calculation |
| `availability_inquiry` | Cek ketersediaan | Slot availability |
| `booking_request` | Ingin memesan | Booking flow |
| `refund_inquiry` | Bertanya refund | Policy explanation |
| `location_inquiry` | Bertanya lokasi | Meeting point info |
| `general_question` | Pertanyaan umum | Contextual response |
| `escalation` | Butuh bantuan manusia | Human handoff |

### 10.7 Limitations & Fallbacks

| Scenario | Handling |
|----------|----------|
| **Invalid parameters** | Kembalikan validation_error, minta klarifikasi |
| **API failure** | Fallback response, coba lagi atau eskalasi |
| **Out of scope** | "Maaf, saya tidak bisa membantu untuk itu. Silakan hubungi support." |
| **Rate limiting** | Queue dan retry dengan delay |
| **No matching intent** | Berikan response generik, tawarkan bantuan |

## 11. WhatsApp Business Integration

### 11.1 Setup Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| WhatsApp Business Account | Needed | Hubungi Meta Business |
| Meta Business ID | Needed | Verifikasi bisnis diperlukan |
| Phone Number | Needed | Dedicated number untuk WhatsApp |
| WhatsApp Business API | Needed | Via Meta Business Platform |

### 11.2 API Configuration

```typescript
// WhatsApp API Configuration
const whatsappConfig = {
  apiVersion: 'v18.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  webhookUrl: '/api/webhooks/whatsapp'
};
```

### 11.3 Message Templates (Pre-approved)

| Template Name | Purpose | Trigger |
|---------------|---------|---------|
| `booking_confirmation` | Konfirmasi pemesanan | After successful payment |
| `reminder_24h` | Reminder H-24 | 24 hours before activity |
| `reminder_2h` | Reminder H-2 | 2 hours before activity |
| `review_request` | Minta review | 24 hours after activity |
| `payment_reminder` | Reminder pembayaran | For pending payments |

### 11.4 Webhook Events

```typescript
// Incoming Webhook Events
const webhookEvents = [
  'messages',        // New message received
  'message_deliveries', // Delivery status
  'message_reads',    // Read status
  'message_reactions' // Reactions
];
```

### 11.5 Notification Schedule

| Event | Channel | Timing | Message Type |
|-------|---------|--------|--------------|
| Booking created | WhatsApp | Instant | Template: booking_confirmation |
| Payment confirmed | WhatsApp | Instant | Template: booking_confirmation |
| Reminder | WhatsApp | H-24 | Template: reminder_24h |
| Final reminder | WhatsApp | H-2 | Template: reminder_2h |
| Review request | WhatsApp | H+24 | Template: review_request |

### 11.6 Quick Reply Buttons

Agent dapat mengirim Quick Reply buttons:

```
👋 Halo! Saya asisten Venture Bali. Ada yang bisa saya bantu?

[🎫 Lihat Produk] [💰 Cek Harga] [📅 Cek Ketersediaan] [❓ FAQ]
```

### 11.7 Rich Media Support

| Media Type | Use Case | Format |
|------------|----------|--------|
| Image | Product photos, vouchers | JPEG, PNG |
| Document | Voucher PDF, itinerary | PDF |
| Location | Meeting point, hotel pickup | Google Maps link |
| Video | Product preview (optional) | MP4 |
### 11.7 Rich Media Support

| Media Type | Use Case | Format |
|------------|----------|--------|
| Image | Product photos, vouchers | JPEG, PNG |
| Document | Voucher PDF, itinerary | PDF |
| Location | Meeting point, hotel pickup | Google Maps link |
| Video | Product preview (optional) | MP4 |

---

## 12. Telegram Bot Integration

### 12.1 Bot Setup

| Item | Value |
|------|-------|
| Bot Username | @VentureBaliBot |
| Bot Father Token | Stored in env |
| Webhook URL | /api/webhooks/telegram |

### 12.2 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message & main menu |
| `/help` | Help information |
| `/products` | List all products |
| `/book` | Start booking flow |
| `/mybookings` | View user's bookings |
| `/cancel` | Cancel a booking |
| `/contact` | Contact human support |

### 12.3 Inline Keyboards

```
Product Categories:
[🏍️ ATV] [🚣 Rafting] [🛶 Tubing] [🌊 More...]

Quick Actions:
[📅 Cek Ketersediaan] [💬 Chat dengan AI] [📞 Hubungi Support]
```

### 12.4 Language Support
### 12.4 Language Support

| Language | Code | Trigger |
|----------|------|---------|
| Bahasa Indonesia | id | Default |
| English | en | /language en |
| 日本語 | ja | /language ja |
| 中文 | zh | /language zh |

---

## 13. Multi-Channel AI Workflow

### 13.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Channels                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ WhatsApp  │  │  Telegram  │  │   Web Chat Widget  │   │
│  │ Business  │  │    Bot     │  │                    │   │
│  └─────┬──────┘  └─────┬──────┘  └────────┬───────────┘   │
│        │               │                    │               │
└────────┼───────────────┼────────────────────┼───────────────┘
         │               │                    │
         v               v                    v
┌─────────────────────────────────────────────────────────────┐
│                 Channel Adapters                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │WhatsApp   │  │ Telegram   │  │    Web Chat         │   │
│  │ Adapter    │  │ Adapter    │  │    Adapter          │   │
│  └─────┬──────┘  └─────┬──────┘  └────────┬───────────┘   │
└────────┼───────────────┼────────────────────┼───────────────┘
         │               │                    │
         └───────────────┼────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│                  AgentService (Core)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Intent Classification (Gemini)                     │    │
│  │  - Message Parsing                                  │    │
│  │  - Intent Detection                                 │    │
│  │  - Entity Extraction                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Tool Execution                                     │    │
│  │  - checkAvailability()                              │    │
│  │  - getProductInfo()                                 │    │
│  │  - calculatePrice()                                 │    │
│  │  - createBooking()                                  │    │
│  │  - sendConfirmation()                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Response Generation                                │    │
│  │  - Multi-language Support                           │    │
│  │  - Channel-specific Formatting                       │    │
│  │  - Quick Reply Buttons                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│                 Data Layer                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │   Prisma   │  │   Gemini   │  │    WhatsApp/TG     │   │
│  │   Database │  │    API     │  │      APIs           │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 Request Flow

1. **User sends message** (WhatsApp/Telegram/Web)
2. **Channel Adapter** normalizes the message
3. **AgentService** receives normalized input
4. **Intent Detection** classifies user intent
5. **Tool Execution** (if needed) queries database
6. **Response Generation** creates formatted reply
7. **Channel Adapter** formats for specific channel
8. **Response sent** back to user

### 13.3 Session Management

| Session Property | Description |
|------------------|-------------|
| `sessionId` | Unique conversation ID |
| `channel` | whatsapp/telegram/web |
| `userId` | Customer ID (if logged in) |
| `phone` | WhatsApp/Telegram number |
| `language` | Preferred language |
| `context` | Conversation history |
| `lastIntent` | Previous intent |
| `lastProduct` | Last viewed product |

### 13.4 Error Handling

| Error | Response |
|-------|----------|
| **Invalid phone format** | "Format nomor WhatsApp tidak valid. Contoh: 6281234567890" |
| **Invalid date format** | "Format tanggal tidak valid. Gunakan format: YYYY-MM-DD" |
| **Product not found** | "Maaf, produk tidak ditemukan. Ketik 'produk' untuk melihat daftar." |
| **No availability** | "Mohon maaf, tidak ada slot tersedia untuk tanggal tersebut. Coba tanggal lain?" |
| **API timeout** | "Server sedang sibuk. Silakan coba beberapa saat lagi." |
| **Rate limited** | "Terlalu banyak permintaan. Mohon tunggu sebentar." |

| Language | Code | Trigger |
|----------|------|---------|
| Bahasa Indonesia | id | Default |
| English | en | /language en |
| 日本語 | ja | /language ja |
| 中文 | zh | /language zh |
| Language | Code | Trigger |
|----------|------|---------|
| Bahasa Indonesia | id | Default |
| English | en | /language en |
| 日本語 | ja | /language ja |
| 中文 | zh | /language zh |

---

## 14. Updated Development Phases

### Phase 1: Foundation & Documentation (COMPLETED)
- [x] Project setup with Next.js 14+
- [x] TypeScript configuration
- [x] Tailwind CSS setup
- [x] Prisma schema design
- [x] Refund policy implementation
- [x] Project structure documentation
- [x] Development workflow documentation

### Phase 2: Core Business Logic (IN PROGRESS)
- [ ] Pricing utility (tiered pricing)
- [ ] Product variant selector
- [ ] Slot time picker
- [ ] Meeting point display

### Phase 3: AI Agent Core (NEW)
- [ ] AI Chat API route (`/api/ai/chat`)
- [ ] Gemini API integration
- [ ] AgentService implementation
- [ ] Tool definitions
- [ ] Session management

### Phase 4: WhatsApp Integration (NEW)
- [ ] WhatsApp Business API setup
- [ ] Webhook handler
- [ ] Message templates
- [ ] Notification scheduler
- [ ] Quick reply buttons

### Phase 5: Telegram Integration (NEW)
- [ ] Telegram Bot setup
- [ ] Bot commands
- [ ] Inline keyboards
- [ ] Language selection

### Phase 6: Web Chat Widget (NEW)
- [ ] Chat widget UI component
- [ ] Floating button
- [ ] Message interface
- [ ] Quick actions

### Phase 7: Payment & Booking (EXISTING)
- [ ] Midtrans Snap integration
- [ ] Webhook handling
- [ ] E-Voucher generation
- [ ] QR Code display

---

## 15. Glossary & Definitions

| Term | Definition |
|------|------------|
| **AI Agent** | Virtual assistant powered by Gemini LLM for customer service |
| **Function Calling** | Gemini feature to execute defined functions/tools |
| **WhatsApp Business API** | Meta's API for business messaging on WhatsApp |
| **Telegram Bot** | Automated account for handling messages on Telegram |
| **Web Chat Widget** | Embedded chat interface on the website |
| **Channel Adapter** | Code that normalizes messages between channels |
| **AgentService** | Core AI logic that handles all customer interactions |
| **Intent Classification** | Process of determining what the user wants |
| **Tool Execution** | Running database/API functions based on user intent |
| **Session Management** | Tracking conversation context across messages |
| **H-24/H-2** | Hours before/after the activity (e.g., H-24 = 24 hours before) |
| **Slot Time** | Available time window for an activity |
| **Tiered Pricing** | Different prices based on number of participants |
| **Meeting Point** | Physical location where customer meets the provider |
| **TBA** | To Be Announced - hotel address confirmed later |

---

## 16. References

| Document | Location |
|----------|----------|
| Project Structure | `docs/PROJECT_STRUCTURE.md` |
| Development Workflow | `docs/DEVELOPMENT_WORKFLOW.md` |
| Refund Policy | `docs/REFUND_POLICY.md` |
| No-Show Policy | `docs/NO_SHOW_POLICY.md` |
| Source Code Types | `src/types/venture.ts` |
| Refund Utilities | `src/lib/refundUtils.ts` |

---

**Document Version:** 2.0.0  
**Last Updated:** August 27, 2026  
**Status:** Complete with AI Agent Specification