#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bwrap.sh <profile_json> <cmd> [args...]
#
# Requires: bubblewrap (bwrap)

PROFILE="$1"; shift
CMD="$1"; shift || true

if [[ ! -f "$PROFILE" ]]; then
  echo "Profile not found: $PROFILE" >&2
  exit 2
fi

WORKSPACE="$(jq -r '.workspace' "$PROFILE")"
REPO_PATH="$(jq -r '.repo_path' "$PROFILE")"
MODE="$(jq -r '.repo_mode' "$PROFILE")"             # ro|rw (rw only for temp workspace)
NET="$(jq -r '.net' "$PROFILE")"                    # off|on
TIMEOUT_MS="$(jq -r '.timeout_ms' "$PROFILE")"
MEM_MB="$(jq -r '.limits.mem_mb' "$PROFILE")"
PIDS="$(jq -r '.limits.pids' "$PROFILE")"
CPU_SEC="$(jq -r '.limits.cpu_sec' "$PROFILE")"

# Safety
[[ -d "$WORKSPACE" ]] || mkdir -p "$WORKSPACE"
[[ -d "$REPO_PATH" ]] || { echo "Repo path missing: $REPO_PATH" >&2; exit 3; }

# Create job temp dir
JOBDIR="$(mktemp -d "$WORKSPACE/job.XXXXXX")"
chmod 700 "$JOBDIR"

# Network flags
NET_ARGS=()
if [[ "$NET" == "off" ]]; then
  NET_ARGS+=(--unshare-net)
fi

# Repo mount
REPO_ARGS=()
if [[ "$MODE" == "ro" ]]; then
  REPO_ARGS+=(--ro-bind "$REPO_PATH" /repo)
else
  # Still prefer RO, but allow RW only if profile says so.
  REPO_ARGS+=(--bind "$REPO_PATH" /repo)
fi

# Minimal FS
# We expose:
#  - /usr, /lib, /lib64, /bin, /sbin (read-only bind)
#  - /etc (read-only bind)
#  - /tmp (private)
#  - /workspace (RW temp)
#  - /repo (RO default)
BWRAP=(
  bwrap
  --die-with-parent
  --new-session
  --unshare-user --unshare-pid --unshare-ipc --unshare-uts
  "${NET_ARGS[@]}"
  --proc /proc
  --dev /dev
  --tmpfs /tmp
  --dir /workspace
  --bind "$JOBDIR" /workspace
  "${REPO_ARGS[@]}"
  --ro-bind /usr /usr
  --ro-bind /lib /lib
  --ro-bind /lib64 /lib64
  --ro-bind /bin /bin
  --ro-bind /sbin /sbin
  --ro-bind /etc /etc
  --chdir /repo
  --setenv HOME /workspace
  --setenv TMPDIR /tmp
)

# Limits (best-effort)
# bubblewrap itself doesn’t enforce cgroups; use systemd unit for cgroup limits.
# We enforce timeout in Node wrapper; here just run the command.

exec "${BWRAP[@]}" -- "$CMD" "$@"