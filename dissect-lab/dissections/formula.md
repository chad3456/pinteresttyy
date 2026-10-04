# Formula: five test videos

Five openly licensed sample videos, dissected on 2026-10-04 without transcripts:

| Video | Length | Shots | Avg shot | Measured changes | Saturation | Brightness | Audio |
|---|---|---|---|---|---|---|---|
| Big Buck Bunny (opening) | 60.1 s | 6 | 10.0 s | 5 cuts, 3 dissolves, 8 in-shot changes | 0.35 | 0.52 | Music bed, -26 LUFS |
| Classroom | 32.8 s | 1 | 32.8 s | 1 | 0.24 | 0.51 | None |
| Store aisle | 65.4 s | 1 | 65.4 s | 1 | 0.14 | 0.52 | Silent |
| Corridor walk-up | 90.9 s | 1 | 90.9 s | 3 (hidden jump cuts) | 0.11 | 0.51 | Silent |
| Parking lot | 53.9 s | 1 | 53.9 s | 0 | 0.02 | 0.53 | Silent |

None of these have platform stats (they're local files), so the "best performer" comparison can't be made. Instead, this compares the two formats in the set.

## What stays constant (the real format of the four Intel clips)

- **One locked-off take.** No cuts, pans or zooms; rhythm comes from subjects entering and leaving.
- **Brightness ≈ 0.51–0.53** in all four, from flat, even, real-world light.
- **Low saturation (0.02–0.24)**, falling as the setting gets more utilitarian.
- **No music or voice.**
- **Gaps are part of the rhythm.** Every clip has empty or still stretches between actions (parking lot: 7–10 s empty between subjects).

## What varies

- **Camera angle** sets the job: overhead for counting (aisle, lot), eye-level for faces (corridor), high corner for behaviour (classroom).
- **Density curve:** the aisle builds from 0 to 5 people; the lot shows one subject at a time; the corridor repeats walk-ups.
- **Hidden edits:** only the corridor clip joins takes, as jump cuts while the frame is empty (0:19.2, 0:44.0).

## The outlier: Big Buck Bunny

The only produced piece. It shares brightness (0.52) with the rest but uses six shots, dissolves, a music bed, a title and staged reveals. Its formula: world first, then a sidekick gag, then the title over the hero's home, then a reveal in the dark and a payoff in the light.

## Merged template (fixed-cam)

```
Camera: {{ANGLE}} on a tripod, exposure and white balance locked. One take of {{40–90}} s.
0:00     Empty or near-empty frame, 3–7 s
then     Subject 1 enters from a frame edge, does one readable action, leaves or settles
then     2–10 s of stillness
then     Subject 2 (different type or a pair), repeat; optionally build the count up to 4–5
end      Settle to stillness for 5+ s
Look:    saturation 0.02–0.24, brightness ~0.52, no grade, no text (or detection boxes)
Sound:   none
```
