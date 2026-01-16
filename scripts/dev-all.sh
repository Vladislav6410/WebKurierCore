#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

pushd "$REPO_ROOT" >/dev/null

bash backend/start_uvicorn.sh &
BACKEND_PID=$!

echo "Backend running on http://localhost:8081 (FastAPI)"

node server/index.js

popd >/dev/null
