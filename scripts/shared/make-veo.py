#!/usr/bin/env python3
"""Gemini Developer API Veo, with paid generation locked by default.

No SDK dependency. Secrets are read only by this production script, never React.
"""
import argparse
import base64
import contextvars
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
FFMPEG = ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
_BUDGET_SPEC=importlib.util.spec_from_file_location('video_budget',Path(__file__).with_name('video-budget.py'))
budget=importlib.util.module_from_spec(_BUDGET_SPEC)
_BUDGET_SPEC.loader.exec_module(budget)
_SUBMISSION=contextvars.ContextVar('gemini_budget_authorization',default=None)


def generation_guard(args):
    policy_path = ROOT/'scripts/veo-safety.json'
    policy = json.loads(policy_path.read_text()) if policy_path.exists() else {}
    if policy.get('generationEnabled') is not True:
        raise GoogleError('Paid Veo generation is LOCKED in scripts/veo-safety.json. No API request was sent.')
    if not getattr(args,'allow_paid',False) or not args.scene or args.max_new_jobs != 1:
        raise GoogleError('Paid generation requires explicit --allow-paid, one --scene, and --max-new-jobs 1 after user approval.')
    if getattr(args,'retry_overload',False) or getattr(args,'retry_uncertain',False):
        raise GoogleError('Retries are disabled. Review the failure and approve a separate versioned clip manually.')
    if not os.environ.get('GEMINI_API_KEY'):
        raise GoogleError('Set GEMINI_API_KEY before reserving any budget; no API request sent.')


def load_env():
    path = ROOT/'.env.local'
    if path.exists():
        for line in path.read_text().splitlines():
            name, sep, value = line.strip().partition('=')
            if sep and name=='GEMINI_API_KEY':
                os.environ.setdefault(name, value.strip().strip('"\''))


def safe_message(message):
    for name in ('GEMINI_API_KEY',):
        secret = os.environ.get(name)
        if secret:
            message = message.replace(secret,'[REDACTED]')
    return message


def local_path(relative):
    path = (ROOT/relative).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError('Path must stay inside the repository')
    return path


def atomic_json(path, value):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp = path.with_suffix(path.suffix+'.tmp')
    temp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    temp.replace(path)


class GoogleError(RuntimeError):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def download_video(uri, target):
    """Follow signed Google download redirects without forwarding the API key."""
    opener=urllib.request.build_opener(NoRedirect)
    for _ in range(5):
        parsed=urllib.parse.urlsplit(uri)
        host=parsed.hostname or ''
        allowed=host in ('generativelanguage.googleapis.com','storage.googleapis.com') or host.endswith('.googleusercontent.com')
        if parsed.scheme!='https' or not allowed or parsed.username or parsed.password or parsed.port not in (None,443):
            raise GoogleError('Untrusted video download host')
        headers={}
        if host=='generativelanguage.googleapis.com':
            key=os.environ.get('GEMINI_API_KEY')
            if not key: raise GoogleError('Set GEMINI_API_KEY in .env.local')
            headers['x-goog-api-key']=key
        try:
            with opener.open(urllib.request.Request(uri,headers=headers),timeout=90) as response:
                with target.open('wb') as output:
                    count=0
                    while chunk:=response.read(1024*1024):
                        count+=len(chunk)
                        if count>200*1024*1024: raise GoogleError('Video download exceeds 200 MB safety limit')
                        output.write(chunk)
                return
        except urllib.error.HTTPError as error:
            if error.code in (301,302,303,307,308) and error.headers.get('Location'):
                uri=urllib.parse.urljoin(uri,error.headers['Location'])
                continue
            raise GoogleError(f'Video download failed: HTTP {error.code}') from None
    raise GoogleError('Too many video download redirects')


