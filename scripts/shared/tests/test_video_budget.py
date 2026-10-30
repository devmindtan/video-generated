"""Money-safety tests. All rates are fixtures, never live API calls."""
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SPEC=importlib.util.spec_from_file_location('video_budget_test',Path(__file__).parents[1]/'video-budget.py')
budget=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(budget)


class VideoBudgetTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        folder=self.root/'scripts/projects/short';folder.mkdir(parents=True)
        (folder/'story.json').write_text('[{"duration":30},{"duration":30}]')
        self.config={'model':'veo-3.1-fast-generate-preview','resolution':'720p','durationSeconds':8,'sampleCount':1}
        self.prices={'verifiedAt':budget.today().isoformat(),'sourceUrl':'https://ai.google.dev/gemini-api/docs/pricing','usdPerSecond':{self.config['model']:{'720p':'0.05'}},'exchangeRate':{'vndPerUsd':'25000','verifiedAt':budget.today().isoformat(),'source':'TEST FIXTURE'},'taxAndFeeMultiplier':'1.20'}
        self.save_prices()

    def tearDown(self):self.temp.cleanup()

    def save_prices(self):(self.root/'scripts/gemini-video-pricing.json').write_text(json.dumps(self.prices))

    def test_quote_uses_source_seconds_fx_and_fee_buffer(self):
        self.assertEqual(budget.quote(self.root,self.config)['reserveVnd'],12000)

    def test_missing_unknown_or_stale_rates_fail_closed(self):
        for value in [None,'NaN','Infinity','-1','0']:
            self.prices['exchangeRate']['vndPerUsd']=value;self.save_prices()
            with self.assertRaises(ValueError):budget.quote(self.root,self.config)
        self.prices['exchangeRate']['vndPerUsd']='25000'
        self.prices['verifiedAt']=(budget.today()-timedelta(days=8)).isoformat();self.save_prices()
        with self.assertRaisesRegex(ValueError,'stale'):budget.quote(self.root,self.config)

    def test_multiple_scenes_and_versions_share_one_twenty_thousand_cap(self):
        budget.reserve(self.root,'short','01-v1','first',{'reserveVnd':12000})
        with self.assertRaisesRegex(ValueError,'budget exceeded'):
            budget.reserve(self.root,'short','02-v2','second',{'reserveVnd':12000})
        self.assertEqual(budget.summary(self.root,'short')['remainingVnd'],8000)

    def test_exact_cap_is_allowed_but_one_more_dong_is_not(self):
        budget.reserve(self.root,'short','01','first',{'reserveVnd':20000})
        with self.assertRaisesRegex(ValueError,'budget exceeded'):
            budget.reserve(self.root,'short','02','second',{'reserveVnd':1})

    def test_concurrent_requests_cannot_both_spend_remaining_budget(self):
        def attempt(index):
            try:
                budget.reserve(self.root,'short',str(index),str(index),{'reserveVnd':12000})
                return True
            except ValueError:return False
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes=list(pool.map(attempt,[1,2]))
        self.assertEqual(sum(outcomes),1)
        self.assertEqual(budget.summary(self.root,'short')['reservedVnd'],12000)

    def test_dispatch_authorization_is_single_use(self):
        item=budget.reserve(self.root,'short','01','digest',{'reserveVnd':12000})
        budget.dispatch(self.root,'short',item['id'],'digest')
        with self.assertRaisesRegex(ValueError,'already-used'):
            budget.dispatch(self.root,'short',item['id'],'digest')
        self.assertEqual(budget.summary(self.root,'short')['reservedVnd'],12000)

    def test_same_request_is_not_reserved_twice(self):
        budget.reserve(self.root,'short','01','digest',{'reserveVnd':1000})
        with self.assertRaisesRegex(ValueError,'already has a reservation'):
            budget.reserve(self.root,'short','01','digest',{'reserveVnd':1000})

    def test_long_video_has_no_implicit_budget_authorization(self):
        (self.root/'scripts/projects/short/story.json').write_text('[{"duration":180}]')
        with self.assertRaisesRegex(ValueError,'no budget approved for long'):
            budget.reserve(self.root,'short','01','digest',{'reserveVnd':1000})

    def test_cleared_ledger_with_existing_api_jobs_does_not_reset_spend(self):
        path=self.root/'.cache/veo-gemini/short/jobs.json';path.parent.mkdir(parents=True)
        path.write_text('{"01":{"status":"pending"}}')
        with self.assertRaisesRegex(ValueError,'reconcile'):
            budget.reserve(self.root,'short','02','digest',{'reserveVnd':1000})

    def test_manipulated_negative_or_raised_cap_is_rejected(self):
        budget.reserve(self.root,'short','01','digest',{'reserveVnd':1000})
        path=budget.project_path(self.root,'short');data=json.loads(path.read_text())
        data['capVnd']=100000;path.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError,'Invalid budget ledger'):budget.summary(self.root,'short')


if __name__=='__main__':unittest.main()
