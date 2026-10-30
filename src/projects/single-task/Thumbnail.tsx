import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const SingleTaskThumbnail: FC = () => <AbsoluteFill style={{background: '#080a0c', color: '#f4efe5', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('single-task/images/01-scroll.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,12,.1) 20%, transparent 36%, rgba(8,10,12,.92) 64%, #080a0c 95%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, color: '#e5a363', fontSize: 26, fontWeight: 700, letterSpacing: 4}}>STOIC · TẬP TRUNG</div>
  <div style={{position: 'absolute', top: 1110, left: 84, right: 120}}>
    <div style={{fontSize: 142, fontWeight: 800, lineHeight: 1.1, letterSpacing: -4}}>BẬN RỘN</div>
    <div style={{fontSize: 100, fontWeight: 800, lineHeight: 1.12, color: '#e5a363'}}>HAY ĐANG NÉ?</div>
    <div style={{width: 110, height: 4, marginTop: 32, marginBottom: 30, background: '#e5a363'}} />
    <div style={{fontSize: 44, lineHeight: 1.45}}>Một việc.<br />Không tab thứ hai.</div>
  </div>
</AbsoluteFill>;
