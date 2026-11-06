#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE/app"
echo $$ > "$BASE/server.pid"
export HF_HUB_OFFLINE=1
export PYTHONUNBUFFERED=1
exec "$BASE/venv/bin/python" main.py --listen 127.0.0.1 --port 8188 --novram --cpu-vae --reserve-vram 0.5 --force-fp16 --disable-auto-launch --disable-all-custom-nodes --offline
