# BaliWild — Q1 2027 Execution Plan (January-March)

> **Version:** 1.0.0
> **Status:** ACTIVE — Team Execution Guide
> **Period:** January 1 - March 31, 2027
> **Reference:** STRATEGY_20YEAR_ROADMAP.md, all ADRs, AGENT_SKILL_ENHANCEMENT.md

---

## 1. Quarter Theme: **"Foundation to Scale"**

**Objective:** Transform BaliWild from "working vertical operator" to "scalable platform-ready business" by hardening infrastructure, accelerating SEO, and upgrading AI Agent to competitive parity.

**North Star KPI:** **Profitable Bookings/Month > 500** (Phase 1 target)

---

## 2. Sprint Schedule (6 Sprints × 2 Weeks)

| Sprint | Dates | Theme | Key Deliverables |
|--------|-------|-------|------------------|
| **Sprint 1** | Jan 6-19 | **Database Hardening** | pgvector, indexes, RLS, partitioning (staging) |
| **Sprint 2** | Jan 20-Feb 2 | **Search & Analytics** | Typesense (local), PostHog (staging), "Why Book Direct" page |
| **Sprint 3** | Feb 3-16 | **AI Agent v2** | `searchReviews`, `getDynamicPrice`, `modifyBooking`, `cancelBooking` |
| **Sprint 4** | Feb 17-Mar 1 | **Content Velocity** | 50 articles/month pipeline, review flywheel automation |
| **Sprint 5** | Mar 3-16 | **Operations Excellence** | Vendor PWA (checklist), Dynamic Pricing v1, WhatsApp verified |
| **Sprint 6** | Mar 17-31 | **Platform Readiness** | Public API v1 spec, feature flags, load testing, docs |

---

## 3. Workstream Assignments

### 3.1 Backend & Data (2 Engineers)

| Sprint | Engineer A | Engineer B |
|--------|------------|------------|
| 1 | pgvector migration + embedding backfill | RLS policies + middleware integration |
| 2 | Typesense local setup + sync pipeline | PostHog self-hosted + event taxonomy |
| 3 | Agent tools: `searchReviews`, `getDynamicPrice` | Agent tools: `modifyBooking`, `cancelBooking` |
| 4 | Review flywheel automation (invites + reminders) | Content pipeline: AI wizard → review → publish |
| 5 | Dynamic Pricing Engine v1 (demand signals) | Vendor PWA: checklist + briefing + emergency |
| 6 | Public API v1 (OpenAPI 3.1) + rate limits | Feature flags (PostHog) + load testing |

### 3.2 Frontend & Product (1 Engineer + 1 Designer)

| Sprint | Engineer | Designer |
|--------|----------|----------|
| 1 | "Why Book Direct" page + calculator | Commission table + trust signals design |
| 2 | Typesense integration (autocomplete, filters) | Search UX + facet design |
| 3 | Agent UI: review carousel, price breakdown | Agent conversation flow diagrams |
| 4 | Article template + SEO components | Content calendar UI (admin) |
| 5 | Vendor PWA (mobile-first) | PWA screens + install prompt |
| 6 | API docs (Swagger) + developer portal | Landing page for operators |

### 3.3 Content & SEO (1 Content Ops)

| Sprint | Focus |
|--------|-------|
| 1 | Audit existing 166 products → keyword gaps |
| 2 | "Why Book Direct" content + FAQ schema |
| 3-6 | **50 articles/month** (AI wizard + human review) |
| Ongoing | Review invite management + moderation |

### 3.4 DevOps & Infrastructure (Shared)

| Task | Owner | Sprint |
|------|-------|--------|
| Supabase Dedicated evaluation | Backend A | 1 |
| VPS provisioning (Hostinger KVM 4) | DevOps | 2 |
| Redis + Typesense + PostHog on VPS | DevOps | 2 |
| CI/CD for VPS (GitHub Actions) | DevOps | 3 |
| Monitoring dashboards (PostHog + Vercel) | DevOps | 4 |
| Disaster recovery test | DevOps | 6 |

---

## 4. Detailed Sprint Plans

### Sprint 1: Database Hardening (Jan 6-19)

**Goal:** Production-ready database with semantic search, multi-tenancy security, and partition scaling.

