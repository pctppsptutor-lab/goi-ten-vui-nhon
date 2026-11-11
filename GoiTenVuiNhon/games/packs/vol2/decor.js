// Extra decoration and depth for every code-drawn background, painted once on top of the base scene.
// DECOR.paint(g, id) adds three things:
//   1. a lighting pass: light from the top-left, darker floor towards the viewer, a soft haze on the far horizon;
//   2. game-specific decorations (bunting, plants, lamps, posters, pebbles, shelves, vines, banners, shrubs…) around the play area;
//   3. fine paper grain so flat fills read as painted surfaces.
const DECOR = (() => {
  const W = 1600, H = 900, TAU = Math.PI * 2;
  let g;
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const lin = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const rad = (x, y, r0, r1, stops) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function ell(x, y, rx, ry, fill, stroke, lw = 3) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
  const shade = (c, a) => c + Math.round(a * 255).toString(16).padStart(2, '0');

  // ---------- reusable decorations (all drawn with soft shadows for depth) ----------
  function withShadow(fn, blur = 14, dy = 6, a = .28) { g.save(); g.shadowColor = `rgba(20,20,50,${a})`; g.shadowBlur = blur; g.shadowOffsetY = dy; fn(); g.restore(); }
  function bunting(x0, y0, x1, y1, sag, cols) {
    g.save(); g.strokeStyle = '#7a5a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag, x1, y1); g.stroke(); g.restore();
    const n = Math.floor(Math.hypot(x1 - x0, y1 - y0) / 46);
    for (let i = 1; i < n; i++) {
      const u = i / n, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * (x0 + x1) / 2 + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (Math.max(y0, y1) + sag) + u * u * y1;
      withShadow(() => { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(x - 15, y); g.lineTo(x + 15, y); g.lineTo(x, y + 34); g.closePath(); g.fill(); }, 6, 3, .2);
      g.fillStyle = '#ffffff44'; g.beginPath(); g.moveTo(x - 15, y); g.lineTo(x - 4, y); g.lineTo(x - 6, y + 14); g.closePath(); g.fill();
    }
  }
  function stringLights(x0, y0, x1, y1, sag, cols) {
    g.save(); g.strokeStyle = '#2a2a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag, x1, y1); g.stroke(); g.restore();
    const n = Math.floor(Math.hypot(x1 - x0, y1 - y0) / 40);
    for (let i = 1; i < n; i++) {
      const u = i / n, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * (x0 + x1) / 2 + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (Math.max(y0, y1) + sag) + u * u * y1;
      const c = cols[i % cols.length];
      g.fillStyle = rad(x, y + 8, 0, 22, [[0, shade(c, .55)], [1, shade(c, 0)]]); g.fillRect(x - 24, y - 16, 48, 48);
      ell(x, y + 8, 5, 8, c); ell(x - 1.5, y + 5, 1.5, 3, '#ffffffaa');
    }
  }
  function pot(x, y, s, potCol = '#c96a4a', leaf = '#3f9a4a') {
    withShadow(() => { g.fillStyle = potCol; g.beginPath(); g.moveTo(x - 26 * s, y - 44 * s); g.lineTo(x + 26 * s, y - 44 * s); g.lineTo(x + 19 * s, y); g.lineTo(x - 19 * s, y); g.closePath(); g.fill(); });
    g.fillStyle = '#00000022'; g.fillRect(x - 26 * s, y - 44 * s, 52 * s, 8 * s);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .32; g.save(); g.translate(x, y - 44 * s); g.rotate(a); g.fillStyle = i % 2 ? leaf : shade(leaf, .85); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(18 * s, -16 * s, 0, -60 * s); g.quadraticCurveTo(-18 * s, -16 * s, 0, 0); g.fill(); g.restore(); }
  }
  function tuft(x, y, s, col = '#4f9e3f') { g.save(); g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 3 * s; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(x + i * 3 * s, y); g.quadraticCurveTo(x + i * 5 * s, y - 14 * s, x + i * 8 * s, y - (18 + Math.abs(i) * -2) * s); g.stroke(); } g.restore(); }
  function pebbles(x, y, n, col = '#b8b2a6') { for (let i = 0; i < n; i++) { const px = x + (rnd() - .5) * 60, py = y + (rnd() - .5) * 16, r = 4 + rnd() * 6; ell(px + 1, py + 2, r, r * .6, '#00000022'); ell(px, py, r, r * .65, col); ell(px - r * .3, py - r * .2, r * .3, r * .2, '#ffffff55'); } }
  function lamp(x, y, col = '#ffd36b', post = '#3d3d55', h = 160) {
    withShadow(() => { g.fillStyle = post; g.fillRect(x - 5, y - h, 10, h); g.fillRect(x - 18, y - 6, 36, 8); });
    g.fillStyle = rad(x, y - h - 8, 0, 70, [[0, shade(col, .6)], [1, shade(col, 0)]]); g.fillRect(x - 70, y - h - 78, 140, 140);
    rr(x - 14, y - h - 26, 28, 30, 8); g.fillStyle = col; g.fill(); g.fillStyle = post; g.fillRect(x - 16, y - h - 30, 32, 6);
  }
  function poster(x, y, w, h, col, accent) {
    withShadow(() => { rr(x, y, w, h, 8); g.fillStyle = '#fff8ea'; g.fill(); });
    rr(x + 8, y + 8, w - 16, h * .55, 6); g.fillStyle = col; g.fill();
    ell(x + w / 2, y + 8 + h * .28, w * .18, w * .18, accent);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#c9bfae'; g.fillRect(x + 12, y + h * .7 + i * 10, (w - 24) * (1 - i * .25), 5); }
    ell(x + w / 2, y + 4, 4, 4, '#ff6f6f');
  }
  function shelf(x, y, w, items) {
    withShadow(() => { rr(x, y, w, 12, 4); g.fillStyle = '#a0703f'; g.fill(); });
    items.forEach(([dx, c, kind]) => withShadow(() => {
      if (kind === 'jar') { rr(x + dx - 14, y - 40, 28, 40, 8); g.fillStyle = c; g.fill(); g.fillStyle = '#ffffff55'; g.fillRect(x + dx - 9, y - 34, 5, 26); }
      else if (kind === 'book') { g.fillStyle = c; g.fillRect(x + dx - 7, y - 46, 14, 46); g.fillStyle = '#ffffff44'; g.fillRect(x + dx - 7, y - 40, 14, 3); }
      else { ell(x + dx, y - 16, 16, 16, c); ell(x + dx - 5, y - 21, 5, 4, '#ffffff66'); }
    }, 6, 3, .2));
  }
  function sparkles(n, area, col = '#ffffff') { for (let i = 0; i < n; i++) { const x = area[0] + rnd() * area[2], y = area[1] + rnd() * area[3], s = 2 + rnd() * 4; g.fillStyle = shade(col, .5 + rnd() * .4); g.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? s * .35 : s, a = k * Math.PI / 4; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); } }
  function flowerBed(x, y, w, cols) { for (let i = 0; i < w / 22; i++) { const fx = x + i * 22 + rnd() * 8, fy = y + rnd() * 10; tuft(fx, fy + 6, .8); const c = cols[i % cols.length]; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; ell(fx + Math.cos(a) * 5, fy - 12 + Math.sin(a) * 5, 4, 4, c); } ell(fx, fy - 12, 3, 3, '#ffe27a'); } }
  function rug(x, y, rx, ry, col, border) { ell(x, y + 6, rx, ry, '#00000022'); ell(x, y, rx, ry, col, border, 5); ell(x, y, rx * .8, ry * .8, null, shade(border, .5), 3); }
  function crate(x, y, s, col = '#c98a4a') { withShadow(() => { rr(x - 40 * s, y - 60 * s, 80 * s, 60 * s, 6); g.fillStyle = col; g.fill(); }); g.strokeStyle = '#8a5a2f'; g.lineWidth = 4; g.strokeRect(x - 36 * s, y - 56 * s, 72 * s, 52 * s); g.beginPath(); g.moveTo(x - 36 * s, y - 56 * s); g.lineTo(x + 36 * s, y - 4 * s); g.stroke(); }
  function balloon(x, y, col) { g.save(); g.strokeStyle = '#7a8a9a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + 30); g.quadraticCurveTo(x + 8, y + 60, x, y + 90); g.stroke(); g.restore(); withShadow(() => { ell(x, y, 22, 28, col); }); ell(x - 7, y - 9, 5, 8, '#ffffff66'); }
  function clouds(n, y0, y1, a = .55) { for (let i = 0; i < n; i++) { const x = rnd() * W, y = y0 + rnd() * (y1 - y0), s = .5 + rnd() * .7; g.globalAlpha = a; [[0, 0, 34], [36, -14, 40], [76, 0, 32], [38, 12, 34]].forEach(([dx, dy, r]) => ell(x + dx * s, y + dy * s, r * s, r * s, '#ffffff')); g.globalAlpha = 1; } }
  function stars(n, y1) { for (let i = 0; i < n; i++) { const x = rnd() * W, y = rnd() * y1, r = .8 + rnd() * 1.8; ell(x, y, r, r, `rgba(255,255,255,${.4 + rnd() * .6})`); } }
  function cobweb(x, y, s, flip) { g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.strokeStyle = '#ffffff33'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 10; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 120, Math.sin(a) * 120); g.stroke(); } for (let r = 25; r < 120; r += 22) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 10; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); } g.restore(); }
  function coins(x, y, n) { for (let i = 0; i < n; i++) { const cx = x + (rnd() - .5) * 90, cy = y + (rnd() - .5) * 18; ell(cx, cy + 2, 9, 4, '#00000033'); ell(cx, cy, 9, 5, '#d99a00'); ell(cx, cy - 1, 7, 3.5, '#ffd84a'); } }
  function sign(x, y, col, text) { withShadow(() => { g.fillStyle = '#7a4a24'; g.fillRect(x - 4, y - 70, 8, 70); rr(x - 46, y - 104, 92, 40, 8); g.fillStyle = col; g.fill(); }); g.fillStyle = '#ffffff'; g.font = '700 20px "Fredoka","Baloo 2",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y - 83); }
  function vine(x, y0, len, flip = false, col = '#2f8f45') {
    const dir = flip ? -1 : 1;
    g.save(); g.strokeStyle = '#256b34'; g.lineWidth = 3.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + 18 * dir, y0 + len * .5, x + 6 * dir, y0 + len); g.stroke();
    for (let i = 1; i <= 5; i++) {
      const u = i / 5.5, lx = x + Math.sin(u * Math.PI) * 14 * dir, ly = y0 + u * len, s = (1 - u * .3) * 14, side = (i % 2 ? 1 : -1) * dir;
      g.save(); g.translate(lx, ly); g.rotate(side * .6); g.fillStyle = i % 2 ? col : '#49b35e';
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * side, -s * .4, s * 1.4 * side, s * .2); g.quadraticCurveTo(s * .6 * side, s * .7, 0, 0); g.fill(); g.restore();
    }
    g.restore();
  }
  function bannerFlag(x, y, w, h, col, trim = '#ffd84a') {
    withShadow(() => {
      g.fillStyle = col; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.lineTo(x, y + h - 18); g.lineTo(x - w / 2, y + h); g.closePath(); g.fill();
      g.strokeStyle = trim; g.lineWidth = 3; g.stroke();
    }, 8, 4, .24);
    ell(x, y + h * .42, w * .18, w * .18, trim);
  }
  function bushCluster(x, y, s = 1, col = '#3b9647', berry = '#ff6f8f') {
    withShadow(() => {
      [[-28, 4, 24], [0, -6, 30], [26, 5, 22]].forEach(([dx, dy, r], i) => ell(x + dx * s, y + dy * s, r * s, r * .8 * s, i === 1 ? '#48ab55' : col));
    }, 8, 4, .22);
    [[-16, -2], [4, -12], [18, 0], [-4, 4]].forEach(([dx, dy], i) => ell(x + dx * s, y + dy * s, 4 * s, 4 * s, i % 2 ? berry : '#ffd84a'));
  }
  function floorGlow(x, y, rx, ry, col = '#ffe89e') {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = rad(x, y, 4, Math.max(rx, ry), [[0, shade(col, .35)], [1, shade(col, 0)]]);
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); g.restore();
  }
  function booksStack(x, y, s = 1) {
    const cols = ['#e05263', '#3b82f6', '#f59e0b', '#8b5cf6'];
    for (let i = 0; i < 4; i++) {
      const w = (54 - i * 4) * s, h = 11 * s, ox = ((i % 2) * 4 - 2) * s, by = y - (i + 1) * h;
      withShadow(() => { rr(x - w / 2 + ox, by, w, h, 3); g.fillStyle = cols[i]; g.fill(); }, 4, 2, .18);
      g.fillStyle = '#fff8ea'; g.fillRect(x - w / 2 + ox + 4 * s, by + 2 * s, w - 10 * s, h - 4 * s);
    }
  }

  // ---------- lighting and texture ----------
  function lighting(floorY, warm = '#fff6dc', cool = '#1c2550') {
    g.save();
    g.globalCompositeOperation = 'soft-light'; g.fillStyle = rad(160, -40, 40, 1300, [[0, shade(warm, .85)], [1, shade(warm, 0)]]); g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = lin(0, floorY, 0, H, [[0, '#ffffff00'], [1, shade(cool, .22)]]); g.fillRect(0, floorY, W, H - floorY);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = lin(0, floorY - 70, 0, floorY + 30, [[0, '#ffffff00'], [.6, '#ffffff22'], [1, '#ffffff00']]); g.fillRect(0, floorY - 70, W, 100);
    g.restore();
  }
  let grainCv;
  function grain() {
    if (!grainCv) {
      grainCv = document.createElement('canvas'); grainCv.width = grainCv.height = 128;
      const c = grainCv.getContext('2d'), d = c.createImageData(128, 128);
      for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 60; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 16; }
      c.putImageData(d, 0, 0);
    }
    g.save(); g.globalCompositeOperation = 'overlay'; g.fillStyle = g.createPattern(grainCv, 'repeat'); g.fillRect(0, 0, W, H); g.restore();
  }

  // ---------- per-game decoration lists ----------
  const PARTY = ['#ff6f8f', '#ffd84a', '#7cd0ff', '#7cff9b', '#b48cff'];
  const GAME = {
    g7: { floor: 290, fn() { vine(60, 0, 120, false); vine(1360, 0, 110, true); bunting(220, 230, 1420, 230, 30, PARTY); [[150, 640], [1490, 640], [700, 600], [940, 600]].forEach(([x, y]) => tuft(x, y, 1.5)); bushCluster(210, 280, .95); bushCluster(1320, 280, .95, '#3b9647', '#ffd84a'); flowerBed(60, 560, 120, ['#ff6fae', '#ffd34d']); flowerBed(1400, 820, 160, ['#b48cff', '#ff9f43']); pebbles(800, 540, 9); balloon(1530, 380, '#ff6f8f'); balloon(1570, 400, '#7cd0ff'); } },
    g8: { floor: 700, fn() { bunting(0, 20, 1320, 30, 40, ['#ff5d8f', '#ffffff', '#ffd84a', '#7cf7ff']); stringLights(120, 10, 1260, 16, 32, ['#ffd84a', '#ff6fae', '#7cf7ff']); [[60, 700], [1250, 760]].forEach(([x, y], i) => balloon(x + 40, y - 320, PARTY[i])); shelf(860, 640, 300, [[30, '#ff5d8f', 'jar'], [90, '#ffd84a', 'ball'], [150, '#7cf7ff', 'jar'], [210, '#7cff9b', 'ball'], [270, '#b48cff', 'jar']]); rug(1180, 675, 140, 30, '#ff8fb8', '#ffffff'); sparkles(48, [0, 0, 1600, 700], '#ffffff'); } },
    g9: { floor: 450, fn() { stringLights(0, 150, 1600, 150, 50, ['#ffd84a', '#7cf7ff', '#ff9f43']); bunting(180, 90, 1420, 90, 26, PARTY); [[200, 640], [1450, 640]].forEach(([x, y]) => pot(x, y, .8)); bushCluster(110, 455, .9); bushCluster(1490, 455, .9); sign(1520, 560, '#3fbf6a', 'FINISH'); pebbles(400, 640, 8); pebbles(1100, 640, 8); floorGlow(800, 560, 180, 45, '#ffd84a'); } },
    g10: { floor: 800, fn() { bannerFlag(220, 30, 56, 110, '#5a1f4a'); bannerFlag(1380, 30, 56, 110, '#5a1f4a'); [[260, 820], [1340, 820]].forEach(([x, y]) => lamp(x, y, '#ffcf6b', '#4a2e1e', 200)); booksStack(160, 810, 1.2); booksStack(1440, 810, 1.2); floorGlow(800, 720, 210, 55, '#ffd84a'); sparkles(65, [300, 200, 1000, 600], '#fff3c0'); g.save(); g.globalAlpha = .15; g.fillStyle = '#c9a77a'; for (let i = 0; i < 12; i++) g.fillRect(380 + i * 70, 280 + (i % 3) * 120, 50, 3); g.restore(); } },
    g11: { floor: 300, fn() { vine(100, 0, 115, false); vine(1480, 0, 120, true); [[150, 300], [600, 300], [1100, 300]].forEach(([x, y]) => tuft(x, y, 1.6)); bushCluster(340, 295, .95); bushCluster(1280, 295, .95, '#3b9647', '#ff9f43'); [[200, 820], [900, 820], [1300, 820]].forEach(([x, y]) => pebbles(x, y, 8)); flowerBed(60, 860, 320, ['#ff6fae', '#ffd34d']); sign(1520, 410, '#ff9f43', 'DELIVERY'); balloon(1560, 300, '#ff6f8f'); } },
    g12: { floor: 480, fn() { stringLights(0, 120, 1600, 120, 30, ['#ffd36b', '#ffffff']); bannerFlag(210, 40, 52, 100, '#a3162e', '#ffd84a'); bannerFlag(1390, 40, 52, 100, '#a3162e', '#ffd84a'); poster(60, 180, 100, 140, '#a3162e', '#ffd84a'); poster(1440, 180, 100, 140, '#3b6aa3', '#ffffff'); rug(800, 740, 280, 44, '#8c1d35', '#ffd84a'); floorGlow(800, 680, 240, 60, '#ffd84a'); [[180, 880], [1420, 880]].forEach(([x, y]) => { ell(x, y, 60, 20, '#00000033'); }); } },
  };

  return {
    paint(ctx2, id) {
      const d = GAME[id]; if (!d) return;
      g = ctx2; g.save();
      d.fn();
      lighting(d.floor);
      grain();
      g.restore(); g = null;
    }
  };
})();
