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

export const dreamTrapMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`dream-trap/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · GIẤC MƠ VÀ THỰC TẾ</div>
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
  const captionParts = page?.text.split(/(tưởng tượng|thành công|hôm nay|kế hoạch|tiến bộ|vẫn nằm đó|cảm giác|muốn nghe|góp ý|sai sót|lý do|làm xong|người thật|chưa ổn|khó nghe|bỏ sót|giấc mơ|sẽ làm|chưa làm|bắt đầu)/gi) ?? [];
  return <div data-testid="dream-trap-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const DreamTrapVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Thành công trong tưởng tượng" from={0} durationInFrames={280}><Scene first image="01-reflection" label="GIẤC MƠ ĐÃ ĐI RẤT XA">Còn hôm nay,<br /><span style={{color: GOLD}}>bạn đã làm gì?</span></Scene></Sequence>
    <Sequence name="02 · Cảm giác tiến bộ" from={274} durationInFrames={293}><Scene image="02-plans" label="KẾ HOẠCH THÊM">Công việc<br /><span style={{color: GOLD}}>vẫn còn nguyên.</span></Scene></Sequence>
    <Sequence name="03 · Chỉ nghe điều muốn tin" from={561} durationInFrames={297}><Scene image="03-mirror" label="KHI THỰC TẾ KHÁC ĐIỀU MÌNH NGHĨ">Chỉ nghe điều<br /><span style={{color: GOLD}}>mình muốn tin.</span></Scene></Sequence>
    <Sequence name="04 · Kiểm chứng bằng việc thật" from={852} durationInFrames={323}><Scene image="04-feedback" label="NHÌN VÀO KẾT QUẢ">Nghe cả lời<br /><span style={{color: GOLD}}>khó nghe.</span></Scene></Sequence>
    <Sequence name="05 · Bắt đầu hôm nay" from={1169} durationInFrames={271}><Scene image="05-first-lines" label="CỨ GIỮ GIẤC MƠ CỦA BẠN">Đừng sống trước<br /><span style={{color: GOLD}}>thành quả.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={48 * fps}>
      <Audio name="Quốc Tuấn · Giấc mơ và thực tế" src={staticFile('dream-trap/audio/narration-quoc-tuan-v2-pauses.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={41.5 * fps}
          durationInFrames={48 * fps}
          volume={dreamTrapMusicVolume(frame, fps)}
          playbackRate={0.8}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
