"""Video/audio shared handle math; chapter and narration starts never move."""


def shot_plan(chapters, clips, edit):
    if edit.get('continuityV3'):
        import json
        from pathlib import Path
        cuts=json.loads((Path(__file__).resolve().parents[3]/'src/projects/tiny-dino-homecoming/cuts-v3.json').read_text())
        return [{'shot':shot['key'],'chapter':i,'angle':'wide' if j==0 else 'continuation','start':chapter['start']+shot['from'],'duration':shot['duration'],'playbackRate':shot['rate'],'sourceStart':shot['sourceStart'],'fadeIn':shot['fadeIn'],'fadeOut':.8 if i==len(cuts)-1 and j==len(chapter['shots'])-1 else .4} for i,chapter in enumerate(cuts) for j,shot in enumerate(chapter['shots'])]
    shots=[]
    half_overlap=edit['shotDissolveSeconds']/2
    for index,chapter in enumerate(chapters):
        half=chapter['duration']/2
        handle=0 if index==len(chapters)-1 else edit['sceneDissolveSeconds']
        for angle in ['wide','close']:
            key=chapter[angle+'Shot']
            length=half+half_overlap+(handle if angle=='close' else 0)
            start=chapter['start']+(half-half_overlap if angle=='close' else 0)
            shots.append({'shot':key,'chapter':index,'angle':angle,'start':start,'duration':length,
                          'playbackRate':clips[key]['sourceDurationSeconds']/length,
                          'fadeIn':edit['shotDissolveSeconds'] if angle=='close' else edit['sceneDissolveSeconds'],
                          'fadeOut':.8 if index==len(chapters)-1 and angle=='close' else edit['shotDissolveSeconds'] if angle=='wide' else edit['sceneDissolveSeconds']})
    return shots
