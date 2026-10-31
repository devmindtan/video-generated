"""Word timings of a WAV (local faster-whisper) to find phrases read unusually fast or slow.
Diagnostic only. Usage: .venv/bin/python scripts/projects/book-hvtt-001-overview/word-rate.py <wav> [<wav>...]"""
import sys, os
os.environ['HF_HUB_OFFLINE'] = '1'
from pathlib import Path
import soundfile as sf, soxr
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[3]
model = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4, download_root=str(ROOT / '.cache/whisper'))
for path in sys.argv[1:]:
    audio, sr = sf.read(path, dtype='float32')
    audio = audio.mean(axis=1) if audio.ndim > 1 else audio
    segments, _ = model.transcribe(soxr.resample(audio, sr, 16000), language='vi', beam_size=5, word_timestamps=True)
    words = [w for s in segments for w in s.words]
    print(Path(path).name, f'{len(words) / max(words[-1].end - words[0].start, 1e-6):.2f} tiếng/giây cả câu')
    print('  ' + ' '.join(f'{w.word.strip()}[{w.end - w.start:.2f}]' for w in words))
