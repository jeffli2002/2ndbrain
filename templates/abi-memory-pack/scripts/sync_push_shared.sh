#!/usr/bin/env bash
set -euo pipefail

# 用法：
#   ABI_SYNC_REPO=/path/to/private/repo ./scripts/sync_push_shared.sh

if [[ -z "${ABI_SYNC_REPO:-}" ]]; then
  echo "ABI_SYNC_REPO is required"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$ROOT/memory/shared/outbound"
TARGET="$ABI_SYNC_REPO/outbound-from-abi"
mkdir -p "$TARGET"

rsync -av --delete "$SOURCE/" "$TARGET/"
echo "Pushed shared outbound into $TARGET"
