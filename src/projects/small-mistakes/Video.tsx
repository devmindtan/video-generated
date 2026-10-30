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

export const smallMistakesMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`small-mistakes/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · MỘT LỖI NHỎ</div>
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
  const captionParts = page?.text.split(/(trong lớp|cuộc họp|nhầm|nói vấp|vài giây|tối về|ánh mắt|kém|im lặng|tua lại|tưởng tượng|chính xác|chẳng nhớ|đến lượt|nhận ra|nhớ mãi|đính chính|tập lại|lỗi nhỏ|tự chê|hoàn hảo|lắng nghe|muốn hỏi|muốn góp|ngượng ngùng)/gi) ?? [];
  return <div data-testid="small-mistakes-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const SmallMistakesVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01a · Trong lớp học" from={0} durationInFrames={79}><Scene first image="01-classroom" label="TRONG LỚP HAY TRONG CUỘC HỌP">Vài giây nói nhầm.<br /><span style={{color: GOLD}}>Cả tối nghĩ lại.</span></Scene></Sequence>
    <Sequence name="01b · Trong phòng họp" from={73} durationInFrames={243}><Scene image="01b-meeting" label="TRONG LỚP HAY TRONG CUỘC HỌP">Vài giây nói nhầm.<br /><span style={{color: GOLD}}>Cả tối nghĩ lại.</span></Scene></Sequence>
    <Sequence name="02 · Tự đoán người khác nghĩ gì" from={310} durationInFrames={238}><Scene image="02-magnify" label="CHẮC HỌ THẤY MÌNH…">Bạn đang nhớ…<br /><span style={{color: GOLD}}>hay đang đoán?</span></Scene></Sequence>
    <Sequence name="03 · Đổi phía để nhìn lại" from={542} durationInFrames={313}><Scene image="03-notebooks" label="HỌ CŨNG BẬN VỚI CUỘC SỐNG MÌNH">Người khác cũng có<br /><span style={{color: GOLD}}>nỗi lo của họ.</span></Scene></Sequence>
    <Sequence name="04 · Sửa phần cần sửa" from={849} durationInFrames={377}><Scene image="04-correction" label="MỘT LỖI NHỎ CẦN ĐƯỢC SỬA">Sửa một lỗi.<br /><span style={{color: GOLD}}>Đừng tự kết tội.</span></Scene></Sequence>
    <Sequence name="05 · Lần sau vẫn lên tiếng" from={1220} durationInFrames={280}><Scene image="05-microphone" label="KHÔNG CẦN NÓI HOÀN HẢO">Lần sau,<br /><span style={{color: GOLD}}>vẫn cứ lên tiếng.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={50 * fps}>
      <Audio name="Quốc Tuấn · Một lỗi nhỏ" src={staticFile('small-mistakes/audio/narration-quoc-tuan-v2-pronunciation.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={53.95399999999999 * fps}
          durationInFrames={50 * fps}
          volume={smallMistakesMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
