---
name: harden-tests
description: >-
  Sword-vs-Shield systematic, resumable per-test hardening harness. Enumerates
  every test file in the repo, classifies each as sword (asserts product behavior
  / requirement) or shield (guards quality / regression), runs it to find weak /
  empty / failing / flaky tests, and improves each test (strengthen assertions,
  add missing cases) or files a real tickets.json finding. Driven by a resumable
  queue (scripts/jsonstore-layers/test-coverage.ts, a thin layer over `scripts/jsonstore-layers/jsonstore.ts` under the `test-coverage` category). Trigger when asked to "harden
  tests", "improve test coverage", "find weak tests", or "run the harden-tests".
license: MIT
compatible_with:
  - claude-code
  - opencode
  - cursor
  - any-agents-md-aware-cli
---

# Test-Duel (Sword vs Shield)

You are running a **long, resumable per-test hardening session** across the whole
repo. The metaphor: **Sword vs Shield** — every test fights the SAME goal from
opposite sides.

- **SWORD** — tests that prove the _product requirement_: behavior, the contract
  the consumer depends on (insight rules, prompt assembly, LLM contract, CLI
  output, SARIF/report schema). A weak sword lets a product bug ship.
- **SHIELD** — tests that guard _quality / regression_: lint, `verify:repo-hygiene`
  (secret/node_modules scans), `verify:coverage` thresholds, dump
  fingerprint stability, preview-output guards. A weak shield lets a regression
  slip by silently.

The coverage pass strengthens each test (tighter assertions, missing cases, flaky fixes)
or, when the weakness is structural and out of scope for an inline fix, graduates
it to a real `tickets.json` ticket.

> **Guiding principle: "does this test actually catch the thing it claims to?"**
> A test that always passes proves nothing. The coverage pass exists to find those.

## Ground rules

- **This is a RESEARCH + IMPROVEMENT + TICKETING task.** Inline-strengthen weak
  tests where the fix is local and obvious; file a ticket when the weakness needs
  a design decision or crosses module boundaries. Follow `AGENTS.md` ticket
  conventions exactly. Never re-open items listed as closed/won't-fix.
- **Read `AGENTS.md` FIRST.** Especially the Ticket-First Workflow and the
  `coverage` jsonstore category note (a layer over `scripts/jsonstore-layers/jsonstore.ts`, NOT a ticket store).
- **Verify before you claim.** For every verdict, actually _run_ the test file
  (`node --import tsx --test <file>`) and read its assertions. Never report a
  weakness you haven't reproduced. Include `file:line` references.
- **Prefer subagents for breadth.** Spawn parallel agents to harden batches of
  queued tests (one file, or one `project`, per agent). Each agent runs + judges
  its slice and returns a structured findings report; you then verify, improve or
  ticket, and `done` the entries. The `coverage` jsonstore category coordinates claims so
  agents don't collide.
- **One ticket per coherent weakness**, not one per assertion. Group related gaps.
- **Two-phase, queue-driven process.** First **discover + classify** every test
  into the `test-coverage` jsonstore category with `scripts/jsonstore-layers/test-coverage.ts init` (Phase 1), then **harden
  them one by one** by pulling each off the queue with `node scripts/jsonstore-layers/test-coverage.ts next`
  (Phase 2). This split keeps a durable worklist on disk so the long,
  crash-prone session is fully resumable.
- **`scripts/jsonstore-layers/test-coverage.ts` exists only to FEED ticket creation and track hardening.\***
  Its entries are NOT tickets — they are per-test progress markers
  (`pending` → `inProgress` → `reviewed`, with an `improved`|`clean`|`ticketed`
  verdict) that guarantee every test is judged exactly once. Anything actually
  worth acting on graduates to a real `tickets.json` ticket via
  `scripts/tickets.ts`; from there the standard `implement` flow fixes it.
  `scripts/jsonstore-layers/test-coverage.ts` (a thin layer over `scripts/jsonstore-layers/jsonstore.ts`, category `test-coverage`) is scaffolding for the coverage pass, not a parallel backlog.
- **Judge and close each test in ONE pass — no second review.** For each test,
  decide on the spot: strengthen it inline (verdict → `improved` via `--findings`),
  leave it (verdict → `clean`), or file a ticket (verdict → `ticketed` via
  `--ticketed "PREFIX-#"`). Never batch findings to the end.

## How the harness works

