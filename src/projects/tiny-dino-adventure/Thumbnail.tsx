import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const TinyDinoAdventureThumbnail: FC = () => <AbsoluteFill style={{background: '#123e42', overflow: 'hidden', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('tiny-dino-adventure/images/03-butterfly.png')} style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.08, translate: '-8px 72px'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,44,54,.78) 0%, rgba(7,44,54,.12) 40%, transparent 67%, rgba(7,35,43,.72) 100%)'}} />
  <div style={{position: 'absolute', top: 92, left: 68, right: 68, textAlign: 'center'}}>
    <div style={{display: 'inline-block', padding: '11px 25px', borderRadius: 999, background: '#ff755f', color: '#fff', fontSize: 25, fontWeight: 700, letterSpacing: 2}}>CHUYẾN PHIÊU LƯU ĐẦU TIÊN</div>
    <div style={{marginTop: 20, color: '#fff', fontSize: 105, lineHeight: .94, fontWeight: 700, letterSpacing: -4, textShadow: '0 7px 0 rgba(14,76,74,.8), 0 12px 28px rgba(0,0,0,.42)'}}>TÍ HON<br/><span style={{color: '#ffd64d'}}>BỊ LẠC!</span></div>
  </div>
  <div style={{position: 'absolute', left: 72, right: 72, bottom: 74, textAlign: 'center', padding: '20px 26px', borderRadius: 34, color: '#173e48', background: '#fff4b9', border: '5px solid #fff', fontSize: 38, fontWeight: 700, boxShadow: '0 14px 28px rgba(0,0,0,.24)'}}>DŨNG CẢM • KẾT BẠN • KHÁM PHÁ</div>
</AbsoluteFill>;
