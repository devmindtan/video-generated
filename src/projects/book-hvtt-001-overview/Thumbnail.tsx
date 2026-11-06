import type {FC} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '../../shared/stoic-fonts';
import {GOLD, INK, IVORY} from './Intro';

// Approved option B. 1280×720, prepared only: never exported automatically. Stoic Sans 700; the book title in two
// lines (ivory, then gold); a short line "Tóm tắt … / của <author>"; the real book cover on the right with a soft gold
// glow. The bottom-right corner (x ≥ 980, y ≥ 600) stays empty: YouTube's duration badge covers it. Title lines must
// fit 700 px wide: pick sizes per book (2 short words: 104/128; long titles: 74/74).
export type BookThumbnailProps = {
  episode: string;                 // '01', '02', …
  title: [string, string];         // upper case, line 2 is the gold one
  titleSizes?: [number, number];
  subtitle: [string, string];
  cover: string;                   // staticFile path, e.g. '<slug>/thumbnail/book-cover.jpg' (white margin trimmed)
  testId?: string;
};

const ThumbCover: FC<{src: string; height: number; left: number; top: number; tilt: number}> = ({src, height, left, top, tilt}) => <>
  <div style={{position: 'absolute', left: left - 90, top: top - 60, width: height * .7 + 180, height: height + 120, background: 'radial-gradient(closest-side, rgba(232,194,122,.34), rgba(232,194,122,0))'}} />
  <Img src={staticFile(src)} style={{position: 'absolute', left, top, height, transform: `rotate(${tilt}deg)`, borderRadius: 4, boxShadow: '0 24px 60px rgba(0,0,0,.75), 0 0 0 2px rgba(217,181,111,.55)'}} />
</>;

export const BookThumbnail: FC<BookThumbnailProps> = ({episode, title, titleSizes = [104, 128], subtitle, cover, testId}) => <AbsoluteFill data-testid={testId} style={{background: `radial-gradient(ellipse 70% 80% at 76% 48%, #24342c 0%, ${INK} 58%, #060908 100%)`, color: IVORY, fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <ThumbCover src={cover} height={500} left={855} top={92} tilt={3} />
  <div style={{position: 'absolute', left: 72, top: 70, color: GOLD, fontSize: 26, letterSpacing: 5}}>ĐỌC SÁCH, HIỂU MÌNH · TẬP {episode}</div>
  <div style={{position: 'absolute', left: 72, top: 170, width: 700}}>
    <div style={{fontSize: titleSizes[0], lineHeight: 1.06, whiteSpace: 'nowrap', textShadow: '0 4px 20px #000'}}>{title[0]}</div>
    <div style={{fontSize: titleSizes[1], lineHeight: 1.06, whiteSpace: 'nowrap', color: GOLD, textShadow: '0 4px 20px #000'}}>{title[1]}</div>
    <div style={{width: 110, height: 4, background: GOLD, margin: '30px 0 26px'}} />
    <div style={{fontSize: 40, lineHeight: 1.35}}>{subtitle[0]}<br />{subtitle[1]}</div>
  </div>
</AbsoluteFill>;

export const BookHvttThumbnail: FC = () => <BookThumbnail testId="book-hvtt-thumbnail" episode="01" title={['HIỂU VỀ', 'TRÁI TIM']}
  subtitle={['Tóm tắt trọn cuốn sách', 'của Minh Niệm']} cover="book-hvtt-001-overview/thumbnail/book-cover.jpg" />;
