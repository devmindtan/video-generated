import type {FC, ReactElement} from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import {BookInsightsIntro, introFrames} from './Intro';
import {BookInsightsEpisodeCard, cardFrames} from './EpisodeCard';
import {BookHvttMoChuyen, moChuyenFrames} from './MoChuyen';
import {BookInsightsOutro, outroFrames} from './Outro';
import {CuonSach, Nhom3A, Nhom3B, Nhom3C, Nhom3D, NhanXet, SoiChi} from './Sections';
import {sectionFrames, takeOf} from './scene-kit';

// The episode as it grows: series intro → episode card → body sections → closing remark → series outro.
// A body section joins only once its narration take exists (cloning runs section by section). Background music
// plays only under the series intro and outro (user decision 2026-10-31), each with its own fades and glide;
// the body runs on narration alone.
export type EpisodeProps = {introVoice: string; cardVoice: string; bodyVoice: string; outroVoice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string};

// Section 4 (ý kiến cá nhân) is added when the user gives it, between 08 and 09.
const BODY = [['03-cuon-sach', 'Phần 1 · Cuốn sách là gì', CuonSach], ['04-soi-chi', 'Phần 2 · Sợi chỉ xuyên suốt', SoiChi], ['05-nhom-3a', 'Nhóm 1 · Cơn sóng trong lòng', Nhom3A],
  ['06-nhom-3b', 'Nhóm 2 · Thương và được thương', Nhom3B], ['07-nhom-3c', 'Nhóm 3 · Thăng trầm', Nhom3C], ['08-nhom-3d', 'Nhóm 4 · Sống giữa mọi người', Nhom3D], ['09-nhan-xet', 'Phần 5 · Nhận xét chung', NhanXet]] as const;
const voiceFor = (seg: string) => [seg, `${seg}-sang2`].find((id) => takeOf(id));

const parts = (p: EpisodeProps, fps: number) => {
  const list: {name: string; frames: number; node: ReactElement}[] = [
    {name: 'Intro series', frames: introFrames(p.introVoice, fps), node: <BookInsightsIntro voice={p.introVoice} channelLabel={p.channelLabel} />},
    {name: 'Thẻ tập', frames: cardFrames(p.cardVoice, fps), node: <BookInsightsEpisodeCard voice={p.cardVoice} channelLabel={p.channelLabel} episodeLabel={p.episodeLabel} bookTitle={p.bookTitle} bookAuthor={p.bookAuthor} />},
    {name: 'Mở chuyện', frames: moChuyenFrames(p.bodyVoice, fps), node: <BookHvttMoChuyen voice={p.bodyVoice} channelLabel={p.channelLabel} />},
  ];
  for (const [seg, name, Section] of BODY) {
    const voice = voiceFor(seg);
    if (voice) list.push({name, frames: sectionFrames(voice, fps), node: <Section voice={voice} channelLabel={p.channelLabel} />});
  }
  list.push({name: 'Outro series', frames: outroFrames(p.outroVoice, fps), node: <BookInsightsOutro voice={p.outroVoice} channelLabel={p.channelLabel} />});
  return list;
};
export const episodeMetadata: CalculateMetadataFunction<EpisodeProps> = ({props}) => ({durationInFrames: parts(props, 30).reduce((n, x) => n + x.frames, 0)});

export const BookHvttEpisode: FC<EpisodeProps> = (p) => {
  const {fps} = useVideoConfig();
  let from = 0;
  return <AbsoluteFill
    style={{
      background: '#0d1411',
      scale: 1.045
    }}
  >
    {parts(p, fps).map((part) => {
      const at = from;from += part.frames;
      return <Sequence key={part.name} name={part.name} from={at} durationInFrames={part.frames}>{part.node}</Sequence>;
    })}
  </AbsoluteFill>;
};