`scripts/jsonstore-layers/test-coverage.ts` is zero-dependency and mirrors `scripts/jsonstore-layers/dump-review.ts`. It is the
sibling of `scripts/tickets.ts` and `scripts/jsonstore-layers/dump-review.ts` and reuses the same finite-state
machine model declared in `scripts/utils/stateModel.ts` (so `stateModel` /
`stateTransitions` work identically).

### Phase 1 — discover + classify (`init`)

```
node scripts/jsonstore-layers/test-coverage.ts init            # scan repo, write test-coverage jsonstore category
node scripts/jsonstore-layers/test-coverage.ts init --root .   # explicit root (same as default)
node scripts/jsonstore-layers/test-coverage.ts init --reset    # discard prior progress
node scripts/jsonstore-layers/test-coverage.ts status          # count, sword/shield split, ticket yield
```

`init` walks the repo ignoring `node_modules` / `.tmp` / `dist` / `.git` and
collects **every** `*.test.*` / `*.spec.*` file — not just `test/*.test.ts`. Each
entry is classified `sword` or `shield` by a heuristic (path markers such as
`repo-hygiene` / `project-health` / `node_modules-guard` → shield; `examples/`
tests → sword; a body peek for shield markers) with a best-effort fallback to
sword. Re-running `init` is idempotent: it preserves review progress and backfills
classification on new files.

### Phase 2 — harden (`next` / `claim` / `done`)

```
node scripts/jsonstore-layers/test-coverage.ts next                       # claim + print the next pending test
node scripts/jsonstore-layers/test-coverage.ts next --project <name>      # scope to one top-level dir
node scripts/jsonstore-layers/test-coverage.ts claim <id>                 # lock a specific test
node scripts/jsonstore-layers/test-coverage.ts show <id>                  # inspect a single entry
node scripts/jsonstore-layers/test-coverage.ts done <id> --notes "..."    # reviewed, verdict -> clean (no change)
node scripts/jsonstore-layers/test-coverage.ts done <id> --findings "..." # reviewed, verdict -> improved (strengthened)
node scripts/jsonstore-layers/test-coverage.ts done <id> --ticketed "PREFIX-#"   # reviewed, verdict -> ticketed
node scripts/jsonstore-layers/test-coverage.ts release <id>               # return a claimed test to pending
node scripts/jsonstore-layers/test-coverage.ts list [--status ...] [--classification sword|shield] [--project ...]
node scripts/jsonstore-layers/test-coverage.ts analyze <id> [--rerun N]    # execute + score strength, detect weak/failing/flaky
node scripts/jsonstore-layers/test-coverage.ts report                      # coverage report: sword/shield balance + strength + weaknesses
```

The same commands are exposed as npm scripts: `npm run test:coverage:init`,
`npm run test:coverage:next`, `npm run test:coverage:analyze`, `npm run test:coverage:status`,
and `npm run test:coverage:report` (plain `npm run test:coverage` prints help).

For each queued test the coverage pass: (1) **executes** it (`node --import tsx --test
<file>`) capturing pass/fail/error/timeout; (2) **scores** sword/shield strength
via heuristics — empty/weak (0 assertions or no-op passes), failing (known-broken),
flaky (re-run N times, diff outcomes), shield-gap (quality guard asserts nothing),
sword-gap (low assertion density); (3) **acts** — inline-strengthen or file a
ticket; (4) **closes** the entry in one pass.

### FSM introspection

```
node scripts/jsonstore-layers/test-coverage.ts stateModel          # full ticket + runartifacts + test-coverage graph
node scripts/jsonstore-layers/test-coverage.ts stateTransitions <id>  # current state + allowed next states + guard
```

## Weak-test playbook

- **Empty / always-passes** (e.g. a test whose only assertions are no-op
  `t.pass`-style or that never fail on a broken input): add real assertions, or
  file a ticket if the fix needs redesign.
- **Failing but left as known-broken**: either fix it or ticket it with the root
  cause; don't let a permanently-red test rot in the suite.
- **Flaky**: isolate the nondeterminism (timing, ordering, shared global state)
  and make it deterministic; ticket if it needs a harness change.
- **Shield gap**: a quality-guard test that asserts nothing meaningful — tighten
  it so a regression would actually fail.
- **Sword gap**: a behavior test with low branch/assertion density — add the
  missing case.

## When done

`scripts/jsonstore-layers/test-coverage.ts status` reports the sword/shield split, per-project completion, and
ticket yield. Commit any inline test-strengthening as ordinary code changes under
their own tickets; the queue entries are just progress markers.
