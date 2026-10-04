# Blueprint: Storybook Cold Open

*Reverse-engineered from the first 60 s of "Big Buck Bunny" (Blender Foundation / Peach open movie project, CC BY 3.0), a 640×360 local sample file. Dissected 2026-10-04 at `standard` depth, without a transcript (speech recognition was unavailable in the test sandbox, and this opening has no dialogue).*
*Source facts: `facts.md`. Sheets: `hook.jpg`, `shots-01.jpg`, `shots-02.jpg`.*

## 1. Format card

| | |
|---|---|
| Format | Wordless storybook opening: world first, then a sidekick gag, then a title, then the hero's reveal |
| Platform & shape | 16:9 film opening, 60 s |
| Promise | "A gentle, funny world is about to introduce its hero", made by the music and pastel nature at 0:02, then the title at 0:25 |
| Hook | Fade up from black into a pink-cloud sky over trees (0:00.25–0:02.5) |
| Structure | Establish → second establishing shot → sidekick gag + credit → title over the home → hero emerges → hero in the open → low-angle hero shot |
| Pace | 6 shots in 60 s, average shot 10.0 s (median ~8 s, 3.8–24.7 s); 5 hard cuts/min; an on-screen change every ~3.8 s |
| Signature look | Soft CG, pastel pink sky, sage greens, warm sunlight; brightness 0.52, low saturation 0.35 |
| Sound | Orchestral-style music-led bed (no speech), quiet master (-26 LUFS), sound hits on 40% of cuts |

## 2. Why it works

1. **It takes its time on purpose.** The first shot holds 11.9 s and the title shot 24.7 s. That slow pace tells the viewer this is a calm story, and it makes the later gag land.
2. **The comic sidekick arrives before the hero.** The bird gag (0:15.7–0:23.0) packs 4 pop-in moves into 7.3 s, the densest stretch in the clip. It sets the tone before the title.
3. **Credits and title sit inside the world.** "Presents" appears over the bird at 0:21, and the title fades over the hero's burrow at 0:25. No black title cards break the story.
4. **The reveal is staged in the dark.** After the dissolve at 0:32.7, the burrow close-up stays dark (section brightness drops from 0.57 to 0.34). The hero emerges at 0:44 and is then shown in full light at 0:47.7.
5. **It ends on a low-angle hero shot** (0:56): a clear "this is our protagonist" button.

## 3. Hook breakdown (0:00–0:05)

| Time | Picture | On-screen text | Sound | Job |
|---|---|---|---|---|
| 0:00.0 | One-frame poster of the title (a file artifact; ignore) | Title | — | — |
| 0:00.25–0:01.0 | Black, slowly fading up | — | Near-silence (1.45 s) | Anticipation |
| 0:01.0–0:02.5 | Pink clouds and trees emerge (fade, dissolve at 0:01.75) | — | Music enters, 11 dB quieter than the rest | Set the mood |
| 0:02.5–0:05 | Bright pastel sky, slow drift right | — | Soft music | Invite the viewer in |

- **Hook type:** demonstration (beauty shot) plus a fade from black. It promises a mood, not a plot.
- **Reusable hook template:** "Fade up over {{2 s}} into the most beautiful wide shot of {{WORLD}}. Hold it for 10+ s with only music."

## 4. Beat sheet

| # | Time | Beat | Job | Device |
|---|---|---|---|---|
| 1 | 0:00–0:11.9 | Fade-up wide (S1) | Mood and world | Fade from black, slow drift |
| 2 | 0:11.9–0:15.7 | Closer nature detail (S2) | Texture: stream, flowers | Hard cut, 3.8 s |
| 3 | 0:15.7–0:23.0 | Sidekick gag (S3) | Comedy, tone | 4 quick pose changes (+ at 16.4, 18.0, 19.9, 20.8), "Presents" credit at 0:21 |
| 4 | 0:23.0–0:32.7 | Title over the hero's home (S4a) | Name the story | Title fades in at ~0:25 |
| 5 | 0:32.7–0:47.7 | Burrow close-up, hero emerges (S4b) | Build-up and reveal | Slow dissolve, darker frame, reveal at 0:44.2 |
| 6 | 0:47.7–0:56.0 | Hero in full light, stretching (S5) | Payoff | Bright and warm, pose changes at 51.8, 53.0 |
| 7 | 0:56.0–1:00.1 | Low-angle hero shot (S6) | Button | Hero rises into frame against the sky |

- **Open loop:** who lives in the burrow? Opened at 0:25, closed at 0:44–0:48.

## 5. Shot grammar

