import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const TakeStockThumbnail: FC = () => <AbsoluteFill data-testid="take-stock-thumbnail" style={{background: '#06090d', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  {/* Two deliberate crops: a large shoe on the left, the complete seated figure on the right. */}
  <div data-testid="take-stock-thumbnail-shoes" style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <CanvasImage src={staticFile('take-stock/images/01-shoes-v2.png')} style={{position: 'absolute', width: 1360, height: 2418, left: -750, top: -200, objectFit: 'cover'}} />
  </div>
  <div data-testid="take-stock-thumbnail-perspective" style={{position: 'absolute', top: 0, left: 430, width: 650, height: 1920, overflow: 'hidden', clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0 100%)'}}>
    <CanvasImage src={staticFile('take-stock/images/03-perspective.png')} style={{position: 'absolute', width: 1040, height: 1849, left: -20, top: 145, objectFit: 'cover'}} />
  </div>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.22) 0%, transparent 16%, transparent 44%, rgba(3,6,10,.2) 52%, rgba(3,6,10,.94) 66%, #06090d 88%)'}} />
  <div style={{position: 'absolute', top: 110, left: 78, display: 'flex', alignItems: 'center', gap: 18, padding: '12px 22px', background: 'rgba(6,9,13,.8)', border: '1px solid rgba(220,183,119,.4)', borderRadius: 8}}>
    <div style={{width: 7, height: 30, background: '#dcb777'}} />
    <div style={{fontSize: 34, letterSpacing: 6, color: '#f2ede3'}}>STOIC</div>
  </div>
  <div data-testid="take-stock-thumbnail-hook" style={{position: 'absolute', top: 1135, left: 74, right: 74, textShadow: '0 5px 24px #000'}}>
    <div style={{fontSize: 112, fontWeight: 700, lineHeight: 1.12, letterSpacing: -3, whiteSpace: 'nowrap'}}>TÔI TƯỞNG</div>
    <div style={{marginTop: 12, fontSize: 126, fontWeight: 700, lineHeight: 1.12, letterSpacing: -4, whiteSpace: 'nowrap', color: '#dcb777'}}>MÌNH THIẾU…</div>
    <div style={{width: 120, height: 5, background: '#dcb777', marginTop: 36}} />
  </div>
</AbsoluteFill>;
