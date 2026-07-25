---
name: implement
description: >-
  Autonomous ticket-driven work session starter. Picks the next actionable ticket
  per the repo's Ticket-First Workflow, works on decision-free tickets first, then
  surfaces decision-required tickets with a few options (recommended marked) per
  ticket, claims/continues inProgress tickets (often orphaned from crashed agents)
  after verifying they are truly done, and actively tries to unblock blocked
  tickets. Trigger this skill when asked to "start working on tickets", "work the
  backlog", "start my ticket session", "pick up tickets", or "implement".

  NOTE: This skill was renamed from 'start-working-on-tickets' to 'implement' for
  better naming consistency.
license: MIT
compatible_with:
  - claude-code
  - opencode
  - cursor
  - any-agents-md-aware-cli
---

# Implement

You are starting an autonomous ticket-driven work session for this repository.
Follow the repo's **Ticket-First Workflow** in AGENTS.md. This skill defines the
_ordering and decision policy_ for working the backlog. The `scripts/tickets.ts`
CLI is the source of truth for ticket state.

## Inputs (where tickets come from)

The tickets you work here are ordinary `tickets.json` tickets — including those
created by the **`dump-review`** skill. That skill reviews every
`preview-output` dump through its own resumable queue (`scripts/jsonstore-layers/dump-review.ts`, a thin
layer over `scripts/jsonstore-layers/jsonstore.ts` under the `runartifacts` category) and, for each dump it judges worth acting on, files a real
`tickets.json` ticket. By the time you run, those dump-review tickets are
indistinguishable from any other ticket — they are just backlog in
`tickets.json`. Work them no differently.

> **Scope boundary:** this skill only ever touches `tickets.json`
> via `scripts/tickets.ts`. The `runartifacts` jsonstore category is a _review-coverage queue_, not a
> ticket store — never read, claim, or "done" it here. The hand-off is already
> complete: the ticket exists; you implement it.

## Guiding Principle

Work the backlog in a way that maximizes throughput without waiting on the human
unless truly necessary. Prefer doing over asking — but when a decision genuinely
needs the human, present it crisply with a recommended option.

## Phase 0: Orient

1. Run `node scripts/tickets.ts list` to see all open + inProgress tickets.
2. Run `node scripts/tickets.ts blocked` to see tickets waiting on unresolved
   blockers.
3. Read AGENTS.md Ticket-First Workflow section if you have not already.
4. Determine the highest existing `PREFIX-#` so you can reserve new IDs if you need
   to create a ticket (e.g. a missing ticket for discovered work).

## Phase 1: Classify every ticket

For each ticket, decide which bucket it falls into:

- **A. Decision-free (autonomous):** the ticket's intent/notes fully specify
  what to do; no product/design/architecture choice is needed. You can implement
  it end-to-end without asking.
- **B. Decision-required:** implementing this ticket needs a human choice
  (which approach, which dependency, behavior trade-off, etc.).
- **C. Blocked:** `blockedBy` lists a ticket that is not `done`.
- **D. In-progress (claimed by someone/another agent):** status `inProgress`.

A ticket can be both B and C — handle C first (try to unblock), then B.

## Phase 2: Work order

Work in this strict priority order. Within a tier, pick by lowest `PREFIX-#`.

### Tier 1 — Decision-free, unblocked (Bucket A, not C)

For each ticket: claim (`node scripts/tickets.ts claim PREFIX-#`), implement
fully, verify (lint + typecheck + tests), then `node scripts/tickets.ts done
PREFIX-# --notes "..."`. **Commit the ticket's work immediately after it is
marked done** (see Phase 5) — one commit per ticket. Only then move on to the
next ticket. Do NOT stop to ask the human. These are pure throughput.

### Tier 2 — In-progress tickets (Bucket D)

These are often orphaned from a crashed or interrupted coding agent. **Work on
them anyway** — but first VERIFY their real state:

1. Inspect the actual code/working tree for the ticket's scope.
2. If the work is **already complete and verified** → mark done with evidence
   (what was checked) and **commit it** (Phase 5). Do not silently leave it
   inProgress.
3. If the work is **partial or broken** → finish it: claim (steal via `claim`),
   implement, verify, done, then **commit** (Phase 5).
4. If the work was **never started** (claim is stale) → treat as a normal ticket
   and proceed per its bucket (A/B/C) after this tier.

Do not skip inProgress tickets just because they're "owned" — ownership means
nothing if the agent is gone.

### Tier 3 — Unblock yourself (Bucket C)

For each blocked ticket, look at its `blockedBy`. If a blocker is not done:

- Can YOU complete the blocker? If the blocker is decision-free, do Tier 1 on it
  first, then return.
- Can you verify the blocker is actually already satisfied (code exists, tests
  pass) even though no ticket was marked done? If so, mark the blocker done with
  evidence, then the blocked ticket becomes actionable.
- If the blocker genuinely cannot be resolved without a human decision, leave the
  ticket blocked and move on — but note it for the human summary.

Actively try to unblock; don't just report "blocked".

### Tier 4 — Decision-required, unblocked (Bucket B, not C)

For each such ticket, BEFORE doing the work, present the human with:

- The ticket id + one-line intent.
- **A few (2–4) concrete options** for how to proceed.
- **Exactly one option marked "(Recommended)"** with a one-line rationale.
- What you'd do if they pick the recommended one (so they can just say "go").

Use the `question` tool to collect the choice. Then claim, implement per their
selection, verify, done, and **commit** (Phase 5).

Do not implement a decision-required ticket on a guess. The point of this tier is
to make the human's decision cheap, not to avoid it.

## Phase 3: Verify before done (every ticket)

Never call `done` on unverified code. Run, per AGENTS.md:

- `pnpm lint` (or the repo's lint command)
- `pnpm typecheck` (or equivalent)
- `pnpm test` (or the relevant test scope)

If verification fails, fix it or release the claim — do not ship broken.

## Phase 4: Human summary

When you stop (tiers exhausted, or you hit a decision wall), report:

- Tickets completed this session (ids + one line each).
- In-progress tickets you verified/finished.
- Blockers you resolved vs. those still stuck (and why).
- **Decision-required tickets still open**, each with its recommended option, so
  the human can answer in one pass.

## Phase 5: Commit per ticket

Each ticket is an independent unit of work and MUST be committed when done, so
the coding agent can move cleanly to the next ticket. After `done` for a ticket:

1. `git status` / `git diff` — confirm only that ticket's changes are present.
2. `git add` the files scoped to the ticket (do NOT `git add -A` blindly; never
   stage secrets, `.env`, or unrelated work).
3. Commit with a message that references the ticket id, e.g.
   `[PROJECT_SHORT_CODE]-123: <short summary of the intent>`.
4. Do NOT push unless the human asks.
5. Move on to the next ticket only after the commit succeeds.

This keeps the history one-commit-per-ticket and lets an interrupted agent
resume or another agent steal the next ticket without colliding on an uncommitted
working tree.

## Hard rules

- No ticket work without a ticket (Ticket-First). Create one with
  `node scripts/tickets.ts add` if you discover unplanned work.
- No `// TODO` / placeholder implementations. Do it fully or don't claim it.
- **Commit each ticket when done** (Phase 5) — one commit per ticket, so the
  agent can move to the next ticket cleanly. Do NOT push unless the human asks.
- Never silently leave an inProgress ticket that is actually finished.
