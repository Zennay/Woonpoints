# Architecture

## Goal

Woonpoints keeps WoningNet progress, preferences and position history visible while keeping account execution local and fail-closed.

## Components

1. **Next.js dashboard** — product UI and project-facing status.
2. **PostgreSQL + Prisma** — stores profiles, explicit authorization, preferences, reactions, point snapshots and audit events.
3. **Worker** — execution boundary. The current implementation is dry-run only.
4. **Future local browser adapter** — may read an already-authorized user session after explicit validation. It must not persist passwords, MFA codes or CAPTCHA material.
5. **Notification adapters** — e-mail/WhatsApp are later integrations and remain outside the core until provider choices are made.

## Safety boundary

The worker is the only component that may eventually invoke browser-side WoningNet actions. The current worker calls `assertDryRun()` before doing anything else and exits when `BOT_DRY_RUN` is not explicitly `true`.

A future live adapter must additionally prove all of the following before a reaction can be considered successful:

- account owner authorization exists;
- current account session is valid;
- no MFA/CAPTCHA/human-action state is present;
- candidate passes the stored preference and month rules;
- concurrency/reaction limits are respected;
- the reaction is confirmed as registered after execution;
- the reaction is assigned to the intended calendar month;
- audit evidence is stored.

## Explicit non-goals

- No credential vault for WoningNet passwords.
- No proxy or cookie obfuscation.
- No CAPTCHA/MFA bypass.
- No automatic handling of viewings or housing offers.
- No claim that current WoningNet production flows are already validated.

## Data model

`User` → `WoningNetAccount` → preferences, reactions, point snapshots, worker runs and audit events.

The schema intentionally contains no fields for WoningNet passwords, cookies, MFA secrets or CAPTCHA data.
