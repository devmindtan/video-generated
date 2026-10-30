import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

/** Editable cover only; not automatically exported. */
export const PastSelfThumbnail: FC = () => <AbsoluteFill style={{background: '#030609', color: '#f4eee4', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('past-self/images/01-mask.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,9,.1) 25%, transparent 35%, rgba(3,6,9,.85) 65%, #030609 96%)'}} />
  <div style={{position: 'absolute', left: 84, top: 112, color: '#dfbc7b', fontSize: 26, letterSpacing: 5}}>STOIC · LỜI NHẮC CHO MÌNH</div>
  <div style={{position: 'absolute', left: 84, right: 110, top: 1110}}>
    <div style={{fontSize: 100, fontWeight: 800, lineHeight: 1.08}}>ĐỪNG MÃI</div>
    <div style={{fontSize: 116, fontWeight: 800, lineHeight: 1.12, color: '#dfbc7b'}}>TRÁCH MÌNH</div>
    <div style={{width: 110, height: 3, background: '#dfbc7b', marginTop: 36, marginBottom: 32}} />
    <div style={{fontSize: 44, lineHeight: 1.5}}>Tha thứ cho mình ngày ấy.<br />Cho mình hôm nay một cơ hội.</div>
  </div>
</AbsoluteFill>;
