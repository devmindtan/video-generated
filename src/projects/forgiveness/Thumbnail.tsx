import React from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const ForgivenessThumbnail: React.FC = () => <AbsoluteFill style={{background: '#020508', color: '#f3efe6', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('forgiveness/images/03-kintsugi.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.035, transformOrigin: '50% 34%'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,3,5,.04) 0%, rgba(1,3,5,.1) 39%, rgba(2,5,8,.72) 62%, #020508 94%)'}} />
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, transparent 17%, rgba(0,0,0,.2) 53%, rgba(0,0,0,.71) 100%)'}} />
  <div style={{position: 'absolute', top: 98, left: 78, display: 'flex', alignItems: 'center', gap: 18}}><div style={{width: 54, height: 3, background: '#dcb874'}} /><div style={{color: '#dcb874', fontSize: 27, letterSpacing: 5}}>TÂM THƯ GỬI CHÍNH BẠN</div></div>
  <div style={{position: 'absolute', left: 78, right: 65, top: 1040}}>
    <div style={{fontSize: 54, letterSpacing: 5.5, color: '#dcb874', marginBottom: 19}}>ĐỪNG TỰ TRÁCH</div>
    <div style={{fontSize: 116, fontWeight: 700, lineHeight: 1.02, letterSpacing: -5.2, textShadow: '0 8px 35px rgba(0,0,0,.96)'}}>VÌ BẠN</div>
    <div style={{fontSize: 118, fontWeight: 700, lineHeight: 1.02, letterSpacing: -5.5, color: '#e1bf7c', textShadow: '0 8px 36px rgba(0,0,0,.96)'}}>CHƯA HOÀN HẢO</div>
    <div style={{marginTop: 34, width: 116, height: 3, background: '#dcb874'}} />
    <div style={{marginTop: 28, fontSize: 40, lineHeight: 1.42, color: '#e7e0d5'}}>Bạn không hề muộn.<br /><span style={{color: '#dcb874'}}>Hãy kiên nhẫn với mình.</span></div>
  </div>
</AbsoluteFill>;
