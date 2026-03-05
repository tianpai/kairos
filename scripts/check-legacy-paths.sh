#!/usr/bin/env bash

set -euo pipefail

has_error=0
if command -v rg >/dev/null 2>&1; then
  SEARCH_CMD=(rg -n --glob "*.{ts,tsx,js,mjs,cjs}")
else
  SEARCH_CMD=(
    grep
    -RInE
    --include=*.ts
    --include=*.tsx
    --include=*.js
    --include=*.mjs
    --include=*.cjs
  )
fi

run_check() {
  local description="$1"
  local pattern="$2"
  shift 2

  echo "Checking: ${description}"
  if "${SEARCH_CMD[@]}" "${pattern}" "$@"; then
    echo "FAIL: ${description}"
    has_error=1
  else
    echo "OK: ${description}"
  fi
}

run_check \
  "No imports/references to removed legacy main paths" \
  "src/main/(ai|db|ipc|services|workflow|menu\\.ts|index\\.ts|config/settings\\.service)" \
  src

run_check \
  "No 3+ parent relative imports into removed legacy main paths from src/main/modules" \
  "(from|import\\()\\s*[\"'](\\.\\./){3,}(ai|db|ipc|services|workflow)(/|$)" \
  src/main/modules

run_check \
  "No direct relative imports into removed legacy main paths from src/main root helpers" \
  "(from|import\\()\\s*[\"'](\\./|\\.\\./)(ai|db|ipc|services|workflow)(/|$)" \
  src/main/schemas src/main/utils

run_check \
  "No imports/references to legacy preload api paths" \
  "src/preload/api/" \
  src

run_check \
  "No relative imports from preload api paths" \
  "(from|import\\()\\s*[\"'](\\./|\\.\\./)api/" \
  src/preload

if [[ ${has_error} -ne 0 ]]; then
  echo "Legacy path checks failed."
  exit 1
fi

echo "Legacy path checks passed."
