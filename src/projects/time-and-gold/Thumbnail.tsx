import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const TimeAndGoldThumbnail: FC = () => <AbsoluteFill data-testid="time-and-gold-thumbnail" style={{background: '#06090d', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <CanvasImage src={staticFile('time-and-gold/images/05-hourglass.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.12) 10%, transparent 34%, rgba(3,6,10,.85) 62%, #06090d 92%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, padding: '12px 22px', border: '1px solid rgba(220,183,119,.5)', background: 'rgba(6,9,13,.8)', color: '#dcb777', fontSize: 34, fontWeight: 700, letterSpacing: 6}}>STOIC</div>
  <div aria-label="CÓ TIỀN… MUA LẠI ĐƯỢC HÔM NAY?" style={{position: 'absolute', top: 1100, left: 84, right: 100, textShadow: '0 5px 24px #000'}}>
    <div style={{fontSize: 126, fontWeight: 700, lineHeight: 1.18}}>CÓ TIỀN…</div>
    <div style={{marginTop: 14, fontSize: 88, fontWeight: 700, lineHeight: 1.18}}>MUA LẠI ĐƯỢC</div>
    <div style={{fontSize: 130, fontWeight: 700, lineHeight: 1.18, color: '#dcb777'}}>HÔM NAY?</div>
    <div style={{width: 120, height: 5, background: '#dcb777', marginTop: 32}} />
  </div>
</AbsoluteFill>;
