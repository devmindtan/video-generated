"""Financially relevant checks: resumability, no duplicate jobs, safe publication."""
import argparse
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC=importlib.util.spec_from_file_location('make_veo',Path(__file__).parents[1]/'make-veo.py')
veo=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(veo)


class VeoTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        self.root_patch=patch.object(veo,'ROOT',self.root)
        self.root_patch.start()
        self.env_patch=patch.dict('os.environ',{'GEMINI_API_KEY':'secret-test-key'})
        self.env_patch.start()
        self.config={'provider':'gemini','model':'veo-3.1-generate-preview','aspectRatio':'9:16','resolution':'720p','durationSeconds':8,'sampleCount':1,'negativePrompt':'no text','promptSuffix':'same character','shots':[{'scene':'01-test','image':'demo/images/test.png','timelineSeconds':12,'prompt':'wave'}]}
        config_path=self.root/'scripts/projects/demo/veo.json'
        config_path.parent.mkdir(parents=True)
        config_path.write_text(json.dumps(self.config))
        (config_path.parent/'story.json').write_text('[{"duration":12}]')
        (self.root/'scripts/gemini-video-pricing.json').write_text(json.dumps({'verifiedAt':veo.budget.today().isoformat(),'sourceUrl':'https://ai.google.dev/gemini-api/docs/pricing','usdPerSecond':{'veo-3.1-generate-preview':{'720p':'0.01'}},'exchangeRate':{'vndPerUsd':'25000','verifiedAt':veo.budget.today().isoformat(),'source':'fixture, not a live rate'},'taxAndFeeMultiplier':'1.20'}))
        (self.root/'scripts/veo-safety.json').write_text('{"generationEnabled":true}')
        self.download_patch=patch.object(veo,'download_video',side_effect=lambda uri,path:path.write_bytes(b'mp4-fixture'))
        self.download_patch.start()
        image=self.root/'public/demo/images/test.png'
        image.parent.mkdir(parents=True);image.write_bytes(b'png-fixture')
        self.manifest=self.root/'src/projects/demo/footage.json'
        self.manifest.parent.mkdir(parents=True);self.manifest.write_text('{"01-test":null}')
        self.args=argparse.Namespace(config='scripts/projects/demo/veo.json',scene='01-test',dry_run=False,check=False,poll_only=False,max_new_jobs=1,wait_seconds=0,allow_paid=True)

    def tearDown(self):
        self.download_patch.stop();self.env_patch.stop();self.root_patch.stop();self.temp.cleanup()

    def test_pending_job_is_polled_without_duplicate_paid_submission(self):
        calls=[]
        def fake(url,body=None):
            calls.append(url)
            return {'name':'models/veo-3.1-generate-preview/operations/saved-operation'} if url.endswith(':predictLongRunning') else {'done':False}
        with patch.object(veo,'request',side_effect=fake):
            veo.run(self.args)
            veo.run(self.args)
        self.assertEqual(sum(u.endswith(':predictLongRunning') for u in calls),1)
        self.assertEqual(sum('/operations/' in u for u in calls),2)

    def test_poll_only_never_creates_job(self):
        self.args.poll_only=True
        with patch.object(veo,'request') as request:
            veo.run(self.args)
        request.assert_not_called()

    def test_network_timeout_keeps_uncertain_job_and_blocks_resubmission(self):
        with patch.object(veo,'request',side_effect=TimeoutError('network timeout')):
            with self.assertRaises(TimeoutError):veo.run(self.args)
        with patch.object(veo,'request') as request:
            with self.assertRaisesRegex(veo.GoogleError,'uncertain'):veo.run(self.args)
        request.assert_not_called()

    def test_changed_prompt_does_not_overwrite_or_create_second_job(self):
        with patch.object(veo,'request',side_effect=[{'name':'models/veo-3.1-generate-preview/operations/existing'}, {'done':False}]):
            veo.run(self.args)
        self.config['shots'][0]['prompt']='different motion'
        (self.root/self.args.config).write_text(json.dumps(self.config))
        with patch.object(veo,'request') as request:
            with self.assertRaisesRegex(veo.GoogleError,'changed'):veo.run(self.args)
        request.assert_not_called()

    def test_failed_generation_does_not_publish_manifest(self):
        with patch.object(veo,'request',side_effect=[{'name':'models/veo-3.1-generate-preview/operations/existing'},{'done':True,'error':{'message':'blocked'}}]):
            with self.assertRaisesRegex(veo.GoogleError,'blocked'):veo.run(self.args)
        self.assertIsNone(json.loads(self.manifest.read_text())['01-test'])

    def test_successful_clip_is_verified_and_retimed_before_publish(self):
        self.config['slug']='demo'
        operation={'response':{'generateVideoResponse':{'generatedSamples':[{'video':{'uri':veo.GEMINI_BASE+'/files/test:download?alt=media'}}]}}}
        job={}
        with patch.object(veo,'probe',return_value={'durationSeconds':8,'width':720,'height':1280}):
            veo.publish(self.config,self.config['shots'][0],job,operation,self.manifest)
        clip=json.loads(self.manifest.read_text())['01-test']
        self.assertAlmostEqual(clip['playbackRate'],8/12)
        self.assertEqual(job['status'],'complete')
        self.assertTrue((self.root/'public'/clip['src']).is_file())

    def test_error_messages_redact_key(self):
        self.assertEqual(veo.safe_message('bad secret-test-key'),'bad [REDACTED]')

    def test_landscape_clip_can_be_published(self):
        self.config.update(slug='demo',aspectRatio='16:9')
        operation={'response':{'generateVideoResponse':{'generatedSamples':[{'video':{'uri':veo.GEMINI_BASE+'/files/test:download?alt=media'}}]}}}
        with patch.object(veo,'probe',return_value={'durationSeconds':8,'width':1280,'height':720}):
            veo.publish(self.config,self.config['shots'][0],{},operation,self.manifest)
        self.assertIsNotNone(json.loads(self.manifest.read_text())['01-test'])

    def test_wrong_aspect_ratio_never_publishes(self):
        self.config.update(slug='demo',aspectRatio='16:9')
        operation={'response':{'generateVideoResponse':{'generatedSamples':[{'video':{'uri':veo.GEMINI_BASE+'/files/test:download?alt=media'}}]}}}
        with patch.object(veo,'probe',return_value={'durationSeconds':8,'width':720,'height':1280}):
            with self.assertRaisesRegex(ValueError,'does not match'):
                veo.publish(self.config,self.config['shots'][0],{},operation,self.manifest)
        self.assertIsNone(json.loads(self.manifest.read_text())['01-test'])

    def test_skip_failed_never_resubmits(self):
        with patch.object(veo,'request',side_effect=[{'name':'models/veo-3.1-generate-preview/operations/existing'},{'done':True,'error':{'code':8,'message':'overloaded'}}]):
            with self.assertRaises(veo.GoogleError):veo.run(self.args)
        self.args.skip_failed=True
        with patch.object(veo,'request') as request:
            veo.run(self.args)
        request.assert_not_called()

    def test_repository_path_escape_is_rejected(self):
        with self.assertRaises(ValueError):veo.local_path('../outside')

    def test_uncertain_retry_requires_one_explicit_scene(self):
        with patch.object(veo,'request',side_effect=TimeoutError('connection lost')):
            with self.assertRaises(TimeoutError):veo.run(self.args)
        self.args.retry_uncertain=True
        with patch.object(veo,'request') as request:
            with self.assertRaisesRegex(veo.GoogleError,'Retries are disabled'):
                veo.run(self.args)
        request.assert_not_called()

    def test_uncertain_retry_is_disabled_even_with_allow_paid(self):
        with patch.object(veo,'request',side_effect=TimeoutError('connection lost')):
            with self.assertRaises(TimeoutError):veo.run(self.args)
        self.args.retry_uncertain=True
        self.args.scene='01-test'
        with patch.object(veo,'request') as request:
            with self.assertRaisesRegex(veo.GoogleError,'Retries are disabled'):veo.run(self.args)
        request.assert_not_called()
        state=json.loads((self.root/'.cache/veo-gemini/demo/jobs.json').read_text())
        self.assertEqual(state['01-test']['status'],'uncertain')

    def test_zero_job_limit_preserves_failed_job(self):
        with patch.object(veo,'request',side_effect=[{'name':'models/veo-3.1-generate-preview/operations/existing'},{'done':True,'error':{'code':8,'message':'overloaded'}}]):
            with self.assertRaises(veo.GoogleError):veo.run(self.args)
        self.args.retry_overload=True
        self.args.max_new_jobs=0
        self.args.skip_failed=True
        with patch.object(veo,'request') as request:
            veo.run(self.args)
        request.assert_not_called()
        state=json.loads((self.root/'.cache/veo-gemini/demo/jobs.json').read_text())
        self.assertEqual(state['01-test']['status'],'failed')

    def test_locked_policy_blocks_even_explicit_paid_cli_before_network(self):
        (self.root/'scripts/veo-safety.json').write_text('{"generationEnabled":false}')
        with patch.object(veo,'request') as request:
            with self.assertRaisesRegex(veo.GoogleError,'LOCKED'):veo.run(self.args)
        request.assert_not_called()

    def test_opt_in_requires_one_scene_and_one_job(self):
        for name,value in [('allow_paid',False),('scene',None),('max_new_jobs',2)]:
            args=argparse.Namespace(**vars(self.args));setattr(args,name,value)
            with patch.object(veo,'request') as request:
                with self.assertRaisesRegex(veo.GoogleError,'one --scene'):veo.run(args)
            request.assert_not_called()

    def test_dry_run_sends_no_request_even_when_locked(self):
        self.args.dry_run=True
        (self.root/'scripts/veo-safety.json').write_text('{"generationEnabled":false}')
        with patch.object(veo,'request') as request:veo.run(self.args)
        request.assert_not_called()

    def test_model_check_is_get_not_generation(self):
        self.args.check=True
        with patch.object(veo,'request') as request:veo.run(self.args)
        request.assert_called_once_with(veo.endpoint(self.config))

    def test_vertex_provider_is_rejected(self):
        self.config['provider']='vertex'
        with self.assertRaisesRegex(veo.GoogleError,'no alternative API provider'):veo.endpoint(self.config)

    def test_legacy_vertex_states_are_never_polled_or_migrated(self):
        old=self.root/'.cache/veo/demo/jobs.json';old.parent.mkdir(parents=True)
        old.write_text('{"01-test":{"status":"pending","operation":"projects/old-operation"}}')
        self.args.poll_only=True
        with patch.object(veo,'request') as request:veo.run(self.args)
        request.assert_not_called()
        self.assertIn('projects/old-operation',old.read_text())

    def test_existing_local_footage_never_generates_duplicate(self):
        clip=self.root/'public/demo/video/01-test.mp4';clip.parent.mkdir(parents=True);clip.write_bytes(b'mp4')
        self.manifest.write_text('{"01-test":{"src":"demo/video/01-test.mp4"}}')
        with patch.object(veo,'request') as request:veo.run(self.args)
        request.assert_not_called()

    def test_payload_uses_gemini_format_not_vertex(self):
        body=veo.payload(self.config,self.config['shots'][0])
        self.assertIn('inlineData',body['instances'][0]['image'])
        self.assertEqual(body['parameters']['numberOfVideos'],1)
        self.assertNotIn('generateAudio',body['parameters'])
        self.assertNotIn('sampleCount',body['parameters'])

    def test_budget_is_reserved_before_network_timeout_and_not_refunded(self):
        with patch.object(veo,'request',side_effect=TimeoutError('lost connection')):
            with self.assertRaises(TimeoutError):veo.run(self.args)
        ledger=veo.budget.summary(self.root,'demo')
        self.assertEqual(ledger['reservedVnd'],2400)
        self.assertEqual(ledger['reservations'],1)

    def test_missing_price_blocks_request_even_after_unlock(self):
        (self.root/'scripts/gemini-video-pricing.json').write_text('{}')
        with patch.object(veo,'request') as request:
            with self.assertRaises(ValueError):veo.run(self.args)
        request.assert_not_called()

    def test_whole_short_cap_blocks_even_one_expensive_clip(self):
        prices=json.loads((self.root/'scripts/gemini-video-pricing.json').read_text())
        prices['usdPerSecond']['veo-3.1-generate-preview']['720p']='0.40'
        (self.root/'scripts/gemini-video-pricing.json').write_text(json.dumps(prices))
        with patch.object(veo,'request') as request:
            with self.assertRaisesRegex(ValueError,'budget exceeded'):veo.run(self.args)
        request.assert_not_called()


