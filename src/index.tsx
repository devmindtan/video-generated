import React from 'react';
import {StoicVideo} from './StoicVideo';
import {StoicThumbnail} from './StoicThumbnail';
import {AbsoluteFill, Composition, Still, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig} from 'remotion';

const HelloVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame, fps, config: {damping: 18}});
  const opacity = interpolate(frame, [120, 149], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#0b1020', color: '#f6f7fb', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif'}}>
      <div style={{position: 'absolute', width: 580, height: 580, borderRadius: '50%', background: '#6554ed', filter: 'blur(110px)', opacity: 0.35, transform: `translateX(${Math.sin(frame / 25) * 160}px)`}} />
      <div style={{textAlign: 'center', opacity, transform: `translateY(${(1 - entrance) * 70}px) scale(${0.9 + entrance * 0.1})`}}>
        <div style={{color: '#a9a1ff', fontSize: 25, letterSpacing: 8}}>VIDEO PLAYGROUND</div>
        <h1 style={{fontSize: 92, margin: '28px 0'}}>Xin chào, video!</h1>
        <p style={{fontSize: 30, color: '#bfc7db'}}>Ý tưởng của bạn. Chuyển động của bạn.</p>
      </div>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => <>
  <Composition id="StoicSilence" component={StoicVideo} durationInFrames={1350} fps={30} width={1080} height={1920} />
  <Still id="StoicThumbnail" component={StoicThumbnail} width={1080} height={1920} />
  <Composition id="HelloVideo" component={HelloVideo} durationInFrames={150} fps={30} width={1920} height={1080} />
</>;
registerRoot(Root);
