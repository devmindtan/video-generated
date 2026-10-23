import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const ReciprocityTrapThumbnail: React.FC = () => <AbsoluteFill style={{background: '#020304', color: '#f5f0e7', fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
  <CanvasImage src={staticFile('reciprocity-trap/images/01-apple-hooks.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.12, translate: '0px -58px', transformOrigin: '50% 26%'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,2,3,.02), rgba(1,2,3,.12) 35%, rgba(1,2,3,.86) 67%, #020304 100%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 27%, transparent 17%, rgba(0,0,0,.5) 100%)'}} />
  <div style={{position: 'absolute', left: 76, right: 70, top: 1025}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, color: '#dfb971', fontSize: 23, fontWeight: 550, letterSpacing: 3.5, marginBottom: 23}}><span style={{width: 52, height: 4, background: '#b8534f'}} />BẪY MANG ƠN</div>
    <div style={{fontSize: 83, lineHeight: 1.07, fontWeight: 780, letterSpacing: -3.4, textShadow: '0 8px 34px #000'}}>Đừng để món quà<br />lấy mất quyền <span style={{color: '#dfb971'}}>từ chối.</span></div>
  </div>
  <div style={{position: 'absolute', left: 78, bottom: 112, fontSize: 24, letterSpacing: 3.1, color: '#dfb971'}}>TÂM LÝ CUỘC SỐNG</div>
</AbsoluteFill>;
