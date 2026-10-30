import type {FC} from 'react';
import {AbsoluteFill, CanvasImage, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

const GOLD = '#e5bd73';
const IVORY = '#f6f0e5';

/** Portrait cover built around the video's hourglass identity. */
export const OwnTimelineThumbnail: FC = () => (
  <AbsoluteFill style={{background: '#030507', color: IVORY, fontFamily: 'Stoic Sans, sans-serif', overflow: 'hidden'}}>
    <CanvasImage
      src={staticFile('own-timeline/images/01-hourglass.png')}
      style={{width: '100%', height: '100%', objectFit: 'cover', scale: 1.08, translate: '0 -36px', transformOrigin: '50% 48%'}}
    />

    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(1,3,5,.16) 0%, transparent 29%, rgba(2,4,6,.2) 43%, rgba(2,4,6,.78) 61%, #030507 91%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 31%, transparent 12%, rgba(0,0,0,.18) 48%, rgba(0,0,0,.72) 100%)'}} />

    <div style={{position: 'absolute', top: 104, left: 80, right: 80, display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{width: 56, height: 3, background: GOLD}} />
      <div style={{color: GOLD, fontSize: 26, fontWeight: 600, letterSpacing: 5.2}}>STOIC · SELF-REMINDER</div>
    </div>

    <div style={{position: 'absolute', top: 220, right: 72, width: 190, height: 190, border: '2px solid rgba(229,189,115,.36)', borderRadius: '50%'}}>
      {Array.from({length: 12}, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 92,
            top: 8,
            width: 3,
            height: i % 3 === 0 ? 18 : 10,
            background: i % 3 === 0 ? GOLD : 'rgba(229,189,115,.55)',
            transformOrigin: `1.5px ${87}px`,
            rotate: `${i * 30}deg`,
          }}
        />
      ))}
      <div style={{position: 'absolute', left: 92, top: 50, width: 3, height: 48, background: GOLD, transformOrigin: '50% 100%', rotate: '-38deg'}} />
      <div style={{position: 'absolute', left: 92, top: 72, width: 3, height: 27, background: IVORY, transformOrigin: '50% 100%', rotate: '62deg'}} />
      <div style={{position: 'absolute', left: 86, top: 86, width: 15, height: 15, borderRadius: '50%', background: GOLD, boxShadow: '0 0 18px rgba(229,189,115,.8)'}} />
    </div>

    <div style={{position: 'absolute', left: 80, right: 72, top: 1080}}>
      <div style={{color: GOLD, fontSize: 35, fontWeight: 600, letterSpacing: 6.2, marginBottom: 22}}>ĐỪNG VỘI NHÌN SANG</div>
      <div style={{fontSize: 118, fontWeight: 800, lineHeight: 1.02, letterSpacing: -5.4, textShadow: '0 8px 36px rgba(0,0,0,.96)'}}>BẠN KHÔNG</div>
      <div style={{fontSize: 158, fontWeight: 800, lineHeight: 1.02, letterSpacing: -7, color: GOLD, textShadow: '0 8px 38px rgba(0,0,0,.98)'}}>HỀ CHẬM</div>
      <div style={{marginTop: 35, width: 124, height: 3, background: GOLD}} />
      <div style={{marginTop: 28, color: '#d7d0c4', fontSize: 41, fontWeight: 500, lineHeight: 1.42, textShadow: '0 4px 20px #000'}}>
        Bạn chỉ đang đi theo<br /><span style={{color: GOLD}}>múi giờ của riêng mình.</span>
      </div>
    </div>
  </AbsoluteFill>
);
