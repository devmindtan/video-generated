import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import '../../shared/stoic-fonts';
import {GOLD, INK, IVORY} from '../book-hvtt-001-overview/Intro';
import {ThumbCover} from '../book-hvtt-001-overview/Thumbnail';

// YouTube thumbnail of episode 2 (1280×720, prepared only: never exported automatically), same layout as episode 1:
// Stoic Sans 700, ivory and gold headline on a dark ground, no faces. The picture is the book's idea: small steps
// that climb, under a curve that bends upward (1% a day compounding). The "+1% mỗi ngày" label sits above the curve,
// out of the bottom-right corner that YouTube's duration badge covers (user 2026-11-05).
const steps = Array.from({length: 7}, (_, k) => ({x: 760 + k * 62, y: 640 - k * 34}));
export const BookAhThumbnail: FC = () => <AbsoluteFill data-testid="book-ah-thumbnail" style={{background: `radial-gradient(ellipse 70% 80% at 74% 50%, #24342c 0%, ${INK} 58%, #060908 100%)`, color: IVORY, fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <svg viewBox="0 0 1280 720" width={1280} height={720} style={{position: 'absolute', inset: 0}}>
    <defs><radialGradient id="ah-thumb-glow"><stop offset="0%" stopColor="#e8c27a" stopOpacity={.42} /><stop offset="100%" stopColor="#e8c27a" stopOpacity={0} /></radialGradient></defs>
    <circle cx={1080} cy={220} r={230} fill="url(#ah-thumb-glow)" />
    <path d={`M740 660 ${steps.map(({x, y}) => `L${x} ${y} L${x + 62} ${y}`).join(' ')}`} fill="none" stroke={GOLD} strokeWidth={5} strokeLinejoin="round" />
    <path d="M760 520 C900 500 1000 450 1060 360 C1110 285 1140 210 1170 130" fill="none" stroke={IVORY} strokeWidth={5} strokeLinecap="round" />
    <path d="M1150 152 L1170 130 L1182 158" fill="none" stroke={IVORY} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={1170} cy={130} r={16} fill={GOLD} />
    <text x={1125} y={140} fill={GOLD} fontSize={36} fontWeight={700} textAnchor="end">+1% mỗi ngày</text>
  </svg>
  <div style={{position: 'absolute', left: 72, top: 70, color: GOLD, fontSize: 26, letterSpacing: 5}}>ĐỌC SÁCH, HIỂU MÌNH · TẬP 02</div>
  <div style={{position: 'absolute', left: 72, top: 170, width: 680}}>
    <div style={{fontSize: 74, lineHeight: 1.08, whiteSpace: 'nowrap', textShadow: '0 4px 20px #000'}}>THAY ĐỔI TÍ HON</div>
    <div style={{fontSize: 74, lineHeight: 1.08, color: GOLD, whiteSpace: 'nowrap', textShadow: '0 4px 20px #000'}}>HIỆU QUẢ BẤT NGỜ</div>
    <div style={{width: 110, height: 4, background: GOLD, margin: '30px 0 26px'}} />
    <div style={{fontSize: 40, lineHeight: 1.35}}>Tóm tắt trọn cuốn sách<br />của James Clear</div>
  </div>
</AbsoluteFill>;

const ground = (at: string) => ({background: `radial-gradient(ellipse 70% 80% at ${at}, #24342c 0%, ${INK} 58%, #060908 100%)`, color: IVORY, fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700} as const);
const Label: FC = () => <div style={{position: 'absolute', left: 72, top: 70, color: GOLD, fontSize: 26, letterSpacing: 5}}>ĐỌC SÁCH, HIỂU MÌNH · TẬP 02</div>;
const COVER = 'book-ah-001-overview/thumbnail/book-cover.jpg';

// Variant B for YouTube "Test & compare": the real book cover beside the title (readers searching for a summary
// recognise the cover first). Bottom-right corner left empty for the duration badge.
export const BookAhThumbnailB: FC = () => <AbsoluteFill data-testid="book-ah-thumbnail-b" style={ground('76% 48%')}>
  <ThumbCover src={COVER} height={500} left={850} top={92} tilt={3} />
  <Label />
  <div style={{position: 'absolute', left: 72, top: 170, width: 700}}>
    <div style={{fontSize: 74, lineHeight: 1.08, whiteSpace: 'nowrap', textShadow: '0 4px 20px #000'}}>THAY ĐỔI TÍ HON</div>
    <div style={{fontSize: 74, lineHeight: 1.08, color: GOLD, whiteSpace: 'nowrap', textShadow: '0 4px 20px #000'}}>HIỆU QUẢ BẤT NGỜ</div>
    <div style={{width: 110, height: 4, background: GOLD, margin: '30px 0 26px'}} />
    <div style={{fontSize: 40, lineHeight: 1.35}}>Tóm tắt Atomic Habits<br />của James Clear</div>
  </div>
</AbsoluteFill>;

// Variant C: a short promise (the question the episode answers) instead of the title, with the cover.
export const BookAhThumbnailC: FC = () => <AbsoluteFill data-testid="book-ah-thumbnail-c" style={ground('78% 46%')}>
  <ThumbCover src={COVER} height={450} left={890} top={110} tilt={4} />
  <Label />
  <div style={{position: 'absolute', left: 72, top: 165, width: 760}}>
    <div style={{fontSize: 96, lineHeight: 1.06, whiteSpace: 'nowrap', textShadow: '0 4px 20px #000'}}>VÌ SAO BẠN</div>
    <div style={{fontSize: 112, lineHeight: 1.06, whiteSpace: 'nowrap', color: GOLD, textShadow: '0 4px 20px #000'}}>CỨ BỎ DỞ?</div>
    <div style={{width: 110, height: 4, background: GOLD, margin: '30px 0 26px'}} />
    <div style={{fontSize: 40, lineHeight: 1.35}}>4 quy luật xây thói quen<br />Atomic Habits · James Clear</div>
  </div>
</AbsoluteFill>;
