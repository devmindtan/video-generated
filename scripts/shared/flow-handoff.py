"""Offline Flow handoff: export images/prompts and validate/import downloaded clips.

No login, scraping, API calls, generation, rendering, or billing changes.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('veo_local',Path(__file__).with_name('make-veo.py'))
veo = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(veo)


def inside(path):
    path = (ROOT/path).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError('Destination must stay inside the repository')
    return path


def project_files(project):
    if not re.fullmatch(r'[a-z0-9-]+',project):
        raise ValueError('Invalid project slug')
    folder = inside(f'scripts/projects/{project}')
    shots = {}
    for path in sorted(folder.glob('veo*.json')):
        config = json.loads(path.read_text())
        for shot in config.get('shots',[]):
            if not re.fullmatch(r'[a-zA-Z0-9-]+',shot['scene']):
                raise ValueError('Invalid scene identifier')
            shots[shot['scene']] = (config,shot)
    if not shots:
        raise ValueError('No Veo shot descriptions found for this project')
    return shots


def export_pack(project,app='flow'):
    if app not in ('gemini','flow'):
        raise ValueError('Unsupported subscription app')
    shots = project_files(project)
    src = inside(f'src/projects/{project}')
    takes_path = src/'takes.json'
    takes = json.loads(takes_path.read_text()) if takes_path.exists() else {}
    rejected = {key for key,value in takes.items() if key != value}
    manifest = json.loads((src/'footage.json').read_text())
    # An immutable content-addressed package avoids overwriting an earlier handoff.
    records = []
    for key,(config,shot) in shots.items():
        if key in rejected:
            continue
        image = inside('public/'+shot['image'])
        if not image.is_file():
            continue  # Dependent continuation first frames may not yet exist.
        records.append({'scene':key,'aspectRatio':config['aspectRatio'],'sourceSeconds':config['durationSeconds'],'timelineSeconds':shot['timelineSeconds'],'image':image,'prompt':shot['prompt']+' '+shot.get('promptSuffix',config['promptSuffix']),'negativePrompt':config['negativePrompt'],'alreadyLocal':bool(manifest.get(key))})
    records.sort(key=lambda item:item['scene'])
    digest = hashlib.sha256()
    digest.update(app.encode())
    for item in records:
        digest.update(json.dumps({k:v for k,v in item.items() if k!='image'},sort_keys=True).encode())
        digest.update(item['image'].read_bytes())
    output = inside(f'public/{project}/{app}-handoff/{digest.hexdigest()[:12]}')
    if output.exists():
        print(f'Existing offline package: {output.relative_to(ROOT)}')
        return output
    output.mkdir(parents=True)
    lines = [f'# {app.title()} subscription handoff — '+project,'','Offline package only. No subscription/API request was sent.','Existing clips are marked: do not regenerate them unless you intentionally want a new take.',f'Review availability, number of outputs and your allowance in the {app.title()} UI before pressing Generate.','Subscription allowance is not API credit.','']
    queue = []
    for item in records:
        image = item['image']
        filename = item['scene']+image.suffix.lower()
        shutil.copy2(image,output/filename)
        lines.extend([f'## {item["scene"]}',f'- First frame: `{filename}`',f'- Format: {item["aspectRatio"]}; source {item["sourceSeconds"]}s',f'- Existing local clip: {"YES — reuse by default" if item["alreadyLocal"] else "NO"}','',item['prompt'],'','Avoid: '+item['negativePrompt'],''])
        queue.append({**{k:v for k,v in item.items() if k!='image'},'image':filename})
    (output/'prompts.md').write_text('\n'.join(lines)+'\n')
    (output/'queue.json').write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n')
    print(f'Offline Flow package: {output.relative_to(ROOT)} ({len(records)} shots; no generation)')
    return output


def import_clip(project,scene,source,apply=False,replace=False,app='flow'):
    if app not in ('gemini','flow'):
        raise ValueError('Unsupported subscription app')
    shots = project_files(project)
    if scene not in shots:
        raise ValueError('Unknown scene; use its exact key from the handoff package')
    config,shot = shots[scene]
    source = Path(source).expanduser().resolve()
    if not source.is_file() or source.suffix.lower()!='.mp4' or source.stat().st_size>300*1024*1024:
        raise ValueError('Expected a local MP4 smaller than 300 MB')
    info = veo.probe(source)
    expected = 9/16 if config['aspectRatio']=='9:16' else 16/9
    if abs(info['width']/info['height']-expected)>.02:
        raise ValueError('Clip aspect ratio does not match the scene')
    rate = min(1,info['durationSeconds']/shot['timelineSeconds'])
    if rate < .85:
        raise ValueError('Clip is too short: would require excessive slow motion; revise the cut or supply a longer clip')
    manifest_path = inside(f'src/projects/{project}/footage.json')
    manifest = json.loads(manifest_path.read_text())
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    asset = f'{project}/video/{app}-manual/{scene}-{digest[:12]}.mp4'
    previous = manifest.get(scene)
    if previous and previous.get('src')==asset:
        print('Identical Flow take already active; no change')
        return
    if previous and not replace:
        raise ValueError('Existing take preserved. Use --replace only after reviewing the replacement')
    entry = {'src':asset,'sourceDurationSeconds':info['durationSeconds'],'playbackRate':rate,'provider':('gemini-app-manual' if app=='gemini' else 'flow-manual'),'model':f'user-selected-in-{app}-app','sha256':digest}
    if not apply:
        print(json.dumps({'dryRun':True,'scene':scene,'clip':entry,'previousTakePreserved':True},indent=2))
        return
    # Share the manifest lock with Gemini; atomic publication, never overwrite MP4s.
    import fcntl
    lock_path = inside(f'.cache/veo-gemini/{project}/run.lock')
    lock_path.parent.mkdir(parents=True,exist_ok=True)
    with lock_path.open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        current = json.loads(manifest_path.read_text())
        if current.get(scene)!=previous:
            raise ValueError('Manifest changed during validation; retry after reviewing it')
        if previous:
            backup = inside(f'public/{project}/backups/flow-import/{scene}-{digest[:12]}.json')
            if not backup.exists():
                veo.atomic_json(backup,previous)
        target = inside('public/'+asset)
        target.parent.mkdir(parents=True,exist_ok=True)
        if not target.exists():
            shutil.copy2(source,target)
        elif hashlib.sha256(target.read_bytes()).hexdigest()!=digest:
            raise ValueError('Destination content mismatch; refusing overwrite')
        current[scene] = entry
        veo.atomic_json(manifest_path,current)
    print(f'Imported Flow take: {scene}; old MP4 retained. Regenerate SFX timing if motion changed. No rendering.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['export','import'])
    parser.add_argument('--project',required=True)
    parser.add_argument('--app',choices=['gemini','flow'],default='gemini',help='Subscription UI, never the paid API')
    parser.add_argument('--scene')
    parser.add_argument('--file')
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--replace',action='store_true')
    args = parser.parse_args()
    if args.action=='export':
        export_pack(args.project,args.app)
    else:
        if not args.scene or not args.file:
            parser.error('import requires --scene and --file; without --apply it only validates')
        import_clip(args.project,args.scene,args.file,args.apply,args.replace,args.app)


if __name__=='__main__':
    main()
