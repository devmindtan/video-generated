"""Conservative per-Short API reservations, persistent across configs and retries.

Not a Google billing cap. No automatic refunds, resets or exchange-rate guesses.
"""
from contextlib import contextmanager
from datetime import datetime, date
from decimal import Decimal, ROUND_CEILING
import fcntl
import json
from pathlib import Path
import re
import uuid
from zoneinfo import ZoneInfo

HARD_SHORT_CAP_VND = 20000


def today():
    return datetime.now(ZoneInfo('Asia/Ho_Chi_Minh')).date()


def read(path):
    return json.loads(path.read_text())


def atomic(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    temporary.replace(path)


def project_path(root,slug):
    if not re.fullmatch(r'[a-z0-9-]+',slug):
        raise ValueError('Invalid budget project')
    path=(root/'budgets/shorts'/f'{slug}.json').resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('Budget must stay inside the repository')
    return path


def positive(value,name):
    try:
        number=Decimal(str(value))
    except Exception:
        raise ValueError(f'{name} is missing or invalid') from None
    if not number.is_finite() or number<=0:
        raise ValueError(f'{name} must be positive and finite')
    return number


def fresh(value,days,label):
    try:
        age=(today()-date.fromisoformat(value)).days
    except (TypeError,ValueError):
        raise ValueError(f'{label} has no verified date') from None
    if age<0 or age>days:
        raise ValueError(f'{label} is stale; verify it before spending')


def quote(root,config):
    prices=read(root/'scripts/gemini-video-pricing.json')
    fresh(prices.get('verifiedAt'),7,'Model pricing')
    fx=prices.get('exchangeRate',{})
    fresh(fx.get('verifiedAt'),7,'USD/VND rate')
    if not prices.get('sourceUrl','').startswith('https://ai.google.dev/') or not fx.get('source'):
        raise ValueError('Pricing and exchange-rate sources are required')
    usd=positive(prices.get('usdPerSecond',{}).get(config['model'],{}).get(config['resolution']),'Model price')
    rate=positive(fx.get('vndPerUsd'),'USD/VND rate')
    seconds=positive(config['durationSeconds'],'Duration')
    samples=positive(config['sampleCount'],'Sample count')
    multiplier=positive(prices.get('taxAndFeeMultiplier'),'Tax/fee multiplier')
    if multiplier<Decimal('1.20'):
        raise ValueError('Tax/fee safety multiplier must be at least 1.20')
    amount=int((usd*rate*seconds*samples*multiplier).to_integral_value(rounding=ROUND_CEILING))
    return {'reserveVnd':amount,'model':config['model'],'resolution':config['resolution'],'seconds':int(seconds),'usdPerSecond':str(usd),'vndPerUsd':str(rate),'taxAndFeeMultiplier':str(multiplier),'priceVerifiedAt':prices['verifiedAt'],'fxVerifiedAt':fx['verifiedAt']}


def initial(root,slug):
    # Don't silently start from zero if older Gemini API submissions lack a ledger.
    jobs_path=root/'.cache/veo-gemini'/slug/'jobs.json'
    if jobs_path.exists():
        jobs=read(jobs_path)
        if any(not key.startswith('_') for key in jobs):
            raise ValueError('Existing API jobs have no budget ledger; reconcile them before spending')
    return {'schemaVersion':1,'project':slug,'capVnd':HARD_SHORT_CAP_VND,'reservations':[]}


def validate(ledger,slug):
    if ledger.get('schemaVersion')!=1 or ledger.get('project')!=slug or ledger.get('capVnd')!=HARD_SHORT_CAP_VND:
        raise ValueError('Invalid budget ledger; refusing to reset or increase it')
    ids=set()
    for item in ledger['reservations']:
        if item['id'] in ids or type(item['reserveVnd']) is not int or item['reserveVnd']<=0:
            raise ValueError('Invalid budget reservation')
        ids.add(item['id'])
    return ledger


@contextmanager
def locked(root,slug):
    path=project_path(root,slug)
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.with_suffix('.lock').open('a') as handle:
        fcntl.flock(handle,fcntl.LOCK_EX)
        ledger=read(path) if path.exists() else initial(root,slug)
        yield path,validate(ledger,slug)


def summary(root,slug):
    path=project_path(root,slug)
    ledger=validate(read(path),slug) if path.exists() else initial(root,slug)
    used=sum(x['reserveVnd'] for x in ledger['reservations'])
    return {'project':slug,'capVnd':HARD_SHORT_CAP_VND,'reservedVnd':used,'remainingVnd':max(0,HARD_SHORT_CAP_VND-used),'reservations':len(ledger['reservations']),'scope':'API reservations since this policy; not historical invoices or subscription credits'}


def reserve(root,slug,scene,digest,estimate):
    story_path=root/'scripts/projects'/slug/'story.json'
    if not story_path.exists():
        raise ValueError('Missing story duration; cannot verify this is a Short')
    story=read(story_path)
    duration=sum(positive(s['duration'],'Scene duration') for s in story)
    if duration>60:
        raise ValueError('Only Shorts up to 60 seconds have an approved budget; no budget approved for long videos')
    amount=estimate['reserveVnd']
    if type(amount) is not int or amount<=0:
        raise ValueError('Missing cost reservation')
    with locked(root,slug) as (path,ledger):
        used=sum(x['reserveVnd'] for x in ledger['reservations'])
        if any(x['digest']==digest for x in ledger['reservations']):
            raise ValueError('This request already has a reservation; audit it instead of resubmitting')
        if used+amount>HARD_SHORT_CAP_VND:
            raise ValueError(f'Short budget exceeded: {used} + {amount} > 20000 VND. No API request sent.')
        item={**estimate,'id':uuid.uuid4().hex,'scene':scene,'digest':digest,'status':'reserved','createdAt':datetime.now(ZoneInfo('Asia/Ho_Chi_Minh')).isoformat()}
        ledger['reservations'].append(item)
        atomic(path,ledger)
        return item


def dispatch(root,slug,reservation_id,digest):
    with locked(root,slug) as (path,ledger):
        item=next((x for x in ledger['reservations'] if x['id']==reservation_id),None)
        if not item or item['digest']!=digest or item['status']!='reserved':
            raise ValueError('Missing or already-used budget authorization')
        item['status']='dispatched'
        atomic(path,ledger)
