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

1. Copy `.env.example` to `.env`; **do not commit or paste the local secret**.
2. Generate one private, URL-safe random database password, for example:
   `python3 -c 'import secrets; print(secrets.token_urlsafe(32))'`
   Store that value in `.env` as `WOONPOINTS_DB_PASSWORD`. Configure
   `DATABASE_URL=postgresql://woonpoints:<same-password>@db:5432/woonpoints?schema=public`
   for the Docker Compose app/worker. Replace `<same-password>` locally; do
   not include angle brackets. For host-side Prisma, use `localhost:5432`
   rather than the Docker-only `db` hostname.
3. Keep `BOT_DRY_RUN=true`. Missing/empty `WOONPOINTS_DB_PASSWORD`
   intentionally blocks Compose startup; there is **no default password**.
4. Validate the local Compose configuration without starting a container:
   `docker compose config --quiet`
5. Start PostgreSQL with `docker compose up -d db`, then run `npm install`
   and `npm run dev`.

For the complete app + worker stack, use `docker compose up --build` only
after the operator has configured matching credentials and authorized a
private local preview. Both dashboard and database ports default to host
loopback; enabling an authenticated public gateway is a separate release.
**These instructions are for a fresh local installation, not a production
password rotation or a live database migration.**

## Prototype

Legacy product prototype: https://woningkompas-amsterdam.lizellay.chatgpt.site

## Source-of-truth order

1. GitHub repository for executable behavior.
2. Notion Woonpoints Project HQ for product decisions, roadmap and handoff.
3. WoningKompas Site for historical UI/product reference only.
