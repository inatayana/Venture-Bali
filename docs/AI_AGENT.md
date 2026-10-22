# Venture Bali — AI Customer Service Agent

> **Version:** 1.0.0
> **Last Updated:** October 2026
> **Status:** ACTIVE — MUST FOLLOW
> **Related:** `docs/REFUND_POLICY.md`, `docs/NO_SHOW_POLICY.md`, `docs/BOOKING_ARCHITECTURE.md`, `docs/TECH_DECISION_LOG.md`

---

## 1. Prinsip Utama

> **Tools adalah sumber kebenaran. Model hanya menjelaskannya.**

Agent AI berbicara dengan customer. Kalau agent mengarang harga, slot, atau
kebijakan refund, itu kerugian bisnis dan risiko hukum. Karena itu:

| Aturan | Kenapa | Ditegakkan oleh |
|--------|--------|-----------------|
| Harga, slot, dan policy **tidak pernah** berasal dari memory model | Model bisa berhalusinasi | Semua tool query DB / `refundUtils.ts` |
| Kategori produk hanya 9 kategori | Guardrail produk | `src/lib/taxonomy.ts` |
| Judul produk & artikel wajib lolos konstitusi | SEO & brand | `src/lib/titleValidator.ts` |
| Nama vendor tidak boleh muncul | Whitelabel | System instruction agent |
| Nama brand tidak boleh muncul di konten | Brand | Validasi artikel + system instruction |
| Policy refund hanya dari `refundUtils.ts` | `REFUND_POLICY.md` wajib dipatuhi | `REFUND_WINDOWS` |

---

## 2. Arsitektur

```
Customer (WhatsApp / Telegram / Web)
        │
        ▼
  Channel Adapter  ── webhook route
        │
        ▼
  AgentSessionStore        ← percakapan disimpan di DB (AgentSession)
        │
        ▼
  handleAgentMessage()      ← src/lib/agent-service.ts
        │
        ├── Gemini klasifikasi intent ──► agent-intent.ts
        │      (fallback: keyword matcher)
        │
        ├── Gemini function call ──► tools.ts
        │      │                        │
        │      │                        ├─ getProductInfo    → DB
        │      │                        ├─ calculatePrice    → DB price tiers
        │      │                        ├─ checkAvailability → DB slot times
        │      │                        └─ getRefundPolicy   → refundUtils.ts
        │      │
        │      ▼
        │   Gemini menulis jawaban dari hasil tool
        │
        ▼
  Balas ke customer
```

---

## 3. File Penting

| File | Isi |
|------|-----|
| `src/lib/gemini.ts` | Klien REST Gemini. Tanpa dependency baru. Timeout 30 detik, return `null` saat gagal. |
| `src/lib/agent-intent.ts` | Klasifikasi intent (keyword + Gemini) + ekstraksi jumlah peserta. |
| `src/lib/agent-service.ts` | Orkestrasi: intent → tool → balasan. |
| `src/lib/tools.ts` | Implementasi tool. **Semua query DB.** |
| `src/lib/agentSessionStore.ts` | Load/save session di tabel `AgentSession`. |
| `src/lib/aiContent.ts` | Generator artikel SEO + validasi + internal linking. |
| `src/lib/agent.ts` | Tipe: `AgentState`, `Intent`, output tool. |
| `src/lib/refundUtils.ts` | Sumber kebenaran policy refund (`REFUND_WINDOWS`). |

---

## 4. Tool yang Tersedia

| Tool | Kapan dipakai | Sumber data |
|------|---------------|--------------|
| `getProductInfo` | "ada produk apa?" | DB (`Venture` + relasi) |
| `calculatePrice` | "berapa harganya?" | DB (`PriceTier` per pax) |
| `checkAvailability` | "kapan tersedia?" | DB (`SlotTime` + `blackoutDates`) |
| `getRefundPolicy` | "kebijakan refund?" | `refundUtils.ts` |
| `createBooking` | "mau booking" | **Belum persist** — booking dibuat oleh checkout flow |
| `sendBookingConfirmation` | Kirim konfirmasi | Placeholder (belum terpasang ke Meta API) |

### Catatan penting
- `createBooking` mengembalikan `persisted: false`. Row booking **dibuat oleh
  checkout flow**, bukan oleh agent. Jangan pernah menyatakan booking sudah
  tersimpan kalau `persisted` false.
- Kalau `getProductInfo` mengembalikan `found: false`, agent harus
  mengatakan produknya tidak ada — **jangan mengganti** dengan produk lain.

---

## 5. Gemini

```bash
# .env
GEMINI_API_KEY="..."           # dari Google AI Studio
GEMINI_MODEL="gemini-3.8-flash"   # opsional, default sama
```

> ⚠️ **Model retirement:** Google sudah me-retire identifier
> `gemini-2.0-flash` dan API membalas 404 dengan "This model is no longer
> available". Default di `src/lib/gemini.ts` sudah diarahkan ke
> `gemini-3.8-flash`. Kalau model berubah lagi, perbarui
> `DEFAULT_GEMINI_MODEL` **dan** `GEMINI_MODEL` di `.env.example`.

