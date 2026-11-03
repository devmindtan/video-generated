import {useMemo} from 'react';
import type {FC, ReactElement} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, Track, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MusicFade} from '../../shared/MusicFade';
import bodyMusic from './body-music.json';
import type {CalculateMetadataFunction} from 'remotion';
import {BookInsightsIntro, GOLD, introFrames} from './Intro';
import {BookInsightsEpisodeCard, cardFrames} from './EpisodeCard';
import {BookHvttMoChuyen, moChuyenFrames, moChuyenSpeaking} from './MoChuyen';
import {BookInsightsOutro, outroFrames} from './Outro';
import {CachLam, CuonSach, DiemChuaDat, Nhom3A, Nhom3B, Nhom3C, Nhom3D, NhanXet, SoiChi, TongKet, YKien} from './Sections';
import {takeOf} from './scene-kit';

// The episode as it grows: series intro → how this episode works → episode card → body sections → closing remark → series outro.
// A body section joins only once its narration take exists (cloning runs section by section). Background music
// plays under the series intro and outro (user decision 2026-10-31), each with its own fades and glide; the body
// has a very quiet bed of its own (body-music.json, user 2026-11-02).
export type EpisodeProps = {introVoice: string; cardVoice: string; bodyVoice: string; outroVoice: string; channelLabel: string; episodeLabel: string; bookTitle: string; bookAuthor: string};

const BODY = [['03-cuon-sach', 'Phần 1 · Cuốn sách là gì', CuonSach], ['04-soi-chi', 'Phần 2 · Sợi chỉ xuyên suốt', SoiChi], ['05-nhom-3a', 'Nhóm 1 · Cơn sóng trong lòng', Nhom3A],
  ['06-nhom-3b', 'Nhóm 2 · Thương và được thương', Nhom3B], ['07-nhom-3c', 'Nhóm 3 · Thăng trầm', Nhom3C], ['08-nhom-3d', 'Nhóm 4 · Sống giữa mọi người', Nhom3D],
  ['08e-diem-chua-dat', 'Phần 3E · Điểm chưa đạt', DiemChuaDat], ['08f-tong-ket', 'Phần 3F · Tổng kết', TongKet], ['08g-y-kien', 'Phần 4 · Ý kiến cá nhân', YKien], ['09-nhan-xet', 'Phần 5 · Nhận xét chung', NhanXet]] as const;
// The user's cloned voice (+2 semitones) for every segment (picked after listening, 2026-11-03); the Quốc Tuấn
// placeholder takes stay in body-takes.json for reference only.
const voiceFor = (seg: string) => [`${seg}-sang2`, seg].find((id) => takeOf(id));

const parts = (p: EpisodeProps, fps: number) => {
  // speaking: whether narration is heard at a local frame of the part (body music dips under it); unset = intro/outro.
  const list: {name: string; frames: number; node: ReactElement; speaking?: (frame: number) => boolean}[] = [
    {name: 'Intro series', frames: introFrames(p.introVoice, fps), node: <BookInsightsIntro voice={p.introVoice} channelLabel={p.channelLabel} />},
  ];
  // How this episode works (user 2026-11-02), between the series intro and the episode card, once its take exists.
  const howVoice = voiceFor('01b-cach-lam');
  if (howVoice) list.push({name: 'Cách làm của tập', frames: CachLam.frames(howVoice, fps), node: <CachLam voice={howVoice} channelLabel={p.channelLabel} />, speaking: (f) => CachLam.speaking(howVoice, f, fps)});
  list.push(
    {name: 'Thẻ tập', frames: cardFrames(p.cardVoice, fps), node: <BookInsightsEpisodeCard voice={p.cardVoice} channelLabel={p.channelLabel} episodeLabel={p.episodeLabel} bookTitle={p.bookTitle} bookAuthor={p.bookAuthor} />, speaking: () => true},
    {name: 'Mở chuyện', frames: moChuyenFrames(p.bodyVoice, fps), node: <BookHvttMoChuyen voice={p.bodyVoice} channelLabel={p.channelLabel} />, speaking: (f) => moChuyenSpeaking(p.bodyVoice, f, fps)},
  );
  for (const [seg, name, Section] of BODY) {
    const voice = voiceFor(seg);
    if (voice) list.push({name, frames: Section.frames(voice, fps), node: <Section voice={voice} channelLabel={p.channelLabel} />, speaking: (f) => Section.speaking(voice, f, fps)});
  }
  list.push({name: 'Outro series', frames: outroFrames(p.outroVoice, fps), node: <BookInsightsOutro voice={p.outroVoice} channelLabel={p.channelLabel} />});
  return list;
};
export const episodeMetadata: CalculateMetadataFunction<EpisodeProps> = ({props}) => ({durationInFrames: parts(props, 30).reduce((n, x) => n + x.frames, 0)});

