import type {FC} from 'react';
import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, Track, staticFile} from 'remotion';
import audio from './audio.json';

const voiceCues = [
  ['01-greeting-voice-full.wav', 0, 5],
  ['02-product-voice-full.wav', 5, 5],
  ['03-ingredients-voice-full.wav', 10, 6],
  ['04-texture-voice-full.wav', 16, 5],
  ['05-apply-voice-full.wav', 21, 5],
  ['06-outro-voice-full.wav', 26, 4],
] as const;

const sfxCues = [
  ['Nhấc sản phẩm', 'pickup-whoosh.wav', 5.4],
  ['Lật nhãn', 'label-flip.wav', 8.15],
  ['Bật nắp', 'cap-click.wav', 11.05],
  ['Bóp kem', 'cream-squeeze.wav', 13.45],
  ['Tán kem', 'rub-soft.wav', 20.75],
  ['Hero sản phẩm', 'hero-sparkle.wav', 24],
  ['Kết', 'outro-pop.wav', 29.35],
] as const;

export const SkinCareNhuyVideo: FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    <Video
      name="Hình gốc · Audio đã tắt"
      src={staticFile('skin-care-nhuy/video/source.mp4')}
      muted
      durationInFrames={904}
      style={{width: '100%', height: '100%', objectFit: 'contain'}}
    />
    <Track name="Adam bựa · VieNeu local">
      {voiceCues.map(([file, at, duration]) => (
        <Audio
          key={file}
          name={file.replace('-voice-full.wav', '')}
          from={at * 30}
          durationInFrames={duration * 30}
          src={staticFile(`skin-care-nhuy/audio/${file}`)}
          volume={audio.voiceVolume}
        />
      ))}
    </Track>
    <Track name="SFX · Foley hành động và nhịp hài">
      {sfxCues.map(([name, file, at]) => (
        <Audio
          key={file}
          name={name}
          from={Math.round(at * 30)}
          src={staticFile(`skin-care-nhuy/sfx/${file}`)}
          volume={audio.sfxVolume}
        />
      ))}
    </Track>
  </AbsoluteFill>
);
