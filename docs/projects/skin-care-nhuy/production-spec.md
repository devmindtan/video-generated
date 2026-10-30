# Skin care Như Ý — thay âm thanh

- Hình: giữ nguyên `out/skin-care-nhuy.mp4`, bản dùng trong composition nằm ở `public/skin-care-nhuy/video/source.mp4`.
- Audio gốc: tắt bằng `muted`; không trộn lại tiếng cũ.
- Lời đọc: preset **Adam bựa**, VieNeu-TTS v3 Turbo chạy local, không voice clone và không dịch vụ trả phí.
- SFX: bảy cue tổng hợp cục bộ, có chủ đích theo thao tác nhấc/lật/mở/bóp/tán và product hero. Đây là âm thanh cách điệu, không phải field recording.
- Composition: `SkinCareNhuyAdam`, 368×654, 30 fps, 904 frame (30,133 giây).
- Hai mức âm lượng `voiceVolume` và `sfxVolume` chỉnh được trong `src/projects/skin-care-nhuy/audio.json`; từng cue vẫn hiện riêng trong Studio Edit.
- Chưa render MP4 tự động. Chất lượng cảm nhận cần nghe duyệt trong Studio.
