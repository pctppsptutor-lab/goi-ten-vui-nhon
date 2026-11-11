// Game 14 — Where’s My Shell?
// Ten students wearing ten different shells scuttle sideways across the beach; the first to reach the sandcastle is picked.
// Twist: the first shell to arrive is empty; a sea bubble pops and shows the real winner hiding inside another shell.
(() => {
  const X0 = 170, X1 = 1180, CASTLE = [1420, 560];
  const SHELLS = ['p4', 'p5', 'p6', 'p12', 'p13', 'p11'];
  const laneY = (i, n) => 330 + (n > 1 ? i * 450 / (n - 1) : 225);

  function progress(r, p, t) {
    const u = clamp((t - .8) / (r.TW - .8));
    let v = u * p.cap + .02 * Math.sin(t * (2 + p.seed * 2) + p.seed * 7);
    for (const f of r.fakes) if (f.p === p && t > f.at) v += .1 * clamp((t - f.at) / f.dur) * (1 - clamp((t - f.at - f.dur) / 1.5));
    return clamp(v, 0, .98);
  }

  GAME_IMPL.g14 = {
    id: 'g14', title: 'Where’s My Shell?', base: 'assets/g14/', titleY: 220,
    assets: gAssets(['idle', 'ready', 'action', 'almost', 'fake', 'twist', 'win'], [...SHELLS, 'p0', 'p1', 'p2', 'p3', 'p18', 'p30', 'p33', 'p37']),
    startBanner: '🦀 Scuttle sideways to the sandcastle!', mote: '#fff6dc', rayColor: '#fff2a8',

    setup(r) {
      const n = r.players.length, lanes = shuffle([...Array(n).keys()]);
      r.players.forEach((p, i) => { p.ly = laneY(lanes[i], n); p.cap = .35 + Math.random() * .45; p.shell = SHELLS[i % SHELLS.length]; });
      r.winner.cap = .78; if (r.decoy) r.decoy.cap = .9;
      r.fakes = makeFakes(r, 1.2);
    },
    pos(r, p, t) {
      const te = t - r.TW, D = r.decoy, Wn = r.winner, x0 = X0 + progress(r, p, Math.min(t, r.TW)) * (X1 - X0);
      if (te <= 0) return [x0, p.ly];
      if (p === D) {
        const k = ease(clamp(te / .7));
        if (!r.plain) return [lerp(x0, CASTLE[0] - 260, Math.min(k, .6)), p.ly];   // stops short: only its empty shell reaches the castle
        return [lerp(x0, CASTLE[0] - 150, k), lerp(p.ly, CASTLE[1] - 80, k)];
      }
      if (p === Wn) { const from = r.plain ? 1.1 : 1.7, k = ease(clamp((te - from) / 1.2)); return [lerp(x0, CASTLE[0] - 60, k), lerp(p.ly, CASTLE[1] + 70, k) - Math.sin(k * Math.PI) * 30]; }
      return [x0 + te * 10, p.ly];
    },

    tick(r, t, te) {
      const D = r.decoy, Wn = r.winner;
      if (te < -.25 && t > 1.3) {
        const lead = r.players.reduce((a, b) => progress(r, b, t) > progress(r, a, t) ? b : a);
        if (lead !== r.leader && t - (r.leaderAt || 0) > .5) { r.leader = lead; r.leaderAt = t; r.banner = '🐚 In front: ' + lead.name; SFX.leader(); }
      }

      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🐚 ' + D.name + "'s shell reaches the castle!"; });
        if (te > .7) cue('b', () => { outcome('wrong_turn', D); SFX.boing(); SFX.sadTrombone(); r.banner = '❓ Wait… the shell is EMPTY!'; });
        if (te > 1.2) cue('c', () => { SFX.bubbles(); r.banner = '🫧 A sea bubble floats over another shell…'; });
        if (te > 1.7) cue('d', () => { outcome('selected', Wn); SFX.pop(); FX.bubbles(Wn.x, Wn.y, 16); r.banner = '💥 POP! ' + Wn.name + ' was hiding inside!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🐚 ' + (D || Wn).name + ' is nearly there…'; });
        if (te > 1.1) cue('b', () => { outcome('selected', Wn); SFX.boing(); r.banner = '💨 …but another shell zooms past!'; });
      }
      if (te > 2.9) cue('in', () => { SFX.ding(); FX.sparkle(...CASTLE, 26); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', D = r.decoy, Wn = r.winner;
      drawImg('p30', ...CASTLE, 220, { anchor: 'bottom' });
      // the empty shell that rolled up to the castle
      if (!r.plain && D && te > .1 && !done) {
        const k = ease(clamp((te - .1) / .6)), [dx] = this.pos(r, D, rt);
        drawImg(D.shell, lerp(dx + 40, CASTLE[0] - 120, k), CASTLE[1] - 10, 80, { anchor: 'bottom', rot: (1 - k) * 6 });
        if (te > .7) drawImg('p33', CASTLE[0] - 120, CASTLE[1] - 110 + Math.sin(rt * 5) * 6, 90);
      }
      const order = [...r.players].sort((a, b) => this.pos(r, a, rt)[1] - this.pos(r, b, rt)[1]);
      for (const p of order) {
        if (done && p === Wn) continue;
        const [x, y] = this.pos(r, p, rt); p.x = x; p.y = y - 40;
        let pose = rt < .8 ? 'ready' : 'action';
        if (p === r.leader && te < 0) pose = 'almost';
        if (p === D && !r.plain && te > 0) pose = te < .7 ? 'fake' : 'twist';
        if (p === D && r.plain && te > 0) pose = te < 1.1 ? 'almost' : 'twist';
        // the winner hides inside a pearl shell under a bubble until it pops
        if (p === Wn && !r.plain && te > 1.2 && te < 1.7) {
          drawImg('p11', x, y + 6, 90, { anchor: 'bottom', rot: Math.sin(rt * 20) * .05 });
          drawImg('p37', x, y - 50 - (1.7 - te) * 60, 110 * (1 + (te - 1.2) * .3));
          tagC(p.name, x - 100, y - 14, true); continue;
        }
        if (p === Wn && te > (r.plain ? 1.1 : 1.7)) pose = 'fake';
        if (pose === 'action') FX.every(r, 'd' + p.ly, .3, () => FX.smoke(x - 40, y, 1, '#e8d3a8'));
        charImg(p.av, pose, x, y + Math.abs(Math.sin(rt * 9 + p.seed * 9)) * -3, 96);
        tagC(p.name, x - 100, y - 14, (r.leader === p && te < 0) || (p === Wn && te > 1.7));
      }
      // hermit crab referee scuttles around the sandcastle
      let cp = Math.floor(rt * 3) % 2 ? 'p0' : 'p2';
      if (rt < 1) cp = 'p2'; else if (!r.plain && te > .7 && te < 1.7) cp = 'p1'; else if (done) cp = 'p3';
      drawImg(cp, CASTLE[0] + 60 + Math.sin(rt * 2.2) * 80, CASTLE[1] + 45 - Math.abs(Math.sin(rt * 8)) * 10, 110, { anchor: 'bottom', flip: Math.cos(rt * 2.2) < 0 });
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', CASTLE[0] - 60, CASTLE[1] + 70, 200 * (.6 + .4 * ease(k)));
        tagC(Wn.name, CASTLE[0] - 60, CASTLE[1] + 94, true);
      }
    },

    idle(t) {
      drawImg('p30', ...CASTLE, 220, { anchor: 'bottom' });
      for (let i = 0; i < 10; i++) charImg(i, 'action', X0 + ((t * 45 + i * 101) % (X1 - X0)), laneY(i, 10), 96);
      drawImg(Math.floor(t * 3) % 2 ? 'p0' : 'p2', CASTLE[0] + 60 + Math.sin(t * 2) * 80, CASTLE[1] + 45 - Math.abs(Math.sin(t * 7.5)) * 10, 110, { anchor: 'bottom', flip: Math.cos(t * 2) < 0 });
    },
    onFinish() { FX.sparkle(CASTLE[0] - 60, CASTLE[1] - 120, 36, ['#ffd84a', '#7cf7ff', '#ffffff']); },
    winBanner: r => '🏰 ' + r.winner.name + ' reaches the sandcastle!',
    winPos: () => ({ x: CASTLE[0] - 60, y: CASTLE[1] - 60 })
  };
})();
