import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import '../../shared/stoic-fonts';
import {GOLD, INK, IVORY} from '../book-hvtt-001-overview/Intro';

// Cover of each short (1080×1920, Stoic typography): the opening question large with its keywords in gold, the book
// under it. YouTube may show it as the Shorts cover; never exported automatically.
export type ShortCoverProps = {question: string; keywords: string[]};
const parts = (text: string, words: string[]) => text.split(new RegExp(`(${words.join('|')})`, 'gi'));

export const ShortCover: FC<ShortCoverProps> = ({question, keywords}) => <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 45%, #22302a 0%, ${INK} 65%, #070b09 100%)`, fontFamily: 'Stoic Sans, sans-serif'}}>
  <div style={{position: 'absolute', inset: 36, border: `1.5px solid ${GOLD}`, opacity: .35, borderRadius: 6}} />
  <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', color: GOLD, fontSize: 34, fontWeight: 700, letterSpacing: 8}}>ĐỌC SÁCH, HIỂU MÌNH</div>
  <div style={{position: 'absolute', top: 520, left: 90, width: 840, color: IVORY, fontSize: 96, fontWeight: 700, lineHeight: 1.2, textAlign: 'center', textWrap: 'balance', textShadow: '0 6px 30px rgba(0,0,0,.6)'}}>
    {parts(question, keywords).map((p, i) => <span key={i} style={{color: i % 2 ? GOLD : undefined}}>{p}</span>)}
  </div>
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <path d="M520 1300 C450 1270 360 1268 290 1286 L290 1200 C360 1182 450 1184 520 1214 C590 1184 680 1182 750 1200 L750 1286 C680 1268 590 1270 520 1300 Z M520 1214 L520 1300" fill="none" stroke={GOLD} strokeWidth={3} strokeLinejoin="round" />
  </svg>
  <div style={{position: 'absolute', top: 1340, left: 0, right: 0, textAlign: 'center', color: IVORY, fontSize: 48, fontWeight: 700}}>Hiểu về trái tim</div>
  <div style={{position: 'absolute', top: 1410, left: 0, right: 0, textAlign: 'center', color: IVORY, fontSize: 36, fontWeight: 400, opacity: .85}}>Minh Niệm</div>
</AbsoluteFill>;
