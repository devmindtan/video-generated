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

const GOLD = '#d8b16c';
const IVORY = '#f4efe6';
const RED = '#a94945';
const BG = '#030405';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SCENE_STARTS = [0, 45, 94, 146, 198, 255];

const SceneFade: React.FC<{readonly seconds: number; readonly children: React.ReactNode}> = ({seconds, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const last = seconds * fps - 1;
  return <AbsoluteFill style={{overflow: 'hidden', background: BG, opacity: interpolate(frame, [0, .7 * fps, last - .65 * fps, last], [0, 1, 1, 0], clamp)}}>{children}</AbsoluteFill>;
};

const Grade = () => <>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(2,3,4,.2), transparent 31%, rgba(2,3,4,.26) 57%, rgba(2,3,4,.93) 100%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 43%, transparent 24%, rgba(0,0,0,.4) 100%)'}} />
</>;

const Atmosphere: React.FC<{readonly color?: string; readonly speed?: number}> = ({color = '#ead19a', speed = .08}) => {
  const frame = useCurrentFrame();
  return <>{Array.from({length: 30}, (_, i) => {
    const x = random(`fouquet-dust-x-${i}`) * 1920 + Math.sin(frame / (35 + i % 7) + i) * 32;
    const y = ((random(`fouquet-dust-y-${i}`) * 900 + frame * (speed + i * .0015)) % 960) - 20;
    const size = 2 + i % 4;
    return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%', background: color, opacity: .04 + Math.sin(frame / 32 + i) ** 2 * .16, boxShadow: `0 0 ${size * 3}px ${color}`}} />;
  })}</>;
};

