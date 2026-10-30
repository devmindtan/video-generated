import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

export const LetItSettleThumbnail: FC = () => <AbsoluteFill style={{background: '#030609', color: '#f4eee4', fontFamily: 'Stoic Sans, sans-serif'}}>
  <CanvasImage src={staticFile('let-it-settle/images/01-storm.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,6,9,.04) 30%, transparent 43%, rgba(3,6,9,.88) 64%, #030609 96%)'}} />
  <div style={{position: 'absolute', left: 84, top: 112, fontSize: 26, letterSpacing: 5, color: '#dfbc7b'}}>STOIC · LỜI NHẮC CHO MÌNH</div>
  <div style={{position: 'absolute', left: 84, right: 110, top: 1120}}>
    <div style={{fontSize: 104, fontWeight: 800, lineHeight: 1.12}}>ĐỪNG CỐ GỠ</div>
    <div style={{fontSize: 116, fontWeight: 800, lineHeight: 1.12, color: '#dfbc7b'}}>NGAY ĐÊM NAY</div>
    <div style={{width: 110, height: 3, background: '#dfbc7b', marginTop: 34, marginBottom: 30}} />
    <div style={{fontSize: 44, lineHeight: 1.5}}>Để tâm trí lắng xuống.<br />Ngày mai, mình sẽ tính tiếp.</div>
  </div>
</AbsoluteFill>;
