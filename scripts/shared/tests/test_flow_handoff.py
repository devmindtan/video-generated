"""Flow handoff is offline and never overwrites a downloaded/existing source clip."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC=importlib.util.spec_from_file_location('flow_handoff',Path(__file__).parents[1]/'flow-handoff.py')
flow=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(flow)


class FlowHandoffTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        self.root_patch=patch.object(flow,'ROOT',self.root);self.root_patch.start()
        self.probe_patch=patch.object(flow.veo,'probe',return_value={'durationSeconds':8,'width':720,'height':1280});self.probe_patch.start()
        config=self.root/'scripts/projects/demo/veo.json';config.parent.mkdir(parents=True)
        shot={'scene':'01-a','image':'demo/images/01-a.png','timelineSeconds':8,'prompt':'swim'}
        config.write_text(json.dumps({'aspectRatio':'9:16','durationSeconds':8,'negativePrompt':'no text','promptSuffix':'same character','shots':[shot]}))
        image=self.root/'public/demo/images/01-a.png';image.parent.mkdir(parents=True);image.write_bytes(b'image')
        self.manifest=self.root/'src/projects/demo/footage.json';self.manifest.parent.mkdir(parents=True)
        self.manifest.write_text('{"01-a":null}')
        self.download=self.root/'download.mp4';self.download.write_bytes(b'new-video')

    def tearDown(self):
        self.probe_patch.stop();self.root_patch.stop();self.temp.cleanup()

    def test_export_is_offline_reproducible_and_reuses_package(self):
        with patch.object(flow.veo,'request') as network:
            first=flow.export_pack('demo');second=flow.export_pack('demo')
        network.assert_not_called()
        self.assertEqual(first,second)
        self.assertEqual((first/'01-a.png').read_bytes(),b'image')
        self.assertIn('swim same character',(first/'prompts.md').read_text())

    def test_import_defaults_to_validation_only(self):
        old=self.manifest.read_text()
        flow.import_clip('demo','01-a',self.download)
        self.assertEqual(old,self.manifest.read_text())
        self.assertFalse((self.root/'public/demo/video').exists())

    def test_existing_take_needs_explicit_replace(self):
        self.manifest.write_text('{"01-a":{"src":"demo/video/old.mp4"}}')
        with self.assertRaisesRegex(ValueError,'Existing take preserved'):
            flow.import_clip('demo','01-a',self.download,True)

    def test_apply_backs_up_manifest_and_keeps_old_mp4(self):
        old=self.root/'public/demo/video/old.mp4';old.parent.mkdir(parents=True);old.write_bytes(b'old-video')
        self.manifest.write_text('{"01-a":{"src":"demo/video/old.mp4"}}')
        with patch.object(flow.veo,'request') as network:
            flow.import_clip('demo','01-a',self.download,True,True)
        network.assert_not_called()
        active=json.loads(self.manifest.read_text())['01-a']
        self.assertEqual(active['provider'],'flow-manual')
        self.assertEqual((self.root/'public'/active['src']).read_bytes(),b'new-video')
        self.assertEqual(old.read_bytes(),b'old-video')
        self.assertEqual(len(list((self.root/'public/demo/backups/flow-import').glob('*.json'))),1)
        flow.import_clip('demo','01-a',self.download,True,True)

    def test_wrong_aspect_and_short_clip_are_rejected(self):
        for info,message in [({'durationSeconds':8,'width':1280,'height':720},'aspect ratio'),({'durationSeconds':4,'width':720,'height':1280},'too short')]:
            with patch.object(flow.veo,'probe',return_value=info):
                with self.assertRaisesRegex(ValueError,message):flow.import_clip('demo','01-a',self.download,True)
        self.assertIsNone(json.loads(self.manifest.read_text())['01-a'])

    def test_invalid_project_cannot_write_outside_workspace(self):
        with self.assertRaisesRegex(ValueError,'Invalid project'):flow.export_pack('../outside')

    def test_gemini_subscription_is_distinct_from_paid_api_and_flow(self):
        output=flow.export_pack('demo','gemini')
        self.assertIn('gemini-handoff',str(output))
        self.assertIn('Subscription allowance is not API credit',(output/'prompts.md').read_text())
        with patch.object(flow.veo,'request') as network:
            flow.import_clip('demo','01-a',self.download,True,False,'gemini')
        network.assert_not_called()
        self.assertEqual(json.loads(self.manifest.read_text())['01-a']['provider'],'gemini-app-manual')

    def test_rejected_take_is_not_exported(self):
        (self.manifest.parent/'takes.json').write_text('{"01-a":"01-a-v2"}')
        output=flow.export_pack('demo')
        self.assertEqual(json.loads((output/'queue.json').read_text()),[])


if __name__=='__main__':unittest.main()
