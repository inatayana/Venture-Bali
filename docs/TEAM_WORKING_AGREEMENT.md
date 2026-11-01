# BaliWild — Team Working Agreement

> **Version:** 1.0.0
> **Last Updated:** October 2026
> **Status:** MUST FOLLOW — everyone on the team, humans and AI agents alike.
> **Priority:** If this document conflicts with any other file, `AGENTS.md` wins.

---

## 1. Tujuan Dokumen Ini

Dokumen ini ada agar setiap anggota tim — developer, designer, content writer,
operator, maupun AI agent — bekerja dengan **arah yang sama, standar yang sama, dan
tanpa harus menebak-nebak** apa yang harus dikerjakan berikutnya.

Tiga masalah yang ingin kita cegah:

| Masalah | Pencegahan |
|---------|------------|
| **Halusinasi** — mengarang aturan, API, atau data yang tidak ada | Semua fakta harus bisa ditelusuri ke dokumen atau kode |
| **Ragu-ragu** — tidak tahu standar mana yang berlaku | Daftar "Sumber Kebenaran" di §3 |
| **Bentrok** — dua orang mengerjakan hal berbeda atau saling menimpa | Satu task satu branch, satu task satu commit |

---

## 2. Alur Kerja Wajib (Ringkas)

```
1. Baca dokumen relevan        → §3
2. Ambil issue / task yang jelas → tidak boleh coding tanpa task
3. Buat branch dari main       → feature/ | bugfix/ | hotfix/ | release/
4. Kerjakan SATU task saja     → jangan campur perubahan tak terkait
5. Jalankan gate quality       → npm run lint && npm run typecheck && npm test
6. Commit conventional         → feat(x): ..., fix(x): ..., docs: ...
7. Push ke origin               → backup policy, jangan menunda
8. Buka PR → review → merge    → squash merge ke main
9. Update docs bila perilaku berubah
```

> Detail lengkap: `AGENTS.md` §2 dan `docs/DEVELOPMENT_WORKFLOW.md`.

---

## 3. Sumber Kebenaran (Single Source of Truth)

Sebelum mengerjakan sesuatu, **cek daftar ini**. Jangan mengarang aturan.

| Kebutuhan | Sumber kebenaran | Catatan |
|------------|------------------|---------|
| Aturan kerja agent & tim | `AGENTS.md` | menang atas semua dokumen lain |
| Struktur folder & konvensi kode | `docs/PROJECT_STRUCTURE.md` | import order, route groups |
| Alur git & branch | `docs/DEVELOPMENT_WORKFLOW.md` | nama branch, merge strategy |
| Kebutuhan produk & fase | `BaliWild_PRD_PPS.md` | visi, misi, KPI |
| **Keputusan teknologi** | `docs/TECH_DECISION_LOG.md` | stack, DB, deployment |
| **Cara deploy** | `docs/DEPLOYMENT_STRATEGY.md` + `docs/DEPLOYMENT_GUIDE.md` | |
| Aturan refund | `docs/REFUND_POLICY.md` | 20% cancel fee, <24 jam tidak bisa cancel |
| Aturan no-show | `docs/NO_SHOW_POLICY.md` | konfirmasi H-1, 100% cancel fee |
| Arsitektur booking & mode | `docs/BOOKING_ARCHITECTURE.md` | Self Drive vs Private Transfer |
| Kontrak operasi (whitelabel) | `docs/OPERATION_CONTRACT.md` | jangan expose nama vendor |
| Kategori produk yang boleh | `src/lib/taxonomy.ts` + `docs/SEO_TAXONOMY.md` | hanya 9 kategori |
| Aturan judul produk | `src/lib/titleValidator.ts` + `docs/PRODUCT_TITLE_CONSTITUTION.md` | 45–60 char, Title Case, no emoji |
| Strategi SEO | `docs/SEO_TAXONOMY.md` | |
| Model database | `prisma/schema.prisma` | satu-satunya definisi field |
| Data produk | `prisma/seed.ts` + `docs/MASTER_PRODUCT_CATALOG.md` | |
| Environment variables | `.env.example` | jangan pernah bikin var baru tanpa update file ini |

---

## 4. Guardrail Produk (Tidak Boleh Dilanggar)

1. **Hanya 9 kategori adventure** — ATV, Rafting, Tubing, Cycling, Trekking,
   Water Sports, Snorkeling, Extreme, Combo.
   ❌ Jangan tambahkan hotel, flight, transport murni, atau restoran.
2. **Judul produk** harus lolos `titleValidator` (45–60 karakter, keyword di 25
   karakter pertama, Title Case, tanpa kata terlarang, tanpa emoji).
3. **Nama brand "BaliWild"** tidak boleh muncul di judul produk, meta title,
   maupun slug.
4. **Nama vendor/partner tidak boleh** terlihat oleh customer.
5. **Mode booking hanya dua:** `SELF_DRIVE` (default) dan `PRIVATE_TRANSFER`.
   ❌ Jangan membuat SKU terpisah untuk tiap zona.
6. **Harga selalu integer IDR.** USD hanya tampilan, pakai kurs dari config.
7. **Biaya antar-jemput** = (surcharge zona + delta kelas kendaraan) × jumlah kendaraan.
8. **Add-on `requiresTransfer=true`** hanya bisa dipilih pada mode `PRIVATE_TRANSFER`.

---

## 5. Standar Kualitas Kode

```bash
npm run lint        # WAJIB 0 error
npm run typecheck   # WAJIB 0 error
npm test            # WAJIB semua lulus
```

Aturan tambahan:

