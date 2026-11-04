import type {FC} from 'react';
import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, Track, staticFile} from 'remotion';
import audio from './audio.json';

const FPS = 30;
const DURATION_FRAMES = 773;

// Scene bounds follow the picture cuts; the CapCut end card (from frame 773) is trimmed.
const voiceCues = [
  ['01-greeting-voice-full.wav', 0, 5.3],
  ['02-unbox-voice-full.wav', 5.4, 2.8],
  ['03-mirror-voice-full.wav', 8.2, 4.5],
  ['04-relief-voice-full.wav', 12.7, 7.6],
  ['05-heart-voice-full.wav', 20.3, 3.9],
  ['06-outro-voice-full.wav', 24.2, 1.5],
] as const;

export const FlowerKnowsSwanMirrorVideo: FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Video
      name="Hình gốc"
      src={staticFile('flower-knows-swan-mirror/video/source.mp4')}
      muted
      durationInFrames={DURATION_FRAMES}
      style={{width: '100%', height: '100%', objectFit: 'contain'}}
    />
    {/* The customer's sound stays as delivered: full level, no ducking or cleanup. */}
    <Audio
      name="Âm thanh gốc · giữ nguyên"
      src={staticFile('flower-knows-swan-mirror/audio/source-audio.wav')}
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
          src={staticFile(`flower-knows-swan-mirror/audio/${file}`)}
          volume={audio.voiceVolume}
        />
      ))}
    </Track>
  </AbsoluteFill>
);
