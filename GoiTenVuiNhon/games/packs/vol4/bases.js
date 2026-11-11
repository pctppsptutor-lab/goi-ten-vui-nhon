// Code-drawn base backgrounds for games 19-24 (the bottom layer, like the duck race's river).
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

  // ============ 19 laundry room ============
  function laundry() {
    g.fillStyle = lin(0, 0, 0, 400, [[0, '#cfeefc'], [1, '#a9dcf3']]); g.fillRect(0, 0, W, 410);
    for (let y = 30; y < 400; y += 60) for (let x = (y / 60 % 2) * 60; x < W; x += 120) { rr(x + 4, y + 4, 112, 52, 6); g.fillStyle = '#ffffff33'; g.fill(); }
    // washing line with pegs and socks hanging
    g.strokeStyle = '#7a8a9a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 80); g.quadraticCurveTo(600, 130, 1200, 80); g.stroke();
    [[180, '#ff6f6f'], [380, '#7cd0ff'], [600, '#7cff9b'], [820, '#ffd84a'], [1040, '#b48cff']].forEach(([x, c]) => { const y = 90 + Math.sin(x / 1200 * Math.PI) * 30; rr(x - 12, y, 24, 46, 8); g.fillStyle = c; g.fill(); rr(x - 12, y + 36, 34, 16, 8); g.fill(); rr(x - 3, y - 12, 6, 16, 2); g.fillStyle = '#c99561'; g.fill(); });
    // shelves with detergent
    rr(1250, 180, 300, 14, 4); g.fillStyle = '#a0703f'; g.fill();
    [[1290, '#ff6fae'], [1360, '#7cd0ff'], [1430, '#b48cff']].forEach(([x, c]) => { rr(x - 20, 120, 40, 60, 10); g.fillStyle = c; g.fill(); });
    // tiled floor
    g.fillStyle = lin(0, 400, 0, 900, [[0, '#e8f2fa'], [1, '#c6d8e6']]); g.fillRect(0, 400, W, 500);
    g.strokeStyle = '#ffffff99'; g.lineWidth = 2; for (let x = 0; x < W; x += 80) { g.beginPath(); g.moveTo(x, 400); g.lineTo(x - 40, 900); g.stroke(); } for (let y = 440; y < 900; y += 70) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // soap puddles and laundry baskets
    [[1400, 760], [300, 650]].forEach(([x, y]) => ell(x, y, 120, 26, '#ffffff88'));
    [[60, 880, '#ff6f6f'], [1560, 880, '#7cd0ff']].forEach(([x, y, c]) => { rr(x - 60, y - 60, 120, 70, 12); g.fillStyle = c; g.fill(); ell(x, y - 64, 56, 18, '#ffd84a'); });
  }

  // ============ 20 cat playroom ============
  function catroom() {
    g.fillStyle = lin(0, 0, 0, 400, [[0, '#fff0dc'], [1, '#ffe2c0']]); g.fillRect(0, 0, W, 410);
    for (let x = 30; x < W; x += 90) for (let y = 30; y < 380; y += 90) { ell(x, y, 8, 8, '#f7caa0'); [-10, 0, 10].forEach(d => ell(x + d, y - 13, 4, 4, '#f7caa0')); }
    // big window with a sunbeam and cat shelves
    rr(620, 40, 360, 220, 18); g.fillStyle = lin(0, 40, 0, 260, [[0, '#9fe0ff'], [1, '#e0f6ff']]); g.fill(); g.strokeStyle = '#c99561'; g.lineWidth = 10; g.stroke();
    blob(800, 240, 160, 5, '#7cc66a', 1);
    [[100, 150], [260, 230], [1340, 150], [1480, 230]].forEach(([x, y]) => { rr(x - 70, y, 140, 16, 6); g.fillStyle = '#a0703f'; g.fill(); ell(x, y - 6, 50, 14, '#ff9fc4'); });
    // wooden floor
    g.fillStyle = lin(0, 400, 0, 900, [[0, '#e8b77f'], [1, '#c98f52']]); g.fillRect(0, 400, W, 500);
    g.strokeStyle = '#00000018'; g.lineWidth = 3; for (let y = 430; y < 900; y += 46) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (y * 7) % 300; x < W; x += 300) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 46); g.stroke(); } }
    // rug where the cats zoom
    ell(800, 640, 680, 230, '#ff9fc488'); ell(800, 640, 620, 200, null, '#ffffff88', 5);
    // scratching post and yarn
    rr(1460, 520, 40, 200, 10); g.fillStyle = '#e8d3a8'; g.fill(); ell(1480, 720, 80, 20, '#a0703f'); ell(1480, 512, 60, 16, '#a0703f');
    ell(90, 860, 40, 40, '#ff6f8f'); ell(160, 870, 30, 30, '#7cd0ff');
  }

  // ============ 21 mummy stage ============
  function mummyStage() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#2a1c3f'], [1, '#160f24']]); g.fillRect(0, 0, W, H);
    // curtains
    [[0, 1], [1600, -1]].forEach(([x0, d]) => { for (let i = 0; i < 5; i++) { const x = x0 + d * i * 50; g.fillStyle = lin(x, 0, x + d * 50, 0, [[0, '#5a2a86'], [.5, '#8a4ac4'], [1, '#4a1f72']]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + d * 50, 0); g.quadraticCurveTo(x + d * 60, 450, x + d * 30, 900); g.lineTo(x, 900); g.closePath(); g.fill(); } });
    g.fillStyle = '#7a3ab8'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 60); for (let x = W; x >= 0; x -= 100) g.quadraticCurveTo(x - 50, 110, x - 100, 60); g.closePath(); g.fill();
    // paper streamers hanging
    for (let i = 0; i < 12; i++) { const x = 300 + i * 90; g.strokeStyle = '#ffffff88'; g.lineWidth = 12; g.beginPath(); g.moveTo(x, 80); g.quadraticCurveTo(x + 20, 150, x - 10, 200 + (i % 3) * 30); g.stroke(); }
    // stage
    g.fillStyle = lin(0, 380, 0, 900, [[0, '#8a5a3a'], [1, '#5a3a24']]); g.fillRect(0, 380, W, 520);
    g.strokeStyle = '#00000022'; g.lineWidth = 2; for (let y = 400; y < 900; y += 36) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    [[210, 500], [440, 500], [670, 500], [900, 500], [1130, 500], [210, 790], [440, 790], [670, 790], [900, 790], [1130, 790]].forEach(([x, y]) => ell(x, y + 4, 80, 18, '#ffffff22', '#ffd84a55', 3));
    rr(0, 380, W, 12, 4); g.fillStyle = '#e9c45a'; g.fill();
    vignetteBase('#0a0614', .4);
  }

  // ============ 22 chicken disco ============
  function chickenDisco() {
    g.fillStyle = lin(0, 0, 0, 900, [[0, '#3a0f2e'], [1, '#1a0716']]); g.fillRect(0, 0, W, H);
    // barn-wood walls with string lights
    for (let x = 0; x < W; x += 70) { g.fillStyle = (x / 70) % 2 ? '#4a1c3a' : '#55203f'; g.fillRect(x, 0, 70, 430); }
    g.strokeStyle = '#2a0a1e'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, 130 + Math.sin(x / 120) * 20); g.stroke();
    for (let x = 20; x < W; x += 60) ell(x, 140 + Math.sin(x / 120) * 20, 6, 8, ['#ff6fae', '#ffd84a', '#7cf7ff', '#7cff9b'][(x / 60 | 0) % 4]);
    // DJ booth
    rr(640, 330, 320, 90, 16); g.fillStyle = '#2a2a4a'; g.fill(); g.strokeStyle = '#ff6fae'; g.lineWidth = 5; g.stroke();
    [700, 900].forEach(x => { ell(x, 345, 36, 10, '#111'); ell(x, 345, 10, 3, '#ff6fae'); });
    // light-up floor
    const top = 440, bottom = 900, rows = 7;
    for (let r2 = 0; r2 < rows; r2++) {
      const y0 = top + (bottom - top) * Math.pow(r2 / rows, 1.3), y1 = top + (bottom - top) * Math.pow((r2 + 1) / rows, 1.3);
      for (let c = -8; c < 8; c++) { const x0a = 800 + c * (90 + r2 * 22), x0b = 800 + c * (90 + (r2 + 1) * 22); poly([[x0a, y0], [x0a + 90 + r2 * 22, y0], [x0b + 90 + (r2 + 1) * 22, y1], [x0b, y1]], ['#ff6fae', '#ffd84a', '#7cf7ff', '#7cff9b'][(c + r2 + 16) % 4] + '44', '#ffffff1a', 2); }
    }
    // hay bales
    [[90, 520], [1510, 520]].forEach(([x, y]) => { rr(x - 70, y - 50, 140, 70, 10); g.fillStyle = '#e8c45a'; g.fill(); g.strokeStyle = '#c99a2a'; g.lineWidth = 3; for (let k = -50; k < 20; k += 14) { g.beginPath(); g.moveTo(x - 66, y + k); g.lineTo(x + 66, y + k); g.stroke(); } });
    vignetteBase('#0a0208', .4);
  }

  // ============ 23 lily pond ============
  function pond() {
    g.fillStyle = lin(0, 0, 0, 230, [[0, '#8fdcff'], [1, '#e2f8ff']]); g.fillRect(0, 0, W, 240);
    [[260, 60], [900, 40], [1350, 80]].forEach(([x, y], i) => blob(x, y, 110, 6, '#ffffff', i));
    for (let x = -40; x < W + 60; x += 60) blob(x, 230 + Math.sin(x * .05) * 8, 70, 5, x % 120 ? '#4f9e3f' : '#3f8f3a', x);
    g.fillStyle = lin(0, 240, 0, 900, [[0, '#4fc4c0'], [.5, '#2fa8b0'], [1, '#1f8a98']]); g.fillRect(0, 250, W, 650);
    g.strokeStyle = '#ffffff22'; g.lineWidth = 3; for (let i = 0; i < 30; i++) { const y = 270 + (i * 83) % 620, x = (i * 211) % W; g.beginPath(); g.ellipse(x, y, 40, 8, 0, 0, TAU); g.stroke(); }
    // reeds and rocks around the edge
    g.strokeStyle = '#3f7a3a'; g.lineWidth = 6; g.lineCap = 'round'; for (let i = 0; i < 18; i++) { const x = (i * 97) % W, y = i % 2 ? 900 : 260; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 6, y - 50, x + 8, y - 90); g.stroke(); ell(x + 8, y - 96, 6, 16, '#7a4a24'); }
    rock(1540, 300, 1.2, '#8a97a6', '#6f7a86'); rock(60, 880, 1.4, '#8a97a6', '#6f7a86');
    // royal rock for the frog king
    ell(1500, 270, 90, 26, '#6f7a86'); ell(1500, 262, 80, 20, '#8a97a6');
  }

  // ============ 24 pirate island ============
  function island() {
    g.fillStyle = lin(0, 0, 0, 400, [[0, '#7cd0ff'], [1, '#d8f4ff']]); g.fillRect(0, 0, W, 410);
    [[300, 70], [800, 50]].forEach(([x, y], i) => blob(x, y, 110, 6, '#ffffff', i));
    g.fillStyle = lin(0, 300, 0, 900, [[0, '#2fb6e8'], [1, '#1f7fbf']]); g.fillRect(0, 300, W, 600);
    g.strokeStyle = '#ffffff44'; g.lineWidth = 3; for (let i = 0; i < 20; i++) { const y = 320 + (i * 61) % 400, x = (i * 173) % W; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 30, y - 8, x + 60, y); g.stroke(); }
    // the island the machine sits on
    g.fillStyle = '#f2cf86'; g.beginPath(); g.moveTo(100, 420); g.quadraticCurveTo(600, 230, 1100, 470); g.quadraticCurveTo(700, 560, 100, 420); g.fill();
    palm(140, 380, 180); palm(1040, 450, 150);
    // parcel dock on the right
    rr(1120, 100, 330, 640, 18); g.fillStyle = '#a0703f'; g.fill(); for (let y = 110; y < 740; y += 28) { g.fillStyle = '#8a5a2f'; g.fillRect(1120, y, 330, 4); }
    for (let i = 0; i < 5; i++) { rr(1130, 196 + i * 140, 310, 10, 4); g.fillStyle = '#6b3f22'; g.fill(); }
    // ship deck where the pirate crew stands
    g.fillStyle = lin(0, 760, 0, 900, [[0, '#a0703f'], [1, '#6b3f22']]); g.fillRect(0, 760, W, 140);
    g.strokeStyle = '#00000022'; g.lineWidth = 2; for (let y = 780; y < 900; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    rr(0, 752, W, 14, 6); g.fillStyle = '#e9c45a'; g.fill();
  }

  const BUILD = { g19: laundry, g20: catroom, g21: mummyStage, g22: chickenDisco, g23: pond, g24: island };
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