- TypeScript strict mode, **tanpa `any`**.
- Import order: external → `@/` → relative → type-only.
- Semua API route & webhook wajib validasi dengan `zod`.
- UI wajib responsive (mobile-first) dan memakai komponen yang sudah ada di
  `src/components/ui/`.
- Jangan pernah mematikan/mentoleransi lint rule demi lolos.

---

## 6. Branching

| Branch | Fungsi | Proteksi | Auto-deploy |
|--------|--------|----------|-------------|
| `main` | Produksi | Protected | Ya (Vercel production) |
| `staging` | Pra-produksi | Protected | Ya |
| `feature/short-desc` | Fitur baru | — | Tidak |
| `bugfix/issue-desc` | Perbaikan bug | — | Tidak |
| `hotfix/issue-desc` | Perbaikan kritis | — | Ya (emergency) |
| `release/vX.Y.Z` | Persiapan rilis | — | Ya |

Always: `git checkout main && git pull && git checkout -b feature/...`

---

## 7. Format Commit Message

```
<type>(<scope>): <short summary in present tense>

Types: feat | fix | docs | chore | refactor | test | ci
```

Contoh yang benar:
```
feat(booking): add date validation to BookingForm
fix(refund): correct 30-day cutoff calculation
docs: add DEPLOYMENT_STRATEGY.md
```

Contoh yang salah:
```
update code
fix bug
perubahan
```

---

## 8. Definition of Done (Checklist)

- [ ] `npm run lint` → 0 error
- [ ] `npm run typecheck` → 0 error
- [ ] `npm test` → semua lulus
- [ ] Perilaku baru/variable punya test
- [ ] Tidak ada `.env`, API key, atau build artifact dalam commit
- [ ] Docs diperbarui bila perilaku/struktur berubah
- [ ] Commit conventional + sudah di-push ke `origin`
- [ ] PR dibuka dan sudah direview (min. 1 approval)

---

## 9. Kalau Tidak Pasti — STOP, Jangan Menebak

_ATURAN PALING PENTING_ — urutan tindakan:

```
1. STOP. Jangan langsung menulis kode.
2. Baca dokumen yang relevan (§3).
3. Kalau masih tidak jelas → tanya owner dengan pertanyaan SPESIFIK.
4. Setelah dijawab → update dokumen terkait agar keputusan tercatat.
5. Baru lanjut koding.
```

Contoh pertanyaan yang benar:
> "Untuk `PRIVATE_TRANSFER` di zona 3 dengan pax 7, apakah `vehicleCount` dihitung per-kendaraan (2 mobil) atau per-zona? Saya butuh konfirmasi karena ini memengaruhi `calculateTransferFee`."

Contoh pertanyaan yang salah:
> "Bagaimana cara hitung transfer?"
> "Kira-kira logic-nya gimana ya?"

---

## 10. Struktur Percakapan Tim (Rutin)

### Daily Stand-Up (15 menit, setiap pagi)
1. ** Kemarin** — apa yang selesai? (dengan link commit)
2. **Hari ini** — apa yang dikerjakan? (dengan nama branch)
3. **Blocker** — apa yang menghambat? (dibahas langsung, tidak ditunda)

### Review Checklist untuk Reviewer
- [ ] Apakah perubahan sesuai dengan dokumen terkait?
- [ ] Apakah nama/branch/commit message sesuai standar?
- [ ] Apakah test mencovers perilaku baru?
- [ ] Apakah ada secret yang bocor?
- [ ] Apakah guardrail produk dilanggar?

### Escalation Path
```
Developer  →  Tech Lead / Engineering Team  →  Owner
              (issue > 1 hari / scope berubah)   (keputusan strategis)
```

---

## 11. Anti-Pattern yang Dilarang

| ❌ Dilarang | ✅ Seharusnya |
|-------------|--------------|
| Commit langsung ke `main` | Branch + PR |
| `--force push` ke branch yang sudah dipublikasikan | Push normal, atau `git revert` |
| Menxonkan `.env` / API key | `.env.example` + secret manager |
| `any` / `@ts-ignore` agar lolos | Perbaiki tipe yang benar |
| Mematikan test yang gagal | Perbaiki kode atau test yang salah |
| Menambah dependency tanpa izin owner | Tanya dulu, sertakan alasan |
| Mengubah `schema.prisma` tanpa migration | `prisma migrate dev` + update docs |
| Menebak aturan produk | Baca docs §3, lalu tanya owner |
| Bekerja di 2 task sekaligus dalam 1 commit | Pisahkan commit |
| Menyalin kode dari luar tanpa atribusi | Tulis sendiri atau cantumkan Open Source Notice yang sesuai |

---

## 12. Onboarding Checklist (Untuk Anggota Baru)

- [ ] Baca `AGENTS.md` (wajib, menang atas segalanya)
- [ ] Baca `docs/PROJECT_STRUCTURE.md`
- [ ] Baca `docs/DEVELOPMENT_WORKFLOW.md`
- [ ] Baca `BaliWild_PRD_PPS.md` (bagian relevan)
- [ ] Baca `docs/TECH_DECISION_LOG.md` dan `docs/DEPLOYMENT_STRATEGY.md`
- [ ] Baca `docs/REFUND_POLICY.md` dan `docs/NO_SHOW_POLICY.md`
- [ ] Setup lokal: `npm ci`, `cp .env.example .env`, `npm run db:generate`, `npm run db:seed`
- [ ] Jalankan `npm run lint && npm run typecheck && npm test` (harus hijau)
- [ ] Klaim 1 issue kecil sebagai latihan

---

**Dokumen ini adalah kontrak kerja tim. Jika ada konflik dengan dokumen lain,
`AGENTS.md` menang, lalu dokumen ini, lalu dokumen lain.**