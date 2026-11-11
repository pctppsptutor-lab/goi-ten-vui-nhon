// Code-drawn base backgrounds for games 13-18 (the bottom layer, like the duck race's river).
// Each one is painted once into an offscreen 1600x900 canvas and reused every frame.
// Positions match the play spots in each game file (nests, chest slabs, belt, lift doors).
const BASES = (() => {
  const W = 1600, H = 900, TAU = Math.PI * 2;
  const cache = {};
  let g;                                             // the offscreen context being painted

  // ---------- drawing helpers ----------
  const lin = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const rad = (x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function ell(x, y, rx, ry, fill, stroke, lw = 3) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
  function poly(pts, fill, stroke, lw = 3) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
  function blob(x, y, r, n, fill, seed = 1) {      // a lumpy round shape (bush, gold pile, cloud)
    g.fillStyle = fill; g.beginPath();
    for (let i = 0; i < n; i++) { const a = i / n * TAU, rr2 = r * (.75 + .25 * Math.sin(i * 2.3 + seed)); g.moveTo(x, y); g.arc(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .32, rr2 * .6, 0, TAU); }
    g.fill();
  }
  function rock(x, y, s, col = '#9aa3ad', dark = '#6f7780') {
    poly([[x - 40 * s, y], [x - 30 * s, y - 28 * s], [x - 5 * s, y - 40 * s], [x + 28 * s, y - 30 * s], [x + 42 * s, y]], col);
    poly([[x - 5 * s, y - 40 * s], [x + 28 * s, y - 30 * s], [x + 42 * s, y], [x + 8 * s, y]], dark);
  }
  function leafG(x, y, len, ang, col) {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -len * .3, len, 0); g.quadraticCurveTo(len * .5, len * .3, 0, 0); g.fill();
    g.strokeStyle = '#00000026'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(len * .92, 0); g.stroke(); g.restore();
  }
  function flower(x, y, s, petal, center) {
    for (let i = 0; i < 5; i++) { g.save(); g.translate(x, y); g.rotate(i * TAU / 5); ell(0, -16 * s, 11 * s, 18 * s, petal); g.restore(); }
    ell(x, y, 8 * s, 8 * s, center);
  }
  function palm(x, y, h, col = '#2f8f45') {
    g.strokeStyle = '#8a5a2f'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 18, y - h * .5, x + 6, y - h); g.stroke();
    for (let i = 0; i < 7; i++) leafG(x + 6, y - h, 90, -Math.PI + i * Math.PI / 6 + .1, i % 2 ? col : '#3fa557');
  }
  function lantern(x, y, chain = 40) {
    g.strokeStyle = '#4a3a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - chain); g.lineTo(x, y - 22); g.stroke();
    ell(x, y + 4, 34, 34, rad(x, y + 4, 0, 34, [[0, '#ffdc8a99'], [1, '#ffdc8a00']]));
    rr(x - 14, y - 22, 28, 40, 6); g.fillStyle = '#ffd36b'; g.fill(); g.strokeStyle = '#6b4a24'; g.lineWidth = 3; g.stroke();
    poly([[x - 18, y - 22], [x + 18, y - 22], [x + 10, y - 32], [x - 10, y - 32]], '#6b4a24');
    rr(x - 10, y + 16, 20, 6, 2); g.fillStyle = '#6b4a24'; g.fill();
  }
  function crystal(x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s);
    [[-14, -6, .35], [0, 0, 0], [14, -4, -.35]].forEach(([dx, dy, a], i) => {
      g.save(); g.translate(dx, dy); g.rotate(a); const h = i === 1 ? 58 : 40;
      poly([[-9, 0], [-9, -h * .75], [0, -h], [9, -h * .75], [9, 0]], col); poly([[0, -h], [9, -h * .75], [9, 0], [0, 0]], '#ffffff44'); g.restore();
    });
    g.restore();
  }
  function vignetteBase(col, a) { g.save(); g.globalAlpha = a; g.fillStyle = rad(800, 450, 420, 1000, [[0, col + '00'], [1, col]]); g.fillRect(0, 0, W, H); g.restore(); }
  // stone floor tiles in perspective, vanishing at (vx, vy)
  function tiles(top, bottom, vx, vy, col, n = 18) {
    g.save(); g.strokeStyle = col; g.lineWidth = 2;
    for (let i = -n; i <= n; i++) { const x = vx + i * 120; g.beginPath(); g.moveTo(vx + (x - vx) * (top - vy) / (bottom - vy), top); g.lineTo(x, bottom); g.stroke(); }
    for (let k = 0; k < 7; k++) { const y = top + (bottom - top) * Math.pow(k / 6, 1.6); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.restore();
  }

  // ============ 13 ice rink ============
  function ice() {
    g.fillStyle = lin(0, 0, 0, 260, [[0, '#8fd0ff'], [1, '#e8f7ff']]); g.fillRect(0, 0, W, 270);
    poly([[0, 250], [180, 120], [330, 220], [520, 90], [720, 230], [900, 110], [1100, 230], [1300, 100], [1500, 210], [1600, 160], [1600, 270], [0, 270]], '#b9d4ea');
    [[180, 120], [520, 90], [900, 110], [1300, 100]].forEach(([x, y]) => poly([[x - 50, y + 50], [x, y], [x + 50, y + 50], [x + 22, y + 40], [x, y + 56], [x - 22, y + 40]], '#ffffff'));
    // igloo
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(1400, 268, 70, Math.PI, 0); g.fill(); g.strokeStyle = '#cfe2f2'; g.lineWidth = 2;
    for (let k = 1; k < 4; k++) { g.beginPath(); g.arc(1400, 268, 70, Math.PI, 0); g.stroke(); } g.fillStyle = '#8fb3cf'; g.beginPath(); g.arc(1400, 268, 24, Math.PI, 0); g.fill();
    // ice field with lanes
    g.fillStyle = lin(0, 260, 0, 900, [[0, '#e6f6ff'], [1, '#bfe4f7']]); g.fillRect(0, 262, W, 600);
    g.strokeStyle = '#ffffff99'; g.lineWidth = 3; for (let i = 0; i < 11; i++) { const y = 272 + i * 54.5; g.beginPath(); g.moveTo(60, y); g.lineTo(1440, y); g.stroke(); }
    g.strokeStyle = '#ffffff55'; g.lineWidth = 8; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo((i * 241) % W, 300 + (i * 97) % 500); g.lineTo((i * 241) % W + 120, 290 + (i * 97) % 500); g.stroke(); }
    // start line
    g.fillStyle = '#ff6f6f88'; g.fillRect(140, 270, 8, 560);
    // snowbanks top and bottom
    for (let x = -40; x < W + 60; x += 90) { ell(x, 262, 70, 22, '#ffffff'); ell(x + 40, 852, 80, 30, '#ffffff'); }
    g.fillStyle = '#ffffff'; g.fillRect(0, 852, W, 60);
  }

  // ============ 14 beach ============
  function beach() {
    g.fillStyle = lin(0, 0, 0, 200, [[0, '#7cd0ff'], [1, '#d8f4ff']]); g.fillRect(0, 0, W, 200);
    [[260, 70], [900, 50], [1350, 90]].forEach(([x, y], i) => blob(x, y, 110, 6, '#ffffff', i));
    g.fillStyle = lin(0, 190, 0, 290, [[0, '#2fb6e8'], [1, '#7fe0f5']]); g.fillRect(0, 190, W, 100);
    g.strokeStyle = '#ffffffaa'; g.lineWidth = 4; for (let x = -40; x < W; x += 80) { g.beginPath(); g.moveTo(x, 288); g.quadraticCurveTo(x + 40, 272, x + 80, 288); g.stroke(); }
    g.fillStyle = lin(0, 280, 0, 900, [[0, '#ffe7b0'], [1, '#f2cf86']]); g.fillRect(0, 290, W, 610);
    for (let i = 0; i < 160; i++) ell((i * 97) % W, 300 + (i * 61) % 600, 2, 2, '#d9b36a');
    g.strokeStyle = '#e6c27a'; g.lineWidth = 3; g.setLineDash([12, 14]);
    for (let i = 0; i < 11; i++) { const y = 310 + i * 50; g.beginPath(); g.moveTo(120, y); g.lineTo(1260, y); g.stroke(); } g.setLineDash([]);
    palm(80, 300, 200); palm(1560, 320, 210);
    // umbrella and towel
    g.fillStyle = '#ff6f8f'; g.beginPath(); g.moveTo(1280, 260); g.quadraticCurveTo(1340, 180, 1400, 260); g.closePath(); g.fill(); g.strokeStyle = '#7a4a24'; g.lineWidth = 5; g.beginPath(); g.moveTo(1340, 220); g.lineTo(1340, 330); g.stroke();
    rr(1180, 820, 180, 60, 8); g.fillStyle = '#7cd0ff'; g.fill();
    [[60, 860], [700, 870], [1500, 850]].forEach(([x, y], i) => blob(x, y, 70, 5, i % 2 ? '#3f9a4a' : '#2f8a40', i));
  }

  // ============ 15 disco ============
  function disco() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#1a0f3a'], [1, '#0c0720']]); g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) ell((i * 211) % W, (i * 97) % 380, 1.5 + (i % 3), 1.5 + (i % 3), '#ffffff');
    // round portholes with planets
    [[200, 180, '#ff9f43'], [1400, 160, '#7cf7ff']].forEach(([x, y, c]) => { ell(x, y, 90, 90, '#2a1d5a', '#c9a24a', 8); ell(x - 10, y + 10, 36, 36, c); ell(x - 10, y + 10, 60, 14, null, c + 'aa', 4); });
    // disco floor tiles in perspective
    const rows = 7, top = 430, bottom = 900;
    for (let r2 = 0; r2 < rows; r2++) {
      const y0 = top + (bottom - top) * Math.pow(r2 / rows, 1.3), y1 = top + (bottom - top) * Math.pow((r2 + 1) / rows, 1.3);
      for (let c = -8; c < 8; c++) {
        const x0a = 800 + c * (90 + r2 * 22), x1a = x0a + 90 + r2 * 22, x0b = 800 + c * (90 + (r2 + 1) * 22), x1b = x0b + 90 + (r2 + 1) * 22;
        poly([[x0a, y0], [x1a, y0], [x1b, y1], [x0b, y1]], ['#ff6fae', '#7cf7ff', '#b48cff', '#ffd84a'][(c + r2 + 16) % 4] + '55', '#ffffff22', 2);
      }
    }
    // host stage
    ell(1460, 480, 120, 30, '#3a2a7a', '#c9a24a', 5);
    vignetteBase('#05020f', .45);
  }

  // ============ 16 bedroom ============
  function bedroom() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#2c2558'], [1, '#1c1838']]); g.fillRect(0, 0, W, H);
    // wallpaper stars
    for (let i = 0; i < 40; i++) { const x = (i * 157) % W, y = 20 + (i * 83) % 280; g.fillStyle = '#ffffff22'; g.beginPath(); for (let k = 0; k < 10; k++) { const r2 = k % 2 ? 4 : 10, a = k * Math.PI / 5; g.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2); } g.fill(); }
    // window with the moon
    rr(640, 40, 320, 200, 16); g.fillStyle = lin(0, 40, 0, 240, [[0, '#1d2a6a'], [1, '#3a4a9a']]); g.fill(); g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.stroke();
    ell(880, 110, 34, 34, '#fff4c8'); g.lineWidth = 4; g.beginPath(); g.moveTo(800, 40); g.lineTo(800, 240); g.moveTo(640, 140); g.lineTo(960, 140); g.stroke();
    // floor with a rug
    g.fillStyle = lin(0, 330, 0, 900, [[0, '#4a3a6a'], [1, '#2e2448']]); g.fillRect(0, 330, W, 570);
    ell(800, 640, 640, 230, '#5a3a86'); ell(800, 640, 600, 205, null, '#e9c45a66', 4);
    // ten beds (the monsters lie on them)
    [330, 565, 800, 1035, 1270].forEach(x => [470, 760].forEach(y => {
      rr(x - 100, y - 90, 200, 100, 16); g.fillStyle = '#8a5a3a'; g.fill();
      rr(x - 108, y - 130, 22, 150, 8); g.fill(); rr(x + 86, y - 110, 22, 130, 8); g.fill();
      rr(x - 92, y - 84, 184, 70, 14); g.fillStyle = '#e8e2ff'; g.fill();
      rr(x - 92, y - 60, 184, 46, 14); g.fillStyle = '#7c6cd6'; g.fill();
      rr(x - 88, y - 98, 60, 30, 12); g.fillStyle = '#ffffff'; g.fill();
    }));
    vignetteBase('#0a0818', .4);
  }

  // ============ 17 cat cafe ============
  function cafe() {
    g.fillStyle = lin(0, 0, 0, 380, [[0, '#ffe2c4'], [1, '#ffd2a8']]); g.fillRect(0, 0, W, 390);
    g.strokeStyle = '#ffffff55'; g.lineWidth = 16; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 390); g.stroke(); }
    // windows and menu board
    [[120, 60], [1260, 60]].forEach(([x, y]) => { rr(x, y, 220, 170, 14); g.fillStyle = lin(0, y, 0, y + 170, [[0, '#9fe0ff'], [1, '#e0f6ff']]); g.fill(); g.strokeStyle = '#a0703f'; g.lineWidth = 10; g.stroke(); blob(x + 110, y + 150, 100, 5, '#7cc66a', x); });
    rr(560, 50, 480, 200, 16); g.fillStyle = '#3a2a22'; g.fill(); g.strokeStyle = '#a0703f'; g.lineWidth = 10; g.stroke();
    g.strokeStyle = '#ffffffaa'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(600, 100 + i * 38); g.lineTo(840 - (i % 2) * 60, 100 + i * 38); g.stroke(); ell(980, 100 + i * 38, 14, 10, '#ffd36b'); }
    // counter
    rr(0, 330, W, 70, 0); g.fillStyle = '#a0703f'; g.fill(); g.fillStyle = '#c99561'; g.fillRect(0, 330, W, 14);
    // checker floor
    g.fillStyle = '#f7e6cf'; g.fillRect(0, 400, W, 500);
    for (let y = 400, r2 = 0; y < 900; y += 60, r2++) for (let x = (r2 % 2) * 60; x < W; x += 120) { g.fillStyle = '#ead1ac'; g.fillRect(x, y, 60, 60); }
    // trays path hint and the delivery table
    ell(1440, 660, 130, 34, '#00000022'); ell(1440, 640, 120, 30, '#ffffff', '#c99561', 6); rr(1430, 650, 20, 120, 6); g.fillStyle = '#a0703f'; g.fill();
    [[60, 820], [1540, 820]].forEach(([x, y]) => { rr(x - 30, y - 50, 60, 70, 10); g.fillStyle = '#c96a4a'; g.fill(); blob(x, y - 70, 70, 5, '#3f9a4a', x); });
  }

  // ============ 18 recycling yard ============
  function yard() {
    g.fillStyle = lin(0, 0, 0, 280, [[0, '#8fdcff'], [1, '#e2f8ff']]); g.fillRect(0, 0, W, 290);
    [[300, 60], [1100, 80]].forEach(([x, y], i) => blob(x, y, 120, 6, '#ffffff', i));
    for (let i = 0; i < 9; i++) { const x = 40 + i * 180, h = 90 + (i * 37) % 80; rr(x, 230 - h, 140, h, 6); g.fillStyle = i % 2 ? '#9fb6c9' : '#b6c9d9'; g.fill(); for (let k = 0; k < 4; k++) { g.fillStyle = '#ffffff88'; g.fillRect(x + 16 + k * 30, 250 - h, 16, 20); } }
    // road the truck drives on
    g.fillStyle = '#5d6975'; g.fillRect(0, 290, W, 110); g.fillStyle = '#ffffff'; for (let x = 0; x < W; x += 120) g.fillRect(x, 342, 60, 8);
    // yard floor
    g.fillStyle = lin(0, 400, 0, 900, [[0, '#cfe8c4'], [1, '#a9d39a']]); g.fillRect(0, 400, W, 500);
    rr(120, 470, 1360, 110, 18); g.fillStyle = '#8a97a6'; g.fill(); rr(120, 470, 1360, 14, 8); g.fillStyle = '#6f7a86'; g.fill();
    for (let i = 0; i < 20; i++) { g.fillStyle = i % 2 ? '#f2c230' : '#2b2b2b'; poly([[120 + i * 68, 580], [188 + i * 68, 580], [168 + i * 68, 596], [100 + i * 68, 596]], g.fillStyle); }
    // recycling sign and plants
    ell(1500, 520, 46, 46, '#3fbf6a', '#ffffff', 5);
    [[50, 860], [1560, 860]].forEach(([x, y], i) => blob(x, y, 140, 6, '#3f9a4a', i));
  }

  const BUILD = { g13: ice, g14: beach, g15: disco, g16: bedroom, g17: cafe, g18: yard };
  return {
    release(id) { delete cache[id]; },
    get(id) {
      if (cache[id] !== undefined) return cache[id];
      if (!BUILD[id]) return cache[id] = null;
      const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; g = c.getContext('2d'); g.scale(1920 / W, 1080 / H);   // paint at full canvas resolution
      BUILD[id](); DECOR.paint(g, id); g = null;
      return cache[id] = c;
    }
  };
})();
