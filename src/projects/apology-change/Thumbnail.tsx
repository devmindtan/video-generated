import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const ApologyChangeThumbnail: FC = () => <AbsoluteFill data-testid="apology-change-thumbnail" style={{background: '#06090d', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <CanvasImage src={staticFile('apology-change/images/02-repeat.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.08) 8%, transparent 34%, rgba(3,6,10,.82) 61%, #06090d 91%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, padding: '12px 22px', border: '1px solid rgba(220,183,119,.5)', background: 'rgba(6,9,13,.8)', color: '#dcb777', fontSize: 34, fontWeight: 700, letterSpacing: 6}}>STOIC</div>
  <div aria-label="XIN LỖI… RỒI LẠI NHƯ CŨ?" style={{position: 'absolute', top: 1040, left: 84, right: 100, textShadow: '0 5px 24px #000'}}>
    <div style={{fontSize: 112, fontWeight: 700, lineHeight: 1.18}}>XIN LỖI…</div>
    <div style={{marginTop: 18, fontSize: 100, fontWeight: 700, lineHeight: 1.18}}>RỒI LẠI</div>
    <div style={{marginTop: 4, fontSize: 144, fontWeight: 700, lineHeight: 1.18, color: '#dcb777'}}>NHƯ CŨ?</div>
    <div style={{width: 120, height: 5, background: '#dcb777', marginTop: 32}} />
  </div>
</AbsoluteFill>;
