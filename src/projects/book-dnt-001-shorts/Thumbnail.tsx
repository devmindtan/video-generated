import type {FC, ReactNode} from 'react';
import {staticFile} from 'remotion';
import '../../shared/stoic-fonts';

// Covers of the four episode 3 shorts, chosen by the user on 2026-11-09 in chat ("1. A 2. C 3. C 4. A"): s1-a-cup-nut,
// s2-c-bang-lat, s3-c-hai-bong-bong, s4-a-giay-ghi-chu from thumbnail-web/ (designed as web pages, compared in the
// manager's Thumbnail tab). They are carried over 1:1: the same CSS as thumbnail-web/base.css and each page (scoped
// under .dnt-cover; the font comes from shared/stoic-fonts, the cover image from staticFile) and the same elements.
// Keep these in step with the pages when either changes. Prepared only: the user exports them with Studio's Render.
const COVER = staticFile('book-dnt-001-overview/thumbnail/book-cover-source.webp');
const BASE = `
.dnt-cover{--slate:#2b3a44;--slate-lo:#55646d;--red:#a3241b;--red-hi:#c2372a;--gold:#c99a45;--gold-hi:#e9c77e;--brown:#7a5a22;--ivory:#fbf6ea;--board:#1f2a31}
.dnt-cover{position:relative;width:1080px;height:1920px;overflow:hidden;font-family:'Stoic Sans',sans-serif;font-weight:700;color:var(--slate);
  background:radial-gradient(ellipse 60% 34% at 50% 50%,rgba(255,251,240,.85),rgba(255,251,240,0) 72%),linear-gradient(180deg,#dcdfdf 0%,#e8e8e3 30%,#efe8da 55%,#f4e6c9 80%,#f0dcb6 100%)}
.dnt-cover.split-x{background:radial-gradient(ellipse 34% 40% at 50% 50%,rgba(255,250,238,.9),rgba(255,250,238,0) 70%),linear-gradient(90deg,#d9dddd 0%,#e5e6e2 32%,#efe9dc 50%,#f5e9cf 68%,#f0dbb3 100%)}
.dnt-cover .grain{position:absolute;inset:0;opacity:.34;mix-blend-mode:multiply;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .28 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.dnt-cover .vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 95% 80% at 50% 50%,transparent 60%,rgba(70,55,30,.26) 100%)}
.dnt-cover .cool{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 30% at 30% 22%,rgba(140,165,185,.22),transparent 70%)}
.dnt-cover .warm{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 30% at 70% 80%,rgba(222,168,80,.24),transparent 70%)}
.dnt-cover .kicker{position:absolute;left:0;right:0;top:206px;text-align:center;font-size:30px;letter-spacing:.24em;color:var(--brown)}
.dnt-cover .kicker b{color:var(--red);font-weight:700}
.dnt-cover .t{position:absolute;left:0;right:0;margin:0;text-align:center;line-height:1.2;font-weight:700}
.dnt-cover .slate{color:var(--slate)}.dnt-cover .red{color:var(--red)}.dnt-cover .gold{color:var(--gold)}.dnt-cover .brown{color:var(--brown)}
.dnt-cover .lift{text-shadow:0 2px 0 rgba(255,255,255,.55),0 14px 30px rgba(80,60,25,.18)}
.dnt-cover .ink{position:absolute;inset:0;width:1080px;height:1920px;overflow:visible;pointer-events:none}
.dnt-cover .ink .s{fill:none;stroke:var(--slate);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.dnt-cover .ink .r{fill:none;stroke:var(--red);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.dnt-cover .ink .g{fill:none;stroke:var(--gold);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.dnt-cover .cover{position:absolute;border-radius:4px;overflow:hidden;box-shadow:0 3px 0 rgba(0,0,0,.08),0 30px 46px rgba(60,40,15,.36),0 60px 110px rgba(60,40,15,.22)}
.dnt-cover .cover div{position:absolute;inset:0;background:url(${COVER}) center/cover}
.dnt-cover .cover .cold{clip-path:inset(0 50% 0 0);filter:grayscale(1) brightness(.78) contrast(1.05)}
.dnt-cover .cover .cold::after{content:'';position:absolute;inset:0;background:rgba(90,130,160,.25);mix-blend-mode:color}
.dnt-cover .cover .lit{clip-path:inset(0 0 0 50%);filter:saturate(1.12) brightness(1.04)}
.dnt-cover .cover .full{filter:saturate(1.08)}
.dnt-cover .cover::after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.2),rgba(255,255,255,0) 35%)}
`;

