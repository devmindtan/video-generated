#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$BASE/server.pid"
if [[ ! -f "$PID_FILE" ]]; then exit 0; fi
PID="$(cat "$PID_FILE")"
if [[ "$PID" =~ ^[0-9]+$ ]] && [[ -d "/proc/$PID" ]]; then
  CWD="$(readlink -f "/proc/$PID/cwd" 2>/dev/null || true)"
  CMD="$(tr '\0' ' ' < "/proc/$PID/cmdline" 2>/dev/null || true)"
  if [[ "$CWD" == "$BASE/app" && "$CMD" == *"main.py"* ]]; then kill "$PID"; fi
fi
rm -f "$PID_FILE"