const ChapterHeader: React.FC<{readonly act: string; readonly title: string; readonly detail?: string}> = ({act, title, detail}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = interpolate(frame, [.55 * fps, 1.65 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return <div style={{position: 'absolute', left: 86, top: 60, maxWidth: 1040, opacity: enter, translate: `${-38 * (1 - enter)}px 0px`, textShadow: '0 4px 22px rgba(0,0,0,.9)'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 15, color: GOLD, fontSize: 21, fontWeight: 700, letterSpacing: 4.2}}><span style={{width: 52, height: 3, background: RED}} />{act}</div>
    <div style={{marginTop: 15, color: IVORY, fontSize: 53, lineHeight: 1.08, fontWeight: 700, letterSpacing: -1.6}}>{title}</div>
    {detail ? <div style={{marginTop: 13, color: 'rgba(244,239,230,.7)', fontSize: 22, letterSpacing: 1.2}}>{detail}</div> : null}
  </div>;
};

const Captions: React.FC<{readonly index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = frame / fps * 1000;
  const caption = (captionsData[index] as Caption[]).find((item) => now >= item.startMs && now < item.endMs);
  if (!caption) return null;
  const highlight = /không có gì sai|năng lực|giá trị|đối thủ|Nicolas Fouquet|mười chín ngày|tù chung thân|không đơn giản|quyền kiểm soát|đe dọa|được tôn trọng|bẽ mặt|cánh cửa phù hợp|mục tiêu|trao đổi riêng|công lao|đừng xóa tên mình|không muốn bạn lớn lên|không cần tắt ánh sáng|nhìn rõ đường đi/gi;
  const parts = caption.text.split(highlight);
  const matches = caption.text.match(highlight) ?? [];
  return <div style={{position: 'absolute', left: 225, right: 225, bottom: 76, minHeight: 82, textAlign: 'center', color: IVORY, fontSize: 43, fontWeight: 700, lineHeight: 1.35, letterSpacing: -.35, textShadow: '0 3px 18px #000, 0 1px 2px #000', opacity: interpolate(now - caption.startMs, [0, 135], [.08, 1], clamp)}}>{parts.map((part, i) => <React.Fragment key={`${part}-${i}`}>{part}{matches[i] && <span style={{color: GOLD}}>{matches[i]}</span>}</React.Fragment>)}</div>;
};

const OpeningScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = interpolate(frame, [0, 45 * fps - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <SceneFade seconds={45}>
    <AbsoluteFill style={{scale: 1.025 + progress * .09, translate: `${-18 + progress * 35}px ${12 - progress * 24}px`, transformOrigin: '68% 45%'}}>
      <CanvasImage src={staticFile('fouquet-power/images/00-meeting-aftermath.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(2,3,4,.7), transparent 61%)'}} />
    <Grade />
    <ChapterHeader act="MỞ · MỘT CẢM GIÁC QUEN THUỘC" title="Mình làm tốt... thì có gì sai?" detail="KHÔNG PHẢI LÚC NÀO VẤN ĐỀ CŨNG NẰM Ở NĂNG LỰC" />
    <Captions index={0} />
  </SceneFade>;
};

const FeastScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = interpolate(frame, [0, 49 * fps - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <SceneFade seconds={49}>
    <AbsoluteFill style={{scale: 1.02 + progress * .1, translate: `${20 - progress * 44}px ${14 - progress * 28}px`, transformOrigin: '60% 43%'}}>
      <CanvasImage src={staticFile('fouquet-power/images/02-vaux-feast.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    {[0, 1, 2].map((i) => {
      const cycle = ((frame / fps + i * 4.1) % 12) / 12;
      const burst = interpolate(cycle, [.63, .69, .92, 1], [0, 1, .3, 0], clamp);
      const size = 28 + cycle * (175 + i * 32);
      return <div key={i} style={{position: 'absolute', right: 120 + i * 135, top: 50 + i * 44, width: size, height: size, borderRadius: '50%', border: `${2 + (1 - cycle) * 3}px dotted rgba(244,190,92,${burst})`, boxShadow: `0 0 28px rgba(242,164,60,${burst * .46})`, opacity: burst}} />;
    })}
    <Atmosphere color="#f4c66e" speed={.06} /><Grade />
    <ChapterHeader act="THÂN · CÂU CHUYỆN NICOLAS FOUQUET" title="Một đêm huy hoàng. Một cái giá kéo dài cả đời." detail="VAUX-LE-VICOMTE · 17.08.1661" />
    <Captions index={1} />
  </SceneFade>;
};

const HistoryScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = interpolate(frame, [0, 52 * fps - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <SceneFade seconds={52}>
    <AbsoluteFill style={{scale: 1.015 + progress * .105, translate: `${-22 + progress * 38}px ${10 - progress * 21}px`, transformOrigin: '52% 48%'}}>
      <CanvasImage src={staticFile('fouquet-power/images/01-empty-throne.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <div style={{position: 'absolute', left: -110 + progress * 150, top: 22, width: 790, height: 650, rotate: '-9deg', background: `linear-gradient(100deg, transparent, rgba(232,221,192,${.075 + Math.sin(frame / 42) * .02}), transparent)`, filter: 'blur(28px)'}} />
    <Atmosphere /><Grade />
    <ChapterHeader act="THÂN · SỰ THẬT SAU GIAI THOẠI" title="Buổi tiệc không phải toàn bộ nguyên nhân." detail="LỊCH SỬ HIẾM KHI CHỈ CÓ MỘT LÝ DO" />
    <Captions index={2} />
  </SceneFade>;
};

const PsychologyScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = interpolate(frame, [0, 52 * fps - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const question = interpolate(frame, [24 * fps, 25.2 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return <SceneFade seconds={52}>
    <AbsoluteFill style={{scale: 1.025 + progress * .105, translate: `${-38 + progress * 72}px ${18 - progress * 32}px`, transformOrigin: '50% 51%'}}>
      <CanvasImage src={staticFile('fouquet-power/images/03-chessboard.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: -650 + ((frame * (.25 + i * .035) + i * 560) % 2660), top: 365 + i * 92, width: 830, height: 112, rotate: '-4deg', background: 'radial-gradient(ellipse, rgba(215,220,218,.17), transparent 70%)', filter: 'blur(31px)', opacity: .2 - i * .04}} />)}
    <Grade />
    <ChapterHeader act="THÂN · TÂM LÝ PHÒNG THỦ" title="Con người không chỉ nghe điều bạn nói." />
    <div style={{position: 'absolute', left: 500, right: 500, top: 450, display: 'flex', justifyContent: 'center', gap: 18, opacity: question, translate: `0px ${25 * (1 - question)}px`}}>
      <div style={{padding: '14px 20px', color: IVORY, fontSize: 22, fontWeight: 700, letterSpacing: 1.8, background: 'rgba(3,4,5,.66)', border: `1px solid ${GOLD}`}}>ĐANG GIÚP MÌNH?</div>
      <div style={{padding: '14px 20px', color: IVORY, fontSize: 22, fontWeight: 700, letterSpacing: 1.8, background: 'rgba(3,4,5,.66)', border: `1px solid ${RED}`}}>HAY ĐANG HẠ THẤP MÌNH?</div>
    </div>
    <Captions index={3} />
  </SceneFade>;
};

const PracticalScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = interpolate(frame, [0, 57 * fps - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const principles = ['BẮT ĐẦU TỪ MỤC TIÊU CHUNG', 'GÓP Ý MÀ KHÔNG HẠ THẤP', 'CHỌN TRAO ĐỔI RIÊNG KHI CẦN', 'CHIA CÔNG LAO · GIỮ DẤU ĐÓNG GÓP'];
  return <SceneFade seconds={57}>
    <AbsoluteFill style={{scale: 1.02 + progress * .105, translate: `${-18 + progress * 31}px ${14 - progress * 25}px`, transformOrigin: '62% 40%'}}>
      <CanvasImage src={staticFile('fouquet-power/images/04-council.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(3,4,5,.46), transparent 59%)'}} />
    <Grade />
    <ChapterHeader act="THÂN · CÁCH ĐỂ ĐƯỢC LẮNG NGHE" title="Không cần nhỏ lại. Chỉ cần nói đúng cách." />
    <div style={{position: 'absolute', left: 88, top: 342, display: 'flex', flexDirection: 'column', gap: 12}}>{principles.map((item, i) => {
      const show = interpolate(frame, [(7 + i * 11.5) * fps, (8 + i * 11.5) * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
      return <div key={item} style={{display: 'flex', alignItems: 'center', gap: 15, opacity: show, translate: `${-25 * (1 - show)}px 0px`, color: IVORY, fontSize: 20, letterSpacing: 1.9, fontWeight: 700, padding: '12px 18px', background: 'rgba(3,4,5,.6)', borderLeft: `3px solid ${GOLD}`, backdropFilter: 'blur(9px)'}}>{String(i + 1).padStart(2, '0')} · {item}</div>;
    })}</div>
    <Captions index={4} />
  </SceneFade>;
};

const ClosingScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = interpolate(frame, [0, 38 * fps - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const finalMessage = interpolate(frame, [27.5 * fps, 29 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return <SceneFade seconds={38}>
    <AbsoluteFill style={{scale: 1.13 - progress * .105, translate: `${32 - progress * 42}px ${-10 + progress * 18}px`, transformOrigin: '68% 42%'}}>
      <CanvasImage src={staticFile('fouquet-power/images/05-strategist.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
    {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: -760 + ((frame * (.34 + i * .04) + i * 590) % 2850), top: 560 + i * 76, width: 1100, height: 125, background: 'radial-gradient(ellipse, rgba(206,221,229,.21), transparent 70%)', filter: 'blur(36px)', opacity: .17 - i * .035}} />)}
    <Grade />
    <div style={{opacity: interpolate(frame, [24.5 * fps, 26.5 * fps], [1, 0], clamp)}}>
      <ChapterHeader act="KẾT · BIẾT MÌNH ĐANG Ở ĐÂU" title="Có những nơi không muốn bạn lớn lên." />
    </div>
    <div style={{position: 'absolute', left: 175, right: 175, top: 425, textAlign: 'center', opacity: finalMessage, translate: `0px ${28 * (1 - finalMessage)}px`, color: IVORY, fontSize: 57, lineHeight: 1.18, fontWeight: 700, letterSpacing: -1.5, textShadow: '0 5px 30px #000'}}>Đừng tắt ánh sáng của mình.<br /><span style={{color: GOLD}}>Hãy đặt nó đúng chỗ.</span></div>
    <Captions index={5} />
    <div style={{position: 'absolute', right: 86, bottom: 34, color: GOLD, fontSize: 17, letterSpacing: 3.2, opacity: interpolate(frame, [33 * fps, 34.5 * fps], [0, 1], clamp)}}>TÂM LÝ CUỘC SỐNG</div>
  </SceneFade>;
};

export const fouquetPowerMusicVolume = (frame: number, fps: number): number => {
  const seconds = frame / fps;
  const activity = Math.max(0, ...captionsData.flatMap((group, sceneIndex) => group.map((caption) => {
    const start = SCENE_STARTS[sceneIndex] + caption.startMs / 1000;
    const end = SCENE_STARTS[sceneIndex] + caption.endMs / 1000;
    return interpolate(seconds, [start - .2, start + .16, end - .14, end + .34], [0, 1, 1, 0], clamp);
  })));
  const base = musicConfig.pauseVolume - (musicConfig.pauseVolume - musicConfig.speechVolume) * activity;
  const fadeIn = interpolate(seconds, [0, musicConfig.fadeInSeconds], [0, 1], clamp);
  const lift = interpolate(seconds, [musicConfig.finalLiftStartSeconds, musicConfig.finalLiftPeakSeconds], [base, musicConfig.finalLiftVolume], clamp);
  const fadeOut = interpolate(seconds, [musicConfig.videoEndSeconds - musicConfig.fadeOutSeconds, musicConfig.videoEndSeconds - 1 / fps], [1, 0], clamp);
  return lift * Math.min(fadeIn, fadeOut);
};

export const FouquetPowerVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <AbsoluteFill style={{background: BG, color: IVORY, fontFamily: 'Stoic Sans, sans-serif'}}>
    <Track name="Mở · Thân · Kết · 293 giây">
      <Sequence name="Mở · Cảm giác sau cuộc họp" from={0} durationInFrames={45 * fps}><OpeningScene /></Sequence>
      <Sequence name="Thân 1 · Đại tiệc Vaux-le-Vicomte" from={45 * fps} durationInFrames={49 * fps}><FeastScene /></Sequence>
      <Sequence name="Thân 2 · Sự thật sau giai thoại" from={94 * fps} durationInFrames={52 * fps}><HistoryScene /></Sequence>
      <Sequence name="Thân 3 · Tâm lý phòng thủ" from={146 * fps} durationInFrames={52 * fps}><PsychologyScene /></Sequence>
      <Sequence name="Thân 4 · Cách nói để được lắng nghe" from={198 * fps} durationInFrames={57 * fps}><PracticalScene /></Sequence>
      <Sequence name="Kết · Đặt ánh sáng đúng chỗ" from={255 * fps} durationInFrames={38 * fps}><ClosingScene /></Sequence>
    </Track>
    <Track name="Lời đọc · Thiện Minh · Nhịp chậm">
      <Audio from={0} durationInFrames={45 * fps} src={staticFile('fouquet-power/audio/01-opening-question-voice-full.wav')} />
      <Audio from={45 * fps} durationInFrames={49 * fps} src={staticFile('fouquet-power/audio/02-vaux-story-voice-full.wav')} />
      <Audio from={94 * fps} durationInFrames={52 * fps} src={staticFile('fouquet-power/audio/03-history-nuance-voice-full.wav')} />
      <Audio from={146 * fps} durationInFrames={52 * fps} src={staticFile('fouquet-power/audio/04-power-psychology-voice-full.wav')} />
      <Audio from={198 * fps} durationInFrames={57 * fps} src={staticFile('fouquet-power/audio/05-practical-path-voice-full.wav')} />
      <Audio from={255 * fps} durationInFrames={38 * fps} src={staticFile('fouquet-power/audio/06-closing-light-voice-full.wav')} />
    </Track>
    <Audio
      name={`${musicConfig.file} · ${musicConfig.sourceStartSeconds}s–${musicConfig.sourceEndSeconds}s · ${musicConfig.playbackRate}x`}
      src={staticFile(musicConfig.file)}
      trimBefore={musicConfig.sourceStartSeconds * fps}
      durationInFrames={293 * fps}
      playbackRate={musicConfig.playbackRate}
      toneFrequency={musicConfig.toneFrequency}
      fallbackHtml5AudioProps={{preservePitch: musicConfig.preservePitch}}
      volume={fouquetPowerMusicVolume(frame, fps)}
    />
  </AbsoluteFill>;
};
