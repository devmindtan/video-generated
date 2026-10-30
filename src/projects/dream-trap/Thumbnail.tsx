import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const DreamTrapThumbnail: FC = () => <AbsoluteFill data-testid="dream-trap-thumbnail" style={{background: '#06090d', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <CanvasImage src={staticFile('dream-trap/images/thumbnail-reflection-v2.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.2) 10%, transparent 38%, rgba(3,6,10,.85) 60%, #06090d 90%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, padding: '12px 22px', border: '1px solid rgba(220,183,119,.5)', background: 'rgba(6,9,13,.8)', color: '#dcb777', fontSize: 34, fontWeight: 700, letterSpacing: 6}}>STOIC</div>
  <div aria-label="BẠN ĐANG CỐ GẮNG… HAY CHỈ MƠ?" style={{position: 'absolute', top: 1090, left: 84, right: 100, textShadow: '0 5px 24px #000'}}>
    <div style={{fontSize: 80, fontWeight: 700, lineHeight: 1.18}}>BẠN ĐANG</div>
    <div style={{fontSize: 112, fontWeight: 700, lineHeight: 1.18}}>CỐ GẮNG…</div>
    <div style={{fontSize: 118, fontWeight: 700, lineHeight: 1.18, color: '#dcb777'}}>HAY CHỈ MƠ?</div>
    <div style={{width: 120, height: 5, background: '#dcb777', marginTop: 32}} />
  </div>
</AbsoluteFill>;