// Progress of the whole episode along the bottom edge (user 2026-11-02): a thin gold line with a tick at every
// part boundary. Drawn outside the zoomed stage so the zoom never crops it.
const Progress: FC<{starts: number[]; total: number}> = ({starts, total}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, background: 'rgba(241,231,210,.14)'}}>
      <div style={{height: '100%', width: `${Math.min(1, frame / total) * 100}%`, background: GOLD}} />
      {starts.slice(1).map((s) => <div key={s} style={{position: 'absolute', left: `${s / total * 100}%`, bottom: 0, width: 2, height: 11, translate: '-1px 0', background: frame >= s ? GOLD : 'rgba(241,231,210,.45)'}} />)}
    </div>
  </AbsoluteFill>;
};

// Very quiet music under the body (user 2026-11-02; track in body-music.json), from the first part after the series intro to the end of the
// last body part; body-music.json holds the volumes (speech / rests) and fades. Volume follows the narration of
// whichever part is playing, averaged over ±8 frames so it never jumps at a sentence edge.
const BodyMusic: FC<{list: ReturnType<typeof parts>; starts: number[]}> = ({list, starts}) => {
  const body = list.map((x, i) => ({...x, start: starts[i]})).filter((x) => x.speaking);
  const from = body.length ? body[0].start : 0, to = body.length ? body[body.length - 1].start + body[body.length - 1].frames : 0;
  // Volume per frame of the clip, computed once: narration on/off, then a ±8-frame moving average. Passed as a number
  // for the current frame, like the intro: a volume function is a new prop on every render and sent the Studio
  // player into "Maximum update depth exceeded".
  const frame = useCurrentFrame();
  const key = body.map((b) => `${b.name}:${b.start}:${b.frames}`).join('|');
  const volumes = useMemo(() => {
    const n = Math.max(0, to - from), on = new Float32Array(n);
    for (const b of body) for (let f = 0; f < b.frames; f++) if (b.speaking?.(f)) on[b.start - from + f] = 1;
    const out = new Float32Array(n);let sum = 0;
    for (let i = -8; i < n; i++) {
      if (i + 8 < n) sum += on[i + 8];
      if (i - 9 >= 0) sum -= on[i - 9];
      if (i >= 0) out[i] = bodyMusic.pauseVolume - (bodyMusic.pauseVolume - bodyMusic.speechVolume) * (sum / 17);
    }
    return out;
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!body.length) return null;
  return <Track name={`Nhạc nền nội dung · ${bodyMusic.credit.artists.join(", ")} – ${bodyMusic.credit.title} · rất nhỏ, chỉnh đầu/cuối trong Edit`}>
    <MusicFade fadeInSeconds={bodyMusic.fadeInSeconds} fadeOutSeconds={bodyMusic.fadeOutSeconds}>
      <Audio name={`${bodyMusic.credit.artists.join(", ")} – ${bodyMusic.credit.title} (nhạc nền nội dung)`} src={staticFile(bodyMusic.file)} from={from} durationInFrames={to - from}
        volume={volumes[Math.min(volumes.length - 1, Math.max(0, frame - from))] ?? bodyMusic.pauseVolume} playbackRate={bodyMusic.playbackRate} loop />
    </MusicFade>
  </Track>;
};

export const BookHvttEpisode: FC<EpisodeProps> = (p) => {
  const {fps} = useVideoConfig();
  const list = parts(p, fps), starts = list.reduce<number[]>((acc, x) => [...acc, acc[acc.length - 1] + x.frames], [0]);
  return <AbsoluteFill>
    <AbsoluteFill
      style={{
        background: '#0d1411',
        scale: 1.045
      }}
    >
      {list.map((part, i) => <Sequence key={part.name} name={part.name} from={starts[i]} durationInFrames={part.frames}>{part.node}</Sequence>)}
    </AbsoluteFill>
    <BodyMusic list={list} starts={starts} />
    <Progress starts={starts.slice(0, -1)} total={starts[starts.length - 1]} />
  </AbsoluteFill>;
};
