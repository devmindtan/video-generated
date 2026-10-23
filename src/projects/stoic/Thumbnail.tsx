import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

/** Standalone portrait cover; typography remains editable in Remotion. */
export const StoicThumbnail: React.FC = () => (
  <AbsoluteFill style={{background: '#080909', color: '#f8f4ec', fontFamily: 'Stoic Sans, sans-serif'}}>
    <CanvasImage src={staticFile('stoic-control/images/01-control.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.04, transformOrigin: '50% 28%'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.12) 0%, transparent 30%, rgba(5,6,7,.15) 43%, rgba(5,6,7,.86) 62%, #050607 84%)'}} />
    <div style={{position: 'absolute', top: 285, left: 74, color: '#e6bf76', fontSize: 300, lineHeight: 1, fontWeight: 700, letterSpacing: -20, textShadow: '0 10px 50px #000'}}>3</div>
    <div style={{position: 'absolute', top: 1030, left: 82, right: 82}}>
      <div style={{display: 'flex', gap: 18, alignItems: 'center', marginBottom: 30}}>
        <div style={{width: 58, height: 4, background: '#e6bf76'}} />
        <div style={{color: '#e6bf76', fontSize: 29, letterSpacing: 5}}>VÒNG TRÒN KIỂM SOÁT</div>
      </div>
      <div style={{fontSize: 118, fontWeight: 700, lineHeight: 1.18, letterSpacing: -5}}>THỨ NÊN</div>
      <div style={{fontSize: 137, fontWeight: 700, lineHeight: 1.25, letterSpacing: -6, color: '#e6bf76', textShadow: '0 6px 32px #000'}}>BUÔNG BỎ</div>
      <div style={{marginTop: 40, height: 2, width: 110, background: '#e6bf76'}} />
      <div style={{marginTop: 30, color: '#d4d0c6', fontSize: 40, lineHeight: 1.4}}>Đừng lãng phí năng lượng<br />cho điều ngoài tầm kiểm soát.</div>
    </div>
  </AbsoluteFill>
);
