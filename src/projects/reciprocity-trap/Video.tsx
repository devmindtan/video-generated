import React from 'react';
import {Audio} from '@remotion/media';
import type {Caption} from '@remotion/captions';
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Sequence,
  Track,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import '../../shared/stoic-fonts';
import captionsData from './captions.json';
import musicConfig from './music.json';

const GOLD = '#dfb971';
const RED = '#b8534f';
const IVORY = '#f5f0e7';
const BG = '#020304';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 8, 19, 31, 41];

const SceneFade: React.FC<{readonly seconds: number; readonly children: React.ReactNode}> = ({seconds, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  const opacity = interpolate(frame, [0, .15 * fps, last - .14 * fps, last], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{overflow: 'hidden', background: BG, opacity}}>{children}</AbsoluteFill>;
};

const Grade = () => <>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(2,3,4,.02), transparent 31%, rgba(2,3,4,.45) 57%, #020304 93%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 29%, transparent 18%, rgba(0,0,0,.42) 100%)'}} />
</>;

const Dust: React.FC<{readonly warm?: boolean}> = ({warm = true}) => {
  const frame = useCurrentFrame();
  return <>{Array.from({length: 18}, (_, i) => {
    const x = 55 + random(`reciprocity-x-${i}`) * 970 + Math.sin(frame / (18 + i % 5) + i) * 20;
    const y = 80 + ((random(`reciprocity-y-${i}`) * 1000 + frame * (.22 + i * .011)) % 1100);
    const size = 3 + i % 4;
    return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%', background: warm ? '#efd49d' : '#d9e2e7', opacity: .08 + Math.sin(frame / 17 + i) ** 2 * .21, boxShadow: `0 0 ${size * 2}px rgba(225,187,113,.45)`}} />;
  })}</>;
};

const Heading: React.FC<{readonly eyebrow: string; readonly top?: number; readonly children: React.ReactNode}> = ({eyebrow, top = 1050, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = interpolate(frame, [.04 * fps, .55 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return <div style={{position: 'absolute', left: 82, right: 72, top, opacity: enter, translate: `${-48 * (1 - enter)}px 0px`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 17, marginBottom: 22, color: GOLD, fontSize: 22, letterSpacing: 3.5, fontWeight: 550}}><span style={{width: 48, height: 3, background: RED}} />{eyebrow}</div>
    <div style={{fontSize: 78, fontWeight: 760, lineHeight: 1.1, letterSpacing: -3, textShadow: '0 7px 34px rgba(0,0,0,.96)'}}>{children}</div>
  </div>;
};

const Captions: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const caption = (captionsData[index] as Caption[]).find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;
  const highlighted = /không thể đồng ý|đừng đồng ý ngay|một chút thời gian|mình trân trọng|miễn phí|khó nói|không|vô ơn|mắc nợ|sợi dây|lòng trung thành|ranh giới|bình yên|ép buộc|từ chối|giới hạn|lòng tốt thật sự|đánh mất mình/gi;
  const parts = caption.text.split(highlighted);
  const matches = caption.text.match(highlighted) ?? [];
  return <div style={{position: 'absolute', left: 82, right: 72, top: 1430, minHeight: 166, color: IVORY, fontSize: 43, fontWeight: 720, lineHeight: 1.42, textShadow: '0 3px 19px #000', opacity: interpolate(now - caption.startMs, [0, 105], [.08, 1], clamp)}}>{parts.map((part, i) => <React.Fragment key={`${part}-${i}`}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}</div>;
};

const AppleScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = interpolate(frame, [2.25 * fps, 5.05 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const glint = interpolate(frame, [4.2 * fps, 4.75 * fps, 5.35 * fps], [0, 1, 0], clamp);
  const push = interpolate(frame, [0, 8 * fps - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <SceneFade seconds={8}>
    <AbsoluteFill style={{opacity: 1 - reveal, scale: 1.025 + push * .09, translate: `${-10 + push * 20}px ${12 - push * 46}px`, transformOrigin: '50% 29%'}}>
      <CanvasImage src={staticFile('reciprocity-trap/images/01-apple-intact.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{opacity: reveal, scale: 1.11 - reveal * .025 + push * .035, translate: `${18 - reveal * 12}px ${-30 + reveal * 8}px`, transformOrigin: '50% 29%'}}>
      <CanvasImage src={staticFile('reciprocity-trap/images/01-apple-hooks.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <div style={{position: 'absolute', left: 548, top: 405, width: 9, height: 250, rotate: '24deg', background: 'linear-gradient(180deg, transparent, #fff5ce, transparent)', filter: 'blur(2px)', opacity: glint * .7, boxShadow: '0 0 22px rgba(255,218,151,.8)'}} />
    <Dust /><Grade />
    <Heading eyebrow="BẪY MANG ƠN" top={1055}>Có món quà khiến bạn<br /><span style={{color: GOLD}}>khó nói “không”.</span></Heading>
    <Captions index={0} />
  </SceneFade>;
};

const PuppetScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pull = interpolate(frame, [1.4 * fps, 6.7 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <SceneFade seconds={11}>
    <AbsoluteFill style={{scale: 1.025 + pull * .13, translate: `${18 - pull * 32}px ${28 - pull * 84}px`, rotate: `${-.7 * pull}deg`, transformOrigin: '66% 25%'}}>
      <CanvasImage src={staticFile('reciprocity-trap/images/02-puppet.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <div style={{position: 'absolute', left: 690, top: 205, width: 245, height: 245, borderRadius: '50%', background: `radial-gradient(circle, rgba(244,192,83,${.06 + pull * .14}), transparent 67%)`, filter: 'blur(12px)', scale: `${.72 + pull * .38}`}} />
    <Dust warm={false} /><Grade />
    <Heading eyebrow="KHI BIẾT ƠN BỊ LỢI DỤNG" top={1050}>Bạn nhận một lần.<br /><span style={{color: RED}}>Họ kéo bạn đi.</span></Heading>
    <Captions index={1} />
  </SceneFade>;
};

const ScaleScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tip = interpolate(frame, [3.15 * fps, 3.95 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <SceneFade seconds={12}>
    <AbsoluteFill style={{opacity: 1 - tip, scale: 1.02 + tip * .03, translate: '0px 12px'}}>
      <CanvasImage src={staticFile('reciprocity-trap/images/03-scale-balanced.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{opacity: tip, scale: 1.075 + tip * .035, translate: `${20 - tip * 36}px ${-24 + tip * 12}px`, transformOrigin: '50% 30%'}}>
      <CanvasImage src={staticFile('reciprocity-trap/images/03-scale-tipped.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <Dust /><Grade />
    <Heading eyebrow="RANH GIỚI CẦN NHỚ" top={1050}>Biết ơn không có nghĩa<br /><span style={{color: GOLD}}>là phải mắc nợ.</span></Heading>
    <Captions index={2} />
  </SceneFade>;
};

const ChaliceScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const refuse = interpolate(frame, [3.55 * fps, 4.45 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const glow = interpolate(frame, [0, 4.5 * fps, 9.8 * fps], [.28, .52, .14], clamp);
  return <SceneFade seconds={10}>
    <AbsoluteFill style={{opacity: 1 - refuse, scale: 1.035 + refuse * .03, translate: `${-12 + refuse * 10}px 6px`, transformOrigin: '56% 28%'}}>
      <CanvasImage src={staticFile('reciprocity-trap/images/04-chalice-near.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{opacity: refuse, scale: 1.08 - refuse * .025, translate: `${28 - refuse * 26}px ${-20 + refuse * 12}px`, transformOrigin: '52% 28%'}}>
      <CanvasImage src={staticFile('reciprocity-trap/images/04-chalice-refused.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <div style={{position: 'absolute', left: 720, top: 330, width: 250, height: 320, borderRadius: '50%', background: `radial-gradient(ellipse, rgba(240,174,60,${glow * (1 - refuse * .62)}), transparent 69%)`, filter: 'blur(22px)'}} />
    <Grade />
    <Heading eyebrow="BẠN LUÔN CÓ QUYỀN" top={1050}>Không cần trả lời ngay.<br /><span style={{color: GOLD}}>Hãy cho mình thời gian.</span></Heading>
    <Captions index={3} />
  </SceneFade>;
};

const ChainsScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const freedom = interpolate(frame, [1.35 * fps, 2.25 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const push = interpolate(frame, [0, 7 * fps - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <SceneFade seconds={7}>
    <AbsoluteFill style={{opacity: 1 - freedom, scale: 1.02 + push * .09, translate: `0px ${24 - push * 58}px`, transformOrigin: '50% 23%'}}>
      <CanvasImage src={staticFile('reciprocity-trap/images/05-intact-chain.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{opacity: freedom, scale: 1.09 + push * .06, translate: `0px ${-18 - push * 42}px`, transformOrigin: '50% 23%'}}>
      <CanvasImage src={staticFile('reciprocity-trap/images/05-broken-chains.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <Dust /><Grade />
    <Heading eyebrow="LÒNG TỐT THẬT SỰ" top={1050}>Luôn tôn trọng<br /><span style={{color: GOLD}}>câu “không”.</span></Heading>
    <Captions index={4} />
    <div style={{position: 'absolute', left: 82, top: 1757, color: GOLD, fontSize: 22, letterSpacing: 3, opacity: interpolate(frame, [4.2 * fps, 4.9 * fps], [0, 1], clamp)}}>THEO DÕI · TÂM LÝ CUỘC SỐNG</div>
  </SceneFade>;
};

export const reciprocityTrapMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captionsData.flatMap((group, sceneIndex) => group.map((caption) => {
    const start = SCENE_STARTS[sceneIndex] + caption.startMs / 1000;
    const end = SCENE_STARTS[sceneIndex] + caption.endMs / 1000;
    return interpolate(seconds, [start - .12, start + .1, end - .1, end + .22], [0, 1, 1, 0], clamp);
  })));
  const base = musicConfig.pauseVolume - (musicConfig.pauseVolume - musicConfig.speechVolume) * activity;
  const fadeIn = interpolate(seconds, [0, musicConfig.fadeInSeconds], [0, 1], clamp);
  const lifted = interpolate(seconds, [musicConfig.finalLiftStartSeconds, musicConfig.finalLiftPeakSeconds], [base, musicConfig.finalLiftVolume], clamp);
  const fadeOut = interpolate(seconds, [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds - 1 / fps], [1, 0], clamp);
  return lifted * Math.min(fadeIn, fadeOut);
};

export const ReciprocityTrapVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: BG, color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Năm cảnh · Bẫy mang ơn · 48 giây">
      <Sequence name="Món quà giấu móc câu" from={0} durationInFrames={8 * fps}><AppleScene /></Sequence>
      <Sequence name="Sợi dây mắc nợ" from={8 * fps} durationInFrames={11 * fps}><PuppetScene /></Sequence>
      <Sequence name="Cán cân bị thao túng" from={19 * fps} durationInFrames={12 * fps}><ScaleScene /></Sequence>
      <Sequence name="Bình tĩnh đặt giới hạn" from={31 * fps} durationInFrames={10 * fps}><ChaliceScene /></Sequence>
      <Sequence name="Lòng tốt tôn trọng lời từ chối" from={41 * fps} durationInFrames={7 * fps}><ChainsScene /></Sequence>
    </Track>
    <Track name="Lời đọc · Thiện Minh · Trầm ấm và rõ ràng">
      <Audio from={0} durationInFrames={8 * fps} src={staticFile('reciprocity-trap/audio/01-apple-voice-full.wav')} />
      <Audio from={8 * fps} durationInFrames={11 * fps} src={staticFile('reciprocity-trap/audio/02-puppet-voice-full.wav')} />
      <Audio from={19 * fps} durationInFrames={12 * fps} src={staticFile('reciprocity-trap/audio/03-scale-voice-full.wav')} />
      <Audio from={31 * fps} durationInFrames={10 * fps} src={staticFile('reciprocity-trap/audio/04-chalice-voice-full.wav')} />
      <Audio from={41 * fps} durationInFrames={7 * fps} src={staticFile('reciprocity-trap/audio/05-chains-voice-full.wav')} />
    </Track>
    <Track name="SFX · Foley nhẹ, gắn với vật thể">
      <Audio
        from={22.05 * fps}
        durationInFrames={1.9 * fps}
        volume={0.2}
        src={staticFile('reciprocity-trap/sfx/brass-scale-shift.wav')}
      />
      <Audio
        from={42.15 * fps}
        durationInFrames={2.15 * fps}
        volume={0.2}
        src={staticFile('reciprocity-trap/sfx/soft-chain-settle.wav')}
      />
    </Track>
    <Audio
      name={`${musicConfig.file} · ${musicConfig.playbackRate.toFixed(2)}× · Giữ nguyên cao độ`}
      src={staticFile(musicConfig.file)}
      trimBefore={musicConfig.sourceStartSeconds * fps}
      durationInFrames={48 * fps}
      playbackRate={musicConfig.playbackRate}
      toneFrequency={musicConfig.toneFrequency}
      fallbackHtml5AudioProps={{preservePitch: musicConfig.preservePitch}}
      volume={reciprocityTrapMusicVolume(frame, fps)}
    />
  </AbsoluteFill>;
};
