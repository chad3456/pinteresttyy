// Render one still per shot (at fraction F of each shot) for review. Usage: node tools/stills.mjs <preset> <outDir> [F]
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const engine = readFileSync(join(here, "..", "engine.js"), "utf8") + "\n" + readFileSync(join(here, "..", "fermi.js"), "utf8");
const fontCss = [["Nunito", 700], ["Nunito", 800], ["Nunito", 900], ["Baloo 2", 800]].map(([fam, w]) =>
  `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${readFileSync(join(here, "..", "fonts", `${fam.toLowerCase().replace(" ", "-")}-latin-${w}-normal.woff2`)).toString("base64")}) format('woff2')}`).join("");
const [id, out, F = "0.6"] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.setContent(`<style>${fontCss}</style><canvas id="c" width="1280" height="720"></canvas><script>${engine}</script>`);
await p.evaluate(async () => { for (const f of ["800 20px Nunito", "900 20px Nunito", "800 20px 'Baloo 2'"]) await document.fonts.load(f); });
const n = await p.evaluate((id) => (window.tl = DissectEngine.buildTimeline(id)).shots.length, id);
for (let i = 0; i < n; i++) {
  const b64 = await p.evaluate(([i, F]) => { const s = tl.shots[i], c = document.getElementById("c"); DissectEngine.renderAt(c.getContext("2d"), tl, s.start + (s.end - s.start) * F); return c.toDataURL("image/jpeg", 0.88).split(",")[1]; }, [i, +F]);
  writeFileSync(join(out, `s${String(i + 1).padStart(2, "0")}.jpg`), Buffer.from(b64, "base64"));
}
await b.close(); console.log(n, "stills");
