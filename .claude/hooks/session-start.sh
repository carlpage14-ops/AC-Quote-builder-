#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

echo "Installing backend dependencies..."
cd "$REPO_ROOT/backend"
npm install --no-audit --no-fund

echo "Installing frontend dependencies..."
cd "$REPO_ROOT/frontend"
npm install --no-audit --no-fund

echo "Session start hook complete."
