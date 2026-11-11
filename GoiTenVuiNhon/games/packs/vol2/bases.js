// Code-drawn base backgrounds for games 7-12 (the bottom layer, like the duck race's river).
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

  // ============ 07 flower garden ============
  function garden() {
    const SPOTS = [[424, 354], [624, 354], [824, 354], [1024, 354], [1224, 354], [290, 736], [530, 736], [770, 736], [1010, 736], [1250, 736]];
    g.fillStyle = lin(0, 0, 0, 260, [[0, '#7cd0ff'], [1, '#e2f6ff']]); g.fillRect(0, 0, W, 270);
    [[300, 80, 1], [760, 50, 1.2], [1180, 90, .9]].forEach(([x, y, s]) => blob(x, y, 110 * s, 6, '#ffffff', x));
    poly([[0, 230], [260, 170], [520, 220], [800, 160], [1100, 215], [1380, 170], [1600, 220], [1600, 270], [0, 270]], '#9fd27a');
    for (let x = 0; x < W; x += 60) blob(x, 238 + Math.sin(x * .07) * 8, 60, 5, x % 120 ? '#5fae4a' : '#4f9e3f', x);
    // fence
    g.strokeStyle = '#a0703f'; g.lineWidth = 8; g.beginPath(); g.moveTo(220, 248); g.lineTo(1420, 248); g.moveTo(220, 270); g.lineTo(1420, 270); g.stroke();
    for (let x = 230; x < 1420; x += 60) { rr(x, 236, 12, 50, 4); g.fillStyle = '#b5814f'; g.fill(); }
    // lawn
    g.fillStyle = lin(0, 270, 0, 900, [[0, '#8fd660'], [1, '#62b446']]); g.fillRect(0, 280, W, 620);
    g.strokeStyle = '#ffffff22'; g.lineWidth = 30; for (let x = -200; x < W; x += 140) { g.beginPath(); g.moveTo(x, 900); g.lineTo(x + 200, 280); g.stroke(); }
    // dashed bee path
    g.save(); g.strokeStyle = '#ffffffcc'; g.lineWidth = 4; g.setLineDash([16, 14]); g.beginPath(); g.moveTo(160, 540); g.bezierCurveTo(500, 470, 900, 610, 1320, 480); g.stroke(); g.restore();
    // soil patches
    SPOTS.forEach(([x, y]) => { ell(x, y, 84, 28, '#8a8f97'); ell(x, y - 4, 76, 24, '#a7abb3'); ell(x, y - 6, 62, 18, '#7a4f2a'); ell(x, y - 8, 50, 12, '#94603a'); });
    // pond and waterfall on the left
    poly([[0, 150], [110, 140], [150, 330], [0, 360]], '#8d8f96');
    g.fillStyle = lin(0, 150, 0, 330, [[0, '#d7f4ff'], [1, '#7fd0f0']]); rr(90, 160, 40, 170, 14); g.fill();
    ell(110, 470, 140, 50, '#5fc4ea', '#ffffff', 3); [[70, 460], [140, 480]].forEach(([x, y]) => ell(x, y, 16, 8, '#4f9e3f'));
    // the big sunflower stage
    for (let i = 0; i < 16; i++) { g.save(); g.translate(1440, 470); g.rotate(i * Math.PI / 8); ell(0, -86, 30, 56, '#ffcc33', '#e0a400', 3); g.restore(); }
    ell(1440, 470, 70, 70, '#8a5a2f'); ell(1440, 472, 60, 30, '#c08a52', '#8a5a2f', 3);
    // beehive in the tree
    g.strokeStyle = '#7a4a24'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(1600, 40); g.quadraticCurveTo(1480, 60, 1440, 110); g.stroke();
    blob(1560, 30, 240, 7, '#3f9a4a', 3);
    for (let i = 0; i < 5; i++) ell(1460, 130 + i * 18, 52 - Math.abs(i - 2) * 8, 12, i % 2 ? '#f0b52c' : '#ffcf45');
    ell(1460, 175, 12, 9, '#5a3a1a');
    // flowers and bushes around the edges
    blob(40, 860, 170, 7, '#3f9a4a', 1); blob(1560, 870, 170, 7, '#3f9a4a', 2);
    [[70, 790, '#ff6fae'], [160, 840, '#ffd34d'], [1480, 780, '#b48cff'], [1560, 820, '#ff6fae'], [40, 620, '#b48cff'], [1560, 640, '#ffd34d'], [610, 870, '#ffffff'], [940, 880, '#ff9f43']]
      .forEach(([x, y, c], i) => flower(x, y, 1.6 + (i % 3) * .3, c, '#ffe27a'));
    for (let i = 0; i < 9; i++) ell(380 + i * 120, 880 + (i % 2) * 8, 40, 14, '#c9c2b4', '#a59f92', 2);
  }

  // ============ 08 candy machine ============
  function candy() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#ffe3f1'], [1, '#ffc6df']]); g.fillRect(0, 0, W, H);
    // big arched windows
    for (let i = 0; i < 4; i++) { const x = 300 + i * 300; g.fillStyle = lin(0, 40, 0, 420, [[0, '#9fe0ff'], [1, '#e8f8ff']]); g.beginPath(); g.moveTo(x, 420); g.lineTo(x, 140); g.arc(x + 110, 140, 110, Math.PI, 0); g.lineTo(x + 220, 420); g.closePath(); g.fill();
      g.strokeStyle = '#c96a9a'; g.lineWidth = 10; g.stroke(); blob(x + 110, 360, 120, 5, '#ffb3d6', i); blob(x + 70, 330, 80, 5, '#c7a6ff', i + 2); }
    // candy-striped pipes
    [[60, 0, 40, 660], [1560, 0, 34, 900]].forEach(([x, y, w, h]) => { g.fillStyle = '#ffffff'; g.fillRect(x - w / 2, y, w, h); g.save(); g.beginPath(); g.rect(x - w / 2, y, w, h); g.clip(); g.strokeStyle = '#ff5d8f'; g.lineWidth = 12; for (let k = -40; k < h; k += 34) { g.beginPath(); g.moveTo(x - w, y + k); g.lineTo(x + w, y + k + 30); g.stroke(); } g.restore(); });
    // wooden scaffolding under the rails
    g.strokeStyle = '#b5814f'; g.lineWidth = 12; [[240, 270, 240, 700], [560, 320, 560, 700], [880, 490, 880, 700], [1180, 300, 1180, 700]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
    // main candy rail
    const MAIN = [[92, 120], [118, 200], [240, 250], [420, 300], [560, 300], [600, 380], [470, 470], [430, 520], [560, 560], [760, 520], [880, 470], [950, 455]];
    const rail = (w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); MAIN.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    rail(34, '#d94a7a'); rail(26, '#ffffff'); g.save(); g.setLineDash([18, 18]); rail(26, '#ff5d8f'); g.restore();
    // shelves for the jelly springs
    [[607, 312], [600, 422], [610, 532]].forEach(([x, y]) => { rr(x - 50, y, 100, 14, 6); g.fillStyle = '#9b6a3f'; g.fill(); });
    // floor
    g.fillStyle = lin(0, 700, 0, 900, [[0, '#f3d7c6'], [1, '#e2b9a4']]); g.fillRect(0, 700, W, 200);
    g.strokeStyle = '#ffffff55'; g.lineWidth = 2; for (let x = 0; x < W; x += 90) { g.beginPath(); g.moveTo(x, 700); g.lineTo(x - 40, 900); g.stroke(); }
    // cup shelf with name plates on the right
    rr(1330, 110, 250, 640, 22); g.fillStyle = '#ffffffaa'; g.fill(); g.strokeStyle = '#e88bb5'; g.lineWidth = 6; g.stroke();
    for (let i = 0; i < 10; i++) { rr(1440, 128 + i * 62, 130, 40, 18); g.fillStyle = '#fff4dc'; g.fill(); }
    // candy jars and sweets on the floor
    [[60, 800, '#ff5d8f'], [1500, 820, '#7cd0ff']].forEach(([x, y, c]) => { rr(x - 50, y - 70, 100, 90, 20); g.fillStyle = '#ffffff99'; g.fill(); for (let k = 0; k < 9; k++) ell(x - 30 + (k % 3) * 30, y - 40 + Math.floor(k / 3) * 22, 12, 12, ['#ff5d8f', '#ffd34d', '#7cf7ff', '#7cff9b'][k % 4]); });
    vignetteBase('#7a2a52', .25);
  }

  // ============ 09 hamster lab ============
  function hamster() {
    g.fillStyle = lin(0, 0, 0, 600, [[0, '#9fe0ff'], [1, '#dff6ff']]); g.fillRect(0, 0, W, 600);
    // glass dome ribs
    g.strokeStyle = '#ffffffaa'; g.lineWidth = 8; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 200, 600); g.quadraticCurveTo(800, -200, 800, 0); g.stroke(); }
    // hills and waterfall outside
    blob(300, 470, 500, 6, '#7cc66a', 1); blob(1300, 470, 520, 6, '#6bb85c', 2);
    g.fillStyle = '#d7f4ff'; rr(1050, 300, 40, 180, 14); g.fill();
    // scoreboard
    rr(560, 40, 480, 90, 30); g.fillStyle = '#1d4f8a'; g.fill(); g.strokeStyle = '#ffd84a'; g.lineWidth = 8; g.stroke();
    // play area grass and a looping tube
    g.fillStyle = lin(0, 440, 0, 900, [[0, '#8fd660'], [1, '#5fae43']]); g.fillRect(0, 450, W, 450);
    g.strokeStyle = '#e8fbffaa'; g.lineWidth = 36; g.lineCap = 'round'; g.beginPath(); g.moveTo(150, 520); g.bezierCurveTo(500, 420, 700, 600, 900, 480); g.bezierCurveTo(1100, 380, 1300, 520, 1450, 440); g.stroke();
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.stroke();
    // the long shelf the wheels stand on, and the jar shelf below
    rr(60, 690, 1480, 30, 10); g.fillStyle = '#b5814f'; g.fill(); rr(60, 714, 1480, 10, 4); g.fillStyle = '#8a5a2f'; g.fill();
    rr(60, 828, 1480, 34, 10); g.fillStyle = '#c99561'; g.fill(); rr(60, 856, 1480, 12, 4); g.fillStyle = '#8a5a2f'; g.fill();
    // switch platform on the right
    rr(1440, 560, 120, 20, 8); g.fillStyle = '#7f8c99'; g.fill();
    // plants
    blob(40, 880, 160, 6, '#3f9a4a', 4); blob(1570, 880, 170, 6, '#3f9a4a', 5);
    [[60, 800, '#ff6fae'], [1540, 790, '#ffd34d']].forEach(([x, y, c]) => flower(x, y, 1.8, c, '#ffe27a'));
  }

  // ============ 10 magic library ============
  function library() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#2a1c3f'], [1, '#160f24']]); g.fillRect(0, 0, W, H);
    // bookshelves on both sides
    [[0, 260], [1340, 260]].forEach(([x0, w]) => {
      rr(x0, 60, w, 760, 10); g.fillStyle = '#4a2e1e'; g.fill();
      for (let s = 0; s < 6; s++) { const y = 100 + s * 120; g.fillStyle = '#5e3b26'; g.fillRect(x0 + 10, y + 100, w - 20, 12);
        for (let b = 0, x = x0 + 16; x < x0 + w - 30; b++) { const bw = 16 + (b * 7) % 14, bh = 70 + (b * 13) % 26; g.fillStyle = ['#a33b3b', '#3b6aa3', '#3ba37a', '#c9a24a', '#7a3ba3'][b % 5]; g.fillRect(x, y + 100 - bh, bw, bh); x += bw + 3; } }
    });
    // tall windows with stars
    for (let i = 0; i < 3; i++) { const x = 520 + i * 200; g.fillStyle = lin(0, 40, 0, 260, [[0, '#1a2a6a'], [1, '#3a4a9a']]); g.beginPath(); g.moveTo(x, 260); g.lineTo(x, 90); g.arc(x + 60, 90, 60, Math.PI, 0); g.lineTo(x + 120, 260); g.closePath(); g.fill(); g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.stroke(); }
    // the giant open book
    g.fillStyle = '#5a2e1e'; rr(330, 210, 940, 600, 30); g.fill();
    g.fillStyle = lin(0, 230, 0, 790, [[0, '#fff6e2'], [1, '#ecd9b4']]);
    g.beginPath(); g.moveTo(350, 240); g.quadraticCurveTo(580, 200, 800, 250); g.lineTo(800, 780); g.quadraticCurveTo(580, 740, 350, 780); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(1250, 240); g.quadraticCurveTo(1020, 200, 800, 250); g.lineTo(800, 780); g.quadraticCurveTo(1020, 740, 1250, 780); g.closePath(); g.fill();
    g.strokeStyle = '#c9a77a'; g.lineWidth = 3; g.beginPath(); g.moveTo(800, 250); g.lineTo(800, 780); g.stroke();
    g.strokeStyle = '#d8c39c'; g.lineWidth = 2; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(350 - k * 3, 240 + k * 6); g.lineTo(350 - k * 3, 780 + k * 3); g.stroke(); g.beginPath(); g.moveTo(1250 + k * 3, 240 + k * 6); g.lineTo(1250 + k * 3, 780 + k * 3); g.stroke(); }
    // reading desk and candles
    rr(240, 800, 1120, 70, 16); g.fillStyle = '#6b3f26'; g.fill();
    [[300, 790], [1300, 790]].forEach(([x, y]) => { rr(x - 10, y - 60, 20, 60, 4); g.fillStyle = '#fff4d8'; g.fill(); ell(x, y - 70, 10, 16, '#ffd36b'); });
    vignetteBase('#0c0716', .45);
  }

  // ============ 11 canal ============
  function canal() {
    g.fillStyle = lin(0, 0, 0, 260, [[0, '#8fdcff'], [1, '#e2f8ff']]); g.fillRect(0, 0, W, 270);
    [[260, 70], [800, 50], [1300, 90]].forEach(([x, y], i) => blob(x, y, 120, 6, '#ffffff', i));
    for (let x = -40; x < W + 60; x += 70) { const h = 120 + (x * 7) % 60; g.strokeStyle = '#7a5a2f'; g.lineWidth = 10; g.beginPath(); g.moveTo(x, 300); g.lineTo(x + 10, 300 - h); g.stroke(); for (let k = 0; k < 6; k++) leafG(x + 10, 300 - h, 70, -Math.PI + k * Math.PI / 5, k % 2 ? '#2f8f45' : '#3fa557'); }
    g.fillStyle = '#7cc66a'; g.fillRect(0, 260, W, 60);
    // the canal
    g.fillStyle = lin(0, 300, 0, 800, [[0, '#7fe0f5'], [.5, '#47c0e8'], [1, '#2a9fd6']]); g.fillRect(0, 300, W, 500);
    g.strokeStyle = '#ffffff33'; g.lineWidth = 3; for (let i = 0; i < 26; i++) { const y = 320 + (i * 83) % 460, x = (i * 211) % W; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30, y - 6, x + 60, y); g.stroke(); }
    // stone edges
    for (let x = 0; x < W; x += 54) { ell(x + 20, 304, 30, 12, '#b9b2a3', '#948d7f', 2); ell(x, 806, 30, 12, '#b9b2a3', '#948d7f', 2); }
    // delivery dock on the right
    rr(1470, 420, 130, 240, 10); g.fillStyle = '#b5814f'; g.fill(); for (let y = 430; y < 660; y += 26) { g.fillStyle = '#9b6a3f'; g.fillRect(1470, y, 130, 4); }
    // lily pads
    [[300, 360], [700, 760], [1000, 340], [1180, 770], [520, 560]].forEach(([x, y], i) => { ell(x, y, 34, 14, '#4fae4a'); if (i % 2) flower(x, y - 6, .6, '#ffb3d6', '#ffe27a'); });
    // grass bank and reeds in front
    g.fillStyle = lin(0, 800, 0, 900, [[0, '#7cc66a'], [1, '#5fae43']]); g.fillRect(0, 812, W, 90);
    g.strokeStyle = '#3f8f3f'; g.lineWidth = 5; g.lineCap = 'round'; for (let i = 0; i < 22; i++) { const x = (i * 157) % W; g.beginPath(); g.moveTo(x, 900); g.quadraticCurveTo(x - 8, 850, x + (i % 2 ? 10 : -10), 820 - (i % 4) * 12); g.stroke(); }
  }

  // ============ 12 cinema ============
  function cinema() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#2a0e18'], [1, '#14070c']]); g.fillRect(0, 0, W, H);
    // screen
    rr(500, 130, 600, 330, 10); g.fillStyle = '#f8f1e2'; g.fill(); g.strokeStyle = '#c9a24a'; g.lineWidth = 10; g.stroke();
    g.fillStyle = rad(800, 300, 20, 360, [[0, '#ffffff'], [1, '#efe2c4']]); g.fillRect(506, 136, 588, 318);
    // curtains
    [[0, 1], [1600, -1]].forEach(([x0, d]) => { for (let i = 0; i < 7; i++) { const x = x0 + d * (i * 60); g.fillStyle = lin(x, 0, x + d * 60, 0, [[0, '#a3162e'], [.5, '#d63a4e'], [1, '#8a1026']]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + d * 60, 0); g.quadraticCurveTo(x + d * (70 - i * 4), 500, x + d * 40, 900); g.lineTo(x, 900); g.closePath(); g.fill(); } });
    g.fillStyle = '#b81d35'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 70); for (let x = W; x >= 0; x -= 100) g.quadraticCurveTo(x - 50, 120, x - 100, 70); g.closePath(); g.fill();
    g.fillStyle = '#e9c45a'; for (let x = 50; x < W; x += 100) { ell(x, 100, 8, 8, '#e9c45a'); }
    // stage floor with spots
    g.fillStyle = lin(0, 480, 0, 900, [[0, '#6b3a22'], [1, '#3a1d10']]); g.fillRect(0, 480, W, 420);
    g.strokeStyle = '#00000033'; g.lineWidth = 2; for (let y = 500; y < 900; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    [[400, 560], [600, 560], [800, 560], [1000, 560], [1200, 560], [300, 790], [550, 790], [800, 790], [1050, 790], [1300, 790]].forEach(([x, y]) => { ell(x, y + 6, 80, 20, '#00000044'); ell(x, y, 74, 18, '#ffffff1a', '#e9c45a55', 3); });
    // wall lamps
    [[180, 380], [1420, 380]].forEach(([x, y]) => { ell(x, y, 60, 60, rad(x, y, 0, 60, [[0, '#ffdc8a88'], [1, '#ffdc8a00']])); rr(x - 10, y - 20, 20, 36, 6); g.fillStyle = '#ffd36b'; g.fill(); });
    vignetteBase('#0a0306', .4);
  }

  const BUILD = { g7: garden, g8: candy, g9: hamster, g10: library, g11: canal, g12: cinema };
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