#### Tickets
| ID | Task | Owner | Est. | Dependencies |
|----|------|-------|------|--------------|
| DB-01 | Run migration `20261127090000_performance_indexes_pgvector` on staging | Backend A | 1 day | — |
| DB-02 | Verify pgvector extension + HNSW indexes created | Backend A | 0.5 day | DB-01 |
| DB-03 | Backfill Article embeddings (166 articles) | Backend A | 2 days | DB-02 |
| DB-04 | Backfill Review embeddings (all approved) | Backend A | 1 day | DB-02 |
| DB-05 | Backfill Venture embeddings (all products) | Backend A | 1 day | DB-02 |
| DB-06 | Run migration `20261127110000_supabase_rls_policies` on staging | Backend B | 1 day | — |
| DB-07 | Implement `current_tenant_id()` middleware in Next.js | Backend B | 1 day | DB-06 |
| DB-08 | Test RLS policies: anon, authenticated, staff, service_role | Backend B | 2 days | DB-07 |
| DB-09 | Create booking partition maintenance cron (`create_next_month_booking_partition`) | Backend A | 0.5 day | — |
| DB-10 | Document partition management runbook | Backend A | 0.5 day | DB-09 |

**Definition of Done:**
- [ ] All migrations apply cleanly on staging
- [ ] pgvector similarity search returns relevant results (<100ms)
- [ ] RLS blocks cross-tenant access in tests
- [ ] Partition maintenance function creates next month partition
- [ ] Zero regression in existing API tests

---

### Sprint 2: Search & Analytics (Jan 20-Feb 2)

**Goal:** Replace client-side filtering with Typesense; unify analytics with PostHog.

#### Tickets
| ID | Task | Owner | Est. | Dependencies |
|----|------|-------|------|--------------|
| SA-01 | Provision VPS (Hostinger KVM 4: 4 vCPU, 8GB, 160GB) | DevOps | 1 day | — |
| SA-02 | Deploy Redis + Typesense + PostHog on VPS (Docker Compose) | DevOps | 2 days | SA-01 |
| SA-03 | Configure Typesense schema (ventures, articles) | Backend A | 1 day | SA-02 |
| SA-04 | Build Prisma → Typesense sync pipeline (webhook + batch) | Backend A | 2 days | SA-03 |
| SA-05 | Replace `filterCatalogue.ts` with Typesense search API | Frontend | 2 days | SA-04 |
| SA-06 | Implement search autocomplete + facet filters | Frontend | 2 days | SA-05 |
| SA-07 | Configure PostHog event taxonomy (per ADR-002) | Backend B | 1 day | SA-02 |
| SA-08 | Integrate PostHog client + server (Next.js) | Frontend + Backend B | 2 days | SA-07 |
| SA-09 | Build "Why Book Direct" page (per spec) | Frontend + Designer | 3 days | — |
| SA-10 | Validate Rich Results (FAQPage, WebPage) | Frontend | 0.5 day | SA-09 |
| SA-11 | Submit sitemap + verify Search Console | Content | 0.5 day | SA-09 |

**Definition of Done:**
- [ ] Typesense returns results <50ms p95
- [ ] Search facets work: category, price, duration, difficulty, transfer mode
- [ ] PostHog captures all `Events.*` from taxonomy
- [ ] "Why Book Direct" page loads <2s, Lighthouse >90
- [ ] Search Console shows page indexed

---

### Sprint 3: AI Agent v2 (Feb 3-16)

**Goal:** Agent can search reviews, show dynamic pricing, modify/cancel bookings.

#### Tickets
| ID | Task | Owner | Est. | Dependencies |
|----|------|-------|------|--------------|
| AG-01 | Implement `searchReviews` tool (pgvector similarity) | Backend A | 2 days | Sprint 1 DB-04 |
| AG-02 | Implement `searchVentures` tool (semantic product search) | Backend A | 2 days | Sprint 1 DB-05 |
| AG-03 | Implement `getDynamicPrice` tool (demand multiplier) | Backend A | 2 days | Sprint 5 DY-01 |
| AG-04 | Implement `getBookingStatus` tool | Backend B | 1 day | — |
| AG-05 | Implement `modifyBooking` tool (date, pax, pickup) | Backend B | 2 days | BookingService |
| AG-06 | Implement `cancelBooking` tool (refund calc) | Backend B | 2 days | refundUtils |
| AG-07 | Implement `rescheduleBooking` tool | Backend B | 1 day | AG-05 |
| AG-08 | Update agent intent classification for new tools | Backend A | 1 day | AG-01 to AG-07 |
| AG-09 | Add conversation memory (preferences, mentioned products) | Backend A | 2 days | AgentSession |
| AG-10 | Write golden test cases for all new tools | Backend A + B | 1 day | AG-01 to AG-07 |
| AG-11 | Adversarial testing (hallucination, policy bypass) | Backend A + B | 1 day | AG-10 |

