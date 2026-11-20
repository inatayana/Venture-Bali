# BaliWild — Autonomous Organic Growth & Multi-Channel Content Architect

> **Version:** 0.1.0
> **Status:** DRAFT — menunggu keputusan owner (lihat §13)
> **Branch:** `feature/content-growth-architect-spec`
> **Related:** `AGENTS.md`, `docs/AI_AGENT.md`, `docs/SEO_STRATEGY.md`,
> `docs/SEO_TAXONOMY.md`, `docs/BRAND_GUIDELINES.md`,
> `docs/TEAM_WORKING_AGREEMENT.md`, `docs/TECH_DECISION_LOG.md`,
> `docs/PRODUCT_TITLE_CONSTITUTION.md`, `docs/BOOKING_ARCHITECTURE.md`,
> `docs/OPERATION_CONTRACT.md`, `docs/REFUND_POLICY.md`, `docs/NO_SHOW_POLICY.md`

---

## 0. Ringkasan Eksekutif

Blueprint ini merancang **agen otonom lintas-platform** yang menjalankan loop
organik berkelanjutan: menemukan permintaan nyata → memproduksi satu inti
konten → mengadaptasikannya ke banyak kanal → mengukur → menyegarkan yang
menurun. Standar kualitasnya setara Senior SEO + Content Strategist +
Growth/Monetization Ops, bukan sekadar "tulis artikel lalu sebar".

Sistem ini **bukan** pengganti `src/lib/aiContent.ts` dan `/admin/content`.
Ia adalah lapisan orkestrasi di atasnya: menambah state lifecycle, riset
lintas platform, format YouTube/TikTok/Facebook, quality gate berjenjang,
approval gate, dan monitor performa.

**Prinsip pembatas:** otomatisasi penuh hanya untuk riset, klasterisasi,
draf, audit teknis, dan pelaporan. Publikasi ke kanal utama dan klaim sensitif
(harga, kebijakan, dampak legal) wajib melalui persetujuan manusia.

---

## 1. Masalah & Tujuan

### 1.1 Masalah yang ingin dipecahkan

| Masalah | Dampak |
|---|---|
| Konten produksi manual, satu artikel dipakai ulang ke semua kanal | Kualitas turun, engagement rendah, rentan thin content |
| Tidak ada state terpusat soal "topik ini sudah dikerjakan / sedang di-review / sudah publish" | Pekerjaan berulang, tumpang tindih, topik kosong |
| Klaim faktual & harga kadang berasal dari ingatan model | Risiko halusinasi, masalah AdSense dan reputasi |
| Penurunan traffic terdeteksi terlambat | Kehilangan ranking & pendapatan |
| Tidak ada gate kualitas sebelum tayang | Judul melanggar konstitusi, brand bocor, emoji, slug jelek |

### 1.2 Tujuan

1. Menghasilkan **permintaan konten** dari data lintas platform, bukan tebakan.
2. Mengubah satu riset inti menjadi **banyak format native** per kanal.
3. Menjaga **kualitas & kepatuhan** di atas kecepatan produksi.
4. Memberi **visibilitas state** penuh dari ide sampai published & terukur.
5. Membangun **fondasi monetisasi yang aman** (termasuk AdSense) lewat konten
   orisinal, akurat, dan tidak melanggar brand.

### 1.3 Non-goal (v0.1)

- Bukan search engine / recommender system yang tandingan Google.
- Bukan auto-publish tanpa hatiku-hati — publish kanal utama tetap ber-gate.
- Bukan sistem afiliat/komisi/referral (dilarang `TEAM_WORKING_AGREEMENT.md` §4.11).

---

## 2. Prinsip Desain

1. **Tools adalah sumber kebenaran.** Model hanya menyusun & menjelaskan. Harga,
   slot, policy, kategori, dan judul wajib berasal dari DB / util yang ada
   (`src/lib/taxonomy.ts`, `src/lib/titleValidator.ts`, `src/lib/refundUtils.ts`).
2. **Satu inti riset, banyak format.** Topik kanonik dikunci dulu; format
   diturunkan dari brief yang sama, bukan ditulis ulang dari nol.
