import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const PeoplePleasingThumbnail: FC = () => <AbsoluteFill data-testid="people-pleasing-thumbnail" style={{background: '#07080e', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <CanvasImage src={staticFile('people-pleasing/images/01-mask.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,5,11,.1) 25%, transparent 38%, rgba(4,5,11,.9) 64%, #07080e 96%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, color: '#dcb777', fontSize: 25, letterSpacing: 4}}>STOIC · GIỮ LẤY GIỚI HẠN</div>
  <div style={{position: 'absolute', top: 1080, left: 84, right: 120}}>
    <div style={{fontSize: 116, fontWeight: 700, lineHeight: 1.12, textShadow: '0 4px 20px #000'}}>ĐỪNG LUÔN</div>
    <div style={{fontSize: 126, fontWeight: 700, lineHeight: 1.12, color: '#dcb777', textShadow: '0 4px 20px #000'}}>NÓI “CÓ”.</div>
    <div style={{width: 110, height: 3, background: '#dcb777', marginTop: 34, marginBottom: 30}} />
    <div style={{fontSize: 44, fontWeight: 700, lineHeight: 1.45}}>Tử tế với người khác.<br />Đừng bỏ mặc chính mình.</div>
  </div>
</AbsoluteFill>;
