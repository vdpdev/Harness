# Development Workflows

This document maps the meta-processes that keep the project healthy.

## Source of truth

```
tickets.json              ← single ticket store (intent + status)
.tmp/temp.json            ← JSON-Redis scratch store (resumable agent work)
package.json (scripts)    ← all CI/local entry points
```

## Local CI pipeline

```
pnpm run local:ci:quick   # fast: build + lint + format:check + test + repo-health
pnpm run local:ci           # full suite
```

Steps:

1. Clean build artifacts
2. Enable corepack + install
3. Build (`pnpm run build`)
4. Typecheck (`pnpm run typecheck`)
5. Lint (`pnpm run lint`)
6. Format check (`pnpm run format:check`)
7. Test (`pnpm test`)
8. Repo health (`pnpm run repo-health`)

## Script workflows

| Script                     | Location                    | Purpose                                                  |
| -------------------------- | --------------------------- | -------------------------------------------------------- |
| `tickets.ts`               | `scripts/`                  | Ticket CRUD (add/claim/done/release/show/blocked)        |
| `repo-health.ts`           | `scripts/`                  | Health check aggregator (imports check functions)        |
| `local-ci.sh`              | `scripts/`                  | Local CI pipeline                                        |
| `jsonstore.ts`             | `scripts/jsonstore-layers/` | Generic JSON CRUD store ("JSON-Redis")                   |
| `test-coverage.ts`         | `scripts/jsonstore-layers/` | Sword-vs-Shield test hardening (jsonstore layer)         |
| `dump-review.ts`           | `scripts/jsonstore-layers/` | Dump inspection queue (jsonstore layer)                  |
| `stateModel.ts`            | `scripts/utils/`            | FSM engine (used by tickets, test-coverage, dump-review) |
| `split-functions.ts`       | `scripts/utils/`            | AST-based function extractor                             |
| `verify-coverage.ts`       | `scripts/utils/`            | Format, lint, repo hygiene, secrets, ticket integrity    |
| `verify-repo-structure.ts` | `scripts/utils/`            | tsconfig, dirs, gitignore, ticket IDs                    |
| `check-test-health.ts`     | `scripts/utils/`            | TS AST test + export symbol coverage                     |
| `check-package-manager.ts` | `scripts/utils/`            | Warns if wrong package manager used                      |
| `preview-stats.ts`         | `scripts/utils/`            | File counting utility                                    |

## Health checks (`repo-health`)

`pnpm run repo-health` runs health check functions from an importable array.

### Architecture

```
repo-health.checks.ts            ← user file: exports checks array
scripts/repo-health/types.ts     ← HealthCheck + HealthCheckResult types
scripts/repo-health/defaults.ts  ← built-in check functions
scripts/repo-health/aggregator.ts ← imports user file or defaults, runs all
scripts/repo-health.ts           ← entry point
```

### User customization

Create `repo-health.checks.ts` at the repo root:

```typescript
import { defaultChecks } from './scripts/repo-health/defaults.js';
import type { HealthCheck } from './scripts/repo-health/types.js';

export const checks: HealthCheck[] = [
  ...defaultChecks,
  // add custom checks here
];
```

If this file doesn't exist, only default checks run.

### Default checks

| Check            | What it verifies                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `coverage`       | package.json scripts, source tree, format, lint, repo hygiene, secrets, ticket integrity |
| `structure`      | tsconfig valid, src/test dirs, gitignore, ticket ID format, .env.example present         |
| `test-health`    | Every `src/` file has a test file, every exported symbol referenced in tests             |
| `split-validate` | No multi-function files needing split (defensive gate)                                   |
| `skill-registry` | Every .agents/skills/ folder has matching entry in AGENTS.md or .agents-custom.md        |

Modes: `quick` (coverage + structure), `ci` (with thresholds), `strict` (test-health blocks).

## Agent skills

| Skill                    | When to use                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `implement`              | Start working on tickets, autonomous ticket-driven sessions |
| `review-project`         | First-impression / end-user gap review                      |
| `harden-tests`           | Sword-vs-Shield systematic test hardening                   |
| `no-assumption`          | Stop and ask when certainty < 95%                           |
| `no-blind-implement`     | Question the plan before implementing                       |
| `progressive-confidence` | Staff-level engineering discovery before design             |
| `suggest`                | Brainstorm options before committing                        |
| `refactor-split`         | Extract functions from monoliths into per-barrel modules    |

## GitHub Actions CI

`.github/workflows/ci.yml` runs on push to `main` and PRs:

1. Checkout → corepack → setup Node 22 → install → build → lint → format → test → repo health

Concurrency groups cancel superseded runs.
