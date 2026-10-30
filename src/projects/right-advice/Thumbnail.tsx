import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const RightAdviceThumbnail: FC = () => <AbsoluteFill style={{background: '#06090c', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('right-advice/images/01-crossroads.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,9,.1) 25%, transparent 38%, rgba(3,6,9,.9) 64%, #06090c 96%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, color: '#dcb777', fontSize: 25, letterSpacing: 4}}>STOIC · GÓC NHÌN KHÁC</div>
  <div style={{position: 'absolute', top: 1080, left: 84, right: 120}}>
    <div style={{fontSize: 112, fontWeight: 800, lineHeight: 1.12}}>AI CŨNG ĐÚNG.</div>
    <div style={{fontSize: 126, fontWeight: 800, lineHeight: 1.12, color: '#dcb777'}}>NGHE AI?</div>
    <div style={{width: 110, height: 3, background: '#dcb777', marginTop: 34, marginBottom: 30}} />
    <div style={{fontSize: 44, lineHeight: 1.45}}>Lời khuyên hay chưa chắc<br />đã hợp với bạn.</div>
  </div>
</AbsoluteFill>;