**Definition of Done:**
- [ ] Agent answers "what do reviews say about ATV Ubud?" with real quotes
- [ ] Agent shows dynamic price with demand signal ("Only 3 spots at this price")
- [ ] Agent can modify booking date/pax/pickup via conversation
- [ ] Agent can cancel booking with correct refund calculation
- [ ] All golden tests pass; adversarial tests block known attacks

---

### Sprint 4: Content Velocity (Feb 17-Mar 1)

**Goal:** 50 SEO articles/month via AI wizard + automated review flywheel.

#### Tickets
| ID | Task | Owner | Est. | Dependencies |
|----|------|-------|------|--------------|
| CV-01 | Enhance AI Content Wizard: auto-translate EN→ID | Backend A | 2 days | — |
| CV-02 | Build article review workflow (admin: draft → review → publish) | Frontend | 2 days | — |
| CV-03 | Automate founding guest invites (trigger on COMPLETED) | Backend B | 1 day | Booking lifecycle |
| CV-04 | Automate post-trip review requests (D+1, D+3 reminder) | Backend B | 1 day | BullMQ (Sprint 5) |
| CV-05 | Build review moderation queue (admin: approve/reject/photos) | Frontend | 2 days | — |
| CV-06 | Content calendar: 50 articles target (keyword → title → assign) | Content | 1 day | — |
| CV-07 | Produce 50 articles (AI wizard + human edit) | Content | Ongoing | CV-01, CV-02 |
| CV-08 | Internal linking: auto-link product mentions in articles | Backend A | 1 day | CV-07 |
| CV-09 | Sitemap auto-update on article publish | Backend A | 0.5 day | — |

**Definition of Done:**
- [ ] AI wizard generates EN + ID articles in one flow
- [ ] Review invites sent automatically when ops marks COMPLETED
- [ ] Review requests sent D+1 and D+3 (idempotent)
- [ ] 50 articles published this month (track in PostHog)
- [ ] Moderation queue shows photos, source, coverage per product

---

### Sprint 5: Operations Excellence (Mar 3-16)

**Goal:** Dynamic pricing live; Vendor PWA for field ops; WhatsApp verified.

#### Tickets
| ID | Task | Owner | Est. | Dependencies |
|----|------|-------|------|--------------|
| OP-01 | Dynamic Pricing Engine v1: demand multiplier (occupancy-based) | Backend A | 3 days | — |
| OP-02 | Expose demand signals via API (for agent + frontend) | Backend A | 1 day | OP-01 |
| OP-03 | Vendor PWA: checklist (pre/post), briefing, emergency SOS | Frontend + Designer | 4 days | — |
| OP-04 | Vendor PWA: offline sync + push notifications | Frontend | 2 days | OP-03 |
| OP-05 | WhatsApp Business API verification (Meta) | Backend B | 2 days | Meta process |
| OP-06 | WhatsApp template approval (booking, reminder, review) | Backend B | 1 day | OP-05 |
| OP-07 | Integrate WhatsApp notifications (Booking, Reminder, Review) | Backend B | 2 days | OP-06 |
| OP-08 | Load test booking flow (100 concurrent) | DevOps | 1 day | — |
| OP-09 | Document operational runbooks (incident, deploy, rollback) | All | 1 day | — |

**Definition of Done:**
- [ ] Dynamic pricing adjusts prices based on occupancy (test: 80% → 1.2x)
- [ ] Vendor PWA works offline, syncs when online
- [ ] WhatsApp verified, templates approved, notifications sending
- [ ] Load test: <2s p95, 0 errors at 100 concurrent
- [ ] Runbooks documented in `/docs/runbooks/`

---

### Sprint 6: Platform Readiness (Mar 17-31)

**Goal:** Public API v1 spec, feature flags, comprehensive documentation.

#### Tickets
| ID | Task | Owner | Est. | Dependencies |
|----|------|-------|------|--------------|
| PR-01 | Design Public API v1 (OpenAPI 3.1): ventures, bookings, webhooks | Backend A | 2 days | — |
| PR-02 | Implement API auth (API keys, rate limits, idempotency) | Backend A | 2 days | PR-01 |
| PR-03 | Feature flags in PostHog (marketplace rollout controls) | Backend B | 1 day | Sprint 2 SA-08 |
| PR-04 | Implement flag checks: marketplace, operator portal, auto-split | Backend B | 2 days | PR-03 |
| PR-05 | API documentation (Swagger UI + developer portal) | Frontend | 2 days | PR-01 |
| PR-06 | Load test API (1000 req/min) | DevOps | 1 day | PR-02 |
| PR-07 | Update all ADRs with implementation status | Architect | 1 day | All |
| PR-08 | Quarterly architecture review presentation | Architect | 1 day | PR-07 |
| PR-09 | Team retrospective + Q2 planning | All | 1 day | — |

