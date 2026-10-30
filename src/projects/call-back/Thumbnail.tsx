import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const CallBackThumbnail: FC = () => <AbsoluteFill data-testid="call-back-thumbnail" style={{background: '#06090d', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <CanvasImage src={staticFile('call-back/images/04-chair.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 34%, rgba(3,6,10,.88) 60%, #06090d 90%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, padding: '12px 22px', border: '1px solid rgba(220,183,119,.5)', background: 'rgba(6,9,13,.8)', color: '#dcb777', fontSize: 34, fontWeight: 700, letterSpacing: 6}}>STOIC</div>
  <div aria-label="ĐỂ MAI… NẾU KHÔNG CÒN NGÀY MAI?" style={{position: 'absolute', top: 1080, left: 84, right: 100, textShadow: '0 5px 24px #000'}}>
    <div style={{fontSize: 126, fontWeight: 700, lineHeight: 1.18}}>ĐỂ MAI…</div>
    <div style={{marginTop: 14, fontSize: 76, fontWeight: 700, lineHeight: 1.18}}>NẾU KHÔNG CÒN</div>
    <div style={{fontSize: 116, fontWeight: 700, lineHeight: 1.18, color: '#dcb777'}}>NGÀY MAI?</div>
    <div style={{width: 120, height: 5, background: '#dcb777', marginTop: 32}} />
  </div>
</AbsoluteFill>;
