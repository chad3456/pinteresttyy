/* Dissect Lab maker: measure any reference video in the browser, turn it into a style, and render a new
 * original motion-graphics video in that style on any topic. Load after engine.js.
 *   Maker.analyze(blob, onProgress)          -> measurements (pace, cuts, palette, look, frames, audio)
 *   Maker.styleFromMeasurements(m)           -> editable style
 *   Maker.register(style, script)            -> registers DissectEngine.PRESETS.custom
 *   Maker.Player(canvas, ui)                 -> play / record the registered preset
 * All drawings are original; nothing from the reference is copied into the output.
 */
(function () {
  const E = window.DissectEngine;
  const W = 1280, H = 720;

  // ------------------------------------------------------------------ helpers
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(k));
  const pop = (k) => { k = clamp(k); return k < 1 ? 1 - Math.pow(1 - k, 3) * Math.cos(k * 7) : 1; };
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
  function hexToRgb(h) { h = String(h || "#000").replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); const n = parseInt(h.slice(0, 6), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const rgbToHex = (r, g, b) => "#" + [r, g, b].map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, "0")).join("");
  function hsv(hex) { const [r, g, b] = hexToRgb(hex).map((x) => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return { s: mx ? (mx - mn) / mx : 0, v: mx, l: 0.299 * r + 0.587 * g + 0.114 * b }; }
  function mix(a, b, k) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)); }
  function alpha(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
  function glow(ctx, x, y, r, color, a = 1) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }
  function rr(ctx, x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
  function wrap(ctx, text, maxW) { const words = String(text).split(/\s+/), out = []; let cur = ""; for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }

  // ------------------------------------------------------------------ 1. measure (browser port of the skill's detector)
  const GRID = 8;
  const seek = (v, t) => new Promise((res) => { const h = () => { v.removeEventListener("seeked", h); res(); }; v.addEventListener("seeked", h); v.currentTime = t; });
  async function analyze(blob, onProgress = () => {}) {
    const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = URL.createObjectURL(blob);
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error("This browser can't decode that file. Try an MP4 (H.264) or WebM.")); });
    const dur = Math.min(v.duration, 180), fps = dur > 90 ? 4 : 6, n = Math.max(2, Math.floor(dur * fps));
    const land = v.videoWidth >= v.videoHeight, w = land ? 96 : Math.round(96 * v.videoWidth / v.videoHeight), h = land ? Math.round(96 * v.videoHeight / v.videoWidth) : 96;
    const c = document.createElement("canvas"); c.width = w; c.height = h; const cx = c.getContext("2d", { willReadFrequently: true });
    const dp = [], dh = [], bf = [], bmax = [], th = [], lum = [], sat = [], pix = [];
    let prevG = null, prevH = null;
    for (let i = 0; i < n; i++) {
      await seek(v, i / fps); cx.drawImage(v, 0, 0, w, h);
      const d = cx.getImageData(0, 0, w, h).data, g = new Float32Array(w * h), hist = new Float32Array(64);
      let L = 0, S = 0;
      for (let p = 0, q = 0; p < d.length; p += 4, q++) {
        const r = d[p], gg = d[p + 1], b = d[p + 2]; g[q] = (0.299 * r + 0.587 * gg + 0.114 * b) / 255; L += g[q];
        const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); S += mx ? (mx - mn) / mx : 0;
        hist[(r >> 6) * 16 + (gg >> 6) * 4 + (b >> 6)]++;
        if (q % 37 === 0) pix.push([r, gg, b]);
      }
      hist.forEach((x, k) => (hist[k] = x / (w * h))); lum.push(L / (w * h)); sat.push(S / (w * h));
      const blocks = new Float32Array(GRID * GRID), bd = new Float32Array(GRID * GRID), cnt = new Float32Array(GRID * GRID);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = Math.min(GRID - 1, Math.floor(y / h * GRID)) * GRID + Math.min(GRID - 1, Math.floor(x / w * GRID)), q = y * w + x; blocks[k] += g[q]; if (prevG) bd[k] += Math.abs(g[q] - prevG[q]); cnt[k]++; }
      blocks.forEach((x, k) => { blocks[k] = x / cnt[k]; bd[k] = bd[k] / cnt[k]; });
      th.push(blocks);
      if (prevG) { let s = 0; for (let q = 0; q < g.length; q++) s += Math.abs(g[q] - prevG[q]); dp.push(s / g.length); let hd = 0; for (let k = 0; k < 64; k++) hd += Math.abs(hist[k] - prevH[k]); dh.push(hd / 2); bf.push(bd.filter((x) => x > 0.1).length / bd.length); bmax.push(Math.max(...bd)); }
      else { dp.push(0); dh.push(0); bf.push(0); bmax.push(0); }
      prevG = g; prevH = hist;
      if (i % 6 === 0) onProgress(`Scanning frames: ${Math.round(i / fps)} of ${Math.round(dur)} s`, (i / n) * 0.8);
    }
    const half = Math.max(3, Math.round(fps * 0.75)), cuts = [], unc = [], steps = [];
    const loc = (arr, i) => median([...arr.slice(Math.max(0, i - half), i), ...arr.slice(i + 1, i + half + 1)]);
    const td = (a, b) => { a = Math.max(0, Math.min(n - 1, a)); b = Math.max(0, Math.min(n - 1, b)); let s = 0; for (let k = 0; k < 64; k++) s += Math.abs(th[a][k] - th[b][k]); return s / 64; };
    for (let i = 1; i < n; i++) {
      const mdp = loc(dp, i), mdh = loc(dh, i), mbf = loc(bf, i), mbm = loc(bmax, i), t = (i - 0.5) / fps;
      const spike = dp[i] >= 2.5 * mdp + 0.03 || dh[i] >= 2.5 * mdh + 0.1, motion = mdp >= 0.06 || mbf >= 0.45;
      const returns = td(i - 1, i + 2) < 0.35 * Math.max(td(i - 1, i), 1e-6) && td(i - 1, i + 2) < 0.03;
      const nb = Math.max(dp[i - 1], dp[i + 1] || 0);
      const strong = (bf[i] >= 0.5 && (dh[i] >= 0.25 || (dp[i] >= 0.07 && bf[i] >= 0.65))) || (dh[i] >= 0.2 && dp[i] >= 0.04 && dp[i] >= 4 * nb && bf[i] >= 0.12);
      if (strong && spike && !returns && !motion) cuts.push(t);
      else if ((strong && (spike || !returns)) || (bf[i] >= 0.3 && spike && (dh[i] >= 0.15 || dp[i] >= 0.04))) unc.push(t);
      else if (bmax[i] >= 2.5 * mbm + 0.06 && bmax[i] >= 0.12 && mbf < 0.2) steps.push(t);
    }
    const nms = (arr) => arr.filter((t, k) => k === 0 || t - arr[k - 1] >= 0.3);
    const C = nms(cuts), U = nms(unc).filter((t) => C.every((x) => Math.abs(x - t) >= 0.3)), St = nms(steps).filter((t) => [...C, ...U].every((x) => Math.abs(x - t) >= 0.3));
    const bounds = [0, ...C, dur], shots = bounds.slice(1).map((b, k) => [bounds[k], b]);
    // frames to look at: shot middles, then evenly spaced, up to 12
    const pick = shots.map(([a, b]) => (a + b) / 2);
    while (pick.length < 12 && pick.length < dur) pick.push(((pick.length + 0.5) / 12) * dur);
    const times = pick.sort((a, b) => a - b).filter((t, k, arr) => k === 0 || t - arr[k - 1] > 0.4).slice(0, 12);
    const tw = 480, tht = Math.round(tw * v.videoHeight / v.videoWidth), tc = document.createElement("canvas"); tc.width = tw; tc.height = tht;
    const frames = [];
    for (const t of times) { await seek(v, t); tc.getContext("2d").drawImage(v, 0, 0, tw, tht); frames.push({ t, url: tc.toDataURL("image/jpeg", 0.82), blob: await new Promise((r) => tc.toBlob(r, "image/jpeg", 0.82)) }); }
    onProgress("Reading the audio…", 0.9);
    let audio = null;
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const buf = await ac.decodeAudioData(await blob.arrayBuffer()); ac.close();
      const x = buf.getChannelData(0), sr = buf.sampleRate, hop = Math.round(sr * 0.05), lv = [];
      for (let k = 0; k + hop <= Math.min(x.length, dur * sr); k += hop) { let s = 0; for (let j = k; j < k + hop; j++) s += x[j] * x[j]; lv.push(10 * Math.log10(s / hop + 1e-12)); }
      audio = { median: median(lv), quiet: lv.filter((d) => d < -50).length / lv.length };
    } catch { /* no audio or not decodable */ }
    // palette: k-means over sampled pixels
    let cent = [[20, 20, 30], [90, 90, 90], [160, 160, 160], [230, 230, 230], [200, 120, 60], [60, 120, 200], [180, 60, 120], [60, 180, 120]];
    for (let it = 0; it < 7; it++) { const acc = cent.map(() => [0, 0, 0, 0]); for (const p of pix) { let bi = 0, bd = 1e9; cent.forEach((cc, k) => { const d = (cc[0] - p[0]) ** 2 + (cc[1] - p[1]) ** 2 + (cc[2] - p[2]) ** 2; if (d < bd) { bd = d; bi = k; } }); const a = acc[bi]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++; }
      cent = acc.map((a, k) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3], a[3]] : [...cent[k].slice(0, 3), 0])); }
    const palette = cent.filter((cc) => cc[3]).sort((a, b) => b[3] - a[3]).map((cc) => ({ hex: rgbToHex(cc[0], cc[1], cc[2]), share: cc[3] / pix.length }));
    URL.revokeObjectURL(v.src);
    onProgress("Done.", 1);
    return { duration: dur, fps, width: v.videoWidth, height: v.videoHeight, shots, cuts: C, uncertain: U, steps: St, avgShot: dur / shots.length,
      cutsPerMin: C.length / (dur / 60), changesPerMin: (C.length + U.length + St.length) / (dur / 60),
      saturation: sat.reduce((a, b) => a + b, 0) / sat.length, brightness: lum.reduce((a, b) => a + b, 0) / lum.length, palette, frames, audio };
  }

  // ------------------------------------------------------------------ 2. style
  const VISUALS = ["title", "number", "list", "compare", "character", "icon", "chart", "globe", "statement", "question"];
  const ICONS = ["idea", "clock", "heart", "money", "rocket", "person", "home", "phone", "tree", "planet", "warning", "check", "chart", "globe", "book", "food"];
  function styleFromMeasurements(m) {
    const dark = m.brightness < 0.42;
    const cols = m.palette.map((p) => ({ ...p, ...hsv(p.hex) }));
    const byL = [...cols].sort((a, b) => a.l - b.l);
    const bg = dark ? byL.slice(0, 2) : byL.slice(-2).reverse();
    const acc = cols.filter((c) => c.s > 0.3 && c.v > 0.35).sort((a, b) => b.s * b.v - a.s * a.v).map((c) => c.hex);
    const fallback = dark ? ["#ff5d8f", "#ffb340", "#33e0c8"] : ["#ff4f5e", "#2f6fd6", "#f2a900"];
    const accents = [...acc, ...fallback].slice(0, 3);
    const lively = m.changesPerMin > 25 || m.avgShot < 2.2;
    const mood = m.avgShot > 7 ? "calm" : lively ? "energetic" : "curious";
    return {
      summary: `Measured: ${m.avgShot.toFixed(1)} s average shot, ${m.cutsPerMin.toFixed(0)} cuts a minute, ${dark ? "dark" : "light"} frames, ${m.saturation > 0.45 ? "saturated" : m.saturation > 0.2 ? "moderate" : "muted"} colour.`,
      genre: "", mood, background: dark ? "dark" : "light",
      colors: { bg1: bg[0]?.hex || (dark ? "#0b0d2a" : "#f4f1ea"), bg2: bg[1]?.hex || (dark ? "#1d1450" : "#e6e1d6"), accent1: accents[0], accent2: accents[1], accent3: accents[2], text: dark ? "#f6f3ff" : "#16161d" },
      captions: { on: lively, uppercase: lively, box: false, position: lively ? "center" : "bottom", wordsAtATime: lively ? 3 : 0 },
      font: lively ? "bold-sans" : "rounded",
      narration: { wpm: lively ? 175 : mood === "calm" ? 135 : 155, tone: lively ? "punchy and fast" : mood === "calm" ? "calm and warm" : "curious and clear" },
      avgShot: clamp(Math.round(m.avgShot * 2) / 2, 1.5, 10), transition: m.steps.length > m.cuts.length * 2 && m.avgShot > 5 ? "dissolve" : "cut",
      do: [], avoid: [],
    };
  }
  function stylePrompt(m, base) {
    return `You are helping someone make an ORIGINAL animated motion-graphics video in the style of a reference video. The images are ${m.frames.length} frames from the reference, in order.
Measurements of the reference: ${m.duration.toFixed(0)} s long, ${m.shots.length} shots, average shot ${m.avgShot.toFixed(1)} s, ${m.cutsPerMin.toFixed(1)} hard cuts per minute, ${m.changesPerMin.toFixed(1)} visual changes per minute, mean saturation ${m.saturation.toFixed(2)}, mean brightness ${m.brightness.toFixed(2)}, dominant colours ${m.palette.slice(0, 6).map((p) => p.hex).join(", ")}${m.audio ? `, audio median ${m.audio.median.toFixed(0)} dBFS` : ""}.
Describe the reusable style (not the content) so a renderer can apply it to a new topic. Look closely at backgrounds, colour use, on-screen text and captions, framing, and energy.
Reply with only JSON of this shape:
{"summary": "two sentences on what defines the look and editing", "genre": "e.g. animated science explainer", "mood": "calm|curious|energetic|dramatic|playful",
 "background": "dark|light", "colors": {"bg1": "#hex", "bg2": "#hex", "accent1": "#hex", "accent2": "#hex", "accent3": "#hex", "text": "#hex"},
 "captions": {"on": true, "uppercase": false, "box": false, "position": "bottom|center", "wordsAtATime": 0},
 "font": "rounded|bold-sans|serif", "narration": {"wpm": 155, "tone": "a few words"},
 "do": ["three short rules to keep"], "avoid": ["two short things to avoid"]}
wordsAtATime 0 means full-sentence subtitles; 1-4 means punchy word-by-word captions. Pick colours from the frames. Do not name real people, channels or brands. Current guess from the measurements: ${JSON.stringify({ mood: base.mood, background: base.background, colors: base.colors })}`;
  }
  function mergeStyle(base, ai) {
    if (!ai || typeof ai !== "object") return base;
    const isHex = (x) => /^#[0-9a-f]{6}$/i.test(String(x || ""));
    const colors = { ...base.colors }; for (const k of Object.keys(colors)) if (ai.colors && isHex(ai.colors[k])) colors[k] = ai.colors[k];
    const cap = { ...base.captions, ...(ai.captions || {}) };
    cap.wordsAtATime = clamp(Math.round(Number(cap.wordsAtATime) || 0), 0, 4);
    return { ...base, summary: String(ai.summary || base.summary), genre: String(ai.genre || ""), mood: ["calm", "curious", "energetic", "dramatic", "playful"].includes(ai.mood) ? ai.mood : base.mood,
      background: ai.background === "light" ? "light" : ai.background === "dark" ? "dark" : base.background, colors, captions: { on: !!cap.on, uppercase: !!cap.uppercase, box: !!cap.box, position: cap.position === "center" ? "center" : "bottom", wordsAtATime: cap.wordsAtATime },
      font: ["rounded", "bold-sans", "serif"].includes(ai.font) ? ai.font : base.font,
      narration: { wpm: clamp(Number(ai.narration?.wpm) || base.narration.wpm, 110, 220), tone: String(ai.narration?.tone || base.narration.tone) },
      do: Array.isArray(ai.do) ? ai.do.slice(0, 4).map(String) : [], avoid: Array.isArray(ai.avoid) ? ai.avoid.slice(0, 3).map(String) : [] };
  }

  // ------------------------------------------------------------------ 3. script
  function scriptPrompt(topic, seconds, style) {
    const words = Math.round((seconds / 60) * style.narration.wpm * 0.85), lines = Math.max(4, Math.round(seconds / Math.max(3, style.avgShot * 1.1)));
    return `Write the narration for an ORIGINAL ${seconds}-second animated video about: "${topic}".
Style to fit: ${style.genre || "motion-graphics video"}; mood ${style.mood}; narration ${style.narration.tone}, about ${style.narration.wpm} words per minute. ${style.summary}
Structure: line 1 is a hook that makes a promise or asks a question; then build with concrete facts or steps; then a payoff; end with a short closing line. Keep facts accurate and avoid made-up statistics; if unsure, phrase generally.
Write about ${words} words in ${lines} lines, one or two sentences per line (6-22 words each). Use your own wording; do not copy any existing video's script.
For each line pick the visual that best shows it: title (big heading), number (a big figure), list (up to 3 short items), compare (two sides), character (a cute narrator creature reacting), icon (one symbol), chart (rising bars), globe (planet/world), statement (a key phrase in big type), question (a question mark moment).
Reply with only a JSON array, one object per line:
[{"text": "narration", "visual": "one of the visuals", "label": "on-screen text, max 4 words", "number": null, "items": null, "icon": null}]
"number" is a number only for visual=number or chart; "items" is an array of 2-3 short strings only for list or compare; "icon" is one of ${ICONS.join(", ")} when it helps.`;
  }
  function starterScript(topic) {
    const T = topic || "your topic";
    return [
      { text: `Here is something about ${T} that most people never notice.`, visual: "question", label: "Ever noticed?" },
      { text: `It all comes down to three simple ideas.`, visual: "list", label: "idea one, idea two, idea three" },
      { text: `The first one changes how you see the whole thing.`, visual: "icon", label: "idea one", icon: "idea" },
      { text: `And the numbers behind it are bigger than you would think.`, visual: "number", label: "100", number: 100 },
      { text: `Put side by side, the difference is hard to ignore.`, visual: "compare", label: "before, after" },
      { text: `Over time, the effect only grows.`, visual: "chart", label: "growth", number: 5 },
      { text: `So next time you think about ${T}, remember the small things.`, visual: "statement", label: "small things matter" },
      { text: `Thanks for watching.`, visual: "character", label: "see you!" },
    ];
  }
  function normalizeScript(arr) {
    return (Array.isArray(arr) ? arr : []).map((x) => ({
      text: String(x?.text || "").trim(), visual: VISUALS.includes(x?.visual) ? x.visual : "statement",
      label: String(x?.label || "").slice(0, 60), number: x?.number == null || x.number === "" ? null : Number(x.number),
      items: Array.isArray(x?.items) ? x.items.slice(0, 3).map(String) : null, icon: ICONS.includes(x?.icon) ? x.icon : null,
    })).filter((x) => x.text);
  }

  // ------------------------------------------------------------------ 4. the style-driven renderer
  function fontFor(style, weight, px) {
    const fam = style.font === "serif" ? "Georgia, 'Times New Roman', serif" : style.font === "bold-sans" ? "'Archivo Black', 'Arial Black', Impact, sans-serif" : "'Baloo 2', Nunito, 'Arial Rounded MT Bold', sans-serif";
    return `${weight} ${px}px ${fam}`;
  }
  function background(ctx, s, st) {
    const C = st.colors, g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg2); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
    const r = rng(s.seed);
    if (st.background === "dark") {
      ctx.save(); ctx.filter = "blur(50px)"; ctx.globalCompositeOperation = "lighter";
      [C.accent1, C.accent2, C.accent3].forEach((c, i) => { ctx.globalAlpha = 0.14; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 220 + r() * 160, 120 + r() * 90, r() * 3, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
      for (let i = 0; i < 140; i++) { ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(s.gt * (0.5 + r()) + i)); circle(ctx, r() * W, r() * H, 0.6 + r() * 1.4, C.text); }
      ctx.globalAlpha = 1;
    } else {
      for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.12; circle(ctx, r() * W + Math.sin(s.gt * 0.3 + i) * 20, r() * H, 80 + r() * 160, [C.accent1, C.accent2, C.accent3][i % 3]); }
      ctx.globalAlpha = 0.18; for (let x = 40; x < W; x += 48) for (let y = 40; y < H; y += 48) circle(ctx, x, y, 1.6, C.text);
      ctx.globalAlpha = 1;
    }
  }
  function cam(ctx, s, st) {
    const m = st.mood === "energetic" ? 1.6 : st.mood === "calm" ? 0.6 : 1, z = 1 + 0.05 * m * ease(s.p) + (st.mood === "energetic" ? 0.02 * Math.sin(s.gt * 9) * clamp(1 - s.lt * 3) : 0);
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  }
  function headline(ctx, st, text, x, y, px, k, color) {
    if (k <= 0 || !text) return;
    ctx.save(); ctx.font = fontFor(st, 800, px); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const lines = wrap(ctx, st.captions.uppercase ? text.toUpperCase() : text, W * 0.8);
    ctx.translate(x, y); const sc = pop(k); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 2);
    lines.forEach((ln, i) => { const yy = (i - (lines.length - 1) / 2) * px * 1.1; ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillText(ln, 3, yy + 5); ctx.fillStyle = color; ctx.fillText(ln, 0, yy); });
    ctx.restore();
  }
  const at = (s, t, d = 0.45) => clamp((s.lt - t) / d);
  function shade(ctx, x, y, r, base, dark) { // flat sphere: base + hard shadow + rim
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = base; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x - r * 0.35, y - r * 0.35, r * 1.08, 0, Math.PI * 2); ctx.fillStyle = alpha(dark, 0.35); ctx.fill("evenodd");
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x + r * 0.05, y + r * 0.05, r, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fill("evenodd"); ctx.restore();
  }
  function critter(ctx, x, y, r, st, t, mood = "happy", look = [0, 0]) { // original round narrator creature
    const body = st.colors.accent1, dark = mix(body, "#000000", 0.35), bob = Math.sin(t * 3) * r * 0.04;
    ctx.save(); ctx.translate(x, y + bob);
    ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(0, r, r * 0.8, r * 0.14, 0, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.globalAlpha = 1;
    circle(ctx, -r * 0.4, r * 0.88, r * 0.22, dark); circle(ctx, r * 0.4, r * 0.88, r * 0.22, dark);
    ctx.save(); ctx.translate(r * 0.1, -r * 0.95); ctx.rotate(0.35); ctx.beginPath(); ctx.ellipse(0, -r * 0.18, r * 0.13, r * 0.26, 0, 0, Math.PI * 2); ctx.fillStyle = st.colors.accent3; ctx.fill(); ctx.restore();
    shade(ctx, 0, 0, r, body, "#000000");
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * r * 0.32, -r * 0.12, r * 0.2, r * 0.25, 0, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); circle(ctx, sx * r * 0.32 + look[0] * r * 0.08, -r * 0.12 + look[1] * r * 0.1, r * 0.11, "#14122b"); circle(ctx, sx * r * 0.29 + look[0] * r * 0.08, -r * 0.17 + look[1] * r * 0.1, r * 0.035, "#fff"); }
    ctx.strokeStyle = "#14122b"; ctx.lineWidth = r * 0.06; ctx.lineCap = "round";
    if (mood === "happy") { ctx.beginPath(); ctx.arc(0, r * 0.22, r * 0.18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); } else circle(ctx, 0, r * 0.3, r * 0.08, "#14122b");
    if (mood === "wave") { ctx.strokeStyle = dark; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.moveTo(r * 0.9, 0); ctx.lineTo(r * 1.3, -r * (0.5 + 0.15 * Math.sin(t * 8))); ctx.stroke(); }
    ctx.restore();
  }
  function icon(ctx, kind, x, y, r, st, t) {
    const C = st.colors, a1 = C.accent1, a2 = C.accent2, a3 = C.accent3, ink = st.background === "dark" ? "#14122b" : "#ffffff";
    ctx.save(); ctx.translate(x, y); ctx.lineCap = "round"; ctx.lineJoin = "round";
    const stroke = (c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w; };
    switch (kind) {
      case "idea": glow(ctx, 0, -r * 0.2, r * 1.4, alpha(a2, 0.6)); shade(ctx, 0, -r * 0.2, r * 0.6, a2, "#000"); rr(ctx, -r * 0.25, r * 0.35, r * 0.5, r * 0.35, 6, a3); break;
      case "clock": shade(ctx, 0, 0, r * 0.8, a3, "#000"); circle(ctx, 0, 0, r * 0.65, "#fff"); stroke("#14122b", r * 0.08); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t) * r * 0.45, Math.sin(t) * r * 0.45); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.35); ctx.stroke(); break;
      case "heart": ctx.fillStyle = a1; ctx.beginPath(); ctx.moveTo(0, r * 0.7); ctx.bezierCurveTo(-r * 1.3, -r * 0.2, -r * 0.5, -r * 1.05, 0, -r * 0.35); ctx.bezierCurveTo(r * 0.5, -r * 1.05, r * 1.3, -r * 0.2, 0, r * 0.7); ctx.fill(); break;
      case "money": for (let i = 2; i >= 0; i--) { ctx.beginPath(); ctx.ellipse(0, i * r * 0.22 - r * 0.1, r * 0.75, r * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = i ? mix(a2, "#000", 0.25) : a2; ctx.fill(); } ctx.font = fontFor(st, 800, r * 0.5); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = ink; ctx.fillText("$", 0, -r * 0.1); break;
      case "rocket": ctx.rotate(0.5); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.35, r * 0.9, 0, 0, Math.PI * 2); ctx.fillStyle = "#f6f3ff"; ctx.fill(); circle(ctx, 0, -r * 0.2, r * 0.16, a3); ctx.fillStyle = a1; ctx.beginPath(); ctx.moveTo(-r * 0.35, r * 0.3); ctx.lineTo(-r * 0.65, r * 0.9); ctx.lineTo(-r * 0.1, r * 0.65); ctx.fill(); ctx.beginPath(); ctx.moveTo(r * 0.35, r * 0.3); ctx.lineTo(r * 0.65, r * 0.9); ctx.lineTo(r * 0.1, r * 0.65); ctx.fill(); ctx.fillStyle = a2; ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.85); ctx.lineTo(0, r * (1.3 + 0.15 * Math.sin(t * 20))); ctx.lineTo(r * 0.2, r * 0.85); ctx.fill(); break;
      case "person": shade(ctx, 0, -r * 0.45, r * 0.38, a2, "#000"); rr(ctx, -r * 0.5, -r * 0.02, r, r * 0.9, r * 0.4, a1); break;
      case "home": ctx.fillStyle = a1; ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.05); ctx.lineTo(0, -r * 0.85); ctx.lineTo(r * 0.9, -r * 0.05); ctx.fill(); rr(ctx, -r * 0.65, -r * 0.1, r * 1.3, r * 0.9, 8, a2); rr(ctx, -r * 0.15, r * 0.3, r * 0.3, r * 0.5, 6, mix(a2, "#000", 0.35)); break;
      case "phone": rr(ctx, -r * 0.45, -r * 0.85, r * 0.9, r * 1.7, r * 0.15, "#1d1b2e"); rr(ctx, -r * 0.37, -r * 0.7, r * 0.74, r * 1.35, r * 0.08, a3); circle(ctx, 0, r * 0.75, r * 0.06, "#fff"); break;
      case "tree": rr(ctx, -r * 0.1, 0, r * 0.2, r * 0.9, 4, "#6b5236"); for (let i = 0; i < 5; i++) circle(ctx, Math.cos(i * 1.3) * r * 0.4, -r * 0.3 + Math.sin(i * 2) * r * 0.25, r * 0.42, i % 2 ? a3 : mix(a3, "#000", 0.2)); break;
      case "planet": shade(ctx, 0, 0, r * 0.6, a1, "#000"); ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.28, -0.3, 0, Math.PI * 2); stroke(a2, r * 0.1); ctx.stroke(); break;
      case "warning": ctx.fillStyle = a2; ctx.beginPath(); ctx.moveTo(0, -r * 0.85); ctx.lineTo(r * 0.9, r * 0.7); ctx.lineTo(-r * 0.9, r * 0.7); ctx.closePath(); ctx.fill(); ctx.font = fontFor(st, 800, r * 0.9); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#14122b"; ctx.fillText("!", 0, r * 0.12); break;
      case "check": shade(ctx, 0, 0, r * 0.8, a3, "#000"); stroke("#fff", r * 0.16); ctx.beginPath(); ctx.moveTo(-r * 0.35, 0); ctx.lineTo(-r * 0.08, r * 0.28); ctx.lineTo(r * 0.4, -r * 0.3); ctx.stroke(); break;
      case "chart": [0.4, 0.7, 1].forEach((hh, i) => rr(ctx, -r * 0.75 + i * r * 0.55, r * 0.7 - hh * r * 1.4, r * 0.4, hh * r * 1.4, 6, [a1, a2, a3][i])); break;
      case "globe": shade(ctx, 0, 0, r * 0.8, a3, "#000"); stroke("rgba(255,255,255,0.6)", 3); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.35, r * 0.8, 0, 0, Math.PI * 2); ctx.moveTo(-r * 0.8, 0); ctx.lineTo(r * 0.8, 0); ctx.stroke(); break;
      case "book": rr(ctx, -r * 0.8, -r * 0.55, r * 0.78, r * 1.1, 6, a1); rr(ctx, r * 0.02, -r * 0.55, r * 0.78, r * 1.1, 6, a2); break;
      case "food": ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI); ctx.fillStyle = a2; ctx.fill(); circle(ctx, -r * 0.3, -r * 0.05, r * 0.25, a1); circle(ctx, r * 0.25, -r * 0.1, r * 0.3, a3); break;
      default: shade(ctx, 0, 0, r * 0.7, a1, "#000");
    }
    ctx.restore();
  }
  const scenes = {
    title(ctx, s, st, ln) { background(ctx, s, st); ctx.save(); cam(ctx, s, st); headline(ctx, st, ln.label || ln.text, W / 2, H * 0.45, 92, at(s, 0.1), st.colors.text);
      const u = ease(at(s, 0.6, 0.6)); rr(ctx, W / 2 - 220 * u, H * 0.45 + 80, 440 * u, 10, 5, st.colors.accent1); ctx.restore(); },
    number(ctx, s, st, ln) { background(ctx, s, st); ctx.save(); cam(ctx, s, st);
      const target = Number.isFinite(ln.number) ? ln.number : parseFloat(String(ln.label).replace(/[^\d.]/g, "")) || 100, k = ease(clamp((s.lt - 0.2) / 1.6));
      const val = target >= 100 ? Math.round(target * k).toLocaleString("en-US") : (target * k).toFixed(Number.isInteger(target) ? 0 : 1);
      glow(ctx, W / 2, H * 0.42, 320, alpha(st.colors.accent1, 0.35)); headline(ctx, st, val, W / 2, H * 0.42, 150, at(s, 0.1), st.colors.accent2);
      const lab = String(ln.label || "").replace(/^[\d.,\s]+/, ""); headline(ctx, st, lab, W / 2, H * 0.62, 40, at(s, 0.7), st.colors.text); ctx.restore(); },
    list(ctx, s, st, ln) { background(ctx, s, st); ctx.save(); cam(ctx, s, st);
      const items = (ln.items && ln.items.length ? ln.items : String(ln.label).split(/,|;/)).map((x) => x.trim()).filter(Boolean).slice(0, 3);
      const per = Math.max(0.5, (s.dur - 1) / Math.max(1, items.length));
      items.forEach((it, i) => { const k = at(s, 0.2 + i * per), y = H * 0.27 + i * 140, sc = pop(k); if (k <= 0) return;
        ctx.save(); ctx.translate(W * 0.28, y); ctx.scale(sc, sc); shade(ctx, 0, 0, 44, [st.colors.accent1, st.colors.accent2, st.colors.accent3][i], "#000");
        ctx.font = fontFor(st, 800, 40); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.fillText(String(i + 1), 0, 2); ctx.restore();
        ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.font = fontFor(st, 800, 48); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = st.colors.text; ctx.fillText(st.captions.uppercase ? it.toUpperCase() : it, W * 0.28 + 80, y + 3); ctx.restore(); });
      ctx.restore(); },
    compare(ctx, s, st, ln) { background(ctx, s, st);
      const items = (ln.items && ln.items.length >= 2 ? ln.items : String(ln.label).split(/,|\bvs\.?\b|\/|;/i)).map((x) => x.trim()).filter(Boolean);
      const [a, b] = [items[0] || "this", items[1] || "that"], k = ease(at(s, 0.1, 0.6));
      rr(ctx, lerp(-W / 2, 60, k), 110, W / 2 - 90, H - 260, 28, alpha(st.colors.accent1, 0.9)); rr(ctx, lerp(W * 1.5, W / 2 + 30, k), 110, W / 2 - 90, H - 260, 28, alpha(st.colors.accent3, 0.9));
      icon(ctx, ln.icon || "person", W * 0.27, H * 0.38, 70, st, s.gt); icon(ctx, ln.icon || "person", W * 0.73, H * 0.38, 70, st, s.gt);
      headline(ctx, st, a, W * 0.27, H * 0.66, 44, at(s, 0.6), "#fff"); headline(ctx, st, b, W * 0.73, H * 0.66, 44, at(s, 0.8), "#fff");
      headline(ctx, st, "vs", W / 2, H * 0.48, 56, at(s, 1.0), st.colors.accent2); },
    character(ctx, s, st, ln) { background(ctx, s, st); ctx.save(); cam(ctx, s, st);
      ctx.fillStyle = mix(st.colors.bg2, st.background === "dark" ? "#000" : "#ffffff", 0.3); ctx.beginPath(); ctx.ellipse(W / 2, H + 300, W * 0.7, 420, 0, 0, Math.PI * 2); ctx.fill();
      critter(ctx, W * 0.38, H * 0.6, 95, st, s.gt, /\?$/.test(ln.text) ? "wonder" : s.p > 0.5 ? "wave" : "happy", [0.6, -0.2]);
      const k = at(s, 0.4); if (k > 0 && ln.label) { ctx.save(); ctx.translate(W * 0.66, H * 0.36); ctx.scale(pop(k), pop(k)); ctx.font = fontFor(st, 800, 42); const tw = Math.min(460, ctx.measureText(ln.label).width + 60);
        rr(ctx, -tw / 2, -50, tw, 100, 40, "#ffffff"); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(-tw / 2 + 30, 30); ctx.lineTo(-tw / 2 - 30, 80); ctx.lineTo(-tw / 2 + 70, 40); ctx.fill();
        ctx.fillStyle = "#14122b"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ln.label, 0, 3, tw - 40); ctx.restore(); }
      ctx.restore(); },
    icon(ctx, s, st, ln) { background(ctx, s, st); ctx.save(); cam(ctx, s, st);
      const k = at(s, 0.1); glow(ctx, W / 2, H * 0.42, 260, alpha(st.colors.accent2, 0.35)); ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.scale(pop(k), pop(k)); icon(ctx, ln.icon || guessIcon(ln), 0, 0, 120, st, s.gt); ctx.restore();
      headline(ctx, st, ln.label, W / 2, H * 0.72, 48, at(s, 0.6), st.colors.text); ctx.restore(); },
    chart(ctx, s, st, ln) { background(ctx, s, st); ctx.save(); cam(ctx, s, st);
      const n = 5, bw = 120, base = H * 0.72, top = Number.isFinite(ln.number) ? ln.number : 5;
      ctx.strokeStyle = alpha(st.colors.text, 0.4); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W * 0.2, base); ctx.lineTo(W * 0.8, base); ctx.stroke();
      for (let i = 0; i < n; i++) { const k = ease(at(s, 0.2 + i * 0.25, 0.6)), hgt = (0.25 + 0.75 * (i + 1) / n) * 340 * k; rr(ctx, W * 0.2 + 40 + i * (bw + 20), base - hgt, bw, hgt, 12, i === n - 1 ? st.colors.accent1 : alpha(st.colors.accent3, 0.75)); }
      headline(ctx, st, `×${top}`, W * 0.2 + 40 + (n - 1) * (bw + 20) + bw / 2, base - 380, 54, at(s, 1.6), st.colors.accent2);
      headline(ctx, st, ln.label, W / 2, H * 0.12, 46, at(s, 0.1), st.colors.text); ctx.restore(); },
    globe(ctx, s, st, ln) { background(ctx, s, st); ctx.save(); cam(ctx, s, st);
      const x = W / 2, y = H * 0.48, r = 200; glow(ctx, x, y, r * 1.5, alpha(st.colors.accent3, 0.5));
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = st.colors.accent3; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      const q = rng(9); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(x + ((q() - 0.5) * 2 * r + s.gt * 25) % (2 * r) - 0 , y + (q() - 0.5) * 1.5 * r, r * (0.15 + q() * 0.2), r * (0.1 + q() * 0.12), q() * 3, 0, Math.PI * 2); ctx.fillStyle = st.colors.accent1; ctx.fill(); }
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x - r * 0.4, y - r * 0.4, r * 1.08, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,30,0.35)"; ctx.fill("evenodd"); ctx.restore();
      const a = s.gt * 1.2; circle(ctx, x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 0.4, 14, st.colors.accent2);
      headline(ctx, st, ln.label, W / 2, H * 0.88, 44, at(s, 0.5), st.colors.text); ctx.restore(); },
    statement(ctx, s, st, ln) { background(ctx, s, st); ctx.save(); cam(ctx, s, st);
      rr(ctx, 0, H * 0.3, W * ease(at(s, 0, 0.5)), H * 0.4, 0, alpha(st.colors.accent1, 0.18));
      headline(ctx, st, ln.label || ln.text, W / 2, H * 0.5, 76, at(s, 0.15), st.colors.text); ctx.restore(); },
    question(ctx, s, st, ln) { background(ctx, s, st); ctx.save(); cam(ctx, s, st);
      headline(ctx, st, "?", W * 0.66, H * 0.38, 260, at(s, 0.5), st.colors.accent2); critter(ctx, W * 0.36, H * 0.6, 90, st, s.gt, "wonder", [0.8, -0.6]);
      headline(ctx, st, ln.label, W / 2, H * 0.12, 46, at(s, 0.1), st.colors.text); ctx.restore(); },
  };
  function guessIcon(ln) {
    const t = (ln.text + " " + ln.label).toLowerCase();
    const map = [["idea", /idea|think|brain|learn|why/], ["clock", /time|year|hour|day|minute|age/], ["heart", /love|health|heart|feel/], ["money", /money|cost|price|pay|\$|rich|budget/], ["rocket", /space|launch|fast|grow|rocket/],
      ["home", /home|house|city|live/], ["phone", /phone|app|online|internet|social/], ["tree", /nature|tree|plant|forest|climate/], ["planet", /planet|universe|star|galaxy/], ["warning", /danger|risk|warn|mistake/],
      ["globe", /world|earth|country|global/], ["book", /book|read|study|history/], ["food", /food|eat|cook|diet/], ["chart", /data|number|percent|rise|growth/], ["person", /people|person|human|you/]];
    for (const [k, re] of map) if (re.test(t)) return k;
    return "idea";
  }

  function register(style, script) {
    const lines = normalizeScript(script);
    const wrapped = {};
    Object.entries(scenes).forEach(([k, fn]) => { wrapped[k] = (ctx, s) => { const sh = s._shot; s.lt = s.gt - sh.start; s.dur = sh.end - sh.start; fn(ctx, s, style, sh.ln); }; });
    function build(opts = {}) {
      const wpm = opts.wpm || style.narration.wpm, asl = style.avgShot;
      const tl = { preset: "custom", topic: opts.topic || "", lines: [], shots: [], events: [], duration: 0, captions: style.captions.on,
        captionStyle: { chunk: style.captions.wordsAtATime, upper: style.captions.uppercase, box: style.captions.box, position: style.captions.position, highlight: style.colors.accent2, font: fontFor(style, 800, 0).replace(" 0px", "") } };
      let t = 0;
      lines.forEach((ln, i) => {
        const words = ln.text.split(/\s+/).length, speak = (words / wpm) * 60, lead = i === 0 ? 0.5 : 0.25, dur = Math.max(2.2, speak + lead + 0.45);
        const n = Math.max(1, Math.round(dur / Math.max(asl, 1.5)));
        for (let j = 0; j < n; j++) {
          const alt = j === 0 ? ln : { ...ln, visual: j % 2 ? "icon" : "statement", label: ln.label || ln.text.split(/\s+/).slice(0, 4).join(" ") };
          tl.shots.push({ start: t + dur * j / n, end: t + dur * (j + 1) / n, scene: alt.visual, seed: hash(ln.text + j), ln: alt, cut: style.transition });
        }
        tl.lines.push({ text: ln.text, start: t + lead, end: t + lead + speak });
        t += dur;
      });
      tl.duration = t + 0.6; if (tl.shots.length) tl.shots[tl.shots.length - 1].end = tl.duration;
      return tl;
    }
    E.PRESETS.custom = { name: "Your style", measured: true, mode: "scripted", wpm: style.narration.wpm, asl: style.avgShot, transition: style.transition, tDur: style.transition === "dissolve" ? 0.6 : 0.3,
      music: { calm: "pad", curious: "pad", playful: "pluck", energetic: "beat", dramatic: "drone" }[style.mood] || "pad", captions: style.captions.on,
      targets: {}, palette: [style.colors.bg1, style.colors.bg2, style.colors.accent1, style.colors.accent2, style.colors.accent3], scenes: wrapped, build,
      sample: { topic: "", lines: lines.map((l) => l.text) } };
    return E.buildTimeline("custom");
  }

  // ------------------------------------------------------------------ player: play, narrate, music, record
  function Player(canvas, hooks = {}) {
    const ctx = canvas.getContext("2d");
    let tl = null, t = 0, playing = false, last = 0, raf = 0, audio = null, spoken = new Set(), recorder = null, opts = { voice: true, music: true, wpm: 155 };
    function set(timeline, o = {}) { stop(); tl = timeline; t = 0; Object.assign(opts, o); draw(); }
    function draw() { if (!tl) return; E.renderAt(ctx, tl, t); hooks.onTime?.(t, tl.duration); }
    function tick(now) {
      t += (now - last) / 1000; last = now;
      if (t >= tl.duration) { t = tl.duration; draw(); const r = recorder; stop(); if (r) r.stop(); return; }
      if (opts.voice && "speechSynthesis" in window) tl.lines.forEach((ln, i) => { if (!spoken.has(i) && t >= ln.start && t < ln.end) { spoken.add(i); try { const u = new SpeechSynthesisUtterance(ln.text); u.rate = clamp(opts.wpm / 165, 0.6, 2); speechSynthesis.speak(u); } catch {} } });
      draw(); raf = requestAnimationFrame(tick);
    }
    function music() {
      const kind = E.PRESETS[tl.preset]?.music; if (!opts.music || !kind || kind === "none") return null;
      const ac = new (window.AudioContext || window.webkitAudioContext)(), out = ac.createGain(), dest = ac.createMediaStreamDestination();
      out.gain.value = 0.45; out.connect(ac.destination); out.connect(dest);
      const note = (f, at, dur, amp, attack, type = "sine") => { if (at < 0) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; const T = ac.currentTime + at;
        g.gain.setValueAtTime(0, T); g.gain.linearRampToValueAtTime(amp, T + attack); g.gain.exponentialRampToValueAtTime(0.0001, T + dur); o.connect(g); g.connect(out); o.start(T); o.stop(T + dur + 0.05); };
      const noise = (at, dur, amp) => { if (at < 0) return; const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / d.length) ** 2;
        const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1800; s.buffer = b; g.gain.value = amp; s.connect(f); f.connect(g); g.connect(out); s.start(ac.currentTime + at); };
      const rem = tl.duration - t, ch = [[220, 277.18, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [196, 246.94, 329.63]];
      if (kind === "pad" || kind === "drone") for (let k = Math.floor(t / 4); k * 4 < tl.duration; k++) { const at = k * 4 - t; ch[k % 4].forEach((f) => note(kind === "drone" ? f / 4 : f / 2, at, 5, 0.06, 1.2)); if (kind === "pad") for (let j = 0; j < 4; j++) note(ch[k % 4][j % 3] * 2, at + j + 0.5, 0.6, 0.03, 0.005); }
      if (kind === "pluck") { const sc = [261.63, 293.66, 329.63, 392, 440, 523.25]; let k = 0; for (let at = 0; at < rem; at += 0.3) note(sc[(k++ * 5) % 6], at, 0.35, 0.05, 0.005, "triangle"); }
      if (kind === "beat") { const beat = 60 / 120; for (let at = -(t % beat); at < rem; at += beat) { note(55, at, 0.25, 0.5, 0.003); note(110 * [1, 1, 1.5, 1.33][Math.floor((t + at) / beat) % 4], at, 0.22, 0.09, 0.005, "square"); noise(at + beat / 2, 0.05, 0.12); } }
      for (const c of E.cutTimes(tl)) { const at = c.t - t - 0.2; if (at > 0) noise(at, 0.35, 0.08); }
      return { ac, dest };
    }
    function play() { if (!tl) return; if (t >= tl.duration) t = 0; playing = true; spoken = new Set(tl.lines.map((l, i) => (l.end <= t ? i : -1)).filter((i) => i >= 0)); last = performance.now(); audio = music(); hooks.onState?.("playing"); raf = requestAnimationFrame(tick); }
    function stop() { playing = false; cancelAnimationFrame(raf); if (audio) { try { audio.ac.close(); } catch {} audio = null; } try { speechSynthesis.cancel(); } catch {} hooks.onState?.("stopped"); }
    function seekTo(x) { stop(); t = clamp(x, 0, tl ? tl.duration : 0); draw(); }
    function record() {
      return new Promise((resolve, reject) => {
        if (!canvas.captureStream || !window.MediaRecorder) return reject(new Error("This browser can't record a canvas. Try Chrome, Edge or Firefox."));
        stop(); t = 0; draw();
        const stream = canvas.captureStream(30); play();
        if (audio) audio.dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
        const type = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m));
        const chunks = []; recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        recorder.onstop = () => { recorder = null; resolve(new Blob(chunks, { type: "video/webm" })); };
        recorder.start(250); hooks.onState?.("recording");
      });
    }
    function cancelRecording() { if (recorder) recorder.stop(); }
    return { set, play, stop, seekTo, record, cancelRecording, draw, get playing() { return playing; }, get t() { return t; }, get tl() { return tl; } };
  }

  window.Maker = { analyze, styleFromMeasurements, stylePrompt, mergeStyle, scriptPrompt, starterScript, normalizeScript, register, Player, VISUALS, ICONS };
})();
