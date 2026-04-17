#!/bin/bash
# 🎯 Demo scenarios for CLI

set -e

echo "== WebKurier CLI demo =="

echo
echo "1) Dry run"
node apps/cli-terminal/dist/index.js search "latest AI coding assistants" --dry-run

echo
echo "2) Pretty format"
node apps/cli-terminal/dist/index.js search "compare GPT and Claude for coding" --mode agentic || true

echo
echo "3) Markdown format"
node apps/cli-terminal/dist/index.js search "drone laws in Germany" --format md || true