def request(url, payload=None):
    # Gemini-only transport; no alternative cloud provider or credentials.
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme!='https' or parsed.hostname!='generativelanguage.googleapis.com' or parsed.port not in (None,443) or parsed.username or parsed.password:
        raise ValueError('Only Gemini Developer API is allowed')
    if payload is not None and not parsed.path.endswith(':predictLongRunning'):
        raise GoogleError('Unsupported paid API method; this transport only supports budgeted Veo submissions')
    if payload is not None and parsed.path.endswith(':predictLongRunning'):
        policy_path=ROOT/'scripts/veo-safety.json'
        policy=json.loads(policy_path.read_text()) if policy_path.exists() else {}
        if policy.get('generationEnabled') is not True:
            raise GoogleError('Paid Veo generation is LOCKED. No API request was sent.')
        authorization=_SUBMISSION.get()
        digest=hashlib.sha256(json.dumps({'endpoint':url.removesuffix(':predictLongRunning'),'body':payload},sort_keys=True).encode()).hexdigest()
        if not authorization or authorization['digest']!=digest:
            raise GoogleError('Missing per-Short budget authorization. No API request sent.')
        budget.dispatch(ROOT,authorization['project'],authorization['id'],digest)
    headers={'Content-Type':'application/json'}
    key=os.environ.get('GEMINI_API_KEY')
    if key:
        headers['x-goog-api-key']=key
    else:
        raise GoogleError('Set GEMINI_API_KEY in .env.local')
    req=urllib.request.Request(url,data=json.dumps(payload).encode() if payload is not None else None,headers=headers)
    try:
        with urllib.request.build_opener(NoRedirect).open(req,timeout=90) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        data=json.loads(error.read().decode())
        api_error=data.get('error',{})
        message=api_error.get('message',str(error.code))
        reasons=[item['reason'] for item in api_error.get('details',[]) if item.get('reason')]
        if reasons:
            message+=' ['+', '.join(reasons)+']'
        raise GoogleError(safe_message(f'Google HTTP {error.code}: {message}')) from None


def endpoint(config):
    if config.get('provider') != 'gemini':
        raise GoogleError('Set provider=gemini explicitly; no alternative API provider is supported.')
    if config['model'] not in ('veo-3.1-generate-preview','veo-3.1-fast-generate-preview','veo-3.1-lite-generate-preview'):
        raise GoogleError('Unsupported Gemini Veo model. No automatic model/provider fallback.')
    return f'{GEMINI_BASE}/models/{config["model"]}'


def payload(config, shot):
    image=local_path('public/'+shot['image'])
    if image.suffix.lower() not in ('.png','.jpg','.jpeg'):
        raise ValueError('Only PNG/JPEG first-frame images are supported')
    return {
        'instances':[{'prompt':shot['prompt']+' '+shot.get('promptSuffix',config['promptSuffix']),'image':{'inlineData':{'data':base64.b64encode(image.read_bytes()).decode(),'mimeType':'image/png' if image.suffix.lower()=='.png' else 'image/jpeg'}}}],
        'parameters':{**{k:config[k] for k in ('aspectRatio','resolution','durationSeconds','negativePrompt')},'numberOfVideos':1},
    }


def probe(path):
    result=subprocess.run([str(FFMPEG),'-hide_banner','-i',str(path)],capture_output=True,text=True)
    duration=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',result.stderr)
    dimensions=re.search(r'Video:.*? (\d{3,5})x(\d{3,5})',result.stderr)
    if not duration or not dimensions:
        raise ValueError('Downloaded file has no readable video track')
    hours,minutes,seconds=map(float,duration.groups())
    width,height=map(int,dimensions.groups())
    return {'durationSeconds':hours*3600+minutes*60+seconds,'width':width,'height':height}


def publish(config, shot, job, operation, manifest_path):
    if operation.get('error'):
        raise GoogleError(safe_message(json.dumps(operation['error'],ensure_ascii=False)))
    response=operation.get('response',{})
    videos=response.get('generateVideoResponse',{}).get('generatedSamples',[])
    if not videos:
        raise GoogleError(f'No video returned; filtered count={response.get("raiMediaFilteredCount",0)}')
    video=videos[0].get('video',{})
    uri=video.get('uri')
    if not uri:
        raise GoogleError('Gemini response contains no video download URI')
    public_relative=f'{config["slug"]}/video/{shot["scene"]}.mp4'
    target=local_path('public/'+public_relative)
    target.parent.mkdir(parents=True,exist_ok=True)
    partial=target.with_suffix('.download.mp4')
    download_video(uri,partial)
    info=probe(partial)
    expected_ratio = 9/16 if config['aspectRatio']=='9:16' else 16/9
    if abs(info['width']/info['height']-expected_ratio)>.02:
        raise ValueError(f"Generated video does not match {config['aspectRatio']}")
    if info['durationSeconds']<config['durationSeconds']-.5:
        raise ValueError('Generated clip is shorter than requested')
    partial.replace(target)
    manifest=json.loads(manifest_path.read_text())
    # Retiming extends real motion to the 10/12s scene; no looping or frozen tail.
    manifest[shot['scene']]={'src':public_relative,'sourceDurationSeconds':info['durationSeconds'],'playbackRate':min(1,info['durationSeconds']/shot['timelineSeconds']),'model':config['model']}
    atomic_json(manifest_path,manifest)
    job.update(status='complete',asset=public_relative,video=info)
    return info


