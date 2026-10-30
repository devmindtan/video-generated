import type {Caption} from '@remotion/captions';
import {Audio, Video} from '@remotion/media';
import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../shared/stoic-fonts';
import captions from './captions.json';
import chapters from './chapters.json';
import footage from './footage.json';
import music from './music.json';
import edit from './edit.json';
import cuts from './cuts-v3.json';

const clamp = {extrapolateLeft:'clamp', extrapolateRight:'clamp'} as const;
const starts = chapters.map(chapter => chapter.start);
type Clip = {src:string; sourceDurationSeconds:number; playbackRate:number; model:string};
const clips = footage as Record<string, Clip | null>;
const groups = captions as Caption[][];
const titles = chapters.map(chapter => chapter.title);

// Each independently editable shot can use real footage, or its storyboard image.
const Shot: FC<{index:number; slot?:number; close?:boolean; seconds:number}> = ({index,slot=0,close=false,seconds}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const cut=cuts[index].shots[slot];
  const clip = clips[edit.continuityV3?cut.key:close?chapters[index].closeShot:chapters[index].wideShot];
  const dissolve=edit.continuityV3?slot>0:close;
  if(clip) return <Video src={staticFile(clip.src)} muted playbackRate={edit.continuityV3?cut.rate:clip.sourceDurationSeconds/seconds} objectFit="contain" style={{width:'100%',height:'100%',opacity:dissolve?interpolate(frame,[0,edit.shotDissolveSeconds*fps],[0,1],clamp):1}} />;
  return <CanvasImage src={staticFile(`tiny-dino-homecoming/images/${chapters[index].id}.png`)} style={{width:'100%',height:'100%',objectFit:'contain',opacity:dissolve?interpolate(frame,[0,edit.shotDissolveSeconds*fps],[0,1],clamp):1}} />;
};

const ContinuationSlot:FC<{index:number;slot:number}>=({index,slot})=>{
  const {fps}=useVideoConfig();const shot=cuts[index].shots[slot];
  if(!shot)return null;
  return <Sequence name={`Diễn tiến ${slot+1} · ${shot.key}`} from={Math.round(shot.from*fps)} durationInFrames={Math.round(shot.duration*fps)}><Shot index={index} slot={slot} seconds={shot.duration}/></Sequence>;
};

const Atmosphere: FC<{rain:boolean}> = ({rain}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents:'none'}}>{Array.from({length:rain?90:22},(_,i)=><div key={i} style={{position:'absolute',left:random(`home-x-${i}`)*1920,top:rain?((random(`home-y-${i}`)*1180+frame*(12+i%5))%1180)-100:((random(`home-y-${i}`)*1100-frame*.5+1100)%1100),width:rain?2:4+i%4,height:rain?19:4+i%4,rotate:rain?'12deg':'0deg',borderRadius:9,background:rain?'#d0f1ff':'#fff0a4',opacity:rain?.2:.18+Math.sin(frame/20+i)**2*.36,boxShadow:rain?'none':'0 0 12px #ffd57a'}} />)}</AbsoluteFill>;
};

const Subtitles: FC<{index:number}> = ({index}) => {
  const frame = useCurrentFrame(); const {fps}=useVideoConfig();
  const now=frame/fps*1000;
  const caption=groups[index]?.find(c=>now>=c.startMs&&now<c.endMs);
  if(!caption) return null;
  return <div style={{position:'absolute',bottom:68,left:260,right:260,textAlign:'center',color:'#fff',fontSize:43,fontWeight:700,lineHeight:1.3,textShadow:'0 3px 10px #163b40'}}><span style={{display:'inline-block',padding:'14px 30px',borderRadius:24,background:'rgba(11,43,49,.85)',border:'1px solid rgba(255,255,255,.3)'}}>{caption.text}</span></div>;
};

