import type {FC, ReactNode} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, CanvasImage, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import captionsData from './captions.json';
import music from './music.json';

const ACCENT = '#e5a363';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const captions = captionsData as Caption[][];
const starts = [0, 7, 17, 28, 38];

export const singleTaskMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.flatMap((group, i) => group.map((caption) => {
    const a = starts[i] + caption.startMs / 1000;
    const b = starts[i] + caption.endMs / 1000;
    return interpolate(seconds, [a - .08, a, b, b + .18], [0, 1, 1, 0], clamp);
  })));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{index: number; image: string; label: string; children: ReactNode}> = ({index, image, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = captions[index]?.find((c) => frame * 1000 / fps >= c.startMs && frame * 1000 / fps < c.endMs);
  return <AbsoluteFill style={{background: '#101113', overflow: 'hidden'}}>
    <CanvasImage src={staticFile(`single-task/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(6,8,10,.12), transparent 30%, rgba(8,10,12,.9) 63%, #080a0c 93%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: ACCENT, fontSize: 25, fontWeight: 700, letterSpacing: 4}}>STOIC · TẬP TRUNG</div>
    <div style={{position: 'absolute', top: 110, right: 100, color: '#f4efe5', fontSize: 25, fontWeight: 700, fontVariantNumeric: 'tabular-nums'}}>0{index + 1} / 05</div>
    <div style={{position: 'absolute', left: 84, right: 120, top: 1070}}>
      <div style={{color: ACCENT, fontSize: 24, fontWeight: 700, letterSpacing: 3, marginBottom: 22}}>{label}</div>
      <div style={{color: '#f4efe5', fontSize: 96, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2.5, opacity: interpolate(frame, [0, .12 * fps], [.4, 1], clamp)}}>{children}</div>
      <div style={{marginTop: 28, width: 104, height: 4, background: ACCENT}} />
    </div>
    <div style={{position: 'absolute', left: 88, right: 128, top: 1530, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f4efe5', textAlign: 'center', fontSize: 44, fontWeight: 600, lineHeight: 1.35, textShadow: '0 3px 14px #000'}}>{page?.text}</div>
    {index === 3 ? <div style={{position: 'absolute', left: 84, top: 1750, color: ACCENT, fontSize: 26, fontWeight: 700, letterSpacing: 2}}>30 PHÚT · MỘT PHẦN CỤ THỂ</div> : null}
  </AbsoluteFill>;
};

export const SingleTaskVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#080a0c', fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · Cắt thẳng · Không zoom">
      <Sequence name="01 · Mở tab, chưa xong việc" from={0} durationInFrames={7 * fps}><Scene index={0} image="01-scroll" label="MỞ MƯỜI TAB. XONG MẤY VIỆC?">BẬN RỘN<br /><span style={{color: ACCENT}}>HAY PHÂN TÁN?</span></Scene></Sequence>
      <Sequence name="02 · Né việc khó" from={7 * fps} durationInFrames={10 * fps}><Scene index={1} image="02-typewriter" label="THÊM NĂM PHÚT NỮA?">CHUẨN BỊ<br /><span style={{color: ACCENT}}>HAY ĐANG NÉ?</span></Scene></Sequence>
      <Sequence name="03 · Làm nửa vời" from={17 * fps} durationInFrames={11 * fps}><Scene index={2} image="03-battery" label="HAI GIỜ CHIỀU. VIỆC VẪN CÒN ĐÓ.">LÀM KHÔNG XONG.<br /><span style={{color: ACCENT}}>NGHỈ KHÔNG YÊN.</span></Scene></Sequence>
      <Sequence name="04 · Một việc" from={28 * fps} durationInFrames={10 * fps}><Scene index={3} image="04-laptop" label="ĐÓNG MẠNG XÃ HỘI">MỘT VIỆC.<br /><span style={{color: ACCENT}}>KHÔNG TAB<br />THỨ HAI.</span></Scene></Sequence>
      <Sequence name="05 · Quay lại làm việc" from={38 * fps} durationInFrames={7 * fps}><Scene index={4} image="05-chisel" label="KHÔNG CHỜ CẢM HỨNG">BỚT NGHĨ LẠI.<br /><span style={{color: ACCENT}}>LÀM ĐI.</span></Scene></Sequence>
    </Track>
    <Track name="Hải Đăng · Gọn, đanh · Tốc độ gốc">
      <Audio
        from={0}
        durationInFrames={7 * fps}
        src={staticFile('single-task/audio/01-scroll-voice-full.wav')}
      />
      <Audio
        from={7 * fps}
        durationInFrames={10 * fps}
        src={staticFile('single-task/audio/02-typewriter-voice-full.wav')}
      />
      <Audio from={17 * fps} durationInFrames={11 * fps} src={staticFile('single-task/audio/03-battery-voice-full.wav')} />
      <Audio from={28 * fps} durationInFrames={10 * fps} src={staticFile('single-task/audio/04-laptop-voice-full.wav')} />
      <Audio from={38 * fps} durationInFrames={7 * fps} src={staticFile('single-task/audio/05-chisel-voice-full.wav')} />
    </Track>
    {/* Keep native Audio timing inline so Studio can save trims/moves back to this node. */}
    <Track name="Nhạc nền · Kéo/cắt tự do">
      <Audio
        name="Experience · Reverb · Chỉnh trực tiếp trong Edit"
        src={staticFile('single-task/audio/experience-reverb-full.wav')}
        from={0}
        trimBefore={85 * fps}
        durationInFrames={45 * fps}
        playbackRate={0.85}
        volume={singleTaskMusicVolume(frame, fps)}
      />
    </Track>
  </AbsoluteFill>;
};
