// Render Dissect Lab recreations to MP4 with headless Chromium.
// Usage: node tools/render.mjs <outDir> [presetId ...]
// Writes <outDir>/<preset>.silent.mp4 and <preset>.timeline.json (audio is added by tools/audio.py).
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const engine = readFileSync(join(here, "..", "engine.js"), "utf8");
const outDir = process.argv[2] || "recreations";
const FPS = 24;
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(`<canvas id="c" width="1280" height="720"></canvas><script>${engine}</script>`);
const ids = process.argv.slice(3).length ? process.argv.slice(3) : await page.evaluate(() => Object.keys(DissectEngine.PRESETS));

for (const id of ids) {
  const tl = await page.evaluate((id) => {
    window.tl = DissectEngine.buildTimeline(id);
    window.ctx = document.getElementById("c").getContext("2d");
    return { ...window.tl, cuts: DissectEngine.cutTimes(window.tl) };
  }, id);
  writeFileSync(join(outDir, `${id}.timeline.json`), JSON.stringify(tl, null, 1));
  const frames = Math.ceil(tl.duration * FPS);
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "medium", join(outDir, `${id}.silent.mp4`)], { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < frames; f++) {
    const b64 = await page.evaluate((f) => {
      DissectEngine.renderAt(window.ctx, window.tl, f / 24, f);
      return document.getElementById("c").toDataURL("image/jpeg", 0.9).split(",")[1];
    }, f);
    if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`${id}: ${tl.duration.toFixed(1)} s, ${tl.shots.length} shots, ${frames} frames`);
}
await browser.close();
