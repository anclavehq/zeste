# Presentation video

85 s, 1080p: HTML motion design (`composition.src.html`), macOS synthetic voice (Thomas, French),
synthesized music and effects (`music.py`), mixed with ducking (`mix.py`).

```sh
cd video
python3 -m venv .venv && .venv/bin/pip install numpy
# 1. voice: one track per scene (say), durations written to script.json
python3 timeline.py                 # timeline aligned to the actual voice duration
.venv/bin/python music.py           # music + effects
python3 build.py                    # composition.html with the timeline
(cd ../e2e && node scripts/render-video.mjs full 84.824 ../video)   # 1080p frames + sfx.json
python3 mix.py                      # voice + music + effects
ffmpeg -framerate 30 -i frames/%05d.jpg -i audio/mix.wav -c:v libx264 -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart -shortest zeste-presentation.mp4
```