class TransportSafetyTests(unittest.TestCase):
    def test_other_paid_api_methods_cannot_bypass_the_video_budget(self):
        with patch.object(veo.urllib.request,'build_opener') as opener:
            with self.assertRaisesRegex(veo.GoogleError,'Unsupported paid API method'):
                veo.request(veo.GEMINI_BASE+'/models/another-model:generateContent',{})
        opener.assert_not_called()

    def test_generation_without_reservation_never_reaches_network(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'scripts').mkdir()
            (root/'scripts/veo-safety.json').write_text('{"generationEnabled":true}')
            with patch.object(veo,'ROOT',root),patch.object(veo.urllib.request,'build_opener') as opener:
                with self.assertRaisesRegex(veo.GoogleError,'budget authorization'):
                    veo.request(veo.GEMINI_BASE+'/models/veo-3.1-fast-generate-preview:predictLongRunning',{})
            opener.assert_not_called()

    def test_vertex_and_external_hosts_never_receive_credentials(self):
        for url in ['https://us-central1-aiplatform.googleapis.com/v1/projects/test','https://aiplatform.googleapis.com/v1/test','https://example.com/test']:
            with patch.object(veo.urllib.request,'build_opener') as opener:
                with self.assertRaisesRegex(ValueError,'Only Gemini'):veo.request(url,{})
            opener.assert_not_called()

    def test_vertex_key_and_oauth_are_not_used_as_gemini_key(self):
        with patch.dict('os.environ',{'GOOGLE_API_KEY':'legacy','GOOGLE_OAUTH_ACCESS_TOKEN':'old-token'},clear=True):
            with self.assertRaisesRegex(veo.GoogleError,'GEMINI_API_KEY'):veo.request(veo.GEMINI_BASE+'/models/test')

    def test_download_to_external_host_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(veo.GoogleError,'Untrusted'):veo.download_video('https://evil.example/video.mp4',Path(directory)/'out.mp4')


if __name__=='__main__':unittest.main()
