import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import '../../shared/stoic-fonts';
import {DryWellArt} from './art/DryWell';

// Prepared only; never exported automatically. Art: scene 3 (shovel by the dry well at dusk).
export const KnowWhenToQuitThumbnail: FC = () => <AbsoluteFill data-testid="know-when-to-quit-thumbnail" style={{background: '#08070a', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <div style={{position: 'absolute', top: -60, left: 0, width: 1080, height: 1300}}><DryWellArt frame={40} duration={300} fps={30} /></div>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,7,10,.3) 0%, transparent 16%, transparent 46%, rgba(8,7,10,.9) 62%, #08070a 74%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, color: '#dcb777', fontSize: 25, letterSpacing: 4}}>STOIC · BIẾT DỪNG</div>
  <div style={{position: 'absolute', top: 1110, left: 84, right: 110}}>
    <div style={{fontSize: 140, fontWeight: 700, lineHeight: 1.05, color: '#dcb777', textShadow: '0 4px 20px #000'}}>BIẾT DỪNG</div>
    <div style={{fontSize: 74, fontWeight: 700, lineHeight: 1.2, textShadow: '0 4px 20px #000', marginTop: 10}}>cũng là dũng cảm.</div>
    <div style={{width: 110, height: 3, background: '#dcb777', marginTop: 34, marginBottom: 30}} />
    <div style={{fontSize: 44, fontWeight: 700, lineHeight: 1.45}}>Ở lại vì tiếc công<br />không phải kiên trì.</div>
  </div>
</AbsoluteFill>;
