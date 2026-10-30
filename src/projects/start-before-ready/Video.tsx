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

export const startBeforeReadyMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`start-before-ready/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · BẮT ĐẦU KHI CÒN SỢ</div>
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
  const captionParts = page?.text.split(/(hết sợ|bắt đầu|tự tin|trước khi thử|mắc kẹt|lúng túng|chưa tốt|có thể sửa|chưa thử|biết rõ hơn|thật sự khó|lần sau|quyết định|việc nhỏ|hôm nay|sẵn sàng)/gi) ?? [];
  return <div data-testid="start-before-ready-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const StartBeforeReadyVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Chờ đến bao giờ" from={0} durationInFrames={278}><Scene first image="01-threshold" label="ĐỢI HẾT SỢ MỚI LÀM?">Bạn sẽ còn chờ.<br /><span style={{color: GOLD}}>Rất lâu.</span></Scene></Sequence>
    <Sequence name="02 · Đòi chắc chắn trước khi thử" from={272} durationInFrames={220}><Scene image="02-untested" label="CHƯA THỬ, SAO BIẾT?">Muốn chắc chắn.<br /><span style={{color: GOLD}}>Nên cứ mắc kẹt.</span></Scene></Sequence>
    <Sequence name="03 · Cho mình một lần thử" from={486} durationInFrames={309}><Scene image="03-first-mark" label="LẦN ĐẦU CHƯA CẦN GIỎI">Làm chưa tốt.<br /><span style={{color: GOLD}}>Vẫn có thể sửa.</span></Scene></Sequence>
    <Sequence name="04 · Biết thêm sau mỗi lần thử" from={789} durationInFrames={223}><Scene image="04-learning" label="THỬ RỒI MỚI BIẾT">Biết mình thiếu gì.<br /><span style={{color: GOLD}}>Biết cách sửa.</span></Scene></Sequence>
    <Sequence name="05 · Nỗi sợ không cầm lái" from={1006} durationInFrames={153}><Scene image="05-with-fear" label="VẪN SỢ, VẪN CÓ THỂ LÀM">Nỗi sợ còn đó.<br /><span style={{color: GOLD}}>Bạn vẫn được chọn.</span></Scene></Sequence>
    <Sequence name="06 · Bắt đầu từ một việc nhỏ" from={1153} durationInFrames={197}><Scene image="06-small-step" label="MỘT VIỆC BẠN ĐÃ TRÌ HOÃN">Một bước nhỏ.<br /><span style={{color: GOLD}}>Ngay hôm nay.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={45 * fps}>
      <Audio name="Quốc Tuấn · Bắt đầu khi còn sợ" src={staticFile('start-before-ready/audio/narration-quoc-tuan-v2-pauses.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={53.95399999999999 * fps}
          durationInFrames={45 * fps}
          volume={startBeforeReadyMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
