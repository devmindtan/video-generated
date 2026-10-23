import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

/** Standalone portrait cover for the exhausted-day Stoic video. */
export const ExhaustedThumbnail: React.FC = () => (
  <AbsoluteFill style={{background: '#030609', color: '#f1eee7', fontFamily: 'Stoic Sans, sans-serif'}}>
    <CanvasImage
      src={staticFile('exhausted/images/01-stop.png')}
      style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.045, transformOrigin: '49% 27%'}}
    />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,4,7,.08) 0%, rgba(1,4,7,.03) 31%, rgba(2,5,8,.52) 53%, #030609 88%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 28%, transparent 20%, rgba(0,0,0,.22) 58%, rgba(0,0,0,.66) 100%)'}} />

    <div style={{position: 'absolute', top: 100, left: 76, display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{width: 54, height: 3, background: '#d9bd86'}} />
      <div style={{color: '#d9bd86', fontSize: 27, fontWeight: 600, letterSpacing: 5.4}}>STOIC · CHỮA LÀNH</div>
    </div>

    <div style={{position: 'absolute', left: 78, right: 72, top: 1050}}>
      <div style={{fontSize: 55, fontWeight: 500, letterSpacing: 7, color: '#d9bd86', marginBottom: 22}}>DÀNH CHO NHỮNG NGÀY</div>
      <div style={{fontSize: 112, fontWeight: 750, lineHeight: 1.03, letterSpacing: -4.5, textShadow: '0 7px 32px rgba(0,0,0,.9)'}}>BẠN THẤY</div>
      <div style={{fontSize: 139, fontWeight: 800, lineHeight: 1.08, letterSpacing: -6.5, color: '#e2c58d', textShadow: '0 8px 36px rgba(0,0,0,.95)'}}>KIỆT SỨC?</div>
      <div style={{marginTop: 38, width: 118, height: 3, background: '#d9bd86'}} />
      <div style={{marginTop: 30, fontSize: 42, fontWeight: 550, lineHeight: 1.42, color: '#e2ded5', textShadow: '0 4px 18px #000'}}>Nghỉ một chút.<br /><span style={{color: '#d9bd86'}}>Nhưng đừng bỏ cuộc.</span></div>
    </div>
  </AbsoluteFill>
);
