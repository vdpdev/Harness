# Contributing

Thanks for your interest in contributing! This guide covers how to set up the repo, the
workflow conventions we follow, and how to get a change merged.

## Development setup

This repo is developed and tested with **pnpm** (pinned via `packageManager`). On a fresh
machine enable Corepack first, then install:

```bash
corepack enable
pnpm install
```

If you use a bare `npm install` instead, the `postinstall` script only warns — but you'll
drift from the lockfile, so prefer pnpm.

## How we work: Ticket-First

Every change lives under a ticket in `tickets.json`. The ticket captures **intent** — _why_
the change exists, not just _what_ changed.

Lifecycle:

1. **Pick** — find a ticket with `status: open` and empty `blockedBy`.
2. **Claim** — `node --import tsx scripts/tickets.ts claim PREFIX-#`
3. **Plan** — write the approach into ticket `notes` before coding.
4. **Do** — implement fully. No `// TODO` placeholders.
5. **Verify** — always run local CI before committing.
6. **Done** — `node --import tsx scripts/tickets.ts done PREFIX-# --notes "..."`
7. **Commit** — stage the change + the ticket, then commit.

Tickets are managed **only** via `scripts/tickets.ts` — never edit `tickets.json` by hand.

## Local CI (required before every commit)

```bash
pnpm run local:ci:quick
```

## Project layout

- `src/` — application code
- `test/` — unit tests
- `scripts/` — ticket store, jsonstore, local CI, health checks
- `docs/` — developer-facing docs
- `.agents/skills/` — agent skills for AI-assisted development
- `AGENTS.md` — default AI rules (ships with scaffold)
- `.agents-custom.md` — harness self-development context (does not ship in scaffold)

## Tests

- `pnpm test` — unit tests
- `pnpm run test:coverage` — Sword-vs-Shield test-hardening harness

## Code style

- ESLint + Prettier, enforced in CI.
- Match existing conventions: framework choices, naming, imports.

## Submitting a PR

1. Branch from `main`.
2. Run local CI green.
3. Ensure the related ticket is `done` and committed.
4. Open a PR with the ticket ID reference (format configured via `ticketPrefix` in `package.json`).
