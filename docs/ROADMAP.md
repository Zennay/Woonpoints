# Roadmap

## M0 — Reproducible baseline

- [x] GitHub source of truth
- [x] Dashboard shell
- [x] PostgreSQL/Prisma schema
- [x] Docker app/db/worker topology
- [x] Dry-run safety gate and tests

## M1 — Read-only account insight

- [ ] Google sign-in for Woonpoints
- [ ] Explicit account-owner consent record
- [ ] Local session-linking design without storing WoningNet credentials
- [ ] Read current wait/search points
- [ ] Read active reactions and status
- [ ] Persist normalized reaction history
- [ ] Reproduce average/median/percentile position metrics from stored history

Exit gate: dashboard data is reproducible and read-only; no reaction placement exists.

## M2 — Explainable candidate selection

- [ ] Region adapter boundary
- [ ] Housing preference model wired to UI
- [ ] Candidate ingestion
- [ ] Explainable match score
- [ ] Calendar-month planning toward four valid reactions
- [ ] Reaction/concurrency limit checks
- [ ] Lottery preference support

Exit gate: the system can propose candidates and explain why; still no live final click.

## M3 — Controlled execution

- [ ] Authorized test-account flow validation
- [ ] Local browser adapter
- [ ] Separate explicit live-capability gate
- [ ] Pre-action confirmation policy
- [ ] Post-action registration verification
- [ ] Correct-month verification
- [ ] Audit evidence and idempotency
- [ ] Human-stop handling for login/MFA/CAPTCHA/viewing/offer states

Exit gate: only after integration evidence proves the controlled path safe and correct.

## M4 — Notifications & business layer

- [ ] Mid-month warning
- [ ] 4/4 confirmation
- [ ] Monthly position/points report
- [ ] Email provider
- [ ] WhatsApp provider
- [ ] Stripe checkout/webhooks if the product becomes commercial

## M5 — Operations

- [ ] Monitoring and structured logs
- [ ] Backup/restore test
- [ ] Incident/runbook documentation
- [ ] Small pilot
- [ ] Region-by-region adapter validation
