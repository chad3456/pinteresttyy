# Facts: classroom

Measured by dissect.py 1.1.0 at depth `standard` on 2026-10-04. Times are m:ss.s from the start. Heuristic values are marked *(rough)*: trust the frames over them.

## Source

| | |
|---|---|
| Title | classroom |
| Link | /home/user/intel-iot-devkit/sample-videos/classroom.mp4 |
| Platform | local |
| Duration | 0:32.8 |
| Frame | 1920×1080 (16:9), 30.0 fps |

## At a glance

| Measure | Value |
|---|---|
| Shots (hard cuts + 1) | 1 |
| Cuts per minute | 0.0 – 0.0 (hard cuts only – including 0 uncertain and 0 dissolves) |
| Average shot length | 32.8s (median 32.8s, shortest 32.8s, longest 32.8s) |
| Average shot length if uncertain changes are cuts | 32.8s |
| On-screen changes inside shots | 1 (1.8/min: text, graphics, overlays, dissolves) |
| Every visual change (cuts + uncertain + steps) | every 32.8s on average |
| Look | brightness 0.51, saturation 0.24 (0–1), cool (blue > red) |

## Pace across the video

| Section | Hard cuts | Uncertain | Steps | Cuts/min (range) | WPM | Said at the start of the section |
|---|---|---|---|---|---|---|
| 0:00–0:15 | 0 | 0 | 1 | 0–0 | 0 |  |
| 0:15–0:30 | 0 | 0 | 0 | 0–0 | 0 |  |
| 0:30–0:33 | 0 | 0 | 0 | 0–0 | 0 |  |

## Hook (first 5s)

Sheet: `hook.jpg`, 4 frames a second, tiles labelled with their time.

- Hard cuts in the hook: 0
- Uncertain changes: 0
- On-screen changes inside shots: 1 at 0:04.8
- First visual change of any kind: 0:04.8

## Shot list

`S7` tiles show the middle of shot 7, `S7+` the moment just after a change inside it, `S7?` an uncertain change (real cut, or shake, smoke, flash, fast motion). Sheets: `shots-01.jpg`.

| Shot | Start–end | Length | Changes inside | Said during the shot |
|---|---|---|---|---|
| S1 | 0:00.0–0:32.8 | 32.8s | +0:04.8 |  |

## Voice

No transcript (no speech found, or faster-whisper unavailable).


## Sound

No audio track.


## Look

- Brightness 0.51, saturation 0.24, cool (blue > red).
- Dominant colours across the shot tiles: `#717271` 15%, `#a4a9ab` 14%, `#faf9f9` 13%, `#091d37` 13%, `#1f354c` 12%, `#c1c7c8` 11%, `#858f94` 11%, `#525d65` 10%
- Brightness by section: 0:00 0.49, 0:15 0.52, 0:30 0.50

## Audience signals

None available (local file, or the platform didn't share them).


## Transcript

None.


## Files

- Sheets: `hook.jpg`, `shots-01.jpg`, `cover.jpg`
- Data: `data/metrics.json` (everything above), `data/shots.csv`, `data/transcript.json` (word timings), `data/transcript.txt`, `data/transcript.srt`, `data/info.json`

## Caveats

- Cut detection works on small frames sampled at 12 fps. Fast camera moves, flashes and smoke can look like cuts (listed as uncertain); a cut between two very similar framings (a subtle jump cut) can be missed or show up as a step change.
- Step changes are local changes that stay: usually text, graphics, stickers or a punch-in. Word-by-word captions produce many of them.
- The bed, sound-hit and emphasis numbers are heuristics. When the frames or your ears disagree, trust them.