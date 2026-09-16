# Woonpoints

Woonpoints is a private-first dashboard and local assistant for tracking WoningNet reactions, search points, preferences and position history.

## Current status

This repository is the reproducible code baseline for the project. The earlier **WoningKompas** ChatGPT Site remains a product/UI prototype; GitHub is the source of truth for executable code going forward.

The first baseline intentionally does **not** place live WoningNet reactions. Browser execution must remain fail-closed until the current WoningNet flow has been validated with an authorized test account.

## Safety contract

- `BOT_DRY_RUN=true` by default and required by the current worker.
- No WoningNet passwords, cookies, MFA codes or CAPTCHA material are stored in the dashboard database.
- No proxy/cookie obfuscation or control-bypass mechanisms.
- Only own accounts or accounts with explicit owner authorization.
- Expired login, MFA, CAPTCHA, invitations/viewings or housing offers stop automation for that account and require human action.
- A future live adapter must verify that a reaction is registered and belongs to the intended calendar month.

## Product scope

- Dashboard for wait/search points and monthly progress toward four valid reactions.
- Reaction history and final position tracking.
- Monthly position trend and percentile-style analysis.
- Housing preferences and explainable candidate filtering.
- Per-account consent and execution audit trail.
- Email/WhatsApp notifications as a later integration phase.

## Repository layout

- `src/app/` — Next.js dashboard shell.
- `src/lib/` — project safety rules and domain helpers.
- `src/worker/` — local/background worker entry point; currently dry-run only.
- `prisma/` — PostgreSQL data model.
- `docs/` — architecture, handoff and roadmap.
- `tests/` — dependency-light safety regression tests.

## Local development

1. Copy `.env.example` to `.env`.
2. Keep `BOT_DRY_RUN=true`.
3. Start PostgreSQL with `docker compose up -d db`.
4. Run `npm install`.
5. Run `npm run dev`.

For the complete app + worker stack, use `docker compose up --build` after dependencies and environment variables are configured.

## Prototype

Legacy product prototype: https://woningkompas-amsterdam.lizellay.chatgpt.site

## Source-of-truth order

1. GitHub repository for executable behavior.
2. Notion Woonpoints Project HQ for product decisions, roadmap and handoff.
3. WoningKompas Site for historical UI/product reference only.
