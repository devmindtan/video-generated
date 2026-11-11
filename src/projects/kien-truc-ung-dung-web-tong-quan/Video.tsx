import type {FC} from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Img, Sequence, Track, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CalculateMetadataFunction} from 'remotion';
import {MusicFade} from '../../shared/MusicFade';
import {FONT, ThemeBackground, ThemeCaption} from '../../looks/looks';
import {Chip, DiagramNode, DiagramPacket, DiagramWire, Label, MONO, Mark, fade, grow} from '../../looks/diagram-kit';
import {Stage, THEME, useBeat} from './common';
import type {Seg} from './common';
import {ApplicationService, BaTang, DomainModel, DocVaGhi, KhacPhuc, KhepLai, MoDau, PortsAdapters, Repository, TranLan} from './Chapters';
import captionsData from './captions.json';
import timingData from './timing.json';
import music from './music.json';

// Kiến trúc ứng dụng web: tóm tắt cả cuốn sách. Theme "Bản vẽ kỹ thuật", style "Sơ đồ hệ thống động" (src/looks).
// Each narration segment is one audio file (make-voice, Minh Đức); picture beats start on sentence times from
// timing.json (scripts/projects/kien-truc-ung-dung-web-tong-quan/sentence-times.py), so re-voicing keeps them in
// place. The layout and the timeline captions come from sentence-times.py; the chapters live in Chapters.tsx.

type Page = {part: string; text: string; startMs: number; endMs: number};
const TIMING = timingData as {titleSeconds: number; endPadSeconds: number; segments: Record<string, Seg>};
const TITLE_SECONDS = TIMING.titleSeconds;
const CAPTIONS = (captionsData as {pages: Page[]}).pages;
// Segments in script order; a segment is shown once its narration exists in timing.json.
const SEGMENTS = [
  {id: '00-mo-dau', label: 'MỞ ĐẦU', node: (s: Seg) => <MoDau s={s} />},
  {id: '01-khi-nghiep-vu-va-ha-tang-nam-chung', label: 'CHƯƠNG 1 · TRỘN LẪN', node: (s: Seg) => <TranLan s={s} />},
  {id: '02-ranh-gioi-core-va-ha-tang', label: 'CHƯƠNG 2 · RANH GIỚI', node: (s: Seg) => <KhacPhuc s={s} />},
  {id: '03-domain-model-de-doi-tuong-tu-bao-ve', label: 'CHƯƠNG 3 · DOMAIN MODEL', node: (s: Seg) => <DomainModel s={s} />},
  {id: '04-repository-kho-cua-doi-tuong-nghiep-vu', label: 'CHƯƠNG 3 · REPOSITORY', node: (s: Seg) => <Repository s={s} />},
  {id: '05-doc-va-ghi-khong-nhat-thiet-dung-chung-mot-mo-hinh', label: 'CHƯƠNG 4 · ĐỌC VÀ GHI', node: (s: Seg) => <DocVaGhi s={s} />},
  {id: '06-application-service-va-command', label: 'CHƯƠNG 5 · USE CASE', node: (s: Seg) => <ApplicationService s={s} />},
  {id: '07-ba-tang-va-luat-phu-thuoc-mot-chieu', label: 'CHƯƠNG 6 · BA TẦNG', node: (s: Seg) => <BaTang s={s} />},
  {id: '08-ports-and-adapters-loi-o-giua-moi-thu-cam-vao', label: 'CHƯƠNG 7 · PORTS & ADAPTERS', node: (s: Seg) => <PortsAdapters s={s} />},
  {id: '09-khep-lai', label: 'KHÉP LẠI', node: (s: Seg) => <KhepLai s={s} />},
].filter((x) => TIMING.segments[x.id]);
const KEYWORDS = ['Domain Model', 'Value Object', 'value object', 'Application Service', 'Dependency Rule', 'Ports and Adapters', 'Hexagonal',
  'Repository', 'repository', 'interface', 'adapter', 'Adapter', 'port', 'Port', 'core code', 'hạ tầng', 'nghiệp vụ', 'database',
  'framework', 'controller', 'Controller', 'entity', 'Entity', 'test', 'SQL', 'MySQL', 'Laravel', 'PHP', 'POPO', 'CQRS', 'DTO',
  'Read Model', 'View Model', 'Dependency Injection', 'service locator', 'use case', 'aggregate', 'domain event', 'bounded context',
  'CRUD', 'legacy', 'kiến trúc', 'tách', 'Command', 'transaction', 'session', 'job', 'mail'];

