#!/usr/bin/env python3
"""Check everything dissect.py needs and print install commands for this OS.

Usage: python3 doctor.py
It never installs anything itself. Exit code 0 when ready, 1 when something required is missing.
"""
from __future__ import annotations

import importlib.util
import platform
import shutil
import subprocess
import sys
import urllib.request

OS = platform.system()  # Darwin, Linux, Windows


def has_apt():
    return shutil.which("apt-get") is not None


def install_cmd(what: str) -> str:
    if what == "ffmpeg":
        if OS == "Darwin":
            return "brew install ffmpeg"
        if OS == "Windows":
            return "winget install --id Gyan.FFmpeg -e"
        if has_apt():
            return "sudo apt-get install -y ffmpeg"
        if shutil.which("dnf"):
            return "sudo dnf install -y ffmpeg"
        if shutil.which("pacman"):
            return "sudo pacman -S ffmpeg"
        return "install ffmpeg from https://ffmpeg.org/download.html"
    if what == "uv":
        if OS == "Windows":
            return 'powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"'
        if OS == "Darwin" and shutil.which("brew"):
            return "brew install uv   (or: curl -LsSf https://astral.sh/uv/install.sh | sh)"
        return "curl -LsSf https://astral.sh/uv/install.sh | sh"
    if what == "python-packages":
        return f"{sys.executable} -m pip install numpy pillow faster-whisper praat-parselmouth 'yt-dlp[default,curl-cffi]'"
    return ""


def version(cmd):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        return (r.stdout or r.stderr).splitlines()[0].strip() if r.returncode == 0 else None
    except Exception:
        return None


def reachable(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "dissect-doctor"})
        urllib.request.urlopen(req, timeout=8)
        return True
    except urllib.error.HTTPError:
        return True  # the server answered
    except Exception:
        return False


def main():
    rows, missing_required = [], []

    def row(name, ok, detail, fix="", required=True):
        rows.append((("ok " if ok else ("MISS" if required else "warn")), name, detail, "" if ok else fix))
        if not ok and required:
            missing_required.append(name)

    row("python", sys.version_info >= (3, 9), platform.python_version(), "Python 3.9+ is needed (uv brings its own).")
    for tool in ("ffmpeg", "ffprobe"):
        v = version([tool, "-version"])
        row(tool, bool(v), v or "not found", install_cmd("ffmpeg"))
    uv = shutil.which("uv")
    row("uv", bool(uv), version(["uv", "--version"]) or "not found",
        install_cmd("uv") + "   (or install the Python packages below instead)", required=False)

    pkgs = {"numpy": "numpy", "PIL": "pillow", "faster_whisper": "faster-whisper",
            "parselmouth": "praat-parselmouth", "yt_dlp": "yt-dlp", "curl_cffi": "curl-cffi"}
    missing_pkgs = [pip for mod, pip in pkgs.items() if importlib.util.find_spec(mod) is None]
    if uv:
        row("python packages", True, "uv installs them on first run" +
            (f" (not in this Python: {', '.join(missing_pkgs)})" if missing_pkgs else ""))
    else:
        row("python packages", not missing_pkgs,
            "all present" if not missing_pkgs else "missing: " + ", ".join(missing_pkgs),
            install_cmd("python-packages"))

    ytdlp = shutil.which("yt-dlp")
    row("yt-dlp", True, version(["yt-dlp", "--version"]) if ytdlp else "fetched on demand by dissect.py", required=False)

    free = shutil.disk_usage(".").free / 1e9
    row("disk space", free > 3, f"{free:.1f} GB free here",
        "Whisper models take up to 1.5 GB and downloads need room; free some space.", required=False)

    for name, url in (("internet: youtube.com", "https://www.youtube.com"),
                      ("internet: huggingface.co (speech models)", "https://huggingface.co"),
                      ("internet: pypi.org (packages)", "https://pypi.org/simple/")):
        ok = reachable(url)
        row(name, ok, "reachable" if ok else "unreachable",
            "Check the connection, proxy or firewall.", required=False)

    w = max(len(r[1]) for r in rows)
    print(f"dissect doctor  ·  {OS} {platform.machine()}  ·  Python {platform.python_version()}\n")
    for status, name, detail, fix in rows:
        print(f"[{status}] {name.ljust(w)}  {detail}")
        if fix:
            print(f"       {' ' * w}  → {fix}")
    print()
    if missing_required:
        print("Not ready. Missing: " + ", ".join(missing_required) + ". Ask the user before installing anything.")
        sys.exit(1)
    print("Ready. Run:  uv run scripts/dissect.py \"<link or file>\"" if uv else
          "Ready. Run:  python3 scripts/dissect.py \"<link or file>\"")


if __name__ == "__main__":
    main()
