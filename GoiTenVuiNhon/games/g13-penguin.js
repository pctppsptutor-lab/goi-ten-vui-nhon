// Game 13 — Penguins on Ice
// Ten students in penguin suits belly-slide down ten ice lanes; whoever stops closest to the flag is picked.
// Twist: the first one slides right past the line into a snow pile; a seal pops out of an ice hole and nudges someone else onto the winning spot.
(() => {
  const X0 = 150, FLAG_X = 1240, PILE = [1470, 0];
  const laneY = (i, n) => 300 + (n > 1 ? i * 490 / (n - 1) : 245);

  // position along the lane before the reveal (0 = start, 1 = flag line)
  function dist(r, p, t) {
    const k = clamp((t - p.launch) / (r.TW - p.launch));
    let v = p.stop * (1 - Math.pow(1 - k, 2.4));                 // fast start, slow glide to a stop
    for (const f of r.fakes) if (f.p === p && t > f.at) v += .06 * Math.sin(clamp((t - f.at) / (f.dur * 1.6)) * Math.PI);
    return clamp(v, 0, .995);
  }
  // seal drawn in code: grey body poking out of a round ice hole
  function seal(x, y, k, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#1d4f7a'; ctx.beginPath(); ctx.ellipse(0, 6, 46, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(-60, -120, 120, 126); ctx.clip();
    const h = 70 * k;
    ctx.fillStyle = '#8a97a6'; ctx.beginPath(); ctx.ellipse(0, 10 - h + 30, 30, 44, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9d2dc'; ctx.beginPath(); ctx.ellipse(0, 26 - h + 30, 18, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1c2550'; [-10, 10].forEach(dx => { ctx.beginPath(); ctx.arc(dx, -h + 12, 4, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.ellipse(0, -h + 22, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6f7a86'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-26, -h + 44); ctx.lineTo(-44 - Math.sin(t * 12) * 6, -h + 30); ctx.stroke();
    ctx.restore(); ctx.restore();
  }

  GAME_IMPL.g13 = {
    id: 'g13', title: 'Penguins on Ice', base: 'assets/g13/', titleY: 200,
    assets: gAssets(['idle', 'slide', 'brake', 'win', 'tumble', 'spin', 'dash'], ['p1', 'p7', 'p9', 'p13', 'p10', 'p4', 'p23', 'p21']),
    startBanner: '🐧 Belly slide — GO!', mote: '#eaf8ff', rayColor: '#e6f6ff',

    setup(r) {
      const n = r.players.length, lanes = shuffle([...Array(n).keys()]);
      r.players.forEach((p, i) => { p.ly = laneY(lanes[i], n); p.launch = .3 + i * .12 + Math.random() * .3; p.stop = .62 + Math.random() * .26; });
      r.winner.stop = .86; if (r.decoy) r.decoy.stop = .93;
      r.fakes = makeFakes(r, 1.6);
    },
    pos(r, p, t) {
      const te = t - r.TW, D = r.decoy, Wn = r.winner, x0 = X0 + dist(r, p, Math.min(t, r.TW)) * (FLAG_X - X0);
      if (te <= 0) return [x0, p.ly];
      if (p === D && !r.plain) { const k = ease(clamp(te / .9)); return [lerp(x0, PILE[0], k), p.ly - Math.sin(k * Math.PI) * 20]; }
      if (p === D && r.plain) return [lerp(x0, FLAG_X - 26, ease(clamp(te / .9))), p.ly];
      if (p === Wn) { const from = r.plain ? 1.2 : 1.6, k = ease(clamp((te - from) / 1.1)); return [lerp(x0, FLAG_X, k), p.ly - Math.sin(k * Math.PI) * (r.plain ? 0 : 40)]; }
      return [x0, p.ly];
    },

    tick(r, t, te) {
      const D = r.decoy, Wn = r.winner;
      for (const p of r.players) if (t > p.launch) cue('go' + p.av + p.ly, () => SFX.noise(.5, { vol: .08, f: 3000, to: 900, q: .7 }));
      if (te < -.25 && t > 1.6) {
        const lead = r.players.reduce((a, b) => dist(r, b, t) > dist(r, a, t) ? b : a);
        if (lead !== r.leader && t - (r.leaderAt || 0) > .5) { r.leader = lead; r.leaderAt = t; r.banner = '🏁 Closest to the flag: ' + lead.name; SFX.leader(); }
      }
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); SFX.wheee(); r.banner = '🐧 ' + D.name + ' is still sliding…'; });
        if (te > .8) cue('b', () => { outcome('wrong_turn', D); CAM.shake(r, 12); SFX.noise(.5, { vol: .3, f: 700, to: 200 }); FX.smoke(PILE[0], D.ly - 20, 14, '#ffffff'); r.banner = '❄️ WHOOPS! Right over the line into the snow!'; });
        if (te > 1.2) cue('c', () => { SFX.splash(); SFX.boing(); r.banner = '🦭 A seal pops out of the ice…'; });
        if (te > 1.6) cue('d', () => { outcome('selected', Wn); SFX.wheee(); r.banner = '🦭 …and nudges ' + Wn.name + ' onto the flag!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🐧 ' + (D || Wn).name + ' brakes hard…'; });
        if (te > 1.2) cue('b', () => { outcome('selected', Wn); SFX.boing(); r.banner = '🐧 …but someone glides even closer!'; });
      }
      if (te > 2.7) cue('flag', () => { SFX.ding(); FX.glitter(FLAG_X, Wn.ly - 40, 18, ['#ffffff', '#bfefff']); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', D = r.decoy, Wn = r.winner;
      // finish flag line and snow pile
      ctx.save(); ctx.globalAlpha = .7;
      for (let y = 270; y < 830; y += 20) { ctx.fillStyle = ((y / 20) | 0) % 2 ? '#1c2550' : '#ffffff'; ctx.fillRect(FLAG_X - 5, y, 10, 20); }
      ctx.restore();
      drawImg('p10', FLAG_X, 250, 110, { anchor: 'bottom' });
      drawImg('p23', PILE[0], 560, 210, { alpha: .95 }); drawImg('p21', PILE[0] + 30, 760, 150, { alpha: .95 });
      const sealOn = !r.plain && te > 1.1 && te < 2.9 && !done;
      const order = [...r.players].sort((a, b) => a.ly - b.ly);
      for (const p of order) {
        if (done && p === Wn) continue;
        const [x, y] = this.pos(r, p, rt); p.x = x; p.y = y - 40;
        if (sealOn && p === Wn) seal(x - 70, y + 6, clamp((te - 1.1) / .3) * (1 - clamp((te - 2.5) / .4)), rt);
        const moving = rt > p.launch && dist(r, p, rt) < p.stop - .02;
        let pose = rt < p.launch ? 'idle' : moving ? (dist(r, p, rt) > p.stop * .8 ? 'brake' : 'slide') : 'idle';
        if (p === D && !r.plain && te > 0) pose = te < .8 ? 'dash' : 'tumble';
        if (p === D && r.plain && te > 0) pose = 'brake';
        if (p === Wn && te > (r.plain ? 1.2 : 1.6)) pose = te > 2.7 ? 'win' : 'spin';
        if (moving) FX.every(r, 'ice' + p.ly, .12, () => FX.glitter(x - 50, y - 6, 1, ['#ffffff', '#cfefff']));
        charImg(p.av, pose, x, y + 6, 92);
        tagC(p.name, x - 110, y - 18, r.leader === p && te < 0);
      }
      // referee penguin waddles along the finish line
      let mp = Math.floor(rt * 2.5) % 2 ? 'p7' : 'p1';
      if (rt < 1) mp = 'p1'; else if (!r.plain && te > .8 && te < 1.6) mp = 'p9'; else if (te > 1.6) mp = 'p13';
      drawImg(mp, 1460 + Math.sin(rt * 1.8) * 50, 260 + Math.cos(rt * 1.4) * 50 - Math.abs(Math.sin(rt * 6)) * 12, 110, { anchor: 'bottom', flip: Math.cos(rt * 1.8) > 0 });
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', FLAG_X, Wn.ly + 10, 190 * (.6 + .4 * ease(k)));
        tagC(Wn.name, FLAG_X, Wn.ly + 34, true);
      }
    },

    idle(t) {
      ctx.save(); ctx.globalAlpha = .7; for (let y = 270; y < 830; y += 20) { ctx.fillStyle = ((y / 20) | 0) % 2 ? '#1c2550' : '#ffffff'; ctx.fillRect(FLAG_X - 5, y, 10, 20); } ctx.restore();
      drawImg('p10', FLAG_X, 250, 110, { anchor: 'bottom' });
      drawImg('p23', PILE[0], 560, 210); drawImg('p21', PILE[0] + 30, 760, 150);
      for (let i = 0; i < 10; i++) charImg(i, 'slide', X0 + ((t * 60 + i * 113) % (FLAG_X - X0 - 80)), laneY(i, 10) + 6, 92);
      drawImg(Math.floor(t * 2) % 2 ? 'p7' : 'p1', 1460 + Math.sin(t * 1.7) * 50, 260 + Math.cos(t * 1.3) * 45 - Math.abs(Math.sin(t * 5.5)) * 10, 110, { anchor: 'bottom' });
    },
    onFinish(r) { FX.glitter(FLAG_X, r.winner.ly - 80, 30, ['#ffffff', '#bfefff', '#ffd84a']); },
    winBanner: r => '🏁 ' + r.winner.name + ' stops right on the flag!',
    winPos: r => ({ x: FLAG_X, y: r.winner.ly - 90 })
  };
})();
