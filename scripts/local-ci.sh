#!/usr/bin/env bash
set -euo pipefail

# Local CI replica - runs every check before pushing
# Usage:
#   ./scripts/local-ci.sh            # full suite
#   ./scripts/local-ci.sh --quick    # skip slow checks
#   ./scripts/local-ci.sh --step N   # resume from step N

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
QUICK=0
RESUME_STEP=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --quick) QUICK=1; shift ;;
    --step) RESUME_STEP="$2"; shift 2 ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

run_step() {
  local num="$1" label="$2"
  shift 2
  if [ "$num" -lt "$RESUME_STEP" ]; then
    echo "  [SKIP step $num] $label"
    return 0
  fi
  echo ""
  echo "=== [$num] $label ==="
  "$@"
}

cd "$REPO_ROOT"

# ---- Clean ----
run_step 1 "Clean build artifacts" rm -rf dist

# ---- Install ----
run_step 2 "Enable corepack" corepack enable
run_step 3 "Install dependencies (frozen lockfile)" pnpm install --frozen-lockfile

# ---- Build ----
run_step 4 "TypeScript build" pnpm run build

# ---- Typecheck ----
run_step 5 "Typecheck (no emit)" pnpm run typecheck

# ---- Lint + Format ----
run_step 6 "Lint" pnpm run lint
run_step 7 "Check formatting" pnpm run format:check

# ---- Test ----
run_step 8 "Unit tests" pnpm test

# ---- Health ----
if [ "$QUICK" -eq 1 ]; then
  run_step 9 "Repo health (quick)" pnpm run repo-health quick
else
  run_step 9 "Repo health (full)" pnpm run repo-health
fi

echo ""
echo "=== local-ci PASSED ==="