3. **State terpusat.** Agen tidak menyimpan memori lokal. Semua status ada di DB
   dan transisi lewat satu fungsi yang teraudit.
4. **Deterministik dulu, LLM kemudian.** Cek yang bisa dihitung (slug, panjang,
   emoji, duplikasi, brand string) jangan dipercayakan ke model.
5. **Quality gate sebelum publish.** Konten yang gagal gate tidak bisa dijadwalkan.
6. **Approval gate untuk risiko tinggi.** Manusia memegang publikasi sensitif.
7. **Multi-tenant aware.** Semua tabel pertumbuhan menyimpan `tenantId`
   (pola sama dengan `Review`, `Booking`).
8. **Bertahap & terukur.** MVP mengambil satu irisan paling aman dulu (artikel
   web + quality gate), bukan membangun lima platform sekaligus.

---

## 3. Arsitektur Sistem

### 3.1 Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     SUPERVISION & ALERTING                        │
│   dashboard / Slack-email digest / anomali 404-5xx / decay       │
└───────────────▲──────────────────────────────────────────────────┘
                │ metrik + audit event
┌───────────────┴──────────────────────────────────────────────────┐
│  MEASUREMENT LAYER                                                │
│  MetricSnapshot (impressions, clicks, CTR, position, retention)  │
└───────────────▲──────────────────────────────────────────────────┘
                │
┌───────────────┴──────────────────────────────────────────────────┐
│  DISTRIBUTION LAYER                                               │
│  web article │ YouTube │ TikTok │ Facebook │ AI-answer FAQ       │
└───────────────▲──────────────────────────────────────────────────┘
                │ PlatformPublish
┌───────────────┴──────────────────────────────────────────────────┐
│  PRODUCTION LAYER (5 spesialisasi mikro)                          │
│  ① Research  ② Editorial/Fact  ③ Format  ④ QA  ⑤ Monitor         │
└───────────────▲──────────────────────────────────────────────────┘
                │ GrowthTopic / ContentAsset / FactSource
┌───────────────┴──────────────────────────────────────────────────┐
│  STATE & ORCHESTRATION LAYER                                      │
│  state machine · scheduler · approval queue · audit log          │
└───────────────▲──────────────────────────────────────────────────┘
                │
┌───────────────┴──────────────────────────────────────────────────┐
│  DATA LAYER                                                       │
│  PostgreSQL (Prisma) · Supabase Storage · Gemini · platform APIs │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Lima spesialisasi mikro

Setiap spesialis adalah **modul dengan kontrak input/output tertulis**, bukan
satu prompt gemuk. Ini menahan biaya token dan memudahkan test.

| # | Spesialis | Tanggung jawab | Modul usulan |
|---|---|---|---|
| ① | **Search & Trend Intelligence** | menangkap query, intent, celah topik, tren lintas platform | `src/lib/growth/research.ts` |
| ② | **Editorial & Fact-Grounding** | menentukan angle, outline, brief, dan mengikat klaim ke fakta terverifikasi | `src/lib/growth/editorial.ts` |
| ③ | **Multi-Platform Format Producer** | menerjemahkan brief ke artikel, script, hook, caption, metadata | `src/lib/growth/format/*.ts` |
| ④ | **Quality & Compliance Gatekeeper** | checker deterministik + skor kualitas | `src/lib/growth/gate.ts` |
| ⑤ | **Growth & Technical Reliability Monitor** | decay, CTR opportunity, repurposing, audit 404/5xx/indeks | `src/lib/growth/monitor.ts` |

> Modul-modul di atas **usulan** dan belum dibuat. Fase 0 hanya menempatkan
> state + kontrak, bukan menulis semua modul.

### 3.3 Integrasi dengan aset existing

| Aset existing | Peran di sistem baru |
|---|---|
| `src/lib/aiContent.ts` | dipakai ulang sebagai **producer artikel web** (format producer) |
| `src/lib/titleValidator.ts` | checker wajib di gate |
| `src/lib/taxonomy.ts` | batasan 9 kategori di gate & brief |
| `src/lib/refundUtils.ts` | satu-satunya sumber klaim refund |
| `src/lib/seo.ts` | metadata, canonical, JSON-LD |
| `Article` (Prisma) | artefak artikel web yang dipublish |
| `src/app/api/cron/*` | pola cron + token auth yang sama |
| `src/lib/gemini.ts` | klien model, retry, fallback, kuota |
| `vercel.json` | penjadwalan cron Vercel |

