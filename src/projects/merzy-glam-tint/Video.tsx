import type {FC} from 'react';
import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, Track, staticFile} from 'remotion';
import audio from './audio.json';

// 60 fps keeps every frame of the customer's variable-rate footage (up to ~39 fps); 30 fps dropped them.
const FPS = 60;

const voiceCues = [
  ['01-greeting-voice-full.wav', 0, 4],
  ['02-ribbon-voice-full.wav', 4, 5],
  ['03-product-voice-full.wav', 9, 4],
  ['04-swatch-voice-full.wav', 13, 6],
  ['05-korea-voice-full.wav', 19, 3],
  ['06-outro-voice-full.wav', 22, 4],
] as const;

export const MerzyGlamTintVideo: FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Video
      name="Hình gốc · Audio đã tắt"
      src={staticFile('merzy-glam-tint/video/source.mp4')}
      muted
      durationInFrames={1571}
      style={{width: '100%', height: '100%', objectFit: 'contain'}}
    />
    <Track name="Adam bựa · VieNeu local">
      {voiceCues.map(([file, at, duration]) => (
        <Audio
          key={file}
          name={file.replace('-voice-full.wav', '')}
          from={at * FPS}
          durationInFrames={duration * FPS}
          src={staticFile(`merzy-glam-tint/audio/${file}`)}
          volume={audio.voiceVolume}
        />
      ))}
    </Track>
  </AbsoluteFill>
);
