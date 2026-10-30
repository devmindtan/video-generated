import type {FC, ReactNode} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, CanvasImage, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import captionsData from './captions.json';
import music from './music.json';

const GOLD = '#dcb777';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const captions = captionsData as Caption[];

export const timeAndGoldMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`time-and-gold/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · THỜI GIAN VÀ VÀNG</div>
    <div style={{position: 'absolute', top: 1060, left: 84, right: 120, opacity: interpolate(frame, [.1 * fps, .45 * fps], [0, 1], clamp)}}>
      <div style={{color: GOLD, fontSize: 24, letterSpacing: 3, marginBottom: 22}}>{label}</div>
      <div style={{fontSize: 88, fontWeight: 700, lineHeight: 1.14, letterSpacing: -2, color: '#f2ede3'}}>{children}</div>
      <div style={{height: 3, marginTop: 30, background: GOLD, width: interpolate(frame, [0, .7 * fps], [0, 100], clamp)}} />
    </div>
  </AbsoluteFill>;
};

const NarrationCaptions: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = captions.find((c) => frame * 1000 / fps >= c.startMs && frame * 1000 / fps < c.endMs);
  const captionParts = page?.text.split(/(nhiều tiền|mua lại|ngày nào|ngồi cạnh mẹ|đủ khỏe|kiếm đủ tiền|về nhà|chăm sóc|quan trọng|chuyến đi|hai mươi tuổi|căn nhà lớn|giữ mãi|cần tiền|đầy đủ|thời gian|điều mình quý|hôm nay|quá muộn|vàng|kiếm thêm|một lần)/gi) ?? [];
  return <div data-testid="time-and-gold-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const TimeAndGoldVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Bạn muốn mua lại ngày nào" from={0} durationInFrames={300}><Scene first image="01-clock" label="NẾU MỘT NGÀY CÓ THẬT NHIỀU TIỀN">Bạn muốn mua lại<br /><span style={{color: GOLD}}>ngày nào?</span></Scene></Sequence>
    <Sequence name="02 · Những cái hẹn với tương lai" from={294} durationInFrames={319}><Scene image="02-suitcase" label="NHỮNG ĐIỀU CỨ PHẢI CHỜ">Kiếm đủ tiền<br /><span style={{color: GOLD}}>rồi sẽ…</span></Scene></Sequence>
    <Sequence name="03 · Điều tiền không thể trả lại" from={607} durationInFrames={310}><Scene image="03-empty-home" label="MUA ĐƯỢC NHIỀU HƠN">Không lấy lại<br /><span style={{color: GOLD}}>được.</span></Scene></Sequence>
    <Sequence name="04 · Chọn cách dùng thời gian" from={911} durationInFrames={334}><Scene image="04-tea" label="DÀNH THỜI GIAN CHO ĐIỀU MÌNH QUÝ">Đừng đợi đủ đầy<br /><span style={{color: GOLD}}>mới bắt đầu sống.</span></Scene></Sequence>
    <Sequence name="05 · Ngày hôm nay" from={1239} durationInFrames={261}><Scene image="05-hourglass" label="VÀNG CÒN CÓ THỂ KIẾM THÊM">Ngày hôm nay<br /><span style={{color: GOLD}}>chỉ có một lần.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={50 * fps}>
      <Audio name="Quốc Tuấn · Thời gian và vàng" src={staticFile('time-and-gold/audio/narration-quoc-tuan-v2-mother-fix.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={53.95399999999999 * fps}
          durationInFrames={50 * fps}
          volume={timeAndGoldMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
