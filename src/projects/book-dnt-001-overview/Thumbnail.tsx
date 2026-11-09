import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import '../../shared/stoic-fonts';

// YouTube thumbnail of episode 3, design F chosen by the user on 2026-11-09 ("Ok chốt cái này"). It was designed as a web
// page (thumbnail-web/f-ket-hop.html, with the other variants A–E and so-sanh.html) and is carried over 1:1 here so
// Studio exports it like episodes 1–2. Prepared only: never exported automatically.
// Light paper split into a cool grey-ivory left half and a warm ivory right half; the real cover in the middle, its
// left half grey and cold, its right half in colour, a gold seam between; KHÉO MIỆNG in cool slate on the left,
// THẬT LÒNG? in the cover's red on the right, a small HAY above the book. The bottom-right corner (x ≥ 980, y ≥ 600)
// stays empty: YouTube's duration badge covers it. Keep it in step with f-ket-hop.html when either changes.
const COVER = staticFile('book-dnt-001-overview/thumbnail/book-cover-source.webp');
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const fill: CSSProperties = {position: 'absolute', inset: 0};
const coverImage: CSSProperties = {...fill, background: `url(${COVER}) center/cover`};
const side: CSSProperties = {position: 'absolute', top: 252, margin: 0, fontSize: 104, lineHeight: 1.16, fontWeight: 700};

export const BookDntThumbnail: FC = () => <AbsoluteFill data-testid="book-dnt-thumbnail" style={{fontFamily: 'Stoic Sans, sans-serif', fontWeight: 700, color: '#22303a', background:
  'radial-gradient(ellipse 30% 46% at 50% 50%, rgba(255,250,238,.9), rgba(255,250,238,0) 70%), linear-gradient(90deg, #dcdfdf 0%, #e6e7e3 30%, #efe9dc 50%, #f5e9cf 70%, #f1dfbb 100%)'}}>
  {/* faint light on each side: cold daylight left, warm lamp right */}
  <div style={{...fill, background: 'radial-gradient(ellipse 34% 60% at 16% 46%, rgba(140,165,185,.20), transparent 70%)'}} />
  <div style={{...fill, background: 'radial-gradient(ellipse 34% 60% at 84% 46%, rgba(222,168,80,.22), transparent 70%)'}} />
  {/* the cover, split cold | lit */}
  <div style={{position: 'absolute', left: 505, top: 200, width: 270, height: 388, borderRadius: 3, overflow: 'hidden',
    boxShadow: '0 2px 0 rgba(0,0,0,.08), 0 26px 40px rgba(60,40,15,.38), 0 50px 90px rgba(60,40,15,.22)'}}>
    <div style={{...coverImage, clipPath: 'inset(0 50% 0 0)', filter: 'grayscale(1) brightness(.78) contrast(1.05)'}}>
      <div style={{...fill, background: 'rgba(90,130,160,.25)', mixBlendMode: 'color'}} />
    </div>
    <div style={{...coverImage, clipPath: 'inset(0 0 0 50%)', filter: 'saturate(1.12) brightness(1.04)'}} />
    <div style={{...fill, background: 'linear-gradient(115deg, rgba(255,255,255,.18), rgba(255,255,255,0) 35%)'}} />
  </div>
  <div style={{position: 'absolute', left: 638, top: 186, width: 4, height: 416, background: 'linear-gradient(180deg, transparent, #e9c77e 14%, #c99a45 86%, transparent)', boxShadow: '0 0 14px rgba(233,199,126,.9)'}} />
  <div style={{position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center', fontSize: 22, letterSpacing: '.3em', color: '#6f5420'}}>ĐỌC SÁCH, HIỂU MÌNH · TẬP 03</div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontSize: 50, letterSpacing: '.14em', color: '#8a6420'}}>HAY</div>
  <h1 style={{...side, right: 832, textAlign: 'right', color: '#2b3a44'}}><span style={{display: 'block'}}>KHÉO</span><span style={{display: 'block'}}>MIỆNG</span></h1>
  <h1 style={{...side, left: 832, textAlign: 'left', color: '#a3241b'}}><span style={{display: 'block'}}>THẬT</span><span style={{display: 'block'}}>LÒNG?</span></h1>
  <svg viewBox="0 0 1280 720" style={{...fill, overflow: 'visible'}} fill="none" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round">
    <path stroke="#2b3a44" d="M300 560 Q380 600 460 560" />
    <path stroke="#a3241b" d="M890 600 C842 566 840 524 866 517 C880 513 890 524 890 536 C890 524 900 513 914 517 C940 524 938 566 890 600 Z" />
  </svg>
  <div style={{...fill, opacity: .34, mixBlendMode: 'multiply', backgroundImage: GRAIN}} />
  <div style={{...fill, background: 'radial-gradient(ellipse 90% 95% at 50% 50%, transparent 62%, rgba(70,55,30,.22) 100%)'}} />
</AbsoluteFill>;
