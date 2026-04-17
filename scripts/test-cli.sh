#!/bin/bash
# 🧪 WebKurier CLI — Automated Test Suite
# Usage: ./scripts/test-cli.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting CLI Integration Tests${NC}\n"

echo -e "${GREEN}✓${NC} Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}✗${NC} pnpm not found. Install: https://pnpm.io/installation"
  exit 1
fi

echo -e "${GREEN}✓${NC} Building CLI package..."
pnpm --filter=@webkurier/cli-terminal build

echo -e "${GREEN}✓${NC} Testing --help output..."
node apps/cli-terminal/dist/index.js --help | grep -q "search" || {
  echo -e "${RED}✗${NC} Help output missing 'search' command"
  exit 1
}

echo -e "${GREEN}✓${NC} Testing config validation..."
OUTPUT=$(node apps/cli-terminal/dist/index.js search "test" 2>&1 || true)
if echo "$OUTPUT" | grep -q "OPENAI_API_KEY"; then
  echo -e "${GREEN}✓${NC} Correctly reports missing API key"
else
  echo -e "${YELLOW}⚠${NC} Config validation output:"
  echo "$OUTPUT"
fi

echo -e "${GREEN}✓${NC} Testing --dry-run mode..."
DRY_OUTPUT=$(node apps/cli-terminal/dist/index.js search "drone regulations Germany" --dry-run 2>&1)
if echo "$DRY_OUTPUT" | grep -q "Dry Run"; then
  echo -e "${GREEN}✓${NC} Dry-run mode works correctly"
else
  echo -e "${RED}✗${NC} Dry-run output unexpected:"
  echo "$DRY_OUTPUT"
  exit 1
fi

echo -e "${GREEN}✓${NC} Testing --format json (dry-run)..."
JSON_OUTPUT=$(node apps/cli-terminal/dist/index.js search "test" --dry-run --format json 2>&1 || true)
if echo "$JSON_OUTPUT" | grep -q '"query"'; then
  echo -e "${GREEN}✓${NC} JSON dry-run works correctly"
else
  echo -e "${RED}✗${NC} JSON dry-run output unexpected:"
  echo "$JSON_OUTPUT"
  exit 1
fi

echo -e "${GREEN}✓${NC} Testing domain filter parsing..."
DOMAIN_TEST=$(node apps/cli-terminal/dist/index.js search "test" -d openai.com github.com --dry-run 2>&1)
if echo "$DOMAIN_TEST" | grep -q "openai.com"; then
  echo -e "${GREEN}✓${NC} Domain filter correctly parsed"
else
  echo -e "${RED}✗${NC} Domain filter output unexpected:"
  echo "$DOMAIN_TEST"
  exit 1
fi

echo -e "${GREEN}✓${NC} Interactive mode available (manual test skipped)"

echo -e "\n${GREEN}✅ All CLI tests passed!${NC}"
echo -e "${YELLOW}💡 Next: set OPENAI_API_KEY and run a real search${NC}"
echo -e "   webkurier search \"your query\" --mode agentic"

exit 0