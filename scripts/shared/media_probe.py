"""Read duration and frame size of a local video with Remotion's bundled ffmpeg."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
FFMPEG = ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'


def probe(path):
    result=subprocess.run([str(FFMPEG),'-hide_banner','-i',str(path)],capture_output=True,text=True)
    duration=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',result.stderr)
    dimensions=re.search(r'Video:.*? (\d{3,5})x(\d{3,5})',result.stderr)
    if not duration or not dimensions:
        raise ValueError(f'{path} has no readable video track')
    hours,minutes,seconds=map(float,duration.groups())
    width,height=map(int,dimensions.groups())
    return {'durationSeconds':hours*3600+minutes*60+seconds,'width':width,'height':height}
