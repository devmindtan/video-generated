import type {FC, ReactNode} from 'react';
import type {Caption} from '@remotion/captions';
import {Audio} from '@remotion/media';
import {AbsoluteFill, CanvasImage, Sequence, Track, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import {MusicFade} from '../../shared/MusicFade';
import captionsData from './captions.json';
import music from './music.json';
import sfx from './sfx.json';

const ACCENT = '#dcb777';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const captions = captionsData as Caption[][];
const starts = [0, 8, 18, 28, 38];

const speechActivity = (frame: number, fps: number) => {
  const seconds = frame / fps;
  return Math.max(0, ...captions.flatMap((group, i) => group.map((c) => {
    const a = starts[i] + c.startMs / 1000;
    const b = starts[i] + c.endMs / 1000;
    return interpolate(seconds, [a - .1, a, b, b + .2], [0, 1, 1, 0], clamp);
  })));
};

export const rightAdviceMusicVolume = (frame: number, fps: number) =>
  music.pauseVolume - (music.pauseVolume - music.speechVolume) * speechActivity(frame, fps);

export const rightAdviceSfxBedVolume = (frame: number, fps: number, level: number) =>
  sfx.masterVolume * level * (1 - sfx.bedSpeechDuck * speechActivity(frame, fps));

const Atmosphere: FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (index === 0) return <div style={{position: 'absolute', top: 470, left: -180, width: 1440, height: 500, background: 'radial-gradient(ellipse, rgba(170,186,193,.13), transparent 65%)', translate: `${Math.sin(t / 5) * 65}px 0px`}} />;
  if (index === 1) return <>{Array.from({length: 14}, (_, i) => <div key={i} style={{position: 'absolute', left: 160 + random(`advice-dust-x-${i}`) * 700, top: 180 + (random(`advice-dust-y-${i}`) * 700 + t * 5) % 700, width: 3, height: 3, borderRadius: '50%', background: '#e8d3a7', opacity: .14}} />)}</>;
  return null;
};

