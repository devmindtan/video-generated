import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const DisciplinePurposeThumbnail: FC = () => <AbsoluteFill style={{background: '#050709', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('discipline-purpose/images/01-wheel.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,9,.1) 25%, transparent 38%, rgba(3,6,9,.87) 64%, #050709 96%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, color: '#dcb777', fontSize: 25, letterSpacing: 4}}>STOIC · GÓC NHÌN KHÁC</div>
  <div style={{position: 'absolute', top: 1090, left: 84, right: 120}}>
    <div style={{fontSize: 120, fontWeight: 800, lineHeight: 1.08}}>KỶ LUẬT</div>
    <div style={{fontSize: 126, fontWeight: 800, lineHeight: 1.12, color: '#dcb777'}}>CHƯA ĐỦ?</div>
    <div style={{width: 110, height: 3, background: '#dcb777', marginTop: 34, marginBottom: 30}} />
    <div style={{fontSize: 44, lineHeight: 1.45}}>Giữ nhịp mỗi ngày.<br />Nhưng bạn đang cố vì điều gì?</div>
  </div>
</AbsoluteFill>;
