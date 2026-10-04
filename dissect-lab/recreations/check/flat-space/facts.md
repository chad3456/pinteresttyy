# Facts: flat-space

Measured by dissect.py 1.1.0 at depth `quick` on 2026-10-04. Times are m:ss.s from the start. Heuristic values are marked *(rough)*: trust the frames over them.

## Source

| | |
|---|---|
| Title | flat-space |
| Link | recreations/flat-space.mp4 |
| Platform | local |
| Duration | 0:44.8 |
| Frame | 1280×720 (16:9), 24.0 fps |

## At a glance

| Measure | Value |
|---|---|
| Shots (hard cuts + 1) | 7 |
| Cuts per minute | 8.0 – 8.0 (hard cuts only – including 0 uncertain and 0 dissolves) |
| Average shot length | 6.4s (median 5.6s, shortest 4.9s, longest 10.5s) |
| Average shot length if uncertain changes are cuts | 6.4s |
| On-screen changes inside shots | 2 (2.7/min: text, graphics, overlays, dissolves) |
| Every visual change (cuts + uncertain + steps) | every 5.6s on average |
| Loudness | -16.0 LUFS integrated, true peak -2.52 dBTP, range 0.7 LU |
| Audio bed (no speech) *(rough)* | music-like bed (tonal) |
| Sound hits on cuts *(rough)* | 100% of cuts vs 62% at random moments → sound effects on cuts likely |
| Look | brightness 0.17, saturation 0.73 (0–1), cool (blue > red) |

## Pace across the video

| Section | Hard cuts | Uncertain | Steps | Cuts/min (range) | WPM | Said at the start of the section |
|---|---|---|---|---|---|---|
| 0:00–0:15 | 2 | 0 | 0 | 8–8 | 0 |  |
| 0:15–0:30 | 2 | 0 | 2 | 8–8 | 0 |  |
| 0:30–0:45 | 2 | 0 | 0 | 8–8 | 0 |  |

## Hook (first 3s)

Sheet: `hook.jpg`, 4 frames a second, tiles labelled with their time.

- Hard cuts in the hook: 0
- Uncertain changes: 0
- On-screen changes inside shots: 0
- First visual change of any kind: 0:06.6
- Audio level in the first 3s vs the rest: +0.3 dB

## Shot list

`S7` tiles show the middle of shot 7, `S7+` the moment just after a change inside it, `S7?` an uncertain change (real cut, or shake, smoke, flash, fast motion). Sheets: `shots-01.jpg`, `shots-02.jpg`.

| Shot | Start–end | Length | Changes inside | Said during the shot |
|---|---|---|---|---|
| S1 | 0:00.0–0:06.6 | 6.6s |  |  |
| S2 | 0:06.6–0:11.4 | 4.9s |  |  |
| S3 | 0:11.4–0:18.4 | 7.0s | +0:15.1 |  |
| S4 | 0:18.4–0:23.3 | 4.9s |  |  |
| S5 | 0:23.3–0:33.8 | 10.5s | +0:29.4 |  |
| S6 | 0:33.8–0:39.4 | 5.6s |  |  |
| S7 | 0:39.4–0:44.8 | 5.4s |  |  |

## Voice

No transcript (no speech found, or faster-whisper unavailable).


## Sound

- Loudness: -15.98 LUFS integrated, true peak -2.52 dBTP, loudness range 0.7 LU.
- No speech found. Whole track: music-like bed (tonal).
- Rough tempo where nobody speaks: ~154 BPM (confidence 0.46; could be half or double).
- Sound hits *(rough)*: a sharp energy jump at 100% of 6 cuts, 0% of 2 on-screen changes, vs 62% at random moments. Likely whooshes, hits or pops on cuts.

## Look

- Brightness 0.17, saturation 0.73, cool (blue > red).
- Dominant colours across the shot tiles: `#431b5b` 17%, `#1b1b4d` 16%, `#111138` 13%, `#171544` 12%, `#446e9d` 12%, `#26103d` 11%, `#1c2d54` 9%, `#381449` 9%
- Brightness by section: 0:00 0.15, 0:15 0.18, 0:30 0.18

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