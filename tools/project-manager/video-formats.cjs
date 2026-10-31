// Video containers the manager accepts for customer-supplied videos (Video khách hàng) and recognises as
// exports. Each entry has a header check so a renamed non-video file is refused, the media type used when
// streaming, and whether Chrome can usually play it inline (otherwise the page offers the folder instead).
const isoBmff = h => h.length >= 12 && ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip', 'pnot'].includes(h.toString('latin1', 4, 8));
const ebml = h => h.length >= 4 && h.readUInt32BE(0) === 0x1a45dfa3;
const VIDEO_FORMATS = {
  '.mp4': {label: 'MP4', type: 'video/mp4', inline: true, check: isoBmff},
  '.m4v': {label: 'M4V', type: 'video/mp4', inline: true, check: isoBmff},
  // QuickTime: H.264/HEVC .mov usually plays in Chrome when served as MP4; ProRes does not.
  '.mov': {label: 'MOV', type: 'video/mp4', inline: true, check: isoBmff},
  '.webm': {label: 'WebM', type: 'video/webm', inline: true, check: ebml},
  '.mkv': {label: 'MKV', type: 'video/webm', inline: true, check: ebml},
  '.3gp': {label: '3GP', type: 'video/3gpp', inline: false, check: isoBmff},
  '.avi': {label: 'AVI', type: 'video/x-msvideo', inline: false, check: h => h.length >= 12 && h.toString('latin1', 0, 4) === 'RIFF' && h.toString('latin1', 8, 12) === 'AVI '},
  '.wmv': {label: 'WMV', type: 'video/x-ms-wmv', inline: false, check: h => h.length >= 8 && h.readUInt32BE(0) === 0x3026b275 && h.readUInt32BE(4) === 0x8e66cf11},
  '.flv': {label: 'FLV', type: 'video/x-flv', inline: false, check: h => h.toString('latin1', 0, 3) === 'FLV'},
  '.mpg': {label: 'MPG', type: 'video/mpeg', inline: false, check: h => h.length >= 4 && h.readUInt32BE(0) >>> 8 === 0x000001 && [0xba, 0xb3].includes(h[3])},
  '.mpeg': {label: 'MPEG', type: 'video/mpeg', inline: false, check: h => h.length >= 4 && h.readUInt32BE(0) >>> 8 === 0x000001 && [0xba, 0xb3].includes(h[3])},
  '.ts': {label: 'TS', type: 'video/mp2t', inline: false, check: h => h[0] === 0x47},
  '.mts': {label: 'MTS', type: 'video/mp2t', inline: false, check: h => h[0] === 0x47 || h[4] === 0x47},
  '.m2ts': {label: 'M2TS', type: 'video/mp2t', inline: false, check: h => h[0] === 0x47 || h[4] === 0x47},
};
const videoExtensions = Object.keys(VIDEO_FORMATS);
const videoLabel = videoExtensions.map(e => VIDEO_FORMATS[e].label).filter((l, i, a) => a.indexOf(l) === i).join(', ');
module.exports = {VIDEO_FORMATS, videoExtensions, videoLabel};
