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

export const apologyChangeMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`apology-change/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · XIN LỖI VÀ THAY ĐỔI</div>
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
  const captionParts = page?.text.split(/(lần đầu|xin lỗi|tin|thay đổi|vẫn chuyện ấy|tổn thương|không cố ý|mệt|lỗi lầm|thất vọng|lạnh nhạt|ít nói|tranh luận|nói hết|lần trước|ý nghĩa|lần sau|hành động|như cũ|tha thứ|giữ một người|hối hận|chịu lại|đủ nhiều|ở bên|chuyện cũ|lặp lại)/gi) ?? [];
  return <div data-testid="apology-change-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const ApologyChangeVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Còn tin lời xin lỗi" from={0} durationInFrames={205}><Scene first image="01-belief" label="LẦN ĐẦU, NGƯỜI TA TIN BẠN ĐÃ HIỂU">Xin lỗi lần đầu.<br /><span style={{color: GOLD}}>Người ta còn tin.</span></Scene></Sequence>
    <Sequence name="02 · Cùng một tổn thương" from={199} durationInFrames={170}><Scene image="02-repeat" label="RỒI MỌI CHUYỆN LẠI NHƯ CŨ">Vẫn chuyện ấy.<br /><span style={{color: GOLD}}>Vẫn họ đau.</span></Scene></Sequence>
    <Sequence name="03 · Mỏi mệt vì tin" from={363} durationInFrames={253}><Scene image="03-eroding" label="ĐIỀU KHIẾN HỌ MỆT">Mỗi lần tin.<br /><span style={{color: GOLD}}>Một lần thất vọng.</span></Scene></Sequence>
    <Sequence name="04 · Đã nói hết từ trước" from={610} durationInFrames={246}><Scene image="04-silence" label="HỌ KHÔNG CÒN MUỐN TRANH LUẬN">Họ ít nói đi.<br /><span style={{color: GOLD}}>Không phải hết đau.</span></Scene></Sequence>
    <Sequence name="05 · Lần sau phải khác" from={850} durationInFrames={210}><Scene image="05-action" label="Ý NGHĨA NẰM Ở HÀNH ĐỘNG">Lời xin lỗi.<br /><span style={{color: GOLD}}>Cần sự thay đổi.</span></Scene></Sequence>
    <Sequence name="06 · Cho họ thấy thay đổi" from={1054} durationInFrames={296}><Scene image="06-different" label="NIỀM TIN SAU LỜI XIN LỖI">Đừng để họ<br /><span style={{color: GOLD}}>hối hận vì đã tin.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={45 * fps}>
      <Audio name="Quốc Tuấn · Xin lỗi và thay đổi" src={staticFile('apology-change/audio/narration-quoc-tuan-v3-ending.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={53.95399999999999 * fps}
          durationInFrames={45 * fps}
          volume={apologyChangeMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
