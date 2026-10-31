# Prompt hình / animation từng cảnh — Biết dừng cũng là dũng cảm

Chưa tạo ảnh. Mỗi cảnh một ảnh tĩnh dọc 9:16, chuyển động thêm trong Remotion theo frame (ghi ở dòng **Chuyển động**). Không Gemini/Veo; không mặt người. Asset dự kiến ở `public/know-when-to-quit/images/`.

Phần chung thêm vào cuối mỗi prompt:

```text
Photorealistic cinematic fine art. Portrait 9:16, one image, main subject in the upper 55 percent; lower 40 percent dark and quiet for separately added captions. Deep shadows, high contrast, realistic materials and textures. No people's faces, no text, letters, numbers, logos, watermark, borders or collage.
```

## 01-ledger · Cảnh 1 — "Ba năm. Bốn mươi triệu."

Asset: `public/know-when-to-quit/images/01-ledger.png`

```text
Use case: background still for a Vietnamese philosophy short about knowing when to quit. Subject: late-night close shot of a worn open ledger notebook on an old wooden desk, columns of handwritten figures blurred and illegible, many lines crossed out, a loose stack of receipts held by a binder clip, a cold half-finished cup of tea, a single warm desk lamp casting amber light from the side, the rest of the room in darkness. Mood: tired, quietly heavy, not dramatic.
```

**Chuyển động:** ánh đèn chập chờn rất nhẹ (độ sáng dao động theo frame), khung đứng yên.

## 02-hourglass · Cảnh 2 — "thời gian đã qua thì không lấy lại được"

Asset: `public/know-when-to-quit/images/02-hourglass.png`

```text
Use case: background still for a Vietnamese philosophy short about knowing when to quit. Subject: an antique brass and glass hourglass on a dark stone ledge, almost all of the sand already in the lower bulb, only a thin last stream falling, warm low side light catching the glass, fine dust in the air, dark background. Mood: still, irreversible, calm rather than anxious.
```

**Chuyển động:** dòng cát mảnh vẽ bằng lớp hạt theo frame, chảy liên tục; ảnh nền đứng yên.

## 03-dry-well · Cảnh 3 — "Đào giếng sai chỗ…"

Asset: `public/know-when-to-quit/images/03-dry-well.png`

```text
Use case: background still for a Vietnamese philosophy short about knowing when to quit. Subject: a deep hand-dug pit in cracked dry earth at dusk, rough stone-lined edge, a wooden shovel stuck upright in a heap of freshly dug dry soil beside it, an empty bucket on a frayed rope, the bottom of the pit dark and completely dry, low amber sun from the side, long shadows, no water anywhere. Mood: effort spent in the wrong place.
```

**Chuyển động:** bụi đất bay nhẹ ngang khung theo gió (lớp hạt), không zoom.

## 04-fork · Cảnh 4 — "nếu hôm nay mới bắt đầu…"

Asset: `public/know-when-to-quit/images/04-fork.png`

```text
Use case: background still for a Vietnamese philosophy short about knowing when to quit. Subject: early morning at a fork in a narrow dirt path through open hills, an old weathered wooden signpost with two blank boards pointing different ways, soft mist in the valleys, first pale light on the horizon, cool blue-grey tones turning faintly warm at the edge of the sky. Mood: clear-headed, a fresh decision.
```

**Chuyển động:** lớp sương trôi chậm theo frame; trời sáng dần rất nhẹ.

## 05-shovel-down · Cảnh 5 — "Đặt cái xẻng xuống…"

Asset: `public/know-when-to-quit/images/05-shovel-down.png`

```text
Use case: background still for a Vietnamese philosophy short about knowing when to quit. Subject: close shot of two weathered hands, seen from above with no face or body visible, laying a wooden shovel flat on dry ground at the edge of a hill; beyond them, out of focus, a path leads down to a green valley where a small stream catches the sunrise. Warm morning light, soft rim light on the hands. Mood: letting go calmly, open space ahead.
```

**Chuyển động:** nắng lên dần (ánh sáng ấm tăng theo frame) ở nửa sau cảnh, mờ dần về đen ở cuối video.

## Thumbnail · `KnowWhenToQuitThumbnail`

Dùng lại ảnh `03-dry-well` (xẻng cắm cạnh giếng khô), làm tối thêm phía trên để đặt tiêu đề. Tiêu đề **BIẾT DỪNG** vàng, dòng phụ "cũng là dũng cảm" ngà, Stoic Sans Bold 700. Không tạo ảnh riêng cho thumbnail, không tự xuất.
