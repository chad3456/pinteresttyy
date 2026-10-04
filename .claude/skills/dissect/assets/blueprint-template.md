<!--
Blueprint template. Fill every section in order; delete these comments.
Rules: cite times (m:ss) or numbers for every claim; mark guesses "(inferred)";
quote the video only briefly (under ~15 words per quote) and paraphrase the rest;
describe voices and people as archetypes, never "sound like <real person>".
-->

# Blueprint: {{FORMAT NAME}}

*Reverse-engineered from "{{video title}}" by {{creator}} ({{platform}}, {{duration}}, {{views}} views). Dissected {{date}}.*
*Source facts: `facts.md`. Sheets: `hook.jpg`, `shots-*.jpg`{{, `most-replayed.jpg`}}.*

## 1. Format card

<!-- 6–8 lines. Someone should be able to pitch the format from this alone. -->

| | |
|---|---|
| Format | {{one-line name, e.g. "Fast myth-busting explainer with receipts"}} |
| Platform & shape | {{9:16 Short, 45 s}} |
| Promise | {{what the viewer gets, and when it's promised (m:ss)}} |
| Hook | {{type + the first 3 s in one line}} |
| Structure | {{e.g. Hook → 3 escalating proofs → twist → loop}} |
| Pace | {{avg shot X s (range), Y cuts/min, Z wpm}} |
| Signature look | {{captions, grade, framing in one line}} |
| Sound | {{voice archetype + bed + SFX in one line}} |

## 2. Why it works

<!-- 3–6 reasons, strongest first, each with evidence (time, number, comment, replay peak). -->

1. **{{reason}}**: {{evidence}}
2. …

## 3. Hook breakdown (0:00–{{end}})

<!-- Second by second (or per 0.25 s for Shorts) from hook.jpg + facts. Name the hook type(s). -->

| Time | Picture | On-screen text | Words | Sound | Job |
|---|---|---|---|---|---|
| 0:00.0 | | | | | |

- **Hook type:** {{…}}
- **Promise made at:** {{m:ss}}, by {{words / text / picture}}
- **Why it stops the scroll:** {{…}}
- **Reusable hook template:** "{{Template with {{SLOTS}}}}"
- **5 hook variants for a new topic:** <!-- same mechanics, slot-filled with {{TOPIC}} -->

## 4. Beat sheet

<!-- Every beat with times, its job, the device, and how long it lasts as % of the video. Mark re-hooks and replay peaks. -->

| # | Time | Beat | Job | Device / re-hook | Notes |
|---|---|---|---|---|---|
| 1 | 0:00–0:03 | Hook | | | |

- **Ending:** {{payoff, CTA, does it loop back to the start?}}
- **Open loops:** {{opened at → closed at}}
- **Most-replayed moments and why:** {{…}}

## 5. Shot grammar

<!-- The rules an editor would follow. Use the measured numbers, then what you saw. -->

- **Pace:** average shot {{X}} s (range {{a–b}} s, measured {{low–high}} cuts/min); {{how pace shifts across the video}}
- **Shot mix:** {{e.g. 60% talking head MCU, 25% b-roll, 15% screen recording}}
- **Framing & camera:** {{…}}
- **What triggers a cut:** {{e.g. every new sentence; punch-in on emphasised words}}
- **On-screen changes:** {{N per minute; what they are}}
- **Transitions:** {{hard cuts only / whips with whoosh at …}}
- **Picture–word sync:** {{how visuals illustrate each line; the "show what you say" rule}}

### Shot list template

| # | Duration | Shot | Framing / motion | On screen | Said (template) |
|---|---|---|---|---|---|
| 1 | | | | | {{SLOT}} |

## 6. Visual style guide

- **Aspect & resolution:** {{…}}
- **Captions:** font (closest free font), weight, case, size (% of frame height), fill, stroke, shadow, highlight colour for key words, words per caption, position, animation
- **Headlines / title cards:** {{…}}
- **Overlays:** emoji, arrows, circles, stickers, progress bars, logos, split screens
- **Colour palette:** {{hex values from facts + where each is used}}
- **Grade & lighting:** {{…}}
- **Set, wardrobe, props:** {{…}}
- **Safe areas:** {{…}}

## 7. Voice direction

- **Archetype:** {{e.g. "warm, quick, conversational narrator, late 20s, close mic"}}
- **Pace:** {{wpm}} overall, {{wpm}} while talking; {{where it speeds up / slows down}}
- **Pauses:** {{per minute; where they go (before reveals?); evidence}}
- **Emphasis:** {{which kinds of words get hit; examples by time}}
- **Pitch & endings:** {{spread in semitones, falling/rising/flat share, what that sounds like}}
- **Sentence shape:** {{words per sentence, questions, person (I / you)}}
- **Direction note for a voice actor or TTS:** "{{one paragraph}}"

## 8. Sound design

- **Music bed:** {{present? mood/genre (inferred), level under voice in dB, tempo if measured, when it changes or drops}}
- **Sound effects:** {{on cuts? text pops? reveals? measured hit rate vs baseline}}
- **Silence:** {{deliberate stops?}}
- **Loudness target:** {{integrated LUFS, true peak}}

## 9. Packaging

- **Title pattern:** {{structure + template}}
- **Thumbnail / cover:** {{what cover.jpg shows; text; face; colours}}
- **First frame:** {{…}}
- **Description, hashtags, pinned comment:** {{…}}
- **Audience signals:** {{likes/1k views, comments/1k views, views per follower vs benchmarks; what top comments reveal}}

## 10. Creator-specific vs reusable

| Belongs to this creator (don't copy) | Reusable format (copy freely) |
|---|---|
| | |

## 11. Fill-in-the-blanks script

<!-- Same beats, same timing, same sentence lengths, with {{SLOTS}}. Not the original words. -->

```
[0:00–0:03 HOOK | {{shot}} | TEXT: "{{HOOK_TEXT}}"]
VO: {{HOOK_LINE: bold claim about TOPIC, ≤ N words}}

[0:03–… SETUP | …]
VO: …
```

**Word budget:** {{total words}} at {{wpm}} wpm for {{duration}}.

## 12. Production plan

- **Pre-production:** research, script, assets to gather (b-roll list, screenshots, music)
- **Shoot:** setup, framing, lighting, camera, mic, takes
- **Edit:** order of operations
- **Time estimate:** {{…}}
- **Tools:** {{e.g. CapCut / Premiere / DaVinci Resolve; caption tool; free font}}

## 13. AI prompts

<!-- Ready to paste. Each uses {{TOPIC}} and any other slots. -->

### Script
```
{{prompt that reproduces the structure, beat timing, word budget, hook type, sentence length, pov and tone}}
```

### Voice (TTS or voice actor)
```
{{archetype, pace in wpm, pauses, emphasis, pitch movement, energy, mic distance}}
```

### Visuals (image / video generation, b-roll search)
```
{{per-shot prompt template: subject, framing, camera move, lighting, grade, aspect}}
```

### Captions
```
{{caption style spec for an auto-caption tool or editor}}
```

### Music
```
{{genre, mood, BPM, instrumentation, structure (drop at…), level under voice}}
```

## 14. Edit recipe

<!-- Step-by-step in an editor, with the numbers. -->

1. {{e.g. Cut all pauses longer than 0.3 s (target ~N pauses/min)}}
2. …

## 15. QA checklist

- [ ] First word within {{X}} s; promise made by {{m:ss}}
- [ ] A visual change at least every {{X}} s; average shot {{a–b}} s
- [ ] Captions: {{font, size, colour, position}}; inside safe area
- [ ] VO at {{wpm}} wpm; pauses only before reveals
- [ ] Music {{dB}} under voice; SFX on {{…}}
- [ ] Loudness {{LUFS}}, true peak ≤ {{dBTP}}
- [ ] Re-hooks at {{…}}; ending {{loops / CTA}}
- [ ] Nothing creator-specific copied (name, face, catchphrase, signature music)
