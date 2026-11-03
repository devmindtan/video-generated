import type {FC} from 'react';
import {useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import bodyMusic from './body-music.json';
import {BookHvttMoChuyen, moChuyenFrames, moChuyenPacing, moChuyenSpeaking} from './MoChuyen';
import {CuonSach, DiemChuaDat, Nhom3A, Nhom3B, Nhom3C, Nhom3D, NhanXet, SoiChi, TongKet, YKien} from './Sections';
import {EpisodeStage, captionsOf, lengthOf, openingParts, outroPart, pacedPages, sectionPart, timelineOf, voiceFor} from './episode-kit';
import type {BodyMusicConfig, Part} from './episode-kit';
import {takesOf} from './scene-kit';
import takes from './body-takes.json';

// Episode 1 (Hiểu về trái tim) in the series frame (episode-kit.tsx): series intro → how this episode works →
// episode card → Mở chuyện and the body sections → series outro. A body section joins once its take exists.
export type EpisodeProps = {introVoice: string; cardVoice: string; bodyVoice: string; outroVoice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string};

const voices = takesOf(takes);
const BODY = [['03-cuon-sach', 'Phần 1 · Cuốn sách là gì', CuonSach], ['04-soi-chi', 'Phần 2 · Sợi chỉ xuyên suốt', SoiChi], ['05-nhom-3a', 'Nhóm 1 · Cơn sóng trong lòng', Nhom3A],
  ['06-nhom-3b', 'Nhóm 2 · Thương và được thương', Nhom3B], ['07-nhom-3c', 'Nhóm 3 · Thăng trầm', Nhom3C], ['08-nhom-3d', 'Nhóm 4 · Sống giữa mọi người', Nhom3D],
  ['08e-diem-chua-dat', 'Phần 3E · Điểm chưa đạt', DiemChuaDat], ['08f-tong-ket', 'Phần 3F · Tổng kết', TongKet], ['08g-y-kien', 'Phần 4 · Ý kiến cá nhân', YKien], ['09-nhan-xet', 'Phần 5 · Nhận xét chung', NhanXet]] as const;

const parts = (p: EpisodeProps, fps: number): Part[] => {
  const list = openingParts(p, fps);
  list.push({name: 'Mở chuyện', frames: moChuyenFrames(p.bodyVoice, fps), node: <BookHvttMoChuyen voice={p.bodyVoice} channelLabel={p.channelLabel} />,
    speaking: (f) => moChuyenSpeaking(p.bodyVoice, f, fps), captions: () => pacedPages(p.bodyVoice, moChuyenPacing(p.bodyVoice, fps), fps, voices)});
  for (const [seg, name, Section] of BODY) {
    const voice = voiceFor(seg, voices);
    if (voice) list.push(sectionPart(name, Section, voice, p.channelLabel, fps, voices));
  }
  list.push(outroPart(p, fps));
  return list;
};
export const episodeCaptions = (p: EpisodeProps, fps = 30) => captionsOf(parts(p, fps), fps);
export const episodeTimeline = (p: EpisodeProps, fps = 30) => timelineOf(parts(p, fps));
export const episodeMetadata: CalculateMetadataFunction<EpisodeProps> = ({props}) => ({durationInFrames: lengthOf(parts(props, 30))});

export const BookHvttEpisode: FC<EpisodeProps> = (p) => {
  const {fps} = useVideoConfig();
  return <EpisodeStage list={parts(p, fps)} music={bodyMusic as BodyMusicConfig} />;
};
