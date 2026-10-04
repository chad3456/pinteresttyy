# Blueprint: Fixed-Cam Classroom Scene

*Reverse-engineered from classroom.mp4 (Intel IoT DevKit sample videos, CC BY 4.0), 32.8 s, 1920×1080, no audio track. Dissected 2026-10-04 at `standard` depth without a transcript (there's no speech). Camera: high-angle wide from a front corner.*
*Source facts: `facts.md`. Sheets: `hook.jpg`, `shots-*.jpg`.*

## 1. Format card

| | |
|---|---|
| Format | Locked-off high-angle wide of a classroom; one person stands, walks and sits while others stay seated |
| Platform & shape | 16:9, 33 s, silent |
| Promise | Nothing is promised; it's a reference clip of ordinary behaviour |
| Hook | None: the scene is already running at 0:00 |
| Structure | Seated → one person stands (0:04.8) → walks to the front and back → sits (~0:18) → a second person shifts (~0:22–0:25) → settled |
| Pace | 1 shot, 33 s; 1 measured on-screen change (0:04.8) |
| Signature look | Cool blue chairs and carpet, white walls, blown-out window right; brightness 0.51, saturation 0.24, cool |
| Sound | No audio track |

## 2. Why it works

1. **Action reads at a glance.** Wide, high and locked off: every person's position is visible in every frame.
2. **One clear movement at a time.** The standing person (0:04.8–0:18) is the only big change; the rest stay still.
3. **The colour makes the space.** Blue chairs (`#1f354c`, `#091d37`) against pale grey walls (`#a4a9ab`) separate people from furniture.

## 3–4. Hook and beat sheet

| Time | Beat | Job |
|---|---|---|
| 0:00–0:04.8 | Everyone seated | Baseline |
| 0:04.8–0:18 | One person stands and walks (+ at 0:04.8) | Main action |
| 0:18–0:25 | Sits; a second person stirs at the back | Secondary action |
| 0:25–0:32.8 | Settled | Rest |

## 5. Shot grammar

- **One locked-off take.** No pans, zooms or cuts were detected. Rhythm comes from people entering, acting and leaving.
- **Framing:** wide enough that every subject stays fully in frame; subjects enter from the frame edges.
- **Changes:** the only measured changes are people appearing or disappearing; there are no graphics or text.

## 6. Visual style guide

- **Palette (measured):** `#faf9f9` window white, `#c1c7c8` wall, `#a4a9ab` wall shade, `#717271` grey, `#525d65` slate, `#1f354c` chair blue, `#091d37` carpet navy.
- **Grade:** natural, flat light; saturation 0.24, brightness 0.51. Don't stylise it.
- **Text:** none in the source. The "detection" variant adds thin boxes and a timestamp (see prompts).

## 7–8. Voice and sound

No voice and no music. Keep it silent or use quiet room tone. A narrated version would put a calm, neutral explainer voice over it at ~140 wpm, describing what the system sees.

## 9. Packaging

Cover: a mid-action frame with the most people visible. Title template: "{{N}} {{SUBJECTS}} in a {{LOCATION}}: what a camera sees".

## 11. Fill-in-the-blanks shot plan

```
[0:00–0:04.8] Everyone seated → {{YOUR_SUBJECTS}} version
[0:04.8–0:18] One person stands and walks (+ at 0:04.8) → {{YOUR_SUBJECTS}} version
[0:18–0:25] Sits; a second person stirs at the back → {{YOUR_SUBJECTS}} version
[0:25–0:32.8] Settled → {{YOUR_SUBJECTS}} version
```

## 12. Production plan

Tripod or wall mount, lock exposure and white balance, record one continuous take with the subjects briefed on their entrances. Total crew: 1 camera operator plus the subjects.

## 10. Creator-specific vs reusable

| Belongs to the source (don't copy) | Reusable |
|---|---|
| These people, this location, Intel's dataset purpose | One locked-off take; subjects enter, act and leave; desaturated real light; no music; optional detection overlays |

## 13. AI prompts

**Visuals:** `Locked-off security-camera still, {{ANGLE}} of {{LOCATION}}, flat fluorescent light, desaturated (saturation ~0.24), slight wide-angle distortion, {{N}} ordinary people mid-action, 16:9, no text`

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
