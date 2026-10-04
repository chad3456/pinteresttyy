# Facts: face-demographics-walking-and-pause

Measured by dissect.py 1.1.0 at depth `standard` on 2026-10-04. Times are m:ss.s from the start. Heuristic values are marked *(rough)*: trust the frames over them.

## Source

| | |
|---|---|
| Title | face-demographics-walking-and-pause |
| Link | /home/user/intel-iot-devkit/sample-videos/face-demographics-walking-and-pause.mp4 |
| Platform | local |
| Duration | 1:30.9 |
| Frame | 768×432 (16:9), 12.0 fps |

## At a glance

| Measure | Value |
|---|---|
| Shots (hard cuts + 1) | 1 |
| Cuts per minute | 0.0 – 0.0 (hard cuts only – including 0 uncertain and 0 dissolves) |
| Average shot length | 90.9s (median 90.9s, shortest 90.9s, longest 90.9s) |
| Average shot length if uncertain changes are cuts | 90.9s |
| On-screen changes inside shots | 3 (2.0/min: text, graphics, overlays, dissolves) |
| Every visual change (cuts + uncertain + steps) | every 30.3s on average |
| Audio bed (no speech) *(rough)* | near-silence (no continuous bed) |
| Sound hits on cuts *(rough)* | n/a of cuts vs 0% at random moments → no clear SFX-on-cut pattern |
| Look | brightness 0.51, saturation 0.11 (0–1), neutral |

## Pace across the video

| Section | Hard cuts | Uncertain | Steps | Cuts/min (range) | WPM | Said at the start of the section |
|---|---|---|---|---|---|---|
| 0:00–0:30 | 0 | 0 | 1 | 0–0 | 0 |  |
| 0:30–1:00 | 0 | 0 | 1 | 0–0 | 0 |  |
| 1:00–1:30 | 0 | 0 | 1 | 0–0 | 0 |  |
| 1:30–1:31 | 0 | 0 | 0 | 0–0 | 0 |  |

## Hook (first 5s)

Sheet: `hook.jpg`, 4 frames a second, tiles labelled with their time.

- Hard cuts in the hook: 0
- Uncertain changes: 0
- On-screen changes inside shots: 0
- First visual change of any kind: 0:19.2
- Audio level in the first 3s vs the rest: +0.0 dB

## Shot list

`S7` tiles show the middle of shot 7, `S7+` the moment just after a change inside it, `S7?` an uncertain change (real cut, or shake, smoke, flash, fast motion). Sheets: `shots-01.jpg`, `shots-02.jpg`, `shots-03.jpg`.

| Shot | Start–end | Length | Changes inside | Said during the shot |
|---|---|---|---|---|
| S1 | 0:00.0–1:30.9 | 90.9s | +0:19.2, +0:44.0, +1:26.1 |  |

## Voice

No transcript (no speech found, or faster-whisper unavailable).


## Sound

- Loudness: None LUFS integrated, true peak None dBTP, loudness range 0.0 LU.
- No speech found. Whole track: near-silence (no continuous bed).
- Sound hits *(rough)*: a sharp energy jump at n/a of 0 cuts, 0% of 3 on-screen changes, vs 0% at random moments. No clear pattern of effects on cuts.
- Near-silences (< -50 dBFS, ≥0.4s): 1: 0:00.0 (90.9s)

## Look

- Brightness 0.51, saturation 0.11, neutral.
- Dominant colours across the shot tiles: `#a3a3a5` 15%, `#9a9494` 14%, `#625f61` 14%, `#8c8c8d` 13%, `#6d7073` 13%, `#817a77` 12%, `#423b3e` 10%, `#cacfd9` 10%
- Brightness by section: 0:00 0.53, 0:30 0.50, 1:00 0.51, 1:30 0.52

## Audience signals

None available (local file, or the platform didn't share them).


## Transcript

None.


## Files

- Sheets: `hook.jpg`, `shots-01.jpg`, `shots-02.jpg`, `shots-03.jpg`, `cover.jpg`
- Data: `data/metrics.json` (everything above), `data/shots.csv`, `data/transcript.json` (word timings), `data/transcript.txt`, `data/transcript.srt`, `data/info.json`

## Caveats

- Cut detection works on small frames sampled at 12 fps. Fast camera moves, flashes and smoke can look like cuts (listed as uncertain); a cut between two very similar framings (a subtle jump cut) can be missed or show up as a step change.
- Step changes are local changes that stay: usually text, graphics, stickers or a punch-in. Word-by-word captions produce many of them.
- The bed, sound-hit and emphasis numbers are heuristics. When the frames or your ears disagree, trust them.