// ---- title card -------------------------------------------------------------------------------------------
const TitleCard: FC = () => {
  const f = useCurrentFrame(), t = THEME, p = t.palette, out = 1 - grow(f, 170, 195);
  return <AbsoluteFill style={{opacity: out}}>
    <Stage>
      <g opacity={.4}>
        <DiagramWire t={t} f={f} pts={[[440, 300], [700, 300]]} at={6} />
        <DiagramWire t={t} f={f} pts={[[860, 300], [1080, 300]]} at={12} />
        <DiagramWire t={t} f={f} pts={[[1220, 300], [1440, 300]]} at={18} />
        <DiagramNode t={t} f={f} x={340} y={300} w={200} h={130} kind="service" label="Controller" labelSize={30} at={0} />
        <DiagramNode t={t} f={f} x={780} y={300} w={160} h={130} kind="none" at={4} state="key" />
        <Label t={t} x={780} y={306} size={34} mono color={p.accent}>{"{ }"}</Label>
        <DiagramNode t={t} f={f} x={1160} y={300} w={160} h={130} kind="box" label="Domain" labelSize={30} at={8} state="key" />
        <DiagramNode t={t} f={f} x={1540} y={300} w={180} h={130} kind="db" label="Database" labelSize={30} at={12} />
        <DiagramPacket t={t} f={f} pts={[[440, 300], [700, 300]]} at={30} period={40} count={1} />
        <DiagramPacket t={t} f={f} pts={[[860, 300], [1080, 300]]} at={38} period={40} count={1} />
        <Label t={t} x={590} y={390} size={28} weight={400} color={p.muted}>request</Label>
        <Label t={t} x={1010} y={390} size={28} weight={400} color={p.muted}>lõi</Label>
        <Label t={t} x={1370} y={390} size={28} weight={400} color={p.muted}>adapter</Label>
      </g>
      <Label t={t} x={960} y={640} size={124} opacity={grow(f, 18, 40)}>Kiến trúc</Label>
      <Label t={t} x={960} y={740} size={124} color={p.accent} opacity={grow(f, 32, 54)}>ứng dụng web</Label>
      <Label t={t} x={960} y={825} size={44} weight={400} color={p.ink} opacity={grow(f, 48, 70)}>Tóm tắt cả cuốn sách · Nguyễn Thế Huy</Label>
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

export const KienTrucUngDungWebVideo: FC = () => {
  const {fps} = useVideoConfig(), parts = plan(fps), total = totalFrames(fps), f = useCurrentFrame();
  return <AbsoluteFill style={{background: THEME.palette.background, fontFamily: FONT}}>
    <ThemeBackground theme={THEME} frame={f} />
    <Sequence name="Màn tên video" durationInFrames={Math.round(TITLE_SECONDS * fps) + 10}><TitleCard /></Sequence>
    {parts.map((x) => <Sequence key={x.id} name={x.id} from={x.from} durationInFrames={x.frames}>
      <AbsoluteFill>{x.node(x.s)}</AbsoluteFill>
      <ChapterTag label={x.label} />
      <Audio name={`Giọng · ${x.id}`} src={staticFile(`kien-truc-ung-dung-web-tong-quan/audio/${x.s.file}`)} />
    </Sequence>)}
    <Captions />
    <Music />
    <Progress total={total} />
  </AbsoluteFill>;
};
