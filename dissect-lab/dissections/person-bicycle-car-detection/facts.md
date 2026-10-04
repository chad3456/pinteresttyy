# Facts: person-bicycle-car-detection

Measured by dissect.py 1.1.0 at depth `standard` on 2026-10-04. Times are m:ss.s from the start. Heuristic values are marked *(rough)*: trust the frames over them.

## Source

| | |
|---|---|
| Title | person-bicycle-car-detection |
| Link | /home/user/intel-iot-devkit/sample-videos/person-bicycle-car-detection.mp4 |
| Platform | local |
| Duration | 0:53.9 |
| Frame | 768×432 (16:9), 12.0 fps |

## At a glance

| Measure | Value |
|---|---|
| Shots (hard cuts + 1) | 1 |
| Cuts per minute | 0.0 – 0.0 (hard cuts only – including 0 uncertain and 0 dissolves) |
| Average shot length | 53.9s (median 53.9s, shortest 53.9s, longest 53.9s) |
| Average shot length if uncertain changes are cuts | 53.9s |
| On-screen changes inside shots | 0 (0.0/min: text, graphics, overlays, dissolves) |
| Every visual change (cuts + uncertain + steps) | every 53.9s on average |
| Audio bed (no speech) *(rough)* | near-silence (no continuous bed) |
| Sound hits on cuts *(rough)* | n/a of cuts vs 0% at random moments → no clear SFX-on-cut pattern |
| Look | brightness 0.53, saturation 0.02 (0–1), neutral |

## Pace across the video

| Section | Hard cuts | Uncertain | Steps | Cuts/min (range) | WPM | Said at the start of the section |
|---|---|---|---|---|---|---|
| 0:00–0:15 | 0 | 0 | 0 | 0–0 | 0 |  |
| 0:15–0:30 | 0 | 0 | 0 | 0–0 | 0 |  |
| 0:30–0:45 | 0 | 0 | 0 | 0–0 | 0 |  |
| 0:45–0:54 | 0 | 0 | 0 | 0–0 | 0 |  |

## Hook (first 5s)

Sheet: `hook.jpg`, 4 frames a second, tiles labelled with their time.

- Hard cuts in the hook: 0
- Uncertain changes: 0
- On-screen changes inside shots: 0
- First visual change of any kind: none
- Audio level in the first 3s vs the rest: +0.0 dB

## Shot list

`S7` tiles show the middle of shot 7, `S7+` the moment just after a change inside it, `S7?` an uncertain change (real cut, or shake, smoke, flash, fast motion). Sheets: `shots-01.jpg`, `shots-02.jpg`.

| Shot | Start–end | Length | Changes inside | Said during the shot |
|---|---|---|---|---|
| S1 | 0:00.0–0:53.9 | 53.9s |  |  |

## Voice

No transcript (no speech found, or faster-whisper unavailable).


## Sound

- Loudness: None LUFS integrated, true peak None dBTP, loudness range 0.0 LU.
- No speech found. Whole track: near-silence (no continuous bed).
- Sound hits *(rough)*: a sharp energy jump at n/a of 0 cuts, n/a of 0 on-screen changes, vs 0% at random moments. No clear pattern of effects on cuts.
- Near-silences (< -50 dBFS, ≥0.4s): 1: 0:00.0 (53.9s)

## Look

- Brightness 0.53, saturation 0.02, neutral.
- Dominant colours across the shot tiles: `#8c8b8f` 20%, `#89888b` 17%, `#8a8a8d` 14%, `#818184` 14%, `#848487` 12%, `#87868a` 12%, `#959599` 7%, `#78787b` 5%
- Brightness by section: 0:00 0.54, 0:15 0.52, 0:30 0.53, 0:45 0.53

## Audience signals

None available (local file, or the platform didn't share them).


## Transcript

None.


## Files

- Sheets: `hook.jpg`, `shots-01.jpg`, `shots-02.jpg`, `cover.jpg`
- Data: `data/metrics.json` (everything above), `data/shots.csv`, `data/transcript.json` (word timings), `data/transcript.txt`, `data/transcript.srt`, `data/info.json`

## Caveats

- Cut detection works on small frames sampled at 12 fps. Fast camera moves, flashes and smoke can look like cuts (listed as uncertain); a cut between two very similar framings (a subtle jump cut) can be missed or show up as a step change.
- Step changes are local changes that stay: usually text, graphics, stickers or a punch-in. Word-by-word captions produce many of them.
- The bed, sound-hit and emphasis numbers are heuristics. When the frames or your ears disagree, trust them.