import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const ListenFirstThumbnail: FC = () => <AbsoluteFill data-testid="listen-first-thumbnail" style={{background: '#06090d', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <CanvasImage src={staticFile('listen-first/images/03-judged.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.08) 8%, transparent 34%, rgba(3,6,10,.82) 61%, #06090d 91%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, padding: '12px 22px', border: '1px solid rgba(220,183,119,.5)', background: 'rgba(6,9,13,.8)', color: '#dcb777', fontSize: 34, fontWeight: 700, letterSpacing: 6}}>STOIC</div>
  <div aria-label="LẮNG NGHE… HAY ĐANG CHẤM ĐIỂM?" style={{position: 'absolute', top: 1040, left: 84, right: 100, textShadow: '0 5px 24px #000'}}>
    <div style={{fontSize: 100, fontWeight: 700, lineHeight: 1.18}}>LẮNG NGHE…</div>
    <div style={{marginTop: 18, fontSize: 100, fontWeight: 700, lineHeight: 1.18}}>HAY ĐANG</div>
    <div style={{marginTop: 4, fontSize: 112, fontWeight: 700, lineHeight: 1.18, color: '#dcb777'}}>CHẤM ĐIỂM?</div>
    <div style={{width: 120, height: 5, background: '#dcb777', marginTop: 32}} />
  </div>
</AbsoluteFill>;
