import type {FC, ReactElement} from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import {BookInsightsIntro, introFrames} from './Intro';
import {BookInsightsEpisodeCard, cardFrames} from './EpisodeCard';
import {BookHvttMoChuyen, moChuyenFrames} from './MoChuyen';
import {BookInsightsOutro, outroFrames} from './Outro';
import {CachLam, CuonSach, DiemChuaDat, Nhom3A, Nhom3B, Nhom3C, Nhom3D, NhanXet, SoiChi, TongKet, YKien} from './Sections';
import {takeOf} from './scene-kit';

// The episode as it grows: series intro → how this episode works → episode card → body sections → closing remark → series outro.
// A body section joins only once its narration take exists (cloning runs section by section). Background music
// plays only under the series intro and outro (user decision 2026-10-31), each with its own fades and glide;
// the body runs on narration alone.
export type EpisodeProps = {introVoice: string; cardVoice: string; bodyVoice: string; outroVoice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string; cloneVoice?: boolean};

const BODY = [['03-cuon-sach', 'Phần 1 · Cuốn sách là gì', CuonSach], ['04-soi-chi', 'Phần 2 · Sợi chỉ xuyên suốt', SoiChi], ['05-nhom-3a', 'Nhóm 1 · Cơn sóng trong lòng', Nhom3A],
  ['06-nhom-3b', 'Nhóm 2 · Thương và được thương', Nhom3B], ['07-nhom-3c', 'Nhóm 3 · Thăng trầm', Nhom3C], ['08-nhom-3d', 'Nhóm 4 · Sống giữa mọi người', Nhom3D],
  ['08e-diem-chua-dat', 'Phần 3E · Điểm chưa đạt', DiemChuaDat], ['08f-tong-ket', 'Phần 3F · Tổng kết', TongKet], ['08g-y-kien', 'Phần 4 · Ý kiến cá nhân', YKien], ['09-nhan-xet', 'Phần 5 · Nhận xét chung', NhanXet]] as const;
// Placeholder phase (long video, cloned voice): the Quốc Tuấn take of a segment (25-quoc-tuan-<nn>) wins until the
// user picks the clone takes; cloneVoice (the BookHvttTap01Clone listening copy) skips it to play the clone batch.
const voiceFor = (seg: string, clone?: boolean) => [...(clone ? [] : [`25-quoc-tuan-${seg.split('-')[0]}`]), seg, `${seg}-sang2`].find((id) => takeOf(id));

const parts = (p: EpisodeProps, fps: number) => {
  const list: {name: string; frames: number; node: ReactElement}[] = [
    {name: 'Intro series', frames: introFrames(p.introVoice, fps), node: <BookInsightsIntro voice={p.introVoice} channelLabel={p.channelLabel} />},
  ];
  // How this episode works (user 2026-11-02), between the series intro and the episode card, once its take exists.
  const howVoice = voiceFor('01b-cach-lam', p.cloneVoice);
  if (howVoice) list.push({name: 'Cách làm của tập', frames: CachLam.frames(howVoice, fps), node: <CachLam voice={howVoice} channelLabel={p.channelLabel} />});
  list.push(
    {name: 'Thẻ tập', frames: cardFrames(p.cardVoice, fps), node: <BookInsightsEpisodeCard voice={p.cardVoice} channelLabel={p.channelLabel} episodeLabel={p.episodeLabel} bookTitle={p.bookTitle} bookAuthor={p.bookAuthor} />},
    {name: 'Mở chuyện', frames: moChuyenFrames(p.bodyVoice, fps), node: <BookHvttMoChuyen voice={p.bodyVoice} channelLabel={p.channelLabel} />},
  );
  for (const [seg, name, Section] of BODY) {
    const voice = voiceFor(seg, p.cloneVoice);
    if (voice) list.push({name, frames: Section.frames(voice, fps), node: <Section voice={voice} channelLabel={p.channelLabel} />});
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
