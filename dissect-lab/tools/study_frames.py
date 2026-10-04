"""Turn reference frames into a measurable style profile, and score other frames against it.

Usage:
  python3 tools/study_frames.py <frames dir | video file> [--out DIR] [--every 2.0]
  python3 tools/study_frames.py <my frames> --compare <reference frames | video> [--out DIR]

A video is sampled every --every seconds with ffmpeg. Needs numpy and pillow (uv run --with numpy --with pillow).
The profile captures what makes a flat-vector look recognisable and is cheap to measure:
  flatness      share of pixels inside flat fills (3x3 neighbourhood almost uniform); flat vector art is high
  edges         share of pixels on a strong edge; texture and photos are high
  economy       how many quantised colours cover 90% of the frame; flat art uses few
  dark_bg       share of very dark pixels (night skies, space)
  saturation    mean and p90 (accent strength); brightness mean
  palette       dominant colours across all frames
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

METRICS = ["flatness", "edges", "economy", "dark_bg", "sat_mean", "sat_p90", "brightness"]
TOL = {"flatness": 0.10, "edges": 0.04, "economy": 12, "dark_bg": 0.12, "sat_mean": 0.08, "sat_p90": 0.10, "brightness": 0.08}


def load_frames(src: Path, every: float):
    if src.is_dir():
        files = sorted(p for p in src.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"))
        return [(p.name, Image.open(p).convert("RGB")) for p in files]
    tmp = Path(tempfile.mkdtemp(prefix="study-"))
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(src), "-vf", f"fps=1/{every},scale=640:-2", str(tmp / "f%04d.jpg")], check=True)
    return [(p.name, Image.open(p).convert("RGB")) for p in sorted(tmp.glob("*.jpg"))]


def frame_metrics(im: Image.Image) -> dict:
    im = im.resize((320, max(2, int(320 * im.height / im.width))))
    a = np.asarray(im, dtype=np.float32) / 255
    g = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    # local 3x3 variation
    pad = np.pad(g, 1, mode="edge")
    stack = np.stack([pad[dy:dy + g.shape[0], dx:dx + g.shape[1]] for dy in range(3) for dx in range(3)])
    local = stack.max(axis=0) - stack.min(axis=0)
    gx, gy = np.abs(np.diff(g, axis=1))[:-1, :], np.abs(np.diff(g, axis=0))[:, :-1]
    q = (a * 7.99).astype(int)
    codes = q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]
    counts = np.sort(np.bincount(codes.ravel(), minlength=512))[::-1]
    economy = int(np.searchsorted(np.cumsum(counts) / counts.sum(), 0.9) + 1)
    return {
        "flatness": float((local < 0.03).mean()),
        "edges": float((np.hypot(gx, gy) > 0.12).mean()),
        "economy": economy,
        "dark_bg": float((g < 0.15).mean()),
        "sat_mean": float(sat.mean()),
        "sat_p90": float(np.percentile(sat, 90)),
        "brightness": float(g.mean()),
    }


def palette(frames, k=8):
    m = Image.new("RGB", (64, 64 * len(frames)))
    for i, (_, im) in enumerate(frames):
        m.paste(im.resize((64, 64)), (0, i * 64))
    qi = m.quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    pal, counts = qi.getpalette(), sorted(qi.getcolors(), reverse=True)
    total = sum(c for c, _ in counts)
    return [{"hex": "#%02x%02x%02x" % tuple(pal[i * 3:i * 3 + 3]), "share": round(c / total, 3)} for c, i in counts]


def profile(frames):
    per = [frame_metrics(im) for _, im in frames]
    agg = {m: round(float(np.median([p[m] for p in per])), 3) for m in METRICS}
    agg["frames"] = len(frames)
    agg["palette"] = palette(frames)
    return agg


def sheet(frames, path, cols=4, w=320, title=None):
    frames = frames[:cols * 6]
    h = int(w * 9 / 16)
    rows = (len(frames) + cols - 1) // cols
    out = Image.new("RGB", (cols * w, rows * h), (12, 12, 16))
    for i, (_, im) in enumerate(frames):
        out.paste(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
    out.save(path, quality=85)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--compare", help="reference frames dir or video to score src against")
    ap.add_argument("--out", default="style-study")
    ap.add_argument("--every", type=float, default=2.0)
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    mine = load_frames(Path(args.src), args.every)
    if not mine:
        sys.exit("No frames found.")
    p = profile(mine)
    result = {"profile": p}
    lines = [f"# Style profile: {args.src}", "", f"{p['frames']} frames.", "", "| Measure | Value |", "|---|---|"]
    lines += [f"| {m} | {p[m]} |" for m in METRICS]
    lines += ["", "Palette: " + ", ".join(f"`{c['hex']}` {c['share']:.0%}" for c in p["palette"])]
    sheet(mine, out / "frames.jpg")
    if args.compare:
        ref = load_frames(Path(args.compare), args.every)
        rp = profile(ref)
        rows, score = [], []
        for m in METRICS:
            d = abs(p[m] - rp[m]) / TOL[m]
            score.append(max(0.0, 1 - d / 3))
            rows.append(f"| {m} | {rp[m]} | {p[m]} | {'match' if d <= 1 else 'close' if d <= 2 else 'off'} |")
        result["reference"] = rp
        result["similarity"] = round(100 * float(np.mean(score)))
        lines += ["", f"## Compared with {args.compare}", "", f"Similarity: **{result['similarity']}/100**", "",
                  "| Measure | Reference | Mine | |", "|---|---|---|---|", *rows,
                  "", "Reference palette: " + ", ".join(f"`{c['hex']}` {c['share']:.0%}" for c in rp["palette"])]
        sheet(ref, out / "reference.jpg")
    (out / "style.json").write_text(json.dumps(result, indent=1))
    (out / "profile.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
