import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import '../../shared/stoic-fonts';

export type ThumbnailAlternativeSpec = {
  messageLines: [string, string];
  colors: {background: string; primary: string; accent: string};
  hasOutlineOrShadow: boolean;
  textWidthRatio: number;
  minFontSize: number;
  fullBleed: boolean;
  concreteSituation: string;
  scene: 'seated-phone' | 'doorway-step';
};

const GOLD = '#F4B942';

const SeatedPhone: FC = () => <svg aria-label="Một người ngồi bệt, cúi nhìn điện thoại" viewBox="0 0 1280 720" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
  <defs>
    <linearGradient id="room-light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#172532" /><stop offset="1" stopColor="#07090d" /></linearGradient>
    <radialGradient id="phone-glow"><stop offset="0" stopColor="#bfe7ff" stopOpacity=".76" /><stop offset="1" stopColor="#bfe7ff" stopOpacity="0" /></radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#room-light)" />
  <path d="M760 0H1280V720H685C772 548 824 306 760 0Z" fill="#0d141b" />
  <path d="M1008 94H1206V388H1008Z" fill="#162b38" stroke="#365366" strokeWidth="8" />
  <path d="M1107 94V388M1008 241H1206" stroke="#365366" strokeWidth="7" />
  <path d="M1008 388L752 720H1112L1206 388Z" fill="#1a2a31" opacity=".52" />
  <ellipse cx="944" cy="690" rx="250" ry="35" fill="#030506" opacity=".78" />
  <circle cx="944" cy="306" r="78" fill="#1d252d" />
  <path d="M875 292C897 226 980 207 1025 264C985 246 946 255 918 284C901 301 893 320 889 345C871 332 866 311 875 292Z" fill="#090c10" />
  <path d="M900 373C851 419 830 500 850 585L1013 590C1035 486 1012 412 974 371C949 384 924 384 900 373Z" fill="#25313b" stroke="#3e4d58" strokeWidth="5" />
  <path d="M884 446C828 490 786 548 743 624M968 446C1013 491 1050 550 1084 626" fill="none" stroke="#25313b" strokeWidth="42" strokeLinecap="round" />
  <path d="M874 590C830 614 795 648 768 696M994 590C1033 619 1061 653 1080 696" fill="none" stroke="#1b242c" strokeWidth="58" strokeLinecap="round" />
  <ellipse cx="927" cy="476" rx="126" ry="112" fill="url(#phone-glow)" />
  <path d="M894 458L962 438L981 510L913 529Z" fill="#cdeeff" stroke="#f8fdff" strokeWidth="6" />
  <path d="M890 481L842 510M979 479L1027 503" fill="none" stroke="#c9a983" strokeWidth="20" strokeLinecap="round" />
  <path d="M682 654H1240" stroke={GOLD} strokeOpacity=".28" strokeWidth="4" />
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
  const Scene = spec.scene === 'seated-phone' ? SeatedPhone : DoorwayStep;
  return <AbsoluteFill data-testid={testId} style={{background: spec.colors.background, color: spec.colors.primary, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <Scene />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,5,8,.98) 0%, rgba(3,5,8,.9) 38%, rgba(3,5,8,.18) 69%, rgba(3,5,8,0) 100%)'}} />
    <div style={{position: 'absolute', left: 64, top: 154, width: `${spec.textWidthRatio * 100}%`, fontWeight: 700, fontSize: spec.minFontSize, lineHeight: .98, letterSpacing: -2, WebkitTextStroke: '2px rgba(0,0,0,.88)', textShadow: '0 7px 2px rgba(0,0,0,.82), 0 14px 34px rgba(0,0,0,.9)'}}>
      <div style={{color: spec.colors.primary, whiteSpace: 'nowrap'}}>{spec.messageLines[0]}</div>
      <div style={{color: spec.colors.accent, whiteSpace: 'nowrap'}}>{spec.messageLines[1]}</div>
    </div>
  </AbsoluteFill>;
};
