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

export const restDayMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.map((c) => interpolate(seconds,
    [c.startMs / 1000 - .1, c.startMs / 1000, c.endMs / 1000, c.endMs / 1000 + .2], [0, 1, 1, 0], clamp)));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{image: string; first?: boolean; label: string; children: ReactNode}> = ({image, first, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', overflow: 'hidden', opacity: first ? 1 : interpolate(frame, [0, .2 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`rest-day/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.92) 65%, #06090d 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, color: GOLD, fontSize: 24, letterSpacing: 4}}>STOIC · MỘT NGÀY NGHỈ</div>
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
  const captionParts = page?.text.split(/(ngày nghỉ|chưa làm|lãng phí|thời gian|giá trị|kết quả|vô dụng|quá mệt|ba lần|không hiểu|làm sai|sửa lại|trả giá|không chịu nghỉ|nghỉ ngơi|sức lực|tập trung|dang dở|người thân|được nghỉ|kiệt sức|chăm sóc|không còn sức)/gi) ?? [];
  return <div data-testid="rest-day-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
    <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
  </div>;
};

export const RestDayVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090d', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
    <Sequence name="01 · Nghỉ mà vẫn áy náy" from={0} durationInFrames={203}><Scene first image="01-unfinished" label="NGÀY NGHỈ MÀ VẪN KHÔNG YÊN">Nằm xuống.<br /><span style={{color: GOLD}}>Vẫn thấy có lỗi.</span></Scene></Sequence>
    <Sequence name="02 · Giá trị không chỉ là kết quả" from={197} durationInFrames={176}><Scene image="02-worth" label="KHI MÌNH CHỈ ĐO BẰNG KẾT QUẢ">Không làm gì.<br /><span style={{color: GOLD}}>Là vô dụng sao?</span></Scene></Sequence>
    <Sequence name="03 · Càng cố càng phải sửa" from={367} durationInFrames={332}><Scene image="03-redo" label="ĐỌC BA LẦN VẪN KHÔNG HIỂU">Thêm giờ làm.<br /><span style={{color: GOLD}}>Thêm giờ sửa.</span></Scene></Sequence>
    <Sequence name="04 · Nghỉ để hồi phục" from={693} durationInFrames={172}><Scene image="04-recover" label="LẤY LẠI SỨC LỰC VÀ TẬP TRUNG">Việc chưa xong.<br /><span style={{color: GOLD}}>Vẫn cần nghỉ.</span></Scene></Sequence>
    <Sequence name="05 · Sao lại đợi kiệt sức" from={859} durationInFrames={213}><Scene image="05-care" label="THƯƠNG NGƯỜI THÂN VẤT VẢ">Còn bản thân?<br /><span style={{color: GOLD}}>Sao cứ bắt cố?</span></Scene></Sequence>
    <Sequence name="06 · Chăm sóc trước khi cạn sức" from={1066} durationInFrames={284}><Scene image="06-no-proof" label="MỘT NGÀY NGHỈ KHÔNG CẦN THÀNH TÍCH">Chăm sóc mình.<br /><span style={{color: GOLD}}>Trước khi cạn sức.</span></Scene></Sequence>
    <Sequence name="Quốc Tuấn + caption · Native 1x" from={0} durationInFrames={45 * fps}>
      <Audio name="Quốc Tuấn · Một ngày nghỉ" src={staticFile('rest-day/audio/narration-quoc-tuan-v3-pauses.wav')} volume={1} />
      <NarrationCaptions />
    </Sequence>
    <Track name="Night · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Night · Chỉnh trực tiếp trong Edit"
          src={staticFile('Ludovico Einaudi - Night (Official Video).mp3')}
          trimBefore={53.95399999999999 * fps}
          durationInFrames={45 * fps}
          volume={restDayMusicVolume(frame, fps)}
          playbackRate={0.79}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