---

## 4. Model Data (Usulan)

Semua tabel baru **usulan** dan memerlukan migration + persetujuan owner
(`AGENTS.md` §4 melarang mengubah `prisma/schema.prisma` tanpa migration).

| Model | Kolom inti | Fungsi |
|---|---|---|
| `GrowthTopic` | `id`, `tenantId`, `clusterId`, `canonicalTitle`, `intent`, `status`, `priority`, `source`, `owner`, timestamps | Topik kanonik; sumber kebenaran "apa yang sedang dikerjakan" |
| `KeywordSignal` | `id`, `topicId`, `query`, `platform`, `volume`, `difficulty`, `ctr`, `avgPosition`, `trend`, `serpFeatures` (Json), `capturedAt` | Data mentah riset per platform |
| `ContentAsset` | `id`, `topicId`, `tenantId`, `format` (`ARTICLE`/`VIDEO_SCRIPT`/`SHORT_HOOK`/`SOCIAL_POST`/`FAQ_BLOCK`), `platform`, `status`, `lang`, `title`, `payload` (Json), `currentVersionId` | Satu artefak format spesifik |
| `ContentVersion` | `id`, `assetId`, `version`, `contentHash`, `model`, `promptVersion`, `body` (Json), `changeNote`, `createdAt` | Jejak revisi + deteksi duplikasi |
| `FactSource` | `id`, `topicId`, `claim`, `sourceUrl`, `sourceType`, `retrievedAt`, `expiresAt` | Klaim faktual terverifikasi (lawan halusinasi) |
| `PlatformPublish` | `id`, `assetId`, `platform`, `status`, `externalId`, `publicUrl`, `approvalId?`, `publishedAt`, `errorCode` | Status publikasi per platform |
| `ApprovalRequest` | `id`, `assetId`, `tenantId`, `requestedBy`, `status` (`PENDING`/`APPROVED`/`REJECTED`/`EXPIRED`), `reviewer`, `reason`, `decidedAt` | Gerbang manusia |
| `MetricSnapshot` | `id`, `assetId`, `platform`, `date`, `impressions`, `clicks`, `ctr`, `avgPosition`, `retention`, `source` | Serapan metrik berkala |
| `AuditEvent` | `id`, `tenantId`, `entity`, `entityId`, `action`, `actor`, `fromStatus`, `toStatus`, `metadata` (Json), `createdAt` | Log immutable semua transisi & keputusan |

Aturan:
- `ContentVersion.contentHash` memakai hash canonical (mis. SHA-256 dari body
  dinormalisasi) untuk deteksi konten berulang antar topik.
- `Article` yang sudah ada **tidak diubah** dulu; `ContentAsset` baru dibuat dan
  menunjuk `Article` yang sudah ada bila relevan (`payload.articleId`).
- `MetricSnapshot.source` menyimpan asal data (GSC/YouTube/manual) supaya tidak
  dicampur sembarangan.

---

## 5. State Machine

Dua state terpisah: **topik** (keputusan editorial) dan **aset** (konten).

### 5.1 Status topik

```
DISCOVERED → TRIAGED → BRIEFED → IN_PRODUCTION → IN_REVIEW
     → APPROVED → SCHEDULED → PUBLISHED → MONITORED
                                        ├→ NEEDS_REFRESH → BRIEFED (loop)
                                        └→ ARCHIVED
```

- `DISCOVERED`: hasil riset mentah, belum dinilai.
- `TRIAGED`: sudah dinilai prioritas & intent; layak atau dibuang.
- `BRIEFED`: brief editorial + FactSource selesai.
- `IN_PRODUCTION`: format producer sedang bekerja.
- `IN_REVIEW`: melewati gate, menunggu manusia (atau auto-approve bila aman).
- `APPROVED`: boleh dijadwalkan.
- `SCHEDULED`: masuk antrean cron.
- `PUBLISHED`: minimal satu platform live.
- `MONITORED`: metrik diambil berkala.
- `NEEDS_REFRESH`: decay / CTR rendah / klaim usang.
- `ARCHIVED`: ditutup, tidak diulang.

