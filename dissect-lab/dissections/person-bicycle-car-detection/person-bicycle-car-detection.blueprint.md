# Blueprint: Fixed-Cam Parking Lot

*Reverse-engineered from person-bicycle-car-detection.mp4 (Intel IoT DevKit sample videos, CC BY 4.0), 53.9 s, 768×432, silent audio track. Dissected 2026-10-04 at `standard` depth without a transcript (there's no speech). Camera: high, near-overhead angle over an empty parking lot.*
*Source facts: `facts.md`. Sheets: `hook.jpg`, `shots-*.jpg`.*

## 1. Format card

| | |
|---|---|
| Format | High static view of an empty lot; a pedestrian, then a car, then a cyclist pass through one at a time |
| Platform & shape | 16:9, 54 s, silent |
| Promise | None: reference footage |
| Hook | A pedestrian already crossing at 0:01 |
| Structure | Pedestrian (0:00–0:07) → empty (0:07–0:14) → car sweeps through (0:14–0:19) → empty → cyclist (0:24–0:29) → empty to the end |
| Pace | 1 shot, 54 s; 0 measured changes, because each subject is small and the change is gradual |
| Signature look | Flat grey asphalt with white bay lines; saturation 0.02 (nearly monochrome), brightness 0.53 |
| Sound | Silent track |

## 2. Why it works

1. **One subject type at a time.** Person, car, bike: a clean taxonomy with gaps in between.
2. **Empty frames are part of the rhythm.** 7–10 s of nothing between subjects makes each arrival an event.
3. **Graphic ground plane.** White lines on grey give scale and direction; it's almost a diagram.

## 3–4. Hook and beat sheet

| Time | Beat | Job |
|---|---|---|
| 0:00–0:07 | Pedestrian crosses diagonally | Subject 1 |
| 0:07–0:14 | Empty | Pause |
| 0:14–0:19 | White car curves through | Subject 2 |
| 0:19–0:24 | Empty | Pause |
| 0:24–0:29 | Cyclist crosses top-right | Subject 3 |
| 0:29–0:54 | Empty | Tail |

## 5. Shot grammar

- **One locked-off take.** No pans, zooms or cuts were detected. Rhythm comes from people entering, acting and leaving.
- **Framing:** wide enough that every subject stays fully in frame; subjects enter from the frame edges.
- **Changes:** the only measured changes are people appearing or disappearing; there are no graphics or text.

## 6. Visual style guide

- **Palette (measured):** `#959599` light asphalt, `#8c8b8f` asphalt, `#8a8a8d`, `#848487`, `#818184` mid grey, `#78787b` shadow; white lines at about `#f0f0f0`.
- **Grade:** natural, flat light; saturation 0.02, brightness 0.53. Don't stylise it.
- **Text:** none in the source. The "detection" variant adds thin boxes and a timestamp (see prompts).

## 7–8. Voice and sound

No voice and no music. Keep it silent or use quiet room tone. A narrated version would put a calm, neutral explainer voice over it at ~140 wpm, describing what the system sees.

## 9. Packaging

Cover: a mid-action frame with the most people visible. Title template: "{{N}} {{SUBJECTS}} in a {{LOCATION}}: what a camera sees".

## 11. Fill-in-the-blanks shot plan

```
[0:00–0:07] Pedestrian crosses diagonally → {{YOUR_SUBJECTS}} version
[0:07–0:14] Empty → {{YOUR_SUBJECTS}} version
[0:14–0:19] White car curves through → {{YOUR_SUBJECTS}} version
[0:19–0:24] Empty → {{YOUR_SUBJECTS}} version
[0:24–0:29] Cyclist crosses top-right → {{YOUR_SUBJECTS}} version
[0:29–0:54] Empty → {{YOUR_SUBJECTS}} version
```

## 12. Production plan

Tripod or wall mount, lock exposure and white balance, record one continuous take with the subjects briefed on their entrances. Total crew: 1 camera operator plus the subjects.

## 10. Creator-specific vs reusable

| Belongs to the source (don't copy) | Reusable |
|---|---|
| These people, this location, Intel's dataset purpose | One locked-off take; subjects enter, act and leave; desaturated real light; no music; optional detection overlays |

## 13. AI prompts

**Visuals:** `Locked-off security-camera still, {{ANGLE}} of {{LOCATION}}, flat fluorescent light, desaturated (saturation ~0.02), slight wide-angle distortion, {{N}} ordinary people mid-action, 16:9, no text`

**Overlay (for a "machine vision" version):** `Thin rectangular bounding boxes in a single bright colour around each person, label "person 0.9x" in a small monospace font above each box, timestamp top-left`

## 14. Edit recipe

1. One continuous take; no cuts. If you must remove dead time, hide the edit as a jump cut while the frame is empty.
2. No music, no effects; keep room tone or silence.
3. Optional: add a timestamp and detection boxes in post.

## 15. QA checklist

- [ ] One shot, camera never moves
- [ ] Subjects enter and leave within frame; at least one stretch with nobody moving
- [ ] Saturation and brightness within ±0.05 of the targets above
- [ ] No music, no narration
