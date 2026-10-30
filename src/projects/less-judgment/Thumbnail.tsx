import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const LessJudgmentThumbnail: FC = () => <AbsoluteFill data-testid="less-judgment-thumbnail" style={{background: '#06090d', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <CanvasImage src={staticFile('less-judgment/images/thumbnail-blind-judgment-v2.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.12) 10%, transparent 34%, rgba(3,6,10,.85) 62%, #06090d 92%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, padding: '12px 22px', border: '1px solid rgba(220,183,119,.5)', background: 'rgba(6,9,13,.8)', color: '#dcb777', fontSize: 34, fontWeight: 700, letterSpacing: 6}}>STOIC</div>
  <div aria-label="CHƯA HIỂU HẾT… ĐÃ VỘI PHÁN XÉT?" style={{position: 'absolute', top: 1060, left: 84, right: 100, textShadow: '0 5px 24px #000'}}>
    <div style={{fontSize: 88, fontWeight: 700, lineHeight: 1.18}}>CHƯA HIỂU HẾT…</div>
    <div style={{marginTop: 18, fontSize: 78, fontWeight: 700, lineHeight: 1.18}}>ĐÃ VỘI</div>
    <div style={{marginTop: 4, fontSize: 144, fontWeight: 700, lineHeight: 1.18, color: '#dcb777'}}>PHÁN XÉT?</div>
    <div style={{width: 120, height: 5, background: '#dcb777', marginTop: 32}} />
  </div>
</AbsoluteFill>;
