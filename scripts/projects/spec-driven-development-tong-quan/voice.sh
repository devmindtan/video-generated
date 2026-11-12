#!/bin/sh
# Narration for Spec Driven Development: tóm tắt cả cuốn sách (Minh Đức, VieNeu preset). Run from the repository root
# through `limited`. Reads scripts/projects/spec-driven-development-tong-quan/story.json (build-story.py); writes one
# wav per segment.
HF_HUB_OFFLINE=1 exec .venv/bin/python scripts/shared/make-voice.py --voice 'Minh Đức' \
  --story scripts/projects/spec-driven-development-tong-quan/story.json --asset-dir public/spec-driven-development-tong-quan/audio \
  --captions src/projects/spec-driven-development-tong-quan/voice-captions.json --srt .cache/spec-driven-development-tong-quan-segments.srt \
  --metadata public/spec-driven-development-tong-quan/audio/voice-metadata.json --docs .cache/spec-driven-development-tong-quan-story.md \
  --title 'Spec Driven Development: tóm tắt cả cuốn sách' --target-speed 1 --temperature 0.5 \
  --voice-style 'clear, steady, explanatory; natural Vietnamese; English technical terms read plainly' \
  --project-style 'tóm tắt sách kỹ thuật' \
  --delivery-note 'Giọng Minh Đức kể rõ ràng, đều, như giải thích cho đồng nghiệp; thuật ngữ tiếng Anh đọc theo cách kỹ sư Việt hay nói. Style là ghi chú biên tập, không phải model control.' \
  --width 1920 --height 1080 --alignment-model medium
