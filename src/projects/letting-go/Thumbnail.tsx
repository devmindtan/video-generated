import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const LettingGoThumbnail: React.FC = () => <AbsoluteFill style={{background: '#020407', color: '#f2eee5', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('letting-go/images/04-clouds.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.035, transformOrigin: '42% 27%'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(2,4,7,.03), rgba(2,4,7,.08) 38%, rgba(2,4,7,.7) 61%, #020407 94%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 27%, transparent 18%, rgba(0,0,0,.18) 53%, rgba(0,0,0,.68) 100%)'}} />
  <div style={{position: 'absolute', top: 98, left: 78, display: 'flex', alignItems: 'center', gap: 18}}><div style={{width: 54, height: 3, background: '#ddb970'}} /><div style={{color: '#ddb970', fontSize: 27, letterSpacing: 5}}>BUÔNG BỎ · BÌNH THẢN</div></div>
  <div style={{position: 'absolute', left: 78, right: 66, top: 1040}}>
    <div style={{fontSize: 55, letterSpacing: 5.4, color: '#ddb970', marginBottom: 18}}>HỌC CÁCH</div>
    <div style={{fontSize: 126, fontWeight: 700, lineHeight: 1, letterSpacing: -5.5, textShadow: '0 8px 35px rgba(0,0,0,.96)'}}>BUÔNG TAY</div>
    <div style={{fontSize: 74, fontWeight: 700, lineHeight: 1.12, letterSpacing: -3.6, color: '#e3c17c', textShadow: '0 8px 34px rgba(0,0,0,.96)', marginTop: 10}}>TÌM LẠI TỰ DO</div>
    <div style={{marginTop: 35, width: 116, height: 3, background: '#ddb970'}} />
    <div style={{marginTop: 28, fontSize: 40, lineHeight: 1.42}}>Bình yên bắt đầu khi<br /><span style={{color: '#ddb970'}}>bạn thôi níu giữ.</span></div>
  </div>
</AbsoluteFill>;
