// Moving scene layers for games 13-18 (back layer behind the players, front layer over them), drawn in code.
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
    // ===== 13 ice rink =====
    g13: {
      back(t) {
        layer(.85, () => {
          for (let i = 0; i < 3; i++) cloud(loop(t, .008, i * .33) * 1900 - 200, 50 + i * 30, .8, .7);
          shaft(1550, 0, 2.3, 700, 120, '#ffffff', .12 + .04 * wave(t, .5));
          ctx.save(); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = .8;                  // smoke curl from the igloo
          for (let i = 0; i < 3; i++) { const k = loop(t, .2, i / 3); FX.halo(1430 + k * 20, 230 - k * 90, 12 + k * 20, '#ffffff', .5 * (1 - k)); }
          ctx.restore();
        });
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 26; i++) {                                     // falling snow
            const k = loop(t, .05 + (i % 4) * .01, i / 26), x = (i * 137) % 1600 + wave(t, .8, i) * 30, y = -20 + k * 940;
            FX.halo(x, y, 4 + (i % 3) * 2, '#ffffff', .8);
          }
        });
      }
    },
    // ===== 14 beach =====
    g14: {
      back(t) {
        layer(.85, () => {
          for (let i = 0; i < 3; i++) cloud(loop(t, .008, i * .33) * 1900 - 200, 50 + i * 30, .8, .8);
          ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4;   // waves rolling onto the sand
          for (let i = 0; i < 3; i++) { const k = loop(t, .25, i / 3), y = 282 + k * 20; ctx.globalAlpha = 1 - k; ctx.beginPath(); for (let x = -40; x < 1640; x += 80) ctx.quadraticCurveTo(x + 40, y - 14, x + 80, y); ctx.stroke(); }
          ctx.restore();
          for (let i = 0; i < 2; i++) { const k = loop(t, .03, i * .5); flyer(-80 + k * 1800, 110 + i * 40 + wave(t, 1, i) * 10, t + i, .7, '#ffffff'); }
        });
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 5; i++) { const k = loop(t, .04, i / 5); FX.halo(200 + i * 300, 860 - k * 40, 6, '#fff3c0', .6 * Math.sin(k * Math.PI)); }
        });
      }
    },
    // ===== 15 disco =====
    g15: {
      back(t) {
        layer(.85, () => {
          for (let i = 0; i < 6; i++) {                                      // coloured beams sweeping from the ceiling
            const a = Math.PI / 2 + Math.sin(t * .8 + i) * .6;
            shaft(200 + i * 240, -10, a, 760, 60, ['#ff6fae', '#7cf7ff', '#b48cff', '#ffd84a', '#7cff9b', '#ff9f43'][i], .14);
          }
        });
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 20; i++) {                                     // light dots from the disco ball
            const a = t * .6 + i * .9, x = 800 + Math.cos(a) * (300 + (i % 5) * 120), y = 450 + Math.sin(a * 1.3) * 300;
            FX.halo(x, y, 6, ['#ff6fae', '#7cf7ff', '#ffffff'][i % 3], .6);
          }
          vignette('#05020f', .3);
        });
      }
    },
    // ===== 16 bedroom =====
    g16: {
      back(t) {
        layer(.85, () => {
          FX.halo(880, 110, 70 + 6 * wave(t, .6), '#fff6c8', .45);
          for (let i = 0; i < 8; i++) FX.halo(660 + (i * 41) % 280, 60 + (i * 29) % 160, 4, '#ffffff', .3 + .6 * Math.abs(wave(t, 1 + i * .4, i)));
        });
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 6; i++) {                                      // drifting dream bubbles
            const k = loop(t, .06, i / 6), x = 120 + i * 280 + wave(t, .9, i) * 30, y = 880 - k * 700;
            ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI) * .5; ctx.strokeStyle = '#d6d0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10 + (i % 3) * 5, 0, TAU); ctx.stroke(); ctx.restore();
          }
          vignette('#0a0818', .35);
        });
      }
    },
    // ===== 17 cat cafe =====
    g17: {
      back(t) {
        layer(.85, () => {
          for (let i = 0; i < 3; i++) { const k = loop(t, .3, i / 3); FX.halo(1490 + wave(t, 2, i) * 6, 560 - k * 70, 8 + k * 10, '#ffffff', .5 * (1 - k)); }   // steam from the table
          for (let i = 0; i < 2; i++) cloud(loop(t, .01, i * .5) * 260 + 110 + (i ? 1140 : 0), 90 + i * 20, .4, .7);
        });
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 6; i++) {                                      // paw-print hearts floating up
            const k = loop(t, .05, i / 6), x = 100 + i * 280 + wave(t, .7, i) * 30, y = 900 - k * 500;
            FX.halo(x, y, 7, '#ff9fc4', .6 * Math.sin(k * Math.PI));
          }
        });
      }
    },
    // ===== 18 recycling yard =====
    g18: {
      back(t) {
        layer(.85, () => {
          for (let i = 0; i < 3; i++) cloud(loop(t, .01, i * .33) * 1900 - 200, 50 + i * 30, .8, .75);
          for (let i = 0; i < 4; i++) { const k = loop(t, .5, i / 4); FX.halo(-40 + k * 1700, 345, 3, '#ffffff', .4); }
        });
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 7; i++) {                                      // leaves blowing across
            const k = loop(t, .06, i / 7), x = -40 + k * 1700, y = 640 + (i * 53) % 220 + wave(t, 2, i) * 20;
            leaf(x, y, 22, t * 2 + i, i % 2 ? '#5fae4a' : '#8fd660');
          }
        });
      }
    }
  };
})();
