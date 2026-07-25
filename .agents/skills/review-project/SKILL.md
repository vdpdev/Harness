---
name: review-project
description: >-
  Thorough first-impression / end-user gap review of a whole project or library.
  Finds gaps, bugs, inconsistencies, packaging problems, docs drift, and risks
  that would hurt the people who consume the project - then turns every finding
  into an actionable ticket in tickets.json following this repo's AGENTS.md
  conventions. Guiding principle: "first impression lasts" - the very first
  thing a new user experiences (install, first command, first error) must be
  amazing. Trigger this skill when asked to "review the project", "find gaps /
  issues / problems", "audit before release", "what would hurt end users",
  "do a project health check", or "turn findings into tickets".
license: MIT
compatible_with:
  - claude-code
  - opencode
  - cursor
  - any-agents-md-aware-cli
---

# Project Review (first-impression gap analysis)

You are performing a **thorough, end-user-centric review** of this project. Your
job is not to admire the code - it is to find everything that could give a
consumer a bad first impression or cause them problems, and to record each
finding as a ticket so the work is tracked.

> **Guiding principle: "first impression lasts."** Optimize your attention for
> whatever a brand-new user hits first: the README, `install`, the very first
> command they run, the first error message they see, and the trust signals on
> the package registry page. A single wall of red errors on the first run, a
> missing license field, or a broken quickstart outweighs a dozen deep internal
> nitpicks.

## Ground rules

- **This is a RESEARCH + TICKETING task, not an implementation task.** Do NOT fix
  the issues you find unless the user explicitly asks. The deliverable is
  findings + tickets.
- **Read `AGENTS.md` (and any nested AGENTS.md) FIRST.** Follow its ticket
  conventions exactly (id format, `blockedBy`, `notes`, where done tickets go).
  Never re-open items AGENTS.md lists as closed/won't-fix.
- **Read `.agents-custom.md` if present.** It contains project-specific context
  (e.g. publishing method, architecture decisions, intentional design choices) that
  prevents false-positive findings. Never file a ticket for something the custom
  context explicitly explains as intentional.
- **Verify before you claim.** For every non-trivial finding, open the actual
  file and confirm the line(s). Never report a problem you haven't seen in the
  source. Include `file:line` references.
- **Prefer subagents for breadth.** Spawn parallel exploration agents for
  independent areas (runtime path, packaging/docs, tests, security) to cover the
  codebase quickly, then verify the critical claims yourself.

## Concurrent Agent Safety (MANDATORY)

**Another coding agent may be running on this repo simultaneously.** That agent
may create, modify, rename, or delete files while this review is in progress.
The review MUST NOT abort, crash, or produce false findings because of this.

### Rules

1. **Never trust a cached file list.** Always do a fresh glob scan immediately
   before starting the review phase. The scan is cheap; stale data is expensive.
2. **Never abort on a missing file.** If a file recorded in the review queue no
   longer exists when you open it, log it as `skipped — deleted by concurrent
agent` and move to the next file immediately.
3. **Never abort on a read error.** If a file fails to read (syntax error from
   mid-write, binary content, permission denied), log it as `skipped —
unreadable` and move on.
4. **Re-read files at review time, not scan time.** The jsonstore records the
   file path and metadata. When reviewing, always read the file fresh from disk
   at that moment — never rely on cached content from the scan phase.
5. **Re-verify before filing a ticket.** After you identify a finding but before
   writing the ticket, re-read the cited `file:line` one more time. If the line
   changed or disappeared since your initial read, skip the finding.
6. **Rescan on high change velocity.** If you notice many files have been added,
   removed, or modified since your initial scan (e.g. >5 files changed), abort
   the current pass, do a fresh scan, and restart the review from the new
   snapshot. The review is cheap; bad tickets from stale data are not.

### What this means in practice

- The review is a **two-phase, resumable** process: **Scan → Review**.
- The jsonstore (`review-project` category) tracks every discovered file and its
  review status (`pending` → `reviewed`).
- If the session crashes or is interrupted, re-running `init` with `--reset`
  creates a fresh snapshot; re-running without `--reset` preserves progress and
  backfills new files.
- **Never file a ticket based on a file you haven't read in the last 30 seconds.**
  If in doubt, re-read.

## Review checklist

Work through these lenses. Not every project has every surface - skip what does
not apply, but consciously consider each.

### 1. First-run / onboarding experience (highest priority)

- What happens on a clean install + the FIRST command a user runs? Trace it.
- Are defaults safe and quiet, or do they produce errors/crashes/noise out of
  the box (e.g. assuming a local service, a specific provider, credentials)?
- Is there a zero-setup / dry-run / preview path, and does the README lead with
  it? The first run should never be a screen of red.
- Are error messages **actionable** (they name the fix), or cryptic low-level
  dumps? Are repeated failures aggregated or do they flood the output?

### 2. Packaging & registry trust signals

- `package.json` (or equivalent): is there a `license` field (not just a LICENSE
  file), `repository`, `homepage`, `bugs`, `keywords`, `author`? Missing metadata
  publishes as UNLICENSED and kills discoverability.
- `engines` / runtime constraints: too strict (excludes common LTS) or wrong for
  a library (enforcing a package manager on consumers)?
- `exports`/`files`/`main`/`types`: do all entry points resolve to real built
  files? Run `npm pack --dry-run` and inspect.
- Version sanity: does 1.0.0 actually look 1.0-ready? (No CHANGELOG — tickets.json is the
  change history.)

### 3. Docs vs. reality

