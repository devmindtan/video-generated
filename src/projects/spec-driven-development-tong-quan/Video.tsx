import type {FC} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, Track, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import {MusicFade} from '../../shared/MusicFade';
import {FONT, ThemeBackground, ThemeCaption} from '../../looks/looks';
import {DiagramPacket, DiagramWire, Label, grow} from '../../looks/diagram-kit';
import {Stage, THEME} from './common';
import type {Seg} from './common';
import {BatDauNho, Brownfield, Greenfield, MoDau, SauNguyenTac, SpecLaGi, VanHanh, VibeCoding} from './Chapters';
import captionsData from './captions.json';
import timingData from './timing.json';
import music from './music.json';

// Spec Driven Development: tóm tắt cả cuốn sách. Theme "Bản vẽ kỹ thuật", style "Sơ đồ hệ thống động" (src/looks).
// Each narration segment is one audio file (make-voice, Minh Đức); picture beats start on sentence times from
// timing.json (scripts/projects/spec-driven-development-tong-quan/sentence-times.py), so re-voicing keeps them in place.
// Built part by part: the title card and the opening first (long-video 30-second gate), the rest after the user's go-ahead.

type Page = {part: string; text: string; startMs: number; endMs: number};
const TIMING = timingData as {titleSeconds: number; endPadSeconds: number; segments: Record<string, Seg>};
const TITLE_SECONDS = TIMING.titleSeconds;
const CAPTIONS = (captionsData as {pages: Page[]}).pages;
// Segments in script order; a segment is shown once its narration exists in timing.json.
const SEGMENTS = [
  {id: '00-mo-dau', label: 'MỞ ĐẦU', node: (s: Seg) => <MoDau s={s} />},
  {id: '01-vibe-coding-va-cai-bay-cua-toc-do', label: '1 · CÁI BẪY CỦA TỐC ĐỘ', node: (s: Seg) => <VibeCoding s={s} />},
  {id: '02-spec-la-gi-va-vi-sao-can-ngon-ngu-chung', label: '2 · SPEC LÀ GÌ', node: (s: Seg) => <SpecLaGi s={s} />},
  {id: '03-sau-nguyen-tac-spec-driven', label: '3 · SÁU NGUYÊN TẮC', node: (s: Seg) => <SauNguyenTac s={s} />},
  {id: '04-greenfield-bat-dau-tu-con-so-khong', label: '4 · DỰ ÁN MỚI', node: (s: Seg) => <Greenfield s={s} />},
  {id: '05-brownfield-lam-voi-ma-cu', label: '5 · MÃ CŨ', node: (s: Seg) => <Brownfield s={s} />},
  {id: '06-van-hanh-team-spec-driven-hang-ngay', label: '6 · VẬN HÀNH HẰNG NGÀY', node: (s: Seg) => <VanHanh s={s} />},
  {id: '07-khi-nao-nen-khi-nao-khong-va-bat-dau-nho', label: 'KHÉP LẠI', node: (s: Seg) => <BatDauNho s={s} />},
].filter((x) => TIMING.segments[x.id]);
const KEYWORDS = ['Spec Driven Development', 'tiêu chí nghiệm thu', 'vibe coding', 'use case', 'waterfall', 'refactor', 'adapter', 'nghiệp vụ', 'ý định', 'SDD', 'spec', 'test', 'AI'];

// ---- title card -------------------------------------------------------------------------------------------
const TitleCard: FC = () => {
  const f = useCurrentFrame(), t = THEME, p = t.palette, out = 1 - grow(f, 170, 195);
  const steps: [string, number, string][] = [['người', 300, p.ink], ['spec', 760, p.accent], ['AI', 1220, p.accent2], ['code', 1640, p.muted]];
  return <AbsoluteFill style={{opacity: out}}>
    <Stage>
      <g opacity={.4}>
        {steps.map(([label, x, c], k) => <g key={k} opacity={grow(f, k * 6, k * 6 + 12)}>
          <rect x={x - 130} y={235} width={260} height={130} rx={20} fill={p.surface} stroke={c} strokeWidth={4} />
          <Label t={t} x={x} y={312} size={40} color={k === 1 ? p.accent : p.ink}>{label}</Label>
          {k ? <DiagramWire t={t} f={f} pts={[[steps[k - 1][1] + 134, 300], [x - 134, 300]]} at={k * 6 + 6} /> : null}</g>)}
        <DiagramPacket t={t} f={f} pts={[[434, 300], [626, 300]]} at={30} period={40} count={1} />
      </g>
      <Label t={t} x={960} y={610} size={124} opacity={grow(f, 18, 40)}>Spec Driven</Label>
      <Label t={t} x={960} y={760} size={124} color={p.accent} opacity={grow(f, 32, 54)}>Development</Label>
      <Label t={t} x={960} y={850} size={44} weight={400} color={p.ink} opacity={grow(f, 48, 70)}>Tóm tắt cả cuốn sách · Nguyễn Thế Huy</Label>
    </Stage>
  </AbsoluteFill>;
};

