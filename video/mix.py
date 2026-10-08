"""Mix: voice aligned to the timeline, music ducked under the voice, sound effects."""
import json, os, subprocess
V = os.path.dirname(os.path.abspath(__file__))
tl = json.load(open(f'{V}/timeline.json'))
sfx = json.load(open(f'{V}/sfx.json'))
total = tl['total']

inputs, filters = [], []
def inp(path):
    inputs.extend(['-i', path])
    return len(inputs) // 2 - 1

# Voice
voice_labels = []
for s in tl['scenes']:
    i = inp(f"{V}/voice/{s['id']}.wav")
    ms = int(s['voiceStart'] * 1000)
    filters.append(f"[{i}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay={ms}|{ms}[v{i}]")
    voice_labels.append(f'[v{i}]')
filters.append(f"{''.join(voice_labels)}amix=inputs={len(voice_labels)}:normalize=0,apad=whole_dur={total},loudnorm=I=-16:TP=-2:LRA=9,asplit=2[voice][vsc]")

# Music, compressed by the voice (ducking)
m = inp(f'{V}/audio/music.wav')
filters.append(f"[{m}:a]volume=0.8[mus]")
filters.append("[mus][vsc]sidechaincompress=threshold=0.02:ratio=8:attack=25:release=450:makeup=1[ducked]")

# Effects
fx_labels = []
for e in sfx:
    if e['t'] < 0 or e['t'] > total:
        continue
    i = inp(f"{V}/audio/{e['name']}.wav")
    ms = int(e['t'] * 1000)
    filters.append(f"[{i}:a]volume={e['gain'] * 0.55:.3f},adelay={ms}|{ms}[f{i}]")
    fx_labels.append(f'[f{i}]')
filters.append(f"{''.join(fx_labels)}amix=inputs={len(fx_labels)}:normalize=0[fx]")

filters.append(f"[voice][ducked][fx]amix=inputs=3:normalize=0,atrim=0:{total},alimiter=limit=0.95:level=disabled[out]")
cmd = ['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filters), '-map', '[out]', '-ar', '48000', '-ac', '2', f'{V}/audio/mix.wav']
subprocess.run(cmd, check=True)
print(f'mix.wav: {len(voice_labels)} voice tracks, {len(fx_labels)} effects')
