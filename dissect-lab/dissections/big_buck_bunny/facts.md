# Facts: big_buck_bunny

Measured by dissect.py 1.1.0 at depth `standard` on 2026-10-04. Times are m:ss.s from the start. Heuristic values are marked *(rough)*: trust the frames over them.

## Source

| | |
|---|---|
| Title | big_buck_bunny |
| Link | /home/user/mediaelement/mediaelement-files/big_buck_bunny.mp4 |
| Platform | local |
| Duration | 1:00.1 |
| Frame | 640×360 (16:9), 23.96 fps |

## At a glance

| Measure | Value |
|---|---|
| Shots (hard cuts + 1) | 6 |
| Cuts per minute | 5.0 – 8.0 (hard cuts only – including 0 uncertain and 3 dissolves) |
| Average shot length | 10.0s (median 7.8s, shortest 3.8s, longest 24.7s) |
| Average shot length if uncertain changes are cuts | 6.7s |
| On-screen changes inside shots | 11 (11.0/min: text, graphics, overlays, dissolves) |
| Every visual change (cuts + uncertain + steps) | every 3.8s on average |
| Loudness | -26.1 LUFS integrated, true peak -4.1 dBTP, range 18.0 LU |
| Audio bed (no speech) *(rough)* | music-like bed (tonal) |
| Sound hits on cuts *(rough)* | 40% of cuts vs 13% at random moments → sound effects on cuts likely |
| Look | brightness 0.52, saturation 0.35 (0–1), warm (red > blue) |

## Pace across the video

| Section | Hard cuts | Uncertain | Steps | Cuts/min (range) | WPM | Said at the start of the section |
|---|---|---|---|---|---|---|
| 0:00–0:15 | 1 | 0 | 2 | 4–4 | 0 |  |
| 0:15–0:30 | 2 | 0 | 4 | 8–8 | 0 |  |
| 0:30–0:45 | 0 | 0 | 2 | 0–0 | 0 |  |
| 0:45–1:00 | 2 | 0 | 3 | 8–8 | 0 |  |

## Hook (first 5s)

Sheet: `hook.jpg`, 4 frames a second, tiles labelled with their time.

- Hard cuts in the hook: 0
- Uncertain changes: 0
- On-screen changes inside shots: 1 at 0:01.8
- First visual change of any kind: 0:01.8
- Audio level in the first 3s vs the rest: -11.0 dB

## Shot list

`S7` tiles show the middle of shot 7, `S7+` the moment just after a change inside it, `S7?` an uncertain change (real cut, or shake, smoke, flash, fast motion). Sheets: `shots-01.jpg`, `shots-02.jpg`.

| Shot | Start–end | Length | Changes inside | Said during the shot |
|---|---|---|---|---|
| S1 | 0:00.0–0:11.9 | 11.9s | +0:01.8 (dissolve), +0:05.2 (dissolve) |  |
| S2 | 0:11.9–0:15.7 | 3.8s |  |  |
| S3 | 0:15.7–0:23.0 | 7.3s | +0:16.4, +0:18.0, +0:19.9, +0:20.8 |  |
| S4 | 0:23.0–0:47.7 | 24.7s | +0:32.7 (dissolve), +0:44.2, +0:46.5 |  |
| S5 | 0:47.7–0:56.0 | 8.3s | +0:51.8, +0:53.0 |  |
| S6 | 0:56.0–1:00.1 | 4.1s |  |  |

## Voice

No transcript (no speech found, or faster-whisper unavailable).


## Sound

- Loudness: -26.13 LUFS integrated, true peak -4.1 dBTP, loudness range 18.0 LU.
- No speech found. Whole track: music-like bed (tonal).
- Sound hits *(rough)*: a sharp energy jump at 40% of 5 cuts, 9% of 11 on-screen changes, vs 13% at random moments. Likely whooshes, hits or pops on cuts.
- Near-silences (< -50 dBFS, ≥0.4s): 5: 0:00.0 (1.45s), 0:22.3 (0.75s), 0:43.4 (1.5s), 0:53.0 (1.55s), 0:54.7 (0.55s)

## Look

- Brightness 0.52, saturation 0.35, warm (red > blue).
- Dominant colours across the shot tiles: `#7c8057` 17%, `#bdcbaf` 15%, `#455247` 14%, `#f9e2cd` 14%, `#597156` 13%, `#1a2423` 11%, `#8aa380` 10%, `#afb09b` 7%
- Brightness by section: 0:00 0.64, 0:15 0.57, 0:30 0.34, 0:45 0.52

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