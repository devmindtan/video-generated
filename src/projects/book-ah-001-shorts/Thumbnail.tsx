import type {FC} from 'react';
import {GOLD, IVORY} from '../book-hvtt-001-overview/Intro';
import {CoverFrame} from '../book-hvtt-001-shorts/Thumbnail';

// Covers of the four episode-2 shorts (1080×1920), in episode 1's cover frame (shared): one large gold line picture,
// a short headline with a gold keyword, the book underneath. Objects only, no faces. Never exported automatically.
export type IceCoverProps = {art: 'ice' | 'loop' | 'photos' | 'soap'; headline: string; keyword: string};

const G = (d: string, w = 5, color = GOLD) => <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
// An ice cube beginning to melt beside a tall thermometer near its mark.
const Ice: FC = () => <g>
  {G('M250 560 L590 560 L590 900 L250 900 Z M250 560 L330 480 L670 480 L590 560 M670 480 L670 820 L590 900')}
  {[0, 1, 2].map((k) => G(`M${330 + k * 90} ${960 + k * 30} c-14 24 -14 38 0 44 c14 -6 14 -20 0 -44 Z`, 4))}
  {G('M810 440 L810 1000 C772 1018 772 1086 820 1100 C868 1086 868 1018 830 1000 L830 440 C830 412 810 412 810 440 Z', 4, IVORY)}
  <path d="M820 1070 L820 520" stroke={GOLD} strokeWidth={14} strokeLinecap="round" />
  {G('M760 500 L880 500', 3, GOLD)}
</g>;
// The habit loop: four boxes round a circle of arrows.
const Loop: FC = () => <g>
  {[[540, 470], [790, 760], [540, 1050], [290, 760]].map(([x, y], k) => <rect key={k} x={x - 170} y={y - 50} width={340} height={100} rx={16} fill="rgba(217,181,111,.12)" stroke={GOLD} strokeWidth={5} />)}
  {['DẤU HIỆU', 'KHAO KHÁT', 'HÀNH ĐỘNG', 'PHẦN THƯỞNG'].map((t, k) => {const [x, y] = [[540, 470], [790, 760], [540, 1050], [290, 760]][k];return <text key={t} x={x} y={y + 15} textAnchor="middle" fill={IVORY} fontSize={38} fontWeight={700}>{t}</text>;})}
  {G('M680 540 C760 580 800 630 806 690 M800 830 C790 920 720 980 680 1000 M400 1000 C320 960 284 900 280 830 M280 690 C290 610 340 560 400 530', 4)}
  {G('M792 676 L806 694 L822 674 M694 1010 L676 1000 L690 984 M270 846 L280 828 L296 846 M386 520 L402 530 L388 546', 4)}
</g>;
// A tall pile of photos and the best print lifted from it, glowing.
const Photos: FC = () => <g>
  {Array.from({length: 8}, (_, k) => <rect key={k} x={220 + (k % 2) * 10} y={1000 - k * 34} width={300} height={200} rx={8} fill="rgba(13,20,17,.85)" stroke={GOLD} strokeWidth={4} transform={`rotate(${(k % 3 - 1) * 4} 370 ${1100 - k * 34})`} />)}
  <rect x={560} y={500} width={340} height={230} rx={10} fill="rgba(13,20,17,.85)" stroke={GOLD} strokeWidth={6} />
  {G('M590 700 L680 610 L740 670 L800 600 L870 700 Z', 4)}
</g>;
// A tap, cupped hands and soap bubbles rising.
const Soap: FC = () => <g>
  {G('M240 460 L240 540 M240 500 L660 500 C710 500 730 530 730 580 L730 640 M690 640 L770 640')}
  {[0, 1, 2].map((k) => G(`M730 ${690 + k * 60} l0 30`, 4, IVORY))}
  {G('M560 900 C574 1040 690 1090 720 1066 M900 900 C886 1040 770 1090 740 1066 M560 900 C550 870 578 852 592 876 M900 900 C910 870 882 852 868 876')}
  {[[620, 820, 30], [700, 760, 22], [800, 800, 34], [660, 700, 18], [760, 680, 26], [850, 720, 16]].map(([x, y, r], k) => <circle key={k} cx={x} cy={y} r={r} fill="none" stroke={GOLD} strokeWidth={4} opacity={1 - k * .08} />)}
</g>;
const ART = {ice: Ice, loop: Loop, photos: Photos, soap: Soap};

export const IceShortCover: FC<IceCoverProps> = ({art, headline, keyword}) => {
  const Art = ART[art];
  return <CoverFrame headline={headline} keyword={keyword} bookLine="Thay đổi tí hon hiệu quả bất ngờ · James Clear"><Art /></CoverFrame>;
};
