import {ThreeCanvas} from '@remotion/three';
import type {FC} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {NightVoyageScene} from './Scene';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const PaperBoatNightVoyageVideo: FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const dawn = interpolate(frame, [21 * fps, 30 * fps], [0, 1], clamp);

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, rgb(${5 + dawn * 92}, ${13 + dawn * 84}, ${31 + dawn * 80}) 0%, rgb(${8 + dawn * 78}, ${28 + dawn * 73}, ${48 + dawn * 62}) 52%, #07121d 100%)`, overflow: 'hidden'}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: true, alpha: true}} style={{position: 'absolute', inset: 0}}>
        <NightVoyageScene />
      </ThreeCanvas>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, transparent 24%, rgba(1,5,12,.15) 65%, rgba(1,4,10,.62) 100%)', pointerEvents: 'none'}} />
      <div style={{position: 'absolute', left: 92, top: 82, color: '#edf7fa', fontFamily: 'Arial, sans-serif', opacity: interpolate(frame, [0.8 * fps, 2.3 * fps, 6.4 * fps, 7.8 * fps], [0, 1, 1, 0], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: `0 ${interpolate(frame, [0.8 * fps, 2.3 * fps], [22, 0], clamp)}px`}}>
        <div style={{fontSize: 44, letterSpacing: 11, fontWeight: 600, color: '#9dc9d7'}}>MỘT CHUYẾN ĐI KHÔNG LỜI</div>
        <div style={{marginTop: 16, fontSize: 96, letterSpacing: -3.4, fontWeight: 700}}>VƯỢT BIỂN ĐÊM</div>
      </div>
      <div style={{position: 'absolute', left: 100, right: 100, bottom: 80, textAlign: 'center', color: '#fff7e7', fontFamily: 'Arial, sans-serif', opacity: interpolate(frame, [24.2 * fps, 26.2 * fps, 29.2 * fps, 30 * fps], [0, 1, 1, 0], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: `0 ${interpolate(frame, [24.2 * fps, 26.2 * fps], [26, 0], clamp)}px`, textShadow: '0 3px 24px rgba(10,18,24,.82)'}}>
        <div style={{fontSize: 86, lineHeight: 1.08, letterSpacing: -2.4, fontWeight: 700}}>ÁNH SÁNG Ở PHÍA TRƯỚC</div>
        <div style={{marginTop: 15, fontSize: 44, letterSpacing: 10, fontWeight: 600, color: '#ffdba6'}}>CỨ ĐI THÊM MỘT CHÚT</div>
      </div>
    </AbsoluteFill>
  );
};
