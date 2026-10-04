# Dissect Lab

A test bench for the `dissect` skill (`.claude/skills/dissect`). It has four parts:

- **Results**: five measured source videos, each with a blueprint and a recreation on a new topic. The skill measured every recreation again, and both rounds are shown.
- **Studio**: the recreation engine, live. Pick a style, write a script, play it with browser narration and music, and record it.
- **Analyzer**: a browser port of the skill's cut detector for any video file you drop in.
- **Run locally**: commands for the full skill, and a form that calls it when the lab is served by `server.py`.

```bash
python3 dissect-lab/server.py        # http://localhost:8765
```

## Layout

| Path | What |
|---|---|
| `index.html` | The app (page content only; `server.py` wraps it in a document) |
| `engine.js` | Recreation engine: presets built from the blueprints, timeline, deterministic `renderAt(ctx, timeline, t)` |
| `data.json` | Built by `tools/build_data.py` from the dissections and recreation checks |
| `dissections/<video>/` | `dissect.py` output plus the `*.blueprint.md` written from it; `formula.md` compares the five |
| `recreations/` | Rendered MP4s, their timelines, `v1-measured.json` (first render) and `check/` (the skill run on each final render) |
| `tools/render.mjs` | Renders every preset to MP4 with headless Chromium (Playwright) |
| `tools/audio.py` | Synthesises each recreation's music bed and muxes it |

## Rebuild

```bash
cd dissect-lab
node tools/render.mjs recreations            # needs playwright
python3 tools/audio.py recreations           # needs numpy + ffmpeg
for id in flat-space storybook fixed-classroom fixed-aisle fixed-corridor fixed-lot; do
  uv run ../.claude/skills/dissect/scripts/dissect.py recreations/$id.mp4 --depth quick --out recreations/check/$id
done
python3 tools/build_data.py
```

## Sources and limits

- The test videos are openly licensed samples: Big Buck Bunny (© Blender Foundation, CC BY 3.0) and four clips from Intel's IoT DevKit `sample-videos` (CC BY 4.0). They were used because YouTube and other video sites, and Hugging Face (Whisper models), were blocked on the build machine.
- For the same reason there are no transcripts. The Kurzgesagt-style preset comes from a style study of the genre, not a measurement. Run the skill on a real link from a normal network to measure one.
- All recreation characters (Blip, Puff, Moss) and scenes are original drawings.
