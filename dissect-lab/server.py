#!/usr/bin/env python3
"""Serve the Dissect Lab locally and let it run the dissect skill on a link.

Usage: python3 dissect-lab/server.py [--port 8765]
Then open http://localhost:8765. Only listens on 127.0.0.1.
"""
import argparse
import json
import re
import subprocess
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

LAB = Path(__file__).resolve().parent
SKILL = LAB.parent / ".claude" / "skills" / "dissect" / "scripts" / "dissect.py"
SKELETON = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
            '<style>:root{color-scheme:light}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'
            '</head><body>{page}</body></html>')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(LAB), **kw)

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] in ("/", "/index.html"):
            body = SKELETON.replace("{page}", (LAB / "index.html").read_text(encoding="utf-8")).encode()
            self.send_response(200)
            self.send_header("content-type", "text/html; charset=utf-8")
            self.send_header("content-length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == "/api/status":
            self._json(200, {"local": True, "skill": SKILL.exists()})
        else:
            super().do_GET()

    def do_POST(self):
        if self.path != "/api/dissect":
            return self._json(404, {"status": "not_found"})
        req = json.loads(self.rfile.read(int(self.headers.get("content-length", 0)) or 0) or b"{}")
        source = str(req.get("source", "")).strip()
        depth = req.get("depth", "standard")
        if not source or depth not in ("quick", "standard", "deep"):
            return self._json(400, {"status": "bad_input", "fix": "Give a video link or a file path."})
        slug = re.sub(r"[^a-z0-9]+", "-", source.lower())[-60:].strip("-") or "video"
        cmd = ["uv", "run", str(SKILL), source, "--depth", depth, "--out", str(LAB / "dissections" / f"local-{slug}")]
        print("running:", " ".join(cmd), file=sys.stderr)
        r = subprocess.run(cmd, stdout=subprocess.PIPE, text=True)  # progress streams to this terminal
        try:
            self._json(200, json.loads(r.stdout))
        except json.JSONDecodeError:
            self._json(500, {"status": "failed", "detail": r.stdout[-2000:]})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    port = ap.parse_args().port
    print(f"Dissect Lab: http://localhost:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