### 5.2 Status aset

```
DRAFT → FACT_CHECK → STYLE_CHECK → BRAND_LEGAL_CHECK
     → READY → APPROVED → SCHEDULED → PUBLISHED → MEASURED
                                                  └→ REFRESH → DRAFT
```

Setiap transisi hanya lewat `transitionTopic()` / `transitionAsset()` yang:
- memvalidasi transisi legal,
- menulis `AuditEvent`,
- menolak transisi ilegal (mis. `DRAFT → PUBLISHED`).

---

## 6. Pipeline per Fase

### 6.1 Riset & Pemetaan Keyword Lintas Platform

**Sumber & metode per platform:**

| Platform | Sumber data | Metode |
|---|---|---|
| Google / Web | Search Console (query, impressions, CTR, position), autocomplete, People Also Ask, celah "impressions tinggi CTR rendah" | GSC API (perlu izin) / export CSV manual (Fase 0) |
| YouTube | autocomplete, video trending, komentar audiens | YouTube Data API (perlu izin) / manual (Fase 0) |
| TikTok | tren topik, frasa sehari-hari, angle viral | TikTok Research API (perlu izin) / observasi manual |
| Facebook | diskusi grup/komunitas, pertanyaan berulang | observasi manual / Meta Graph API bila ada |
| AI answer engines | conversational queries & entitas | kurated manual + klaster pertanyaan |

**Output:** `GrowthTopic` + `KeywordSignal` + klaster intent
(`INFORMATIONAL`, `COMMERCIAL`, `TRANSACTIONAL`).

**Fase 0 (tanpa API):** operator menaruh CSV GSC dan daftar query manual ke
import sederhana; sistem tetap membuat klaster & prioritas. Ini menghindari
blokir dependency/API.

### 6.2 Editorial & Fact-Grounding

Untuk setiap topik yang `BRIEFED`, editor menghasilkan:
- `angle` (sudut unik, bukan ulang stagnan),
- `intent` dan keyword utama,
- outline heading,
- daftar klaim yang **wajib** mengutip `FactSource`,
- daftar klaim terlarang (harga, policy, rating, review, lokasi, nama vendor).

Aturan:
- Harga hanya dari `PriceTier` / katalog (`src/data/catalogue.ts`).
- Refund/no-show hanya dari `refundUtils.ts` + `docs/REFUND_POLICY.md`.
- Kategori hanya dari `src/lib/taxonomy.ts`.
- Judul wajib lolos `titleValidator` (45–60 char, keyword di 25 char pertama,
  Title Case, tanpa emoji, tanpa nama brand).
- Tidak ada review/rating/alamat palsu.

### 6.3 Multi-Platform Format Producer

Satu brief → beberapa `ContentAsset`:

| Kanal | Artefak | Konteks repo |
|---|---|---|
| Blog/Web | artikel 600–900 kata, meta, FAQ/HowTo schema, internal link | `src/lib/aiContent.ts`, `src/lib/seo.ts`, `Article` |
| YouTube | script, hook 0–5 dtk, chapters, judul keyword, deskripsi | format baru `src/lib/growth/format/youtube.ts` |
| TikTok/Reels | hook 1–3 dtk, caption, storyboard singkat, CTA | `src/lib/growth/format/short.ts` |
| Facebook | post teks/carousel, pertanyaan pembuka, CTA | `src/lib/growth/format/social.ts` |
| AI answer engines | FAQ block + schema FAQ/Article + ringkasan tanya-jawab | `src/lib/seo.ts` |

Format producer wajib mengembalikan **satu sumber kebenaran** per aset
(bukan teks bebas) agar gate bisa memvalidasi.

### 6.4 Quality & Compliance Gatekeeper

