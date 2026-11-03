import type {FC} from 'react';
import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, Track, staticFile} from 'remotion';
import audio from './audio.json';

const FPS = 30;
const DURATION_FRAMES = 638;

// Scene bounds follow the picture cuts; 4.5–5.6 s is left to the cat-paw transition sound.
const voiceCues = [
  ['01-greeting-voice-full.wav', 0, 4.5],
  ['02-case-voice-full.wav', 5.6, 3.6],
  ['03-two-ends-voice-full.wav', 9.2, 3.3],
  ['04-tint-voice-full.wav', 12.5, 3.6],
  ['05-gloss-end-voice-full.wav', 16.1, 2.2],
  ['06-outro-voice-full.wav', 18.3, 2.9],
] as const;

export const FlowerKnowsLipDuoVideo: FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Video
      name="Hình gốc"
      src={staticFile('flower-knows-lip-duo/video/source.mp4')}
      muted
      durationInFrames={DURATION_FRAMES}
      style={{width: '100%', height: '100%', objectFit: 'contain'}}
    />
    {/* The customer's sound stays as delivered: full level, no ducking or cleanup. */}
    <Audio
      name="Âm thanh gốc · giữ nguyên"
      src={staticFile('flower-knows-lip-duo/audio/source-audio.wav')}
      durationInFrames={DURATION_FRAMES}
      volume={audio.sourceVolume}
    />
    <Track name="Adam bựa · VieNeu local">
      {voiceCues.map(([file, at, duration]) => (
        <Audio
          key={file}
          name={file.replace('-voice-full.wav', '')}
          from={Math.round(at * FPS)}
          durationInFrames={Math.round(duration * FPS)}
          src={staticFile(`flower-knows-lip-duo/audio/${file}`)}
          volume={audio.voiceVolume}
        />
      ))}
    </Track>
  </AbsoluteFill>
);
