// Moving scene layers for games 7-12 (back layer behind the players, front layer over them), drawn in code.
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

  return {
    // ===== 07 flower garden =====
    g7: {
      back(t) {
        layer(.85, () => {
          shaft(30, -20, .95, 760, 120, '#fff3b0', .18 + .05 * wave(t, .5));
          for (let i = 0; i < 4; i++) cloud(loop(t, .008, i * .27) * 2000 - 250, 50 + (i % 2) * 40, .7 + (i % 3) * .2, .7);
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 8; i++) { const y = 160 + loop(t, 1.2, i / 8) * 160; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(94 + (i * 9) % 30, y, 4, 20); }
          ctx.restore();
        });
      },
      front(t) {
        layer(1.25, () => {
          fern(-30, 900, t, 1, 6, 230, ['#2e8b3e', '#3fa34d', '#27773a']);
          fern(1630, 900, t, -1, 6, 230, ['#2e8b3e', '#3fa34d', '#27773a'], 2);
          butterfly(260 + wave(t, .3) * 200, 520 + wave(t, .7) * 60, t, '#ff8fb1');
          butterfly(1150 + wave(t, .25, 2) * 200, 600 + wave(t, .6, 1) * 60, t + .4, '#b48cff');
        });
      }
    },
    // ===== 08 candy machine =====
    g8: {
      back(t) {
        layer(.85, () => {
          [[120, 180], [1500, 200]].forEach(([x, y], i) => { ctx.save(); ctx.translate(x, y); ctx.rotate(t * (i ? -.8 : .6)); ctx.fillStyle = '#ffffffaa';
            for (let k = 0; k < 8; k++) { ctx.rotate(TAU / 8); ctx.fillStyle = k % 2 ? '#ff5d8f88' : '#ffffffaa'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 40, 0, TAU / 8); ctx.fill(); } ctx.restore(); });
          for (let i = 0; i < 12; i++) { const k = loop(t, .06, i / 12); FX.halo(300 + (i * 97) % 1000, 440 - k * 400, 8 + (i % 3) * 3, ['#ff9fc4', '#fff3a0', '#b4f0ff'][i % 3], .5 * Math.sin(k * Math.PI)); }
        });
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 7; i++) { const k = loop(t, .05, i / 7), x = 100 + i * 230 + wave(t, .7, i) * 30, y = -40 + k * 980;    // falling sprinkles
            ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.fillStyle = ['#ff5d8f', '#ffd34d', '#7cf7ff', '#7cff9b'][i % 4]; ctx.globalAlpha = .7; ctx.fillRect(-9, -3, 18, 6); ctx.restore(); }
          vignette('#7a2a52', .2);
        });
      }
    },
    // ===== 09 hamster lab =====
    g9: {
      back(t) {
        layer(.85, () => {
          for (let i = 0; i < 3; i++) cloud(loop(t, .01, i * .33) * 1900 - 200, 160 + i * 50, .7, .65);
          shaft(300, 0, 1.1, 700, 110, '#ffffff', .12 + .04 * wave(t, .5));
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const y = 300 + loop(t, 1.3, i / 6) * 170; ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(1058 + (i * 7) % 24, y, 4, 18); } ctx.restore();
          lamps([[620, 85], [800, 85], [980, 85]], t, '#7cf7ff', 30, .4);
        });
      },
      front(t) {
        layer(1.2, () => {
          fern(-20, 900, t, 1, 5, 200, ['#2e8b3e', '#3fa34d']);
          fern(1620, 900, t, -1, 5, 200, ['#2e8b3e', '#3fa34d'], 1);
          for (let i = 0; i < 4; i++) { const k = loop(t, .4, i / 4); if (k < .3) FX.halo(200 + i * 360, 300, 10, '#fff3a0', .9 * (1 - k / .3)); }
        });
      }
    },
    // ===== 10 magic library =====
    g10: {
      back(t) {
        layer(.85, () => {
          for (let i = 0; i < 10; i++) FX.halo(540 + (i * 53) % 460, 70 + (i * 37) % 160, 5, '#ffffff', .3 + .6 * Math.abs(wave(t, 1 + i * .3, i)));
          lamps([[300, 730], [1300, 730]], t, '#ffb347', 60, .6);
          // a golden ribbon of magic looping round the book
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 4; ctx.globalAlpha = .45;
          ctx.beginPath(); for (let a = 0; a <= TAU + .01; a += .05) { const x = 800 + Math.cos(a) * 560, y = 470 + Math.sin(a) * 120 + Math.sin(a * 3 + t * 2) * 18; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
          for (let i = 0; i < 6; i++) { const a = t * .6 + i * TAU / 6; FX.halo(800 + Math.cos(a) * 560, 470 + Math.sin(a) * 120, 10, '#fff3a0', .7); }
        });
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 6; i++) {                                     // pages drifting by
            const k = loop(t, .05, i / 6), x = 80 + i * 280 + wave(t, .8, i) * 40, y = 880 - k * 820;
            ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI) * .6; ctx.translate(x, y); ctx.rotate(wave(t, 1.2, i) * .5);
            ctx.fillStyle = '#fff7e0'; ctx.fillRect(-14, -10, 28, 20); ctx.restore();
          }
          vignette('#0c0716', .4);
        });
      }
    },
    // ===== 11 canal =====
    g11: {
      back(t) {
        layer(.9, () => {
          for (let i = 0; i < 3; i++) cloud(loop(t, .008, i * .33) * 1900 - 200, 60 + i * 30, .8, .75);
          ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (let i = 0; i < 22; i++) { const y = 330 + (i * 97) % 450, x = ((i * 233 + t * 50) % 1800) - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 25, y - 6, x + 50, y); ctx.quadraticCurveTo(x + 75, y + 6, x + 100, y); ctx.stroke(); }
          ctx.restore();
        });
      },
      front(t) {
        layer(1.2, () => {
          butterfly(400 + wave(t, .3) * 260, 250 + wave(t, .7) * 40, t, '#ffd34d');
          ctx.save(); ctx.strokeStyle = '#3f8f3f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
          for (let i = 0; i < 10; i++) { const x = (i * 173) % 1600, sw = wave(t, 1.4, i) * 8; ctx.beginPath(); ctx.moveTo(x, 910); ctx.quadraticCurveTo(x - 6 + sw, 860, x + 10 + sw * 1.5, 812 - (i % 3) * 14); ctx.stroke(); }
          ctx.restore();
        });
      }
    },
    // ===== 12 cinema =====
    g12: {
      back(t) {
        layer(.9, () => {
          lamps([[180, 380], [1420, 380]], t, '#ffcf6b', 70, .55);
          // the projector beam flickering onto the screen
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .1 + .04 * Math.sin(t * 23);
          const g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffffff00');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(780, 0); ctx.lineTo(820, 0); ctx.lineTo(1100, 460); ctx.lineTo(500, 460); ctx.closePath(); ctx.fill(); ctx.restore();
          for (let i = 0; i < 14; i++) FX.halo(50 + i * 115, 100, 7, i % 2 ? '#fff3a0' : '#ffd36b', .4 + .5 * Math.abs(wave(t, 3, i)));   // marquee bulbs
        });
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 9; i++) {                                     // popcorn drifting up
            const k = loop(t, .08, i / 9), x = 120 + i * 170 + wave(t, 1, i) * 20, y = 900 - k * 300;
            ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI) * .8; ctx.fillStyle = '#fff3d0';
            [[0, 0, 7], [6, -4, 6], [-5, -4, 5]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill(); }); ctx.restore();
          }
          vignette('#0a0306', .35);
        });
      }
    }
  };
})();
