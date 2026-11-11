// Game 11 — Capybara Wants Melon
// Ten capybaras nose floating watermelons along the canal; the melon that reaches the delivery ring picks the player.
// Twist: the first melon to arrive splits open — a duckling is having a bath inside; the current changes and carries another capybara's melon to the ring.
(() => {
  const X0 = 210, X1 = 1250, RING = [1430, 540];
  const laneY = (i, n) => 345 + (n > 1 ? i * 425 / (n - 1) : 210);

  function progress(r, p, t) {             // 0..1 along the canal before the reveal
    const u = clamp((t - .8) / (r.TW - .8));
    let v = u * p.cap + .025 * Math.sin(t * (1.3 + p.seed * 2) + p.seed * 7);
    for (const f of r.fakes) if (f.p === p && t > f.at) v += .1 * clamp((t - f.at) / f.dur) * (1 - clamp((t - f.at - f.dur) / 1.5));
    return clamp(v, 0, .98);
  }

  GAME_IMPL.g11 = {
    id: 'g11', title: 'Capybara Wants Melon', base: 'assets/g11/', titleY: 230, animals: true, resultPose: 'win',
    assets: gAssets(['idle', 'nudge', 'delivery', 'false', 'duck', 'win'], ['p19', 'p20', 'p25', 'p29']),
    startBanner: '🍉 The capybaras push off with their melons!', mote: '#e8fff0', rayColor: '#fff2a8',

    setup(r) {
      const n = r.players.length, order = shuffle([...Array(n).keys()]);
      r.players.forEach((p, i) => { p.lane = order[i]; p.ly = laneY(p.lane, n); p.cap = .35 + Math.random() * .45; });
      r.winner.cap = .82; if (r.decoy) r.decoy.cap = .9;
      r.fakes = makeFakes(r, 1.2);
    },
    pos(r, p, t) {
      const te = t - r.TW, D = r.decoy, Wn = r.winner;
      const x0 = X0 + progress(r, p, Math.min(t, r.TW)) * (X1 - X0);
      if (te <= 0) return [x0, p.ly, 0];
      if (p === D && !r.plain) { const k = ease(clamp(te / .6)); return [lerp(x0, RING[0] - 70, k), lerp(p.ly, RING[1] + 4, k), 0]; }
      if (p === D && r.plain) { const k = ease(clamp(te / 1)); return [lerp(x0, RING[0] - 140, k) - clamp(te - 1) * 60, lerp(p.ly, RING[1] - 90, k), 0]; }
      if (p === Wn) {
        const from = r.plain ? 1 : 1.5, k = ease(clamp((te - from) / 1.5));
        const sx = x0, sy = p.ly, ex = RING[0] - 40, ey = RING[1] + (r.plain ? 0 : 60);
        return [lerp(sx, ex, k), lerp(sy, ey, k) - Math.sin(k * Math.PI) * 40, k];
      }
      return [x0 + te * 12, p.ly, 0];
    },

    tick(r, t, te) {
      const D = r.decoy, Wn = r.winner;
      if (te < -.25 && t > 1.3) {
        const lead = r.players.reduce((a, b) => progress(r, b, t) > progress(r, a, t) ? b : a);
        if (lead !== r.leader && t - (r.leaderAt || 0) > .5) { r.leader = lead; r.leaderAt = t; r.banner = '🍉 In front: ' + lead.name; SFX.leader(); }
      }

      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🍉 ' + D.name + "'s melon reaches the ring first…"; });
        if (te > .7) cue('b', () => { outcome('wrong_turn', D); SFX.pop(); SFX.quack(.1, 2); SFX.bubbles(); FX.splash(RING[0], RING[1], 18); r.banner = '🐥 It splits open — a duckling is having a bath!'; });
        if (te > 1.2) cue('c', () => { CAM.shake(r, 8); SFX.swoosh(); r.banner = '🌊 The current changes direction…'; });
        if (te > 1.6) cue('d', () => { outcome('selected', Wn); r.banner = '🍉 …and carries ' + Wn.name + "'s melon in!"; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🍉 ' + (D || Wn).name + ' is nearly there…'; });
        if (te > 1) cue('b', () => { outcome('selected', Wn); SFX.boing(); r.banner = '💨 …but a melon slips past into the ring!'; });
      }
      if (te > 2.9) cue('in', () => { SFX.ding(); FX.ring(...RING, '#ffd84a', 150); FX.splash(...RING, 20); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', D = r.decoy, Wn = r.winner;
      // delivery ring and the current that swings round during the twist
      const swing = !r.plain && te > 1.2 && te < 3 && !done;
      if (swing) { drawImg('p20', RING[0] - 160, RING[1] + 70, 260 * (1 + .1 * Math.sin(rt * 8)), { alpha: .8 }); FX.every(r, 'cur', .08, () => FX.splash(RING[0] - 220 + Math.random() * 200, RING[1] + 80, 2)); }
      drawImg('p29', ...RING, 200, { alpha: .8 });
      drawImg('p19', ...RING, 170);
      drawImg('p25', RING[0] + 105 + Math.sin(rt * 1.6) * 30, RING[1] - 30 + Math.cos(rt * 1.9) * 55 - Math.abs(Math.sin(rt * 5.5)) * 10, 96, { anchor: 'bottom', flip: Math.cos(rt * 1.6) > 0 });
      const order = [...r.players].sort((a, b) => this.pos(r, a, rt)[1] - this.pos(r, b, rt)[1]);
      for (const p of order) {
        if (done && p === Wn) continue;
        const [x, y] = this.pos(r, p, rt); p.x = x; p.y = y - 30;
        let pose = rt < .8 ? 'idle' : 'nudge', bob = Math.sin(rt * 4 + p.seed * 9) * 3;
        if (p === D && !r.plain && te > 0) pose = te < .7 ? 'delivery' : 'duck';
        if (p === D && r.plain && te > 0) pose = te < 1 ? 'delivery' : 'false';
        if (p === Wn && te > (r.plain ? 1 : 1.6)) pose = 'delivery';
        if (pose === 'nudge') FX.every(r, 'wk' + p.av + p.lane, .25, () => FX.splash(x - 50, y + 4, 1));
        charImg(p.av, pose, x, y + bob, 76);
        tagC(p.name, x - 110, y - 14, r.leader === p && te < 0);       // tag trails behind, so lanes never cover it
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', RING[0] - 40, RING[1] + 60, 180 * (.6 + .4 * ease(k)));
        tagC(Wn.name, RING[0] - 40, RING[1] + 84, true);
      }
    },

    idle(t) {
      drawImg('p29', ...RING, 200, { alpha: .8 }); drawImg('p19', ...RING, 170);
      drawImg('p25', RING[0] + 105 + Math.sin(t * 1.5) * 30, RING[1] - 30 + Math.cos(t * 1.8) * 55 - Math.abs(Math.sin(t * 5)) * 10, 96, { anchor: 'bottom', flip: Math.cos(t * 1.5) > 0 });
      for (let i = 0; i < 10; i++) charImg(i, 'nudge', X0 + ((t * 40 + i * 97) % (X1 - X0)), laneY(i, 10) + Math.sin(t * 4 + i) * 3, 76);
    },
    onFinish() { FX.splash(RING[0], RING[1], 30); },
    winBanner: r => '📦 Delivered! ' + r.winner.name + "'s melon wins!",
    winPos: () => ({ x: RING[0] - 40, y: RING[1] - 40 })
  };
})();