- Does every README/docs example import a real export and actually run?
- Do documented option names, defaults, and behaviors match the code? Spot-check
  each claimed number/name against source.
- Are quantitative claims true ("200+ rules", "supports X")? Verify by counting.
- Install instructions consistent (npm vs pnpm vs yarn)?

### 4. Configuration & validation robustness

- Are typo'd / unknown config keys rejected with a helpful message, or silently
  ignored (leading to silent fallback to defaults)?
- Are values validated (URLs are URLs, numbers in range) at config time, or only
  much later with a cryptic runtime failure?
- Does bad config produce a clear schema error?

### 5. Runtime robustness / long-lived processes

- Any synchronous/blocking behavior that could freeze an editor or watch mode?
- Any state that latches permanently (breakers, caches, flags) with no recovery
  in a reused process?
- Graceful degradation on network/dependency failure - no crashes/stack traces
  leaking to the user.

### 6. Security & privacy

- Any risk of leaking secrets (API keys, tokens, headers) into logs, debug
  output, cached artifacts, or committed fixtures/dumps?
- Redaction: is it applied everywhere user data leaves the process?

### 7. Correctness, dead code, consistency

- Provider/adapter assumptions hard-coded (single vendor shape)?
- Dead/duplicate code, TODO/placeholder markers, misleading options that do
  nothing.
- Inconsistent naming/behavior across similar features.

## Workflow

### Phase 0 — Orient

1. **Read `AGENTS.md`** and note ticket conventions + any closed non-issues.
2. **Map the project**: entry points (`package.json` exports, `main`), README,
   docs/, src/ top-level structure.
3. **Determine the next ticket ID**: scan `tickets.json` for
   the highest ticket ID (use the repo's prefix from `ticketPrefix` in `package.json`) and continue from there.

### Phase 1 — Scan (build review queue)

1. **Reset or resume.** If starting fresh, reset the jsonstore:
   ```bash
   node --import tsx scripts/jsonstore-layers/jsonstore.ts reset --category review-project
   ```
   If resuming a previous review, skip the reset — `init` backfills new files
   and preserves progress.
2. **Populate the queue.** Scan all project files:
   ```bash
   node --import tsx scripts/jsonstore-layers/jsonstore.ts init \
     --category review-project \
     --root . \
     --glob "**/*.ts" \
     --glob "**/*.md" \
     --glob "**/*.json"
   ```
   Adjust globs to cover every file type relevant to the review (config files,
   YAML, shell scripts, etc.). The scan ignores `node_modules/`, `.tmp/`,
   `dist/`, `.git/`.
3. **Check status.** Confirm the queue has entries:
   ```bash
   node --import tsx scripts/jsonstore-layers/jsonstore.ts status --category review-project
   ```

### Phase 2 — Review (file-by-file with resilience)

Review files from the queue one at a time. For each file:

1. **Claim the next file:**
   ```bash
   node --import tsx scripts/jsonstore-layers/jsonstore.ts set-field <id> \
     --field status --value inProgress --category review-project
   ```
2. **Read the file fresh from disk.** Never use cached content.
   - If the file **does not exist**: log `skipped — deleted by concurrent
agent`, mark status `skipped`, and move to the next file.
   - If the file **fails to read** (syntax error, binary, permission): log
     `skipped — unreadable (reason)`, mark status `skipped`, and move on.
3. **Analyze the file** against the review checklist lenses above. Note any
   findings with `file:line` references.
4. **Re-verify findings.** Before creating a ticket, re-read the cited line.
   If the line changed or vanished since step 2, drop the finding.
5. **Mark reviewed:**
   ```bash
   node --import tsx scripts/jsonstore-layers/jsonstore.ts set-field <id> \
     --field status --value reviewed --category review-project \
     --field notes "Reviewed. Findings: <count> Critical, <count> Major, <count> Minor"
   ```
6. **Repeat** until the queue is exhausted.

If many files are being deleted/modified mid-review (high change velocity),
abort the current pass, re-run Phase 1 with a fresh scan, and continue from
the new snapshot.

### Phase 3 — File tickets

After all files are reviewed:

1. **Group & de-duplicate** related findings so you file cohesive tickets, not
   one-per-line noise.
2. **Write tickets** into `tickets.json` following AGENTS.md format. For each:
   - `id`, `title` (crisp, problem-first), `blockedBy` (usually `[]`).
   - `notes`: SEVERITY tag (Critical / Major / Minor), the concrete evidence with
     `file:line`, the end-user impact ("what the consumer experiences"), and a
     specific suggested FIX. Notes should let a future implementer act without
     re-discovering the problem.
   - Order tickets by first-impression impact (onboarding/packaging first).
3. **Final re-read gate.** Before writing each ticket, re-read every cited
   `file:line` one last time. If any finding's source has changed, drop it.
   Never file a ticket for a line you haven't seen in the last 30 seconds.

### Phase 4 — Summary

**Summarize** to the user: counts by severity, the top 3 first-impression
risks, and the ticket IDs created. Do not start fixing unless asked.

## Severity guide

- **Critical**: crashes, silent permanent failure in normal use, data/secret
  leak, or a first-run experience that is broken/hostile for most users.
- **Major**: significant friction or misleading behavior, missing trust signals,
  strict constraints that block adoption, silent misconfiguration.
- **Minor**: polish, docs drift, dead code, cosmetic inconsistency.

## Output quality bar

A good review reads like a release-readiness audit written by someone who cares
about the user who has never seen this project before. Be specific, be factual,
cite lines, propose fixes, and file trackable tickets.