Checker deterministik (bukan penilaian LLM semata):
1. Judul lolos `titleValidator`.
2. Kategori ada di 9 kategori.
3. Tanpa string brand, tanpa nama vendor/partner.
4. Tanpa emoji di judul/metadata.
5. Panjang minimum & maksimum sesuai format.
6. Keterbacaan (kalimat pendek, heading jelas, jawaban di awal).
7. Deteksi duplikasi (`contentHash` + kemiripan).
8. Klaim faktual punya `FactSource`; klaim harga/policy cocok dengan DB/util.
9. Skor anti-slop minimum: kedalaman, orisinalitas, spesifisitas.
10. Kesiapan AdSense: orisinal, bukan salinan, navigasi jelas, halaman policy
    (kontak, tentang, privasi, syarat) tersedia.

Asal gagal gate dicatat ke `AuditEvent` dengan alasan; aset kembali ke `DRAFT`.

### 6.5 Penjadwalan & Publikasi

- Web: `ContentAsset` → `Article` (tabel existing) → sitemap otomatis memuat.
- Sosial/video: rancangan API publish per platform, tapi **Fase 0–2 hanya
  menyiapkan draf + antrean**, publish otomatis menyusul setelah owner
  menyetujui dependency & credential.
- Publikasi kanal utama memakai `ApprovalRequest` wajib.

### 6.6 Optimasi Traffic & Retention

- **Content refresh:** mendeteksi `MetricSnapshot` dengan penurunan tayangan/klik
  atau kadaluwarsa `FactSource.expiresAt`, lalu membuat topik `NEEDS_REFRESH`.
- **CTR & snippet:** halaman dengan impresi tinggi CTR rendah menjadi kandidat
  uji judul/meta (hanya web; sosial manual).
- **Repurposing:** aset dengan retensi/engagement tinggi dipecah jadi turunan
  untuk kanal lain.
- **Audit teknis:** 404, 5xx, broken link, indeksasi, perubahan struktur URL.

---

## 7. Approval Gate & Human-in-the-Loop

### 7.1 Matriks auto vs approval

| Aksi | Mode | Alasan |
|---|---|---|
| Riset, klasterisasi, prioritas | **AUTO** | Tidak mempublikasikan apa pun |
| Membuat brief & outline | **AUTO** | Masih internal |
| Membuat draf semua format | **AUTO** | Belum tayang |
| Audit link/status/404/5xx | **AUTO** | Read-only + laporan |
| Menyusun rencana refresh | **AUTO** | Belum mengubah yang live |
| Laporan/anomali ke owner | **AUTO** | Komunikasi |
| **Publish artikel blog utama** | **APPROVAL** | Konten publik, SEO, AdSense |
| **Publish ke YouTube/TikTok/Facebook resmi** | **APPROVAL** | Reputasi akun, brand |
| Klaim harga / refund / no-show | **APPROVAL + gate** | Risiko bisnis & hukum |
| Klaim dampak lokal, status legal, "100% Bali-owned" | **APPROVAL + gate** | Tidak boleh diarang |
| Perubahan struktur URL/301 massal | **APPROVAL** | Bisa merusak ranking |

### 7.2 Alur approval

```
aset READY → buat ApprovalRequest(PENDING)
           → owner/notifikasi → review di UI admin
           → APPROVED → aset SCHEDULED → cron publish
           → REJECTED → aset DRAFT + catatan perbaikan
           → EXPIRED (SLA, mis. 7 hari) → tidak publish
```

### 7.3 Siapa yang menyetujui

- Pemilik brand / operator yang tercatat di `AdminUser` (tenant scope).
- Tidak ada auto-approve oleh agen, termasuk owner sekalipun lewat prompt.
- Setiap keputusan tercatat di `AuditEvent` + `ApprovalRequest`.

---

## 8. Guardrail Kualitas & Anti-Slop

1. **Fact guardrail:** semua angka, harga, policy, jam, usia, status legal wajib
   bersumberkan `FactSource` yang bisa ditelusuri. Model tidak boleh mengarang.
2. **Anti mass-spam:** satu topik satu artikel kanonik; turunan platform adalah
   adaptasi, bukan duplikat penuh. Deteksi `contentHash` + kemiripan.
3. **Anti thin content:** panjang minimum + skor kedalaman + jawaban langsung.
4. **Brand & whitelabel:** nama "BaliWild" tidak di judul/meta/slug; nama vendor
   tidak di konten publik (`docs/OPERATION_CONTRACT.md`).
