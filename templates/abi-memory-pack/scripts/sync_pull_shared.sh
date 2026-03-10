#!/usr/bin/env bash
set -euo pipefail

# 用法：
#   ABI_SYNC_REPO=/path/to/private/repo ./scripts/sync_pull_shared.sh

if [[ -z "${ABI_SYNC_REPO:-}" ]]; then
  echo "ABI_SYNC_REPO is required"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/memory/shared/inbound"
mkdir -p "$TARGET"

rsync -av --delete "$ABI_SYNC_REPO/inbound-to-abi/" "$TARGET/"
echo "Pulled shared inbound into $TARGET"
