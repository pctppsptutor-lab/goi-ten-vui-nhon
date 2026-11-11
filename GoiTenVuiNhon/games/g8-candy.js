// Game 08 — Candy Storm (chain reaction)
// Candies drop into a sweet chain-reaction machine: peppermint chute, jelly springs and chocolate levers,
// then a switch sends each one to one of ten cups. The cup that catches the golden candy is picked.
// Twist: the golden candy triggers a fake lollipop and gets stuck; the candy cat pulls a spare lever,
// every rail swaps and the golden candy rolls into the real winning cup.
(() => {
  const CUPS = [...Array(10).keys()].map(i => [1388, 150 + i * 62]);
  const SWITCH = [950, 455];
  // main run from the funnel down to the switch (painted rails follow roughly the same line)
  const MAIN = [[92, 120], [118, 200], [240, 250], [420, 300], [560, 300], [600, 380], [470, 470], [430, 520], [560, 560], [760, 520], [880, 470], SWITCH];
  const JELLY = [[607, 300], [600, 410], [610, 520]], LEVERS = [[700, 320], [700, 470], [700, 640]];
  const KIDS = [...Array(10).keys()].map(i => [180 + i * 112, 850]);
  const CAT = [1180, 700];
  const BALLS = ['p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13', 'p15', 'p16', 'p17'];

  // point along a polyline, k in 0..1 by length
  function along(pts, k) {
    let L = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let d = clamp(k) * L;
    for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const u = d / seg[i]; return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]; } d -= seg[i]; }
    return pts[pts.length - 1];
  }
  const branch = c => [SWITCH, [1080, lerp(SWITCH[1], CUPS[c][1], .5)], [1300, CUPS[c][1] - 30], [CUPS[c][0], CUPS[c][1] - 18]];
  const route = c => [...MAIN, ...branch(c).slice(1)];

  function drawRails(t, swapped) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
    for (let c = 0; c < 10; c++) { path(branch(c)); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 12; ctx.stroke(); }
    ctx.restore();
    // the big switch dial
    ctx.save(); ctx.translate(...SWITCH); ctx.rotate(swapped ? Math.sin(t * 12) * .6 : Math.sin(t * 1.5) * .15);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e63946'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#e63946' : '#ffffff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 22, i * Math.PI / 3, (i + 1) * Math.PI / 3); ctx.fill(); }
    ctx.restore();
  }
  function cup(i, glow, t, wob = 0) {
    const [x, y] = CUPS[i];
    if (glow) FX.halo(x, y - 10, 60, '#ffd84a', .5 + .3 * Math.sin(t * 10));
    ctx.save(); ctx.translate(x, y); ctx.rotate(wob);
    ctx.fillStyle = '#fff6fb'; ctx.strokeStyle = '#e63e7c'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-30, -24); ctx.lineTo(30, -24); ctx.lineTo(22, 16); ctx.lineTo(-22, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e63e7c'; for (let k = -2; k <= 2; k++) ctx.fillRect(k * 10 - 3, -20, 6, 32);
    ctx.restore();
  }

  GAME_IMPL.g8 = {
    id: 'g8', title: 'Candy Storm', base: 'assets/g8/', titleY: 760,
    assets: gAssets(['waiting', 'drop', 'false', 'switch', 'win'], [...BALLS, 'p14', 'p18', 'p28', 'p29', 'p30', 'p0', 'p3', 'p5', 'p6', 'p23', 'p24', 'p25']),
    startBanner: '🍬 The candy machine whirs to life!', mote: '#ffd6ec', rayColor: '#ffe0f0',

    setup(r) {
      const cups = shuffle([...Array(10).keys()]);
      r.players.forEach((p, i) => { p.cup = cups[i]; [p.kx, p.ky] = KIDS[i]; p.x = p.kx; p.y = p.ky - 80; });
      r.fakes = makeFakes(r, 1.4);
      // practice candies: each fake gets one candy that rolls into that student's cup and bounces out
      r.runs = r.fakes.map((f, j) => ({ ball: BALLS[j % 10], to: f.p.cup, p: f.p, at: f.at - 1.6, dur: 1.9 }));
      r.goldAt = r.TW - 2.2;
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      for (const run of r.runs) {
        if (t > run.at) cue('drop' + run.at, () => SFX.pop());
        if (t > run.at + run.dur) cue('in' + run.at, () => { SFX.ding(); FX.sparkle(CUPS[run.to][0], CUPS[run.to][1] - 20, 10); r.banner = '🍬 A candy lands in ' + run.p.name + "'s cup… and pops back out!"; });
      }
      if (t > r.goldAt) cue('gold', () => { SFX.pop(); SFX.sparkle(); r.banner = '✨ Here comes the golden candy!'; });

      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🍭 It heads for ' + D.name + "'s cup…"; });
        if (te > .5) cue('b', () => { outcome('wrong_turn', D); SFX.boing(); SFX.sadTrombone(); r.banner = '🍭 Oops! A fake lollipop — the candy is stuck!'; });
        if (te > 1.1) cue('c', () => { CAM.shake(r, 9); SFX.swoosh(); r.banner = '🐱 The candy cat pulls the spare lever!'; });
        if (te > 1.5) cue('d', () => { outcome('selected', Wn); FX.sparkle(...SWITCH, 30); r.banner = '🔀 Every rail swaps!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🍬 It bounces towards ' + (D || Wn).name + "'s cup…"; });
        if (te > 1) cue('b', () => { outcome('selected', Wn); SFX.boing(); r.banner = '🍬 …bounces off the jelly and changes course!'; });
      }
      if (te > 3) cue('cupin', () => { SFX.ding(); FX.sparkle(CUPS[Wn.cup][0], CUPS[Wn.cup][1] - 20, 30); });
    },

    // the golden candy's position
    gold(r, t) {
      const te = t - r.TW, D = r.decoy || r.winner, Wn = r.winner;
      if (t < r.goldAt) return null;
      if (te < 0) return along(MAIN, (t - r.goldAt) / (r.TW - r.goldAt));
      if (!r.plain) {
        const stuck = [1180, lerp(SWITCH[1], CUPS[D.cup][1], .7)];
        if (te < .5) return along([SWITCH, [1080, lerp(SWITCH[1], CUPS[D.cup][1], .5)], stuck], te / .5);
        if (te < 1.5) return [stuck[0] + Math.sin(te * 40) * 3, stuck[1]];
        return along([stuck, [1080, lerp(SWITCH[1], CUPS[Wn.cup][1], .5)], [1300, CUPS[Wn.cup][1] - 30], [CUPS[Wn.cup][0], CUPS[Wn.cup][1] - 18]], ease(clamp((te - 1.5) / 1.5)));
      }
      const mid = [1180, lerp(SWITCH[1], CUPS[D.cup][1], .7)];
      if (te < 1) return along([SWITCH, mid], te);
      return along([mid, [1300, CUPS[Wn.cup][1] - 30], [CUPS[Wn.cup][0], CUPS[Wn.cup][1] - 18]], ease(clamp((te - 1) / 2)));
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      drawRails(rt, !r.plain && te > 1.1 && te < 2);
      JELLY.forEach(([x, y], i) => drawImg(['p25', 'p23', 'p24'][i], x, y + 8, 46 * (1 + .08 * Math.sin(rt * 6 + i)), { anchor: 'bottom' }));
      LEVERS.forEach(([x, y], i) => drawImg(i === 2 && !r.plain && te > 1.1 ? 'p29' : 'p28', x, y, 64, { anchor: 'bottom' }));
      drawImg('p18', 92, 140, 90);
      // cups with name tags
      const camera = ctx.getTransform();
      const right = (ctx.canvas.width - camera.e) / camera.a - 14;
      for (const p of r.players) {
        const lit = (te > 3 || done) && p === Wn, near = (f && f.p === p && te < 0) || (te > 0 && te < (r.plain ? 1 : 1.5) && p === (D || Wn));
        cup(p.cup, lit || near, rt, near ? Math.sin(rt * 30) * .08 : 0);
        drawTag(p.name, Math.min(CUPS[p.cup][0] + 184, right), CUPS[p.cup][1] - 4, lit || near);
      }
      // practice candies
      for (const run of r.runs) {
        const k = (rt - run.at) / run.dur;
        if (k < 0 || k > 1.25) continue;
        let pos = k <= 1 ? along(route(run.to), k) : [CUPS[run.to][0] + (k - 1) * 200, CUPS[run.to][1] - 18 - Math.sin((k - 1) / .25 * Math.PI) * 80];
        drawImg(run.ball, pos[0], pos[1], 26);
      }
      // fake lollipop
      if (!r.plain && D && te > .3 && !done) drawImg('p30', 1180, lerp(SWITCH[1], CUPS[D.cup][1], .7) + 10, 70 * clamp((te - .3) / .25), { anchor: 'bottom' });
      // the golden candy with a sparkle trail
      const g = !done && this.gold(r, rt);
      if (g) { FX.halo(g[0], g[1], 30, '#ffd84a', .7); drawImg('p14', g[0], g[1], 34); FX.every(r, 'gtrail', .05, () => FX.glitter(g[0], g[1], 1)); }
      // candy cat patrols between the levers and switch
      let cp = Math.floor(rt * 2.5) % 2 ? 'p0' : 'p3', cx = CAT[0] - 100 + Math.sin(rt * 1.6) * 150, cy = CAT[1] - Math.abs(Math.sin(rt * 6.4)) * 16, cFlip = Math.cos(rt * 1.6) < 0;
      if (!r.plain && te > .5) cp = 'p3';
      if (!r.plain && te > 1.1) { cp = 'p5'; cx = lerp(CAT[0], 760, ease(clamp((te - 1.1) / .3))); cFlip = false; }
      if (done) { cp = 'p6'; cx = CAT[0] - 160; cFlip = false; }
      drawImg(cp, cx, cy, 120, { anchor: 'bottom', flip: cFlip });
      // the students at the bottom drop their candies
      for (const p of r.players) {
        if (done && p === Wn) continue;
        const near = (f && f.p === p && te < 0) || (te > 0 && p === (D || Wn) && te < (r.plain ? 1 : 1.5));
        let pose = near ? 'drop' : 'waiting';
        if (p === D && !r.plain && te > .5) pose = 'false';
        if (p === Wn && te > (r.plain ? 1 : 1.5)) pose = 'switch';
        charImg(p.av, pose, p.kx, p.ky, 110);
        tagC(p.name, p.kx, p.ky + 18, near);
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', 1180, 660, 230 * (.6 + .4 * ease(k)));
        tagC(Wn.name, 1180, 684, true);
      }
      Wn.x = g ? g[0] : CUPS[Wn.cup][0]; Wn.y = g ? g[1] : CUPS[Wn.cup][1];
    },

    idle(t) {
      drawRails(t, false);
      JELLY.forEach(([x, y], i) => drawImg(['p25', 'p23', 'p24'][i], x, y + 8, 46 * (1 + .08 * Math.sin(t * 6 + i)), { anchor: 'bottom' }));
      LEVERS.forEach(([x, y]) => drawImg('p28', x, y, 64, { anchor: 'bottom' }));
      drawImg('p18', 92, 140, 90);
      for (let i = 0; i < 10; i++) cup(i, false, t);
      const k = (t * .35) % 1; drawImg(BALLS[Math.floor(t * .35) % 10], ...along(route(Math.floor(t * .35) % 10), k), 26);
      drawImg(Math.floor(t * 2) % 2 ? 'p0' : 'p3', CAT[0] - 100 + Math.sin(t * 1.5) * 140, CAT[1] - Math.abs(Math.sin(t * 6)) * 14, 120, { anchor: 'bottom', flip: Math.cos(t * 1.5) < 0 });
      KIDS.forEach(([x, y], i) => charImg(i, 'waiting', x, y, 110));
    },
    onFinish(r) { const [x, y] = CUPS[r.winner.cup]; FX.sparkle(x, y - 20, 40, ['#ff6fae', '#ffd84a', '#7cf7ff']); },
    winBanner: r => '🏆 The golden candy lands in ' + r.winner.name + "'s cup!",
    winPos: r => ({ x: 1180, y: 560 })
  };
})();
