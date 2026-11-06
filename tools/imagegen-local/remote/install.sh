#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-$HOME/imagegen-gpu}"
TAG="v0.44.0"
MODEL_REV="e0a819467f49fb5e6bf6f3479aaebb15a0878f25"
MODEL="sd_xl_base_1.0.safetensors"
MODEL_SHA="31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b"
mkdir -p "$BASE"
if [[ ! -d "$BASE/app/.git" ]]; then
  git clone --depth 1 --branch "$TAG" https://github.com/Comfy-Org/ComfyUI.git "$BASE/app"
fi
if [[ "$(git -C "$BASE/app" describe --tags --exact-match 2>/dev/null || true)" != "$TAG" ]]; then
  echo "ComfyUI trong $BASE/app không đúng tag $TAG; không tự ghi đè." >&2
  exit 1
fi
if [[ ! -x "$BASE/venv/bin/python" ]]; then python3 -m venv "$BASE/venv"; fi
"$BASE/venv/bin/pip" install --upgrade pip
"$BASE/venv/bin/pip" install torch==2.7.1 torchvision==0.22.1 torchaudio==2.7.1 --index-url https://download.pytorch.org/whl/cu126
"$BASE/venv/bin/pip" install -r "$BASE/app/requirements.txt"
mkdir -p "$BASE/app/models/checkpoints"
TARGET="$BASE/app/models/checkpoints/$MODEL"
if [[ ! -f "$TARGET" ]]; then
  curl --fail --location --continue-at - "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/$MODEL_REV/$MODEL" --output "$TARGET.part"
  printf '%s  %s\n' "$MODEL_SHA" "$TARGET.part" | sha256sum --check
  mv "$TARGET.part" "$TARGET"
fi
printf '%s  %s\n' "$MODEL_SHA" "$TARGET" | sha256sum --check
curl --fail --location "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/$MODEL_REV/LICENSE.md" --output "$BASE/SDXL-LICENSE.md"
"$BASE/venv/bin/python" -c 'import torch; assert torch.cuda.is_available(); print(torch.__version__, torch.cuda.get_device_name(0))'
git -C "$BASE/app" rev-parse HEAD > "$BASE/COMFYUI_COMMIT"
echo "Cài xong ComfyUI $TAG và $MODEL trong $BASE"
