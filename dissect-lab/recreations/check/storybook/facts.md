# Facts: storybook

Measured by dissect.py 1.1.0 at depth `quick` on 2026-10-04. Times are m:ss.s from the start. Heuristic values are marked *(rough)*: trust the frames over them.

## Source

| | |
|---|---|
| Title | storybook |
| Link | recreations/storybook.mp4 |
| Platform | local |
| Duration | 1:00.1 |
| Frame | 1280×720 (16:9), 24.0 fps |

## At a glance

| Measure | Value |
|---|---|
| Shots (hard cuts + 1) | 6 |
| Cuts per minute | 5.0 – 7.0 (hard cuts only – including 0 uncertain and 2 dissolves) |
| Average shot length | 10.0s (median 7.8s, shortest 3.9s, longest 24.8s) |
| Average shot length if uncertain changes are cuts | 7.5s |
| On-screen changes inside shots | 4 (4.0/min: text, graphics, overlays, dissolves) |
| Every visual change (cuts + uncertain + steps) | every 6.7s on average |
| Loudness | -16.0 LUFS integrated, true peak -1.48 dBTP, range 3.5 LU |
| Audio bed (no speech) *(rough)* | music-like bed (tonal) |
| Sound hits on cuts *(rough)* | 100% of cuts vs 51% at random moments → sound effects on cuts likely |
| Look | brightness 0.59, saturation 0.30 (0–1), neutral |

## Pace across the video

| Section | Hard cuts | Uncertain | Steps | Cuts/min (range) | WPM | Said at the start of the section |
|---|---|---|---|---|---|---|
| 0:00–0:15 | 1 | 0 | 1 | 4–4 | 0 |  |
| 0:15–0:30 | 2 | 0 | 0 | 8–8 | 0 |  |
| 0:30–0:45 | 0 | 0 | 2 | 0–0 | 0 |  |
| 0:45–1:00 | 2 | 0 | 1 | 8–8 | 0 |  |

## Hook (first 3s)

Sheet: `hook.jpg`, 4 frames a second, tiles labelled with their time.

- Hard cuts in the hook: 0
- Uncertain changes: 0
- On-screen changes inside shots: 1 at 0:01.2
- First visual change of any kind: 0:01.2
- Audio level in the first 3s vs the rest: -104.6 dB

## Shot list

`S7` tiles show the middle of shot 7, `S7+` the moment just after a change inside it, `S7?` an uncertain change (real cut, or shake, smoke, flash, fast motion). Sheets: `shots-01.jpg`, `shots-02.jpg`.

| Shot | Start–end | Length | Changes inside | Said during the shot |
|---|---|---|---|---|
| S1 | 0:00.0–0:11.8 | 11.8s | +0:01.2 (dissolve) |  |
| S2 | 0:11.8–0:15.7 | 3.9s |  |  |
| S3 | 0:15.7–0:22.9 | 7.2s |  |  |
| S4 | 0:22.9–0:47.7 | 24.8s | +0:33.1 (dissolve), +0:37.9, +0:45.7 |  |
| S5 | 0:47.7–0:55.9 | 8.2s |  |  |
| S6 | 0:55.9–1:00.1 | 4.2s |  |  |

## Voice

No transcript (no speech found, or faster-whisper unavailable).


## Sound

- Loudness: -15.97 LUFS integrated, true peak -1.48 dBTP, loudness range 3.5 LU.
- No speech found. Whole track: music-like bed (tonal).
- Rough tempo where nobody speaks: ~122 BPM (confidence 0.24; could be half or double).
- Sound hits *(rough)*: a sharp energy jump at 100% of 5 cuts, 50% of 4 on-screen changes, vs 51% at random moments. Likely whooshes, hits or pops on cuts.
- Near-silences (< -50 dBFS, ≥0.4s): 1: 0:00.0 (2.0s)

## Look

- Brightness 0.59, saturation 0.30, neutral.
- Dominant colours across the shot tiles: `#acc3e4` 24%, `#79a958` 19%, `#394c31` 12%, `#a6b5bc` 12%, `#e5d8d2` 11%, `#d0d0c3` 10%, `#c8c8d3` 10%, `#7c906a` 3%
- Brightness by section: 0:00 0.65, 0:15 0.71, 0:30 0.35, 0:45 0.64

## Audience signals

None available (local file, or the platform didn't share them).


## Transcript

None.


## Files

- Sheets: `hook.jpg`, `shots-01.jpg`, `shots-02.jpg`, `cover.jpg`
- Data: `data/metrics.json` (everything above), `data/shots.csv`, `data/transcript.json` (word timings), `data/transcript.txt`, `data/transcript.srt`, `data/info.json`

## Caveats

- Cut detection works on small frames sampled at 8 fps. Fast camera moves, flashes and smoke can look like cuts (listed as uncertain); a cut between two very similar framings (a subtle jump cut) can be missed or show up as a step change.
- Step changes are local changes that stay: usually text, graphics, stickers or a punch-in. Word-by-word captions produce many of them.
- The bed, sound-hit and emphasis numbers are heuristics. When the frames or your ears disagree, trust them.