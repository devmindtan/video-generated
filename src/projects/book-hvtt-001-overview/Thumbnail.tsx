import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import '../../shared/stoic-fonts';
import {GOLD, INK, IVORY} from './Intro';

// YouTube thumbnail of episode 1 (1280×720, prepared only: never exported automatically). Channel typography: Stoic
// Sans Bold 700, ivory headline with the gold keyword, dark high-contrast ground, safe margins; no faces, the gold
// line drawing of the episode (an open book with a heart above it).
export const BookHvttThumbnail: FC = () => <AbsoluteFill data-testid="book-hvtt-thumbnail" style={{background: `radial-gradient(ellipse 70% 80% at 72% 50%, #24342c 0%, ${INK} 58%, #060908 100%)`, color: IVORY, fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <svg viewBox="0 0 1280 720" width={1280} height={720} style={{position: 'absolute', inset: 0}}>
    <defs><radialGradient id="thumb-glow"><stop offset="0%" stopColor="#e8c27a" stopOpacity={.42} /><stop offset="100%" stopColor="#e8c27a" stopOpacity={0} /></radialGradient></defs>
    <circle cx={930} cy={330} r={250} fill="url(#thumb-glow)" />
    <path d="M930 420 C800 330 800 220 880 200 C915 192 930 215 930 240 C930 215 945 192 980 200 C1060 220 1060 330 930 420 Z" fill="rgba(217,181,111,.12)" stroke={GOLD} strokeWidth={6} strokeLinejoin="round" />
    <path d="M930 600 C860 560 770 556 700 576 L700 470 C770 450 860 454 930 494 C1000 454 1090 450 1160 470 L1160 576 C1090 556 1000 560 930 600 Z M930 494 L930 600" fill="none" stroke={GOLD} strokeWidth={5} strokeLinejoin="round" />
    {[0, 1, 2].map((k) => <path key={k} d={`M730 ${500 + k * 22} C780 ${490 + k * 22} 850 ${492 + k * 22} 905 ${510 + k * 22} M955 ${510 + k * 22} C1010 ${492 + k * 22} 1080 ${490 + k * 22} 1130 ${500 + k * 22}`} fill="none" stroke={GOLD} strokeWidth={3} opacity={.7} />)}
  </svg>
  <div style={{position: 'absolute', left: 72, top: 70, color: GOLD, fontSize: 26, letterSpacing: 5}}>ĐỌC SÁCH, HIỂU MÌNH · TẬP 01</div>
  <div style={{position: 'absolute', left: 72, top: 170, width: 640}}>
    <div style={{fontSize: 104, lineHeight: 1.04, textShadow: '0 4px 20px #000'}}>HIỂU VỀ</div>
    <div style={{fontSize: 128, lineHeight: 1.04, color: GOLD, textShadow: '0 4px 20px #000'}}>TRÁI TIM</div>
    <div style={{width: 110, height: 4, background: GOLD, margin: '30px 0 26px'}} />
    <div style={{fontSize: 40, lineHeight: 1.35}}>Tóm tắt trọn cuốn sách<br />của Minh Niệm</div>
  </div>
</AbsoluteFill>;
