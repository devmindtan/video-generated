import type {FC} from 'react';
import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, Track, interpolate, staticFile} from 'remotion';
import audio from './audio.json';
import captionsData from './captions.json';

const FPS = 30;
const DURATION_FRAMES = 958;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

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

// The customer's own sound (music bed, whooshes, lid clicks, sparkle) stays; it dips only under Adam's lines.
export const sourceAudioVolume = (frame: number): number => {
  const seconds = frame / FPS;
  const voiceActivity = Math.max(0, ...captionsData.flatMap((group, sceneIndex) => group.map((caption) => {
    const start = voiceCues[sceneIndex][1] + caption.startMs / 1000;
    const end = voiceCues[sceneIndex][1] + caption.endMs / 1000;
    return interpolate(seconds, [start - 0.12, start + 0.12, end - 0.12, end + 0.12], [0, 1, 1, 0], clamp);
  })));
  const ducked = audio.sourcePauseVolume - (audio.sourcePauseVolume - audio.sourceSpeechVolume) * voiceActivity;
  const fadeOut = interpolate(seconds, [DURATION_FRAMES / FPS - audio.sourceEdgeFadeSeconds, DURATION_FRAMES / FPS], [1, 0], clamp);
  return ducked * fadeOut;
};

export const FlowerKnowsPowderVideo: FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Video
      name="Hình gốc"
      src={staticFile('flower-knows-powder/video/source.mp4')}
      muted
      durationInFrames={DURATION_FRAMES}
      style={{width: '100%', height: '100%', objectFit: 'contain'}}
    />
    <Audio
      name="Âm thanh gốc · hiệu ứng của khách"
      src={staticFile(audio.sourceFile)}
      durationInFrames={DURATION_FRAMES}
      volume={sourceAudioVolume}
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
