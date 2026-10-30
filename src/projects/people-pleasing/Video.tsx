import type {FC, ReactNode} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, CanvasImage, Sequence, Track, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import captionsData from './captions.json';
import music from './music.json';

const ACCENT = '#b8c9f4';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const captions = captionsData as Caption[][];
const starts = [0, 8, 18, 28, 38];

export const peoplePleasingMusicVolume = (frame: number, fps: number) => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captions.flatMap((group, i) => group.map((c) => {
    const a = starts[i] + c.startMs / 1000;
    const b = starts[i] + c.endMs / 1000;
    return interpolate(seconds, [a - .1, a, b, b + .2], [0, 1, 1, 0], clamp);
  })));
  return music.pauseVolume - (music.pauseVolume - music.speechVolume) * activity;
};

const Scene: FC<{index: number; image: string; label: string; children: ReactNode}> = ({index, image, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = captions[index]?.find((c) => frame * 1000 / fps >= c.startMs && frame * 1000 / fps < c.endMs);
  const captionParts = page?.text.split(/(không nhận thêm việc|luôn đồng ý|làm vừa lòng|bỏ mặc mình|được thôi|từ chối|quá tải|lòng tốt|thất vọng|giới hạn|lịch sự|dứt khoát|ích kỷ|lựa chọn|tử tế)/gi) ?? [];
  return <AbsoluteFill style={{background: '#07080e', overflow: 'hidden', opacity: index === 0 ? 1 : interpolate(frame, [0, .16 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`people-pleasing/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    {index < 2 ? <div style={{position: 'absolute', top: 190, left: 560, width: 460, height: 650, background: 'radial-gradient(ellipse, rgba(131,134,222,.08), transparent 68%)', opacity: .7 + Math.sin(frame / fps * .8) * .08}} /> : null}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,5,11,.08) 20%, transparent 35%, rgba(4,5,11,.9) 65%, #07080e 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, fontSize: 24, letterSpacing: 4, color: '#dcb777'}}>STOIC · GIỮ LẤY GIỚI HẠN</div>
    <div style={{position: 'absolute', top: 1060, left: 84, right: 120}}>
      <div style={{color: ACCENT, fontSize: 24, letterSpacing: 3, marginBottom: 22}}>{label}</div>
      <div style={{color: '#f2ede3', fontSize: 88, fontWeight: 700, lineHeight: 1.14, letterSpacing: -2}}>{children}</div>
      <div style={{marginTop: 30, width: 100, height: 3, background: ACCENT}} />
    </div>
    <div data-testid="people-pleasing-caption" style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontSize: 44, fontWeight: 700, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>
      <div style={{width: '100%'}}>{captionParts.map((part, i) => <span key={i} style={{color: i % 2 === 1 ? '#dcb777' : undefined}}>{part}</span>)}</div>
    </div>
    {index === 4 ? <div style={{position: 'absolute', top: 1750, left: 84, fontSize: 23, letterSpacing: 2, color: ACCENT, opacity: interpolate(frame, [5 * fps, 6 * fps], [0, 1], clamp)}}>GIỮ GIỚI HẠN · GIỮ SỰ TÔN TRỌNG</div> : null}
  </AbsoluteFill>;
};

export const PeoplePleasingVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#07080e', fontFamily: 'Stoic Sans, sans-serif'}}>
    {/* Stable stills with short overlaps. No Gemini/Veo or fabricated action. */}
    <Sequence name="01 · Miệng đồng ý, lòng từ chối" from={0} durationInFrames={Math.round(8.2 * fps)}><Scene index={0} image="01-mask" label="ĐÃ QUÁ SỨC, VẪN NHẬN LỜI">Miệng nói “được”.<br /><span style={{color: ACCENT}}>Trong lòng “không”.</span></Scene></Sequence>
    <Sequence name="02 · Sợ làm người khác thất vọng" from={8 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={1} image="02-collar" label="ĐỒNG Ý VÌ MUỐN — HAY VÌ SỢ?">Một lời khen.<br /><span style={{color: ACCENT}}>Đổi cả buổi tối.</span></Scene></Sequence>
    <Sequence name="03 · Nói rõ giới hạn" from={18 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={2} image="03-silk" label="GIỚI HẠN KHÔNG TỰ ĐƯỢC HIỂU">Bạn im lặng.<br /><span style={{color: ACCENT}}>Họ tưởng bạn ổn.</span></Scene></Sequence>
    <Sequence name="04 · Từ chối cụ thể" from={28 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={3} image="04-gate" label="LỊCH SỰ. RÕ RÀNG. DỨT KHOÁT.">“Hôm nay tôi<br /><span style={{color: ACCENT}}>không nhận thêm.”</span></Scene></Sequence>
    <Sequence name="05 · Tử tế có giới hạn" from={38 * fps} durationInFrames={10 * fps}><Scene index={4} image="05-spotlight" label="KHÔNG CẦN LÀM VỪA LÒNG TẤT CẢ">Tử tế.<br />Không phải<br /><span style={{color: ACCENT}}>luôn nói “có”.</span></Scene></Sequence>
    <Track name="Hải Đăng · Dứt khoát · Tốc độ gốc 1×">
      <Audio
        from={0}
        durationInFrames={8 * fps}
        src={staticFile('people-pleasing/audio/01-mask-voice-full.wav')}
        volume={1.1}
      />
      <Audio
        from={8 * fps}
        durationInFrames={10 * fps}
        src={staticFile('people-pleasing/audio/02-collar-voice-full.wav')}
        volume={1.1}
      />
      <Audio
        from={18 * fps}
        durationInFrames={10 * fps}
        src={staticFile('people-pleasing/audio/03-silk-voice-full.wav')}
        volume={1.1}
      />
      <Audio
        from={28 * fps}
        durationInFrames={10 * fps}
        src={staticFile('people-pleasing/audio/04-gate-voice-full.wav')}
        volume={1.1}
      />
      <Audio
        from={38 * fps}
        durationInFrames={10 * fps}
        src={staticFile('people-pleasing/audio/05-spotlight-voice-full.wav')}
        volume={1.1}
      />
    </Track>
    <Track name="Snowfall · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Snowfall · Chỉnh trực tiếp trong Edit"
          src={staticFile('own-timeline/audio/snowfall.mp3')}
          from={0}
          trimBefore={24.9 * fps}
          durationInFrames={48 * fps}
          playbackRate={0.85}
          volume={peoplePleasingMusicVolume(frame, fps)}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
