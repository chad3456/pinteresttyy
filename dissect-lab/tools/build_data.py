"""Collect dissections and recreation checks into data.json for the Dissect Lab site.

Usage: python3 tools/build_data.py   (run from dissect-lab/)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
D, R = ROOT / "dissections", ROOT / "recreations"

PAIRS = [  # recreation preset -> source dissection folder, new topic
    ("flat-space", "flat-space-explainer"),
    ("storybook", "big_buck_bunny"),
    ("fixed-classroom", "classroom"),
    ("fixed-aisle", "store-aisle-detection"),
    ("fixed-corridor", "face-demographics-walking-and-pause"),
    ("fixed-lot", "person-bicycle-car-detection"),
]
CREDITS = {
    "big_buck_bunny": "Big Buck Bunny © Blender Foundation, CC BY 3.0 (sample file from mediaelement/mediaelement-files)",
    "classroom": "classroom.mp4, Intel IoT DevKit sample-videos, CC BY 4.0",
    "store-aisle-detection": "store-aisle-detection.mp4, Intel IoT DevKit sample-videos, CC BY 4.0",
    "face-demographics-walking-and-pause": "face-demographics-walking-and-pause.mp4, Intel IoT DevKit sample-videos, CC BY 4.0",
    "person-bicycle-car-detection": "person-bicycle-car-detection.mp4, Intel IoT DevKit sample-videos, CC BY 4.0",
}
TITLES = {
    "flat-space-explainer": "Flat-vector science explainer (Kurzgesagt-style)",
    "big_buck_bunny": "Big Buck Bunny, opening minute",
    "classroom": "Classroom, fixed camera",
    "store-aisle-detection": "Store aisle, fixed camera",
    "face-demographics-walking-and-pause": "Corridor walk-ups, fixed camera",
    "person-bicycle-car-detection": "Parking lot, fixed camera",
}


def summarize(metrics_path: Path) -> dict:
    m = json.loads(metrics_path.read_text())
    shots = m["shots"]
    look = m.get("look") or {}
    snd = m.get("sound") or {}
    tr = snd.get("transients") or {}
    return {
        "duration": m["analysed_seconds"],
        "width": m["probe"].get("width"), "height": m["probe"].get("height"),
        "shots": len(shots),
        "avgShot": round(sum(s["len"] for s in shots) / len(shots), 1),
        "cuts": len(m["cuts"]), "uncertain": len(m["uncertain"]),
        "steps": len(m["steps"]),
        "dissolves": sum(1 for e in m["steps"] if "dissolve" in (e.get("why") or "")),
        "saturation": round(look.get("saturation", 0), 2), "brightness": round(look.get("brightness", 0), 2),
        "palette": look.get("palette", [])[:6],
        "lufs": (m.get("loudness") or {}).get("integrated_lufs"),
        "bed": snd.get("bed_verdict"),
        "sfxOnCuts": tr.get("on_cuts"), "sfxBaseline": tr.get("baseline"),
        "hasAudio": m["probe"].get("has_audio"),
        "timeline": {"shots": [[s["start"], s["end"]] for s in shots],
                     "cuts": [e["t"] for e in m["cuts"]],
                     "uncertain": [e["t"] for e in m["uncertain"]],
                     "steps": [[e["t"], "dissolve" if "dissolve" in (e.get("why") or "") else "local"] for e in m["steps"]]},
    }


def sheets(folder: Path, rel: str) -> list:
    return [f"{rel}/{p.name}" for p in sorted(folder.glob("*.jpg")) if p.name != "cover.jpg"] + \
        ([f"{rel}/cover.jpg"] if (folder / "cover.jpg").exists() else [])


def main():
    v1 = json.loads((R / "v1-measured.json").read_text())
    pairs = []
    for preset, src in PAIRS:
        sfolder = D / src
        bp = next(sfolder.glob("*.blueprint.md"))
        measured = (sfolder / "data" / "metrics.json").exists()
        tl = json.loads((R / f"{preset}.timeline.json").read_text())
        pairs.append({
            "preset": preset, "source": src, "title": TITLES[src], "credit": CREDITS.get(src),
            "measured": measured,
            "sourceMetrics": summarize(sfolder / "data" / "metrics.json") if measured else None,
            "sourceSheets": sheets(sfolder, f"dissections/{src}") if measured else [],
            "blueprint": bp.read_text(), "blueprintPath": f"dissections/{src}/{bp.name}",
            "recreation": {
                "video": f"recreations/{preset}.mp4", "topic": tl["topic"], "duration": round(tl["duration"], 1),
                "designedShots": len(tl["shots"]), "designedCuts": tl["cuts"],
                "v1": v1.get(preset), "v2": summarize(R / "check" / preset / "data" / "metrics.json"),
                "sheets": sheets(R / "check" / preset, f"recreations/check/{preset}"),
            },
        })
    out = {"generated": "2026-10-04", "pairs": pairs, "formula": (D / "formula.md").read_text()}
    (ROOT / "data.json").write_text(json.dumps(out, indent=1))
    print("data.json:", len(pairs), "pairs,", (ROOT / "data.json").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
