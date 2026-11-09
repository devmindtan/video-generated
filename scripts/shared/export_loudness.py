"""Loudness of a project's exported videos against the YouTube target (-14 LUFS, true peak ≤ -1 dBTP).

Used by project QA scripts. For each Composition registered in the series catalog it measures the file that would be
uploaded: projects/<slug>/<ID>-upload.mp4 (written by the manager's "Chuẩn hóa âm lượng cho YouTube" button in the video dialog, or
`npm run media -- loudness <export> --fix`) or else <ID>.mp4.
Nothing exported yet is not a failure: loudness is checked once there is a file to upload. Read-only.
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location('media_analyze', ROOT / 'scripts/shared/media-analyze.py')
media = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(media)


def compositions(slug):
    for series in (ROOT / 'series').rglob('series.json'):
        if '.manager-history' in series.parts:
            continue
        data = json.loads(series.read_text())
        for project in data.get('projects', []):
            if project.get('id') == slug:
                return [r['id'] for r in project.get('registrations', []) if r.get('kind') == 'Composition']
    return []


def export_loudness(slug, ids=None):
    """Returns (ok, detail, rows) for a QA check."""
    folder = ROOT / 'projects' / slug
    rows, problems = [], []
    for cid in ids or compositions(slug):
        upload, export = folder / f'{cid}-upload.mp4', folder / f'{cid}.mp4'
        target = upload if upload.exists() else export if export.exists() else None
        if not target:
            continue
        if upload.exists() and export.exists() and export.stat().st_mtime > upload.stat().st_mtime:
            problems.append(f'{cid}: bản xuất mới hơn bản -upload; mở video trong trang quản lý và bấm Chuẩn hóa âm lượng cho YouTube')
            continue
        stats = media.loudnorm_stats(target)
        ok = media.loudness_verdict(stats['input_i'], stats['input_tp'])
        rows.append({'composition': cid, 'file': str(target.relative_to(ROOT)), 'lufs': round(stats['input_i'], 1),
                     'truePeak': round(stats['input_tp'], 1), 'ok': ok})
        if not ok:
            problems.append(f"{cid}: {stats['input_i']:.1f} LUFS, đỉnh {stats['input_tp']:.1f} dBTP; mở video trong trang quản lý và bấm Chuẩn hóa âm lượng cho YouTube")
    if not rows and not problems:
        return True, 'chưa có bản xuất; đo khi đã xuất', rows
    detail = '; '.join(problems) if problems else '; '.join(f"{r['composition']} {r['lufs']} LUFS, đỉnh {r['truePeak']}" for r in rows)
    return not problems, detail, rows
