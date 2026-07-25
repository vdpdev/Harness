# Repository AI Guidelines

> **FIRST-READ GATE — MANDATORY:** Before doing anything else, read `.agents-custom.md`
> into your context. It contains your project-specific overrides that supplement or
> override the rules below. If you have not read this file, you do not have complete
> instructions for this project. Do not generate code, make decisions, or file tickets
> until `.agents-custom.md` is in your context.

## Core System Guidelines

You MUST follow these architectural rules for all code generation, refactoring, and
code reviews in this project.

### Database & Querying Rules (MANDATORY)

- **NEVER** write or execute raw SQL queries.
- **ALWAYS** use the ORM's built-in methods, query builder functions, and helper methods
  for all database operations (e.g. `where`, `update`, `insert`, `delete`, finders, etc.).
- Passing arguments to standard ORM / Query Builder functions is **required** to ensure
  parameter safety, architectural consistency, type safety, and modern coding practices.
- If a query seems complex, construct it using the ORM's dynamic query builder features
  instead of falling back to raw string execution or raw SQL blocks.

This is a **hard constraint** — violations must be caught during review and must not be merged.

### Architecture & Design Patterns: Mandatory Dependency Injection (MANDATORY)

- **ALWAYS** use the Dependency Injection (DI) pattern when designing classes, services,
  modules, and handlers.
- **NEVER** directly instantiate heavy dependencies, database clients, external services,
  or API wrappers inside business logic classes/functions. Pass them in through constructors
  or method signatures.
- **Why this is mandatory:**
  - Direct instantiation tightly couples code, making isolated testing nearly impossible.
  - DI allows services, database layers, and third-party APIs to be easily mocked or stubbed
    out during unit and integration testing.
  - Testability is a critical priority for this repository, especially in environments where
    spinning up full databases or external service mocks is difficult or impractical.
- Every new component must be constructed with mockability and fast, isolated testing in mind.

This is a **hard constraint** — violations must be caught during review and must not be merged.

### Completeness

- **Strict completeness:** Never use `// TODO` or placeholders. Implement fully in one go.

### Verify: always run build + lint + typecheck + tests before committing

```bash
pnpm run build
pnpm run lint
pnpm run typecheck
pnpm test
```

### Auto-fix before lint

```bash
npx eslint --fix <changed-files>
npx prettier --write <changed-files>
```

## Human Decision Gate

Implement autonomously unless a decision materially affects architecture, scalability,
security, maintainability, cost, or future evolution.

When multiple production-grade approaches are reasonable, do **not** choose one yourself.
Instead:

- invoke the **suggest** skill,
- present the best 2–4 options,
- summarize the trade-offs,
- recommend one option with justification,
- wait for the user's decision.

Recommendations should assume this project targets **production-quality engineering**,
not the simplest implementation. Prefer proven, scalable, maintainable solutions and
modern best practices over shortcuts (e.g. PostgreSQL over SQLite, RBAC over basic
authentication, structured architectures, comprehensive testing, observability, secure
defaults, and appropriate design patterns).

After a decision is made, implement it completely and consistently without asking
unnecessary follow-up questions.

## Ticket-First Workflow (CRITICAL)

Every change in the repo must be under a ticket. No exceptions. The ticket captures the
**intent** — _why_ the change is being made, not just _what_ changed. Git diffs show what;
tickets show why.

### Ticket store

Tickets live in ONE JSON file managed by `scripts/tickets.ts`:

- **`tickets.json`** — the single ticket store. It holds every ticket regardless of status.

There is a **second** persisted queue, the `coverage` category in the shared jsonstore
(`.tmp/temp.json`), but it is **NOT a ticket store**. It is the test-hardening coverage queue used
only by the `harden-tests` skill, managed by `scripts/jsonstore-layers/test-coverage.ts`.
Never manage jsonstore categories through `tickets.ts`, and never treat its entries as
backlog tickets to implement.

Schema per ticket:

```json
{
  "id": "PREFIX-#",
  "title": "Short description",
  "status": "open | inProgress | done",
  "parent": "PREFIX-#",
  "blockedBy": ["PREFIX-#"],
  "notes": "Intent: why this change. What it does.",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

> **Ticket prefix:** The prefix (e.g. `H-123`) is configured in `package.json` via the
> `ticketPrefix` field. Change it once; all scripts, validation, and docs examples adapt.

### Lifecycle

```
1. PICK    → find ticket with status=open and blockedBy=[]
2. CLAIM   → node --import tsx scripts/tickets.ts claim PREFIX-#
3. PLAN    → outline approach in notes before coding
4. DO      → implement fully (never partial, never with TODO placeholders)
5. VERIFY  → auto-fix then run build + lint + typecheck + test
6. DONE    → node --import tsx scripts/tickets.ts done PREFIX-# --notes "..."
7. COMMIT  → git add + commit with the ticket change included
```

### CLI commands

```bash
node --import tsx scripts/tickets.ts add PREFIX-# "Title" --notes "Intent and plan"
node --import tsx scripts/tickets.ts list
node --import tsx scripts/tickets.ts claim PREFIX-#
node --import tsx scripts/tickets.ts done PREFIX-# --notes "..."
node --import tsx scripts/tickets.ts release PREFIX-#
node --import tsx scripts/tickets.ts show PREFIX-#
node --import tsx scripts/tickets.ts blocked
```

## JSON Store — resumable scratch storage

When a job is **large, iterable, and NOT tickets**, use `scripts/jsonstore-layers/jsonstore.ts`
— a generic CRUD JSON store ("JSON-Redis") backed by `.tmp/temp.json` (gitignored, temporary).

```bash
node --import tsx scripts/jsonstore-layers/jsonstore.ts init --category myjob --root src --glob "**/*.ts"
node --import tsx scripts/jsonstore-layers/jsonstore.ts list --category myjob --first 5
node --import tsx scripts/jsonstore-layers/jsonstore.ts set-field <id> --field status --value done
node --import tsx scripts/jsonstore-layers/jsonstore.ts status --category myjob
node --import tsx scripts/jsonstore-layers/jsonstore.ts reset --category myjob
```

## Project-Specific Rules & Context

Refer to `.agents-custom.md` for project-specific business rules, domain context, and local overrides.