- **Pace:** average shot 10 s; long holds alternate with one short detail shot (3.8 s). Changes inside shots are character poses, not edits.
- **Transitions:** fade-in and dissolves for passing time or moving into the hero's home; hard cuts for character beats. Sound hits on 40% of cuts vs 13% at random moments *(rough)*.
- **Camera:** slow lateral drift on the wides, locked-off on character beats, low angle for the hero.
- **Picture–sound sync:** nothing is said; the music carries the mood and character moves land on accents (inferred).

## 6. Visual style guide

- **Palette (measured):** `#f9e2cd` peach sky, `#bdcbaf` pale sage, `#8aa380` grass, `#597156` foliage, `#7c8057` olive, `#455247` shade, `#1a2423` deep shadow.
- **Grade:** warm, soft, low saturation (0.35), mid brightness (0.52), with one dark stretch (0.34) for the reveal.
- **Text:** credit in small spaced white caps, centred over the picture; the title is a chunky rounded display face (closest free fonts: Fredoka Bold or Baloo 2 ExtraBold), white, centred, fading in over a wide.
- **Characters:** round, soft-bodied, big-eyed creatures with exaggerated poses. Design your own; never reuse these characters.

## 7. Voice direction

No voice. If you add narration, keep it sparse: a warm storyteller, under 120 wpm, with long pauses that let the pictures play.

## 8. Sound design

- **Bed:** music-like, tonal and gentle (mood inferred: pastoral, orchestral).
- **Loudness:** -26 LUFS integrated, 18 LU range: a dynamic, film-style mix. For web delivery, master to about -16 LUFS.
- **Silence:** near-silences at 0:00 (1.45 s), 0:22.3, 0:43.4 (1.5 s, just before the reveal) and 0:53.0. Silence before the reveal is a key device.

## 9. Packaging

The title sits on the hero's home, and the cover is the title over the burrow. Template: "{{TITLE}} over the place where {{HERO}} lives."

## 10. Creator-specific vs reusable

| Belongs to the film (don't copy) | Reusable |
|---|---|
| The rabbit, the bird, the title, the music | World before hero; sidekick gag before the title; title over the hero's home; reveal in the dark, payoff in the light; low-angle button |

## 11. Fill-in-the-blanks script (shot list)

```
[0:00–0:12 WIDE | fade up from black over 2 s | slow drift] {{WORLD}} at its most beautiful. Music only.
[0:12–0:16 DETAIL | hard cut] One small living detail of {{WORLD}}.
[0:16–0:23 SIDEKICK | locked-off medium] {{SIDEKICK}} does 3–4 exaggerated poses, one every ~1.5 s. Credit "{{STUDIO}} presents" at 0:21.
[0:23–0:33 HOME | wide] {{HERO}}'s home. Title "{{TITLE}}" fades in at 0:25.
[0:33–0:48 DARK CLOSE | 2 s dissolve] Inside or at the door. Near-silence at 0:43, {{HERO}} emerges at 0:44.
[0:48–0:56 PAYOFF | bright medium] {{HERO}} in sunlight, two big pose changes.
[0:56–1:00 BUTTON | low angle] {{HERO}} rises into frame against the sky.
```

## 12. Production plan

Animatic first: block the 6 shots with these exact durations and time the music to them. Character animation goes into shots 3, 5 and 6 only; shots 1, 2 and 4 are environment plus a camera drift.

## 13. AI prompts

**Visuals:** `Soft 3D storybook animation still, {{SHOT}}, pastel peach sky, sage and olive greens, warm low sun, gentle depth of field, rounded original creature with big eyes, 16:9, no text`

**Music:** `Gentle pastoral orchestral cue, woodwinds and pizzicato strings, 60 s: soft intro 0–12 s, playful staccato 15–23 s, warm swell at 25 s for the title, hush at 43 s, bright reprise from 47 s`

## 14. Edit recipe

1. Lay the 6 shots at 11.9 / 3.8 / 7.3 / 9.7 / 15.0 / 8.3 / 4.1 s (shot 4 split by a 2 s dissolve).
2. Fade from black over 2 s at the start.
3. Hard cuts between character beats, each with a soft hit or whoosh.
4. Leave 1–1.5 s of near-silence before the reveal.

## 15. QA checklist

- [ ] First shot holds ≥10 s; average shot 8–10 s
- [ ] Sidekick gag before the title; title over the hero's home
- [ ] Reveal in a darker frame, payoff in a brighter one
- [ ] Palette within the peach/sage/olive family; saturation around 0.35
- [ ] Near-silence before the reveal
- [ ] Original characters only
