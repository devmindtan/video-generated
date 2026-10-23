import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const SolitudeThumbnail: React.FC = () => (
  <AbsoluteFill style={{background: '#020407', color: '#f2eee5', fontFamily: 'Stoic Sans, sans-serif'}}>
    <CanvasImage src={staticFile('solitude/images/01-alone.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.04, transformOrigin: '50% 31%'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,3,5,.03) 0%, rgba(1,3,5,.12) 38%, rgba(2,4,7,.7) 60%, #020407 91%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 29%, transparent 18%, rgba(0,0,0,.18) 55%, rgba(0,0,0,.68) 100%)'}} />
    <div style={{position: 'absolute', top: 98, left: 78, display: 'flex', alignItems: 'center', gap: 18}}><div style={{width: 54, height: 3, background: '#d8b46f'}} /><div style={{color: '#d8b46f', fontSize: 27, letterSpacing: 5.2}}>STOIC · TỰ CHỦ</div></div>
    <div style={{position: 'absolute', left: 78, right: 70, top: 1080}}>
      <div style={{fontSize: 56, letterSpacing: 6.5, color: '#d8b46f', marginBottom: 18}}>NGHỆ THUẬT</div>
      <div style={{fontSize: 119, fontWeight: 700, lineHeight: 1.04, letterSpacing: -4.8, textShadow: '0 8px 34px rgba(0,0,0,.95)'}}>BƯỚC ĐI</div>
      <div style={{fontSize: 132, fontWeight: 700, lineHeight: 1.04, letterSpacing: -5.8, color: '#dfbd79', textShadow: '0 8px 36px rgba(0,0,0,.95)'}}>MỘT MÌNH</div>
      <div style={{marginTop: 34, width: 116, height: 3, background: '#d8b46f'}} />
      <div style={{marginTop: 28, fontSize: 41, lineHeight: 1.42, color: '#e4dfd5'}}>Khi cô độc trở thành<br /><span style={{color: '#d8b46f'}}>sức mạnh nội tâm.</span></div>
    </div>
  </AbsoluteFill>
);
