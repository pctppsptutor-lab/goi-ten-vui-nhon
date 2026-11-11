// Code-drawn scene layers for games 2-6, like the duck race: the painted background stays as the base plate,
// a BACK layer adds moving scenery behind the players, and a FRONT layer is drawn over them.
// Each layer has a depth: when the camera moves, the front layer slides further than the base, which reads as depth.
// Everything is a pure function of time, so there is no state and nothing to download.
const SCENES = (() => {
  const TAU = Math.PI * 2;
  const wave = (t, f, ph = 0) => Math.sin(t * f + ph);
  const loop = (t, speed, ph = 0) => ((t * speed + ph) % 1 + 1) % 1;      // 0..1 repeating

  // ---------- primitives ----------
  function layer(depth, fn) {           // parallax against the camera
    const c = race && race.cam; ctx.save();
    if (c) ctx.translate(-(c.x - 800) * (depth - 1) * .6, -(c.y - 450) * (depth - 1) * .6);
    fn(); ctx.restore();
  }
  function cloud(x, y, s, a = .85) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
    [[0, 0, 34], [36, -14, 40], [76, 0, 32], [38, 12, 34]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function leaf(x, y, len, ang, col, vein = '#00000022') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * .5, -len * .28, len, 0); ctx.quadraticCurveTo(len * .5, len * .28, 0, 0); ctx.fill();
    ctx.strokeStyle = vein; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * .9, 0); ctx.stroke(); ctx.restore();
  }
  // a fan of leaves rooted at (x, y), swaying with the breeze
  function fern(x, y, t, dir, n, len, cols, ph = 0) {
    for (let i = 0; i < n; i++) {
      const base = dir > 0 ? -Math.PI * .1 - i * .22 : -Math.PI * .9 + i * .22;
      leaf(x, y, len * (.75 + (i % 3) * .15), base + wave(t, 1.3, ph + i) * .06, cols[i % cols.length]);
    }
  }
  function butterfly(x, y, t, col) {
    const f = Math.abs(Math.sin(t * 14)) * .8 + .2;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
    [-1, 1].forEach(d => { ctx.save(); ctx.scale(d * f, 1); ctx.beginPath(); ctx.ellipse(8, -4, 9, 6, -.4, 0, TAU); ctx.ellipse(7, 5, 6, 4, .4, 0, TAU); ctx.fill(); ctx.restore(); });
    ctx.fillStyle = '#3b2a1a'; ctx.fillRect(-1.5, -7, 3, 14); ctx.restore();
  }
  function flyer(x, y, t, s, col) {        // bird / bat / pterosaur silhouette
    const f = Math.sin(t * 9) * .6;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-22, -8 * f); ctx.quadraticCurveTo(-10, -12 - 8 * f, 0, 0); ctx.quadraticCurveTo(10, -12 - 8 * f, 22, -8 * f); ctx.stroke(); ctx.restore();
  }
  function gear(x, y, R, teeth, rot, fill, alpha = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha; ctx.fillStyle = fill; ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) { const a = i * Math.PI / teeth, r = i % 2 ? R : R * 1.18; ctx.lineTo(Math.cos(a - .12) * r, Math.sin(a - .12) * r); ctx.lineTo(Math.cos(a + .12) * r, Math.sin(a + .12) * r); }
    ctx.closePath(); ctx.fill(); ctx.fillStyle = '#00000055'; ctx.beginPath(); ctx.arc(0, 0, R * .35, 0, TAU); ctx.fill(); ctx.restore();
  }
  function shaft(x, y, ang, len, w, color, alpha) {      // a soft beam of light
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, color); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w * .3); ctx.lineTo(len, -w); ctx.lineTo(len, w); ctx.lineTo(0, w * .3); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const flicker = (t, i) => 1 + .08 * Math.sin(t * 11 + i * 3) + .05 * Math.sin(t * 23 + i * 7);
  function lamps(list, t, color, r = 46, a = .55) { list.forEach(([x, y], i) => FX.halo(x, y, r * flicker(t, i), color, a * flicker(t, i))); }
  function fog(t, y, h, color, a, speed = 18, n = 7) {
    for (let i = 0; i < n; i++) {
      const x = loop(t, speed / 2400, i / n) * 2400 - 400;
      FX.halo(x, y + wave(t, .4, i * 2) * h * .3, h * (1.4 + (i % 3) * .3), color, a * (.7 + .3 * wave(t, .7, i)));
    }
  }
  function drip(x, top, bottom, t, ph, col = '#bfeaff') {
    const k = loop(t, .45, ph); if (k < .55) { ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(x, top + 6 * (k / .55), 3, 4 + 3 * (k / .55), 0, 0, TAU); ctx.fill(); ctx.restore(); return; }
    const f = (k - .55) / .45, y = top + (bottom - top) * f * f;
    ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = .85; ctx.beginPath(); ctx.ellipse(x, y, 3, 6, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  function vignette(color, a) {
    const g = ctx.createRadialGradient(800, 450, 380, 800, 450, 980); g.addColorStop(0, color + '00'); g.addColorStop(1, color);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(-200, -200, 2000, 1300); ctx.restore();
  }

  return {
    // ===== 02 dinosaur valley =====
    g2: {
      back(t) {
        layer(.85, () => {
          shaft(40, -20, .9, 760, 130, '#fff3b0', .18 + .05 * wave(t, .5));
          shaft(140, -20, 1.05, 700, 90, '#fff3b0', .12 + .05 * wave(t, .6, 1));
          for (let i = 0; i < 4; i++) cloud(loop(t, .008, i * .27) * 2000 - 250, 40 + (i % 2) * 40, .7 + (i % 3) * .2, .75);
          for (let i = 0; i < 3; i++) { const k = loop(t, .25, i / 3); FX.halo(990 + k * 40 + wave(t, 2, i) * 6, 92 - k * 90, 14 + k * 26, '#9a8f8a', .5 * (1 - k)); }   // volcano smoke
          const k = loop(t, .03); flyer(-80 + k * 1800, 150 + wave(t, .8) * 20, t, .9, '#3b4a5a');
          flyer(-160 + loop(t, .03, .08) * 1800, 175 + wave(t, .9, 1) * 16, t + .3, .7, '#3b4a5a');
        });
        // waterfall shimmer
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 9; i++) { const y = 120 + loop(t, 1.2, i / 9) * 170; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(176 + (i * 13) % 64, y, 4, 22); }
        ctx.restore();
        FX.halo(215, 300, 60, '#e6fbff', .35 + .1 * wave(t, 3));
      },
      front(t) {
        layer(1.25, () => {
          fern(-30, 900, t, 1, 6, 260, ['#2e8b3e', '#3fa34d', '#27773a']);
          fern(1630, 900, t, -1, 6, 260, ['#2e8b3e', '#3fa34d', '#27773a'], 2);
          butterfly(300 + wave(t, .3) * 220, 520 + wave(t, .7) * 60, t, '#ff8fb1');
          butterfly(1250 + wave(t, .25, 2) * 200, 460 + wave(t, .6, 1) * 70, t + .4, '#ffd34d');
        });
      }
    },

    // ===== 03 wizard's study =====
    g3: {
      back(t) {
        layer(.9, () => {
          shaft(150, 20, .75, 900, 120, '#cfe2ff', .16 + .05 * wave(t, .4));
          shaft(230, 30, .9, 800, 80, '#cfe2ff', .12 + .04 * wave(t, .5, 2));
          FX.halo(800, 190, 120 + 12 * wave(t, 1.6), '#b48cff', .5);          // crystal ball
          lamps([[680, 255], [924, 255]], t, '#ffb347', 34, .6);              // candles
          lamps([[1540, 650]], t, '#ffb347', 70, .5);                          // lantern
        });
        // the floor magic circle slowly turning (under the orbs)
        ctx.save(); ctx.translate(800, 545); ctx.scale(1, .34); ctx.rotate(t * .25); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = '#d9b8ff'; ctx.globalAlpha = .35 + .15 * wave(t, 2); ctx.lineWidth = 6; ctx.setLineDash([26, 18]);
        ctx.beginPath(); ctx.arc(0, 0, 330, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 330, Math.sin(a) * 330); ctx.lineTo(Math.cos(a + 2.09) * 330, Math.sin(a + 2.09) * 330); ctx.stroke(); }
        ctx.restore();
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 6; i++) {                                      // floating pages / sparkles
            const k = loop(t, .05, i / 6), x = 120 + i * 260 + wave(t, .8, i) * 40, y = 860 - k * 760;
            ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI) * .7; ctx.translate(x, y); ctx.rotate(wave(t, 1.2, i) * .5);
            ctx.fillStyle = '#fff7e0'; ctx.fillRect(-12, -9, 24, 18); ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1.5;
            for (let l = -4; l <= 4; l += 4) { ctx.beginPath(); ctx.moveTo(-8, l); ctx.lineTo(8, l); ctx.stroke(); }
            ctx.restore();
          }
          vignette('#1a0b2e', .45);
        });
      }
    },

    // ===== 04 dragon cave =====
    g4: {
      back(t) {
        layer(.9, () => {
          lamps([[180, 230], [1180, 140], [950, 190]], t, '#ffb347', 60, .6);
          [[320, 80, '#5df2ff'], [410, 80, '#c27cff'], [920, 40, '#ff7ad9'], [1320, 50, '#7cffb0'], [480, 250, '#5df2ff']].forEach(([x, y, c], i) => FX.halo(x, y, 50 + 10 * wave(t, 1.4, i), c, .45 + .2 * wave(t, 1.1, i * 2)));
          // something blinks in the dark tunnel
          const blink = loop(t, .18) < .93; if (blink) { [-14, 14].forEach(dx => FX.halo(800 + dx, 300, 9, '#ffe066', .9)); }
          drip(560, 110, 420, t, 0); drip(1060, 120, 430, t, .4); drip(1400, 90, 380, t, .7);
          for (let i = 0; i < 6; i++) { const k = loop(t, .4, i / 6); if (k < .2) { const [x, y] = [[150, 420], [210, 400], [1160, 340], [1440, 400], [1500, 430], [1090, 360]][i]; FX.halo(x, y, 18 * Math.sin(k / .2 * Math.PI), '#fff6c0', .9); } }   // gold glints
        });
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) { const y = 320 + loop(t, 1.3, i / 6) * 80; ctx.fillStyle = 'rgba(220,250,255,.4)'; ctx.fillRect(410 + (i * 7) % 24, y, 3, 16); }
        ctx.restore();
      },
      front(t) {
        layer(1.25, () => {
          ctx.save(); ctx.fillStyle = '#2a1d16';
          [[60, 70], [220, 110], [380, 60], [1250, 90], [1420, 120], [1560, 70]].forEach(([x, h], i) => {   // stalactites
            ctx.beginPath(); ctx.moveTo(x - 30, -10); ctx.lineTo(x + 30, -10); ctx.lineTo(x + 4, h + wave(t, .5, i) * 2); ctx.lineTo(x - 4, h); ctx.closePath(); ctx.fill();
          });
          ctx.restore();
          [[450, 724, '#5df2ff'], [1480, 660, '#7cffb0'], [1120, 724, '#c27cff'], [120, 700, '#ffd84a']].forEach(([x, y, c], i) => FX.halo(x, y, 60 + 10 * wave(t, 1.3, i), c, .4));
          vignette('#120a05', .5);
        });
      }
    },

    // ===== 05 robot factory =====
    g5: {
      back(t) {
        layer(.85, () => {
          gear(1460, 180, 46, 10, t * .8, '#c9a227', .55); gear(1560, 140, 32, 8, -t * 1.15, '#c9a227', .55);
          gear(60, 250, 40, 9, -t * .6, '#7f8c99', .35);
          for (let i = 0; i < 3; i++) cloud(loop(t, .01, i * .33) * 600 - 80, 60 + i * 50, .5, .6);          // sky through the windows
          lamps([[480, 80], [1280, 30]], t, '#fff2a8', 70, .35);
          // bubbles rising in the glass tank, and a light sweep across it
          for (let i = 0; i < 10; i++) { const k = loop(t, .35, i / 10), x = 600 + (i * 47) % 400 + wave(t, 2, i) * 6; ctx.save(); ctx.strokeStyle = '#e6fbff'; ctx.globalAlpha = .7 * (1 - k); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, 400 - k * 190, 4 + (i % 3) * 2, 0, TAU); ctx.stroke(); ctx.restore(); }
          shaft(580 + loop(t, .2) * 440, 190, Math.PI / 2, 210, 30, '#ffffff', .18);
        });
        // chevrons running along the belt and its curved ends
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#7cf7ff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        const dir = race && race.game && race.phase === 'run' && race.now - race.TW > 1.3 && !race.plain ? -1 : 1, off = loop(t, .8 * dir) * 130.6;
        for (let x = 200 + off; x < 1520; x += 130.6) { ctx.globalAlpha = .35; ctx.beginPath(); ctx.moveTo(x - 8 * dir, 684); ctx.lineTo(x + 6 * dir, 692); ctx.lineTo(x - 8 * dir, 700); ctx.stroke(); }
        ctx.restore();
      },
      front(t) {
        layer(1.2, () => {
          for (let i = 0; i < 3; i++) { const k = loop(t, .12, i / 3); FX.halo(1530 + i * 20, 840 - k * 260, 40 + k * 60, '#dfe6ee', .45 * (1 - k)); }   // steam from the pipe
          for (let i = 0; i < 5; i++) { const k = loop(t, .6, i / 5); if (k < .25) FX.halo(980 + i * 90, 250 + (i % 2) * 30, 10, '#ffd84a', .9 * (1 - k * 4)); }   // welding sparks on the arms
        });
      }
    },

    // ===== 06 haunted hotel =====
    g6: {
      back(t) {
        layer(.85, () => {
          FX.halo(190, 100, 90 + 8 * wave(t, .6), '#fff6c8', .45);                                           // moon
          for (let i = 0; i < 10; i++) { const a = .3 + .7 * Math.abs(wave(t, 1 + i * .3, i)); FX.halo([150, 210, 250, 120, 1400, 1460, 1500, 1430, 1380, 230][i], [60, 160, 90, 200, 70, 150, 100, 200, 120, 40][i], 6, '#ffffff', a); }
          const k = loop(t, .05); flyer(80 + k * 220, 180 + wave(t, 2) * 30, t * 1.4, .5, '#2a1840');            // bat across the window
          lamps([[113, 220], [349, 220], [540, 227], [717, 227], [893, 227], [1067, 227], [1253, 220], [1493, 213],
            [344, 420], [540, 427], [717, 427], [893, 427], [1067, 427], [1260, 420]], t, '#ffb347', 36, .55);
          for (let i = 0; i < 6; i++) { const kk = loop(t, .9, i / 6); FX.halo(1460 + i * 8, 560 - kk * 40, 6, '#bff6ff', .8 * (1 - kk)); }   // fountain sparkle
        });
      },
      front(t) {
        layer(1.25, () => {
          fog(t, 830, 120, '#b9a6ff', .32, 22);
          lamps([[93, 787], [1460, 773]], t, '#ffcf6b', 70, .55);
          const k = loop(t, .04), x = -150 + k * 1900;                                                         // a shy ghost drifts by
          ctx.save(); ctx.globalAlpha = .28 * Math.sin(k * Math.PI); ctx.fillStyle = '#e8f8ff'; ctx.translate(x, 600 + wave(t, 1.5) * 20);
          ctx.beginPath(); ctx.arc(0, 0, 40, Math.PI, 0); ctx.lineTo(40, 50); for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(30 - i * 20, 38 + (i % 2) * 18, 20 - i * 20, 50); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.arc(-12, -6, 6, 0, TAU); ctx.arc(12, -6, 6, 0, TAU); ctx.fill(); ctx.restore();
          vignette('#140a24', .45);
        });
      }
    }
  };
})();
