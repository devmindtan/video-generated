"""Check transition handles and foley without exporting frames or video."""
import json
from pathlib import Path
import runpy
import unittest
import numpy as np

ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'src/projects/tiny-dino-homecoming'
SCRIPTS=ROOT/'scripts/projects/tiny-dino-homecoming'


class EditTests(unittest.TestCase):
    def setUp(self):
        self.chapters=json.loads((SRC/'chapters.json').read_text())
        self.config=json.loads((SRC/'edit.json').read_text())
        cuts=json.loads((SRC/'cuts-v3.json').read_text())
        keys={c[a+'Shot'] for c in self.chapters for a in ['wide','close']}|{s['key'] for c in cuts for s in c['shots']}
        self.clips={key:{'sourceDurationSeconds':8} for key in keys}
        self.plan=runpy.run_path(str(SCRIPTS/'edit-timing.py'))['shot_plan'](self.chapters,self.clips,self.config)

    def test_narration_starts_and_duration_unchanged(self):
        self.assertEqual([s['start'] for s in self.plan if s['angle']=='wide'],[0,16,34,52,70,102,130,154])
        self.assertAlmostEqual(self.plan[-1]['start']+self.plan[-1]['duration'],180)

    def test_all_cuts_overlap_without_source_overrun(self):
        for shot in self.plan:
            self.assertLessEqual(shot['playbackRate']*shot['duration'],8+1e-8)
            self.assertAlmostEqual(shot['start']*30,round(shot['start']*30))
            self.assertAlmostEqual(shot['duration']*30,round(shot['duration']*30))
        for left,right in zip(self.plan,self.plan[1:]):
            self.assertAlmostEqual(left['start']+left['duration']-right['start'],.4)

    def test_no_black_gap_at_any_cut_frame(self):
        for frame in range(12,5400):
            now=frame/30
            coverage=0
            for shot in self.plan:
                if shot['start']<=now<shot['start']+shot['duration']:
                    local=now-shot['start']
                    alpha=min(1,local/.4) if shot['angle']!='wide' else 1
                    alpha*=min(1,(now-self.chapters[shot['chapter']]['start'])/.4)
                    coverage=alpha+coverage*(1-alpha)
            self.assertAlmostEqual(coverage,1,places=7,msg=f'Gap at frame {frame}')

    def test_action_cues_reference_selected_sources(self):
        cues=json.loads((SCRIPTS/('foley-v3.json' if self.config.get('continuityV3') else 'foley.json')).read_text())
        self.assertGreaterEqual(len(cues),20)
        for cue in cues:
            self.assertIn(cue['shot'],self.clips)
            self.assertTrue(0<=cue['sourceSecond']<8)
            self.assertTrue(0<cue['gain']<=.25)

    def test_foley_is_deterministic_finite_and_faded(self):
        synth=runpy.run_path(str(SCRIPTS/'foley.py'))['sound']
        kinds={c['kind'] for c in json.loads((SCRIPTS/'foley.json').read_text())}
        for kind in kinds:
            first=synth(kind,np.random.default_rng(42))
            second=synth(kind,np.random.default_rng(42))
            np.testing.assert_array_equal(first,second)
            self.assertTrue(np.all(np.isfinite(first)))
            self.assertAlmostEqual(float(first[0]),0)
            self.assertAlmostEqual(float(first[-1]),0)
            self.assertLessEqual(np.max(np.abs(first)),1.000001)

    def test_continuations_reference_the_actual_preceding_cut(self):
        cuts=json.loads((SRC/'cuts-v3.json').read_text())
        config=json.loads((SCRIPTS/'veo-continuity.json').read_text())
        specs={s['scene']:s for s in config['shots']}
        for chapter in cuts:
            for previous,current in zip(chapter['shots'],chapter['shots'][1:]):
                if current['key']=='07-rain-close':
                    continue  # Deliberate empathy insert, not an AI continuation.
                shot=specs[current['key']]
                self.assertEqual(shot['previous'],previous['key'])
                self.assertAlmostEqual(shot['previousSourceEnd'],min(8,previous['rate']*previous['duration']))
                self.assertIn('Camera LOCKED',shot['promptSuffix'])
                self.assertIn('/continuity/',shot['image'])
        selected=[s['key'] for c in cuts for s in c['shots']]
        self.assertEqual(len(selected),len(set(selected)))
        self.assertEqual(len(selected),27)

    def test_no_software_zoom_or_pan_on_footage(self):
        source=(SRC/'Video.tsx').read_text()
        self.assertNotIn('scale:',source)
        self.assertNotIn('translate:',source)

    def test_caption_pages_stay_inside_authored_sentence_windows(self):
        story=json.loads((SCRIPTS/'story.json').read_text())
        groups=json.loads((SRC/'captions.json').read_text())
        for scene,pages in zip(story,groups):
            boundaries=[];cursor=0
            for i,sentence in enumerate(scene['sentences']):
                boundaries.append((cursor,cursor+len(sentence['text'].split()),sentence['at'],scene['sentences'][i+1]['at'] if i+1<len(scene['sentences']) else scene['duration']))
                cursor+=len(sentence['text'].split())
            cursor=0
            for page in pages:
                boundary=next(b for b in boundaries if b[0]<=cursor<b[1])
                self.assertGreaterEqual(page['startMs'],round(boundary[2]*1000))
                self.assertLessEqual(page['endMs'],round(boundary[3]*1000))
                cursor+=len(page['text'].split())


if __name__=='__main__':unittest.main()
