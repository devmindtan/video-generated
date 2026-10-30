import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const GlowingWhaleThumbnail: FC = () => <AbsoluteFill style={{background: '#043d59', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('glowing-whale/images/06-reunion.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,25,55,.85), transparent 40%, transparent 70%, rgba(0,25,55,.82))'}} />
  <div style={{position: 'absolute', top: 105, left: 85, right: 85, color: '#fff', textAlign: 'center', fontWeight: 700, textShadow: '0 7px 0 #075578, 0 12px 25px #00314b'}}>
    <div style={{fontSize: 27, letterSpacing: 3, color: '#c0f7ff', marginBottom: 20}}>BỌT BIỂN VÀ NHỮNG NGƯỜI BẠN</div>
    <div style={{fontSize: 110, lineHeight: 1.02, letterSpacing: -3}}>BÉ CÁ VOI<br/><span style={{color: '#ffe47c'}}>PHÁT SÁNG!</span></div>
  </div>
  <div style={{position: 'absolute', bottom: 135, left: 110, right: 110, padding: '22px 25px', borderRadius: 32, background: '#fff0a8', border: '4px solid #fff', textAlign: 'center', fontSize: 41, fontWeight: 700, color: '#064664'}}>KHÁC BIỆT CŨNG THẬT ĐÁNG YÊU</div>
</AbsoluteFill>;
