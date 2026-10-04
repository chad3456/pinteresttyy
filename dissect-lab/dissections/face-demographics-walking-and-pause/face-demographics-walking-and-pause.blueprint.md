# Blueprint: Fixed-Cam Corridor Walk-Up

*Reverse-engineered from face-demographics-walking-and-pause.mp4 (Intel IoT DevKit sample videos, CC BY 4.0), 90.9 s, 768×432, silent audio track. Dissected 2026-10-04 at `standard` depth without a transcript (there's no speech). Camera: eye-level camera facing down a corridor.*
*Source facts: `facts.md`. Sheets: `hook.jpg`, `shots-*.jpg`.*

## 1. Format card

| | |
|---|---|
| Format | Eye-level camera at the end of a corridor; people walk up to the lens, pause facing it, then leave |
| Platform & shape | 16:9, 91 s, silent |
| Promise | None: reference footage |
| Hook | Empty corridor; a man walks up from the far end (0:03–0:07) and stops in a medium close-up |
| Structure | Walk-up 1 (one man) → hold → hidden jump cut to the empty corridor (0:19.2) → walk-up 2 (a pair, 0:27–0:33) → hold → cut (0:44.0) → … → end change (1:26.1) |
| Pace | 1 shot, 91 s, but 3 measured in-shot changes at 0:19.2, 0:44.0 and 1:26.1. The first is a hidden jump cut: the man vanishes between frames |
| Signature look | White walls, glass doors, ceiling light; brightness 0.51, saturation 0.11, neutral |
| Sound | Silent track |

## 2. Why it works

1. **Walk-up framing.** Subjects travel from wide to medium close-up, so faces grow in frame without a camera move.
2. **Hidden jump cuts.** At 0:19.2 the corridor is suddenly empty: separate takes are joined with the camera locked off, so the video reads as one continuous shot.
3. **A neutral, near-colourless set** (saturation 0.11) keeps attention on faces and clothes.

## 3–4. Hook and beat sheet

| Time | Beat | Job |
|---|---|---|
| 0:00–0:07 | Empty, then man 1 walks up | Approach |
| 0:07–0:19 | Man 1 holds facing camera | Hold |
| 0:19.2 | Jump cut to the empty corridor | Reset |
| 0:27–0:44 | A pair walks up and holds | Approach and hold |
| 0:44–1:26 | Further walk-ups (cut at 0:44.0) | Repeat |
| 1:26.1–1:31 | Final change | End |

## 5. Shot grammar

- **One locked-off take.** No pans, zooms or cuts were detected. Rhythm comes from people entering, acting and leaving.
- **Framing:** wide enough that every subject stays fully in frame; subjects enter from the frame edges.
- **Changes:** the only measured changes are people appearing or disappearing; there are no graphics or text.

## 6. Visual style guide

- **Palette (measured):** `#cacfd9` cool white, `#a3a3a5` wall, `#9a9494` warm grey, `#8c8c8d` mid grey, `#6d7073` door frame, `#625f61` shadow, `#423b3e` dark clothes.
- **Grade:** natural, flat light; saturation 0.11, brightness 0.51. Don't stylise it.
- **Text:** none in the source. The "detection" variant adds thin boxes and a timestamp (see prompts).

## 7–8. Voice and sound

No voice and no music. Keep it silent or use quiet room tone. A narrated version would put a calm, neutral explainer voice over it at ~140 wpm, describing what the system sees.

## 9. Packaging

Cover: a mid-action frame with the most people visible. Title template: "{{N}} {{SUBJECTS}} in a {{LOCATION}}: what a camera sees".

## 11. Fill-in-the-blanks shot plan

```
[0:00–0:07] Empty, then man 1 walks up → {{YOUR_SUBJECTS}} version
[0:07–0:19] Man 1 holds facing camera → {{YOUR_SUBJECTS}} version
[0:19.2] Jump cut to the empty corridor → {{YOUR_SUBJECTS}} version
[0:27–0:44] A pair walks up and holds → {{YOUR_SUBJECTS}} version
[0:44–1:26] Further walk-ups (cut at 0:44.0) → {{YOUR_SUBJECTS}} version
[1:26.1–1:31] Final change → {{YOUR_SUBJECTS}} version
```

## 12. Production plan

Tripod or wall mount, lock exposure and white balance, record one continuous take with the subjects briefed on their entrances. Total crew: 1 camera operator plus the subjects.

## 10. Creator-specific vs reusable

| Belongs to the source (don't copy) | Reusable |
|---|---|
| These people, this location, Intel's dataset purpose | One locked-off take; subjects enter, act and leave; desaturated real light; no music; optional detection overlays |

## 13. AI prompts

**Visuals:** `Locked-off security-camera still, {{ANGLE}} of {{LOCATION}}, flat fluorescent light, desaturated (saturation ~0.11), slight wide-angle distortion, {{N}} ordinary people mid-action, 16:9, no text`

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
