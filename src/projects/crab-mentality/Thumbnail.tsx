import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const CrabMentalityThumbnail: React.FC = () => <AbsoluteFill style={{background: '#020304', color: '#f3efe7', fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
  <CanvasImage src={staticFile('crab-mentality/images/02-crabs-near-rim.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.08, translate: '0px -60px', transformOrigin: '50% 25%'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,2,3,.02), rgba(1,2,3,.2) 36%, rgba(1,2,3,.86) 68%, #020304 100%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 27%, transparent 18%, rgba(0,0,0,.52) 100%)'}} />
  <div style={{position: 'absolute', left: 76, right: 70, top: 1035}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, color: '#d9ae68', fontSize: 23, fontWeight: 550, letterSpacing: 3.5, marginBottom: 23}}><span style={{width: 52, height: 4, background: '#bc5151'}} />HIỆU ỨNG “CUA TRONG RỌ”</div>
    <div style={{fontSize: 84, lineHeight: 1.07, fontWeight: 780, letterSpacing: -3.4, textShadow: '0 8px 34px #000'}}>Vì sao họ sợ<br />bạn <span style={{color: '#d9ae68'}}>thành công?</span></div>
  </div>
  <div style={{position: 'absolute', left: 78, bottom: 112, fontSize: 24, letterSpacing: 3.1, color: '#d9ae68'}}>TÂM LÝ CUỘC SỐNG</div>
</AbsoluteFill>;

