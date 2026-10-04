# Blueprint: Flat-Vector Science Explainer

*Style study for the "flat-vector animated science explainer" look that channels like Kurzgesagt popularised. **This was not measured.** YouTube is blocked in the sandbox this was built in, so no video was downloaded or dissected. Everything below is from general knowledge of the genre and is marked (inferred). To measure a real video, run `dissect.py` on its link on a normal network, or drop the file into the Analyzer tab of the Dissect Lab.*

*Characters and assets for this format must be original. Never reuse a channel's mascots, logo, music or narrator.*

## 1. Format card

| | |
|---|---|
| Format | Calm, authoritative narrated explainer over flat vector animation that never stops moving (inferred) |
| Platform & shape | 16:9 long-form, typically 8–15 min (inferred) |
| Promise | A big question asked in the first 10–20 s ("What would happen if…?") (inferred) |
| Hook | A striking cosmic or microscopic scene plus the question, spoken over gentle motion (inferred) |
| Structure | Question → scale-setting → mechanism step by step → twist or bigger implication → reflective close (inferred) |
| Pace | A new composition every ~3–6 s, mostly via camera moves and morphs rather than hard cuts (inferred) |
| Signature look | Flat shapes without outlines, deep navy and violet backgrounds, saturated accent colours, soft glows, round cute creatures (inferred) |
| Sound | Measured narrator (~150–170 wpm), ambient synth/orchestral score, a soft sound effect on nearly every motion (inferred) |

## 2. Why it works (inferred)

1. **Constant gentle motion.** Something always drifts, pulses or rotates, so the eye never rests even during long explanations.
2. **Every sentence gets a picture.** Abstract ideas (scale, time, probability) become concrete objects that animate as the sentence lands.
3. **Contrast does the hierarchy.** A dark background plus one or two saturated focal colours means you always know where to look.
4. **Cute characters carry the stakes.** Simple round creatures make big or grim topics approachable.

## 6. Visual style guide (inferred)

- **Shapes:** geometric primitives (circles, rounded rectangles, triangles), no outlines, 2–3 flat shades per object (base, shadow, highlight), long soft glows on light sources.
- **Palette (target for the recreation):** background `#0e1033` → `#241a5c` vertical gradient; accents `#ff5e8a` pink, `#ffb03b` amber, `#3ee0c9` teal, `#7b5cff` violet, `#f4f1ff` near-white highlight.
- **Depth:** 3–4 parallax layers; distant stars, mid shapes, foreground objects; slow camera push-ins (2–5% scale over a shot).
- **Characters:** round body, two dot eyes, no mouth or a tiny one, short limbs; squash and stretch on motion. Design your own.
- **Text:** rare. Short labels and numbers only, in a rounded geometric sans (closest free fonts: Nunito Black, Baloo 2), white with no stroke.
- **Transitions:** camera flies or zooms between scenes, objects morph, quick crossfades; few plain hard cuts.

## 7. Voice direction (inferred)

Warm, calm, slightly playful narrator archetype; clear diction; 150–170 wpm; short pauses before the key number or twist; mostly falling sentence endings (assertive), rising only on the opening question.

## 8. Sound design (inferred)

Ambient synth pads with soft melodic plucks, music bed 18–24 dB under the voice, a soft whoosh, pop or chime on almost every object entrance.

## 11. Fill-in-the-blanks script

```
[0:00–0:06 COSMIC WIDE | slow push-in] VO: Imagine {{STRANGE_SCENARIO}}.
[0:06–0:12 FOCUS | object morphs in] VO: It sounds {{ADJECTIVE}}, but {{SURPRISING_FACT}}.
[0:12–0:18 SCALE | zoom out reveals size] VO: To understand why, we need to look at {{MECHANISM}}.
[0:18–0:24 CHARACTERS | creatures react] VO: {{CONSEQUENCE_1}}.
[0:24–0:30 TWIST | colour shift] VO: But here's the strange part: {{TWIST}}.
[0:30–0:36 CLOSE | slow pull-back to stars] VO: {{REFLECTIVE_LINE}}.
```

## 13. AI prompts

**Visuals:** `Flat vector illustration, no outlines, deep navy to violet gradient background, glowing {{SUBJECT}} in saturated pink, amber and teal, soft radial glow, simple geometric shapes, small round original creatures with dot eyes, parallax depth, 16:9`

**Voice:** `Warm, calm, curious male or female narrator, mid-30s, 160 wpm, short pause before each key number, falling endings, close mic, no music ducking artifacts`

**Music:** `Ambient synth pad in a major key, soft glassy plucks, 70–90 BPM, slow swells at section changes, mixed 20 dB under the voice`

## 15. QA checklist

- [ ] Nothing is ever fully still; a new composition every 3–6 s
- [ ] Every sentence has a matching visual action
- [ ] Dark background, ≤2 focal accent colours per scene
- [ ] Original characters and music only
- [ ] VO 150–170 wpm; bed ~20 dB under
