#!/bin/bash
# 🛡️ WebKurier SecurityAgent — Automated Test Suite
# Usage: ./scripts/test-security-agent.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting SecurityAgent Tests${NC}\n"

echo -e "${GREEN}✓${NC} Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}✗${NC} pnpm not found. Install: https://pnpm.io/installation"
  exit 1
fi

echo -e "${GREEN}✓${NC} Building agent-bridge..."
pnpm --filter=@webkurier/agent-bridge build || true

echo -e "${GREEN}✓${NC} Checking CLI command availability..."
node apps/cli-terminal/dist/index.js --help | grep -q "agent" || {
  echo -e "${RED}✗${NC} CLI output missing 'agent' command"
  exit 1
}

echo -e "${GREEN}✓${NC} Testing SecurityAgent doctor..."
DOCTOR_OUTPUT=$(node apps/cli-terminal/dist/index.js agent security doctor 2>&1 || true)
if echo "$DOCTOR_OUTPUT" | grep -Eq "OPENAI_API_KEY|looks good"; then
  echo -e "${GREEN}✓${NC} SecurityAgent doctor works"
else
  echo -e "${RED}✗${NC} Unexpected doctor output:"
  echo "$DOCTOR_OUTPUT"
  exit 1
fi

echo -e "${GREEN}✓${NC} Testing invalid target validation..."
INVALID_OUTPUT=$(node apps/cli-terminal/dist/index.js agent security check "file:///etc/passwd" 2>&1 || true)
if echo "$INVALID_OUTPUT" | grep -Eq "Unsupported URL scheme|failed"; then
  echo -e "${GREEN}✓${NC} Invalid scheme is rejected"
else
  echo -e "${RED}✗${NC} Invalid target was not rejected as expected:"
  echo "$INVALID_OUTPUT"
  exit 1
fi

echo -e "${GREEN}✓${NC} SecurityAgent smoke test completed"
exit 0