#!/usr/bin/env bash
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

# Активировать venv, если используешь:
# source venv/bin/activate

exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8081 \
  --proxy-headers \
  --forwarded-allow-ips="*"