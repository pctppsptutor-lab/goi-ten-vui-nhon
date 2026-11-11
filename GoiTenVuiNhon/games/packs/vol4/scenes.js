// Moving scene layers for games 19-24 (back layer behind the players, front layer over them), drawn in code.
// Layers shift against the camera at different rates for a sense of depth. Pure functions of time: no state, no downloads.
const SCENES = (() => {
  const TAU = Math.PI * 2;
  const wave = (t, f, ph = 0) => Math.sin(t * f + ph);
  const loop = (t, speed, ph = 0) => ((t * speed + ph) % 1 + 1) % 1;
  function layer(depth, fn) {
    const c = race && race.cam; ctx.save();
    if (c) ctx.translate(-(c.x - 800) * (depth - 1) * .6, -(c.y - 450) * (depth - 1) * .6);
    fn(); ctx.restore();
  }
  function cloud(x, y, s, a = .85) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
    [[0, 0, 34], [36, -14, 40], [76, 0, 32], [38, 12, 34]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function leaf(x, y, len, ang, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .5, -len * .28, len, 0); ctx.quadraticCurveTo(len * .5, len * .28, 0, 0); ctx.fill(); ctx.restore();
  }
  function fern(x, y, t, dir, n, len, cols, ph = 0) {
    for (let i = 0; i < n; i++) leaf(x, y, len * (.75 + (i % 3) * .15), (dir > 0 ? -Math.PI * .1 - i * .22 : -Math.PI * .9 + i * .22) + wave(t, 1.3, ph + i) * .06, cols[i % cols.length]);
  }
  function butterfly(x, y, t, col) {
    const f = Math.abs(Math.sin(t * 14)) * .8 + .2;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
    [-1, 1].forEach(d => { ctx.save(); ctx.scale(d * f, 1); ctx.beginPath(); ctx.ellipse(8, -4, 9, 6, -.4, 0, TAU); ctx.ellipse(7, 5, 6, 4, .4, 0, TAU); ctx.fill(); ctx.restore(); });
    ctx.fillStyle = '#3b2a1a'; ctx.fillRect(-1.5, -7, 3, 14); ctx.restore();
  }
  function shaft(x, y, ang, len, w, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, color); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w * .3); ctx.lineTo(len, -w); ctx.lineTo(len, w); ctx.lineTo(0, w * .3); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const flicker = (t, i) => 1 + .08 * Math.sin(t * 11 + i * 3) + .05 * Math.sin(t * 23 + i * 7);
  function lamps(list, t, color, r = 46, a = .55) { list.forEach(([x, y], i) => FX.halo(x, y, r * flicker(t, i), color, a * flicker(t, i))); }
  function vignette(color, a) {
    const g = ctx.createRadialGradient(800, 450, 380, 800, 450, 980); g.addColorStop(0, color + '00'); g.addColorStop(1, color);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(-200, -200, 2000, 1300); ctx.restore();
  }

  function flyer(x, y, t, sc, col) {
    const f = Math.sin(t * 9) * .6;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-22, -8 * f); ctx.quadraticCurveTo(-10, -12 - 8 * f, 0, 0); ctx.quadraticCurveTo(10, -12 - 8 * f, 22, -8 * f); ctx.stroke(); ctx.restore();
  }

  return {
    g19: {
      back(t) { layer(.85, () => { for (let i = 0; i < 8; i++) { const k = loop(t, .08, i / 8); ctx.save(); ctx.globalAlpha = .5 * Math.sin(k * Math.PI); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(200 + (i * 173) % 1200, 420 - k * 360, 8 + (i % 3) * 4, 0, TAU); ctx.stroke(); ctx.restore(); } }); },
      front(t) { layer(1.2, () => { for (let i = 0; i < 5; i++) { const k = loop(t, .05, i / 5); FX.halo(100 + i * 340, 880 - k * 60, 18, '#ffffff', .5 * Math.sin(k * Math.PI)); } }); }
    },
    g20: {
      back(t) { layer(.85, () => { shaft(800, 40, Math.PI / 2 + .3, 700, 140, '#fff3c0', .14 + .04 * wave(t, .5)); for (let i = 0; i < 6; i++) FX.halo(640 + (i * 61) % 320, 100 + (i * 37) % 140, 4, '#ffffff', .4 * Math.abs(wave(t, 1 + i * .3, i))); }); },
      front(t) { layer(1.2, () => { for (let i = 0; i < 6; i++) { const k = loop(t, .05, i / 6); FX.halo(120 + i * 270 + wave(t, .7, i) * 30, 900 - k * 400, 7, '#ff9fc4', .5 * Math.sin(k * Math.PI)); } }); }
    },
    g21: {
      back(t) { layer(.85, () => { for (let i = 0; i < 3; i++) shaft(400 + i * 400, -20, Math.PI / 2 + Math.sin(t * .6 + i) * .4, 700, 70, ['#ffd84a', '#ff9fc4', '#7cf7ff'][i], .12); }); },
      front(t) { layer(1.2, () => {
        for (let i = 0; i < 8; i++) { const k = loop(t, .07, i / 8), x = (i * 211 + t * 80) % 1700 - 50, y = 200 + (i * 97) % 600 + wave(t, 2, i) * 20;
          ctx.save(); ctx.globalAlpha = .6; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 14 * wave(t, 4, i), x + 40, y); ctx.stroke(); ctx.restore(); }
        vignette('#0a0614', .3); }); }
    },
    g22: {
      back(t) { layer(.85, () => { for (let i = 0; i < 6; i++) shaft(150 + i * 260, -10, Math.PI / 2 + Math.sin(t * .9 + i) * .6, 760, 60, ['#ff6fae', '#ffd84a', '#7cf7ff', '#7cff9b', '#b48cff', '#ff9f43'][i], .13); }); },
      front(t) { layer(1.2, () => { for (let i = 0; i < 8; i++) { const k = loop(t, .06, i / 8), x = 100 + i * 200 + wave(t, 1, i) * 30, y = -20 + k * 940;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.fillStyle = ['#ffffff', '#ffd84a'][i % 2]; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, TAU); ctx.fill(); ctx.restore(); }   // drifting feathers
        vignette('#0a0208', .3); }); }
    },
    g23: {
      back(t) { layer(.85, () => {
        for (let i = 0; i < 3; i++) cloud(loop(t, .008, i * .33) * 1900 - 200, 50 + i * 30, .8, .75);
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { const k = loop(t, .3, i / 10); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(150 + (i * 173) % 1300, 300 + (i * 97) % 560, 10 + k * 50, 3 + k * 12, 0, 0, TAU); ctx.stroke(); } ctx.restore(); }); },
      front(t) { layer(1.2, () => { for (let i = 0; i < 2; i++) { const x = 300 + i * 800 + wave(t, .4, i) * 200, y = 200 + wave(t, .9, i) * 60; ctx.save(); ctx.strokeStyle = '#7cd0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y); ctx.stroke(); ctx.globalAlpha = .5; ctx.fillStyle = '#ffffff'; const f = Math.abs(Math.sin(t * 30)); ctx.beginPath(); ctx.ellipse(x, y - 6 * f, 14, 5, 0, 0, TAU); ctx.fill(); ctx.restore(); } }); }
    },
    g24: {
      back(t) { layer(.85, () => { for (let i = 0; i < 2; i++) cloud(loop(t, .008, i * .5) * 1900 - 200, 60 + i * 40, .9, .8); for (let i = 0; i < 2; i++) { const k = loop(t, .03, i * .5); ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; const x = -80 + k * 1800, y = 120 + i * 40, f = Math.sin(t * 9 + i) * .6; ctx.beginPath(); ctx.moveTo(x - 22, y - 8 * f); ctx.quadraticCurveTo(x - 10, y - 12 - 8 * f, x, y); ctx.quadraticCurveTo(x + 10, y - 12 - 8 * f, x + 22, y - 8 * f); ctx.stroke(); ctx.restore(); } }); },
      front(t) { layer(1.2, () => { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { const y = 330 + (i * 37) % 400, x = ((i * 233 + t * 40) % 1800) - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 25, y - 6, x + 50, y); ctx.stroke(); } ctx.restore(); }); }
    }
  };
})();