const Frame: FC<{css: string; className?: string; label: string; children: ReactNode}> = ({css, className = '', label, children}) =>
  <div className={`dnt-cover ${className}`} role="img" aria-label={label}>
    <style>{BASE + css}</style>
    {children}
    <div className="grain" /><div className="vignette" />
  </div>;

// Short 1 · A "Chiếc cúp nứt" (s1-a-cup-nut.html)
const CUP = `
.dnt-cover .cup{transform:rotate(-9deg);transform-origin:540px 560px}
.dnt-cover .cup .fill{fill:rgba(201,154,69,.28);stroke:none}
.dnt-cover .w1{top:790px;font-size:212px}
.dnt-cover .w2{top:1052px;font-size:92px;letter-spacing:.22em;padding-left:.22em}
.dnt-cover .w3{top:1150px;font-size:262px}`;
export const ThangThuaCover: FC = () => <Frame css={CUP} label="Thắng cũng là thua. Chiếc cúp nứt. Đọc sách, hiểu mình, tập 03: Đắc nhân tâm">
  <div className="cool" /><div className="warm" />
  <div className="kicker">ĐỌC SÁCH, HIỂU MÌNH · <b>ĐẮC NHÂN TÂM</b></div>
  <svg className="ink" viewBox="0 0 1080 1920" aria-hidden="true"><g className="cup">
    <path className="fill" d="M396 352 H684 C684 516 628 604 540 614 C452 604 396 516 396 352 Z" />
    <path className="s" d="M396 352 H684 C684 516 628 604 540 614 C452 604 396 516 396 352 Z" />
    <path className="s" d="M396 394 C318 394 316 512 418 528 M684 394 C762 394 764 512 662 528" />
    <path className="s" d="M540 614 V690 M500 690 H580 M462 752 L478 690 H602 L618 752 Z" />
    <path className="r" style={{strokeWidth: 7}} d="M566 352 L538 426 L572 470 L532 538 L556 606" />
    <path className="s" style={{strokeWidth: 3, opacity: .5}} d="M430 380 C432 450 452 520 488 566" />
  </g>
  <path className="r" style={{strokeWidth: 16, opacity: .9}} d="M276 1478 C420 1462 640 1460 806 1474" />
  </svg>
  <h1 className="t w1 slate lift">THẮNG</h1>
  <h1 className="t w2 brown">CŨNG LÀ</h1>
  <h1 className="t w3 red lift">THUA</h1>
</Frame>;

// Short 2 · C "Bảng chữ lật" (s2-c-bang-lat.html)
const FLAP = `
.dnt-cover .w1{top:318px;font-size:150px}
.dnt-cover .board{position:absolute;left:70px;width:940px;display:flex;justify-content:center;gap:14px}
.dnt-cover .r1{top:600px}.dnt-cover .r2{top:1060px}
.dnt-cover .tile{position:relative;width:170px;height:250px;border-radius:14px;background:linear-gradient(180deg,#26333b 0 49.4%,#141c21 49.6% 50.4%,#1f2a31 50.6%);
  box-shadow:0 4px 0 rgba(0,0,0,.25),0 22px 36px rgba(30,25,15,.35);display:grid;place-items:center;font-size:150px;line-height:1;color:#e85a4a}
.dnt-cover .r2 .tile{width:250px;height:330px;font-size:230px;color:var(--gold-hi)}
.dnt-cover .flip{transform:perspective(600px) rotateX(-28deg);transform-origin:50% 100%;filter:brightness(.85)}
.dnt-cover .note{position:absolute;left:0;right:0;top:900px;text-align:center;font-size:62px;color:var(--brown);letter-spacing:.06em}`;
export const NhungVaCover: FC = () => <Frame css={FLAP} label="Đừng nói nhưng. Bảng chữ lật đổi nhưng thành và. Đọc sách, hiểu mình, tập 03: Đắc nhân tâm">
  <div className="cool" /><div className="warm" />
  <div className="kicker">ĐỌC SÁCH, HIỂU MÌNH · <b>ĐẮC NHÂN TÂM</b></div>
  <h1 className="t w1 slate lift">ĐỪNG NÓI</h1>
  <div className="board r1"><div className="tile">N</div><div className="tile">H</div><div className="tile flip">Ư</div><div className="tile">N</div><div className="tile">G</div></div>
  <div className="note">hãy nói</div>
  <div className="board r2"><div className="tile">V</div><div className="tile">À</div></div>
</Frame>;

