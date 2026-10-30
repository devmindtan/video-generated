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

export const lessJudgmentMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`less-judgment/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · BỚT PHÁN XÉT</div>
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
  const captionParts = page?.text.split(/(cà phê|liếc sang|ăn mặc|nghỉ việc|ổn định|không biết rõ|góp vài câu|hợp chuyện|khen chê|vắng mặt|sở thích|cân nhắc|vài câu|chưa thể hiểu|căng thẳng|không rõ|Dạo này bạn thế nào|trước mặt|nhận xét|chấm điểm)/gi) ?? [];
  return <div data-testid="less-judgment-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const LessJudgmentVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Cuộc hẹn cà phê" from={0} durationInFrames={313}><Scene first image="01-coffee" label="BẠN ĐANG UỐNG CÀ PHÊ">Một cuộc hẹn<br /><span style={{color: GOLD}}>cà phê…</span></Scene></Sequence>
    <Sequence name="02 · Góp lời cho hợp chuyện" from={307} durationInFrames={291}><Scene image="02-verdict" label="MÌNH CŨNG CHƯA BIẾT RÕ">Góp vài câu.<br /><span style={{color: GOLD}}>Thành khen chê.</span></Scene></Sequence>
    <Sequence name="03 · Chưa biết đủ câu chuyện" from={592} durationInFrames={292}><Scene image="03-unread" label="MỖI NGƯỜI CÓ CÂU CHUYỆN RIÊNG">Mới nghe vài câu.<br /><span style={{color: GOLD}}>Chưa rõ chuyện.</span></Scene></Sequence>
    <Sequence name="04 · Quan tâm người trước mặt" from={878} durationInFrames={361}><Scene image="04-listen" label="THỬ ĐỔI HƯỚNG CUỘC TRÒ CHUYỆN">Dạo này<br /><span style={{color: GOLD}}>bạn thế nào?</span></Scene></Sequence>
    <Sequence name="05 · Cuộc gặp, không chấm điểm" from={1233} durationInFrames={267}><Scene image="05-conversation" label="KHÔNG PHẢI CHUYỆN GÌ CŨNG CẦN NHẬN XÉT">Gặp nhau,<br /><span style={{color: GOLD}}>đừng vội phán xét.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={50 * fps}>
      <Audio name="Quốc Tuấn · Chuyện gì cũng cần nhận xét" src={staticFile('less-judgment/audio/narration-quoc-tuan-v2-pronunciation.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={53.95399999999999 * fps}
          durationInFrames={50 * fps}
          volume={lessJudgmentMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