5. **Claim safety:** tidak boleh "Best", "Cheapest", "Free" untuk klaim produk;
   tidak menyangkal margin operasional.
6. **AdSense-safe:** orisinal, bukan terjemahan/salinan; cukup konten pendukung;
   navigasi & halaman policy lengkap; kecepatan & mobile-friendly.
7. **Rate & kuota:** hormati limit platform; beri jeda antar permintaan.
8. **Model cadangan:** gemini free tier terbatas; siapkan fallback model lain
   per-fitur (kuota dihitung per model) dan fallback deterministik.

---

## 9. Integrasi Platform & API

### 9.1 Stack gratis/open-source yang dipilih

Keputusan owner: **jangan beli suite SEO/scheduler berbayar.** Susun dari
komponen gratis/tier gratis.

| Peran | Pilihan | Catatan |
|---|---|---|
| Orchestrator / workflow | **n8n self-host** (gratis) **atau** script Node.js + Vercel cron / GitHub Actions | pilih satu; jangan dua-duanya |
| Database / SSOT | **Supabase PostgreSQL** (sudah dipakai) | Google Sheets hanya untuk prototipe ultra-cepat, lalu migrasi ke tabel relasional |
| Data traffic & pencarian | GSC, GA4, Google Trends, autocomplete Google/YouTube, YouTube Analytics, metrik native TikTok/Facebook | semua gratis, butuh akun/kredensial |
| LLM | free tier Gemini + **rule-based logic** (filter SQL/script) | pisahkan tugas ringan (tanpa token) vs tugas berat (LLM) |
| Rule-based filtering | script/SQL untuk duplikat, klaster intent, batas item per run | menjaga kuota gratis |

Prinsip: **deterministik dulu, LLM kemudian.** Filter duplikat, pengelompokan
intent, dan pembatasan jumlah item per run dilakukan tanpa token; LLM hanya untuk
merapikan klaster, menentukan angle, dan menulis draf.

### 9.2 Tabel integrasi

| Platform / layanan | Dibutuhkan | Dependency baru | Secret baru (`.env.example`) | Status |
|---|---|---|---|---|
| Google Search Console | Data query/CTR/position | ya (API client) | `GSC_*` | butuh izin owner |
| YouTube Data API | autocomplete, tren, komentar | ya | `YOUTUBE_*` | butuh izin owner |
| TikTok Research / Content Posting | tren, publish | ya | `TIKTOK_*` | butuh izin owner |
| Meta Graph API | Facebook publish/insight | ya | `META_*` | butuh izin owner |
| Gemini | generasi konten | **tidak** (existing) | `GEMINI_API_KEY` | sudah ada |
| DB / Prisma | state, fakta, artikel | tidak | `DATABASE_URL` | sudah ada |
| Vercel cron | penjadwalan | tidak | `CRON_TOKEN` (pola existing) | sudah ada |

**Aturan:** `AGENTS.md` §4 melarang menambah/menghapus dependency tanpa
persetujuan owner. Semua secret baru **wajib** didokumentasikan di
`.env.example` sebelum dipakai kode.

---

## 10. Penjadwalan, Kuota & Kapasitas

### 10.1 Pola cron

Ikuti pola `src/app/api/cron/*` existing: route handler + token auth
(`CRON_TOKEN`) + entry di `vercel.json`. Alternatif gratis: **GitHub Actions**
(schedule) untuk job batch berat, atau **n8n self-host** bila ingin orchestration
visual. Pilih satu orchestrator utama agar state tidak terpecah.

Contoh jadwal usulan:

| Tugas | Jalur | Jadwal |
|---|---|---|
| Riset & klaster mingguan | `/api/cron/growth/research` | mingguan |
| Produksi batch artikel | `/api/cron/growth/produce` | harian (kuota) |
| Publish artikel disetujui | `/api/cron/growth/publish` | harian/terjadwal |
| Ambil metrik | `/api/cron/growth/metrics` | harian |
| Audit teknis & 404/5xx | `/api/cron/growth/audit` | harian |

### 10.2 Kuota Gemini (konstrain nyata)

