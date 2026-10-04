/* Fermi Paradox: a flat-vector science explainer built on DissectEngine.
 * Original script, characters and illustrations. Load after engine.js.
 * Style rules (flat-vector explainer genre): flat shapes with no outlines, a hard-edged shadow and a thin
 * rim highlight on every round object, soft glows on light sources, deep gradient skies with nebulae and
 * sparkle stars, constant slow camera motion, a new composition every ~4–6 s.
 */
(function () {
  const E = window.DissectEngine || globalThis.DissectEngine;
  const W = 1280, H = 720;
  const C = {
    night1: "#0a0d2c", night2: "#1d1450", dusk: "#5a2a78", pink: "#ff5d8f", amber: "#ffb340", teal: "#33e0c8",
    violet: "#8a63ff", blue: "#3d7bff", white: "#f6f3ff", red: "#ff4d5e", green: "#5ee38a", ink: "#140f33",
  };
  const FONT_TITLE = "800 {px}px 'Baloo 2', 'Nunito', 'Arial Rounded MT Bold', sans-serif";
  const FONT_LABEL = "900 {px}px Nunito, 'Baloo 2', 'Arial Rounded MT Bold', sans-serif";
  const font = (f, px) => f.replace("{px}", px);

  // ---------------------------------------------------------------- helpers
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (k) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(k));
  const pop = (k) => { k = clamp(k); return k < 1 ? 1 - Math.pow(1 - k, 3) * Math.cos(k * 7) : 1; }; // overshoot pop-in
  const appear = (s, at, dur = 0.45) => clamp((s.lt - at) / dur);
  function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
  function glow(ctx, x, y, r, color, alpha = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
  }
  function camera(ctx, s, z0, z1, dx = 0, dy = 0) {
    const k = ease(s.p), z = lerp(z0, z1, k);
    ctx.translate(W / 2 + dx * k, H / 2 + dy * k); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  }
  function sparkle(ctx, x, y, r, color, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); ctx.restore();
  }
  function sky(ctx, s, top = C.night1, bottom = C.night2, opts = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
    const r = rng(opts.seed || 7);
    // nebulae: big soft clouds
    ctx.save(); ctx.filter = "blur(40px)"; ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < (opts.nebulae ?? 4); i++) {
      ctx.globalAlpha = 0.16 + r() * 0.12; ctx.fillStyle = [C.violet, C.pink, C.teal, C.blue][i % 4];
      ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 180 + r() * 220, 90 + r() * 120, r() * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < (opts.stars ?? 220); i++) {
      const x = r() * W, y = r() * H, sz = r() < 0.9 ? 0.6 + r() * 1.2 : 1.8 + r(), tw = 0.55 + 0.45 * Math.sin(s.gt * (0.6 + r() * 2) + i);
      ctx.globalAlpha = tw; circle(ctx, x, y, sz, C.white);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < (opts.sparkles ?? 7); i++) { const x = r() * W, y = r() * H * 0.8; sparkle(ctx, x, y, 6 + r() * 7, C.white, 0.5 + 0.5 * Math.sin(s.gt * 1.7 + i * 2)); glow(ctx, x, y, 22, "rgba(246,243,255,0.5)", 0.6); }
  }
  // flat sphere: base, details, hard-edged shadow crescent, thin rim highlight
  function sphere(ctx, x, y, r, o) {
    if (o.atmo) glow(ctx, x, y, r * 1.45, o.atmo, o.atmoAlpha ?? 0.6);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = o.base; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    if (o.bands) o.bands.forEach(([yy, hh, col]) => { ctx.fillStyle = col; ctx.fillRect(x - r, y + yy * r, 2 * r, hh * r); });
    if (o.land) { const q = rng(o.seed || 3), ls = o.land.size || 1; for (let i = 0; i < o.land.n; i++) { const cx = x + (q() - 0.5) * 1.6 * r, cy = y + (q() - 0.5) * 1.5 * r, a = q() * 3; ctx.fillStyle = o.land.color;
      for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.ellipse(cx + (q() - 0.5) * r * 0.25 * ls, cy + (q() - 0.5) * r * 0.2 * ls, r * (0.08 + q() * 0.14) * ls, r * (0.05 + q() * 0.09) * ls, a, 0, Math.PI * 2); ctx.fill(); } } }
    if (o.lights) { const q = rng(11); for (let i = 0; i < 60; i++) { const a = q() * Math.PI * 2, d = Math.sqrt(q()) * r; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if ((px - x) * (o.lx ?? -1) < -r * 0.15) circle(ctx, px, py, 1.4 + q() * 1.6, "#ffd36b"); } }
    const lx = o.lx ?? -0.7, ly = o.ly ?? -0.7;
    const so = o.so ?? 0.42;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x + lx * r * so, y + ly * r * so, r * 1.08, 0, Math.PI * 2);
    ctx.fillStyle = o.shadow || "rgba(10,8,40,0.5)"; ctx.fill("evenodd");
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x - lx * r * 0.06, y - ly * r * 0.06, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fill("evenodd");
    ctx.restore();
  }
  function sun(ctx, x, y, r, t, color = "#ffcf5a") {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    glow(ctx, x, y, r * 6, "rgba(255,160,60,0.45)"); glow(ctx, x, y, r * 3, "rgba(255,210,120,0.6)");
    ctx.restore();
    for (let i = 3; i >= 1; i--) circle(ctx, x, y, r * (1 + i * 0.18 + 0.03 * Math.sin(t * 2 + i)), `rgba(255,200,90,${0.12 * (4 - i)})`);
    circle(ctx, x, y, r, color); circle(ctx, x - r * 0.25, y - r * 0.25, r * 0.55, "#fff1c4");
  }
  const GALAXY = {};
  function galaxy(ctx, x, y, R, t, o = {}) {
    const key = o.seed || 1;
    if (!GALAXY[key]) {
      const q = rng(key), pts = [];
      for (let i = 0; i < 2600; i++) {
        const arm = i % 2, d = Math.pow(q(), 0.65), th = arm * Math.PI + d * 3.4 * Math.PI + (q() - 0.5) * (0.9 - d * 0.4);
        const col = d < 0.18 ? "#fff1d8" : d < 0.5 ? (q() < 0.5 ? "#ffc0d4" : "#ffe2a8") : (q() < 0.5 ? "#9cc2ff" : "#c3a6ff");
        pts.push([d, th, col, 0.6 + q() * (d < 0.2 ? 2.4 : 1.6), q()]);
      }
      GALAXY[key] = pts;
    }
    const tilt = o.tilt ?? 0.55, rot = (o.rot ?? 0) + t * 0.04, lit = o.lit;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    glow(ctx, x, y, R * 1.1, "rgba(138,99,255,0.35)"); glow(ctx, x, y, R * 0.45, "rgba(255,214,160,0.75)");
    for (const [d, th, col, sz, k] of GALAXY[key]) {
      const a = th + rot, px = x + Math.cos(a) * d * R, py = y + Math.sin(a) * d * R * tilt;
      ctx.globalAlpha = o.dim ?? 0.85; circle(ctx, px, py, sz, col);
      if (lit && lit(d, th, k)) { ctx.globalAlpha = 1; circle(ctx, px, py, sz + 2.2, lit.color || C.teal); glow(ctx, px, py, 10, lit.glow || "rgba(51,224,200,0.8)"); }
    }
    ctx.restore();
  }
  // Blip: original round critter with a leaf tuft. mood: neutral | happy | worried | wonder
  function blip(ctx, x, y, r, o = {}) {
    const t = o.t || 0, body = o.body || C.teal, dark = o.dark || "#1a9c8e", bob = Math.sin(t * 3) * r * 0.03;
    ctx.save(); ctx.translate(x, y + bob);
    ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(0, r * 0.98, r * 0.8, r * 0.14, 0, 0, Math.PI * 2); ctx.fillStyle = "#000"; ctx.fill(); ctx.globalAlpha = 1;
    circle(ctx, -r * 0.4, r * 0.88, r * 0.22, dark); circle(ctx, r * 0.4, r * 0.88, r * 0.22, dark);
    // tuft
    ctx.save(); ctx.translate(r * 0.1, -r * 0.95); ctx.rotate(0.35 + Math.sin(t * 2) * 0.08);
    ctx.beginPath(); ctx.ellipse(0, -r * 0.18, r * 0.13, r * 0.26, 0, 0, Math.PI * 2); ctx.fillStyle = C.green; ctx.fill(); ctx.restore();
    sphere(ctx, 0, 0, r, { base: body, shadow: "rgba(8,40,60,0.35)", lx: -0.6, ly: -0.8 });
    // arms
    ctx.strokeStyle = dark; ctx.lineWidth = r * 0.16; ctx.lineCap = "round";
    if (o.mood === "shrug") { ctx.beginPath(); ctx.moveTo(-r * 0.9, r * 0.1); ctx.quadraticCurveTo(-r * 1.25, -r * 0.05, -r * 1.3, -r * 0.35); ctx.moveTo(r * 0.9, r * 0.1); ctx.quadraticCurveTo(r * 1.25, -r * 0.05, r * 1.3, -r * 0.35); ctx.stroke(); }
    else if (o.mood === "wave") { ctx.beginPath(); ctx.moveTo(r * 0.9, 0); ctx.lineTo(r * 1.3, -r * (0.5 + 0.15 * Math.sin(t * 8))); ctx.stroke(); }
    // eyes
    const lk = o.look || [0, 0], ey = -r * 0.12;
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(sx * r * 0.32, ey, r * 0.2, r * 0.25, 0, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
      const blink = Math.sin(t * 1.1 + 3) > 0.985 ? 0.15 : 1;
      ctx.save(); ctx.translate(sx * r * 0.32 + lk[0] * r * 0.08, ey + lk[1] * r * 0.1); ctx.scale(1, blink);
      circle(ctx, 0, 0, r * 0.11, C.ink); circle(ctx, -r * 0.035, -r * 0.04, r * 0.035, "#fff"); ctx.restore();
    }
    ctx.strokeStyle = C.ink; ctx.lineWidth = r * 0.06;
    if (o.mood === "worried") { ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.5); ctx.lineTo(-r * 0.18, -r * 0.42); ctx.moveTo(r * 0.5, -r * 0.5); ctx.lineTo(r * 0.18, -r * 0.42); ctx.stroke(); }
    if (o.mood === "happy" || o.mood === "wave") { ctx.beginPath(); ctx.arc(0, r * 0.22, r * 0.18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    else if (o.mood === "wonder" || o.mood === "shrug") { circle(ctx, 0, r * 0.3, r * 0.08, C.ink); }
    else if (o.mood === "worried") { ctx.beginPath(); ctx.arc(0, r * 0.42, r * 0.14, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
    ctx.restore();
  }
  function label(ctx, text, x, y, px, k = 1, color = C.white) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); const sc = pop(k); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 2);
    ctx.font = font(FONT_LABEL, px); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(10,8,40,0.35)"; ctx.fillText(text, 3, 4); ctx.fillStyle = color; ctx.fillText(text, 0, 0); ctx.restore();
  }
  function hill(ctx, s, color = "#120b2a") {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-50, H + 10); ctx.quadraticCurveTo(W * 0.25, H * 0.66, W * 0.55, H * 0.78); ctx.quadraticCurveTo(W * 0.8, H * 0.88, W + 50, H * 0.8); ctx.lineTo(W + 50, H + 10); ctx.fill();
    ctx.strokeStyle = "rgba(255,93,143,0.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-50, H + 10); ctx.quadraticCurveTo(W * 0.25, H * 0.66, W * 0.55, H * 0.78); ctx.stroke();
    // lollipop trees
    for (const [x, sc] of [[W * 0.78, 1], [W * 0.86, 0.75]]) { ctx.fillStyle = color; ctx.fillRect(x - 4 * sc, H * 0.7, 8 * sc, 90); circle(ctx, x, H * 0.69, 34 * sc, color); circle(ctx, x - 20 * sc, H * 0.72, 24 * sc, color); }
  }
  function milkyWay(ctx, s, alpha = 1) {
    ctx.save(); ctx.translate(W * 0.5, H * 0.35); ctx.rotate(-0.42);
    ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(26px)";
    for (const [w, h, c, a] of [[900, 90, C.violet, 0.35], [760, 50, C.pink, 0.3], [600, 26, "#ffe2b0", 0.35]]) { ctx.globalAlpha = a * alpha; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.filter = "none"; const q = rng(21);
    for (let i = 0; i < 500; i++) { ctx.globalAlpha = (0.3 + q() * 0.6) * alpha; circle(ctx, (q() - 0.5) * 1700, (q() - 0.5) * (q() < 0.7 ? 90 : 220), 0.5 + q() * 1.1, C.white); }
    ctx.restore();
  }
  function ladderIcon(ctx, kind, x, y, r, t) {
    if (kind === "molecule") { ctx.strokeStyle = C.white; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + r * 0.3); ctx.lineTo(x, y - r * 0.3); ctx.lineTo(x + r * 0.6, y + r * 0.3); ctx.stroke(); circle(ctx, x - r * 0.6, y + r * 0.3, r * 0.3, C.pink); circle(ctx, x, y - r * 0.3, r * 0.36, C.amber); circle(ctx, x + r * 0.6, y + r * 0.3, r * 0.3, C.teal); }
    if (kind === "cell") { sphere(ctx, x, y, r * 0.8, { base: "#7de7b0", shadow: "rgba(10,60,40,0.3)" }); circle(ctx, x + r * 0.15, y + r * 0.05, r * 0.3, C.violet); }
    if (kind === "complex") { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3) * 0.1); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.85, r * 0.45, 0, 0, Math.PI * 2); ctx.fillStyle = C.amber; ctx.fill(); ctx.beginPath(); ctx.moveTo(r * 0.7, 0); ctx.lineTo(r * 1.15, -r * 0.4); ctx.lineTo(r * 1.15, r * 0.4); ctx.fill(); circle(ctx, -r * 0.45, -r * 0.08, r * 0.1, C.ink); ctx.restore(); }
    if (kind === "mind") blip(ctx, x, y, r * 0.75, { t, mood: "happy", look: [0.3, -0.3] });
    if (kind === "rocket") { ctx.save(); ctx.translate(x, y); ctx.rotate(0.5); ctx.beginPath(); ctx.ellipse(0, 0, r * 0.32, r * 0.85, 0, 0, Math.PI * 2); ctx.fillStyle = C.white; ctx.fill(); ctx.beginPath(); ctx.moveTo(-r * 0.32, r * 0.3); ctx.lineTo(-r * 0.6, r * 0.85); ctx.lineTo(-r * 0.1, r * 0.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(r * 0.32, r * 0.3); ctx.lineTo(r * 0.6, r * 0.85); ctx.lineTo(r * 0.1, r * 0.6); ctx.fill(); circle(ctx, 0, -r * 0.2, r * 0.15, C.blue); ctx.fillStyle = C.amber; ctx.beginPath(); ctx.moveTo(-r * 0.18, r * 0.8); ctx.lineTo(0, r * (1.2 + 0.15 * Math.sin(t * 20))); ctx.lineTo(r * 0.18, r * 0.8); ctx.fill(); ctx.restore(); }
  }
  const STEPS = ["molecule", "cell", "complex", "mind", "rocket"];
  function stairs(ctx, s, wallAt, wallColor, hero) {
    sky(ctx, s, "#140c3a", "#2e1a5e", { seed: 31, nebulae: 3, sparkles: 4 });
    for (let i = 0; i < 5; i++) {
      const x = 170 + i * 235, y = 520 - i * 80;
      ctx.fillStyle = "#2a2070"; ctx.beginPath(); ctx.roundRect(x - 95, y, 190, H - y + 20, 18); ctx.fill();
      ctx.fillStyle = "#4a3aa8"; ctx.beginPath(); ctx.roundRect(x - 95, y, 190, 26, 13); ctx.fill();
      const k = appear(s, 0.15 + i * 0.25);
      if (k > 0) { ctx.save(); ctx.translate(x, y - 60); const sc = pop(k); ctx.scale(sc, sc);
        if (STEPS[i] === "mind" && hero) blip(ctx, 0, 6, 40, { t: s.gt, ...hero }); else ladderIcon(ctx, STEPS[i], 0, 0, 46, s.gt); ctx.restore(); }
      label(ctx, ["chemistry", "cells", "complex life", "intelligence", "spaceflight"][i], x, y + 58, 22, appear(s, 0.3 + i * 0.25), "rgba(246,243,255,0.85)");
    }
    if (wallAt != null) {
      const k = ease(appear(s, 1.5, 0.8)), x = 170 + wallAt * 235; // wallAt 2.5 = between steps 2 and 3
      ctx.save(); ctx.globalAlpha = 0.85 * k;
      const g = ctx.createLinearGradient(x - 30, 0, x + 30, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, wallColor); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 60, lerp(H, 0, k), 120, H);
      for (let j = -2; j <= 2; j++) { ctx.globalAlpha = 0.5 * k * (1 - Math.abs(j) * 0.3); ctx.fillStyle = wallColor; ctx.fillRect(x + j * 9 - 2 + Math.sin(s.gt * 3 + j) * 2, lerp(H, 0, k), 4, H); }
      ctx.restore();
      glow(ctx, x, H * 0.45, 200, wallColor, 0.35 * k);
      label(ctx, "GREAT FILTER", x, 70, 34, appear(s, 2.0), C.white);
    }
  }

  // ---------------------------------------------------------------- scenes
  const scenes = {
    nightHill(ctx, s) {
      ctx.save(); camera(ctx, s, 1.0, 1.08, 0, 30);
      sky(ctx, s, "#070a26", "#3b1d63", { seed: 2, nebulae: 2 }); milkyWay(ctx, s);
      glow(ctx, W * 0.5, H * 1.05, 700, "rgba(255,93,143,0.45)");
      hill(ctx, s);
      blip(ctx, W * 0.33, H * 0.66, 42, { t: s.gt, mood: "wonder", look: [0.5, -1] });
      ctx.restore();
    },
    galaxy(ctx, s) {
      ctx.save(); camera(ctx, s, 1.5, 1.0);
      sky(ctx, s, "#05061c", "#120d38", { seed: 5, nebulae: 3, stars: 260 });
      galaxy(ctx, W / 2, H / 2, 380, s.gt, { seed: 1, tilt: 0.5 });
      ctx.restore();
      const k = clamp((s.lt - 0.8) / 2.2), n = Math.round(ease(k) * 200);
      label(ctx, `${n},000,000,000`, W / 2, H * 0.1, 64, appear(s, 0.6));
      label(ctx, "stars in our galaxy", W / 2, H * 0.18, 26, appear(s, 1.4), "rgba(246,243,255,0.8)");
    },
    habitable(ctx, s) {
      ctx.save(); camera(ctx, s, 1.0, 1.1, -40, 0);
      sky(ctx, s, "#0b0a2e", "#1b1450", { seed: 9, nebulae: 2 });
      const cx = 250, cy = 380;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.32);
      ctx.beginPath(); ctx.arc(0, 0, 560, 0, Math.PI * 2); ctx.arc(0, 0, 420, 0, Math.PI * 2); ctx.fillStyle = "rgba(94,227,138,0.22)"; ctx.fill("evenodd");
      ctx.strokeStyle = "rgba(246,243,255,0.18)"; ctx.lineWidth = 3; for (const r of [230, 350, 490, 680, 860]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
      sun(ctx, cx, cy, 70, s.gt);
      const planets = [[230, 14, "#c7a27a", 1.6], [350, 20, "#ffb340", 1.1], [490, 28, C.blue, 0.8], [680, 34, "#e07a5f", 0.55], [860, 46, "#c9a5ff", 0.35]];
      planets.forEach(([r, pr, col, sp], i) => {
        const a = 0.6 + s.gt * sp * 0.25 + i, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.32;
        sphere(ctx, x, y, pr, { base: col, land: i === 2 ? { n: 5, color: C.green } : null, atmo: i === 2 ? "rgba(51,224,200,0.6)" : null, lx: (cx - x) / r, ly: (cy - y) / r / 0.32 * 0.3, seed: i + 4 });
        if (i === 2) { const k = appear(s, 1.2); ctx.save(); ctx.globalAlpha = k * (0.6 + 0.4 * Math.sin(s.gt * 4)); ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, pr + 12 + 6 * Math.sin(s.gt * 4), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); label(ctx, "liquid water", x, y - pr - 40, 26, k, C.green); }
      });
      ctx.restore();
      label(ctx, "the habitable zone", W * 0.24, H * 0.1, 30, appear(s, 0.5), "rgba(94,227,138,0.95)");
    },
    lifeDots(ctx, s) {
      ctx.save(); camera(ctx, s, 1.05, 1.0);
      sky(ctx, s, "#05061c", "#130e3a", { seed: 13, nebulae: 3 });
      const lit = (d, th, k) => k < 0.03 * clamp((s.lt - 0.6) / 3) * 1.2 && d > 0.15; lit.color = C.teal;
      galaxy(ctx, W / 2, H / 2, 420, s.gt, { seed: 1, tilt: 0.42, rot: 1.2, lit, dim: 0.6 });
      ctx.restore();
      label(ctx, "life on 1 in 1,000 stars?", W / 2, H * 0.1, 40, appear(s, 1.0), C.teal);
    },
    expansion(ctx, s) {
      ctx.save(); camera(ctx, s, 1.0, 1.04);
      sky(ctx, s, "#05061c", "#120d38", { seed: 17, nebulae: 2 });
      const k = ease(clamp((s.lt - 0.3) / (s.dur - 0.6))), ox = 0.62, oth = 2.2;
      const lit = (d, th, q) => { const dx = Math.cos(th) * d - Math.cos(oth) * ox, dy = Math.sin(th) * d - Math.sin(oth) * ox; return Math.hypot(dx, dy) < k * 1.75 && q < 0.4; };
      lit.color = C.amber; lit.glow = "rgba(255,179,64,0.75)";
      galaxy(ctx, W / 2, H * 0.46, 400, 0, { seed: 1, tilt: 0.5, lit, dim: 0.5 });
      ctx.restore();
      // timeline bar
      const bx = 240, bw = 800, by = 70;
      ctx.fillStyle = "rgba(246,243,255,0.15)"; ctx.beginPath(); ctx.roundRect(bx, by - 6, bw, 12, 6); ctx.fill();
      ctx.fillStyle = C.amber; ctx.beginPath(); ctx.roundRect(bx, by - 6, bw * k, 12, 6); ctx.fill();
      ctx.font = font(FONT_LABEL, 22); ctx.fillStyle = "rgba(246,243,255,0.8)"; ctx.textAlign = "left"; ctx.fillText("0", bx, by + 36); ctx.textAlign = "right"; ctx.fillText("10", bx + bw, by + 36);
      label(ctx, `${(k * 10).toFixed(1)} million years`, bx + bw * k, by + 44, 24, appear(s, 0.4), C.amber);
    },
    empty(ctx, s) {
      ctx.save(); camera(ctx, s, 1.12, 1.0, 0, -20);
      sky(ctx, s, "#070a26", "#1d1450", { seed: 23, nebulae: 1, sparkles: 3, stars: 160 });
      sphere(ctx, W / 2, H + 380, 520, { base: C.blue, land: { n: 9, color: "#46c47a" }, atmo: "rgba(51,224,200,0.55)", lx: -0.2, ly: -1, seed: 8 });
      const look = [Math.sin(s.lt * 1.6), -0.6];
      blip(ctx, W / 2, H * 0.71 - 30, 50, { t: s.gt, mood: s.p > 0.45 ? "shrug" : "wonder", look: s.p > 0.45 ? [0, 0] : look });
      const k = appear(s, s.dur * 0.5);
      label(ctx, "?", W / 2 + 4, H * 0.42, 120, k, C.amber);
      ctx.restore();
    },
    title(ctx, s) {
      sky(ctx, s, "#070a26", "#24145a", { seed: 29, nebulae: 4, sparkles: 10 });
      ctx.save(); camera(ctx, s, 1.0, 1.06);
      const text = "THE FERMI PARADOX"; ctx.font = font(FONT_TITLE, 110); ctx.textAlign = "left"; ctx.textBaseline = "middle";
      const total = ctx.measureText(text).width; let x = W / 2 - total / 2;
      [...text].forEach((ch, i) => {
        const w = ctx.measureText(ch).width, k = appear(s, 0.15 + i * 0.045, 0.4);
        if (k > 0) { ctx.save(); ctx.translate(x + w / 2, H / 2); const sc = pop(k); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 2); ctx.fillStyle = "rgba(10,8,40,0.5)"; ctx.fillText(ch, -w / 2 + 5, 7); ctx.fillStyle = i < 4 ? C.white : C.amber; ctx.fillText(ch, -w / 2, 0); ctx.restore(); }
        x += w;
      });
      const u = ease(appear(s, 1.2, 0.8)); ctx.fillStyle = C.pink; ctx.beginPath(); ctx.roundRect(W / 2 - 260 * u, H / 2 + 78, 520 * u, 8, 4); ctx.fill();
      ctx.restore();
    },
    filterSteps(ctx, s) { ctx.save(); camera(ctx, s, 1.0, 1.03); stairs(ctx, s, 2.5, "rgba(255,77,94,0.95)"); ctx.restore(); label(ctx, "?", 170 + 3 * 235 - 118, 175, 70, appear(s, 2.4), C.amber); },
    filterBehind(ctx, s) {
      ctx.save(); camera(ctx, s, 1.04, 1.12, 0, 20); stairs(ctx, s, 1.5, "rgba(94,227,138,0.95)", { mood: "happy", look: [-0.9, 0.2] }); ctx.restore();
      label(ctx, "behind us", 170 + 1.5 * 235, 130, 30, appear(s, 2.2), C.green);
    },
    filterAhead(ctx, s) {
      ctx.save(); camera(ctx, s, 1.1, 1.3, -170, 60); stairs(ctx, s, 3.5, "rgba(255,77,94,0.95)", { mood: "worried", look: [0.9, -0.2] }); ctx.restore();
    },
    tooFar(ctx, s) {
      ctx.save(); camera(ctx, s, 1.0, 1.05);
      sky(ctx, s, "#05061c", "#16104a", { seed: 37, nebulae: 3 });
      const ax = 220, bx = 1080, y = H / 2;
      for (const [x, col, phase] of [[ax, C.teal, 0], [bx, C.pink, 0.5]]) {
        for (let i = 0; i < 6; i++) {
          const r = ((s.lt * 90 + i * 70 + phase * 70) % 420) + 40, a = (1 - (r - 40) / 420) * 0.8;
          ctx.strokeStyle = col; ctx.globalAlpha = a; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, x === ax ? -0.6 : Math.PI - 0.6, x === ax ? 0.6 : Math.PI + 0.6); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      sphere(ctx, ax, y, 60, { base: C.blue, land: { n: 5, color: "#46c47a" }, atmo: "rgba(51,224,200,0.5)", lx: 0.7, ly: -0.5, seed: 3 });
      sphere(ctx, bx, y, 52, { base: "#b06cff", bands: [[-0.4, 0.2, "#d29bff"], [0.15, 0.25, "#8a4fe0"]], atmo: "rgba(255,93,143,0.5)", lx: -0.7, ly: -0.5 });
      ctx.setLineDash([4, 14]); ctx.strokeStyle = "rgba(246,243,255,0.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax + 90, y + 120); ctx.lineTo(bx - 90, y + 120); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      label(ctx, "1,000 light-years", W / 2, y + 160, 30, appear(s, 0.8));
    },
    first(ctx, s) {
      ctx.save(); camera(ctx, s, 1.0, 1.12, 40, 0);
      sky(ctx, s, "#05061c", "#160f3f", { seed: 41, nebulae: 2, sparkles: 5 });
      glow(ctx, W * 0.9, H * 0.4, 520, "rgba(255,179,64,0.55)");
      sphere(ctx, W * 0.48, H * 0.52, 230, { base: C.blue, land: { n: 11, color: "#46c47a", size: 1.4 }, lights: true, lx: 0.85, ly: -0.3, so: 0.8, atmo: "rgba(51,224,200,0.55)", shadow: "rgba(6,6,30,0.72)", seed: 12 });
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(255,200,120,0.85)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(W * 0.48, H * 0.52, 232, -0.9, 0.5); ctx.stroke(); ctx.restore();
      ctx.restore();
    },
    closing(ctx, s) {
      ctx.save(); camera(ctx, s, 1.12, 0.92, 0, -40);
      sky(ctx, s, "#070a26", "#3b1d63", { seed: 2, nebulae: 2 }); milkyWay(ctx, s, 1.2);
      glow(ctx, W * 0.5, H * 1.05, 700, "rgba(255,93,143,0.4)");
      hill(ctx, s);
      blip(ctx, W * 0.33, H * 0.66, 42, { t: s.gt, mood: s.p > 0.5 ? "wave" : "wonder", look: [0.4, -1] });
      ctx.restore();
      if (s.p > 0.82) { ctx.fillStyle = `rgba(0,0,0,${ease((s.p - 0.82) / 0.18)})`; ctx.fillRect(0, 0, W, H); }
    },
  };

  // ---------------------------------------------------------------- script (original) and timeline
  const SCRIPT = [
    ["nightHill", "Look up on a clear night and you can see a few thousand stars.", "cut", [0.6]],
    ["galaxy", "Our galaxy alone holds around two hundred billion of them.", "zoom", [0.6, 1.4]],
    ["habitable", "Many have planets, and some of those planets orbit where water can stay liquid.", "cut", [0.5, 1.2]],
    ["lifeDots", "Even if life starts on only a tiny fraction of them, the galaxy should be crowded.", "cut", [1.0, 1.6, 2.2, 2.8]],
    ["expansion", "A civilization slightly older than ours could have spread across it in a few million years.", "cut", [0.4]],
    ["empty", "So where is everybody?", "cut", [2.0]],
    ["title", "This is the Fermi Paradox.", "cut", [0.15]],
    ["filterSteps", "One answer is a Great Filter: a step so hard that almost nothing gets past it.", "cut", [0.15, 0.4, 0.65, 0.9, 1.15, 1.5]],
    ["filterBehind", "Maybe it is behind us, and simple life almost never becomes complex.", "cut", [1.5]],
    ["filterAhead", "Or maybe it lies ahead, waiting for every civilization that reaches our level.", "cut", [1.5]],
    ["tooFar", "Perhaps they are out there, but too far apart, too quiet, or not interested in us.", "cut", [0.8]],
    ["first", "Or perhaps we really are among the first.", "zoom", []],
    ["closing", "Either way, the silence says something about our own future.", "cut", []],
  ];
  function build(opts = {}) {
    const wpm = opts.wpm || 158, lines = (opts.lines && opts.lines.length === SCRIPT.length) ? opts.lines : SCRIPT.map((l) => l[1]);
    const tl = { preset: "fermi", topic: opts.topic || "Where is everybody? The Fermi Paradox", lines: [], shots: [], events: [], duration: 0, captions: opts.captions ?? true };
    let t = 0;
    SCRIPT.forEach(([scene, , cut, sfx], i) => {
      const text = lines[i] || "", words = text.split(/\s+/).filter(Boolean).length;
      const speak = (words / wpm) * 60, lead = i === 0 ? 0.8 : 0.35, dur = Math.max(scene === "title" ? 3.4 : 3.0, speak + lead + 0.7) + (scene === "closing" ? 2.5 : 0);
      tl.shots.push({ start: t, end: t + dur, scene, seed: 100 + i, line: i, cut: i === 0 ? "cut" : SCRIPT[i - 1][2] === "zoom" ? "zoom" : "cut", sfx: sfx.map((x) => t + x) });
      tl.lines.push({ text, start: t + lead, end: t + lead + speak + 0.3 });
      t += dur;
    });
    // the zoom flag on a line means the cut *out of* it zooms through
    tl.shots.forEach((sh, i) => { sh.cut = i > 0 && SCRIPT[i - 1][2] === "zoom" ? "zoom" : "cut"; });
    tl.shots.forEach((sh, i) => { if (i + 1 < tl.shots.length) sh.cut = tl.shots[i + 1].cut; });
    tl.duration = t;
    return tl;
  }
  // per-shot clock for the scenes
  const wrapped = {};
  Object.entries(scenes).forEach(([k, fn]) => { wrapped[k] = function (ctx, s) { const sh = s._shot; s.lt = s.gt - sh.start; s.dur = sh.end - sh.start; fn(ctx, s); }; });

  E.PRESETS.fermi = {
    name: "Fermi Paradox explainer (flat-vector)", source: "flat-space-explainer", measured: false, mode: "scripted",
    wpm: 158, asl: 5.5, transition: "cut", tDur: 0.45, music: "pad", captions: true,
    targets: { avgShot: "4–6 s (inferred)", saturation: "high (inferred)", brightness: "dark (inferred)", transitions: "hard cuts and zoom-throughs" },
    palette: [C.night1, C.night2, C.pink, C.amber, C.teal, C.violet],
    scenes: wrapped, build,
    sample: { topic: "Where is everybody? The Fermi Paradox", lines: SCRIPT.map((l) => l[1]) },
  };
})();
