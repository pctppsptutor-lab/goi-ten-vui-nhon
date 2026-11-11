// Game 15 — Alien Dance Party (music & rhythm)
// Ten "aliens" watch a dance move on the disco floor, then copy it. When the music stops everyone freezes,
// and the scanner picks whoever held the last pose.
// Twist: the first alien in the light pops open — two tiny aliens inside, striking the wrong pose; the disco ball replays the last beat and picks the real winner.
(() => {
  const SPOTS = [[400, 540], [600, 540], [800, 540], [1000, 540], [1200, 540], [300, 780], [550, 780], [800, 780], [1050, 780], [1300, 780]];
  const BALL = [800, 120], HOST = [1460, 470], BEAT = .5;
  const kidH = y => y < 700 ? 150 : 175;
  const COLORS = ['#ff6fae', '#7cf7ff', '#b48cff', '#ffd84a', '#7cff9b'];

  function scanner(x, y, a, color = '#7cf7ff') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 * a;
    const g = ctx.createLinearGradient(0, BALL[1], 0, y); g.addColorStop(0, color + 'ff'); g.addColorStop(1, color + '33');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(BALL[0] - 14, BALL[1] + 40); ctx.lineTo(BALL[0] + 14, BALL[1] + 40); ctx.lineTo(x + 85, y); ctx.lineTo(x - 85, y); ctx.closePath(); ctx.fill();
    FX.halo(x, y, 100, color, .7 * a); ctx.restore();
  }

  GAME_IMPL.g15 = {
    id: 'g15', title: 'Alien Dance Party', base: 'assets/g15/', titleY: 430,
    assets: gAssets(['watch', 'step', 'turn', 'freeze', 'scan', 'tiny', 'win'], ['p0', 'p1', 'p2', 'p4', 'p6', 'p11', 'p12', 'p24', 'p31']),
    startBanner: '👽 Watch the move… then copy it!', mote: '#e6d6ff', rayColor: '#e6ccff',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { [p.sx, p.sy] = SPOTS[slots[i]]; p.x = p.sx; p.y = p.sy - 90; });
      r.fakes = makeFakes(r, 1.4);
    },
    spot(r, t) {
      const te = t - r.TW, f = activeFake(r, t), D = r.decoy || r.winner, Wn = r.winner;
      if (te < 0) return f ? [f.p.sx, f.p.sy - 40, 1] : [800 + Math.sin(t * 1.2) * 520, 660 + Math.sin(t * 2.3) * 130, .5];
      const from = r.plain ? 1.1 : 1.8, k = ease(clamp((te - from) / .6));
      return [lerp(D.sx, Wn.sx, k), lerp(D.sy, Wn.sy, k) - 40, 1];
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner, b = Math.floor(t / BEAT);
      if (te < 0 && t > .6 && b !== r.lastBeat) {
        r.lastBeat = b; const copy = Math.floor(b / 4) % 2;
        SFX.tone(copy ? 330 : 440, .12, { type: 'square', vol: .05, lp: 1400 });
        if (b % 4 === 0) r.banner = copy ? '🕺 Now copy the move!' : '👀 Watch the host…';
      }
      if (f && te < 0) cue('fk' + f.at, () => { r.banner = '🔦 The scanner checks ' + f.p.name + '…'; SFX.leader(); });
      if (te > 0) cue('stop', () => { Music.stop(); SFX.tone(260, .5, { type: 'sawtooth', vol: .1, to: 60, lp: 900 }); r.banner = '🧊 FREEZE!'; });
      if (!r.plain) {
        if (te > .4) cue('a', () => { outcome('almost_selected', D); SFX.sparkle(); r.banner = '✨ The scanner lights up ' + D.name + '…'; });
        if (te > .9) cue('b', () => { outcome('wrong_turn', D); CAM.shake(r, 10); SFX.pop(); SFX.quack(.1, 2.6); r.banner = '👽👽 The costume pops open — two tiny aliens in the wrong pose!'; });
        if (te > 1.4) cue('c', () => { Music.play('tension'); [0, .25].forEach(d => SFX.tone(523, .2, { type: 'triangle', vol: .15, delay: d })); FX.ring(...BALL, '#ff6fae', 200); r.banner = '🪩 The disco ball replays the last beat…'; });
        if (te > 1.8) cue('d', () => { outcome('selected', Wn); r.banner = '🔦 …and scans ' + Wn.name + '!'; });
      } else {
        if (te > .4) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🔦 Is it ' + (D || Wn).name + '?'; });
        if (te > 1.1) cue('b', () => { outcome('selected', Wn); SFX.boing(); r.banner = '🔦 …no! The scanner moves on!'; });
      }
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', D = r.decoy, Wn = r.winner;
      const beatK = (rt % BEAT) / BEAT, dancing = te < 0 && rt > .6, copy = Math.floor(Math.floor(rt / BEAT) / 4) % 2;
      // disco ball on its cord
      ctx.save(); ctx.strokeStyle = '#c9c9d9'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(BALL[0], 0); ctx.lineTo(BALL[0], BALL[1] - 50); ctx.stroke(); ctx.restore();
      if (dancing || (te > 1.4 && te < 2.2)) FX.halo(...BALL, 140 * (1 + (1 - beatK) * .3), COLORS[Math.floor(rt / BEAT) % 5], .5);
      drawImg(te > 1.4 && !r.plain && !done ? 'p12' : 'p11', BALL[0], BALL[1], 110, { rot: rt * .8 });
      // host alien dances and glides along the stage
      let hp = dancing ? (copy ? 'p0' : (Math.floor(rt / BEAT) % 2 ? 'p1' : 'p2')) : 'p0';
      if (!r.plain && te > .9 && te < 1.8) hp = 'p6';
      if (done) hp = 'p4';
      drawImg(hp, HOST[0] + Math.sin(rt * 2) * 35, HOST[1] + Math.cos(rt * 1.5) * 65 - Math.abs(Math.sin(rt / BEAT * Math.PI)) * 16, 130, { anchor: 'bottom', rot: Math.sin(rt * 4) * .06 });
      const [sx, sy, sa] = done ? [Wn.sx, Wn.sy - 40, 1] : this.spot(r, rt);
      scanner(sx, sy, sa);
      const order = [...r.players].sort((a, b) => a.sy - b.sy);
      for (const p of order) {
        if (done && p === Wn) continue;
        const h = kidH(p.sy), lit = Math.hypot(p.sx - sx, p.sy - 40 - sy) < 90;
        let pose = 'watch', dy = 0;
        if (dancing && copy) { pose = Math.floor(rt / BEAT) % 2 ? 'step' : 'turn'; dy = -Math.max(0, 1 - beatK * 3) * 8; }
        if (te > 0) pose = 'freeze';
        if (lit && te < 0) pose = 'scan';
        if (p === D && !r.plain && te > .9) pose = 'tiny';
        if (p === Wn && te > (r.plain ? 1.1 : 1.8)) pose = 'scan';
        charImg(p.av, pose, p.sx, p.sy + dy, h);
        tagC(p.name, p.sx, p.sy + 22, lit);
      }
      if (!r.plain && D && te > .9 && te < 1.6 && !done) drawImg('p24', D.sx, D.sy - 100, 200 * clamp((te - .9) / .15), { alpha: 1 - clamp((te - 1.2) / .4) });
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        drawImg('p31', Wn.sx, Wn.sy - 140, 260, { alpha: .9, rot: rt * .5 });
        charImg(Wn.av, 'win', Wn.sx, Wn.sy, 230 * (.6 + .4 * ease(k)));
        tagC(Wn.name, Wn.sx, Wn.sy + 24, true);
      }
      Wn.x = sx; Wn.y = sy;
    },

    idle(t) {
      FX.halo(...BALL, 140, COLORS[Math.floor(t / BEAT) % 5], .45);
      drawImg('p11', BALL[0], BALL[1], 110, { rot: t * .8 });
      drawImg(Math.floor(t / BEAT) % 2 ? 'p1' : 'p2', HOST[0] + Math.sin(t * 2) * 35, HOST[1] + Math.cos(t * 1.5) * 60 - Math.abs(Math.sin(t / BEAT * Math.PI)) * 14, 130, { anchor: 'bottom', rot: Math.sin(t * 4) * .06 });
      scanner(800 + Math.sin(t * 1.2) * 520, 660 + Math.sin(t * 2.3) * 130, .5);
      SPOTS.forEach(([x, y], i) => charImg(i, Math.floor(t / BEAT) % 2 ? 'step' : 'turn', x, y, kidH(y)));
    },
    onFinish(r) { FX.sparkle(r.winner.sx, r.winner.sy - 150, 40, COLORS); },
    winBanner: r => '🛸 ' + r.winner.name + ' held the perfect pose!',
    winPos: r => ({ x: r.winner.sx, y: r.winner.sy - 130 })
  };
})();
