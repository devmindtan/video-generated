import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const GetBackUpThumbnail: FC = () => <AbsoluteFill data-testid="get-back-up-thumbnail" style={{background: '#06090d', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <div data-testid="get-back-up-thumbnail-hero" style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <CanvasImage src={staticFile('get-back-up/images/02-hesitation.png')} style={{position: 'absolute', width: 1180, height: 2098, left: -50, top: 70, objectFit: 'cover'}} />
  </div>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.35) 0%, transparent 20%, transparent 42%, rgba(3,6,10,.32) 53%, rgba(3,6,10,.96) 67%, #06090d 94%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, display: 'flex', alignItems: 'center', gap: 18, padding: '12px 22px', borderRadius: 8, background: 'rgba(6,9,13,.8)', border: '1px solid rgba(220,183,119,.4)'}}>
    <div style={{width: 7, height: 30, background: '#dcb777'}} /><div style={{fontSize: 34, letterSpacing: 6}}>STOIC</div>
  </div>
  <div data-testid="get-back-up-thumbnail-hook" aria-label="BẠN SỢ THẤT BẠI… HAY SỢ THỬ LẠI?" style={{position: 'absolute', top: 1080, left: 84, right: 84, textShadow: '0 5px 24px #000'}}>
    <div style={{fontSize: 88, fontWeight: 700, lineHeight: 1.12, letterSpacing: -2, whiteSpace: 'nowrap'}}>BẠN SỢ THẤT BẠI…</div>
    <div style={{marginTop: 18, fontSize: 78, fontWeight: 700, lineHeight: 1.12, letterSpacing: -2, whiteSpace: 'nowrap'}}>HAY SỢ</div>
    <div style={{marginTop: 4, fontSize: 148, fontWeight: 700, lineHeight: 1.12, letterSpacing: -2, whiteSpace: 'nowrap', color: '#dcb777'}}>THỬ LẠI?</div>
    <div style={{width: 120, height: 5, background: '#dcb777', marginTop: 32}} />
  </div>
</AbsoluteFill>;
