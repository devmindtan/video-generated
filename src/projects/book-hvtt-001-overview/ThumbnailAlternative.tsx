import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export type ThumbnailAlternativeSpec = {
  messageLines: [string, string];
  colors: {background: string; primary: string; accent: string};
  hasOutlineOrShadow: boolean;
  textWidthRatio: number;
  minFontSize: number;
  fullBleed: boolean;
  concreteSituation: string;
  scene: 'seated-book' | 'doorway-step';
  bookCover?: string;
};

const GOLD = '#F4B942';

const SeatedBook: FC = () => <svg aria-label="Một người ngồi bệt bên cuốn sách" viewBox="0 0 1280 720" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
  <defs>
    <linearGradient id="room-light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#111923" /><stop offset="1" stopColor="#040609" /></linearGradient>
    <radialGradient id="subject-light"><stop offset="0" stopColor="#efbd59" stopOpacity=".34" /><stop offset="1" stopColor="#efbd59" stopOpacity="0" /></radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#room-light)" />
  <ellipse cx="1010" cy="378" rx="320" ry="360" fill="url(#subject-light)" />
  <path d="M704 620H1280V720H664Z" fill="#090d11" />
  <ellipse cx="1014" cy="686" rx="292" ry="40" fill="#020304" opacity=".85" />
  <circle cx="1014" cy="235" r="96" fill="#26313b" stroke="#72592e" strokeWidth="6" />
  <path d="M923 220C942 142 1038 115 1101 177C1063 166 1018 176 985 207C961 230 951 257 951 286C928 268 916 244 923 220Z" fill="#070a0d" />
  <path d="M952 326C900 378 882 488 905 604L1116 610C1142 476 1114 375 1068 324C1031 344 991 344 952 326Z" fill="#293642" stroke="#596672" strokeWidth="6" />
  <path d="M930 410C862 460 816 524 780 602M1080 410C1138 465 1176 526 1200 600" fill="none" stroke="#293642" strokeWidth="54" strokeLinecap="round" />
  <path d="M938 598C875 624 828 656 790 704M1080 600C1129 630 1167 663 1197 704" fill="none" stroke="#1c252d" strokeWidth="72" strokeLinecap="round" />
  <path d="M742 654H1244" stroke={GOLD} strokeOpacity=".48" strokeWidth="5" />
</svg>;

const DoorwayStep: FC = () => <svg aria-label="Một người đang bước qua cánh cửa sáng" viewBox="0 0 1280 720" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
  <defs>
    <linearGradient id="hall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#151a20" /><stop offset="1" stopColor="#05070a" /></linearGradient>
    <linearGradient id="door-light" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd88a" /><stop offset="1" stopColor="#9b5e20" /></linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#hall)" />
  <path d="M774 0H1280V720H680C784 517 816 280 774 0Z" fill="#101821" />
  <path d="M909 54H1212V666H909Z" fill="#07090c" stroke="#39444d" strokeWidth="14" />
  <path d="M944 88H1212V652H944Z" fill="url(#door-light)" />
  <path d="M944 652L670 720H1280L1212 652Z" fill="#cc8a39" opacity=".24" />
  <ellipse cx="1033" cy="691" rx="220" ry="28" fill="#020304" opacity=".72" />
  <circle cx="1032" cy="230" r="68" fill="#1d252d" />
  <path d="M966 219C978 160 1052 135 1103 183C1071 178 1034 187 1008 213C989 231 981 251 981 274C963 260 958 240 966 219Z" fill="#090c10" />
  <path d="M981 296C946 342 939 431 958 520H1097C1110 421 1096 340 1067 295C1038 310 1009 309 981 296Z" fill="#25313b" stroke="#45545f" strokeWidth="5" />
  <path d="M982 350C936 391 907 438 886 498M1066 352C1103 393 1122 438 1134 492" fill="none" stroke="#25313b" strokeWidth="38" strokeLinecap="round" />
  <path d="M991 512L950 682M1067 512L1118 665" fill="none" stroke="#1b242c" strokeWidth="52" strokeLinecap="round" />
  <path d="M924 687H987M1091 673H1158" stroke="#0a0d10" strokeWidth="30" strokeLinecap="round" />
  <path d="M822 655H1194" stroke={GOLD} strokeOpacity=".38" strokeWidth="5" />
</svg>;

export const BookThumbnailAlternative: FC<{spec: ThumbnailAlternativeSpec; testId: string}> = ({spec, testId}) => {
  const Scene = spec.scene === 'seated-book' ? SeatedBook : DoorwayStep;
  return <AbsoluteFill data-testid={testId} style={{background: spec.colors.background, color: spec.colors.primary, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <Scene />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,5,8,.98) 0%, rgba(3,5,8,.9) 38%, rgba(3,5,8,.18) 69%, rgba(3,5,8,0) 100%)'}} />
    {spec.bookCover ? <>
      <div style={{position: 'absolute', left: 730, top: 286, width: 330, height: 410, background: 'radial-gradient(ellipse, rgba(244,185,66,.58), rgba(244,185,66,0) 68%)'}} />
      <CanvasImage src={staticFile(spec.bookCover)} style={{position: 'absolute', left: 792, top: 318, width: 220, height: 340, objectFit: 'cover', rotate: '-6deg', borderRadius: 5, boxShadow: '0 26px 48px rgba(0,0,0,.86), 0 0 0 4px rgba(255,218,139,.82), 0 0 34px rgba(244,185,66,.5)'}} />
      <div style={{position: 'absolute', left: 775, top: 483, width: 38, height: 38, borderRadius: '50%', background: '#c8a47d', boxShadow: '0 5px 12px rgba(0,0,0,.5)'}} />
      <div style={{position: 'absolute', left: 986, top: 455, width: 38, height: 38, borderRadius: '50%', background: '#c8a47d', boxShadow: '0 5px 12px rgba(0,0,0,.5)'}} />
    </> : null}
    <div style={{position: 'absolute', left: 64, top: 154, width: `${spec.textWidthRatio * 100}%`, fontWeight: 700, fontSize: spec.minFontSize, lineHeight: .98, letterSpacing: -2, WebkitTextStroke: '2px rgba(0,0,0,.88)', textShadow: '0 7px 2px rgba(0,0,0,.82), 0 14px 34px rgba(0,0,0,.9)'}}>
      <div style={{color: spec.colors.primary, whiteSpace: 'nowrap'}}>{spec.messageLines[0]}</div>
      <div style={{color: spec.colors.accent, whiteSpace: 'nowrap'}}>{spec.messageLines[1]}</div>
    </div>
  </AbsoluteFill>;
};
