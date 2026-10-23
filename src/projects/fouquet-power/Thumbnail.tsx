import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const FouquetPowerThumbnail: React.FC = () => <AbsoluteFill style={{background: '#030405', color: '#f4efe6', fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
  <CanvasImage src={staticFile('fouquet-power/images/01-empty-throne.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.09, translate: '85px 0px', transformOrigin: '56% 48%'}} />
  <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(2,3,4,.94) 0%, rgba(2,3,4,.75) 41%, rgba(2,3,4,.1) 74%, rgba(2,3,4,.16) 100%)'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(2,3,4,.12), transparent 55%, rgba(2,3,4,.72) 100%)'}} />
  <div style={{position: 'absolute', left: 105, top: 130, width: 910}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 17, color: '#d8b16c', fontSize: 25, letterSpacing: 4, fontWeight: 700}}><span style={{width: 62, height: 4, background: '#a94945'}} />BÀI HỌC QUYỀN LỰC</div>
    <div style={{marginTop: 32, fontSize: 91, lineHeight: 1.03, letterSpacing: -3.4, fontWeight: 700, textShadow: '0 7px 34px #000'}}>ĐỪNG TỎA SÁNG<br /><span style={{color: '#d8b16c'}}>SAI CÁCH.</span></div>
    <div style={{marginTop: 30, fontSize: 27, color: 'rgba(244,239,230,.78)', letterSpacing: 1.4}}>NICOLAS FOUQUET · LOUIS XIV · TÂM LÝ ĐỊA VỊ</div>
  </div>
  <div style={{position: 'absolute', left: 108, bottom: 72, fontSize: 20, color: '#d8b16c', letterSpacing: 3.4}}>TÂM LÝ CUỘC SỐNG</div>
</AbsoluteFill>;
