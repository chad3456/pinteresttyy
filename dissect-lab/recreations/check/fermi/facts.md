# Facts: fermi

Measured by dissect.py 1.1.0 at depth `standard` on 2026-10-04. Times are m:ss.s from the start. Heuristic values are marked *(rough)*: trust the frames over them.

## Source

| | |
|---|---|
| Title | fermi |
| Link | recreations/fermi.mp4 |
| Platform | local |
| Duration | 1:16.0 |
| Frame | 1920×1080 (16:9), 24.0 fps |

## At a glance

| Measure | Value |
|---|---|
| Shots (hard cuts + 1) | 7 |
| Cuts per minute | 4.7 – 6.3 (hard cuts only – including 1 uncertain and 1 dissolves) |
| Average shot length | 10.9s (median 11.5s, shortest 3.0s, longest 18.7s) |
| Average shot length if uncertain changes are cuts | 8.4s |
| On-screen changes inside shots | 10 (7.9/min: text, graphics, overlays, dissolves) |
| Every visual change (cuts + uncertain + steps) | every 4.5s on average |
| Loudness | -16.3 LUFS integrated, true peak -1.22 dBTP, range 1.2 LU |
| Audio bed (no speech) *(rough)* | music-like bed (tonal) |
| Sound hits on cuts *(rough)* | 67% of cuts vs 62% at random moments → no clear SFX-on-cut pattern |
| Look | brightness 0.16, saturation 0.68 (0–1), cool (blue > red) |

## Pace across the video

| Section | Hard cuts | Uncertain | Steps | Cuts/min (range) | WPM | Said at the start of the section |
|---|---|---|---|---|---|---|
| 0:00–0:15 | 0 | 1 | 1 | 0–4 | 0 |  |
| 0:15–0:30 | 1 | 0 | 1 | 4–4 | 0 |  |
| 0:30–0:45 | 3 | 0 | 0 | 12–12 | 0 |  |
| 0:45–1:00 | 1 | 0 | 6 | 4–4 | 0 |  |
| 1:00–1:15 | 1 | 0 | 1 | 4–4 | 0 |  |
| 1:15–1:16 | 0 | 0 | 1 | 0–0 | 0 |  |

## Hook (first 5s)

Sheet: `hook.jpg`, 4 frames a second, tiles labelled with their time.

- Hard cuts in the hook: 0
- Uncertain changes: 0
- On-screen changes inside shots: 0
- First visual change of any kind: 0:06.8
- Audio level in the first 3s vs the rest: +0.5 dB

## Shot list

`S7` tiles show the middle of shot 7, `S7+` the moment just after a change inside it, `S7?` an uncertain change (real cut, or shake, smoke, flash, fast motion). Sheets: `shots-01.jpg`, `shots-02.jpg`, `shots-03.jpg`.

| Shot | Start–end | Length | Changes inside | Said during the shot |
|---|---|---|---|---|
| S1 | 0:00.0–0:18.0 | 18.0s | ?0:06.8, +0:11.8 |  |
| S2 | 0:18.0–0:32.3 | 14.2s | +0:25.1 |  |
| S3 | 0:32.3–0:35.3 | 3.0s |  |  |
| S4 | 0:35.3–0:38.7 | 3.4s |  |  |
| S5 | 0:38.7–0:57.4 | 18.7s | +0:45.8, +0:46.3, +0:46.8, +0:48.0, +0:51.4, +0:52.4 |  |
| S6 | 0:57.4–1:04.5 | 7.2s |  |  |
| S7 | 1:04.5–1:16.0 | 11.5s | +1:08.9, +1:15.2 (dissolve) |  |

### Uncertain changes

Possible cuts the detector could not confirm. Glance at the matching `?` tiles to decide.

0:06.8 (borderline)

## Voice

No transcript (no speech found, or faster-whisper unavailable).


## Sound

- Loudness: -16.27 LUFS integrated, true peak -1.22 dBTP, loudness range 1.2 LU.
- No speech found. Whole track: music-like bed (tonal).
- Rough tempo where nobody speaks: ~154 BPM (confidence 0.47; could be half or double).
- Sound hits *(rough)*: a sharp energy jump at 67% of 6 cuts, 50% of 10 on-screen changes, vs 62% at random moments. No clear pattern of effects on cuts.

## Look

- Brightness 0.16, saturation 0.68, cool (blue > red).
- Dominant colours across the shot tiles: `#1b1142` 16%, `#3e3369` 14%, `#120e36` 13%, `#0c0c2e` 12%, `#372059` 12%, `#080723` 12%, `#211b50` 11%, `#81709f` 10%
- Brightness by section: 0:00 0.19, 0:15 0.16, 0:30 0.15, 0:45 0.15, 1:00 0.17, 1:15 0.07

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