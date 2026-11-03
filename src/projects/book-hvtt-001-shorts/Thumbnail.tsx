import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import '../../shared/stoic-fonts';
import {GOLD, INK, IVORY} from '../book-hvtt-001-overview/Intro';

// Cover of each short (1080×1920). The picture leads (user 2026-11-04: a cover of only words does not work): one large
// gold line drawing of the short's image with a warm glow behind it, a short headline (Stoic Sans 700, gold keyword)
// and the book underneath. Objects and nature only, no faces. Never exported automatically.
export type ShortCoverProps = {art: 'salt' | 'pond' | 'phone'; headline: string; keyword: string};

const G = (d: string, w = 5, color = GOLD) => <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
// Salt pouring from a tilted spoon into a wide river that flows across the frame, reeds on its banks.
const Salt: FC = () => <g>
  {/* One spoon in one outline: bowl, neck and a handle with thickness, tipped so the salt runs off its left lip. */}
  <g transform="translate(520 460) rotate(-24)">
    <path d="M-86 0 C-86 -32 -44 -48 0 -48 C40 -48 72 -28 88 -10 L340 -12 C356 -12 356 12 340 12 L88 10 C72 28 40 48 0 48 C-44 48 -86 32 -86 0 Z" fill="rgba(13,20,17,.65)" stroke={GOLD} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-64 -6 C-52 -30 28 -34 62 -12" fill="none" stroke={GOLD} strokeWidth={3} strokeLinecap="round" opacity={.8} />
    <path d="M-70 14 C-52 -12 -6 -18 30 -2 C46 6 54 14 56 20 C20 30 -40 30 -70 14 Z" fill={IVORY} opacity={.92} />
  </g>
  {Array.from({length: 18}, (_, i) => <circle key={i} cx={448 + Math.sin(i * 2.1) * 14 + i * 1.5} cy={540 + i * 26} r={8} fill={IVORY} opacity={1 - i * .035} />)}
  {G('M40 1000 C240 930 420 1060 640 990 C800 940 920 960 1040 990 M40 1240 C260 1180 440 1300 660 1230 C820 1180 930 1200 1040 1230', 6)}
  {[[150, 1090], [420, 1140], [690, 1080], [880, 1120], [300, 1190], [600, 1180]].map(([x, y], k) => G(`M${x} ${y} c25 -12 50 12 75 0 c25 -12 50 12 75 0`, 3.4, IVORY))}
  {[[110, 990], [150, 975], [930, 975], [970, 985]].map(([x, y], k) => G(`M${x} ${y} C${x - 6} ${y - 50} ${x + 10} ${y - 90} ${x + 4} ${y - 120}`, 3.6))}
</g>;
// A pebble falling into a still pond, rings spreading.
const Pond: FC = () => <g>
  <circle cx={540} cy={560} r={34} fill="none" stroke={IVORY} strokeWidth={5} />
  {G('M540 610 L540 700 M540 730 L540 770', 3, IVORY)}
  {[0, 1, 2, 3, 4].map((k) => <ellipse key={k} cx={540} cy={1080} rx={60 + k * 95} ry={(60 + k * 95) * .28} fill="none" stroke={k % 2 ? IVORY : GOLD} strokeWidth={k ? 4 : 6} opacity={1 - k * .13} />)}
  <path d="M120 1080 C120 960 960 960 960 1080 C960 1200 120 1200 120 1080 Z" fill="none" stroke={GOLD} strokeWidth={3} opacity={.6} />
</g>;
// A phone that nobody answers and a thought bubble swelling with a question.
const Phone: FC = () => <g>
  {G('M380 760 L380 1240 C380 1270 400 1290 430 1290 L650 1290 C680 1290 700 1270 700 1240 L700 760 C700 730 680 710 650 710 L430 710 C400 710 380 730 380 760 Z M500 1250 L580 1250')}
  {G('M440 880 L640 880 M440 960 L600 960', 4, IVORY)}
  {[0, 1, 2].map((k) => G(`M${760 + k * 40} ${880 - k * 14} C${800 + k * 40} 940 ${800 + k * 40} 1000 ${760 + k * 40} ${1060 + k * 14}`, 4))}
  <ellipse cx={540} cy={480} rx={300} ry={170} fill="rgba(13,20,17,.5)" stroke={GOLD} strokeWidth={5} />
  {[0, 1, 2].map((k) => <circle key={k} cx={360 + k * 28} cy={690 - k * 34} r={10 + k * 5} fill="none" stroke={IVORY} strokeWidth={4} />)}
  <text x={540} y={555} textAnchor="middle" fill={GOLD} fontSize={210} fontWeight={700}>?</text>
</g>;
const ART = {salt: Salt, pond: Pond, phone: Phone};

export const ShortCover: FC<ShortCoverProps> = ({art, headline, keyword}) => {
  const Art = ART[art];
  const [before, after] = headline.split(keyword);
  return <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 55% at 50% 44%, #2c3b31 0%, #16211b 48%, ${INK} 75%, #060a08 100%)`, fontFamily: 'Stoic Sans, sans-serif'}}>
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 46%, rgba(232,194,122,.28) 0%, rgba(232,194,122,.08) 30%, transparent 55%)'}} />
    <div style={{position: 'absolute', inset: 36, border: `1.5px solid ${GOLD}`, opacity: .35, borderRadius: 6}} />
    <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 34, fontWeight: 700, letterSpacing: 8}}>ĐỌC SÁCH, HIỂU MÌNH</div>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 10px rgba(217,181,111,.35))'}}><Art /></svg>
    <div style={{position: 'absolute', top: 1340, left: 70, width: 940, textAlign: 'center', color: IVORY, fontSize: 112, fontWeight: 700, lineHeight: 1.12, textWrap: 'balance', textShadow: '0 6px 30px rgba(0,0,0,.7)'}}>
      {before}<span style={{color: GOLD}}>{keyword}</span>{after}
    </div>
    <div style={{position: 'absolute', top: 1620, left: 0, right: 0, textAlign: 'center', color: IVORY, fontSize: 40, fontWeight: 700, opacity: .9}}>Hiểu về trái tim · Minh Niệm</div>
  </AbsoluteFill>;
};
