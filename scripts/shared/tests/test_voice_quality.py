"""Profile/compatibility guards; no model load or network."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from voice_quality import PROFILES, cache_key, normalize_gain, require_native_tempo


class VoiceQualityTests(unittest.TestCase):
    def setUp(self):
        self.sampling = {'top_k': 25, 'top_p': .95, 'repetition_penalty': 1.2}

    def test_legacy_cache_compatibility(self):
        text = 'Ta không phải đợi mất đi.'
        old = hashlib.sha256(('Hải Đăng|complete-sentences-0.50|' + text).encode()).hexdigest()[:16]
        self.assertEqual(cache_key('Hải Đăng',text,.5,PROFILES['legacy24'],{},self.sampling),old)

    def test_hq_cache_separates_engine_and_sampling(self):
        key=lambda engine,sampling: cache_key('Hải Đăng','Xin chào.',.8,PROFILES['natural48'],engine,sampling)
        self.assertNotEqual(key({'package':'a'},self.sampling),key({'package':'b'},self.sampling))
        self.assertNotEqual(key({},self.sampling),key({},{**self.sampling,'top_k':30}))
        self.assertNotEqual(key({},self.sampling),cache_key('Hải Đăng','Xin chào.',.8,PROFILES['legacy24'],{},self.sampling))

    def test_hq_preserves_native_rate_and_bit_depth(self):
        profile=PROFILES['natural48']
        self.assertEqual((profile.sample_rate,profile.subtype),(48000,'PCM_24'))
        self.assertFalse(profile.normalize_per_phrase)

    def test_hq_blocks_slowdown_and_speedup(self):
        require_native_tempo(PROFILES['natural48'],1)
        for speed in [.85,.96,1.001,1.1]:
            with self.assertRaises(RuntimeError):require_native_tempo(PROFILES['natural48'],speed)
        require_native_tempo(PROFILES['legacy24'],.96)

    def test_legacy_normalization_is_bit_equivalent(self):
        values=np.random.default_rng(1).normal(0,.1,5000)
        expected=values.copy()
        expected*=min(10**(-17.5/20)/np.sqrt(np.mean(expected*expected)),.76/np.max(np.abs(expected)))
        np.testing.assert_array_equal(normalize_gain(values),expected)

    def test_one_gain_preserves_dynamics_and_headroom(self):
        values=np.r_[np.full(1000,.025),np.full(1000,.2),np.zeros(1000)]
        adjusted=normalize_gain(values,active_only=True)
        self.assertAlmostEqual(adjusted[1500]/adjusted[500],8)
        self.assertLessEqual(np.max(np.abs(adjusted)),.760001)
        self.assertTrue(np.all(adjusted[-1000:]==0))

    def test_bad_audio_rejected(self):
        for values in [np.zeros(100),np.array([]),np.array([float('nan')])]:
            with self.assertRaises(RuntimeError):normalize_gain(values)


class PipelineTests(unittest.TestCase):
    def test_native_output_and_failure_dont_need_network(self):
        source=Path(__file__).resolve().parents[1]/'make-voice.py'
        spec=importlib.util.spec_from_file_location('voice_pipeline_test',source)
        pipeline=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(pipeline)
        class FakeTts:
            sample_rate=48000
            def infer(self,text,**kwargs):
                self.assertion=kwargs
                return .1*np.sin(2*np.pi*220*np.arange(19200)/48000)
            def close(self):pass
        with tempfile.TemporaryDirectory() as name:
            root=Path(name)
            story=[{'id':'test','start':0,'duration':1,'leadIn':.1,'tail':.1,
                    'text':'Xin chào.','sentences':[{'text':'Xin chào.','pauseAfter':0}]}]
            path=root/'story.json';path.write_text(json.dumps(story))
            args=['make-voice.py','--quality-profile','natural48','--story',str(path),
                  '--asset-dir',str(root),'--captions',str(root/'captions.json'),
                  '--srt',str(root/'captions.srt'),'--metadata',str(root/'metadata.json'),
                  '--docs',str(root/'script.md')]
            alignment=lambda *a: ([{'text':'Xin chào.','startMs':100,'endMs':450,'timestampMs':100,'confidence':None}],{'wordMatchRatio':1})
            with patch.object(pipeline,'ROOT',root),patch.object(pipeline,'Vieneu',return_value=FakeTts()) as ctor,patch.object(pipeline,'align_captions',side_effect=alignment),patch.dict(sys.modules,{'faster_whisper':SimpleNamespace(WhisperModel=lambda *a,**k: object())}),patch.object(sys,'argv',args):
                pipeline.main()
                ctor.assert_called_once_with(mode='v3turbo',backend='onnx',device='cpu',precision='fp32',threads=4)
                info=sf.info(root/'test-voice-full.wav')
                self.assertEqual((info.samplerate,info.subtype,info.frames),(48000,'PCM_24',48000))
                meta=json.loads((root/'metadata.json').read_text())[0]
                self.assertFalse(meta['styleAppliedByModel'])
                self.assertEqual(meta['gainScope'],'scene')
                self.assertEqual(meta['speed'],1)
                approved=(root/'test-voice-full.wav').read_bytes()
                approved_meta=(root/'metadata.json').read_bytes()
                story[0]['duration']=.3
                path.write_text(json.dumps(story))
                with self.assertRaisesRegex(RuntimeError,'keeps narration at 1x'):pipeline.main()
                self.assertEqual((root/'test-voice-full.wav').read_bytes(),approved)
                self.assertEqual((root/'metadata.json').read_bytes(),approved_meta)


if __name__=='__main__':unittest.main()
