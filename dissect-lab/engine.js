/* Dissect Lab recreation engine.
 * Turns a blueprint's targets (shot length, transitions, palette, camera, overlays) into a
 * deterministic canvas animation: renderAt(ctx, timeline, t) draws the frame at time t.
 * All characters and scenes are original drawings.
 */
(function (root) {
  const W = 1280, H = 720;

  // ------------------------------------------------------------------ helpers
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = (k) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(k));
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
  function glow(ctx, x, y, r, color, alpha = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function vgrad(ctx, top, bottom) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function rrect(ctx, x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
  function wrapText(ctx, text, maxW) {
    const words = text.split(/\s+/), lines = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  }

  // ------------------------------------------------------------------ original characters
  // "Blip": round flat creature with dot eyes (flat-space explainer)
  function blip(ctx, x, y, r, body, shade, t, seed) {
    const sq = 1 + 0.06 * Math.sin(t * 6 + seed);
    ctx.save(); ctx.translate(x, y); ctx.scale(1 / sq, sq);
    circle(ctx, 0, 0, r, body);
    ctx.beginPath(); ctx.arc(0, 0, r, 0.2 * Math.PI, 0.8 * Math.PI); ctx.lineTo(0, 0); ctx.closePath(); ctx.fillStyle = shade; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
    const blink = (Math.sin(t * 1.3 + seed * 7) > 0.97) ? 0.15 : 1;
    ctx.save(); ctx.scale(1, blink);
    circle(ctx, -r * 0.32, -r * 0.15 / blink, r * 0.13, "#14122b"); circle(ctx, r * 0.32, -r * 0.15 / blink, r * 0.13, "#14122b");
    ctx.restore();
    circle(ctx, -r * 0.36, -r * 0.2, r * 0.04, "#fff"); circle(ctx, r * 0.28, -r * 0.2, r * 0.04, "#fff");
    ctx.restore();
  }
  // "Puff": small fluffy round creature with a sprout (storybook sidekick)
  function puff(ctx, x, y, r, pose, t) {
    ctx.save(); ctx.translate(x, y - Math.abs(Math.sin(t * 5)) * r * 0.25 * (pose % 2));
    const fur = "#e7c9a3";
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; circle(ctx, Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, r * 0.35, fur); }
    circle(ctx, 0, 0, r * 0.85, "#f3dcbb");
    ctx.strokeStyle = "#5d7a3a"; ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.1, -r * 1.4, r * 0.35, -r * 1.45); ctx.stroke();
    ctx.save(); ctx.translate(r * 0.38, -r * 1.45); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.25, r * 0.12, 0, 0, Math.PI * 2); ctx.fillStyle = "#7da34e"; ctx.fill(); ctx.restore();
    const eyeY = -r * 0.1, open = pose === 2 ? 0.3 : 1;
    ctx.save(); ctx.scale(1, open); circle(ctx, -r * 0.3, eyeY / open, r * 0.16, "#2a1d14"); circle(ctx, r * 0.3, eyeY / open, r * 0.16, "#2a1d14"); ctx.restore();
    circle(ctx, -r * 0.25, eyeY - r * 0.06, r * 0.05, "#fff"); circle(ctx, r * 0.35, eyeY - r * 0.06, r * 0.05, "#fff");
    if (pose === 3) { ctx.beginPath(); ctx.arc(0, r * 0.3, r * 0.2, 0, Math.PI); ctx.fillStyle = "#7a3b2c"; ctx.fill(); }
    // arms
    const up = pose === 1 || pose === 3 ? -1 : 0.3;
    ctx.strokeStyle = "#d9b38a"; ctx.lineWidth = r * 0.18; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-r * 0.75, 0); ctx.lineTo(-r * 1.15, up * r * 0.6); ctx.moveTo(r * 0.75, 0); ctx.lineTo(r * 1.15, up * r * 0.6); ctx.stroke();
    ctx.restore();
  }
  // "Moss": big round mossy creature with stubby ears (storybook hero)
  function moss(ctx, x, y, r, stretch, t, lit = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1 - stretch * 0.08, 1 + stretch * 0.12);
    const body = lit > 0.5 ? "#8fae6b" : "#3d4a35", belly = lit > 0.5 ? "#d9e3b8" : "#525c45";
    ctx.beginPath(); ctx.ellipse(-r * 0.45, -r * 1.05, r * 0.18, r * 0.35, -0.3, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.45, -r * 1.05, r * 0.18, r * 0.35, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 1.1, 0, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.65, r * 0.7, 0, 0, Math.PI * 2); ctx.fillStyle = belly; ctx.fill();
    const rr = rng(77); for (let i = 0; i < 14; i++) circle(ctx, (rr() - 0.5) * r * 1.6, -r * 0.2 - rr() * r * 0.8, r * 0.05, lit > 0.5 ? "#6f8f4c" : "#2f3a29");
    const eye = lit > 0.5 ? "#1f2a17" : "#e8f0a0";
    circle(ctx, -r * 0.3, -r * 0.45, r * 0.11, eye); circle(ctx, r * 0.3, -r * 0.45, r * 0.11, eye);
    if (lit > 0.5) { circle(ctx, -r * 0.27, -r * 0.5, r * 0.035, "#fff"); circle(ctx, r * 0.33, -r * 0.5, r * 0.035, "#fff"); circle(ctx, 0, -r * 0.25, r * 0.08, "#5b3b2a"); }
    if (stretch > 0.3 && lit > 0.5) { ctx.strokeStyle = body; ctx.lineWidth = r * 0.22; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-r * 0.85, -r * 0.2); ctx.lineTo(-r * 1.2, -r * (0.6 + stretch * 0.6)); ctx.moveTo(r * 0.85, -r * 0.2); ctx.lineTo(r * 1.2, -r * (0.6 + stretch * 0.6)); ctx.stroke(); }
    ctx.restore();
  }
  // capsule person for fixed-cam scenes
  function person(ctx, x, y, s, shirt, pants, t, walking, facing = 0) {
    const swing = walking ? Math.sin(t * 7) * 0.35 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = pants; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-5, -38); ctx.lineTo(-5 + swing * 18, 0); ctx.moveTo(5, -38); ctx.lineTo(5 - swing * 18, 0); ctx.stroke();
    rrect(ctx, -14, -82, 28, 48, 10, shirt);
    ctx.strokeStyle = shirt; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-13, -76); ctx.lineTo(-17 - swing * 10, -46); ctx.moveTo(13, -76); ctx.lineTo(17 + swing * 10, -46); ctx.stroke();
    circle(ctx, 0, -95, 12, "#c9a58a");
    ctx.beginPath(); ctx.arc(0, -98, 12.5, Math.PI, 2 * Math.PI); ctx.fillStyle = "#3a302a"; ctx.fill();
    if (facing > 0) { circle(ctx, -4, -95, 1.6, "#222"); circle(ctx, 4, -95, 1.6, "#222"); }
    ctx.restore();
  }

  // ------------------------------------------------------------------ flat-space scenes
  const SPACE = { bg1: "#0e1033", bg2: "#241a5c", pink: "#ff5e8a", amber: "#ffb03b", teal: "#3ee0c9", violet: "#7b5cff", white: "#f4f1ff" };
  function stars(ctx, seed, t, n = 140, drift = 4) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = (r() * W + t * drift * (0.3 + r())) % W, y = r() * H, s = r() * 1.8 + 0.3;
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + r()) + i));
      circle(ctx, x, y, s, SPACE.white);
    }
    ctx.globalAlpha = 1;
  }
  // each scene gets its own deep background so a scene change reads as a cut (the first render's
  // shared navy background made 9 shots measure as 1)
  const SPACE_BGS = { rings: ["#0e1033", "#241a5c"], moonbreak: ["#2a0f3d", "#5c1a4f"], disk: ["#06243a", "#0d4a5c"],
    shadow: ["#101a3d", "#1d3f7a"], collision: ["#1d0b2e", "#4a1d6b"] };
  function spaceBg(ctx, s) { const [a, b] = SPACE_BGS[s.scene] || [SPACE.bg1, SPACE.bg2]; vgrad(ctx, a, b); stars(ctx, s.seed, s.gt); }
  const spaceScenes = {
    rings(ctx, s) {
      spaceBg(ctx, s);
      const z = 1 + 0.06 * ease(s.p), cx = W * 0.5, cy = H * 0.55;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
      glow(ctx, cx, cy, 330, "rgba(62,224,201,0.35)");
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.25);
      ctx.beginPath(); ctx.ellipse(0, 0, 330, 70, 0, Math.PI, 2 * Math.PI); ctx.lineWidth = 22; ctx.strokeStyle = "rgba(255,176,59,0.8)"; ctx.stroke();
      ctx.restore();
      circle(ctx, cx, cy, 150, "#2b6fd6");
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 150, 0, Math.PI * 2); ctx.clip();
      const r = rng(s.seed + 3); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(cx + (r() - 0.5) * 220 + Math.sin(s.gt * 0.2) * 20, cy + (r() - 0.5) * 220, 30 + r() * 50, 20 + r() * 30, r() * 3, 0, Math.PI * 2); ctx.fillStyle = "#3ee09a"; ctx.fill(); }
      circle(ctx, cx + 60, cy + 40, 150, "rgba(14,16,51,0.35)");
      ctx.restore();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.25);
      ctx.beginPath(); ctx.ellipse(0, 0, 330, 70, 0, 0, Math.PI); ctx.lineWidth = 22; ctx.strokeStyle = SPACE.amber; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 300, 60, 0, 0, Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = "rgba(244,241,255,0.7)"; ctx.stroke();
      ctx.restore(); ctx.restore();
    },
    moonbreak(ctx, s) {
      spaceBg(ctx, s);
      const cx = W * 0.42, cy = H * 0.5, k = ease(s.p);
      circle(ctx, cx - 360, cy + 40, 260, "#2b6fd6"); glow(ctx, cx - 360, cy + 40, 330, "rgba(62,224,201,0.25)");
      const r = rng(s.seed);
      for (let i = 0; i < 70; i++) {
        const a = r() * Math.PI * 2, d = r() * 70 * (0.2 + k * 3.2), sz = 4 + r() * 16 * (1 - k * 0.5);
        const x = cx + 260 + Math.cos(a) * d * 1.8, y = cy + Math.sin(a) * d * 0.7;
        circle(ctx, x, y, sz, i % 3 ? "#c9c3e6" : "#9d95c9");
      }
      if (k < 0.4) circle(ctx, cx + 260, cy, 70 * (1 - k), "#d8d2f0");
      glow(ctx, cx + 260, cy, 160, "rgba(255,94,138,0.35)", k);
    },
    disk(ctx, s) {
      spaceBg(ctx, s);
      const cy = H * 0.52, tilt = lerp(0.35, 0.05, ease(s.p));
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.ellipse(W / 2, cy, 560 - i * 40, (560 - i * 40) * tilt, 0, 0, Math.PI * 2);
        ctx.lineWidth = 14; ctx.strokeStyle = i % 2 ? "rgba(255,176,59,0.85)" : "rgba(244,241,255,0.55)"; ctx.stroke();
      }
      ctx.fillStyle = SPACE.white; ctx.font = "800 44px Nunito, 'Baloo 2', sans-serif"; ctx.textAlign = "center";
      ctx.globalAlpha = clamp((s.p - 0.3) * 3); ctx.fillText(s.label || "≈ 200 m thick", W / 2, cy - 90); ctx.globalAlpha = 1;
    },
    horizon(ctx, s) {
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#151349"); sky.addColorStop(0.7, "#5a2d82"); sky.addColorStop(1, "#ff7a8a");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H); stars(ctx, s.seed, s.gt, 80, 2);
      ctx.save(); ctx.translate(W / 2, H * 0.95); ctx.rotate(-0.08);
      ctx.beginPath(); ctx.ellipse(0, -H * 0.2, W * 0.9, H * 0.85, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 10 + 4 * Math.sin(s.gt); ctx.strokeStyle = SPACE.amber; ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#1b1440"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H - 90 - 25 * Math.sin(x * 0.01 + 1)); ctx.lineTo(W, H); ctx.fill();
      for (let i = 0; i < 3; i++) blip(ctx, 380 + i * 250, H - 120 - 10 * Math.sin(s.gt * 2 + i), 34, [SPACE.pink, SPACE.teal, SPACE.amber][i], "#000", s.gt, i);
    },
    shadow(ctx, s) {
      spaceBg(ctx, s);
      const cx = W / 2, cy = H / 2 + 20, R = 250;
      circle(ctx, cx, cy, R, "#2b6fd6");
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      const r = rng(9); for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(cx + (r() - 0.5) * 380, cy + (r() - 0.5) * 380, 40 + r() * 70, 30 + r() * 40, r() * 3, 0, Math.PI * 2); ctx.fillStyle = "#3ee09a"; ctx.fill(); }
      const band = lerp(-R, R * 0.2, ease(s.p));
      ctx.fillStyle = "rgba(10,8,40,0.55)"; ctx.fillRect(cx - R, cy + band - 40, R * 2, 80);
      ctx.restore();
      glow(ctx, cx, cy, R * 1.3, "rgba(123,92,255,0.25)");
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.6, R * 0.25, -0.1, 0, Math.PI * 2); ctx.lineWidth = 10; ctx.strokeStyle = "rgba(255,176,59,0.75)"; ctx.stroke();
    },
    life(ctx, s) {
      vgrad(ctx, "#123a5c", "#0e1033");
      const r = rng(s.seed);
      for (let i = 0; i < 9; i++) { const x = (r() * W + s.gt * 15) % (W + 200) - 100, y = 200 + r() * 400; ctx.beginPath(); ctx.ellipse(x, y, 60, 20, 0.3, 0, Math.PI * 2); ctx.fillStyle = "rgba(62,224,154,0.5)"; ctx.fill(); }
      ctx.fillStyle = "#0b2a40"; ctx.fillRect(0, H - 120, W, 120);
      for (let i = 0; i < 5; i++) blip(ctx, 200 + i * 220, H - 160 - 30 * Math.abs(Math.sin(s.gt * 2.4 + i)), 40 + (i % 2) * 12, [SPACE.pink, SPACE.teal, SPACE.amber, SPACE.violet, SPACE.pink][i], "#000", s.gt, i);
      glow(ctx, W * 0.8, 120, 220, "rgba(255,176,59,0.55)", 0.6 + 0.4 * ease(s.p));
    },
    collision(ctx, s) {
      spaceBg(ctx, s);
      const k = ease(s.p), cx = W * 0.62, cy = H * 0.5;
      circle(ctx, cx, cy, 180, "#2b6fd6"); glow(ctx, cx, cy, 240, "rgba(62,224,201,0.2)");
      const ax = lerp(-80, cx - 170, k), ay = lerp(90, cy - 60, k);
      ctx.strokeStyle = "rgba(255,176,59,0.5)"; ctx.lineWidth = 18; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(ax - 140, ay - 70); ctx.lineTo(ax, ay); ctx.stroke();
      circle(ctx, ax, ay, 26, "#c9c3e6");
      if (k > 0.92) glow(ctx, cx - 170, cy - 60, 220 * (k - 0.92) * 12, "rgba(255,94,138,0.9)");
    },
    zoomout(ctx, s) {
      vgrad(ctx, SPACE.bg1, "#05061a"); stars(ctx, s.seed, s.gt, 260, 1);
      const z = lerp(1, 0.25, ease(s.p)), cx = W / 2, cy = H / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z);
      glow(ctx, -900, 0, 500, "rgba(255,176,59,0.8)"); circle(ctx, -900, 0, 160, "#ffd27a");
      circle(ctx, 0, 0, 90, "#2b6fd6");
      ctx.beginPath(); ctx.ellipse(0, 0, 200, 40, -0.2, 0, Math.PI * 2); ctx.lineWidth = 10; ctx.strokeStyle = SPACE.amber; ctx.stroke();
      ctx.restore();
    },
  };
  const SPACE_KEYS = [
    [/ring|bridge|arch/i, "rings"], [/moon|tear|piece|gravity/i, "moonbreak"], [/disk|thick|thin|meter|metre/i, "disk"],
    [/equator|line|slic|sky in two|night|look up/i, "horizon"], [/shadow|countr|north|south/i, "shadow"],
    [/plant|animal|life|season|light/i, "life"], [/collision|impact|crash|asteroid|one day/i, "collision"], [/sky over|universe|cosmos|scale|tiny/i, "zoomout"],
  ];

  // ------------------------------------------------------------------ storybook scenes (palette from the Big Buck Bunny dissection)
  // measured palette, pushed toward the measured saturation (0.35); the first render measured 0.18
  const BOOK = { peach: "#fbd6b4", sage: "#b3cf95", grass: "#78a957", leaf: "#4c7d3c", olive: "#86913d", shade: "#3f5a35", deep: "#1a2423", sky: "#9cbcee" };
  function bookSky(ctx, s, warm = 1) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, BOOK.sky); g.addColorStop(0.55, BOOK.peach); g.addColorStop(1, BOOK.sage);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const r = rng(s.seed);
    for (let i = 0; i < 4; i++) { const x = (r() * W + s.gt * 6) % (W + 300) - 150, y = 80 + r() * 160; for (let j = 0; j < 5; j++) circle(ctx, x + j * 38, y + Math.sin(j) * 12, 40 + (j % 2) * 16, "rgba(255,214,222,0.85)"); }
    glow(ctx, W * 0.82, 110, 260, "rgba(255,236,190,0.9)", warm);
  }
  function hills(ctx, y, amp, color, phase) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y - amp * Math.sin(x * 0.004 + phase)); ctx.lineTo(W, H); ctx.fill(); }
  function tree(ctx, x, y, s, c1, c2) { rrect(ctx, x - 8 * s, y - 60 * s, 16 * s, 60 * s, 4, "#6b5236"); for (let i = 0; i < 6; i++) circle(ctx, x + Math.cos(i) * 35 * s, y - 90 * s + Math.sin(i * 2) * 25 * s, 38 * s, i % 2 ? c1 : c2); }
  const bookScenes = {
    meadow(ctx, s) {
      bookSky(ctx, s); const pan = s.p * 60;
      ctx.save(); ctx.translate(-pan, 0);
      hills(ctx, H * 0.62, 30, BOOK.sage, 1); for (let i = 0; i < 6; i++) tree(ctx, 200 + i * 230, H * 0.66, 0.9 + (i % 3) * 0.25, BOOK.leaf, BOOK.grass);
      hills(ctx, H * 0.8, 20, BOOK.grass, 2.5); ctx.restore();
    },
    detail(ctx, s) {
      bookSky(ctx, s, 0.6);
      hills(ctx, H * 0.55, 60, BOOK.grass, 0.5);
      ctx.fillStyle = "#a9c7e0"; ctx.beginPath(); ctx.moveTo(W * 0.55, H); ctx.quadraticCurveTo(W * 0.7, H * 0.7, W, H * 0.6); ctx.lineTo(W, H); ctx.fill();
      const r = rng(4); for (let i = 0; i < 22; i++) { const x = r() * W * 0.6, y = H * 0.65 + r() * H * 0.3, sw = Math.sin(s.gt * 2 + i) * 4; ctx.strokeStyle = BOOK.leaf; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x + sw, y); ctx.stroke(); circle(ctx, x + sw, y, 7, i % 3 ? "#fff6f0" : "#c9a7e8"); }
    },
    sidekick(ctx, s) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#a9b8ea"); g.addColorStop(1, "#d6dcf5"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      rrect(ctx, 0, 0, 140, H, 0, "#7a6247");
      ctx.strokeStyle = "#7a6247"; ctx.lineWidth = 30; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(100, H * 0.68); ctx.quadraticCurveTo(W * 0.5, H * 0.62, W * 0.95, H * 0.5); ctx.stroke();
      const pose = Math.min(3, Math.floor(s.p * 4)); // 4 poses, about one every 1.5 s (measured gag rhythm)
      puff(ctx, W * 0.45, H * 0.53, 60, pose, s.gt);
      if (s.credit && s.p > 0.65) { ctx.globalAlpha = clamp((s.p - 0.65) * 5); ctx.fillStyle = "#fff"; ctx.font = "700 22px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText(s.credit.toUpperCase(), W / 2, H * 0.3); ctx.globalAlpha = 1; }
    },
    home(ctx, s) {
      bookSky(ctx, s);
      hills(ctx, H * 0.7, 40, BOOK.grass, 1.2);
      ctx.beginPath(); ctx.ellipse(W / 2, H * 0.72, 260, 140, 0, Math.PI, 2 * Math.PI); ctx.fillStyle = BOOK.leaf; ctx.fill();
      tree(ctx, W / 2 + 20, H * 0.6, 1.6, BOOK.leaf, BOOK.olive);
      ctx.beginPath(); ctx.ellipse(W / 2, H * 0.72, 60, 70, 0, Math.PI, 2 * Math.PI); ctx.fillStyle = BOOK.deep; ctx.fill();
      if (s.title) { ctx.globalAlpha = clamp((s.p - 0.15) * 3); ctx.fillStyle = "#fffaf2"; ctx.font = "800 96px Fredoka, 'Baloo 2', Nunito, sans-serif"; ctx.textAlign = "center"; ctx.shadowColor = "rgba(40,50,30,0.35)"; ctx.shadowBlur = 12; ctx.fillText(s.title, W / 2, H * 0.36); ctx.shadowBlur = 0; ctx.globalAlpha = 1; }
    },
    burrow(ctx, s) {
      ctx.fillStyle = BOOK.shade; ctx.fillRect(0, 0, W, H);
      const r = rng(8); for (let i = 0; i < 60; i++) { ctx.strokeStyle = i % 2 ? BOOK.grass : BOOK.olive; ctx.lineWidth = 6; const x = r() * W, y = r() * H; ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.lineTo(x + 10, y); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(W / 2, H * 0.62, 330, 260, 0, 0, Math.PI * 2); ctx.fillStyle = BOOK.deep; ctx.fill();
      const k = clamp((s.p - 0.72) / 0.25); // emerges late in the shot, as in the source (reveal at ~73% of the shot)
      if (s.p > 0.35) moss(ctx, W / 2, H * 0.75 - k * 60, 150, 0, s.gt, k > 0.6 ? 1 : 0);
    },
    hero(ctx, s) {
      bookSky(ctx, s);
      hills(ctx, H * 0.72, 30, BOOK.grass, 0.3);
      tree(ctx, 160, H * 0.72, 1.3, BOOK.leaf, BOOK.grass);
      moss(ctx, W * 0.5, H * 0.66, 120, Math.max(0, Math.sin(s.p * Math.PI * 2)), s.gt, 1);
    },
    lowangle(ctx, s) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#8fb2e6"); g.addColorStop(1, "#cfdcf3"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) circle(ctx, 100 + i * 50, 120 + i * 20, 50, "rgba(255,255,255,0.8)");
      tree(ctx, W - 80, 260, 1.4, BOOK.leaf, BOOK.grass);
      moss(ctx, W / 2, H + 120 - ease(s.p) * 260, 260, 0.2, s.gt, 1);
    },
  };

  // ------------------------------------------------------------------ fixed-camera scenes (palettes from the four Intel dissections)
  function grain(ctx, frame, amount) {
    if (!amount) return;
    const r = rng(frame * 9973 + 1);
    ctx.save(); ctx.globalAlpha = amount;
    for (let i = 0; i < 900; i++) { const v = Math.floor(r() * 255); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(r() * W, r() * H, 2, 2); }
    ctx.restore();
  }
  function hud(ctx, s, cam) {
    ctx.font = "600 20px 'IBM Plex Mono', ui-monospace, monospace"; ctx.textAlign = "left";
    const secs = Math.floor(s.gt), ts = `2026-10-04 09:${String(12 + Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(16, 16, 470, 34);
    ctx.fillStyle = "#e8e8e8"; ctx.fillText(`${cam}  ${ts}`, 26, 40);
    if (Math.floor(s.gt * 2) % 2 === 0) circle(ctx, W - 40, 34, 9, "#e5484d");
  }
  function box(ctx, x, y, w, h, label, color = "#3ee07a") {
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.strokeRect(x, y, w, h);
    ctx.font = "600 15px 'IBM Plex Mono', monospace"; const tw = ctx.measureText(label).width + 10;
    ctx.fillStyle = color; ctx.fillRect(x - 1, y - 21, tw, 20); ctx.fillStyle = "#06120a"; ctx.textAlign = "left"; ctx.fillText(label, x + 4, y - 6);
  }
  const SHIRTS = ["#2f3d5c", "#6b6f3a", "#3f7f7a", "#7a4b34", "#5d5d63", "#8a8f99", "#2b2b30", "#9b8f7a"];
  function eventsActive(s) { return (s.events || []).map((e, i) => ({ ...e, i, k: (s.gt - e.start) / (e.end - e.start) })).filter((e) => e.k >= 0 && e.k <= 1); }

  const fixedScenes = {
    room(ctx, s) { // high corner angle, cool blue furniture (classroom palette)
      ctx.fillStyle = "#c1c7c8"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#a4a9ab"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W * 0.78, H * 0.38); ctx.lineTo(W * 0.1, H * 0.38); ctx.fill();
      ctx.fillStyle = "#faf9f9"; ctx.beginPath(); ctx.moveTo(W * 0.86, H * 0.05); ctx.lineTo(W, 0); ctx.lineTo(W, H * 0.75); ctx.lineTo(W * 0.86, H * 0.55); ctx.fill();
      ctx.fillStyle = "#3e4f63"; ctx.beginPath(); ctx.moveTo(0, H * 0.45); ctx.lineTo(W * 0.1, H * 0.38); ctx.lineTo(W * 0.82, H * 0.38); ctx.lineTo(W, H * 0.8); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      for (let row = 0; row < 3; row++) for (let c = 0; c < 4; c++) {
        const y = H * (0.48 + row * 0.16), sc = 0.7 + row * 0.25, x = W * (0.12 + c * 0.2) + row * 20;
        rrect(ctx, x, y, 150 * sc, 38 * sc, 4, "#e6e9ea"); rrect(ctx, x + 20 * sc, y - 34 * sc, 40 * sc, 34 * sc, 6, "#24466e"); rrect(ctx, x + 85 * sc, y - 34 * sc, 40 * sc, 34 * sc, 6, "#24466e");
      }
      const seated = [[W * 0.2, H * 0.5, 0.75], [W * 0.42, H * 0.5, 0.75], [W * 0.25, H * 0.66, 0.95]];
      seated.forEach(([x, y, sc], i) => person(ctx, x, y, sc, SHIRTS[i + 3], "#33363d", s.gt, false, 1));
      for (const e of eventsActive(s)) {
        const k = e.k, x = lerp(W * 0.62, W * 0.78, Math.sin(k * Math.PI)), y = H * 0.66, standing = k > 0.12 && k < 0.85;
        person(ctx, x, standing ? y : y - 10, standing ? 1.05 : 0.95, SHIRTS[e.i % SHIRTS.length], "#2c3138", s.gt, standing && k > 0.2 && k < 0.75, 1);
        if (s.boxes) box(ctx, x - 30, y - 125, 60, 125, `person 0.9${e.i % 9}`);
      }
      grain(ctx, s.frame, 0.05); hud(ctx, s, s.cam || "CAM 01");
    },
    aisle(ctx, s) { // overhead one-point perspective, warm grey (store-aisle palette)
      ctx.fillStyle = "#8a8b88"; ctx.fillRect(0, 0, W, H);
      const vx = W * 0.47, vy = H * 0.02;
      ctx.fillStyle = "#a39b90"; ctx.beginPath(); ctx.moveTo(W * 0.32, H); ctx.lineTo(vx - 30, vy); ctx.lineTo(vx + 30, vy); ctx.lineTo(W * 0.78, H); ctx.fill();
      const item = s.variant === "bread" ? ["#c98f4f", "#e0b07a"] : s.variant === "books" ? ["#7a4b5c", "#4f6b8a"] : ["#dad8d4", "#bbb8b3"];
      for (let side = 0; side < 2; side++) for (let i = 0; i < 26; i++) {
        const k = i / 26, y = lerp(H, vy + 20, k), x0 = side ? lerp(W * 0.78, vx + 30, k) : lerp(W * 0.32, vx - 30, k), w = lerp(200, 20, k) * (side ? 1 : -1);
        ctx.fillStyle = "#565248"; ctx.fillRect(Math.min(x0, x0 + w), y - lerp(26, 3, k), Math.abs(w), lerp(26, 3, k));
        for (let j = 0; j < 4; j++) { const xx = x0 + w * (j + 0.5) / 4; circle(ctx, xx, y - lerp(14, 2, k), lerp(14, 2, k), item[(i + j) % 2]); }
      }
      for (let i = 0; i < 12; i++) { const k = i / 12, y = lerp(H * 0.95, vy + 30, k); for (let j = -2; j <= 2; j++) circle(ctx, vx + j * lerp(30, 3, k) * 1.4, y, lerp(16, 2, k), item[(i + j + 5) % 2]); }
      for (const e of eventsActive(s)) {
        const k = e.k, lane = e.i % 2 ? 0.62 : 0.4, depth = Math.sin(k * Math.PI) * 0.55, y = lerp(H * 1.08, H * 0.35, depth), sc = lerp(1.25, 0.45, depth);
        const x = lerp(W * lane, vx + (lane - 0.5) * 120, depth);
        person(ctx, x, y, sc, SHIRTS[(e.i + 2) % SHIRTS.length], "#2c3138", s.gt + e.i, true, 0);
        if (s.boxes) box(ctx, x - 26 * sc, y - 115 * sc, 52 * sc, 115 * sc, `person 0.8${(e.i * 3) % 10}`);
      }
      grain(ctx, s.frame, 0.06); hud(ctx, s, s.cam || "CAM 03");
    },
    corridor(ctx, s) { // eye-level corridor, near-neutral (corridor palette), walk-ups with hidden jump cuts
      ctx.fillStyle = "#8f8d8f"; ctx.fillRect(0, 0, W, H);
      const vx = W * 0.5, vy = H * 0.45;
      ctx.fillStyle = "#b4b9c4"; ctx.beginPath(); ctx.moveTo(W * 0.62, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(W * 0.62, H); ctx.fill();
      ctx.fillStyle = "#6d7073"; ctx.fillRect(W * 0.72, H * 0.12, 18, H * 0.88);
      ctx.fillStyle = "rgba(120,140,150,0.35)"; ctx.fillRect(W * 0.74, H * 0.12, W * 0.2, H * 0.88);
      ctx.fillStyle = "#8a7366"; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(vx - 120, vy + 120); ctx.lineTo(vx + 120, vy + 120); ctx.lineTo(W * 0.62, H); ctx.fill();
      rrect(ctx, W * 0.27, H * 0.2, 90, 240, 4, "#625f61"); rrect(ctx, W * 0.275, H * 0.21, 80, 230, 4, "#8fa1a6");
      ctx.beginPath(); ctx.ellipse(W * 0.48, H * 0.12, 50, 9, 0, 0, Math.PI * 2); ctx.fillStyle = "#fbfbfb"; ctx.fill();
      for (const e of eventsActive(s)) {
        const walk = clamp(e.k / 0.45), sc = lerp(0.6, 6.5, ease(walk) ** 1.6), x = W * 0.48 + (e.i % 2 ? 30 : -20) * (1 - walk), y = lerp(H * 0.62, H * 1.35, ease(walk));
        person(ctx, x, y, sc, SHIRTS[(e.i + 1) % SHIRTS.length], "#2c3138", s.gt, walk < 1, 1);
        if (s.boxes && walk > 0.5) box(ctx, x - 14 * sc, y - 108 * sc, 28 * sc, 28 * sc, `face 0.9${e.i}`, "#ffb03b");
      }
      grain(ctx, s.frame, 0.05); hud(ctx, s, s.cam || "CAM 02");
    },
    lot(ctx, s) { // near-overhead lot, saturation ~0.02 (parking-lot palette)
      ctx.fillStyle = "#8a8a8d"; ctx.fillRect(0, 0, W, H);
      const r = rng(5); for (let i = 0; i < 40; i++) { ctx.fillStyle = "rgba(60,60,64,0.12)"; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 30 + r() * 80, 10 + r() * 30, r() * 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = "#ececee"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.28); ctx.lineTo(W * 0.32, H * 0.05); ctx.lineTo(W, H * 0.08); ctx.stroke();
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(W * (0.42 + i * 0.1), H * 0.06); ctx.lineTo(W * (0.36 + i * 0.1), H * 0.36); ctx.stroke(); }
      const kinds = ["person", "car", "bicycle"];
      for (const e of eventsActive(s)) {
        const kind = kinds[e.i % 3], k = e.k;
        if (kind === "car") {
          const x = lerp(-120, W + 120, k), y = H * 0.7 - Math.sin(k * Math.PI) * 140;
          ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35 * Math.cos(k * Math.PI)); rrect(ctx, -75, -38, 150, 76, 22, "#f2f2f4"); rrect(ctx, -35, -30, 70, 60, 10, "#3a3c44"); ctx.restore();
          if (s.boxes) box(ctx, x - 85, y - 55, 170, 110, "car 0.97", "#3ee0c9");
        } else if (kind === "bicycle") {
          const x = lerp(W * 0.9, W * 0.55, k), y = lerp(H * 0.05, H * 0.55, k);
          ctx.strokeStyle = "#d8d8dc"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x - 14, y + 10, 11, 0, 7); ctx.arc(x + 14, y + 10, 11, 0, 7); ctx.stroke(); person(ctx, x, y + 6, 0.35, "#2f3d5c", "#222", s.gt, false);
          if (s.boxes) box(ctx, x - 30, y - 34, 60, 58, "bicycle 0.88", "#ffb03b");
        } else {
          const x = lerp(W * 0.62, W * 1.02, k), y = lerp(H * 0.95, H * 0.25, k);
          person(ctx, x, y, 0.42, "#2f3d5c", "#5c6670", s.gt, true);
          if (s.boxes) box(ctx, x - 14, y - 48, 28, 50, "person 0.93");
        }
      }
      grain(ctx, s.frame, 0.04); hud(ctx, s, s.cam || "CAM 04");
    },
  };

  // ------------------------------------------------------------------ presets (targets copied from the blueprints)
  const PRESETS = {
    "flat-space": {
      name: "Flat-vector science explainer", source: "flat-space-explainer", measured: false, mode: "narrated",
      wpm: 160, asl: 4.5, transition: "cut", tDur: 0.4, gap: 0.35, lead: 0.4, tail: 1.5, music: "pad", captions: false,
      targets: { avgShot: "3–6 s (inferred)", saturation: "high (inferred)", brightness: "dark (inferred)", transitions: "camera moves and quick crossfades" },
      palette: [SPACE.bg1, SPACE.bg2, SPACE.pink, SPACE.amber, SPACE.teal, SPACE.violet],
      scenes: spaceScenes, keys: SPACE_KEYS, order: ["rings", "moonbreak", "disk", "horizon", "shadow", "life", "collision", "zoomout"],
      sample: { topic: "What if Earth had rings?", lines: [
        "Imagine looking up at night and seeing a glowing bridge of ice arching across the sky.",
        "Earth almost had rings like this, and it still might one day.",
        "A ring is born when a moon wanders too close and gravity tears it into billions of pieces.",
        "Those pieces spread into a disk that is wide but astonishingly thin.",
        "From the equator, the ring would be a razor-thin line slicing the sky in two.",
        "Further north, it would cast a shadow belt across entire countries.",
        "Seasons would shift, and so would the light that plants and animals depend on.",
        "One collision could rewrite the sky over our heads.",
      ] },
    },
    storybook: {
      name: "Storybook cold open", source: "big_buck_bunny", measured: true, mode: "beats",
      transition: "dissolve", tDur: 1.2, music: "pastoral", captions: false,
      targets: { avgShot: 10.0, shots: 6, saturation: 0.35, brightness: 0.52, transitions: "fade-in, dissolves, hard cuts on character beats" },
      palette: [BOOK.peach, BOOK.sage, BOOK.grass, BOOK.leaf, BOOK.olive, BOOK.deep],
      scenes: bookScenes,
      // measured beat durations (s), scaled by `scale`
      beats: [["meadow", 11.9], ["detail", 3.8], ["sidekick", 7.3], ["home", 9.7], ["burrow", 15.0], ["hero", 8.3], ["lowangle", 4.1]],
      cutAfter: { detail: "cut", sidekick: "cut", home: "dissolve", burrow: "cut", hero: "cut" },
      sample: { topic: "Moss wakes up for spring", title: "MOSS", credit: "A small studio presents", lines: [
        "A quiet meadow at dawn", "Wildflowers by the stream", "Puff the sidekick rehearses a big hello", "Moss's hill, with the title",
        "Something stirs inside the burrow", "Moss stretches in the sun", "Moss rises against the sky"] },
    },
    "fixed-classroom": {
      name: "Fixed-cam classroom", source: "classroom", measured: true, mode: "events", scene: "room", eventDur: 13, eventGap: 3, lead: 4, tail: 6,
      transition: "none", music: "none", boxes: true, cam: "CAM 01 · LIBRARY",
      targets: { avgShot: 32.8, shots: 1, saturation: 0.24, brightness: 0.51, transitions: "none" },
      palette: ["#faf9f9", "#c1c7c8", "#a4a9ab", "#525d65", "#1f354c", "#091d37"], scenes: fixedScenes,
      sample: { topic: "Library study hall", lines: ["A student gets up to fetch a book and sits back down", "A second student stretches, walks over and returns"] },
    },
    "fixed-aisle": {
      name: "Fixed-cam store aisle", source: "store-aisle-detection", measured: true, mode: "events", scene: "aisle", eventDur: 16, eventGap: -9, lead: 5, tail: 6, variant: "bread",
      transition: "none", music: "none", boxes: true, cam: "CAM 03 · BAKERY",
      targets: { avgShot: 65.4, shots: 1, saturation: 0.14, brightness: 0.52, transitions: "none" },
      palette: ["#dad8d4", "#bbb8b3", "#a8a39a", "#878077", "#565248", "#2d2723"], scenes: fixedScenes,
      sample: { topic: "Bakery aisle rush", lines: ["Shopper one browses the loaves", "Shopper two reaches for rolls", "A couple compares baguettes", "A late shopper squeezes past", "The aisle empties out"] },
    },
    "fixed-corridor": {
      name: "Fixed-cam corridor walk-up", source: "face-demographics-walking-and-pause", measured: true, mode: "events", scene: "corridor", eventDur: 14, eventGap: 0.05, lead: 3, tail: 3,
      transition: "jump", music: "none", boxes: true, cam: "CAM 02 · LOBBY",
      targets: { avgShot: 90.9, shots: 1, saturation: 0.11, brightness: 0.51, transitions: "hidden jump cuts while the frame empties" },
      palette: ["#cacfd9", "#a3a3a5", "#9a9494", "#6d7073", "#625f61", "#423b3e"], scenes: fixedScenes,
      sample: { topic: "Office lobby check-ins", lines: ["A visitor walks up and pauses at the kiosk", "A courier walks up and waits", "A colleague walks up, checks in and leaves"] },
    },
    "fixed-lot": {
      name: "Fixed-cam parking lot", source: "person-bicycle-car-detection", measured: true, mode: "events", scene: "lot", eventDur: 6, eventGap: 6, lead: 1, tail: 8,
      transition: "none", music: "none", boxes: true, cam: "CAM 04 · CAMPUS",
      targets: { avgShot: 53.9, shots: 1, saturation: 0.02, brightness: 0.53, transitions: "none" },
      palette: ["#959599", "#8c8b8f", "#8a8a8d", "#848487", "#818184", "#78787b"], scenes: fixedScenes,
      sample: { topic: "Campus plaza crossings", lines: ["A student crosses toward the library", "A delivery van sweeps through", "A cyclist cuts across the top"] },
    },
  };

  // ------------------------------------------------------------------ timeline
  function pickSpaceScene(P, text, prev, i) {
    for (const [re, sc] of P.keys) if (re.test(text) && sc !== prev) return sc;
    let sc = P.order[i % P.order.length]; if (sc === prev) sc = P.order[(i + 1) % P.order.length]; return sc;
  }
  function buildTimeline(id, opts = {}) {
    const P = PRESETS[id];
    if (P.build) return P.build(opts); // presets with their own script and timeline (fermi.js)
    const lines = (opts.lines && opts.lines.length ? opts.lines : P.sample.lines).map((l) => l.trim()).filter(Boolean);
    const tl = { preset: id, topic: opts.topic || P.sample.topic, lines: [], shots: [], events: [], duration: 0, title: opts.title ?? P.sample.title, credit: P.sample.credit };
    if (P.mode === "narrated") {
      const wpm = opts.wpm || P.wpm, asl = opts.asl || P.asl;
      let t = P.lead;
      for (const text of lines) { const n = text.split(/\s+/).length, d = Math.max(1.5, (n / wpm) * 60); tl.lines.push({ text, start: t, end: t + d }); t += d + P.gap; }
      tl.duration = t + P.tail;
      let prev = null, k = 0;
      tl.lines.forEach((ln, i) => {
        const s0 = i === 0 ? 0 : ln.start - P.gap / 2, s1 = i === tl.lines.length - 1 ? tl.duration : ln.end + P.gap / 2;
        const n = Math.max(1, Math.round((s1 - s0) / asl));
        for (let j = 0; j < n; j++) {
          const scene = j === 0 ? pickSpaceScene(P, ln.text, prev, k) : P.order[(P.order.indexOf(prev) + 3) % P.order.length];
          const num = (ln.text.match(/\d[\d,.]*\s*\w*/) || [])[0];
          // mostly hard cuts; every third change is a quick zoom-through
          tl.shots.push({ start: s0 + (s1 - s0) * j / n, end: s0 + (s1 - s0) * (j + 1) / n, scene, seed: hash(ln.text + j), label: num, line: i, cut: k % 3 === 2 ? "zoom" : "cut" });
          prev = scene; k++;
        }
      });
    } else if (P.mode === "beats") {
      const scale = opts.scale || 1.0; let t = 0; // scale 1.0 = the measured shot lengths
      P.beats.forEach(([scene, d], i) => { tl.shots.push({ start: t, end: t + d * scale, scene, seed: 11 + i, line: i, cut: P.cutAfter[scene] || "cut" }); t += d * scale; });
      tl.duration = t;
      tl.lines = tl.shots.map((s, i) => ({ text: lines[i] || "", start: s.start, end: s.end }));
    } else {
      let t = P.lead;
      lines.forEach((text, i) => { tl.events.push({ text, start: t, end: t + P.eventDur }); t += P.eventDur + P.eventGap; });
      tl.duration = Math.max(t + P.tail, tl.events.length ? tl.events[tl.events.length - 1].end + P.tail : 20);
      tl.shots.push({ start: 0, end: tl.duration, scene: P.scene, seed: 3, line: 0 });
      tl.lines = tl.events.map((e) => ({ text: e.text, start: e.start, end: e.end }));
    }
    tl.captions = opts.captions ?? P.captions; tl.boxes = opts.boxes ?? P.boxes;
    return tl;
  }

  // ------------------------------------------------------------------ rendering
  let scratch = null;
  function scratchCtx() {
    if (!scratch) { scratch = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H }); }
    const c = scratch.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); return [scratch, c];
  }
  function drawShot(ctx, tl, shot, t, frame) {
    const P = PRESETS[tl.preset];
    const s = { p: clamp((t - shot.start) / (shot.end - shot.start)), gt: t, seed: shot.seed, scene: shot.scene, label: shot.label, title: tl.title, credit: tl.credit,
      events: tl.events, boxes: tl.boxes, frame, cam: P.cam, variant: P.variant, _shot: shot };
    ctx.save(); P.scenes[shot.scene](ctx, s); ctx.restore();
  }
  function renderAt(ctx, tl, t, frame = Math.round(t * 30)) {
    const P = PRESETS[tl.preset];
    ctx.save(); ctx.setTransform(ctx.canvas.width / W, 0, 0, ctx.canvas.height / H, 0, 0);
    let i = tl.shots.findIndex((s) => t >= s.start && t < s.end); if (i < 0) i = tl.shots.length - 1;
    const shot = tl.shots[i];
    drawShot(ctx, tl, shot, t, frame);
    // transitions into this shot
    const prevShot = tl.shots[i - 1];
    const kind = prevShot ? (prevShot.cut || P.transition) : null;
    const td = kind === "dissolve" ? P.tDur : kind === "zoom" ? P.tDur : 0;
    if (prevShot && td && t - shot.start < td) {
      const k = (t - shot.start) / td, [cv, c2] = scratchCtx();
      drawShot(c2, tl, prevShot, t, frame);
      ctx.save(); ctx.globalAlpha = 1 - ease(k);
      if (kind === "zoom") { const z = 1 + 0.25 * ease(k); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); }
      ctx.drawImage(cv, 0, 0, W, H); ctx.restore();
    }
    // fade from black at the very start (storybook hook)
    if (P.mode === "beats" && t < 2) { ctx.fillStyle = `rgba(0,0,0,${1 - ease(t / 2)})`; ctx.fillRect(0, 0, W, H); }
    // subtitles
    if (tl.captions) {
      const ln = tl.lines.find((l) => t >= l.start && t <= l.end && l.text);
      const cs = tl.captionStyle || {};
      if (ln && cs.chunk) { // punchy word-by-word captions, current word highlighted
        const words = ln.text.split(/\s+/), k = (t - ln.start) / Math.max(0.01, ln.end - ln.start), wi = Math.min(words.length - 1, Math.floor(k * words.length));
        const from = Math.floor(wi / cs.chunk) * cs.chunk, chunk = words.slice(from, from + cs.chunk);
        ctx.save(); ctx.font = (cs.font ? `${cs.font.split(" ")[0]} 58px ${cs.font.split(" ").slice(1).join(" ")}` : "900 58px Nunito, sans-serif"); ctx.textBaseline = "middle"; ctx.textAlign = "left";
        const txt = chunk.map((w) => (cs.upper ? w.toUpperCase() : w)), sp = ctx.measureText(" ").width, total = txt.reduce((a, w) => a + ctx.measureText(w).width, 0) + sp * (txt.length - 1);
        let x = W / 2 - total / 2; const y = cs.position === "center" ? H * 0.78 : H - 80;
        txt.forEach((w, j) => { const ww = ctx.measureText(w).width, cur = from + j === wi;
          ctx.lineWidth = 10; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.strokeText(w, x, y);
          ctx.fillStyle = cur ? (cs.highlight || "#ffd400") : "#ffffff"; ctx.save(); if (cur) { ctx.translate(x + ww / 2, y); ctx.scale(1.08, 1.08); ctx.translate(-(x + ww / 2), -y); } ctx.fillText(w, x, y); ctx.restore();
          x += ww + sp; });
        ctx.restore();
      } else if (ln) {
        ctx.font = "800 30px Nunito, 'Baloo 2', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        const rows = wrapText(ctx, ln.text, W * 0.7), k = Math.min(1, (t - ln.start) / 0.2, (ln.end - t) / 0.2);
        ctx.save(); ctx.globalAlpha = Math.max(0, k);
        const sg = ctx.createLinearGradient(0, H - 70 - rows.length * 40, 0, H); sg.addColorStop(0, "rgba(5,5,20,0)"); sg.addColorStop(1, "rgba(5,5,20,0.55)");
        ctx.fillStyle = sg; ctx.fillRect(0, H - 70 - rows.length * 40, W, 70 + rows.length * 40);
        rows.forEach((row, j) => { const y = H - 46 - (rows.length - 1 - j) * 40; ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2; ctx.fillStyle = "#fff"; ctx.fillText(row, W / 2, y); });
        ctx.restore();
      }
    }
    ctx.restore();
  }
  // cut and transition times, for the audio track and for checking against the blueprint
  function cutTimes(tl) {
    const P = PRESETS[tl.preset];
    const out = tl.shots.slice(1).map((s, i) => ({ t: s.start, kind: tl.shots[i].cut || P.transition }));
    if (P.transition === "jump") tl.events.slice(1).forEach((e) => out.push({ t: e.start, kind: "jump" }));
    return out;
  }

  root.DissectEngine = { W, H, PRESETS, buildTimeline, renderAt, cutTimes };
})(typeof window !== "undefined" ? window : globalThis);
