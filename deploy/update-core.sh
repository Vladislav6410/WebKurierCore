#!/bin/bash
set -e

REPO_DIR="/srv/webkurier-data/repos/WebKurier/WebKurierCore"
BRANCH="main"
CONTAINER="webkurier-core"

echo "======================================"
echo "WebKurierCore Update Script"
echo "======================================"

cd "$REPO_DIR" || {
  echo "ERROR: repo dir not found: $REPO_DIR"
  exit 1
}

echo "[1/7] Current branch:"
git branch --show-current

CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "ERROR: expected branch '$BRANCH', but current is '$CURRENT_BRANCH'"
  exit 1
fi

echo "[2/7] Fetching remote..."
git fetch origin

echo "[3/7] Pulling latest changes..."
git pull origin "$BRANCH"

echo "[4/7] Git status:"
git status --short || true

echo "[5/7] Checking docker container..."
docker ps --format '{{.Names}}' | grep -qx "$CONTAINER" || {
  echo "ERROR: container '$CONTAINER' is not running"
  exit 1
}

echo "[6/7] Restarting container..."
docker restart "$CONTAINER"

echo "[7/7] Checking last logs..."
docker logs "$CONTAINER" --tail 20 || true

echo "======================================"
echo "WebKurierCore updated successfully"
echo "======================================"