// Short 3 · C "Bong bóng và trái tim" (s3-c-hai-bong-bong.html)
const BUBBLE = `
.dnt-cover .bub{position:absolute;left:90px;top:330px;width:900px;height:430px}
.dnt-cover .in1{position:absolute;left:0;right:0;top:462px;text-align:center;font-size:116px;color:var(--slate)}
.dnt-cover .hay{position:absolute;left:0;right:0;top:812px;text-align:center;font-size:74px;letter-spacing:.2em;padding-left:.2em;color:var(--brown)}
.dnt-cover .heart{position:absolute;left:100px;top:930px;width:880px;height:720px}
.dnt-cover .in2{position:absolute;left:0;right:0;top:1150px;text-align:center;font-size:124px;color:var(--ivory);text-shadow:0 4px 0 rgba(90,15,10,.35)}`;
export const TamLongCover: FC = () => <Frame css={BUBBLE} className="split-x" label="Khéo miệng hay thật lòng? Một bong bóng lời nói rỗng và một trái tim đỏ. Đọc sách, hiểu mình, tập 03: Đắc nhân tâm">
  <div className="kicker">ĐỌC SÁCH, HIỂU MÌNH · <b>ĐẮC NHÂN TÂM</b></div>
  <svg className="bub" viewBox="0 0 900 430" aria-hidden="true">
    <path d="M90 20 H810 C860 20 880 46 880 92 V300 C880 346 860 372 810 372 H330 L230 424 L250 372 H90 C40 372 20 346 20 300 V92 C20 46 40 20 90 20 Z" fill="rgba(251,246,234,.55)" stroke="#2b3a44" strokeWidth={8} strokeLinejoin="round" strokeDasharray="26 16" />
  </svg>
  <div className="in1">KHÉO MIỆNG</div>
  <div className="hay">HAY</div>
  <svg className="heart" viewBox="0 0 880 720" aria-hidden="true">
    <path d="M440 700 C180 520 30 380 30 220 C30 100 120 20 230 20 C320 20 400 76 440 150 C480 76 560 20 650 20 C760 20 850 100 850 220 C850 380 700 520 440 700 Z" fill="#a3241b" stroke="#e9c77e" strokeWidth={8} />
    <path d="M150 140 C180 90 230 70 280 74" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={14} strokeLinecap="round" />
  </svg>
  <div className="in2">THẬT LÒNG?</div>
</Frame>;

// Short 4 · A "Giấy ghi chú" (s4-a-giay-ghi-chu.html)
const NOTES = `
.dnt-cover .w1{top:300px;font-size:132px}
.dnt-cover .w2{top:458px;font-size:132px}
.dnt-cover .w3{top:612px;font-size:220px}
.dnt-cover .cover{left:340px;top:930px;width:400px;height:575px;transform:rotate(-3deg)}
.dnt-cover .note{position:absolute;width:330px;padding:26px 24px;background:#f6e7b8;color:var(--slate);font-size:52px;line-height:1.18;text-align:center;
  box-shadow:0 2px 0 rgba(0,0,0,.05),0 18px 26px rgba(60,40,15,.28)}
.dnt-cover .note::before{content:'';position:absolute;left:50%;top:-18px;width:120px;height:36px;margin-left:-60px;background:rgba(220,210,190,.75);transform:rotate(-3deg)}
.dnt-cover .n1{left:56px;top:900px;transform:rotate(-7deg)}
.dnt-cover .n2{right:56px;top:1150px;transform:rotate(6deg)}
.dnt-cover .n3{left:76px;top:1400px;transform:rotate(4deg)}
.dnt-cover .note b{color:var(--red)}`;
export const ChuaDatCover: FC = () => <Frame css={NOTES} label="Vì sao nhiều người chê? Bìa sách Đắc nhân tâm với ba tờ giấy ghi chú phản biện. Đọc sách, hiểu mình, tập 03">
  <div className="cool" /><div className="warm" />
  <div className="kicker">ĐỌC SÁCH, HIỂU MÌNH · <b>TẬP 03</b></div>
  <h1 className="t w1 slate lift">VÌ SAO</h1>
  <h1 className="t w2 slate lift">NHIỀU NGƯỜI</h1>
  <h1 className="t w3 red lift">CHÊ?</h1>
  <div className="cover"><div className="full" /></div>
  <div className="note n1">dễ thành<br /><b>thao túng?</b></div>
  <div className="note n2">dừng<br /><b>ở đâu?</b></div>
  <div className="note n3">quên lúc<br /><b>nói thẳng?</b></div>
</Frame>;
