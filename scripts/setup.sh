#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22.13 or newer is required." >&2
  exit 1
fi

node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) process.exit(1)' || {
  echo "Node.js 22.13 or newer is required." >&2
  exit 1
}

npm ci

if [[ "${1:-}" == "--check" ]]; then
  npm run check
elif [[ $# -gt 0 ]]; then
  echo "Usage: ./scripts/setup.sh [--check]" >&2
  exit 2
fi

echo "Media Multiviewer is ready. Run: npm run dev"