const StoryScene: FC<{index:number; seconds:number}> = ({index,seconds}) => {
  const frame=useCurrentFrame(); const {fps}=useVideoConfig();
  const beat=seconds/2;
  const handle=index===chapters.length-1?0:edit.sceneDissolveSeconds;
  return <AbsoluteFill style={{overflow:'hidden',opacity:interpolate(frame,[0,edit.sceneDissolveSeconds*fps],[0,1],clamp)}}>
    {edit.continuityV3?<><ContinuationSlot index={index} slot={0}/><ContinuationSlot index={index} slot={1}/><ContinuationSlot index={index} slot={2}/><ContinuationSlot index={index} slot={3}/></>:<><Sequence name="Toàn cảnh · handle hòa góc" durationInFrames={Math.round((beat+edit.shotDissolveSeconds/2)*fps)}><Shot index={index} seconds={beat+edit.shotDissolveSeconds/2}/></Sequence>
    <Sequence name="Cận cảnh · hòa góc và nối chặng" from={Math.round((beat-edit.shotDissolveSeconds/2)*fps)} durationInFrames={Math.round((beat+edit.shotDissolveSeconds/2+handle)*fps)}><Shot index={index} close seconds={beat+edit.shotDissolveSeconds/2+handle}/></Sequence></>}
    <Atmosphere rain={index===6}/>
    <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(6,33,43,.22),transparent 25%,transparent 72%,rgba(4,26,36,.38))'}}/>
    <div style={{position:'absolute',left:80,top:55,color:'#fff4b8',fontSize:24,fontWeight:700,letterSpacing:2,textShadow:'0 2px 8px #143a42'}}>TÍ HON • TÌM ĐƯỜNG VỀ TỔ</div>
    <div style={{position:'absolute',left:80,top:110,color:'white',fontSize:62,fontWeight:700,textShadow:'0 3px 16px #174647',opacity:interpolate(frame,[0,.4*fps,3.5*fps,4.2*fps],[0,1,1,0],clamp)}}>{titles[index]}</div>
    <Subtitles index={index}/>
    <Audio name="Lời kể · Giọng B dễ thương" src={staticFile(`tiny-dino-homecoming/audio/childlike/${chapters[index].id}-voice-full.wav`)} durationInFrames={seconds*fps}/>
    {index===7?<AbsoluteFill style={{background:'#123c42',opacity:interpolate(frame,[(seconds-.8)*fps,seconds*fps-1],[0,1],clamp),pointerEvents:'none'}}/>:null}
  </AbsoluteFill>;
};

export const homecomingMusicVolume=(frame:number,fps:number):number=>{
  const t=frame/fps;
  const active=Math.max(0,...groups.flatMap((g,i)=>g.map(c=>interpolate(t,[starts[i]+c.startMs/1000-.12,starts[i]+c.startMs/1000,starts[i]+c.endMs/1000,starts[i]+c.endMs/1000+.25],[0,1,1,0],clamp))));
  return (music.pauseVolume+(music.speechVolume-music.pauseVolume)*active)*Math.min(interpolate(t,[0,music.fadeInSeconds],[0,1],clamp),interpolate(t,[180-music.fadeOutSeconds,180-1/fps],[1,0],clamp));
};

export const TinyDinoHomecomingVideo:FC=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();
  return <AbsoluteFill style={{background:'#123c42',fontFamily:'Stoic Sans, sans-serif'}}>
      <Sequence name="01 · Tí Hon chào đời" durationInFrames={Math.round((16+edit.sceneDissolveSeconds)*fps)}><StoryScene index={0} seconds={16}/></Sequence>
      <Sequence name="02 · Những bước chân đầu tiên" from={16*fps} durationInFrames={Math.round((18+edit.sceneDissolveSeconds)*fps)}><StoryScene index={1} seconds={18}/></Sequence>
      <Sequence name="03 · Gặp Bướm Xanh" from={34*fps} durationInFrames={Math.round((18+edit.sceneDissolveSeconds)*fps)}><StoryScene index={2} seconds={18}/></Sequence>
      <Sequence name="04 · Trượt lá và lạc đường" from={52*fps} durationInFrames={Math.round((18+edit.sceneDissolveSeconds)*fps)}><StoryScene index={3} seconds={18}/></Sequence>
      <Sequence name="05 · Vượt suối nấm" from={70*fps} durationInFrames={Math.round((32+edit.sceneDissolveSeconds)*fps)}><StoryScene index={4} seconds={32}/></Sequence>
      <Sequence name="06 · Ốc Sên chỉ đường" from={102*fps} durationInFrames={Math.round((28+edit.sceneDissolveSeconds)*fps)}><StoryScene index={5} seconds={28}/></Sequence>
      <Sequence name="07 · Chia sẻ chiếc ô" from={130*fps} durationInFrames={Math.round((24+edit.sceneDissolveSeconds)*fps)}><StoryScene index={6} seconds={24}/></Sequence>
      <Sequence name="08 · Đoàn tụ với mẹ" from={154*fps} durationInFrames={26*fps}><StoryScene index={7} seconds={26}/></Sequence>
    <Audio name="Nhạc gốc · Marimba → Piano mưa → Đoàn tụ" src={staticFile(music.file)} durationInFrames={180*fps} volume={homecomingMusicVolume(frame,fps)}/>
    <Audio name="SFX v2 · Foley hành động + ambience nối liền" src={staticFile(edit.sfxFile)} durationInFrames={180*fps} volume={edit.sfxVolume}/>
  </AbsoluteFill>;
};