// ---- captions, chapter label, progress --------------------------------------------------------------------
const Captions: FC = () => {
  const f = useCurrentFrame(), {fps} = useVideoConfig(), ms = f / fps * 1000;
  const page = CAPTIONS.find((x) => ms >= x.startMs && ms < x.endMs + 120);
  if (!page) return null;
  const kw = KEYWORDS.find((k) => page.text.includes(k)) ?? '';
  return <ThemeCaption theme={THEME} text={page.text} keyword={kw} top={930} size={52} />;
};
const ChapterTag: FC<{label: string}> = ({label}) => {
  const f = useCurrentFrame(), p = THEME.palette;
  return <div style={{position: 'absolute', left: 64, top: 44, fontFamily: FONT, fontWeight: 700, fontSize: 34, letterSpacing: 3, color: p.accent2, opacity: grow(f, 4, 20)}}>{label}</div>;
};

// ---- the whole review build -------------------------------------------------------------------------------
const plan = (fps: number) => SEGMENTS.map((seg) => {
  const s = TIMING.segments[seg.id];
  return {...seg, s, from: Math.round(s.start * fps), frames: Math.round((s.start + s.length) * fps) - Math.round(s.start * fps)};
});
export const totalFrames = (fps: number) => {const p = plan(fps), last = p[p.length - 1];return last.from + last.frames + Math.round(TIMING.endPadSeconds * fps);};
export const metadata: CalculateMetadataFunction<Record<string, unknown>> = ({props}) => ({durationInFrames: totalFrames(30), props});

const Music: FC = () => {
  const {fps, durationInFrames} = useVideoConfig(), m = music as typeof music;
  const voiceIn = Math.round(TITLE_SECONDS * fps);
  // Loud on the title card, down to the steady bed by the time the voice starts; flat under narration.
  const volume = (f: number) => f < voiceIn - 30 ? m.titleVolume : f < voiceIn + 20 ? m.titleVolume + (m.speechVolume - m.titleVolume) * (f - voiceIn + 30) / 50 : m.speechVolume;
  const title = `${m.credit.artists.join(', ')} – ${m.credit.title}`;
  return <Track name={`Nhạc nền · ${title} · chỉnh đầu/cuối trong Edit`}>
    <MusicFade fadeInSeconds={m.fadeInSeconds} fadeOutSeconds={m.fadeOutSeconds}>
      <Audio name={title} src={staticFile(m.file)} from={0} durationInFrames={durationInFrames} volume={volume} loop />
    </MusicFade>
  </Track>;
};

const Progress: FC<{total: number}> = ({total}) => {
  const f = useCurrentFrame(), p = THEME.palette;
  return <div style={{position: 'absolute', left: 0, bottom: 0, height: 6, width: `${100 * f / total}%`, background: p.accent2, opacity: .7}} />;
};

export const SpecDrivenDevelopmentVideo: FC = () => {
  const {fps} = useVideoConfig(), parts = plan(fps), total = totalFrames(fps), f = useCurrentFrame();
  return <AbsoluteFill style={{background: THEME.palette.background, fontFamily: FONT}}>
    <ThemeBackground theme={THEME} frame={f} />
    <Sequence name="Màn tên video" durationInFrames={Math.round(TITLE_SECONDS * fps) + 10}><TitleCard /></Sequence>
    {parts.map((x) => <Sequence key={x.id} name={x.id} from={x.from} durationInFrames={x.frames}>
      <AbsoluteFill>{x.node(x.s)}</AbsoluteFill>
      <ChapterTag label={x.label} />
      <Audio name={`Giọng · ${x.id}`} src={staticFile(`spec-driven-development-tong-quan/audio/${x.s.file}`)} />
    </Sequence>)}
    <Captions />
    <Music />
    <Progress total={total} />
  </AbsoluteFill>;
};
