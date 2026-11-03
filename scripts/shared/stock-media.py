#!/usr/bin/env python3
"""Search and fetch free stock images/footage from key-free public archives.

Sources: Wikimedia Commons, NASA Image and Video Library, Archive.org
(Prelinger / open-source movies / home movies, plus public images).
Adapted from the source adapters of OpenMontage (reference clone in
repos/calesthio--OpenMontage); only free, key-less sources are kept.

Downloads go to ignored library/stock/<source>/<id>/ with source.json
(licence, creator, page URL, sha256). With --project the file is also
copied to public/<slug>/stock/ and credited in
docs/projects/<slug>/stock-credits.json. Non-commercial / no-derivative
licences are refused unless --allow-restricted; unknown licences warn.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import sys
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
LIBRARY = ROOT/'library/stock'
USER_AGENT = 'video-playground-stock/1.0 (local personal tool)'
SOURCES = ('wikimedia', 'nasa', 'archive')
ARCHIVE_VIDEO_COLLECTIONS = ('prelinger', 'home_movies')
ARCHIVE_OPEN_LICENSE = 'licenseurl:(*publicdomain* OR *creativecommons*)'
ARCHIVE_VIDEO_FORMATS = ('h.264', 'MPEG4', 'h.264 HD', '512Kb MPEG4', 'Matroska', 'WebM')
ARCHIVE_IMAGE_FORMATS = ('JPEG', 'PNG', 'TIFF', 'JPEG 2000')
NASA_RENDITIONS = ('orig', 'large', 'medium', 'small')
NASA_LICENSE = 'NASA media: public domain unless credited to a third party; no NASA endorsement implied'


def get_json(url, params=None):
    if params:
        url += ('&' if '?' in url else '?')+urllib.parse.urlencode(params, doseq=True)
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def strip_html(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', value or ''))).strip()


def license_status(text):
    """Classify a licence string: public-domain, attribution, share-alike, restricted or unknown."""
    lower = (text or '').lower()
    if not lower:
        return 'unknown'
    if re.search(r'\bnc\b|non-?commercial|\bnd\b|no-?deriv', lower) or '-nc' in lower or '-nd' in lower:
        return 'restricted'
    if 'publicdomain' in lower or 'public domain' in lower or re.search(r'\b(pd|cc0)\b', lower) or 'cc-zero' in lower:
        return 'public-domain'
    if 'nasa media' in lower:
        return 'public-domain'
    if re.search(r'\bsa\b|share-?alike|by-sa', lower):
        return 'share-alike'
    if re.search(r'\bby\b|attribution', lower):
        return 'attribution'
    return 'unknown'


def item(source, source_id, kind, title, **fields):
    record = {'id': f'{source}:{source_id}', 'source': source, 'kind': kind, 'title': title,
              'creator': '', 'license': '', 'licenseUrl': '', 'width': 0, 'height': 0,
              'durationSeconds': 0, 'pageUrl': '', 'downloadUrl': '', 'thumbUrl': '', 'bytes': 0}
    record.update({key: value for key, value in fields.items() if value})
    record['licenseStatus'] = license_status(record['licenseUrl'] or record['license'])
    if record['licenseStatus'] == 'unknown' and record['license']:
        record['licenseStatus'] = license_status(record['license'])
    return record


# Wikimedia Commons --------------------------------------------------------

def wikimedia_record(page):
    info = (page.get('imageinfo') or [{}])[0]
    meta = {key: (value or {}).get('value', '') for key, value in (info.get('extmetadata') or {}).items()}
    mime = info.get('mime', '')
    kind = 'video' if mime.startswith('video/') else 'image' if mime.startswith('image/') else 'other'
    duration = float(info.get('duration') or 0)
    return item('wikimedia', str(page['pageid']), kind, page.get('title', '').removeprefix('File:'),
                creator=strip_html(meta.get('Artist')), license=meta.get('LicenseShortName') or meta.get('UsageTerms'),
                licenseUrl=meta.get('LicenseUrl'), width=info.get('width'), height=info.get('height'),
                durationSeconds=round(duration, 2), pageUrl=info.get('descriptionurl'), downloadUrl=info.get('url'),
                thumbUrl=info.get('thumburl'), bytes=info.get('size'))


def wikimedia_query(params):
    data = get_json('https://commons.wikimedia.org/w/api.php', {
        'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiurlwidth': 640,
        'iiprop': 'url|size|mime|extmetadata', **params})
    return [wikimedia_record(page) for page in (data.get('query') or {}).get('pages', {}).values() if 'imageinfo' in page]


def wikimedia_search(query, kind, limit):
    filetype = {'image': ' filetype:bitmap', 'video': ' filetype:video'}.get(kind, '')
    return wikimedia_query({'generator': 'search', 'gsrsearch': query+filetype, 'gsrnamespace': 6, 'gsrlimit': limit})


def wikimedia_resolve(source_id):
    found = wikimedia_query({'pageids': source_id})
    if not found:
        raise LookupError(f'wikimedia:{source_id} not found')
    return found[0]


# NASA Image and Video Library -------------------------------------------

def nasa_record(entry):
    data = (entry.get('data') or [{}])[0]
    thumb = next((link.get('href', '') for link in entry.get('links') or [] if link.get('rel') == 'preview'), '')
    nasa_id = data.get('nasa_id', '')
    creator = data.get('photographer') or data.get('secondary_creator') or data.get('center', '')
    return item('nasa', nasa_id, data.get('media_type', 'image'), data.get('title', nasa_id), creator=creator,
                license=NASA_LICENSE, pageUrl=f'https://images.nasa.gov/details/{urllib.parse.quote(nasa_id)}', thumbUrl=thumb)


def nasa_search(query, kind, limit):
    types = ['image', 'video'] if kind == 'any' else [kind]
    data = get_json('https://images-api.nasa.gov/search', {'q': query, 'media_type': ','.join(types), 'page_size': limit})
    return [nasa_record(entry) for entry in (data.get('collection') or {}).get('items', [])][:limit]


def pick_nasa_file(urls, kind):
    extensions = ('.mp4', '.mov') if kind == 'video' else ('.jpg', '.jpeg', '.png', '.tif')
    for rendition in NASA_RENDITIONS:
        for url in urls:
            lower = url.lower()
            if f'~{rendition}.' in lower and lower.endswith(extensions):
                return url.replace(' ', '%20')
    return ''


def nasa_resolve(source_id):
    data = get_json('https://images-api.nasa.gov/search', {'nasa_id': source_id})
    entries = (data.get('collection') or {}).get('items', [])
    if not entries:
        raise LookupError(f'nasa:{source_id} not found')
    record = nasa_record(entries[0])
    manifest = get_json(f'https://images-api.nasa.gov/asset/{urllib.parse.quote(source_id)}')
    urls = [entry.get('href', '') for entry in (manifest.get('collection') or {}).get('items', [])]
    record['downloadUrl'] = pick_nasa_file(urls, record['kind'])
    return record


# Archive.org ------------------------------------------------------------

def archive_license(license_url, collections):
    if license_url:
        return license_url
    joined = ' '.join(collections).lower()
    if 'prelinger' in joined or 'home_movies' in joined:
        return 'Public Domain (archive.org collection)'
    return ''


def archive_search(query, kind, limit):
    clauses = []
    if kind in ('video', 'any'):
        clauses.append('(mediatype:movies AND (collection:('+' OR '.join(ARCHIVE_VIDEO_COLLECTIONS)+f') OR {ARCHIVE_OPEN_LICENSE}))')
    if kind in ('image', 'any'):
        clauses.append(f'(mediatype:image AND {ARCHIVE_OPEN_LICENSE})')
    fields = ['identifier', 'title', 'creator', 'licenseurl', 'collection', 'mediatype']
    data = get_json('https://archive.org/advancedsearch.php', {
        'q': f'({query}) AND ('+' OR '.join(clauses)+')', 'fl[]': fields, 'rows': limit, 'output': 'json'})
    records = []
    for doc in (data.get('response') or {}).get('docs', []):
        collections = doc.get('collection') or []
        collections = [collections] if isinstance(collections, str) else collections
        creator = doc.get('creator') or ''
        records.append(item('archive', doc['identifier'], 'video' if doc.get('mediatype') == 'movies' else 'image',
                            doc.get('title') or doc['identifier'], creator=', '.join(creator) if isinstance(creator, list) else creator,
                            license=archive_license(doc.get('licenseurl'), collections), licenseUrl=doc.get('licenseurl'),
                            pageUrl=f'https://archive.org/details/{doc["identifier"]}',
                            thumbUrl=f'https://archive.org/services/img/{doc["identifier"]}'))
    return records


def pick_archive_file(files, kind, max_bytes):
    formats = ARCHIVE_VIDEO_FORMATS if kind == 'video' else ARCHIVE_IMAGE_FORMATS
    for wanted in formats:
        fitting = [entry for entry in files if entry.get('format') == wanted and 0 < int(entry.get('size') or 0) <= max_bytes]
        if fitting:
            return max(fitting, key=lambda entry: int(entry['size']))
    return None


def archive_resolve(source_id, max_bytes):
    data = get_json(f'https://archive.org/metadata/{urllib.parse.quote(source_id)}')
    meta = data.get('metadata') or {}
    if not meta:
        raise LookupError(f'archive:{source_id} not found')
    collections = meta.get('collection') or []
    collections = [collections] if isinstance(collections, str) else collections
    kind = 'video' if meta.get('mediatype') == 'movies' else 'image'
    picked = pick_archive_file(data.get('files') or [], kind, max_bytes)
    creator = meta.get('creator') or ''
    record = item('archive', source_id, kind, meta.get('title') or source_id,
                  creator=', '.join(creator) if isinstance(creator, list) else creator,
                  license=archive_license(meta.get('licenseurl'), collections), licenseUrl=meta.get('licenseurl'),
                  pageUrl=f'https://archive.org/details/{source_id}')
    if picked:
        record['downloadUrl'] = f'https://archive.org/download/{urllib.parse.quote(source_id)}/{urllib.parse.quote(picked["name"])}'
        record['bytes'] = int(picked['size'])
        record['durationSeconds'] = round(float(picked.get('length') or 0), 2) if re.fullmatch(r'[\d.]+', str(picked.get('length') or '')) else 0
    return record


# Commands ---------------------------------------------------------------

SEARCH = {'wikimedia': wikimedia_search, 'nasa': nasa_search, 'archive': archive_search}


def resolve(stock_id, max_bytes):
    source, _, source_id = stock_id.partition(':')
    if source not in SOURCES or not source_id:
        raise ValueError(f'expected <source>:<id> with source in {", ".join(SOURCES)}, got {stock_id!r}')
    if source == 'wikimedia':
        return wikimedia_resolve(source_id)
    if source == 'nasa':
        return nasa_resolve(source_id)
    return archive_resolve(source_id, max_bytes)


def safe_name(value):
    return re.sub(r'[^A-Za-z0-9._-]+', '-', value).strip('-')[:120] or 'item'


def credit_line(record):
    parts = [record['title']]
    if record['creator']:
        parts.append(record['creator'])
    parts.append(record['license'] or 'licence unknown')
    parts.append(record['pageUrl'])
    return ' — '.join(part for part in parts if part)


def command_search(args):
    sources = args.source.split(',') if args.source else list(SOURCES)
    results = []
    for source in sources:
        try:
            results += SEARCH[source](args.query, args.kind, args.limit)
        except Exception as error:  # one flaky archive must not hide the others
            print(f'! {source}: {error}', file=sys.stderr)
    results = [record for record in results if args.kind == 'any' or record['kind'] == args.kind]
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return 0
    for record in results:
        size = f'{record["width"]}x{record["height"]}' if record['width'] else record['kind']
        duration = f' {record["durationSeconds"]}s' if record['durationSeconds'] else ''
        print(f'{record["id"]}\n  {record["title"][:100]}\n  {size}{duration} · {record["licenseStatus"]} · {record["license"] or "?"}\n  {record["pageUrl"]}')
    sys.stdout.flush()
    print(f'{len(results)} result(s)', file=sys.stderr)
    return 0


def download(url, target):
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    digest = hashlib.sha256()
    partial = target.with_name(target.name+'.part')
    with urllib.request.urlopen(request, timeout=60) as response, partial.open('wb') as handle:
        while chunk := response.read(1 << 20):
            digest.update(chunk)
            handle.write(chunk)
    partial.replace(target)
    return digest.hexdigest()


def command_fetch(args):
    max_bytes = int(args.max_mb*1024*1024)
    record = resolve(args.id, max_bytes)
    if record['licenseStatus'] == 'restricted' and not args.allow_restricted:
        print(f'refused: {record["id"]} is {record["license"]} (non-commercial or no-derivatives); pass --allow-restricted only after checking the use', file=sys.stderr)
        return 2
    if not record['downloadUrl']:
        print(f'no downloadable file under {args.max_mb} MB for {record["id"]} ({record["pageUrl"]})', file=sys.stderr)
        return 2
    if record['bytes'] > max_bytes:
        print(f'refused: {record["bytes"]/1e6:.0f} MB exceeds --max-mb {args.max_mb}', file=sys.stderr)
        return 2
    folder = LIBRARY/record['source']/safe_name(args.id.partition(':')[2])
    folder.mkdir(parents=True, exist_ok=True)
    filename = safe_name(urllib.parse.unquote(record['downloadUrl'].rsplit('/', 1)[-1].split('?')[0]))
    target = folder/filename
    meta_path = folder/'source.json'
    if target.exists() and meta_path.exists():
        record = json.loads(meta_path.read_text())
        print(f'cached {target.relative_to(ROOT)}')
    else:
        record['sha256'] = download(record['downloadUrl'], target)
        record['file'] = str(target.relative_to(ROOT))
        record['fetchedAt'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
        meta_path.write_text(json.dumps(record, ensure_ascii=False, indent=2)+'\n')
        print(f'saved {target.relative_to(ROOT)}')
    if record['licenseStatus'] == 'unknown':
        print(f'warning: licence unknown, check {record["pageUrl"]} before use', file=sys.stderr)
    if args.project:
        add_to_project(args.project, record, target)
    print('credit: '+credit_line(record))
    return 0


def add_to_project(slug, record, source_file):
    docs = ROOT/'docs/projects'/slug
    if not docs.is_dir():
        raise SystemExit(f'unknown project {slug!r} (no docs/projects/{slug}/)')
    stock_dir = ROOT/'public'/slug/'stock'
    stock_dir.mkdir(parents=True, exist_ok=True)
    copy = stock_dir/source_file.name
    if not copy.exists():
        shutil.copy2(source_file, copy)
    credits_path = docs/'stock-credits.json'
    credits = json.loads(credits_path.read_text()) if credits_path.exists() else {'schemaVersion': 1, 'items': []}
    if not any(entry['id'] == record['id'] for entry in credits['items']):
        credits['items'].append({key: record.get(key, '') for key in (
            'id', 'title', 'creator', 'license', 'licenseUrl', 'licenseStatus', 'pageUrl', 'sha256')}
            | {'file': str(copy.relative_to(ROOT)), 'credit': credit_line(record)})
        credits_path.write_text(json.dumps(credits, ensure_ascii=False, indent=2)+'\n')
    print(f'project {slug}: staticFile("{slug}/stock/{copy.name}"), credit in {credits_path.relative_to(ROOT)}')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    commands = parser.add_subparsers(dest='command', required=True)
    search = commands.add_parser('search', help='search the free archives')
    search.add_argument('query')
    search.add_argument('--kind', choices=('image', 'video', 'any'), default='image')
    search.add_argument('--source', help='comma list of '+','.join(SOURCES)+' (default all)')
    search.add_argument('--limit', type=int, default=8, help='results per source')
    search.add_argument('--json', action='store_true')
    fetch = commands.add_parser('fetch', help='download one result by <source>:<id>')
    fetch.add_argument('id')
    fetch.add_argument('--project', help='also copy into public/<slug>/stock/ and credit it')
    fetch.add_argument('--max-mb', type=float, default=150)
    fetch.add_argument('--allow-restricted', action='store_true')
    args = parser.parse_args(argv)
    return command_search(args) if args.command == 'search' else command_fetch(args)


if __name__ == '__main__':
    raise SystemExit(main())
