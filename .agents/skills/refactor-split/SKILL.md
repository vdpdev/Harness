---
name: refactor-split
description: >-
  Automated function extraction and file splitting. Extracts top-level functions
  from monolithic .ts files into single-responsibility modules organized in a
  per-barrel subdirectory. After splitting, auto-formats, lint-fixes, runs full
  CI to validate, fixes any failures, and commits the clean result. Trigger
  when asked to "split files", "extract functions", "refactor split", "break up
  monoliths", or "run the split script".
license: MIT
compatible_with:
  - claude-code
  - opencode
  - cursor
  - any-agents-md-aware-cli
---

# Refactor-Split

Extract top-level functions from monolithic `.ts` files into single-responsibility
modules under a subdirectory named after the source file (barrel). The original
file becomes a barrel that re-exports everything.

## Workflow

### 1. Run the split

```bash
pnpm run refactor:split [-- --dir <path>] [-- --dry-run]
```

By default `refactor:split` includes `--subdir` — extracted files go into
`{dirname}/{barrelName}/`, never flat alongside the barrel. Collisions between
different barrels are impossible because each gets its own directory.

To preview without touching files:

```bash
pnpm run refactor:split -- --dir scripts --dry-run
```

To scan the whole repo (not just `src/`):

```bash
pnpm run refactor:split -- --dir .
```

The older flat-output behavior is available via `pnpm run refactor:split:flat`.

### 2. Auto-fix formatting and lint

After the split runs, immediately fix formatting and lint on all changed files:

```bash
npx prettier --write $(git diff --name-only HEAD)
npx eslint --fix $(git diff --name-only HEAD)
```

This saves tokens by avoiding a full-project scan and targeting only what changed.

### 3. Validate with full CI

```bash
pnpm run local:ci
```

### 4. Fix CI failures

If `local:ci` fails, fix each failure:

- **Type errors** — adjust import paths, add missing exports, fix type mismatches
  in extracted files or the barrel
- **Lint failures** — run `npx eslint --fix <file>` on each failing file
- **Format issues** — run `npx prettier --write <file>` on each failing file
- **Test failures** — trace the breakage to the source (usually a missing import
  or re-export) and fix it
- **Repo health failures** — check the specific check that failed and resolve it

Re-run `pnpm run local:ci` after each fix batch until everything passes.

### 5. Commit

When full CI is green, commit all changes:

```
git add -A
git commit -m "refactor: split monolithic files into per-function modules"
```

## Ground rules

- **Scan widely.** Don't limit to `src/` — target `scripts/`, `test/`, anywhere
  that has multi-function `.ts` files. Use `--dir .` to scan the entire repo.
- **Always `--subdir`.** Extracted files go in `{barrelName}/` subdirectory.
  Never dump flat — collision risk is too high (e.g. three jsonstore-layers
  barrels all exporting `readStore`).
- **Fix, don't revert.** If CI fails, fix the root cause. Don't just revert the
  split.
- **One commit per split session.** Group all split + fix work into one
  well-described commit.
