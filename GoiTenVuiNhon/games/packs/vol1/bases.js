// Code-drawn base backgrounds for games 2-6 (the bottom layer, like the duck race's river).
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

  // ============ 02 dinosaur valley ============
  function eggs() {
    const NESTS = [[387, 327], [620, 300], [1013, 300], [1240, 327], [227, 407], [1387, 407], [180, 513], [1433, 520], [320, 620], [1287, 620]];
    g.fillStyle = lin(0, 0, 0, 280, [[0, '#6cc8ff'], [1, '#dff6ff']]); g.fillRect(0, 0, W, 300);
    // far mountains and the volcano
    poly([[300, 230], [480, 150], [620, 220], [760, 160], [900, 230]], '#8fb7c9'); poly([[1100, 230], [1260, 140], [1420, 230]], '#8fb7c9');
    poly([[860, 235], [960, 100], [1040, 100], [1140, 235]], '#a46e55'); poly([[1000, 100], [1040, 100], [1140, 235], [1040, 235]], '#8a5843');
    poly([[960, 100], [1040, 100], [1030, 92], [970, 92]], '#5a3a2e'); g.strokeStyle = '#ff7b2e'; g.lineWidth = 7; g.beginPath(); g.moveTo(1004, 104); g.quadraticCurveTo(990, 150, 1010, 200); g.stroke();
    // jungle tree line
    for (let x = 0; x < W + 60; x += 55) blob(x, 238 + Math.sin(x * .05) * 10, 70, 6, x % 110 ? '#3c9a4a' : '#2f8a40', x);
    palm(330, 250, 120); palm(1290, 250, 110); palm(540, 245, 90, '#2b8040');
    // waterfall cliff on the left
    poly([[0, 70], [120, 60], [300, 110], [330, 330], [0, 360]], '#8d8f96'); poly([[120, 60], [300, 110], [330, 330], [240, 330]], '#73757c');
    g.fillStyle = lin(0, 110, 0, 320, [[0, '#d7f4ff'], [1, '#7fd0f0']]); rr(170, 105, 84, 220, 20); g.fill();
    ell(215, 325, 120, 30, '#6cc6ea', '#ffffff', 3);
    // grass and the sandy clearing
    g.fillStyle = lin(0, 260, 0, 900, [[0, '#86cf5c'], [1, '#5fae43']]); g.fillRect(0, 270, W, 630);
    ell(800, 480, 660, 300, '#e3bf80'); ell(800, 470, 600, 262, '#efd39d');
    g.fillStyle = '#d7b273'; [[620, 420], [900, 520], [1050, 430], [540, 560]].forEach(([x, y]) => { for (let i = 0; i < 3; i++) ell(x + i * 12 - 12, y - (i === 1 ? 10 : 4), 5, 8, '#d7b273'); ell(x, y + 8, 10, 8, '#d7b273'); });
    // stone path and the big flat stone for the winner's nest
    [[800, 700, 70, 22], [740, 650, 50, 16], [860, 640, 46, 15]].forEach(([x, y, rx, ry]) => ell(x, y, rx, ry, '#c7c2b6', '#a59f92'));
    ell(800, 790, 250, 78, '#bdb6a8'); ell(800, 780, 236, 68, '#d6d0c3', '#a59f92', 4);
    // nests (eggs sit on them)
    NESTS.forEach(([x, y]) => {
      ell(x, y + 48, 84, 32, '#8b8f97'); ell(x, y + 42, 80, 28, '#a7abb3');
      ell(x, y + 36, 70, 24, '#c9973e'); ell(x, y + 34, 54, 16, '#7a5524');
      g.strokeStyle = '#e5b55a'; g.lineWidth = 3; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * 58, y + 36 + Math.sin(a) * 20); g.lineTo(x + Math.cos(a + .35) * 70, y + 36 + Math.sin(a + .35) * 24); g.stroke(); }
    });
    // bushes, rocks and flowers framing the scene
    rock(1520, 350, 1.2); rock(40, 640, 1.1); rock(1560, 600, 1); rock(470, 870, .8, '#a5a9b0');
    blob(60, 880, 160, 7, '#2f8a40', 2); blob(1540, 880, 170, 7, '#2f8a40', 5);
    for (let i = 0; i < 6; i++) { leafG(-20, 900, 230 + i * 10, -Math.PI * .12 - i * .2, i % 2 ? '#2e8b3e' : '#3fa34d'); leafG(1620, 900, 230 + i * 10, -Math.PI * .88 + i * .2, i % 2 ? '#2e8b3e' : '#3fa34d'); }
    flower(70, 790, 2.2, '#ef4b4b', '#ffd34d'); flower(1500, 760, 2.4, '#ff79b0', '#ffe27a'); flower(180, 840, 1.4, '#ffd34d', '#ff9f43');
    flower(1350, 300, 1.4, '#ff79b0', '#ffe27a'); flower(470, 250, 1.1, '#b48cff', '#ffe27a');
  }

  // ============ 03 wizard's study ============
  function cauldron() {
    g.fillStyle = lin(0, 0, 0, 420, [[0, '#6c4ca6'], [1, '#43306e']]); g.fillRect(0, 0, W, 430);
    g.strokeStyle = '#ffffff12'; g.lineWidth = 3;                               // stone blocks
    for (let y = 30; y < 420; y += 54) for (let x = (y / 54 % 2) * 60; x < W; x += 120) { g.strokeRect(x, y, 120, 54); }
    // left window with a night castle
    g.save(); g.beginPath(); g.moveTo(80, 280); g.lineTo(80, 100); g.arc(165, 100, 85, Math.PI, 0); g.lineTo(250, 280); g.closePath(); g.clip();
    g.fillStyle = lin(0, 10, 0, 280, [[0, '#2b3f8f'], [1, '#7aa6e6']]); g.fillRect(80, 10, 170, 270);
    poly([[100, 280], [100, 210], [120, 190], [140, 210], [140, 170], [160, 150], [180, 170], [180, 220], [230, 220], [230, 280]], '#3a2f6b'); g.restore();
    g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.beginPath(); g.moveTo(80, 280); g.lineTo(80, 100); g.arc(165, 100, 85, Math.PI, 0); g.lineTo(250, 280); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(165, 15); g.lineTo(165, 280); g.moveTo(80, 170); g.lineTo(250, 170); g.stroke();
    // shelves with potions
    for (let s = 0; s < 3; s++) {
      const y = 110 + s * 80; rr(320, y, 250, 14, 4); g.fillStyle = '#7a4a2a'; g.fill();
      for (let i = 0; i < 6; i++) { const x = 340 + i * 38, c = ['#ff6b9a', '#6bd9ff', '#7cff9b', '#ffd34d', '#b48cff', '#ff9f43'][(i + s) % 6]; ell(x, y - 18, 13, 16, c + 'dd', '#ffffff88', 2); rr(x - 4, y - 42, 8, 10, 2); g.fillStyle = '#c9a24a'; g.fill(); }
    }
    // alcove + crystal ball on its table
    g.fillStyle = '#35255a'; g.beginPath(); g.moveTo(620, 330); g.lineTo(620, 150); g.arc(800, 150, 180, Math.PI, 0); g.lineTo(980, 330); g.closePath(); g.fill();
    rr(680, 240, 240, 70, 10); g.fillStyle = '#5b2d8a'; g.fill(); g.fillStyle = '#c9a24a'; g.fillRect(680, 300, 240, 8);
    ell(800, 185, 72, 72, rad(780, 165, 8, 72, [[0, '#ffffff'], [.35, '#c7b2ff'], [1, '#6a4bd6']]), '#e2d4ff', 3);
    // throne on the right
    poly([[1150, 330], [1450, 330], [1420, 280], [1180, 280]], '#5a4a78'); poly([[1220, 280], [1380, 280], [1360, 240], [1240, 240]], '#6b5a8c');
    rr(1240, 60, 120, 190, 30); g.fillStyle = '#c92a3a'; g.fill(); g.strokeStyle = '#e9c45a'; g.lineWidth = 8; g.stroke();
    rr(1220, 180, 160, 70, 16); g.fillStyle = '#a81f2e'; g.fill(); g.stroke();
    poly([[1270, 330], [1330, 330], [1330, 250], [1270, 250]], '#b8202f');
    // banners
    [[480, '#7d3cc4'], [1110, '#7d3cc4']].forEach(([x, c]) => { poly([[x - 40, 0], [x + 40, 0], [x + 40, 120], [x, 100], [x - 40, 120]], c, '#e9c45a', 4); });
    // floor with the round dais
    g.fillStyle = lin(0, 420, 0, 900, [[0, '#6a5a8e'], [1, '#3a2e58']]); g.fillRect(0, 420, W, 480);
    tiles(430, 900, 800, 200, '#ffffff14');
    ell(800, 565, 600, 250, '#7a69a3', '#e9c45a', 6); ell(800, 560, 520, 210, '#8b7ab3');
    ell(800, 555, 330, 125, '#6f5e97', '#e9c45a', 5); ell(800, 552, 250, 90, '#7d6ca5');
    [[800, 330], [470, 540], [1130, 540], [800, 775]].forEach(([x, y]) => poly([[x, y - 14], [x + 20, y], [x, y + 14], [x - 20, y]], '#f4d06f'));
    // books, potion and lantern in the corners
    [[40, 780, '#7a2f8f'], [60, 740, '#2f6f5a'], [30, 700, '#8f2f3a']].forEach(([x, y, c]) => { rr(x, y, 230, 40, 6); g.fillStyle = c; g.fill(); g.fillStyle = '#f2e6c8'; g.fillRect(x + 220, y + 6, 8, 28); });
    crystal(80, 660, 1.6, '#b48cff');
    ell(1500, 780, 56, 56, rad(1490, 765, 5, 56, [[0, '#e6fbff'], [1, '#6cc6ea']]), '#ffffff', 3); rr(1488, 700, 24, 30, 4); g.fillStyle = '#c9a24a'; g.fill();
    lantern(1540, 640, 60);
    rr(1380, 830, 300, 90, 20); g.fillStyle = '#5b2d8a'; g.fill();
    vignetteBase('#1a0b2e', .35);
  }

  // ============ 04 dragon cave ============
  function dragon() {
    const SLABS = [[537, 486], [720, 486], [907, 486], [1084, 486], [337, 532], [1256, 532], [427, 610], [671, 610], [929, 610], [1171, 610]];
    g.fillStyle = rad(800, 300, 80, 1000, [[0, '#6a4a32'], [.5, '#3e2a1d'], [1, '#1c120c']]); g.fillRect(0, 0, W, H);
    // rock texture blotches
    for (let i = 0; i < 60; i++) { const x = (i * 271) % W, y = (i * 137) % 430; ell(x, y, 40 + (i % 5) * 12, 24 + (i % 3) * 8, i % 2 ? '#ffffff08' : '#00000018'); }
    // tunnel and arches
    for (let k = 0; k < 5; k++) { const w = 280 - k * 50, h = 330 - k * 55; g.fillStyle = ['#3a281c', '#2c1e15', '#21160f', '#170f0a', '#0e0906'][k]; g.beginPath(); g.moveTo(800 - w / 2, 470); g.lineTo(800 - w / 2, 470 - h + w / 2); g.arc(800, 470 - h + w / 2, w / 2, Math.PI, 0); g.lineTo(800 + w / 2, 470); g.closePath(); g.fill(); }
    function arch(cx, w, h, thick) {
      g.strokeStyle = '#a9916e'; g.lineWidth = thick; g.beginPath(); g.moveTo(cx - w / 2, 480); g.lineTo(cx - w / 2, 480 - h + w / 2); g.arc(cx, 480 - h + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, 480); g.stroke();
      g.strokeStyle = '#7d6a4f'; g.lineWidth = 3; for (let a = Math.PI; a <= TAU + .01; a += Math.PI / 7) { const r1 = w / 2 - thick / 2, r2 = w / 2 + thick / 2, cy = 480 - h + w / 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); g.stroke(); }
    }
    arch(800, 360, 420, 46); arch(250, 300, 380, 40); arch(1350, 300, 380, 40);
    // gold piles
    [[190, 455, 170, 80], [1180, 380, 130, 62], [1450, 440, 170, 80]].forEach(([x, y, rx, ry]) => {
      g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI, 0); g.closePath(); g.fillStyle = lin(0, y - ry, 0, y, [[0, '#ffe066'], [1, '#d99a00']]); g.fill(); g.clip();
      for (let i = 0; i < 40; i++) ell(x - rx + ((i * 53) % (rx * 2)), y - ((i * 31) % ry), 9, 6, i % 3 ? '#fff1a0' : '#c98a00');
      g.restore();
    });
    // little waterfall
    g.fillStyle = lin(0, 300, 0, 420, [[0, '#d7f4ff'], [1, '#7fd0f0']]); rr(404, 300, 36, 120, 10); g.fill(); ell(422, 425, 60, 14, '#6cc6ea');
    // crystals
    [[320, 95, 1.2, '#5df2ff'], [410, 90, 1, '#c27cff'], [920, 55, 1.1, '#ff7ad9'], [1320, 65, 1.2, '#7cffb0'], [480, 270, .9, '#5df2ff'],
      [450, 760, 1.3, '#5df2ff'], [1480, 700, 1.6, '#7cffb0'], [1120, 760, 1.2, '#c27cff'], [1250, 860, 1.1, '#ff7ad9'], [120, 740, 1.2, '#ffd84a']].forEach(([x, y, s, c]) => crystal(x, y, s, c));
    // the platform, slabs and steps down to the stage
    poly([[150, 470], [1450, 470], [1560, 700], [40, 700]], lin(0, 470, 0, 700, [[0, '#d8b67a'], [1, '#c09a5e']]));
    poly([[40, 700], [1560, 700], [1560, 740], [40, 740]], '#8f6f42');
    g.strokeStyle = '#00000018'; g.lineWidth = 2; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(150 + i * 118, 470); g.lineTo(40 + i * 138, 700); g.stroke(); }
    SLABS.forEach(([x, y]) => { rr(x - 64, y - 4, 128, 30, 8); g.fillStyle = '#9a7a4a'; g.fill(); rr(x - 60, y - 10, 120, 26, 8); g.fillStyle = '#ead1a0'; g.fill(); });
    for (let s = 0; s < 4; s++) { const y = 740 + s * 36, w = 380 + s * 50; rr(800 - w / 2, y, w, 36, 4); g.fillStyle = s % 2 ? '#b18e58' : '#c6a36a'; g.fill(); g.fillStyle = '#7d5f37'; g.fillRect(800 - w / 2, y + 30, w, 6); }
    // pillars flanking the steps
    [[540, 720], [1060, 720]].forEach(([x, y]) => { rr(x - 22, y - 70, 44, 90, 6); g.fillStyle = '#a9916e'; g.fill(); rr(x - 28, y - 80, 56, 16, 4); g.fillStyle = '#8e7756'; g.fill(); });
    // lanterns and foreground rocks
    lantern(180, 230, 90); lantern(1180, 140, 90); lantern(950, 190, 60);
    rock(70, 900, 2.4, '#4a3a2c', '#33271d'); rock(1530, 900, 2.6, '#4a3a2c', '#33271d'); rock(1400, 880, 1.3, '#5a4836', '#3d3024');
    for (let i = 0; i < 5; i++) { leafG(-10, 860, 200, -.3 - i * .25, i % 2 ? '#2f7a3a' : '#3c8f45'); leafG(1610, 840, 200, -2.8 + i * .25, i % 2 ? '#2f7a3a' : '#3c8f45'); }
    vignetteBase('#0e0805', .45);
  }

  // ============ 05 robot factory ============
  function robots() {
    g.fillStyle = lin(0, 0, 0, 460, [[0, '#a9c6dc'], [1, '#d6e4ef']]); g.fillRect(0, 0, W, 460);
    // tall windows with the city outside
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 260; g.fillStyle = lin(0, 20, 0, 250, [[0, '#7fc8f2'], [1, '#d8f1ff']]); g.fillRect(x, 20, 230, 230);
      g.fillStyle = '#b6d4e8'; for (let b = 0; b < 5; b++) g.fillRect(x + 10 + b * 44, 250 - (60 + ((b * 37 + i * 23) % 80)), 34, 60 + ((b * 37 + i * 23) % 80));
      g.strokeStyle = '#4d6a82'; g.lineWidth = 8; g.strokeRect(x, 20, 230, 230); g.lineWidth = 4; g.beginPath(); g.moveTo(x + 115, 20); g.lineTo(x + 115, 250); g.moveTo(x, 135); g.lineTo(x + 230, 135); g.stroke();
    }
    // roof truss
    g.strokeStyle = '#3d566e'; g.lineWidth = 10; g.beginPath(); g.moveTo(0, 14); g.lineTo(W, 14); g.stroke(); g.lineWidth = 5;
    for (let x = 0; x < W; x += 80) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x + 40, 0); g.lineTo(x + 80, 14); g.stroke(); }
    // pipes
    rr(0, 300, W, 26, 13); g.fillStyle = '#e09a2a'; g.fill(); rr(0, 304, W, 6, 3); g.fillStyle = '#ffd37a'; g.fill();
    rr(30, 0, 30, 640, 15); g.fillStyle = '#7f8c99'; g.fill(); rr(1540, 0, 30, 520, 15); g.fill();
    // glass tank
    rr(570, 180, 460, 240, 30); g.fillStyle = '#3d566e'; g.fill();
    rr(590, 196, 420, 200, 22); g.fillStyle = lin(0, 196, 0, 396, [[0, '#b8f4ff'], [1, '#5fd2f0']]); g.fill();
    g.fillStyle = '#ffffff55'; g.fillRect(620, 210, 30, 170); g.fillRect(670, 210, 12, 170);
    [700, 800, 900].forEach(x => { rr(x - 30, 184, 60, 10, 5); g.fillStyle = '#e8fbff'; g.fill(); });
    for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#2b2b2b' : '#ffcc33'; poly([[570 + i * 38, 420], [608 + i * 38, 420], [590 + i * 38, 444], [552 + i * 38, 444]], g.fillStyle); }
    // robot arms
    function arm(x, flip) {
      const s = flip ? -1 : 1; rr(x - 50, 380, 100, 50, 10); g.fillStyle = '#3d566e'; g.fill();
      g.strokeStyle = '#f2b51d'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, 390); g.lineTo(x - 30 * s, 300); g.lineTo(x + 50 * s, 240); g.stroke();
      ell(x - 30 * s, 300, 18, 18, '#3d566e'); ell(x + 50 * s, 240, 16, 16, '#3d566e');
      g.strokeStyle = '#3d566e'; g.lineWidth = 8; g.beginPath(); g.moveTo(x + 60 * s, 236); g.lineTo(x + 80 * s, 260); g.moveTo(x + 60 * s, 236); g.lineTo(x + 86 * s, 226); g.stroke();
    }
    arm(460, false); arm(1140, true);
    [[330, 380], [1160, 380]].forEach(([x, y]) => { rr(x, y, 110, 70, 10); g.fillStyle = '#2f6d9a'; g.fill(); rr(x + 12, y + 10, 86, 34, 6); g.fillStyle = '#8ff6ff'; g.fill(); [0, 1, 2].forEach(i => ell(x + 25 + i * 30, y + 56, 6, 6, ['#ff5d5d', '#ffd84a', '#5dff9a'][i])); });
    // floor
    g.fillStyle = lin(0, 440, 0, 900, [[0, '#c8d3de'], [1, '#9eabb8']]); g.fillRect(0, 440, W, 460);
    g.strokeStyle = '#ffffff40'; g.lineWidth = 2; for (let x = 0; x < W; x += 160) { g.beginPath(); g.moveTo(x, 440); g.lineTo(x - 60, 900); g.stroke(); } for (let y = 520; y < 900; y += 110) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = '#f2c230'; g.lineWidth = 6; rr(290, 470, 1020, 140, 12); g.stroke();
    // the conveyor belt
    rr(130, 628, 1450, 100, 46); g.fillStyle = '#2d3744'; g.fill();
    rr(150, 640, 1410, 52, 24); g.fillStyle = '#4b5868'; g.fill();
    for (let k = 0; k < 11; k++) { const x = 240 + k * 130.6; if (x > 1520) break; rr(x - 50, 644, 100, 28, 8); g.fillStyle = '#8ff6ff'; g.fill(); rr(x - 50, 644, 100, 8, 4); g.fillStyle = '#e8fdff'; g.fill(); }
    for (let x = 170; x < 1560; x += 46) ell(x, 708, 9, 9, '#1b222b', '#7f8c99', 2);
    rr(130, 726, 1450, 10, 5); g.fillStyle = '#f2c230'; g.fill();
    // left tunnel the robots come from
    rr(60, 470, 230, 280, 40); g.fillStyle = '#3f8f9e'; g.fill(); rr(90, 510, 170, 240, 30); g.fillStyle = '#16252e'; g.fill();
    g.strokeStyle = '#f2c230'; g.lineWidth = 6; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(140 + i * 28, 590); g.lineTo(158 + i * 28, 610); g.lineTo(140 + i * 28, 630); g.stroke(); }
    // winner charging bay on the right
    g.fillStyle = '#f2b51d'; g.beginPath(); g.moveTo(1360, 470); g.lineTo(1360, 330); g.arc(1460, 330, 100, Math.PI, 0); g.lineTo(1560, 470); g.closePath(); g.fill();
    g.fillStyle = rad(1460, 380, 10, 120, [[0, '#fff8c8'], [1, '#f5c443']]); g.beginPath(); g.moveTo(1385, 470); g.lineTo(1385, 335); g.arc(1460, 335, 75, Math.PI, 0); g.lineTo(1535, 470); g.closePath(); g.fill();
    rr(1380, 440, 160, 40, 12); g.fillStyle = '#3d566e'; g.fill();
    // crates and a big gear in the foreground
    [[40, 800, 130], [170, 820, 110]].forEach(([x, y, s]) => { rr(x, y, s, s * .8, 8); g.fillStyle = '#c98a4a'; g.fill(); g.strokeStyle = '#8a5a2f'; g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y + s * .8); g.stroke(); });
    rr(1460, 790, 120, 110, 14); g.fillStyle = '#7f8c99'; g.fill(); rr(1450, 780, 140, 26, 10); g.fillStyle = '#5d6975'; g.fill();
    for (let i = 0; i < 4; i++) { leafG(1620, 760, 150, -2.6 + i * .3, '#3c9a4a'); leafG(-20, 260, 130, -.2 + i * .3, '#3c9a4a'); }
  }

  // ============ 06 haunted hotel ============
  function hotel() {
    const XS = [451, 627, 804, 980, 1157];
    g.fillStyle = lin(0, 0, 0, 560, [[0, '#3a2160'], [1, '#2a1846']]); g.fillRect(0, 0, W, 580);
    // windows with the moon (left) and a night sky (right)
    [[110, 270, 20, 260], [1350, 1510, 30, 270]].forEach(([x0, x1, y0, y1], i) => {
      const cx = (x0 + x1) / 2, r = (x1 - x0) / 2;
      g.save(); g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + r); g.arc(cx, y0 + r, r, Math.PI, 0); g.lineTo(x1, y1); g.closePath(); g.clip();
      g.fillStyle = lin(0, y0, 0, y1, [[0, '#1d2a6a'], [1, '#4a5aa8']]); g.fillRect(x0, y0, x1 - x0, y1 - y0);
      if (!i) ell(190, 100, 42, 42, '#fff4c8');
      poly([[x0, y1], [x0, y1 - 50], [x0 + 30, y1 - 70], [x0 + 60, y1 - 45], [x0 + 100, y1 - 80], [x1, y1 - 40], [x1, y1]], '#1a1236'); g.restore();
      g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + r); g.arc(cx, y0 + r, r, Math.PI, 0); g.lineTo(x1, y1); g.stroke();
      g.lineWidth = 4; g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y1); g.stroke();
    });
    // curtains
    [[0, 70], [1530, 1600]].forEach(([a, b]) => { g.fillStyle = lin(a, 0, b, 0, [[0, '#6b1f6e'], [1, '#9b3aa0']]); g.fillRect(a, 0, b - a, 600); });
    // columns between the lift doors
    [365, 540, 716, 892, 1068, 1245].forEach(x => { rr(x - 16, 60, 32, 500, 6); g.fillStyle = '#5a3a86'; g.fill(); rr(x - 22, 56, 44, 14, 4); g.fillStyle = '#c9a24a'; g.fill(); });
    // two floors of lift doors with icon plates
    function door(x, bottom, plateY) {
      g.fillStyle = '#c9a24a'; g.beginPath(); g.moveTo(x - 58, bottom + 4); g.lineTo(x - 58, bottom - 112); g.arc(x, bottom - 112, 58, Math.PI, 0); g.lineTo(x + 58, bottom + 4); g.closePath(); g.fill();
      g.fillStyle = '#2a1846'; g.beginPath(); g.moveTo(x - 48, bottom); g.lineTo(x - 48, bottom - 112); g.arc(x, bottom - 112, 48, Math.PI, 0); g.lineTo(x + 48, bottom); g.closePath(); g.fill();
      g.fillStyle = rad(x, bottom - 140, 4, 46, [[0, '#ffe8a8'], [1, '#e2a83e']]); g.beginPath(); g.arc(x, bottom - 112, 40, Math.PI, 0); g.fill();
      g.fillStyle = lin(x - 40, 0, x + 40, 0, [[0, '#e4b35a'], [.5, '#f4d389'], [1, '#c48a34']]); g.fillRect(x - 40, bottom - 112, 80, 112);
      g.strokeStyle = '#8a5a1f'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, bottom - 112); g.lineTo(x, bottom); g.stroke(); g.strokeRect(x - 34, bottom - 104, 28, 96); g.strokeRect(x + 6, bottom - 104, 28, 96);
      rr(x + 54, bottom - 80, 14, 40, 4); g.fillStyle = '#c9a24a'; g.fill(); ell(x + 61, bottom - 68, 3, 3, '#fff3a0'); ell(x + 61, bottom - 52, 3, 3, '#fff3a0');
      g.fillStyle = '#f3e3c3'; g.strokeStyle = '#c9a24a'; g.lineWidth = 4; g.beginPath(); [-18, 0, 18].forEach(dx => g.arc(x + dx, plateY - (dx ? 0 : 6), dx ? 18 : 22, 0, TAU)); g.fill(); g.stroke();
      g.beginPath(); [-18, 0, 18].forEach(dx => g.arc(x + dx, plateY - (dx ? 0 : 6), dx ? 16 : 20, 0, TAU)); g.fill();
    }
    XS.forEach(x => { door(x, 307, 171); door(x, 527, 380); });
    // balcony between the floors
    rr(300, 318, 1000, 14, 6); g.fillStyle = '#c9a24a'; g.fill();
    for (let x = 310; x < 1300; x += 24) { rr(x, 332, 10, 26, 4); g.fillStyle = '#a8823a'; g.fill(); }
    rr(300, 356, 1000, 10, 4); g.fillStyle = '#c9a24a'; g.fill();
    // staircases curving down on both sides
    [[1, 0], [-1, 1600]].forEach(([d, x0]) => {
      g.fillStyle = '#7a2f6e'; g.beginPath(); g.moveTo(x0, 250); g.quadraticCurveTo(x0 + d * 260, 300, x0 + d * 300, 560); g.lineTo(x0 + d * 200, 560); g.quadraticCurveTo(x0 + d * 170, 340, x0, 330); g.closePath(); g.fill();
      g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.beginPath(); g.moveTo(x0, 230); g.quadraticCurveTo(x0 + d * 280, 280, x0 + d * 310, 540); g.stroke();
    });
    // floor
    g.fillStyle = lin(0, 560, 0, 900, [[0, '#5d4d7c'], [1, '#382c52']]); g.fillRect(0, 560, W, 340);
    tiles(565, 900, 800, 360, '#ffffff16');
    // light stone paths from the doors to the pedestal
    g.strokeStyle = '#c9bfd9'; g.lineWidth = 26; g.lineCap = 'round'; g.globalAlpha = .45;
    XS.forEach(x => { g.beginPath(); g.moveTo(x, 575); g.quadraticCurveTo(x, 690, 800 + (x - 800) * .2, 720); g.stroke(); }); g.globalAlpha = 1;
    // pedestal
    ell(800, 770, 200, 56, '#3d2a63'); ell(800, 755, 180, 48, '#5a3a86', '#c9a24a', 6); ell(800, 745, 140, 36, rad(800, 745, 10, 150, [[0, '#ffe8a8'], [1, '#c99a3a']]));
    // signpost
    rr(170, 540, 16, 200, 6); g.fillStyle = '#c9a24a'; g.fill(); ell(178, 742, 60, 16, '#5a3a86', '#c9a24a', 4);
    poly([[60, 545], [170, 545], [170, 585], [60, 585], [40, 565]], '#f2cf6a', '#8a5a1f', 4); poly([[186, 595], [296, 595], [316, 615], [296, 635], [186, 635]], '#f2cf6a', '#8a5a1f', 4);
    // fountain
    ell(1480, 620, 120, 34, '#4a3a6a', '#c9bfd9', 5); ell(1480, 612, 100, 26, '#6cc6ea'); rr(1470, 520, 20, 90, 6); g.fillStyle = '#c9bfd9'; g.fill(); ell(1480, 520, 40, 12, '#c9bfd9');
    // carpet and corner lanterns, plants
    rr(340, 860, 920, 60, 10); g.fillStyle = '#7a1f4a'; g.fill(); g.strokeStyle = '#c9a24a'; g.lineWidth = 4; g.strokeRect(356, 868, 888, 44);
    lantern(93, 787, 0); lantern(1460, 773, 0);
    [[40, 860], [1560, 860]].forEach(([x, y], i) => { for (let k = 0; k < 6; k++) leafG(x, y, 130, -Math.PI / 2 + (k - 2.5) * .35, k % 2 ? '#3c7a4a' : '#4c9a5a'); for (let k = 0; k < 5; k++) ell(x - 30 + k * 16, y - 120 + (k % 2) * 14, 14, 14, '#b48cff'); });
    vignetteBase('#140a24', .35);
  }

  const BUILD = { g2: eggs, g3: cauldron, g4: dragon, g5: robots, g6: hotel };
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
