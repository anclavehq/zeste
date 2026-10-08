import json, os
V = os.path.dirname(os.path.abspath(__file__))
tl = json.load(open(f'{V}/timeline.json'))
src = open(f'{V}/composition.src.html').read()
open(f'{V}/composition.html', 'w').write(src.replace('/*TIMELINE*/null', json.dumps(tl, ensure_ascii=False)))
print('composition.html', tl['total'], 's')
