import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT/'src/projects/glowing-whale'
PRODUCTION = ROOT/'scripts/projects/glowing-whale'


def load(path):
    return json.loads(path.read_text())


class WhaleEditTest(unittest.TestCase):
    def test_story_is_exactly_seven_ordered_scenes_sixty_seconds(self):
        story = load(PRODUCTION/'story.json')
        self.assertEqual([s['start'] for s in story],[0,8,17,26,35,44,53])
        self.assertEqual(sum(s['duration'] for s in story),60)
        for s in story:
            self.assertEqual(s['text'],' '.join(x['text'] for x in s['sentences']))
            self.assertEqual(sorted(x['at'] for x in s['sentences']),[x['at'] for x in s['sentences']])

    def test_visual_handles_cover_all_frames_without_loop_or_zoom(self):
        scenes = load(SRC/'scenes.json')
        config = load(PRODUCTION/'veo.json')
        source = (SRC/'Video.tsx').read_text()
        self.assertNotIn('scale:', source)
        self.assertNotIn('translate:', source)
        self.assertNotIn(' loop', source)
        self.assertIn('muted playbackRate', source)
        self.assertEqual(source.count('<Sequence name='),7)
        for frame in range(1800):
            self.assertTrue(any(s['start']*30 <= frame < round((s['start']+s['duration']+(.3 if i<6 else 0))*30) for i,s in enumerate(scenes)))
        for i,(s,shot) in enumerate(zip(scenes,config['shots'])):
            self.assertEqual(s['id'],shot['scene'])
            self.assertAlmostEqual(shot['timelineSeconds'],s['duration']+(.3 if i<6 else 0))
            self.assertGreaterEqual(min(1,8/shot['timelineSeconds']),.85)

    def test_captions_match_authored_voice_and_stay_on_their_scene_clock(self):
        captions = load(SRC/'captions.json')
        story = load(PRODUCTION/'story.json')
        for scene,pages in zip(story,captions):
            self.assertTrue(pages,'Generate and verify the narration before shipping')
            self.assertEqual(' '.join(p['text'] for p in pages),scene['text'])
            previous = 0
            for p in pages:
                self.assertLessEqual(previous,p['startMs'])
                self.assertLess(p['startMs'],p['endMs'])
                self.assertLessEqual(p['endMs'],scene['duration']*1000)
                previous = p['endMs']

    def test_foley_uses_source_seconds_inside_selected_footage(self):
        config = load(PRODUCTION/'veo.json')
        durations = {s['scene']: min(8,s['timelineSeconds']) for s in config['shots']}
        for cue in load(PRODUCTION/'foley.json'):
            self.assertTrue(0 <= cue['sourceSecond'] < durations[cue['scene']])
            self.assertLessEqual(cue['gain'],.5)
            self.assertIn(cue['kind'],('bubble','swim','ripple','glow'))

    def test_only_new_project_is_registered(self):
        registry = (ROOT/'src/projects/registry.tsx').read_text()
        self.assertIn('id="GlowingWhale" component={GlowingWhaleVideo} durationInFrames={1800} fps={30} width={1080} height={1920}',registry)
        self.assertIn('id="GlowingWhaleThumbnail"',registry)

    def test_rejected_morphing_ending_is_not_selected(self):
        takes = load(SRC/'takes.json')
        self.assertEqual(takes['07-shine'],'07-shine-v2')
        config = load(PRODUCTION/'veo-ending-v2.json')
        self.assertEqual(config['shots'][0]['scene'],takes['07-shine'])


if __name__ == '__main__':
    unittest.main()