`docs/AI_AGENT.md` mencatat: **free tier = 20 request/hari per model**; 166
artikel butuh ~9 hari; rekomendasi maksimal **~15 artikel/hari**.

Anggaran request per tahap pipeline (per topik):

| Tahap | Estimasi request |
|---|---|
| Riset/klaster (bila LLM) | 1–2 |
| Editorial brief | 1 |
| Format artikel web | 1 |
| Format YouTube/TikTok/FB | 1–3 |
| QA/anti-slop | 0–1 |
| **Total per topik** | **~4–8** |

Konsekuensi:
- Maksimal **~3–5 topik/hari** di free tier, bukan 15 artikel mandiri.
- Riset sebaiknya **deterministik/API dulu**, LLM hanya untuk analisis.
- Naikkan kuota via billing Google Cloud bila butuh lebih cepat.
- Model cadangan per-fitur memecah kuota.

### 10.3 Keandalan cron

- Idempotensi: kunci `tenantId + topicId + date` untuk mencegah dobel produksi.
- Kunci distribusi (Supabase advisory lock atau flag DB) bila instance ganda.
- Gagal satu item tidak menggagalkan batch; error tercatat & dilaporkan.
- Timeout & retry konsisten dengan `src/lib/gemini.ts`.

---

## 11. Metrik & Observability

### 11.1 Metrik utama per aset/platform

| Metrik | Sumber | Tujuan |
|---|---|---|
| Impressions, clicks, CTR, avg position | GSC / YouTube / TikTok / Meta | peluang & decay |
| Retention / watch time | YouTube / TikTok | kualitas & repurposing |
| Ranking keyword | GSC | SEO |
| Publish lead time | state timestamps | efisiensi pipeline |
| Gate pass rate | AuditEvent | kualitas |
| Refresh rate | state timestamps | kesehatan konten |
| Estimasi pendapatan iklan | AdSense (nanti) | monetisasi |

### 11.2 Dashboard & alert

- Dashboard admin sederhana: topik per status, antrean approval, anomali.
- Alert ringan (email/WhatsApp) untuk: lonjakan 404/5xx, penurunan traffic
  mendadak, approval melewati SLA, kuota Gemini menipis.

---

## 12. Fase Implementasi (Usulan)

| Fase | Cakupan | Keluar | Risiko |
|---|---|---|---|
| **0. Fondasi** | state machine + tabel Prisma + kontrak modul + import riset manual + SSOT docs | bisa triage & brief manual | rendah |
| **1. Artikel web otonom** | producer `aiContent.ts` terintegrasi, gate wajib, antrean approval, publish blog | artikel web berkualitas konsisten | rendah–sedang |
| **2. Multi-format** | YouTube script, TikTok hook, Facebook post, FAQ block | 1 riset → banyak format | sedang |
| **3. Monitor & refresh** | ingest metrik, deteksi decay, usulan refresh, repurposing | loop berkelanjutan | sedang |
| **4. Audit teknis** | 404/5xx/indeks/broken link, alert | self-healing | sedang–tinggi |
| **5. API platform** | GSC/YouTube/TikTok/Meta + auto-publish (setelah approval) | riset otomatis penuh | tinggi (izin/secret) |

Setiap fase wajib: branch dari `main`, `npm run lint`, `npm run typecheck`,
`npm test`, docs diperbarui, commit conventional, push, PR + review.

### 12.1 Urutan build tercepat (tanpa biaya)

| Waktu | Kerjakan | Keluaran |
|---|---|---|
| Hari 1–2 | sheet/tabel DB sederhana (`topics`, `drafts`, `metrics_log`) + sambungkan sumber data gratis (GSC, GA4, catatan performa kanal) | SSOT minimal yang bisa diisi |
| Hari 3–5 | workflow pertama: **Riset Topik → Brief + Cek Fakta → Draf Multi-Kanal**, dengan rule pembatas jumlah item per run | pipeline ujung-ke-ujung yang aman dari limit gratis |
| Minggu ke-2 | loop evaluasi: CTR rendah → usulan judul/meta; traffic/retensi turun → refresh; format meledak → repurposing; 404/error/indeks → notifikasi perbaikan | closed-loop berkelanjutan |

