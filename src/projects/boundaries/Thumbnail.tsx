import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const BoundariesThumbnail: React.FC = () => <AbsoluteFill style={{background: '#020304', color: '#f2eee6', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('boundaries/images/01-cage-closed.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.045, transformOrigin: '50% 31%'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,2,3,.02), rgba(1,2,3,.12) 38%, rgba(1,2,3,.74) 62%, #020304 94%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 27%, transparent 18%, rgba(0,0,0,.2) 54%, rgba(0,0,0,.72) 100%)'}} />
  <div style={{position: 'absolute', top: 98, left: 78, display: 'flex', alignItems: 'center', gap: 18}}><div style={{width: 54, height: 3, background: '#cc7267'}} /><div style={{color: '#ddb66d', fontSize: 26, letterSpacing: 4.6}}>QUY TẮC NGẦM</div></div>
  <div style={{position: 'absolute', left: 78, right: 62, top: 1025}}>
    <div style={{fontSize: 53, letterSpacing: 5, color: '#ddb66d', marginBottom: 18}}>ĐỪNG ĐỂ LÒNG TỐT</div>
    <div style={{fontSize: 114, fontWeight: 700, lineHeight: 1.02, letterSpacing: -5.1, textShadow: '0 8px 36px rgba(0,0,0,.98)'}}>TRỞ THÀNH</div>
    <div style={{fontSize: 116, fontWeight: 700, lineHeight: 1.02, letterSpacing: -5.2, color: '#d37b70', textShadow: '0 8px 36px rgba(0,0,0,.98)'}}>NGHĨA VỤ</div>
    <div style={{marginTop: 35, width: 116, height: 3, background: '#ddb66d'}} />
    <div style={{marginTop: 28, fontSize: 40, lineHeight: 1.42}}>Tử tế không có nghĩa là<br /><span style={{color: '#ddb66d'}}>luôn phải nói “có”.</span></div>
  </div>
</AbsoluteFill>;
