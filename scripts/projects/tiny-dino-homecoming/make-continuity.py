"""Generate dependent continuations; never resubmit unknown network outcomes."""
import argparse
import json
from pathlib import Path
import runpy
import subprocess

ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).parent


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--max-new-jobs',type=int,default=0)
    parser.add_argument('--max-overload-retries',type=int,default=2)
    parser.add_argument('--wait-seconds',type=float,default=0)
    args=parser.parse_args()
    if args.max_new_jobs>0:
        parser.error('Batch generation/retries disabled for cost safety. Approve and submit one scene manually through make-veo.py.')
    assert 0<=args.max_new_jobs<=5
    assert 0<=args.wait_seconds<=20
    veo=runpy.run_path(str(ROOT/'scripts/shared/make-veo.py'))
    config=json.loads((HERE/'veo-continuity.json').read_text())
    cache=ROOT/'.cache/veo-gemini/tiny-dino-homecoming/jobs.json'
    submitted=0
    for shot in config['shots']:
        clips=json.loads((ROOT/'src/projects/tiny-dino-homecoming/footage.json').read_text())
        if not clips.get(shot['previous']):
            print(shot['scene']+': waiting for preceding clip',flush=True);continue
        image=ROOT/'public'/shot['image']
        if not image.exists():
            image.parent.mkdir(parents=True,exist_ok=True)
            subprocess.run([str(veo['FFMPEG']),'-v','error','-ss',str(max(0,shot['previousSourceEnd']-.08)),'-i',str(ROOT/'public'/clips[shot['previous']]['src']),'-frames:v','1',str(image)],check=True)
            if not image.exists():
                print(shot['scene']+': no end-frame decoded; no API submission',flush=True);continue
        state=json.loads(cache.read_text()) if cache.exists() else {}
        job=state.get(shot['scene'])
        failures=sum(x.get('scene')==shot['scene'] for x in state.get('_failedJobs',[]))
        retry=bool(job and job['status']=='failed' and '"code": 8' in job.get('error','') and failures<args.max_overload_retries)
        can_submit=(not job or retry) and submitted<args.max_new_jobs
        task=argparse.Namespace(config='scripts/projects/tiny-dino-homecoming/veo-continuity.json',scene=shot['scene'],dry_run=False,check=False,poll_only=not can_submit,max_new_jobs=1 if can_submit else 0,wait_seconds=args.wait_seconds,retry_overload=retry and can_submit,skip_failed=True,skip_unresolved=True,retry_uncertain=False)
        try:
            veo['run'](task)
        except Exception as error:
            print(shot['scene']+': '+veo['safe_message'](str(error)),flush=True)
        if can_submit:submitted+=1
    clips=json.loads((ROOT/'src/projects/tiny-dino-homecoming/footage.json').read_text())
    print(f"Continuations ready: {sum(bool(clips.get(s['scene'])) for s in config['shots'])}/{len(config['shots'])}",flush=True)


if __name__=='__main__':main()