Urutan ini sengaja menunda dependency API: Fase 0 memakai data yang bisa di-export
manual dulu, lalu mengotomatiskan sumbernya setelah pipeline terbukti.

---

## 13. Keputusan Owner yang Dibutuhkan

### 13.1 Sudah diputuskan

1. **Stack:** gratis/open-source — n8n self-host atau script + cron (GitHub
   Actions/Vercel), Supabase sebagai DB, GSC/GA4/Trends sebagai sumber data,
   free tier Gemini + rule-based logic (lihat §9.1).
2. **Batas auto vs approval:** riset, klaster rule-based, draf, audit, dan
   laporan otomatis; publikasi kanal utama & klaim sensitif lewat approval
   (lihat §7).
3. **Urutan build:** Hari 1–2 SSOT + sumber data; Hari 3–5 pipeline riset→brief→
   draf multi-kanal; Minggu ke-2 loop evaluasi (lihat §12.1).

### 13.2 Masih perlu diputuskan owner

1. **Orchestrator:** n8n self-host atau script + cron? (pilih satu)
2. **Credential:** akun GSC/GA4/YouTube/TikTok/Facebook apa yang sudah tersedia?
3. **Auto-publish artikel blog:** boleh auto setelah gate, atau semua lewat
   approval?
4. **Akun sosial resmi:** handle mana yang boleh dioperasikan agen? Siapa pemilik
   kredensial? (Brand handles ada di `docs/BRAND_GUIDELINES.md` §1.)
5. **AdSense:** sudah/akan dipasang? Siapa pemilik akun? Memengaruhi aturan
   originality & halaman policy.
6. **Multi-tenancy:** v1 single-tenant dulu atau semua tabel `tenantId` dari
   awal?
7. **Nama & penempatan dokumen:** setuju dengan
   `docs/CONTENT_GROWTH_ARCHITECT.md`?

---

## 14. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Halusinasi fakta/harga/policy | AdSense rejected, sengketa | FactSource wajib + gate + approval |
| Thin/dup content massal | Penalti ranking | kanonik tunggal, deteksi dup, skor anti-slop |
| Kuota Gemini habis | Produksi berhenti | budget harian, model cadangan, fallback |
| API platform menolak/berubah | Riset berhenti | Fase 0 manual; abstraksi adapter |
| Salah publish klaim sensitif | Reputasi/hukum | approval wajib + klaim terlarang |
| Cron dobel jalan | Konten dobel | idempotensi + distributed lock |
| Bocor brand/vendor | Melanggar konstitusi | checker deterministik di gate |
| Scope creep | Sistem tak selesai | Fase bertahap, Fase 0 minimal |

---

## 15. Definisi Selesai per Fase

- [ ] `npm run lint` → 0 error
- [ ] `npm run typecheck` → 0 error
- [ ] `npm test` → semua lulus, perilaku baru ter-test
- [ ] State & gate punya test (transisi ilegal ditolak, gate menolak pelanggaran)
- [ ] Migration Prisma ada & `npm run db:seed` sukses di DB kosong
- [ ] Secret baru (bila ada) tercatat di `.env.example`, tanpa nilai asli
- [ ] Docs diperbarui (dokumen ini + `TEAM_WORKING_AGREEMENT.md` SSOT)
- [ ] Commit conventional, push ke origin, PR + review
- [ ] Verifikasi live: `npm run smoke` meluluskan app yang berjalan

---

## 16. Referensi

- `AGENTS.md` — aturan kerja wajib
- `docs/AI_AGENT.md` — agent CS, content wizard, kuota Gemini
- `docs/SEO_STRATEGY.md` — fase SEO existing & backlog
- `docs/SEO_TAXONOMY.md` — 9 kategori, keyword library
- `docs/BRAND_GUIDELINES.md` — brand, voice, klaim
- `docs/PRODUCT_TITLE_CONSTITUTION.md` — konstitusi judul
- `docs/TEAM_WORKING_AGREEMENT.md` — SSOT & guardrail produk
- `docs/TECH_DECISION_LOG.md` — stack, DB, deployment
- `docs/OPERATION_CONTRACT.md` — whitelabel / vendor
