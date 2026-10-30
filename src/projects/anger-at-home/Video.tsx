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

export const angerAtHomeMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`anger-at-home/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · ĐỪNG TRÚT GIẬN</div>
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
  const captionParts = page?.text.split(/(bực cả ngày|ở nhà|nặng nề|nhịn|cáu|nhường nhịn|hiểu mình|bực dọc|đón nhận|cay nghiệt|người thân|đau hơn|tin tưởng|yếu lòng|tổn thương|nguôi giận|người nghe|bực bội|giữ ý|hỏi ít|dè chừng|tự nhiên|cảm thông|tử tế|kiên nhẫn|chính mình|thu mình|trở về)/gi) ?? [];
  return <div data-testid="anger-at-home-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const AngerAtHomeVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Người gây ra, người chịu" from={0} durationInFrames={220}><Scene first image="01-arrival" label="CẢ NGÀY BẠN ĐÃ PHẢI NHỊN">Bạn giận ai?<br /><span style={{color: GOLD}}>Ai đang chịu?</span></Scene></Sequence>
    <Sequence name="02 · Quen được nhường nhịn" from={214} durationInFrames={360}><Scene image="02-overflow" label="VỀ ĐẾN NHÀ, CHỈ MỘT CÂU HỎI">Quen được nhường.<br /><span style={{color: GOLD}}>Quên họ cũng đau.</span></Scene></Sequence>
    <Sequence name="03 · Đau từ người mình tin" from={568} durationInFrames={445}><Scene image="03-cracked-cup" label="LỜI CAY NGHIỆT TỪ NGƯỜI THÂN">Đau vì đó là<br /><span style={{color: GOLD}}>người mình tin.</span></Scene></Sequence>
    <Sequence name="04 · Người nghe vẫn nhớ" from={1007} durationInFrames={378}><Scene image="04-distance" label="BẠN NÓI XONG RỒI HẾT GIẬN">Bạn đã nguôi.<br /><span style={{color: GOLD}}>Họ vẫn dè chừng.</span></Scene></Sequence>
    <Sequence name="05 · Cần được đối xử tử tế" from={1379} durationInFrames={224}><Scene image="05-gentleness" label="MỆT MỎI CẦN ĐƯỢC CẢM THÔNG">Người thân cũng<br /><span style={{color: GOLD}}>cần sự tử tế.</span></Scene></Sequence>
    <Sequence name="06 · Đừng để họ thu mình" from={1597} durationInFrames={203}><Scene image="06-home" label="KHI BẠN ĐƯỢC TRỞ VỀ LÀ CHÍNH MÌNH">Đừng để<br />người thương<br /><span style={{color: GOLD}}>phải thu mình.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={60 * fps}>
      <Audio name="Quốc Tuấn · Đừng trút giận" src={staticFile('anger-at-home/audio/narration-quoc-tuan-v2-pauses.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={53.95399999999999 * fps}
          durationInFrames={60 * fps}
          volume={angerAtHomeMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