**Definition of Done:**
- [ ] Public API v1 spec complete with examples
- [ ] Feature flags control marketplace features (all OFF for Phase 1)
- [ ] API passes load test, rate limits enforced
- [ ] Documentation published, searchable
- [ ] Architecture review delivered to leadership

---

## 5. Risk Register & Mitigations

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Supabase pgvector not available | Low | High | Fallback: `pg_trgm` + Typesense text search | Backend A |
| Typesense on VPS unstable | Medium | High | Monitor memory; restart policy; fallback to pg | DevOps |
| WhatsApp verification delayed | Medium | Medium | Start Week 1; use Twilio sandbox for dev | Backend B |
| Content velocity <50/month | Medium | High | Pre-build 100 article backlog; hire freelance editor | Content |
| Dynamic pricing bugs (over/under price) | Medium | High | Extensive unit tests; canary release 10% traffic | Backend A |
| Vendor PWA adoption low | Medium | Medium | Mandatory for new vendors; training sessions | Ops |
| Team bandwidth (2 backend only) | High | High | Prioritize ruthlessly; defer non-critical to Q2 | Architect |

---

## 6. Success Metrics (End of Q1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Monthly Bookings** | >200 (on track for 500 by Month 6) | `Booking` count |
| **Organic Traffic** | >30k/mo (on track for 100k) | GA4 / Search Console |
| **Article Count** | 150 published (3 months × 50) | `Article` count |
| **Review Coverage** | >5 reviews/product | `Review` / `Venture` |
| **Agent Resolution Rate** | >75% | PostHog funnel |
| **Search Latency** | <100ms p95 | Typesense metrics |
| **API Error Rate** | <0.1% | PostHog / Vercel |
| **Lighthouse Score** | >90 all pages | Vercel Analytics |
| **WhatsApp Verified** | Yes | Meta Dashboard |

---

## 7. Budget Summary (Q1)

| Category | Estimated Cost | Notes |
|----------|----------------|-------|
| **Hostinger VPS (KVM 4 × 3 months)** | ~$45 | 4 vCPU, 8GB RAM |
| **Supabase (Shared → Dedicated eval)** | $0-600 | Dedicated only if needed |
| **Gemini API (paid tier)** | ~$50 | 200 req/day buffer |
| **PostHog (self-hosted)** | $0 | On VPS |
| **Typesense (self-hosted)** | $0 | On VPS |
| **Redis (self-hosted)** | $0 | On VPS |
| **Domain/SSL** | $15 | Annual |
| **Total Infrastructure** | **~$110-710** | Depending on Supabase tier |

---

## 8. Communication Cadence

| Meeting | Frequency | Participants | Purpose |
|---------|-----------|--------------|---------|
| **Daily Standup** | Daily 09:00 WITA | All | Blockers, sync |
| **Sprint Planning** | Bi-weekly Monday | All | Commit to sprint goals |
| **Sprint Review** | Bi-weekly Friday | All + Stakeholders | Demo, feedback |
| **Retrospective** | Bi-weekly Friday | All | Process improvement |
| **Architecture Review** | Monthly | Architect + CTO | Technical decisions |
| **Content Review** | Weekly | Content + Architect | SEO quality gate |

---

## 9. Definition of Ready (DoR) for All Tickets

- [ ] Clear acceptance criteria
- [ ] Dependencies identified and available
- [ ] Design/UX approved (if UI)
- [ ] Test strategy defined
- [ ] Estimated and assigned

## 10. Definition of Done (DoD) for All Tickets

- [ ] Code passes `lint`, `typecheck`, `test`
- [ ] Deployed to staging and verified
- [ ] Documentation updated (README, ADR, runbook)
- [ ] PostHog events firing (if applicable)
- [ ] No regressions in related tests
- [ ] Code reviewed by ≥1 peer
- [ ] Merged to `main` via PR

---

## 11. Escalation Path

| Level | Trigger | Response Time | Action |
|-------|---------|---------------|--------|
| **L1** | Single ticket blocked >1 day | 2 hours | Pair with teammate |
| **L2** | Sprint goal at risk | 4 hours | Architect re-prioritizes |
| **L3** | Production incident | 15 minutes | On-call + Architect |
| **L4** | Strategic risk (legal, security, data) | Immediate | CTO + Founder |

---

**Document Owner:** Senior Product & Database Architect  
**Approved By:** CTO, Founder  
**Next Review:** April 1, 2027 (Q2 Planning)