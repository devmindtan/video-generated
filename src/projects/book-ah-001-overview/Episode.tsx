import type {FC} from 'react';
import {useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import type {Voice} from '../book-hvtt-001-overview/Intro';
import {BookInsightsEpisodeCard, episodeCardMetadata} from '../book-hvtt-001-overview/EpisodeCard';
import type {EpisodeCardProps} from '../book-hvtt-001-overview/EpisodeCard';
import {EpisodeStage, captionsOf, lengthOf, openingParts, outroPart, sectionPart, timelineOf} from '../book-hvtt-001-overview/episode-kit';
import type {BodyMusicConfig, Part} from '../book-hvtt-001-overview/episode-kit';
import {takeOf, takesOf} from '../book-hvtt-001-overview/scene-kit';
import type {Section} from '../book-hvtt-001-overview/scene-kit';
import bodyMusic from './body-music.json';
import bodyTakes from './body-takes.json';
import cardTakes from './card-takes.json';
import {ChuaDat, CuonSach, MoChuyen, NhanXet, QuyLuat1, QuyLuat2, QuyLuat3, QuyLuat4, SoiChi, ThanhNep, TongKet, YKien} from './Sections';

// Episode 2 (Thay đổi tí hon hiệu quả bất ngờ) in the series frame: reused series intro, "Cách làm" and outro, this
// episode's card and body. Parts join as their narration exists. Placeholder phase: the Quốc Tuấn take of a segment
// (25-quoc-tuan-<nn>) plays until the clone batch is picked; then the clone take (<segment>-sang2) wins.
export type EpisodeProps = {introVoice: string; cardVoice: string; outroVoice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string};

const voices = takesOf(bodyTakes), cards = (cardTakes as unknown as {voices: Voice[]}).voices;
// The newest placeholder take of a segment: 25-quoc-tuan-<nn>, or a later retake 25-quoc-tuan-<nn><letter> whose
// <nn><letter> is not itself another segment's number (08b, 08e, 08f are segments; 02b is a retake of 02).
const NUMBERS = ['01', '02', '03', '04', '05', '06', '07', '08', '08b', '08e', '08f', '08g', '09'];
const placeholder = (seg: string) => {
  const nn = seg.split('-')[0];
  return voices.filter((v) => {const m = /^25-quoc-tuan-(\d+[a-z]?)$/.exec(v.id);return m && (m[1] === nn || (m[1].startsWith(nn) && m[1].length === nn.length + 1 && !NUMBERS.includes(m[1])));}).at(-1)?.id;
};
const voiceFor = (seg: string) => [`${seg}-sang2`, seg, placeholder(seg)].find((id) => id && takeOf(id, voices));
const BODY: [string, string, Section][] = [['02-mo-chuyen', 'Mở chuyện', MoChuyen], ['03-cuon-sach', 'Phần 1 · Cuốn sách là gì', CuonSach], ['04-soi-chi', 'Phần 2 · Sợi chỉ xuyên suốt', SoiChi],
  ['05-quy-luat-1', 'Quy luật 1 · Làm cho hiển nhiên', QuyLuat1], ['06-quy-luat-2', 'Quy luật 2 · Làm cho hấp dẫn', QuyLuat2], ['07-quy-luat-3', 'Quy luật 3 · Làm cho dễ dàng', QuyLuat3],
  ['08-quy-luat-4', 'Quy luật 4 · Làm cho thỏa mãn', QuyLuat4], ['08b-thanh-nep', 'Khi thói quen đã thành nếp', ThanhNep], ['08e-diem-chua-dat', 'Những điểm chưa đạt', ChuaDat],
  ['08f-tong-ket', 'Tổng kết', TongKet], ['08g-y-kien', 'Ý kiến cá nhân', YKien], ['09-nhan-xet', 'Nhận xét chung', NhanXet]];

const parts = (p: EpisodeProps, fps: number): Part[] => {
  const list = openingParts({...p, cardTakes: cards}, fps);
  for (const [seg, name, S] of BODY) {
    const voice = voiceFor(seg);
    if (voice) list.push(sectionPart(name, S, voice, p.channelLabel, fps, voices));
  }
  list.push(outroPart(p, fps));
  return list;
};
export const episodeCaptions = (p: EpisodeProps, fps = 30) => captionsOf(parts(p, fps), fps);
export const episodeTimeline = (p: EpisodeProps, fps = 30) => timelineOf(parts(p, fps));
export const episodeMetadata: CalculateMetadataFunction<EpisodeProps> = ({props}) => ({durationInFrames: lengthOf(parts(props, 30))});
export const BookAhEpisode: FC<EpisodeProps> = (p) => {
  const {fps} = useVideoConfig();
  return <EpisodeStage list={parts(p, fps)} music={bodyMusic as BodyMusicConfig} />;
};

// The card on its own in Studio, with this episode's card narration.
export const BookAhEpisodeCard: FC<EpisodeCardProps> = (p) => <BookInsightsEpisodeCard {...p} takes={cards} />;
export const bookAhCardMetadata: CalculateMetadataFunction<EpisodeCardProps> = (o) => episodeCardMetadata({...o, props: {...o.props, takes: cards}});
