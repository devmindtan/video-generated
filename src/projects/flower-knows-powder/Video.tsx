import type {FC} from 'react';
import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, Track, staticFile} from 'remotion';
import audio from './audio.json';

const FPS = 30;

// Scene bounds follow the picture cuts in the customer's clip (seconds).
const voiceCues = [
  ['01-greeting-voice-full.wav', 0, 4],
  ['02-swan-lid-voice-full.wav', 4, 4],
  ['03-stroke-voice-full.wav', 8, 3.5],
  ['04-silver-rim-voice-full.wav', 11.5, 7.3],
  ['05-puff-voice-full.wav', 18.8, 4.6],
  ['06-snowflake-voice-full.wav', 23.4, 4.2],
  ['07-outro-voice-full.wav', 27.6, 4.3],
] as const;

export const FlowerKnowsPowderVideo: FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Video
      name="Hình gốc · Audio đã tắt"
      src={staticFile('flower-knows-powder/video/source.mp4')}
      muted
      durationInFrames={958}
      style={{width: '100%', height: '100%', objectFit: 'contain'}}
    />
    <Track name="Adam bựa · VieNeu local">
      {voiceCues.map(([file, at, duration]) => (
        <Audio
          key={file}
          name={file.replace('-voice-full.wav', '')}
          from={Math.round(at * FPS)}
          durationInFrames={Math.round(duration * FPS)}
          src={staticFile(`flower-knows-powder/audio/${file}`)}
          volume={audio.voiceVolume}
        />
      ))}
    </Track>
  </AbsoluteFill>
);
