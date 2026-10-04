#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = [
#   "numpy>=1.24",
#   "pillow>=10.1",
#   "faster-whisper>=1.0",
#   "praat-parselmouth>=0.4.3",
#   "yt-dlp[default,curl-cffi]",
# ]
# ///
"""Measure a video so it can be turned into a reusable format blueprint.

Usage:
    uv run dissect.py "<link or file>" [--depth quick|standard|deep] [--out DIR]

Writes facts.md, labelled contact sheets and data/*.json into a dissection
folder, prints a JSON summary on stdout and progress on stderr.

Exit codes: 0 ok, 1 bad input or missing tool, 2 download failed,
3 download needs a login (rerun with --cookies-from-browser after asking).
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import math
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover - only without uv
    print(json.dumps({
        "status": "missing_dependency",
        "detail": str(exc),
        "fix": "Run with `uv run` so dependencies install automatically, or run scripts/doctor.py for install commands.",
    }, indent=2))
    sys.exit(1)

VERSION = "1.1.0"

DEPTHS = {
    #            hook secs, hook fps, shot tiles, whisper model, beam, analysis fps
    "quick":    dict(hook_s=3.0, hook_fps=4, shot_tiles=24, model="base", beam=1, fps=8),
    "standard": dict(hook_s=5.0, hook_fps=4, shot_tiles=52, model="small", beam=5, fps=12),
    "deep":     dict(hook_s=6.0, hook_fps=6, shot_tiles=124, model="medium", beam=5, fps=15),
}

STOPWORDS = set("""a an the and or but if so of to in on at by for with from as is are was were be been being
i you he she it we they me him her us them my your his its our their this that these those there here
do does did done have has had not no yes just very really can could would should will shall may might
than then too also into about over out up down off what when where who whom which why how all any some
im youre its thats dont cant wont isnt arent wasnt gonna wanna got get gets like um uh oh okay ok""".split())


# --------------------------------------------------------------------------- utils

def log(msg: str) -> None:
    print(f"[dissect] {msg}", file=sys.stderr, flush=True)


def fmt_t(t: float, decimals: int = 1) -> str:
    """Seconds -> m:ss.s (or h:mm:ss)."""
    if t is None or not math.isfinite(t):
        return "?"
    t = max(0.0, t)
    m, s = divmod(t, 60)
    h, m = divmod(int(m), 60)
    sec = f"{s:0{3 + decimals if decimals else 2}.{decimals}f}"
    return f"{h}:{m:02d}:{sec}" if h else f"{m}:{sec}"


def fmt_n(n) -> str:
    if n is None:
        return "n/a"
    try:
        n = float(n)
    except (TypeError, ValueError):
        return str(n)
    for unit, div in (("B", 1e9), ("M", 1e6), ("K", 1e3)):
        if abs(n) >= div:
            return f"{n / div:.1f}{unit}"
    return f"{n:.0f}"


def slugify(text: str, limit: int = 50) -> str:
    text = re.sub(r"[^\w\s-]", "", (text or "").lower(), flags=re.UNICODE)
    text = re.sub(r"[\s_-]+", "-", text).strip("-")
    text = text[:limit].rstrip("-")
    return text or "video"


def run(cmd, timeout=None, env=None, capture=True):
    return subprocess.run(cmd, capture_output=capture, text=True, timeout=timeout, env=env)


def need(tool: str) -> None:
    if not shutil.which(tool):
        fail("missing_tool", f"`{tool}` was not found on PATH.",
             "Install ffmpeg (it includes ffprobe). scripts/doctor.py prints the command for your OS.", 1)


def fail(status: str, detail: str, fix: str, code: int, extra: dict | None = None):
    out = {"status": status, "detail": detail, "fix": fix}
    if extra:
        out.update(extra)
    print(json.dumps(out, indent=2))
    sys.exit(code)


def pct(x, digits=0) -> str:
    return f"{100 * x:.{digits}f}%"


# --------------------------------------------------------------------------- download

LOGIN_PATTERNS = [
    r"sign in to confirm", r"login required", r"log ?in to", r"logged[- ]in", r"requires? (authentication|login)",
    r"use --cookies", r"cookies-from-browser", r"age[- ]restrict", r"confirm your age", r"private video",
    r"rate-limit reached or login", r"content isn.t available", r"members[- ]only", r"inappropriate for some users",
    r"not available without", r"you need to log in", r"account.*(required|needed)", r"not a bot",
]
UNSUPPORTED_PATTERNS = [r"unsupported url"]
UNAVAILABLE_PATTERNS = [r"video unavailable", r"has been removed", r"does not exist", r"no longer available",
                        r"this video is not available", r"http error 404"]


def cache_dir() -> Path:
    base = os.environ.get("XDG_CACHE_HOME") or os.path.join(os.path.expanduser("~"), ".cache")
    p = Path(base) / "dissect"
    p.mkdir(parents=True, exist_ok=True)
    return p


def ytdlp_base():
    """Return (cmd, env) for the yt-dlp available now, fetching one if missing."""
    try:
        import yt_dlp  # noqa: F401
        return [sys.executable, "-m", "yt_dlp"], None
    except ImportError:
        pass
    exe = shutil.which("yt-dlp")
    if exe:
        return [exe], None
    return ytdlp_latest()


def ytdlp_latest():
    """Newest yt-dlp release (with curl_cffi for impersonation), fetched on demand."""
    if shutil.which("uvx"):
        return ["uvx", "--refresh", "--with", "curl-cffi", "yt-dlp@latest"], None
    target = cache_dir() / "yt-dlp-latest"
    log("Fetching the newest yt-dlp with pip ...")
    r = run([sys.executable, "-m", "pip", "install", "--quiet", "--upgrade", "--target", str(target),
             "yt-dlp[default,curl-cffi]"], timeout=600)
    if r.returncode != 0:
        return None, None
    env = dict(os.environ)
    env["PYTHONPATH"] = str(target) + os.pathsep + env.get("PYTHONPATH", "")
    return [sys.executable, "-m", "yt_dlp"], env


def classify_error(text: str) -> str:
    low = text.lower()
    if any(re.search(p, low) for p in LOGIN_PATTERNS):
        return "login_required"
    if any(re.search(p, low) for p in UNSUPPORTED_PATTERNS):
        return "unsupported_url"
    if any(re.search(p, low) for p in UNAVAILABLE_PATTERNS):
        return "unavailable"
    if re.search(r"proxyerror|tunnel failed|name resolution|network is unreachable", low):
        return "network"
    if re.search(r"http error 403|forbidden|blocked|captcha", low):
        return "blocked"
    if re.search(r"timed out|connection|resolve|network|ssl", low):
        return "network"
    return "download_failed"


def download(url: str, work: Path, args) -> dict:
    fmt = ("bv*[height<=1280][width<=1280]+ba/b[height<=1280][width<=1280]/bv*+ba/b")
    common = [url, "-f", fmt, "-o", str(work / "video.%(ext)s"), "--write-info-json", "--write-thumbnail",
              "--convert-thumbnails", "jpg", "--no-playlist", "--merge-output-format", "mp4", "--no-progress",
              "--retries", "3", "--socket-timeout", "30", "--no-overwrites"]
    if args.max_minutes:
        common += ["--download-sections", f"*0-{int(args.max_minutes * 60) + 5}"]
    if args.cookies_from_browser:
        common += ["--cookies-from-browser", args.cookies_from_browser]

    attempts = [("yt-dlp", False, False), ("yt-dlp + browser impersonation", True, False),
                ("newest yt-dlp + browser impersonation", True, True)]
    errors = []
    for label, impersonate, latest in attempts:
        base, env = ytdlp_latest() if latest else ytdlp_base()
        if not base:
            errors.append(f"[{label}] could not get yt-dlp")
            continue
        cmd = base + common + (["--impersonate", "chrome"] if impersonate else [])
        log(f"Downloading with {label} ...")
        for f in work.glob("video.*"):
            if f.suffix in (".part", ".ytdl"):
                f.unlink(missing_ok=True)
        try:
            r = run(cmd, timeout=1800, env=env)
        except subprocess.TimeoutExpired:
            errors.append(f"[{label}] timed out after 30 minutes")
            continue
        video = find_video(work)
        if r.returncode == 0 and video:
            info = {}
            ij = work / "video.info.json"
            if ij.exists():
                info = json.loads(ij.read_text(encoding="utf-8"))
            return {"video": video, "info": info, "thumb": work / "video.jpg", "method": label,
                    "ytdlp": base, "env": env}
        lines = [ln for ln in (r.stderr or "").splitlines() if ln.strip()]
        tail = "\n".join([ln for ln in lines if ln.startswith("ERROR")][-2:] or lines[-3:])
        errors.append(f"[{label}] {tail}")
        if "impersonate target" in tail.lower() and not latest:
            continue
    text = "\n".join(errors)
    status = classify_error(text)
    fixes = {
        "login_required": "This video only downloads when logged in (or the site wants proof you're not a bot). "
                          "Ask the user before using their browser cookies; after a clear yes, rerun with "
                          "--cookies-from-browser chrome (or firefox, safari, edge, brave).",
        "unsupported_url": "yt-dlp doesn't support this link. Ask for the direct post URL, or have the user "
                           "download the file with a downloader they trust and give you the path.",
        "unavailable": "The video seems to be removed, private or region-locked. Check the link in a browser.",
        "blocked": "The site blocked the download even with browser impersonation and the newest yt-dlp. Ask the "
                   "user to download the file with a downloader they trust and give you the path.",
        "network": "The download hit a network error. Check the internet connection and retry.",
        "download_failed": "Every download attempt failed. Ask the user to download the file with a downloader "
                           "they trust and give you the path.",
    }
    fail(status, text[-3000:], fixes[status], 3 if status == "login_required" else 2)


def find_video(work: Path):
    for f in sorted(work.glob("video.*")):
        if f.suffix.lower() in (".mp4", ".mkv", ".webm", ".mov", ".m4v", ".flv", ".avi", ".3gp", ".ts", ".m4a",
                                ".mp3", ".opus", ".ogg", ".wav", ".aac"):
            return f
    return None


def fetch_comments(url: str, work: Path, base, env, args, platform: str) -> list:
    cmd = base + [url, "--skip-download", "--write-comments", "--write-info-json", "--no-playlist",
                  "-o", str(work / "comments.%(ext)s"), "--socket-timeout", "30"]
    if platform == "youtube":
        cmd += ["--extractor-args", "youtube:max_comments=80,all,0,0;comment_sort=top"]
    if args.cookies_from_browser:
        cmd += ["--cookies-from-browser", args.cookies_from_browser]
    try:
        run(cmd, timeout=150, env=env)
    except subprocess.TimeoutExpired:
        return []
    f = work / "comments.info.json"
    if not f.exists():
        return []
    try:
        data = json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        return []
    out = []
    for c in data.get("comments") or []:
        if c.get("parent") not in (None, "root"):
            continue
        out.append({"text": (c.get("text") or "").strip(), "likes": c.get("like_count") or 0,
                    "author_is_uploader": bool(c.get("author_is_uploader")), "pinned": bool(c.get("is_pinned"))})
    out.sort(key=lambda c: (c["pinned"], c["likes"]), reverse=True)
    return out[:40]


# --------------------------------------------------------------------------- probing

def probe(path: Path) -> dict:
    r = run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)])
    if r.returncode != 0:
        fail("unreadable_file", r.stderr[-1500:], "The file could not be read by ffprobe. Is it a video?", 1)
    data = json.loads(r.stdout)
    v = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"
              and not (s.get("disposition") or {}).get("attached_pic")), None)
    a = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
    dur = float((data.get("format") or {}).get("duration") or 0) or float((v or a or {}).get("duration") or 0)
    out = {"duration": dur, "has_video": v is not None, "has_audio": a is not None}
    if v:
        w, h = int(v.get("width") or 0), int(v.get("height") or 0)
        rot = 0
        for sd in v.get("side_data_list") or []:
            if "rotation" in sd:
                rot = int(sd["rotation"])
        rot = int((v.get("tags") or {}).get("rotate", rot) or 0)
        if abs(rot) % 180 == 90:
            w, h = h, w
        num, _, den = (v.get("avg_frame_rate") or "0/1").partition("/")
        fps = float(num) / float(den or 1) if float(den or 1) else 0
        out.update(width=w, height=h, fps=round(fps, 2), vcodec=v.get("codec_name"))
    if a:
        out.update(acodec=a.get("codec_name"), sample_rate=int(a.get("sample_rate") or 0),
                   channels=int(a.get("channels") or 0))
    return out


def aspect_label(w: int, h: int) -> str:
    if not w or not h:
        return "?"
    r = w / h
    for name, val in (("9:16", 9 / 16), ("4:5", 4 / 5), ("1:1", 1.0), ("4:3", 4 / 3), ("16:9", 16 / 9),
                      ("21:9", 21 / 9)):
        if abs(r - val) / val < 0.04:
            return name
    return f"{r:.2f}:1"


# --------------------------------------------------------------------------- visual analysis

GRID = 8  # block grid for local-change detection


def analyse_frames(video: Path, dur: float, fps: int, w: int, h: int) -> dict:
    if w >= h:
        W, H = 96, max(16, int(round(96 * h / w / 2)) * 2)
    else:
        H, W = 96, max(16, int(round(96 * w / h / 2)) * 2)
    cmd = ["ffmpeg", "-v", "error", "-i", str(video), "-t", f"{dur:.3f}", "-an",
           "-vf", f"fps={fps},scale={W}:{H}:flags=area", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    fsz = W * H * 3
    ys = np.linspace(0, H, GRID + 1).astype(int)
    xs = np.linspace(0, W, GRID + 1).astype(int)

    def blocks(a2d):
        return np.array([[a2d[ys[i]:ys[i + 1], xs[j]:xs[j + 1]].mean() for j in range(GRID)]
                         for i in range(GRID)], dtype=np.float32).ravel()

    hists, thumbs, dps, dhs, bds, lum, sat = [], [], [], [], [], [], []
    prev_g = prev_h = None
    n = 0
    while True:
        buf = p.stdout.read(fsz)
        if not buf or len(buf) < fsz:
            break
        rgb = np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3)
        g = (rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114).astype(np.float32) / 255.0
        q = (rgb >> 6).astype(np.int32)
        idx = q[..., 0] * 16 + q[..., 1] * 4 + q[..., 2]
        hist = np.bincount(idx.ravel(), minlength=64).astype(np.float32)
        hist /= hist.sum()
        mx = rgb.max(axis=2).astype(np.float32)
        mn = rgb.min(axis=2).astype(np.float32)
        sat.append(float(np.mean(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0))))
        lum.append(float(g.mean()))
        if prev_g is None:
            dps.append(0.0)
            dhs.append(0.0)
            bds.append(np.zeros(GRID * GRID, dtype=np.float32))
        else:
            diff = np.abs(g - prev_g)
            dps.append(float(diff.mean()))
            dhs.append(float(0.5 * np.abs(hist - prev_h).sum()))
            bds.append(blocks(diff))
        hists.append(hist)
        thumbs.append(blocks(g))
        prev_g, prev_h = g, hist
        n += 1
        if n % (fps * 60) == 0:
            log(f"  scanned {fmt_t(n / fps, 0)} of video")
    p.wait()
    if n < 2:
        return {"n": n, "fps": fps, "cuts": [], "uncertain": [], "steps": [], "lum": lum, "sat": sat}
    return detect_changes(np.array(dps), np.array(dhs), np.array(bds), np.array(thumbs), np.array(hists), fps,
                          lum, sat)


def _local_median(x: np.ndarray, half: int) -> np.ndarray:
    n = len(x)
    out = np.empty(n, dtype=np.float32)
    for i in range(n):
        lo, hi = max(0, i - half), min(n, i + half + 1)
        seg = np.concatenate([x[lo:i], x[i + 1:hi]])
        out[i] = np.median(seg) if len(seg) else 0.0
    return out


def detect_changes(dp, dh, bd, th, hi, fps, lum, sat) -> dict:
    n = len(dp)
    half = max(3, int(fps * 0.75))
    med_dp = _local_median(dp, half)
    med_dh = _local_median(dh, half)
    bf = (bd > 0.10).mean(axis=1)
    bmax = bd.max(axis=1)
    med_bf = _local_median(bf, half)
    med_bmax = _local_median(bmax, half)

    def tdiff(a, b):
        a, b = max(0, min(n - 1, a)), max(0, min(n - 1, b))
        return float(np.abs(th[a] - th[b]).mean())

    events = []
    for i in range(1, n):
        spike = dp[i] >= 2.5 * med_dp[i] + 0.03 or dh[i] >= 2.5 * med_dh[i] + 0.10
        high_motion = med_dp[i] >= 0.06 or med_bf[i] >= 0.45
        # did the picture come back a few frames later? (flash, smoke puff, shake)
        returns = tdiff(i - 1, i + 2) < 0.35 * max(tdiff(i - 1, i), 1e-6) and tdiff(i - 1, i + 2) < 0.03
        strong = bf[i] >= 0.5 and (dh[i] >= 0.25 or (dp[i] >= 0.07 and bf[i] >= 0.65))
        # a one-frame spike in colour with stillness either side is a cut even when the frames are
        # dark or pastel and few blocks pass the absolute threshold
        nb = max(dp[i - 1], dp[i + 1] if i + 1 < n else 0.0)
        strong = strong or (dh[i] >= 0.2 and dp[i] >= 0.04 and dp[i] >= 4 * nb and bf[i] >= 0.12)
        t = (i - 0.5) / fps
        if strong and spike and not returns and not high_motion:
            events.append({"t": t, "i": i, "kind": "cut", "score": float(dh[i] + dp[i] * 2)})
        elif (strong and (spike or not returns)) or (bf[i] >= 0.3 and spike and (dh[i] >= 0.15 or dp[i] >= 0.04)):
            why = "flash or returns" if returns else ("during heavy motion" if high_motion else "borderline")
            events.append({"t": t, "i": i, "kind": "uncertain", "why": why, "score": float(dh[i] + dp[i] * 2)})
        else:
            local_spike = bmax[i] >= 2.5 * med_bmax[i] + 0.06 and bmax[i] >= 0.12
            if local_spike and med_bf[i] < 0.2:
                changed = bd[i] > 0.08
                persist = float(np.abs(th[min(n - 1, i + 3)] - th[i - 1])[changed].mean()) if changed.any() else 0
                if persist >= 0.05:
                    events.append({"t": t, "i": i, "kind": "step", "why": "local change (text, graphic, overlay)",
                                   "area": round(float(changed.mean()), 2), "score": float(bmax[i])})

    # dissolves / fades: the middle frame is a blend of the two ends
    hard = {e["i"] for e in events if e["kind"] in ("cut", "uncertain")}
    for k, i in ((k, i) for k in (max(2, int(round(fps * 0.4))), max(4, int(round(fps * 1.2))))
                 for i in range(k, n - k, max(1, k // 2))):
        if any(abs(i - j) <= k for j in hard):
            continue
        D = float(np.abs(th[i + k] - th[i - k]).mean())
        Hd = float(0.5 * np.abs(hi[i + k] - hi[i - k]).sum())
        if D < 0.08 or Hd < 0.25:
            continue
        blend = float(np.abs(th[i] - 0.5 * (th[i - k] + th[i + k])).mean())
        broad = float((np.abs(th[i + k] - th[i - k]) > 0.05).mean())  # most of the frame changes
        win = dp[i - k + 1:i + k + 1]
        gradual = float(win.max()) < 0.6 * D + 0.03 and float(win.sum()) >= 0.5 * D
        if blend < 0.35 * D and broad >= 0.4 and gradual:
            events.append({"t": i / fps, "i": i, "kind": "step", "why": "dissolve or fade", "score": D})

    # non-max suppression: one event per 0.3 s, cuts beat uncertain beat steps
    rank = {"cut": 3, "uncertain": 2, "step": 1}
    events.sort(key=lambda e: (-rank[e["kind"]], -e["score"]))
    kept = []
    for e in events:
        gap = 1.5 if e.get("why") == "dissolve or fade" else 0.3
        if all(abs(e["t"] - k2["t"]) >= gap for k2 in kept):
            kept.append(e)
    kept.sort(key=lambda e: e["t"])
    for e in kept:
        e["t"] = round(e["t"], 2)
        e.pop("i", None)
        e["score"] = round(e["score"], 3)
    return {
        "n": n, "fps": fps,
        "cuts": [e for e in kept if e["kind"] == "cut"],
        "uncertain": [e for e in kept if e["kind"] == "uncertain"],
        "steps": [e for e in kept if e["kind"] == "step"],
        "lum": lum, "sat": sat,
    }


def build_shots(cuts, dur):
    # a "shot" shorter than ~2 frames is a poster frame or glitch: fold it into its neighbour
    keep = []
    for c in cuts:
        prev = keep[-1]["t"] if keep else 0.0
        if c["t"] - prev >= 0.15 and dur - c["t"] >= 0.15:
            keep.append(c)
    cuts[:] = keep
    bounds = [0.0] + [c["t"] for c in cuts] + [dur]
    shots = []
    for i in range(len(bounds) - 1):
        s, e = bounds[i], bounds[i + 1]
        if e - s <= 0.01:
            continue
        shots.append({"n": len(shots) + 1, "start": round(s, 2), "end": round(e, 2), "len": round(e - s, 2)})
    return shots


def shot_at(shots, t):
    for s in shots:
        if s["start"] <= t < s["end"]:
            return s["n"]
    return shots[-1]["n"] if shots else 1


# --------------------------------------------------------------------------- frames & sheets

def get_font(size: int):
    for name in ("DejaVuSans-Bold.ttf", "Arial Bold.ttf", "arialbd.ttf", "Helvetica.ttc",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                 "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "C:\\Windows\\Fonts\\arialbd.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def tile_size(w, h, many=False):
    if w >= h:
        tw = 288 if many else 320
        return tw, int(round(tw * h / w))
    th_ = 288 if many else 320
    return int(round(th_ * w / h)), th_


def grab_frames(video: Path, times, size, folder: Path, prefix: str):
    """Extract one frame per time (seek per frame; accurate and cheap for < ~200 frames)."""
    folder.mkdir(parents=True, exist_ok=True)
    out = []
    tw, th_ = size
    for k, t in enumerate(times):
        f = folder / f"{prefix}{k:04d}.jpg"
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, t):.3f}", "-i", str(video), "-frames:v", "1",
               "-vf", f"scale={tw}:{th_}", "-q:v", "3", str(f)]
        run(cmd, timeout=60)
        if not f.exists() and t > 0.2:  # past the end: step back a little
            run(cmd[:5] + [f"{max(0, t - 0.3):.3f}"] + cmd[6:], timeout=60)
        out.append(f if f.exists() else None)
    return out


def make_sheet(tiles, path: Path, size, title: str, max_w: int = 1600):
    """tiles: list of (image_path|None, label, sublabel)."""
    tw, th_ = size
    lab_h = 26
    cols = max(1, min(len(tiles), max_w // (tw + 4)))
    rows = math.ceil(len(tiles) / cols)
    head = 30
    sheet = Image.new("RGB", (cols * (tw + 4) + 4, head + rows * (th_ + lab_h + 4) + 4), (18, 18, 18))
    d = ImageDraw.Draw(sheet)
    font, small, hfont = get_font(15), get_font(12), get_font(16)
    d.text((8, 7), title, fill=(235, 235, 235), font=hfont)
    for k, (img, label, sub) in enumerate(tiles):
        r, c = divmod(k, cols)
        x, y = 4 + c * (tw + 4), head + r * (th_ + lab_h + 4)
        if img and Path(img).exists():
            with Image.open(img) as im:
                sheet.paste(im.convert("RGB").resize((tw, th_)), (x, y))
        else:
            d.rectangle([x, y, x + tw, y + th_], fill=(60, 0, 0))
            d.text((x + 8, y + 8), "no frame", fill=(255, 200, 200), font=small)
        d.rectangle([x, y + th_, x + tw, y + th_ + lab_h], fill=(0, 0, 0))
        colour = (255, 214, 10) if label.endswith("+") else (255, 120, 120) if label.endswith("?") else (255, 255, 255)
        d.text((x + 6, y + th_ + 5), label, fill=colour, font=font)
        if sub:
            bbox = d.textbbox((0, 0), sub, font=small)
            d.text((x + tw - (bbox[2] - bbox[0]) - 6, y + th_ + 7), sub, fill=(190, 190, 190), font=small)
    sheet.save(path, quality=85)
    return path


def plan_shot_tiles(shots, vis, budget, dur):
    """Pick which moments to show: shot middles first, then changes inside shots, then extra samples."""
    mids = [{"t": s["start"] + s["len"] / 2, "label": f"S{s['n']}", "shot": s["n"], "prio": 0} for s in shots]
    if len(mids) > budget:
        # keep the first shots (the hook) and spread the rest evenly
        head = mids[:min(8, budget // 3)]
        rest = mids[len(head):]
        need = budget - len(head)
        idx = np.linspace(0, len(rest) - 1, need).round().astype(int) if need > 0 else []
        return head + [rest[i] for i in sorted(set(idx))]
    chosen = list(mids)
    left = budget - len(chosen)
    extras = []
    for e in vis["steps"]:
        extras.append({"t": min(dur - 0.05, e["t"] + 0.2), "label": f"S{shot_at(shots, e['t'])}+", "prio": 1})
    for e in vis["uncertain"]:
        extras.append({"t": min(dur - 0.05, e["t"] + 0.2), "label": f"S{shot_at(shots, e['t'])}?", "prio": 2})
    if extras and left > 0:
        extras.sort(key=lambda e: e["t"])
        if len(extras) > left:
            # keep both kinds in proportion, spread through the video
            steps = [e for e in extras if e["prio"] == 1]
            unc = [e for e in extras if e["prio"] == 2]
            n_unc = min(len(unc), max(1, left // 3)) if unc else 0
            n_steps = left - n_unc
            pick = lambda lst, k: [lst[i] for i in sorted(set(np.linspace(0, len(lst) - 1, k).round().astype(int)))] if k > 0 and lst else []
            extras = pick(steps, min(n_steps, len(steps))) + pick(unc, n_unc)
        chosen += extras
    left = budget - len(chosen)
    if left > 0:
        # sample inside long shots so long takes are still visible
        longs = sorted(shots, key=lambda s: -s["len"])
        k = 0
        while left > 0 and longs and k < budget * 4:
            s = longs[k % len(longs)]
            k += 1
            have = [c["t"] for c in chosen if s["start"] <= c["t"] < s["end"]]
            if s["len"] < 3 or len(have) >= s["len"] / 2:
                continue
            gaps = sorted([s["start"]] + have + [s["end"]])
            g = max(range(len(gaps) - 1), key=lambda j: gaps[j + 1] - gaps[j])
            chosen.append({"t": (gaps[g] + gaps[g + 1]) / 2, "label": f"S{s['n']}", "prio": 3})
            left -= 1
    chosen.sort(key=lambda c: c["t"])
    return chosen


def palette(images, k=8):
    ims = []
    for p in images:
        if p and Path(p).exists():
            with Image.open(p) as im:
                ims.append(im.convert("RGB").resize((48, 48)))
    if not ims:
        return []
    m = Image.new("RGB", (48, 48 * len(ims)))  # one column, so no empty cells skew the counts
    for i, im in enumerate(ims):
        m.paste(im, (0, i * 48))
    q = m.quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()
    counts = sorted(q.getcolors(), reverse=True)
    total = sum(c for c, _ in counts)
    out = []
    for c, idx in counts:
        r, g, b = pal[idx * 3: idx * 3 + 3]
        out.append({"hex": f"#{r:02x}{g:02x}{b:02x}", "share": round(c / total, 3)})
    return out


# --------------------------------------------------------------------------- audio

def extract_audio(video: Path, dur: float, out: Path) -> bool:
    r = run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-t", f"{dur:.3f}", "-vn", "-ac", "1", "-ar", "16000",
             "-c:a", "pcm_s16le", str(out)], timeout=3600)
    return r.returncode == 0 and out.exists()


def load_wav(path: Path):
    with wave.open(str(path), "rb") as wf:
        sr = wf.getframerate()
        data = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    return data, sr


def loudness(video: Path, dur: float) -> dict:
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-t", f"{dur:.3f}", "-vn",
             "-af", "loudnorm=print_format=json", "-f", "null", "-"], timeout=3600)
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr or "", re.S)
    if not m:
        return {}
    j = json.loads(m.group(0))

    def f(key):
        try:
            v = float(j.get(key))
            return v if math.isfinite(v) else None
        except (TypeError, ValueError):
            return None
    return {"integrated_lufs": f("input_i"), "true_peak_dbtp": f("input_tp"), "range_lu": f("input_lra")}


def frame_db(x, sr, hop_s=0.05):
    hop = int(sr * hop_s)
    n = len(x) // hop
    if n == 0:
        return np.array([]), hop_s
    fr = x[: n * hop].reshape(n, hop)
    rms = np.sqrt((fr ** 2).mean(axis=1) + 1e-12)
    return 20 * np.log10(rms + 1e-9), hop_s


def transcribe(wav: Path, model_name: str, beam: int, lang):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        log("faster-whisper is not installed; skipping the transcript (run with uv to get it).")
        return None
    log(f"Loading Whisper model '{model_name}' (first run downloads it once) ...")
    try:
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
    except Exception as exc:  # network blocked, disk full, ...
        log(f"Could not load the speech model: {exc}")
        return {"error": str(exc)}
    log("Transcribing ...")
    segs, info = model.transcribe(str(wav), language=lang, word_timestamps=True, vad_filter=True,
                                  beam_size=beam, condition_on_previous_text=False)
    segments, words = [], []
    last = time.time()
    for s in segs:
        segments.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()})
        for w in s.words or []:
            words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3),
                          "p": round(w.probability, 3)})
        if time.time() - last > 15:
            log(f"  transcribed up to {fmt_t(s.end, 0)}")
            last = time.time()
    return {"language": info.language, "language_prob": round(info.language_probability, 3),
            "segments": segments, "words": [w for w in words if w["w"]]}


def pitch_track(x, sr):
    try:
        import parselmouth
    except ImportError:
        log("praat-parselmouth is not installed; skipping pitch.")
        return None, None
    times, f0 = [], []
    chunk = sr * 60
    for off in range(0, len(x), chunk):
        seg = x[off: off + chunk + sr]  # 1 s overlap
        if len(seg) < sr * 0.2:
            break
        snd = parselmouth.Sound(seg.astype(np.float64), sampling_frequency=sr)
        p = snd.to_pitch(time_step=0.01, pitch_floor=75.0, pitch_ceiling=500.0)
        ts = p.xs() + off / sr
        fs = p.selected_array["frequency"]
        keep = ts < (off + chunk) / sr
        times.append(ts[keep])
        f0.append(fs[keep])
    if not times:
        return None, None
    return np.concatenate(times), np.concatenate(f0)


def voice_metrics(words, x, sr, dur, ptimes, pf0):
    out = {}
    if not words:
        return out
    first, last = words[0]["s"], words[-1]["e"]
    span = max(1e-3, last - first)
    out["words"] = len(words)
    out["first_word_at"] = first
    out["wpm"] = round(len(words) / span * 60, 1)
    gaps = [(words[i]["s"] - words[i - 1]["e"], i) for i in range(1, len(words))]
    talk = sum(w["e"] - w["s"] for w in words) + sum(g for g, _ in gaps if 0 < g < 0.35)
    out["articulation_wpm"] = round(len(words) / max(talk, 1e-3) * 60, 1)
    out["speech_share"] = round(talk / max(dur, 1e-3), 3)

    pauses = [(g, i) for g, i in gaps if g >= 0.35]
    out["pauses_per_min"] = round(len(pauses) / span * 60, 1)
    out["mean_pause"] = round(float(np.mean([g for g, _ in pauses])), 2) if pauses else 0
    longest = sorted(pauses, reverse=True)[:12]

    def ctx(a, b):
        return " ".join(w["w"] for w in words[max(0, a):max(0, b)])
    out["longest_pauses"] = [{"at": round(words[i - 1]["e"], 2), "len": round(g, 2),
                              "before": ctx(i - 4, i), "after": ctx(i, i + 5)}
                             for g, i in sorted(longest, key=lambda p: words[p[1]]["s"])]

    # loudness, pitch and stretch per word -> emphasis score
    rms_db = []
    for w in words:
        a, b = int(w["s"] * sr), max(int(w["s"] * sr) + 1, int(w["e"] * sr))
        seg = x[a:b]
        rms_db.append(20 * math.log10(math.sqrt(float((seg ** 2).mean()) + 1e-12) + 1e-9) if len(seg) else -90)
    rms_db = np.array(rms_db)
    st = np.full(len(words), np.nan)
    if ptimes is not None and len(ptimes):
        voiced = pf0 > 0
        if voiced.sum() > 20:
            vt, vf = ptimes[voiced], pf0[voiced]
            med = float(np.median(vf))
            semis = 12 * np.log2(vf / med)
            out["pitch"] = {
                "median_hz": round(med, 1),
                "p10_hz": round(float(np.percentile(vf, 10)), 1),
                "p90_hz": round(float(np.percentile(vf, 90)), 1),
                "range_semitones_p10_p90": round(float(np.percentile(semis, 90) - np.percentile(semis, 10)), 1),
                "std_semitones": round(float(np.std(semis)), 2),
            }
            for k, w in enumerate(words):
                a, b = np.searchsorted(vt, w["s"]), np.searchsorted(vt, w["e"])
                if b - a >= 2:
                    st[k] = float(np.median(semis[a:b]))
            out["_semis"] = (vt, semis)
    stretch = np.array([(w["e"] - w["s"]) / max(2, len(re.sub(r"\W", "", w["w"]))) for w in words])

    def z(v):
        v = np.asarray(v, dtype=float)
        ok = np.isfinite(v)
        if ok.sum() < 5:
            return np.zeros_like(v)
        mu, sd = np.nanmean(v[ok]), np.nanstd(v[ok]) or 1.0
        r = (v - mu) / sd
        r[~ok] = 0
        return r
    score = z(rms_db) + z(st) + 0.7 * z(stretch)
    content = [k for k, w in enumerate(words) if len(re.sub(r"\W", "", w["w"])) >= 3
               and re.sub(r"[^\w']", "", w["w"].lower()).replace("'", "") not in STOPWORDS]
    content.sort(key=lambda k: -score[k])
    top = sorted(content[:max(5, min(20, len(words) // 25))], key=lambda k: words[k]["s"])
    out["emphasis"] = [{"at": words[k]["s"], "word": words[k]["w"], "score": round(float(score[k]), 2),
                        "context": " ".join(w["w"] for w in words[max(0, k - 4):k + 4]),
                        "pause_after": round(words[k + 1]["s"] - words[k]["e"], 2) if k + 1 < len(words) else None}
                       for k in top]

    # sentence endings
    sentences, cur = [], []
    for k, w in enumerate(words):
        cur.append(k)
        if re.search(r"[.?!…]$", w["w"]) or (k + 1 < len(words) and words[k + 1]["s"] - w["e"] > 0.8):
            sentences.append(cur)
            cur = []
    if cur:
        sentences.append(cur)
    endings = {"falling": 0, "rising": 0, "flat": 0, "unknown": 0}
    lens = []
    if "_semis" in out:
        vt, semis = out["_semis"]
        for sidx in sentences:
            lens.append(len(sidx))
            s0, s1 = words[sidx[0]]["s"], words[sidx[-1]]["e"]
            a, b = np.searchsorted(vt, s0), np.searchsorted(vt, s1)
            if b - a < 8:
                endings["unknown"] += 1
                continue
            body = float(np.median(semis[a:b]))
            tail_a = np.searchsorted(vt, max(s0, s1 - 0.45))
            tail = semis[tail_a:b]
            if len(tail) < 3:
                endings["unknown"] += 1
                continue
            d = float(np.median(tail[-max(3, len(tail) // 2):])) - body
            endings["rising" if d > 1.5 else "falling" if d < -1.5 else "flat"] += 1
        out.pop("_semis")
    else:
        lens = [len(s) for s in sentences]
    out["sentences"] = len(sentences)
    out["words_per_sentence"] = round(float(np.mean(lens)), 1) if lens else None
    out["questions"] = sum(1 for s in sentences if words[s[-1]]["w"].endswith("?"))
    out["endings"] = endings
    out["mean_word_db"] = round(float(np.median(rms_db)), 1)
    return out


def onset_ratio(x, sr, t):
    """Jump in high-band and broadband energy around t (dB)."""
    a = int((t - 0.3) * sr)
    b = int((t + 0.15) * sr)
    if a < 0 or b > len(x):
        return None
    seg = x[a:b]
    n, hop = 512, 160
    if len(seg) < n * 2:
        return None
    frames = np.lib.stride_tricks.sliding_window_view(seg, n)[::hop] * np.hanning(n)
    spec = np.abs(np.fft.rfft(frames, axis=1)) ** 2
    freqs = np.fft.rfftfreq(n, 1 / sr)
    hfb = spec[:, freqs >= 2500].sum(axis=1) + 1e-10
    bb = spec.sum(axis=1) + 1e-10
    ft = (np.arange(len(frames)) * hop + n / 2) / sr - 0.3  # frame centre relative to t
    pre = (ft >= -0.28) & (ft <= -0.08)
    post = (ft >= -0.06) & (ft <= 0.1)
    if pre.sum() < 2 or post.sum() < 2:
        return None
    return (10 * math.log10(hfb[post].max() / np.median(hfb[pre])),
            10 * math.log10(bb[post].max() / np.median(bb[pre])))


def sound_metrics(x, sr, dur, words, cut_times, step_times):
    out = {}
    db, hop = frame_db(x, sr)
    if not len(db):
        return out
    t_axis = (np.arange(len(db)) + 0.5) * hop
    speech = np.zeros(len(db), dtype=bool)
    for w in words or []:
        speech[int(max(0, w["s"] - 0.08) / hop): int((w["e"] + 0.08) / hop) + 1] = True
    out["overall_db"] = round(float(np.percentile(db, 50)), 1)

    def spectral_flatness(mask):
        idx = np.flatnonzero(mask)
        if len(idx) < 4:
            return None
        idx = idx[np.linspace(0, len(idx) - 1, min(200, len(idx))).astype(int)]
        vals = []
        n = 1024
        for k in idx:
            a = int(t_axis[k] * sr) - n // 2
            seg = x[max(0, a): max(0, a) + n]
            if len(seg) < n:
                continue
            p = np.abs(np.fft.rfft(seg * np.hanning(n))) ** 2 + 1e-12
            p = p[3:]
            vals.append(float(np.exp(np.mean(np.log(p))) / np.mean(p)))
        return round(float(np.median(vals)), 3) if vals else None

    def verdict(level, gap_to_voice, flat):
        if level is None:
            return "unknown"
        if level < -55 or (gap_to_voice is not None and gap_to_voice > 32):
            return "near-silence (no continuous bed)"
        if flat is not None and flat < 0.12:
            return "music-like bed (tonal)"
        if flat is not None and flat > 0.35:
            return "noise-like (room tone, hiss, ambience or noisy music)"
        return "some bed (mixed: music, ambience or room tone)"

    if words:
        first, last = words[0]["s"], words[-1]["e"]
        inside = (t_axis >= first) & (t_axis <= last)
        gap_mask = inside & ~speech
        voice_db = float(np.median(db[speech])) if speech.any() else None
        gap_db = float(np.median(db[gap_mask])) if gap_mask.sum() >= 4 else None
        flat = spectral_flatness(gap_mask)
        diff = (voice_db - gap_db) if voice_db is not None and gap_db is not None else None
        out["voice_db"] = round(voice_db, 1) if voice_db is not None else None
        out["between_words_db"] = round(gap_db, 1) if gap_db is not None else None
        out["bed_under_voice_db"] = round(diff, 1) if diff is not None else None
        out["bed_flatness"] = flat
        out["bed_verdict"] = verdict(gap_db, diff, flat)
        if gap_mask.any():
            out["bed_present_share_of_pauses"] = round(float((db[gap_mask] > -50).mean()), 2)
        intro, outro = t_axis < first - 0.1, t_axis > last + 0.2
        for name, m in (("intro", intro), ("outro", outro)):
            secs = float(m.sum() * hop)
            if secs >= 0.5:
                lvl = float(np.median(db[m]))
                out[name] = {"seconds": round(secs, 1), "db": round(lvl, 1),
                             "verdict": verdict(lvl, None, spectral_flatness(m))}
        nonspeech = ~speech
    else:
        lvl = float(np.median(db))
        out["no_speech"] = True
        out["bed_verdict"] = verdict(lvl, None, spectral_flatness(np.ones(len(db), dtype=bool)))
        nonspeech = np.ones(len(db), dtype=bool)

    # rough tempo on stretches without speech
    if nonspeech.sum() * hop >= 6:
        out["tempo_bpm_rough"] = rough_tempo(x, sr, nonspeech, hop)

    # silences
    quiet = db < -50
    sil, start = [], None
    for k, q in enumerate(np.append(quiet, False)):
        if q and start is None:
            start = k
        elif not q and start is not None:
            if (k - start) * hop >= 0.4:
                sil.append({"start": round(start * hop, 2), "len": round((k - start) * hop, 2)})
            start = None
    out["silences"] = sil[:30]
    out["silence_count"] = len(sil)

    # transients on cuts vs random moments (a control for speech onsets)
    def rate(times):
        hits, vals = 0, []
        for t in times:
            r = onset_ratio(x, sr, t)
            if r is None:
                continue
            vals.append(r)
            hits += r[0] >= 10 or r[1] >= 8
        return (hits / len(vals) if vals else None), len(vals)
    rnd = random.Random(7)
    avoid = sorted(cut_times + step_times)
    ctrl = []
    tries = 0
    while len(ctrl) < 150 and tries < 3000 and dur > 2:
        tries += 1
        t = rnd.uniform(0.5, dur - 0.5)
        if all(abs(t - a) > 0.4 for a in avoid):
            ctrl.append(t)
    cut_rate, n_cut = rate(cut_times)
    step_rate, n_step = rate(step_times)
    base_rate, _ = rate(ctrl)
    out["transients"] = {"on_cuts": cut_rate, "cuts_checked": n_cut, "on_steps": step_rate,
                         "steps_checked": n_step, "baseline": base_rate}
    likely = (cut_rate is not None and base_rate is not None and n_cut >= 3
              and cut_rate >= 0.4 and cut_rate - base_rate >= 0.25)
    out["sfx_on_cuts_likely"] = bool(likely)
    out["hook_db_vs_rest"] = None
    h = t_axis < 3.0
    if h.any() and (~h).any():
        out["hook_db_vs_rest"] = round(float(np.median(db[h]) - np.median(db[~h])), 1)
    return out


def rough_tempo(x, sr, mask, hop):
    hop2 = int(sr * 0.01)
    n = len(x) // hop2
    if n < 400:
        return None
    fr = x[: n * hop2].reshape(n, hop2)
    e = np.log((fr ** 2).mean(axis=1) + 1e-10)
    flux = np.maximum(0, np.diff(e, prepend=e[0]))
    m = np.repeat(mask, int(round(hop / 0.01)))[:n]
    if len(m) < n:
        m = np.pad(m, (0, n - len(m)))
    flux = flux * m
    flux -= flux.mean()
    ac = np.correlate(flux, flux, mode="full")[n - 1:]
    lo, hi = int(60 / 180 / 0.01), int(60 / 60 / 0.01)
    if hi >= len(ac) or ac[0] <= 0:
        return None
    lag = lo + int(np.argmax(ac[lo:hi]))
    conf = float(ac[lag] / ac[0])
    if conf < 0.1:
        return None
    return {"bpm": round(60 / (lag * 0.01)), "confidence": round(conf, 2)}


# --------------------------------------------------------------------------- platform

def platform_name(info: dict, url: str) -> str:
    key = (info.get("extractor_key") or info.get("extractor") or "").lower()
    for k, v in (("youtube", "youtube"), ("tiktok", "tiktok"), ("instagram", "instagram"), ("twitter", "x"),
                 ("facebook", "facebook"), ("vimeo", "vimeo"), ("reddit", "reddit"), ("twitch", "twitch")):
        if k in key:
            return v
    if key:
        return slugify(key, 20)
    return "web"


def audience(info: dict) -> dict:
    g = info.get
    views, likes, comments = g("view_count"), g("like_count"), g("comment_count")
    followers = g("channel_follower_count") or g("uploader_follower_count")
    out = {"views": views, "likes": likes, "comments": comments, "reposts": g("repost_count"),
           "followers": followers, "upload_date": g("upload_date"), "title": g("title"),
           "creator": g("channel") or g("uploader") or g("creator"), "url": g("webpage_url") or g("original_url"),
           "tags": (g("tags") or [])[:25], "categories": g("categories") or [],
           "description": (g("description") or "")[:1200], "chapters": g("chapters") or [],
           "is_short": "/shorts/" in (g("webpage_url") or g("original_url") or "")}
    if views:
        if likes is not None:
            out["likes_per_1k_views"] = round(likes / views * 1000, 1)
        if comments is not None:
            out["comments_per_1k_views"] = round(comments / views * 1000, 2)
        if followers:
            out["views_per_follower"] = round(views / followers, 2)
        ud = g("upload_date")
        if ud and re.fullmatch(r"\d{8}", ud):
            days = max(1, (dt.date.today() - dt.datetime.strptime(ud, "%Y%m%d").date()).days)
            out["days_since_upload"] = days
            out["views_per_day"] = round(views / days)
    return out


def replay_peaks(heatmap, dur, k=6):
    if not heatmap:
        return []
    pts = [(float(h.get("start_time", 0)), float(h.get("end_time", 0)), float(h.get("value", 0))) for h in heatmap]
    pts = [p for p in pts if p[0] < dur]
    vals = [p[2] for p in pts]
    if not vals:
        return []
    mean = float(np.mean(vals))
    peaks = []
    for i, (s, e, v) in enumerate(pts):
        left = pts[i - 1][2] if i else -1
        right = pts[i + 1][2] if i + 1 < len(pts) else -1
        if v >= left and v >= right and s >= min(5.0, dur * 0.05) and v > mean:
            peaks.append({"start": round(s, 1), "end": round(e, 1), "value": round(v, 3),
                          "vs_mean": round(v / mean, 2) if mean else None})
    peaks.sort(key=lambda p: -p["value"])
    chosen = []
    for p in peaks:
        if all(abs(p["start"] - c["start"]) > max(5, dur * 0.04) for c in chosen):
            chosen.append(p)
        if len(chosen) >= k:
            break
    return sorted(chosen, key=lambda p: p["start"])


# --------------------------------------------------------------------------- facts.md

def words_between(words, a, b):
    return [w for w in words if a <= (w["s"] + w["e"]) / 2 < b]


def say(words, a, b, limit=40):
    ws = words_between(words, a, b)
    txt = " ".join(w["w"] for w in ws[:limit])
    if len(ws) > limit:
        txt += " …"
    return txt.replace("|", "/")


def sections(dur):
    if dur <= 90:
        step = 15
    elif dur <= 300:
        step = 30
    else:
        step = max(60, int(math.ceil(dur / 10 / 30) * 30))
    out, t = [], 0.0
    while t < dur - 0.5:
        out.append((t, min(dur, t + step)))
        t += step
    return out


def write_facts(path: Path, ctx: dict) -> None:
    L = []
    a = L.append
    src, aud, pr, vis, shots = ctx["source"], ctx["aud"], ctx["probe"], ctx["vis"], ctx["shots"]
    words, voice, snd, depth = ctx["words"], ctx["voice"], ctx["sound"], ctx["depth"]
    dur = ctx["dur"]
    cuts, unc, steps = vis.get("cuts", []), vis.get("uncertain", []), vis.get("steps", [])
    diss = [s for s in steps if s.get("why") == "dissolve or fade"]
    mins = max(dur / 60, 1e-6)

    a(f"# Facts: {aud.get('title') or src['name']}\n")
    a(f"Measured by dissect.py {VERSION} at depth `{depth}` on {dt.date.today().isoformat()}. "
      "Times are m:ss.s from the start. Heuristic values are marked *(rough)*: trust the frames over them.\n")

    a("## Source\n")
    a("| | |\n|---|---|")
    rows = [("Title", aud.get("title") or src["name"]), ("Link", aud.get("url") or src["input"]),
            ("Platform", ctx["platform"] + (" (Short)" if aud.get("is_short") else "")),
            ("Creator", aud.get("creator")), ("Followers", fmt_n(aud.get("followers"))),
            ("Uploaded", aud.get("upload_date")),
            ("Duration", fmt_t(pr["duration"]) + (f" (analysed first {fmt_t(dur)})" if dur < pr["duration"] - 1 else "")),
            ("Frame", f"{pr.get('width')}×{pr.get('height')} ({aspect_label(pr.get('width', 0), pr.get('height', 0))}), "
                      f"{pr.get('fps')} fps"),
            ("Language", f"{ctx['transcript'].get('language')} (p={ctx['transcript'].get('language_prob')})"
             if ctx.get("transcript") and ctx["transcript"].get("language") else "n/a")]
    for k, v in rows:
        if v not in (None, "", "n/a"):
            a(f"| {k} | {str(v).replace('|', '/')} |")
    a("")

    a("## At a glance\n")
    n_hi = len(cuts) + len(unc) + len(diss)
    a("| Measure | Value |\n|---|---|")
    a(f"| Shots (hard cuts + 1) | {len(shots)} |")
    a(f"| Cuts per minute | {len(cuts) / mins:.1f} – {n_hi / mins:.1f} (hard cuts only – including {len(unc)} uncertain and {len(diss)} dissolves) |")
    if shots:
        lens = [s["len"] for s in shots]
        a(f"| Average shot length | {np.mean(lens):.1f}s (median {np.median(lens):.1f}s, shortest {min(lens):.1f}s, longest {max(lens):.1f}s) |")
        a(f"| Average shot length if uncertain changes are cuts | {dur / (n_hi + 1):.1f}s |")
    a(f"| On-screen changes inside shots | {len(steps)} ({len(steps) / mins:.1f}/min: text, graphics, overlays, dissolves) |")
    a(f"| Every visual change (cuts + uncertain + steps) | every {dur / max(1, len(cuts) + len(unc) + len(steps)):.1f}s on average |")
    if voice:
        a(f"| Speaking pace | {voice.get('wpm')} wpm overall, {voice.get('articulation_wpm')} wpm while talking |")
        a(f"| First word | at {fmt_t(voice.get('first_word_at'))} |")
        a(f"| Pauses ≥0.35s | {voice.get('pauses_per_min')}/min, mean {voice.get('mean_pause')}s |")
        if voice.get("pitch"):
            p = voice["pitch"]
            a(f"| Pitch | median {p['median_hz']} Hz, range {p['range_semitones_p10_p90']} semitones (p10–p90), spread {p['std_semitones']} st |")
    lo = ctx.get("loud") or {}
    if lo.get("integrated_lufs") is not None:
        a(f"| Loudness | {lo['integrated_lufs']:.1f} LUFS integrated, true peak {lo.get('true_peak_dbtp')} dBTP, range {lo.get('range_lu')} LU |")
    if snd.get("bed_verdict"):
        bed = snd["bed_verdict"]
        if (snd.get("between_words_db") or 0) < -90:
            bed += ", digital silence between words"
        elif snd.get("bed_under_voice_db") is not None:
            bed += f", {snd['bed_under_voice_db']} dB under the voice"
        a(f"| {'Audio bed (no speech)' if snd.get('no_speech') else 'Bed between words'} *(rough)* | {bed} |")
    if "transients" in snd:
        tr = snd["transients"]
        a(f"| Sound hits on cuts *(rough)* | {fmt_rate(tr.get('on_cuts'))} of cuts vs {fmt_rate(tr.get('baseline'))} at random moments → "
          f"{'sound effects on cuts likely' if snd.get('sfx_on_cuts_likely') else 'no clear SFX-on-cut pattern'} |")
    if aud.get("views"):
        a(f"| Views | {fmt_n(aud['views'])}" + (f" ({fmt_n(aud.get('views_per_day'))}/day over {aud.get('days_since_upload')} days)" if aud.get("views_per_day") else "") + " |")
        if aud.get("views_per_follower") is not None:
            a(f"| Views per follower | {aud['views_per_follower']} |")
        if aud.get("likes_per_1k_views") is not None:
            a(f"| Likes per 1,000 views | {aud['likes_per_1k_views']} |")
        if aud.get("comments_per_1k_views") is not None:
            a(f"| Comments per 1,000 views | {aud['comments_per_1k_views']} |")
    look = ctx.get("look") or {}
    if look:
        a(f"| Look | brightness {look['brightness']:.2f}, saturation {look['saturation']:.2f} (0–1), {look['temperature']} |")
    a("")

    # pace across the video
    a("## Pace across the video\n")
    a("| Section | Hard cuts | Uncertain | Steps | Cuts/min (range) | WPM | Said at the start of the section |")
    a("|---|---|---|---|---|---|---|")
    for s0, s1 in sections(dur):
        c = sum(1 for e in cuts if s0 <= e["t"] < s1)
        u = sum(1 for e in unc if s0 <= e["t"] < s1)
        st = sum(1 for e in steps if s0 <= e["t"] < s1)
        m = (s1 - s0) / 60
        ws = words_between(words, s0, s1)
        sp = 0
        if ws:
            sp = len(ws) / max(1e-3, min(s1, ws[-1]["e"]) - max(s0, ws[0]["s"])) * 60 if len(ws) > 2 else 0
        a(f"| {fmt_t(s0, 0)}–{fmt_t(s1, 0)} | {c} | {u} | {st} | {c / m:.0f}–{(c + u) / m:.0f} | "
          f"{sp:.0f} | {say(words, s0, s1, 12)} |")
    a("")

    # hook
    hs = ctx["hook_s"]
    a(f"## Hook (first {hs:.0f}s)\n")
    a(f"Sheet: `hook.jpg`, {ctx['hook_fps']} frames a second, tiles labelled with their time.\n")
    hc = [e for e in cuts if e["t"] < hs]
    hu = [e for e in unc if e["t"] < hs]
    hst = [e for e in steps if e["t"] < hs]
    a(f"- Hard cuts in the hook: {len(hc)}" + (f" at {', '.join(fmt_t(e['t']) for e in hc)}" if hc else ""))
    a(f"- Uncertain changes: {len(hu)}" + (f" at {', '.join(fmt_t(e['t']) for e in hu)}" if hu else ""))
    a(f"- On-screen changes inside shots: {len(hst)}" + (f" at {', '.join(fmt_t(e['t']) for e in hst)}" if hst else ""))
    first_change = min([e["t"] for e in cuts + unc + steps] or [None]) if (cuts or unc or steps) else None
    a(f"- First visual change of any kind: {fmt_t(first_change) if first_change is not None else 'none'}")
    if snd.get("hook_db_vs_rest") is not None:
        a(f"- Audio level in the first 3s vs the rest: {snd['hook_db_vs_rest']:+.1f} dB")
    hw = [w for w in words if w["s"] < max(hs, 8.0)]
    if hw:
        a(f"- Words in the first {max(hs, 8.0):.0f}s ({len(hw)} words, {len([w for w in hw if w['s'] < 3])} in the first 3s):\n")
        a("| Time | Word | Gap before |\n|---|---|---|")
        prev = None
        for w in hw:
            gap = w["s"] - prev if prev is not None else w["s"]
            a(f"| {fmt_t(w['s'], 2)} | {w['w'].replace('|', '/')} | {gap:.2f}s{' ← pause' if gap >= 0.35 and prev is not None else ''} |")
            prev = w["e"]
    elif ctx.get("transcript") is not None:
        a("- No speech in the hook.")
    a("")

    # shot list
    a("## Shot list\n")
    a("`S7` tiles show the middle of shot 7, `S7+` the moment just after a change inside it, `S7?` an uncertain change "
      "(real cut, or shake, smoke, flash, fast motion). Sheets: " + ", ".join(f"`{s}`" for s in ctx["shot_sheets"]) + ".\n")
    a("| Shot | Start–end | Length | Changes inside | Said during the shot |\n|---|---|---|---|---|")
    for s in shots:
        inside = [e for e in steps + unc if s["start"] <= e["t"] < s["end"]]
        ch = ", ".join(("+" if e["kind"] == "step" else "?") + fmt_t(e["t"]) + (" (dissolve)" if e.get("why") == "dissolve or fade" else "")
                       for e in sorted(inside, key=lambda e: e["t"])[:8])
        if len(inside) > 8:
            ch += f" …(+{len(inside) - 8})"
        a(f"| S{s['n']} | {fmt_t(s['start'])}–{fmt_t(s['end'])} | {s['len']:.1f}s | {ch} | {say(words, s['start'], s['end'])} |")
    a("")
    if unc:
        a("### Uncertain changes\n")
        a("Possible cuts the detector could not confirm. Glance at the matching `?` tiles to decide.\n")
        a(", ".join(f"{fmt_t(e['t'])} ({e.get('why')})" for e in unc[:60]) + (" …" if len(unc) > 60 else ""))
        a("")

    # voice
    a("## Voice\n")
    if not voice:
        a("No transcript" + (f": {ctx['transcript'].get('error')}" if ctx.get("transcript") and ctx["transcript"].get("error") else
                             " (no speech found, or faster-whisper unavailable).") + "\n")
    else:
        a(f"- {voice['words']} words, {voice.get('sentences')} sentences, {voice.get('words_per_sentence')} words per sentence, "
          f"{voice.get('questions')} questions.")
        a(f"- Pace {voice['wpm']} wpm across the talking span, {voice['articulation_wpm']} wpm while actually talking; speech "
          f"fills {pct(voice.get('speech_share', 0))} of the running time.")
        en = voice.get("endings") or {}
        known = sum(en.get(k, 0) for k in ("falling", "rising", "flat"))
        if known:
            a(f"- Sentence endings (pitch over the last ~0.4s) *(rough)*: {en['falling']} falling, {en['rising']} rising, "
              f"{en['flat']} flat ({en.get('unknown', 0)} unclear).")
        if voice.get("pitch"):
            p = voice["pitch"]
            a(f"- Pitch: median {p['median_hz']} Hz (p10 {p['p10_hz']}, p90 {p['p90_hz']}); "
              f"{p['range_semitones_p10_p90']} semitones between p10 and p90.")
        if voice.get("longest_pauses"):
            a("\n### Longest pauses (and what comes after them)\n")
            a("| At | Pause | Before | After |\n|---|---|---|---|")
            for p in voice["longest_pauses"]:
                a(f"| {fmt_t(p['at'])} | {p['len']:.2f}s | …{p['before']} | {p['after']}… |")
        if voice.get("emphasis"):
            a("\n### Emphasised words *(rough: louder, higher or stretched vs the speaker's norm)*\n")
            a("| At | Word | Score | Pause after | Context |\n|---|---|---|---|---|")
            for e in voice["emphasis"]:
                pa = f"{e['pause_after']:.2f}s" if e.get("pause_after") is not None else ""
                a(f"| {fmt_t(e['at'])} | **{e['word']}** | {e['score']} | {pa} | {e['context']} |")
    a("")

    # sound
    a("## Sound\n")
    if not pr.get("has_audio"):
        a("No audio track.\n")
    else:
        if lo:
            a(f"- Loudness: {lo.get('integrated_lufs')} LUFS integrated, true peak {lo.get('true_peak_dbtp')} dBTP, "
              f"loudness range {lo.get('range_lu')} LU.")
        if snd.get("voice_db") is not None:
            a(f"- Voice level {snd['voice_db']} dBFS (median per 50ms); between words {snd.get('between_words_db')} dBFS "
              f"→ bed sits {snd.get('bed_under_voice_db')} dB under the voice. Spectral flatness in the gaps "
              f"{snd.get('bed_flatness')} (low = tonal/music, high = noise). Verdict *(rough)*: {snd.get('bed_verdict')}.")
            if snd.get("bed_present_share_of_pauses") is not None:
                a(f"- Something audible (> -50 dBFS) in {pct(snd['bed_present_share_of_pauses'])} of the gaps between words.")
        elif snd.get("no_speech"):
            a(f"- No speech found. Whole track: {snd.get('bed_verdict')}.")
        for name in ("intro", "outro"):
            if snd.get(name):
                v = snd[name]
                a(f"- {name.title()} without speech: {v['seconds']}s at {v['db']} dBFS, {v['verdict']}.")
        if snd.get("tempo_bpm_rough"):
            tb = snd["tempo_bpm_rough"]
            a(f"- Rough tempo where nobody speaks: ~{tb['bpm']} BPM (confidence {tb['confidence']}; could be half or double).")
        tr = snd.get("transients") or {}
        if tr:
            a(f"- Sound hits *(rough)*: a sharp energy jump at {fmt_rate(tr.get('on_cuts'))} of {tr.get('cuts_checked')} cuts, "
              f"{fmt_rate(tr.get('on_steps'))} of {tr.get('steps_checked')} on-screen changes, vs {fmt_rate(tr.get('baseline'))} "
              f"at random moments. {'Likely whooshes, hits or pops on cuts.' if snd.get('sfx_on_cuts_likely') else 'No clear pattern of effects on cuts.'}")
        if snd.get("silences"):
            a(f"- Near-silences (< -50 dBFS, ≥0.4s): {snd.get('silence_count')}: " +
              ", ".join(f"{fmt_t(s['start'])} ({s['len']}s)" for s in snd["silences"][:15]))
    a("")

    # look
    if look:
        a("## Look\n")
        a(f"- Brightness {look['brightness']:.2f}, saturation {look['saturation']:.2f}, {look['temperature']}.")
        a("- Dominant colours across the shot tiles: " + ", ".join(f"`{c['hex']}` {pct(c['share'])}" for c in look["palette"]))
        a("- Brightness by section: " + ", ".join(f"{fmt_t(s0, 0)} {b:.2f}" for (s0, _), b in look["by_section"]))
        a("")

    # audience
    a("## Audience signals\n")
    if not aud.get("views") and not ctx["peaks"] and not ctx["comments"]:
        a("None available (local file, or the platform didn't share them).\n")
    else:
        stats = [("Views", aud.get("views")), ("Likes", aud.get("likes")), ("Comments", aud.get("comments")),
                 ("Reposts", aud.get("reposts")), ("Followers", aud.get("followers"))]
        a("- " + ", ".join(f"{k} {fmt_n(v)}" for k, v in stats if v is not None))
        if aud.get("chapters"):
            a("- Chapters: " + "; ".join(f"{fmt_t(c.get('start_time', 0), 0)} {c.get('title')}" for c in aud["chapters"][:30]))
        if aud.get("tags"):
            a("- Tags: " + ", ".join(aud["tags"]))
        if ctx["peaks"]:
            a("\n### Most-replayed moments (YouTube heatmap)\n")
            a("Sheet: `most-replayed.jpg`.\n")
            a("| Moment | Strength | vs average | Shot | Said |\n|---|---|---|---|---|")
            for p in ctx["peaks"]:
                a(f"| {fmt_t(p['start'])}–{fmt_t(p['end'])} | {p['value']} | ×{p['vs_mean']} | S{shot_at(shots, p['start'])} | "
                  f"{say(words, p['start'] - 1, p['end'] + 1, 25)} |")
        if ctx["comments"]:
            a("\n### Top comments\n")
            for c in ctx["comments"][:12]:
                tag = " (pinned)" if c["pinned"] else ""
                tag += " (creator)" if c["author_is_uploader"] else ""
                txt = re.sub(r"\s+", " ", c["text"])[:240]
                a(f"- [{fmt_n(c['likes'])} likes{tag}] {txt}")
        if aud.get("description"):
            a("\n### Description (start)\n")
            a("> " + re.sub(r"\n+", "\n> ", aud["description"][:800]))
    a("")

    # transcript
    a("## Transcript\n")
    segs = (ctx.get("transcript") or {}).get("segments") or []
    if not segs:
        a("None.\n")
    else:
        total = sum(len(s["text"].split()) for s in segs)
        shown = 0
        for s in segs:
            if shown > 6000:
                a(f"\n…transcript continues in `data/transcript.txt` ({total} words in total).")
                break
            a(f"[{fmt_t(s['start'], 0)}] {s['text']}  ")
            shown += len(s["text"].split())
    a("")

    a("## Files\n")
    a("- Sheets: " + ", ".join(f"`{s}`" for s in ctx["all_sheets"]))
    a("- Data: `data/metrics.json` (everything above), `data/shots.csv`, `data/transcript.json` (word timings), "
      "`data/transcript.txt`, `data/transcript.srt`, `data/info.json`" + (", `data/comments.json`" if ctx["comments"] else ""))
    a("")
    a("## Caveats\n")
    a("- Cut detection works on small frames sampled at "
      f"{vis.get('fps')} fps. Fast camera moves, flashes and smoke can look like cuts (listed as uncertain); a cut between "
      "two very similar framings (a subtle jump cut), or between scenes that share a dark background (space, night skies), "
      "can be missed or show up as a step change. On dark-background animation, treat large step changes as possible cuts.")
    a("- Step changes are local changes that stay: usually text, graphics, stickers or a punch-in. Word-by-word captions "
      "produce many of them.")
    a("- The bed, sound-hit and emphasis numbers are heuristics. When the frames or your ears disagree, trust them.")
    path.write_text("\n".join(L), encoding="utf-8")


def fmt_rate(r):
    return "n/a" if r is None else pct(r)


def srt(segments):
    def ts(t):
        h, rem = divmod(t, 3600)
        m, s = divmod(rem, 60)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"
    return "\n".join(f"{k}\n{ts(s['start'])} --> {ts(s['end'])}\n{s['text']}\n" for k, s in enumerate(segments, 1))


# --------------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Measure a video for a format blueprint.")
    ap.add_argument("source", help="link or local file")
    ap.add_argument("--depth", choices=list(DEPTHS), default="standard")
    ap.add_argument("--out", help="output folder (default ./dissections/<date>-<platform>-<title>)")
    ap.add_argument("--max-minutes", type=float, help="only analyse the first N minutes")
    ap.add_argument("--lang", help="speech language code (default: auto-detect)")
    ap.add_argument("--model", help="override the Whisper model (tiny, base, small, medium, large-v3, ...)")
    ap.add_argument("--cookies-from-browser", help="browser to read login cookies from (ask the user first)")
    ap.add_argument("--no-comments", action="store_true", help="skip fetching comments")
    ap.add_argument("--no-transcript", action="store_true", help="skip speech recognition")
    ap.add_argument("--keep-video", action="store_true", help="keep the downloaded video in the folder")
    args = ap.parse_args()

    need("ffmpeg")
    need("ffprobe")
    cfg = dict(DEPTHS[args.depth])
    if args.model:
        cfg["model"] = args.model

    work = Path(tempfile.mkdtemp(prefix="dissect-"))
    notes = []
    try:
        local = Path(os.path.expanduser(args.source))
        if local.exists():
            video, info, thumb = local.resolve(), {}, None
            platform = "local"
            ytbase = yenv = None
            log(f"Using local file {video}")
        elif re.match(r"^[a-z][a-z0-9+.-]*://", args.source, re.I) or re.match(r"^(www\.)?\w[\w.-]+\.\w+/", args.source):
            url = args.source if "://" in args.source else "https://" + args.source
            dl = download(url, work, args)
            video, info, thumb = dl["video"], dl["info"], dl["thumb"]
            platform = platform_name(info, url)
            ytbase, yenv = dl["ytdlp"], dl["env"]
            notes.append(f"downloaded with {dl['method']}")
        else:
            fail("bad_input", f"'{args.source}' is neither an existing file nor a link.",
                 "Pass a video link (https://...) or a path to a local video file.", 1)

        pr = probe(video)
        if not pr["duration"]:
            fail("unreadable_file", "Could not read the duration.", "Try another copy of the video.", 1)
        dur = pr["duration"]
        if args.max_minutes:
            dur = min(dur, args.max_minutes * 60)

        title = info.get("title") or video.stem
        if args.out or os.environ.get("DISSECT_OUT"):
            base = Path(os.path.expanduser(args.out or os.environ["DISSECT_OUT"]))
            out = base if args.out else base / f"{dt.date.today().isoformat()}-{platform}-{slugify(title)}"
        else:
            out = Path.cwd() / "dissections" / f"{dt.date.today().isoformat()}-{platform}-{slugify(title)}"
        if out.exists() and any(out.iterdir()) and not args.out:
            k = 2
            while Path(f"{out}-{k}").exists():
                k += 1
            out = Path(f"{out}-{k}")
        out.mkdir(parents=True, exist_ok=True)
        data = out / "data"
        data.mkdir(exist_ok=True)
        frames_dir = work / "frames"
        log(f"Output folder: {out}")
        log(f"Duration {fmt_t(pr['duration'])}, analysing {fmt_t(dur)}; "
            f"{pr.get('width')}x{pr.get('height')} {pr.get('fps')} fps")

        # comments run while nothing else needs the network
        comments = []
        if platform not in ("local",) and not args.no_comments:
            log("Fetching top comments ...")
            try:
                comments = fetch_comments(info.get("webpage_url") or args.source, work, ytbase, yenv, args, platform)
            except Exception as exc:
                log(f"  comments unavailable: {exc}")

        # ---------------- visuals
        vis = {"cuts": [], "uncertain": [], "steps": [], "fps": cfg["fps"], "lum": [], "sat": []}
        shots = [{"n": 1, "start": 0.0, "end": round(dur, 2), "len": round(dur, 2)}]
        sheets, shot_sheets = [], []
        look = {}
        hook_s = min(cfg["hook_s"], dur)
        fps = cfg["fps"] if dur <= 1200 else min(cfg["fps"], 6)
        size = (0, 0)
        if pr["has_video"]:
            log(f"Finding cuts and on-screen changes ({fps} fps scan) ...")
            vis = analyse_frames(video, dur, fps, pr["width"], pr["height"])
            shots = build_shots(vis["cuts"], dur)
            log(f"  {len(vis['cuts'])} hard cuts, {len(vis['uncertain'])} uncertain, {len(vis['steps'])} step changes")

            log("Rendering contact sheets ...")
            # hook: frame by frame
            hook_times = list(np.arange(0, hook_s, 1 / cfg["hook_fps"]))
            many = len(hook_times) > 24
            hsize = tile_size(pr["width"], pr["height"], many)
            hframes = grab_frames(video, hook_times, hsize, frames_dir, "hook")
            make_sheet([(f, fmt_t(t, 2), f"S{shot_at(shots, t)}") for f, t in zip(hframes, hook_times)],
                       out / "hook.jpg", hsize, f"HOOK  first {hook_s:.1f}s at {cfg['hook_fps']} fps  ·  {title[:70]}")
            sheets.append("hook.jpg")

            # shots
            size = tile_size(pr["width"], pr["height"])
            plan = plan_shot_tiles(shots, vis, cfg["shot_tiles"], dur)
            sframes = grab_frames(video, [p["t"] for p in plan], size, frames_dir, "shot")
            tiles = [(f, p["label"], fmt_t(p["t"])) for f, p in zip(sframes, plan)]
            cols = max(1, 1600 // (size[0] + 4))
            per = cols * max(1, 1100 // (size[1] + 30))
            chunks = [tiles[i:i + per] for i in range(0, len(tiles), per)]
            for k, ch in enumerate(chunks, 1):
                name = f"shots-{k:02d}.jpg"
                make_sheet(ch, out / name, size, f"SHOTS {k}/{len(chunks)}  ·  white S# = shot middle, "
                                                 f"yellow + = change inside shot, red ? = uncertain change")
                shot_sheets.append(name)
            sheets += shot_sheets

            mids = [f for f, p in zip(sframes, plan) if not p["label"].endswith(("+", "?"))]
            lum, sat = np.array(vis["lum"]), np.array(vis["sat"])
            if len(lum):
                tilepal = palette(mids or sframes)
                warm = None
                rgb_means = []
                for f in (mids or sframes)[:60]:
                    if f and Path(f).exists():
                        with Image.open(f) as im:
                            rgb_means.append(np.asarray(im.convert("RGB").resize((32, 32)), dtype=np.float32).mean(axis=(0, 1)))
                if rgb_means:
                    m = np.mean(rgb_means, axis=0)
                    warm = "warm (red > blue)" if m[0] - m[2] > 8 else "cool (blue > red)" if m[2] - m[0] > 8 else "neutral"
                by_sec = []
                for s0, s1 in sections(dur):
                    a_, b_ = int(s0 * fps), max(int(s0 * fps) + 1, int(s1 * fps))
                    by_sec.append(((s0, s1), float(lum[a_:b_].mean()) if len(lum[a_:b_]) else float("nan")))
                look = {"brightness": float(lum.mean()), "saturation": float(sat.mean()),
                        "temperature": warm or "n/a", "palette": tilepal, "by_section": by_sec}

        # ---------------- cover
        cover = None
        if thumb and Path(thumb).exists():
            with Image.open(thumb) as im:
                im = im.convert("RGB")
                im.thumbnail((1280, 1280))
                im.save(out / "cover.jpg", quality=88)
            cover = "cover.jpg"
        elif pr["has_video"]:
            f = grab_frames(video, [0.0], tile_size(pr["width"], pr["height"]), frames_dir, "cover")[0]
            if f:
                shutil.copy(f, out / "cover.jpg")
                cover = "cover.jpg"
                notes.append("cover.jpg is the first frame (no platform thumbnail)")

        # ---------------- audience
        aud = audience(info) if info else {}
        peaks = replay_peaks(info.get("heatmap"), dur) if info else []
        if peaks and pr["has_video"]:
            times, labels = [], []
            for p in peaks:
                for t, tag in ((p["start"], "start"), ((p["start"] + p["end"]) / 2, "peak"), (p["end"], "end")):
                    times.append(min(dur - 0.05, t))
                    labels.append((fmt_t(t), f"S{shot_at(shots, t)} {tag}"))
            pf = grab_frames(video, times, size, frames_dir, "peak")
            make_sheet([(f, lab, sub) for f, (lab, sub) in zip(pf, labels)], out / "most-replayed.jpg", size,
                       "MOST REPLAYED  ·  start / peak / end of each heatmap peak")
            sheets.append("most-replayed.jpg")
        if cover:
            sheets.append(cover)

        # ---------------- audio
        transcript, words, voice, snd, loud = None, [], {}, {}, {}
        if pr["has_audio"]:
            wav = work / "audio16k.wav"
            log("Extracting audio ...")
            if extract_audio(video, dur, wav):
                x, sr = load_wav(wav)
                log("Measuring loudness ...")
                loud = loudness(video, dur)
                if not args.no_transcript:
                    transcript = transcribe(wav, cfg["model"], cfg["beam"], args.lang)
                    if transcript and transcript.get("words"):
                        words = transcript["words"]
                    elif transcript and transcript.get("error"):
                        notes.append("transcript failed: " + transcript["error"][:200])
                log("Profiling the voice and sound ...")
                ptimes = pf0 = None
                if words:
                    ptimes, pf0 = pitch_track(x, sr)
                voice = voice_metrics(words, x, sr, dur, ptimes, pf0) if words else {}
                snd = sound_metrics(x, sr, dur, words, [c["t"] for c in vis["cuts"]], [s["t"] for s in vis["steps"]])
            else:
                notes.append("audio could not be extracted")

        # ---------------- write
        log("Writing facts.md ...")
        ctx = dict(source={"input": args.source, "name": title}, aud=aud, probe=pr, vis=vis, shots=shots,
                   words=words, voice=voice, sound=snd, depth=args.depth, dur=dur, platform=platform,
                   transcript=transcript, loud=loud, hook_s=hook_s, hook_fps=cfg["hook_fps"],
                   shot_sheets=shot_sheets, all_sheets=sheets, peaks=peaks, comments=comments, look=look)
        write_facts(out / "facts.md", ctx)

        with open(data / "shots.csv", "w", newline="", encoding="utf-8") as fh:
            wr = csv.writer(fh)
            wr.writerow(["shot", "start", "end", "length", "said"])
            for s in shots:
                wr.writerow([s["n"], s["start"], s["end"], s["len"], say(words, s["start"], s["end"], 200)])
        if transcript and transcript.get("segments"):
            (data / "transcript.json").write_text(json.dumps(transcript, ensure_ascii=False, indent=1), encoding="utf-8")
            (data / "transcript.txt").write_text(
                "\n".join(f"[{fmt_t(s['start'], 0)}] {s['text']}" for s in transcript["segments"]), encoding="utf-8")
            (data / "transcript.srt").write_text(srt(transcript["segments"]), encoding="utf-8")
        if info:
            slim = {k: v for k, v in info.items() if k not in ("formats", "requested_formats", "thumbnails",
                                                                 "automatic_captions", "subtitles", "comments",
                                                                 "http_headers", "requested_downloads", "fragments")}
            (data / "info.json").write_text(json.dumps(slim, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
        if comments:
            (data / "comments.json").write_text(json.dumps(comments, ensure_ascii=False, indent=1), encoding="utf-8")
        metrics = {"version": VERSION, "depth": args.depth, "probe": pr, "analysed_seconds": round(dur, 2),
                   "cuts": vis["cuts"], "uncertain": vis["uncertain"], "steps": vis["steps"], "shots": shots,
                   "voice": voice, "sound": snd, "loudness": loud, "audience": aud, "replay_peaks": peaks,
                   "look": {k: v for k, v in look.items() if k != "by_section"} if look else {}, "notes": notes}
        (data / "metrics.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=1, default=float),
                                           encoding="utf-8")

        if args.keep_video and platform != "local":
            dest = out / f"source{video.suffix}"
            shutil.move(str(video), dest)
            notes.append(f"video kept at {dest.name}")

        slug = slugify(title)
        summary = {
            "status": "ok",
            "folder": str(out),
            "facts": str(out / "facts.md"),
            "sheets": [str(out / s) for s in sheets],
            "blueprint": str(out / f"{slug}.blueprint.md"),
            "title": title,
            "platform": platform,
            "duration": round(pr["duration"], 2),
            "analysed_seconds": round(dur, 2),
            "shots": len(shots),
            "cuts": len(vis["cuts"]), "uncertain": len(vis["uncertain"]), "steps": len(vis["steps"]),
            "words": len(words),
            "wpm": voice.get("wpm"),
            "language": (transcript or {}).get("language"),
            "notes": notes,
        }
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        log("Done.")
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
