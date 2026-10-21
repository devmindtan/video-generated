#!/usr/bin/env python3
"""Download or verify the 20 upstream repositories without installing build dependencies."""
import concurrent.futures
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
REPOS = ['remotion-dev/skills', 'motiondivision/ai-kit', 'greensock/gsap-skills', 'svg/svgo', 'vercel/satori', 'greensock/GSAP', 'juliangarnier/anime', 'motiondivision/motion', 'rive-app/rive-wasm', 'LottieFiles/dotlottie-web', 'remotion-dev/remotion', 'motion-canvas/motion-canvas', 'mrdoob/three.js', 'pmndrs/react-three-fiber', 'pmndrs/drei', 'pmndrs/react-three-rapier', 'pmndrs/react-postprocessing', 'goldfire/howler.js', 'Vanilagy/mediabunny', 'FFmpeg/FFmpeg']

def clone(repo):
    dest = ROOT / 'repos' / repo.replace('/', '--')
    url = f'https://github.com/{repo}.git'
    if not dest.exists():
        result = subprocess.run(['git', 'clone', '--depth', '1', url, str(dest)], capture_output=True, text=True)
        if result.returncode:
            return {'repo': repo, 'error': result.stderr.strip()}
    result = subprocess.run(['git', '-C', str(dest), 'rev-parse', 'HEAD'], capture_output=True, text=True)
    return {'repo': repo, 'path': str(dest.relative_to(ROOT)), 'commit': result.stdout.strip(), **({'error': result.stderr.strip()} if result.returncode else {})}

if __name__ == '__main__':
    (ROOT / 'repos').mkdir(exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(clone, REPOS))
    (ROOT / 'repos-manifest.json').write_text(json.dumps(results, indent=2) + '\n')
    for result in results:
        print(result['repo'] + ': ' + (result.get('error') or result['commit']))
    raise SystemExit(any('error' in result for result in results))