const Scene: FC<{index: number; image: string; label: string; children: ReactNode}> = ({index, image, label, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = captions[index]?.find((c) => frame * 1000 / fps >= c.startMs && frame * 1000 / fps < c.endMs);
  return <AbsoluteFill style={{background: '#06090c', overflow: 'hidden', opacity: index === 0 ? 1 : interpolate(frame, [0, .16 * fps], [0, 1], clamp)}}>
    <CanvasImage src={staticFile(`right-advice/images/${image}.png`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <Atmosphere index={index} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,9,.08) 20%, transparent 35%, rgba(3,6,9,.88) 65%, #06090c 96%)'}} />
    <div style={{position: 'absolute', top: 110, left: 84, fontSize: 24, letterSpacing: 4, color: ACCENT}}>STOIC · GÓC NHÌN KHÁC</div>
    <div style={{position: 'absolute', top: 1060, left: 84, right: 120}}>
      <div style={{color: ACCENT, fontSize: 24, letterSpacing: 3, marginBottom: 22}}>{label}</div>
      <div style={{color: '#f2ede3', fontSize: 88, fontWeight: 750, lineHeight: 1.14, letterSpacing: -2}}>{children}</div>
      <div style={{marginTop: 30, width: 100, height: 3, background: ACCENT}} />
    </div>
    <div style={{position: 'absolute', top: 1520, left: 88, right: 128, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f2ede3', fontSize: 44, fontWeight: 500, lineHeight: 1.4, textAlign: 'center', textShadow: '0 3px 15px #000'}}>{page?.text}</div>
    {index === 4 ? <div style={{position: 'absolute', top: 1750, left: 84, fontSize: 23, letterSpacing: 2, color: ACCENT, opacity: interpolate(frame, [5 * fps, 6 * fps], [0, 1], clamp)}}>LƯU LẠI · CHỌN ĐIỀU PHÙ HỢP</div> : null}
  </AbsoluteFill>;
};

export const RightAdviceVideo: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: '#06090c', fontFamily: 'Stoic Sans, sans-serif'}}>
    {/* Stable framing; no fake hammer/scale movement or habitual push-ins. */}
    <Sequence name="01 · Kiên trì hay buông bỏ?" from={0} durationInFrames={Math.round(8.2 * fps)}><Scene index={0} image="01-crossroads" label="AI CŨNG CÓ LÝ">Kiên trì?<br />Buông bỏ?<br /><span style={{color: ACCENT}}>Nghe ai?</span></Scene></Sequence>
    <Sequence name="02 · Đúng vấn đề mới có ích" from={8 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={1} image="02-bottles" label="MỘT LỜI KHUYÊN · HAI HOÀN CẢNH">Không phải<br />toa thuốc nào<br /><span style={{color: ACCENT}}>cũng dành cho bạn.</span></Scene></Sequence>
    <Sequence name="03 · Không dùng chung một đáp án" from={18 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={2} image="03-porcelain" label="CỐ THÊM HAY GIẢM TẢI?">Cùng một câu.<br /><span style={{color: ACCENT}}>Khác kết quả.</span></Scene></Sequence>
    <Sequence name="04 · Hỏi đúng câu hỏi" from={28 * fps} durationInFrames={Math.round(10.2 * fps)}><Scene index={3} image="04-balance" label="TRƯỚC KHI LÀM THEO">Đang né việc khó?<br /><span style={{color: ACCENT}}>Hay đã quá tải?</span></Scene></Sequence>
    <Sequence name="05 · Chọn theo hoàn cảnh" from={38 * fps} durationInFrames={10 * fps}><Scene index={4} image="05-reflection" label="ĐỪNG CHỈ CHỌN CÂU NGHE HAY">Hiểu hoàn cảnh.<br /><span style={{color: ACCENT}}>Rồi chọn lời khuyên.</span></Scene></Sequence>
    <Track name="Hải Đăng · Sắc, thực tế · Tốc độ gốc 1×">
      <Audio
        from={0}
        durationInFrames={8 * fps}
        src={staticFile('right-advice/audio/01-crossroads-voice-full.wav')}
      />
      <Audio from={8 * fps} durationInFrames={10 * fps} src={staticFile('right-advice/audio/02-bottles-voice-full.wav')} />
      <Audio from={18 * fps} durationInFrames={10 * fps} src={staticFile('right-advice/audio/03-porcelain-voice-full.wav')} />
      <Audio from={28 * fps} durationInFrames={10 * fps} src={staticFile('right-advice/audio/04-balance-voice-full.wav')} />
      <Audio from={38 * fps} durationInFrames={10 * fps} src={staticFile('right-advice/audio/05-reflection-voice-full.wav')} />
    </Track>
    {sfx.enabled ? <>
      <Track name="SFX v2 · Ngoại cảnh → khoảng thoáng">
        <Audio name="Kết · Không gian mở rồi rút về yên" from={37.7 * fps} durationInFrames={3.8 * fps} src={staticFile('right-advice/audio/sound-v2/clearing-air.wav')} volume={rightAdviceSfxBedVolume(frame, fps, sfx.clearingVolume)} />
      </Track>
      <Track name="SFX v2 · Không gian gần → lắng xuống">
        <Audio name="Kệ lọ · Không gian kín" from={7.7 * fps} durationInFrames={20.5 * fps} src={staticFile('right-advice/audio/sound-v2/shelf-room.wav')} volume={rightAdviceSfxBedVolume(frame, fps, sfx.roomVolume)} />
        <Audio
          name="Cân · Nền thu hẹp"
          from={28.233333333333334 * fps}
          durationInFrames={9.8 * fps}
          src={staticFile('right-advice/audio/sound-v2/balance-room.wav')}
          volume={rightAdviceSfxBedVolume(frame, fps, sfx.balanceRoomVolume)}
        />
      </Track>
      <Track name="SFX v2 · Gỗ, thủy tinh, gốm, đồng">
        <Audio name="Biển gỗ · Rít và nhả lực" from={0.8 * fps} durationInFrames={6.4 * fps} src={staticFile('right-advice/audio/sound-v2/wood-strain.wav')} volume={sfx.masterVolume * sfx.woodVolume} />
        <Audio name="Lọ · Chạm kính trên nền gỗ" from={7.9 * fps} durationInFrames={2.4 * fps} src={staticFile('right-advice/audio/sound-v2/bottle-contact.wav')} volume={sfx.masterVolume * sfx.bottleVolume} />
        <Audio name="Chén · Lực gõ, nứt, mảnh sứ lắng" from={17.966666666666665 * fps} durationInFrames={2.2 * fps} src={staticFile('right-advice/audio/sound-v2/porcelain-break.wav')} volume={sfx.masterVolume * sfx.porcelainVolume} />
        <Audio name="Cân · Trục, xích và đĩa đồng dừng lại" from={28.066666666666666 * fps} durationInFrames={3 * fps} src={staticFile('right-advice/audio/sound-v2/brass-mechanism.wav')} volume={sfx.masterVolume * sfx.brassVolume} />
      </Track>
    </> : null}
    <Track name="Nhạc nền · Chỉnh đầu/cuối trong Edit">
      <MusicFade fadeInSeconds={music.fadeInSeconds} fadeOutSeconds={music.fadeOutSeconds}>
        <Audio
          name="Experience · Reverb · Chỉnh trực tiếp trong Edit"
          src={staticFile('single-task/audio/experience-reverb-full.wav')}
          from={0}
          trimBefore={85 * fps}
          durationInFrames={48 * fps}
          playbackRate={0.85}
          volume={rightAdviceMusicVolume(frame, fps)}
        />
      </MusicFade>
    </Track>
  </AbsoluteFill>;
};