- Tanpa `GEMINI_API_KEY`, agent otomatis memakai jalur deterministik
  (keyword intent + template). **Tidak error.**
- Semua panggilan punya timeout 30 detik dan return `null` saat gagal —
  request user tidak menggantung. Saat Gemini gagal, agent **tidak** diam,
  tapi turun ke jalur deterministik.
- **Retry:** status `408/425/429/500/502/503/504` dicoba lagi maksimal 3
  kali dengan backoff eksponensial (0,8s → 1,6s → 3,2s). Free tier
  Gemini sering membalas 429/503.
- **Kuota habis** (429 dengan pesan "exceeded your current quota") **tidak**
  di-retry, karena tidak akan berhasil dalam window tersebut. Operator
  mendapat pesan yang jelas, bukan error generik.
- `getLastFailure()` mengembalikan alasan kegagalan terakhir, supaya UI
  bisa menjelaskan apa yang terjadi.
- Prompt memakai `temperature` rendah (0.2–0.6) supaya hasil stabil.

### Batas kuota free tier — penting untuk operasional

Kuota free tier Gemini untuk `generate_content_free_tier_requests` adalah
**20 request per hari per model**. Ini limit harian, bukan per menit.

| Yang dihitung | 1 request = 1 pemanggilan `generateContent` |
|---------------|-------------------------------------------|
| Satu balasan chat agent | 1–2 request (klasifikasi + tool + menulis balasan) |
| Satu artikel content wizard | 1 request |
| Generate artikel 166 produk | 166 request → **9 hari** |

Saat kuota habis, Gemini membalas 429 dengan
`"Quota exceeded ... Please retry in 4h41m"`. Aplikasi **tidak** retry
kasus ini (tidak akan berhasil dalam window tersebut) dan operator
melihat pesan yang jelas.

**Konsekuensi untuk strategi konten:**
- 166 artikel butuh ~9 hari free tier, atau 9 hari/run
- Jadwalkan cron artikel **maksimal ~15 per hari** supaya tidak kena limit
- Naikkan kuota lewat billing Google Cloud kalau butuh lebih cepat
- Pertimbangkan model lain (mis. `gemini-3.5-flash`) sebagai cadangan, karena
  kuota dihitung **per model**


---

## 6. Session

Tabel `AgentSession` menyimpan satu baris per percakapan:

| Kolom | Isi |
|-------|-----|
| `sessionKey` | Unik per channel user, mis. `wa_628123456789`, `tg_12345`, `web_<id>` |
| `channel` | `whatsapp` / `telegram` / `web` |
| `language` | `id` / `en` / `ja` / `zh` |
| `productId`, `variantId`, `paxCount`, `bookingDate` | Konteks percakapan |
| `intent` | Intent terakhir |
| `history` | Maksimal 12 turn terakhir (JSON) |

Session bisa dibersihkan berkala:

```ts
import { pruneAgentSessions } from '@/lib/agentSessionStore';
await pruneAgentSessions(30); // hapus yang idle > 30 hari
```

---

## 7. AI Content Wizard (`/admin/content`)

Panel admin untuk generate artikel long-tail SEO.

**Alur:**
1. Operator isi: judul (45-60 char), primary keyword, kategori, destination, produk tujuan.
2. Gemini menulis artikel (600-900 kata, markdown).
3. Artikel divalidasi: judul harus lolos konstitusi, slug valid, kategori
   dalam 9 kategori, tanpa emoji, tanpa nama brand, panjang minimum.
4. Link ke produk disisipkan otomatis.
5. Artikel disimpan ke tabel `Article`.

**Kenapa validasi ini wajib:** artikel adalah konten publik. Judul yang
melanggar konstitusi merusak SEO, dan penyebutan nama brand atau vendor
melanggar kontrak whitelabel.

---

## 8. Checklist Sebelum Menambah Tool Baru

- [ ] Tool membaca dari database, bukan dari konstanta
- [ ] Ada test yang mengunci perilakunya
- [ ] Deskripsi function declaration di `agent-service.ts` sesuai perilaku
- [ ] Kalau tool menyentuh harga → pakai `PriceTier` dari DB
- [ ] Kalau tool menyentuh policy → pakai `refundUtils.ts`
- [ ] Kalau tool mengembalikan "tidak ditemukan" → sertakan penanda eksplisit

---

## 9. Test

```bash
npm test -- --ci
```

Test yang mengunci perilaku kritis:
- `src/lib/tools.test.ts` — gagal kalau policy 72 jam / 70% muncul lagi
- `src/lib/aiContent.test.ts` — gagal kalau artikel lolos dengan emoji / nama brand
- `src/lib/agent-intent.test.ts` — klasifikasi intent & ekstraksi pax
- `src/lib/gemini.test.ts` — parsing, fallback, timeout