def run(args):
    load_env()
    config_path=local_path(args.config)
    config=json.loads(config_path.read_text())
    config['slug']=config_path.parent.name
    if getattr(args,'budget_status',False):
        print(json.dumps(budget.summary(ROOT,config['slug']),ensure_ascii=False,indent=2))
        return
    if config['sampleCount']!=1 or config['durationSeconds']!=8:
        raise ValueError('This pipeline is scoped to one 8-second clip per scene')
    if config['aspectRatio'] not in ('9:16','16:9'):
        raise ValueError('Supported video formats: 9:16 and 16:9')
    shots=[s for s in config['shots'] if not args.scene or s['scene']==args.scene]
    if not shots:
        raise ValueError('Unknown scene')
    policy_path=ROOT/'scripts/veo-safety.json'
    locked=not (policy_path.exists() and json.loads(policy_path.read_text()).get('generationEnabled') is True)
    plan={'provider':config.get('provider'),'model':config['model'],'generationLocked':locked,'shortBudgetVnd':20000,'newJobLimit':args.max_new_jobs,'warning':'Gemini Veo is paid. Dry-run sends no request.','shots':[]}
    for shot in shots:
        item={'scene':shot['scene'],'generationSeconds':8,'timelineSeconds':shot['timelineSeconds'],'image':shot['image']}
        try:
            item['costEstimate']=budget.quote(ROOT,dict(config,model=shot.get('model',config['model'])))
        except (ValueError,FileNotFoundError) as error:
            item['costBlockedReason']=str(error)
        plan['shots'].append(item)
    if args.dry_run:
        for shot in shots: payload(config,shot)
        print(json.dumps(plan,ensure_ascii=False,indent=2));return
    base=endpoint(config)
    if args.check:
        request(base)
        print('Gemini model metadata accessible. No video generation request sent.')
        return
    if args.max_new_jobs>0 and not args.poll_only:
        generation_guard(args)
    cache=ROOT/'.cache/veo-gemini'/config['slug']
    cache.mkdir(parents=True,exist_ok=True)
    with (cache/'run.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        state_path=cache/'jobs.json'
        state=json.loads(state_path.read_text()) if state_path.exists() else {}
        manifest_path=ROOT/'src/projects'/config['slug']/'footage.json'
        new_jobs=0
        for shot in shots:
            existing=json.loads(manifest_path.read_text()).get(shot['scene'])
            if existing and local_path('public/'+existing['src']).is_file():
                print(shot['scene']+': reusing local footage; no API call',flush=True)
                continue
            effective_config=dict(config,model=shot.get('model',config['model']))
            base=endpoint(effective_config)
            body=payload(effective_config,shot)
            digest=hashlib.sha256(json.dumps({'endpoint':base,'body':body},sort_keys=True).encode()).hexdigest()
            job=state.get(shot['scene'])
            if job and job['digest']!=digest:
                raise GoogleError(f'{shot["scene"]}: prompt/model/project changed. Keep existing job; use a new scene version rather than accidentally paying twice.')
            if job and job['status']=='complete':
                if not local_path('public/'+job['asset']).is_file():
                    raise GoogleError('Published asset missing; recover its operation instead of submitting another job')
                print(shot['scene']+': already complete',flush=True);continue
            if job and job['status'] in ('submitting','failed','uncertain'):
                if job['status'] in ('submitting','uncertain') and getattr(args,'skip_unresolved',False):
                    print(shot['scene']+': unresolved submission preserved; skipping without resubmission',flush=True)
                    continue
                if job['status']=='failed' and getattr(args,'skip_failed',False):
                    print(shot['scene']+': terminal failure saved; skipping without retry',flush=True)
                    continue
                raise GoogleError(f'{shot["scene"]}: job is {job["status"]}; inspect the saved job before any new paid submission')
            if not job:
                if args.poll_only or new_jobs>=args.max_new_jobs:
                    print(shot['scene']+': not submitted',flush=True);continue
                reservation=budget.reserve(ROOT,config['slug'],shot['scene'],digest,budget.quote(ROOT,effective_config))
                job={'digest':digest,'status':'submitting','provider':'gemini','model':effective_config['model'],'createdAt':time.time(),'budgetReservation':reservation['id'],'reservedVnd':reservation['reserveVnd']}
                state[shot['scene']]=job;atomic_json(state_path,state)
                try:
                    token=_SUBMISSION.set({'project':config['slug'],'id':reservation['id'],'digest':digest})
                    try:
                        operation=request(base+':predictLongRunning',body)
                    finally:
                        _SUBMISSION.reset(token)
                    if not operation.get('name'):
                        raise GoogleError('No operation name returned; submission status uncertain')
                except GoogleError as error:
                    job.update(status='failed',error=safe_message(str(error)));atomic_json(state_path,state);raise
                except Exception:
                    job['status']='uncertain';atomic_json(state_path,state);raise
                job.update(status='pending',operation=operation['name'])
                atomic_json(state_path,state);new_jobs+=1
                print(shot['scene']+': submitted; operation saved',flush=True)
            deadline=time.monotonic()+args.wait_seconds
            while True:
                name=job['operation']
                if not re.fullmatch(r'models/[a-z0-9.-]+/operations/[A-Za-z0-9_-]+',name):
                    raise GoogleError('Invalid Gemini operation name')
                operation=request(GEMINI_BASE+'/'+name,None)
                if operation.get('done'):
                    try:
                        info=publish(effective_config,shot,job,operation,manifest_path)
                    except Exception as error:
                        job.update(status='failed',error=safe_message(str(error)));atomic_json(state_path,state)
                        if getattr(args,'skip_failed',False):
                            print(shot['scene']+': '+safe_message(str(error)),flush=True)
                            break
                        raise
                    atomic_json(state_path,state)
                    print(f'{shot["scene"]}: published {info["width"]}x{info["height"]}, {info["durationSeconds"]:.2f}s',flush=True)
                    break
                if time.monotonic()>=deadline:
                    print(shot['scene']+': pending; rerun with --poll-only to resume',flush=True);break
                time.sleep(min(10,max(0,deadline-time.monotonic())))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',default='scripts/projects/tiny-dino-adventure/veo.json')
    parser.add_argument('--scene')
    parser.add_argument('--dry-run',action='store_true')
    parser.add_argument('--check',action='store_true')
    parser.add_argument('--poll-only',action='store_true')
    parser.add_argument('--retry-overload',action='store_true',help='Removed: retries are disabled; kept only to reject old commands safely')
    parser.add_argument('--skip-failed',action='store_true',help='Leave failed jobs intact while processing other scenes; never retries')
    parser.add_argument('--skip-unresolved',action='store_true',help='Leave uncertain/submitting jobs intact and process other scenes; never resubmits')
    parser.add_argument('--retry-uncertain',action='store_true',help='Removed: uncertain requests are never resubmitted automatically')
    parser.add_argument('--allow-paid',action='store_true',help='One approved scene only; safety policy must also be unlocked explicitly')
    parser.add_argument('--budget-status',action='store_true',help='Read cumulative per-Short reservations without calling any API')
    parser.add_argument('--max-new-jobs',type=int,default=0)
    parser.add_argument('--wait-seconds',type=float,default=45)
    args=parser.parse_args()
    if args.retry_uncertain and not args.scene:
        parser.error('--retry-uncertain requires --scene and prior user approval')
    if not 0<=args.max_new_jobs<=5 or not 0<=args.wait_seconds<=50:
        parser.error('Use 0–5 new jobs and 0–50 seconds per poll window')
    try:
        run(args)
    except Exception as error:
        print(safe_message(str(error)),file=sys.stderr)
        return 1
    return 0


if __name__=='__main__':
    sys.exit(main())
