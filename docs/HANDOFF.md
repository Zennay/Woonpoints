# Current State & AI Handoff

Updated: 2026-09-16

## Source of truth

- Executable behavior: GitHub `Zennay/Woonpoints`.
- Product decisions, current state and planning: Notion `Woonpoints — Project HQ`.
- Historical product/UI prototype: WoningKompas ChatGPT Site.

## Recovered project context

The original concept evolved from a simple WoningNet points bot into a dashboard/assistant for multiple explicitly authorized accounts. Earlier notes mentioned proxy-based login; that direction is superseded. Current project rules explicitly reject hidden proxy/cookie techniques and do not store WoningNet credentials.

The latest documented local-product direction uses a Next.js-style dashboard, PostgreSQL, Docker and a separate worker. The previously published WoningKompas Site/D1 implementation remains useful as product/UI reference but is not the executable source of truth for this repo.

## Implemented in this baseline

- Repository initialized.
- Next.js dashboard shell.
- PostgreSQL/Prisma domain schema.
- Docker Compose for app, worker and PostgreSQL.
- Dry-run-only worker.
- Explicit account authorization guard.
- Human stop states for expired login, MFA, CAPTCHA, viewing invitation and housing offer.
- Dependency-light safety regression tests.

## Not yet implemented

- Google OAuth.
- Production account/session linking.
- WoningNet browser adapter.
- Verified reading of wait/search points.
- Candidate ingestion and match scoring from real WoningNet data.
- Reaction placement and post-action registration verification.
- Stripe.
- E-mail/WhatsApp notifications.
- Production deployment/monitoring/backups.

## Mandatory next engineering gate

Do not enable live reactions merely by changing an environment variable. First implement a browser adapter behind a separate explicit capability gate and validate the current WoningNet flow with an authorized test account. Add regression/integration tests for reaction limits, month accounting, registration verification and human-stop states before any live capability is considered.
