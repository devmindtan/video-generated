"""Shot, loudness and silence logic of media-analyze.py on synthetic data; no media files."""
import importlib.util
from pathlib import Path
import unittest

import numpy as np

SCRIPT = Path(__file__).resolve().parents[1]/'media-analyze.py'
spec = importlib.util.spec_from_file_location('media_analyze', SCRIPT)
media = importlib.util.module_from_spec(spec)
spec.loader.exec_module(media)


def flat_frames(levels):
    return np.stack([np.full((36, 64), level, dtype=np.uint8) for level in levels])


class ShotTests(unittest.TestCase):
    def test_hard_cut_scores_high_and_static_frames_zero(self):
        scores = media.change_scores(flat_frames([20]*10+[220]*10))
        self.assertEqual(scores[0], 0)
        self.assertEqual(int(np.argmax(scores)), 10)
        self.assertLess(scores[5], .01)

    def test_relative_rule_finds_soft_peak_in_calm_edit(self):
        scores = np.full(90, .001)
        scores[45] = .12
        self.assertEqual(media.find_cuts(scores, 30, None, .5), [1.5])

    def test_relative_rule_ignores_steady_motion(self):
        scores = np.full(90, .2)+np.random.default_rng(1).uniform(0, .05, 90)
        self.assertEqual(media.find_cuts(scores, 30, None, .5), [])

    def test_min_gap_keeps_strongest_peak(self):
        scores = np.zeros(60)
        scores[30], scores[33] = .3, .5
        self.assertEqual(media.find_cuts(scores, 30, .2, .5), [1.1])


class AudioTests(unittest.TestCase):
    def test_reach_time_follows_quiet_intro(self):
        rate = media.AUDIO_RATE
        quiet = .01*np.sin(np.linspace(0, 2000, rate*10))
        loud = .5*np.sin(np.linspace(0, 2000, rate*20))
        times, levels = media.loudness_profile(np.concatenate([quiet, loud]).astype(np.float32))
        reached = media.reach_time(times, levels, 6, 2)
        self.assertGreaterEqual(reached, 9)
        self.assertLessEqual(reached, 10.5)
        self.assertIsNone(media.reach_time(times, np.full_like(levels, -60)-np.arange(len(levels)), 1, 50))

    def test_parse_silences_closes_open_tail(self):
        stderr = ('[silencedetect] silence_start: -0.01\n[silencedetect] silence_end: 0.8 | silence_duration: 0.81\n'
                  '[silencedetect] silence_start: 4.2\n')
        self.assertEqual(media.parse_silences(stderr, 5.0), [
            {'start': 0, 'end': .8, 'duration': .8}, {'start': 4.2, 'end': 5.0, 'duration': .8}])

    def test_sheet_times_are_centered(self):
        self.assertEqual(media.sheet_times(12, 4, None), [1.5, 4.5, 7.5, 10.5])
        self.assertEqual(media.sheet_times(12, 4, '1,2.5'), [1.0, 2.5])


if __name__ == '__main__':
    unittest.main()


class LoudnessTests(unittest.TestCase):
    def test_verdict_targets_youtube_level_and_true_peak(self):
        self.assertTrue(media.loudness_verdict(-14.4, -1.0))
        self.assertFalse(media.loudness_verdict(-18.7, -1.0))   # episodes 1-2 as exported
        self.assertFalse(media.loudness_verdict(-14.0, 0.0))    # loud enough but clipping

    def test_fix_writes_a_normalised_copy_and_keeps_the_input(self):
        import tempfile, wave, subprocess, sys
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder)/'quiet.wav'
            t = np.arange(48000*4)/48000
            tone = (0.05*np.sin(2*np.pi*440*t)*32767).astype(np.int16)
            with wave.open(str(source), 'wb') as out:
                out.setnchannels(1); out.setsampwidth(2); out.setframerate(48000); out.writeframes(tone.tobytes())
            before = source.read_bytes()
            result = subprocess.run([sys.executable, str(SCRIPT), 'loudness', str(source), '--fix', '--out', str(Path(folder)/'loud.mp4'), '--json'],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            import json
            report = json.loads(result.stdout)
            self.assertFalse(report['ok'])
            self.assertTrue(report['fixed']['ok'], report)
            self.assertEqual(source.read_bytes(), before)
