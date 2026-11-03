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
import {MoChuyen} from './Sections';

// Episode 2 (Thay đổi tí hon hiệu quả bất ngờ) in the series frame: reused series intro, "Cách làm" and outro, this
// episode's card and body. Parts join as their narration exists. Placeholder phase: the Quốc Tuấn take of a segment
// (25-quoc-tuan-<nn>) plays until the clone batch is picked; then the clone take (<segment>-sang2) wins.
export type EpisodeProps = {introVoice: string; cardVoice: string; outroVoice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string};

const voices = takesOf(bodyTakes), cards = (cardTakes as unknown as {voices: Voice[]}).voices;
// The newest placeholder take of a segment is the last 25-quoc-tuan-<nn>[letter] in body-takes.json.
const placeholder = (seg: string) => voices.filter((v) => new RegExp(`^25-quoc-tuan-${seg.split('-')[0]}[a-z]?$`).test(v.id)).at(-1)?.id;
const voiceFor = (seg: string) => [`${seg}-sang2`, seg, placeholder(seg)].find((id) => id && takeOf(id, voices));
const BODY: [string, string, Section][] = [['02-mo-chuyen', 'Mở chuyện', MoChuyen]];

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
