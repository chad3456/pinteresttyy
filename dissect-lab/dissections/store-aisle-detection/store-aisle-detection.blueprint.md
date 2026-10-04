# Blueprint: Fixed-Cam Store Aisle

*Reverse-engineered from store-aisle-detection.mp4 (Intel IoT DevKit sample videos, CC BY 4.0), 65.4 s, 720×404, silent audio track. Dissected 2026-10-04 at `standard` depth without a transcript (there's no speech). Camera: high overhead-angle down a long aisle.*
*Source facts: `facts.md`. Sheets: `hook.jpg`, `shots-*.jpg`.*

## 1. Format card

| | |
|---|---|
| Format | Overhead locked-off view down a store aisle; shoppers enter from the bottom of frame and browse |
| Platform & shape | 16:9, 65 s, silent |
| Promise | None: reference footage |
| Hook | A shopper's hat enters bottom-right at 0:06.1 (the only measured change) |
| Structure | Empty aisle → 1 shopper (0:06) → 2 (0:12) → 3 (0:16) → 4–5 crowding the middle (0:26–0:37) → thinning out |
| Pace | 1 shot, 65 s; activity builds rather than cuts |
| Signature look | Rows of white crockery, warm-grey floor; brightness 0.52, saturation 0.14, slightly warm |
| Sound | Silent track (near-silence throughout) |

## 2. Why it works

1. **The frame fills up.** The count of people rises from 0 to 5 by ~0:28: escalation without a single cut.
2. **Strong one-point perspective.** The aisle's vanishing point is upper-centre, so entrances at the bottom feel close and the far end feels deep.
3. **Repetitive texture as a backdrop.** Hundreds of near-identical white items (`#dad8d4`, `#bbb8b3`) make every moving person stand out.

## 3–4. Hook and beat sheet

| Time | Beat | Job |
|---|---|---|
| 0:00–0:06 | Empty aisle | Baseline |
| 0:06–0:16 | Shoppers 1–3 arrive bottom-right (+ at 0:06.1) | Build |
| 0:16–0:37 | 4–5 people browse, reach and cross | Peak density |
| 0:37–1:05 | People drift away down the aisle | Release |

## 5. Shot grammar

- **One locked-off take.** No pans, zooms or cuts were detected. Rhythm comes from people entering, acting and leaving.
- **Framing:** wide enough that every subject stays fully in frame; subjects enter from the frame edges.
- **Changes:** the only measured changes are people appearing or disappearing; there are no graphics or text.

## 6. Visual style guide

- **Palette (measured):** `#dad8d4` crockery white, `#bbb8b3` light grey, `#a8a39a` warm grey, `#878077` taupe, `#6e6f6c` shelf grey, `#565248` floor shadow, `#2d2723` deep brown.
- **Grade:** natural, flat light; saturation 0.14, brightness 0.52. Don't stylise it.
- **Text:** none in the source. The "detection" variant adds thin boxes and a timestamp (see prompts).

## 7–8. Voice and sound

No voice and no music. Keep it silent or use quiet room tone. A narrated version would put a calm, neutral explainer voice over it at ~140 wpm, describing what the system sees.

## 9. Packaging

Cover: a mid-action frame with the most people visible. Title template: "{{N}} {{SUBJECTS}} in a {{LOCATION}}: what a camera sees".

## 11. Fill-in-the-blanks shot plan

```
[0:00–0:06] Empty aisle → {{YOUR_SUBJECTS}} version
[0:06–0:16] Shoppers 1–3 arrive bottom-right (+ at 0:06.1) → {{YOUR_SUBJECTS}} version
[0:16–0:37] 4–5 people browse, reach and cross → {{YOUR_SUBJECTS}} version
[0:37–1:05] People drift away down the aisle → {{YOUR_SUBJECTS}} version
```

## 12. Production plan

Tripod or wall mount, lock exposure and white balance, record one continuous take with the subjects briefed on their entrances. Total crew: 1 camera operator plus the subjects.

## 10. Creator-specific vs reusable

| Belongs to the source (don't copy) | Reusable |
|---|---|
| These people, this location, Intel's dataset purpose | One locked-off take; subjects enter, act and leave; desaturated real light; no music; optional detection overlays |

## 13. AI prompts

**Visuals:** `Locked-off security-camera still, {{ANGLE}} of {{LOCATION}}, flat fluorescent light, desaturated (saturation ~0.14), slight wide-angle distortion, {{N}} ordinary people mid-action, 16:9, no text`

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
