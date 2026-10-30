import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const NeverTriedThumbnail: FC = () => <AbsoluteFill data-testid="never-tried-thumbnail" style={{background: '#06090d', color: '#f2ede3', fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700}}>
  <CanvasImage src={staticFile('never-tried/images/01-sword.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,10,.1) 25%, transparent 38%, rgba(3,6,10,.9) 64%, #06090d 96%)'}} />
  <div style={{position: 'absolute', top: 110, left: 84, color: '#dcb777', fontSize: 25, letterSpacing: 4}}>STOIC · THỬ RỒI MỚI BIẾT</div>
  <div style={{position: 'absolute', top: 1080, left: 84, right: 120}}>
    <div style={{fontSize: 116, fontWeight: 700, lineHeight: 1.12, textShadow: '0 4px 20px #000'}}>CHƯA THUA.</div>
    <div style={{fontSize: 104, fontWeight: 700, lineHeight: 1.12, color: '#dcb777', textShadow: '0 4px 20px #000'}}>HAY CHƯA THỬ?</div>
    <div style={{width: 110, height: 3, background: '#dcb777', marginTop: 34, marginBottom: 30}} />
    <div style={{fontSize: 44, fontWeight: 700, lineHeight: 1.45}}>Một lần thử có thể cho bạn<br />câu trả lời mà chờ đợi không có.</div>
  </div>
</AbsoluteFill>;
