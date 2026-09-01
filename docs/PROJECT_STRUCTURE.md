# Venture Bali - Project Structure & Conventions

> **Version:** 1.0.0
> **Last Updated:** August 27, 2026
> **Owner:** Venture Bali Engineering Team

This document defines the folder structure, naming conventions, and architectural decisions for the Venture Bali platform.

## Repository Overview

Venture Bali is a multi-tenant OTA platform for adventure tourism in Bali.

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **ORM:** Prisma
- **Database:** MySQL (Hostinger) / PostgreSQL
- **State:** Zustand
- **Payment:** Midtrans Snap
- **AI:** Gemini Free Tier

## Folder Structure

```
Venture-Bali/
├── docs/                              # Documentation
│   ├── PRD_PPS.md
│   ├── PROJECT_STRUCTURE.md
│   ├── DEVELOPMENT_WORKFLOW.md
│   ├── REFUND_POLICY.md
│   ├── NO_SHOW_POLICY.md
│   ├── PRODUCT_DETAIL_SPEC.md
│   ├── SECURITY_PROTOCOL.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── DATABASE_MIGRATION_GUIDE.md
├── src/
│   ├── app/                           # Next.js App Router
│   ├── components/                    # Reusable components
│   ├── lib/                           # Business logic & utilities
│   ├── store/                         # Zustand stores
│   ├── hooks/                         # Custom React hooks
│   ├── types/                         # TypeScript definitions
│   ├── utils/                         # Pure utility functions
│   ├── data/                          # Static data & mocks
│   └── styles/                        # Global styles
├── prisma/                            # Database schema & migrations
├── scripts/                           # Operational scripts
├── tests/                             # Test suites
├── public/                            # Static assets
└── .github/                           # GitHub workflows
```

## Key Conventions

### Import Order
1. External packages
2. Internal absolute imports (`@/`)
3. Relative imports
4. Type-only imports

### Route Organization
Use route groups in App Router:
- `(marketing)` - Public pages
- `(booking)` - Booking flow
- `(content)` - SEO content
- `(admin)` - Admin panel

### Environment Variables
Document all required variables in `.env.example`:
- Database: `DATABASE_URL`
- Midtrans: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`
- AI: `GEMINI_API_KEY`
- Email/SMTP settings
- WhatsApp API settings

### Code Quality
- TypeScript strict mode
- No `any` types
- ESLint for code standards
- JSDoc for public APIs