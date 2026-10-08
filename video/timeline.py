"""Single timeline: scenes sized to the actual voice duration."""
import json, os
V = os.path.dirname(os.path.abspath(__file__))
scenes = json.load(open(f'{V}/script.json'))
LEAD, TAIL = 0.4, 0.6
extra = {'hook': 0.4, 'catalogue': 0.3, 'idee': 0.6, 'cli': 1.4, 'styles': 1.2, 'custom': 1.3, 'conformite': 0.4, 'migration': 1.0, 'fin': 2.5}
minimum = {'parcours': 7.4}
t = 0.0
out = []
for s in scenes:
    length = max(LEAD + s['duration'] + TAIL + extra.get(s['id'], 0), minimum.get(s['id'], 0))
    out.append({'id': s['id'], 'start': round(t, 3), 'length': round(length, 3),
                'voiceStart': round(t + LEAD, 3), 'voiceDuration': s['duration'], 'caption': s['caption']})
    t += length
json.dump({'fps': 30, 'width': 1920, 'height': 1080, 'total': round(t, 3), 'scenes': out}, open(f'{V}/timeline.json', 'w'), ensure_ascii=False, indent=1)
for s in out: print(f"{s['id']:<11} {s['start']:6.2f} → {s['start']+s['length']:6.2f}")
print('total', round(t, 2), 's')
