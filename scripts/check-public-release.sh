#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

RUN_AUDIT=false
if [[ "${1:-}" == "--audit" ]]; then
  RUN_AUDIT=true
elif [[ $# -gt 0 ]]; then
  echo "Usage: ./scripts/check-public-release.sh [--audit]" >&2
  exit 2
fi

if [[ ! -d .git ]]; then
  echo "Initialize the repository with: git init -b main" >&2
  exit 1
fi

echo "Checking Git whitespace..."
git diff --check
git diff --cached --check

echo "Checking candidate files for private or generated artifacts..."
if git ls-files --cached --others --exclude-standard | rg -q \
  '(^|/)(node_modules|dist|\.vinext|\.wrangler|outputs|work)/|(^|/)\.env$|(^|/)\.DS_Store$|\.(mp4|mov|mkv|webm|m3u8|har|sqlite3?|db)$'; then
  git ls-files --cached --others --exclude-standard | rg \
    '(^|/)(node_modules|dist|\.vinext|\.wrangler|outputs|work)/|(^|/)\.env$|(^|/)\.DS_Store$|\.(mp4|mov|mkv|webm|m3u8|har|sqlite3?|db)$' >&2
  echo "A private or generated artifact is a publication candidate." >&2
  exit 1
fi

echo "Checking candidate files for common secret formats..."
if rg -n --hidden \
  -g '!.git/**' \
  -g '!node_modules/**' \
  -g '!.vinext/**' \
  -g '!.wrangler/**' \
  -g '!dist/**' \
  '(gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{30,}|glpat-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|BEGIN [A-Z ]*PRIVATE KEY)' \
  .; then
  echo "Potential secret detected. Review before publishing." >&2
  exit 1
fi

echo "Checking candidate file sizes..."
oversized=false
while IFS= read -r -d '' candidate_file; do
  if [[ -f "$candidate_file" ]]; then
    byte_count="$(wc -c < "$candidate_file" | tr -d ' ')"
    if (( byte_count > 10000000 )); then
      echo "File exceeds the 10 MB project limit: $candidate_file" >&2
      oversized=true
    fi
  fi
done < <(git ls-files --cached --others --exclude-standard -z)
if [[ "$oversized" == "true" ]]; then
  exit 1
fi

echo "Running lint, TypeScript, tests, and production build..."
npm run check

if [[ "$RUN_AUDIT" == "true" ]]; then
  echo "Querying the npm production advisory database..."
  npm audit --omit=dev
fi

echo "Public release checks passed."
