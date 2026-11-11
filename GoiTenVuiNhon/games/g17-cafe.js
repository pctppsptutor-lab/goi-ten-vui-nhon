// Game 17 — Oops, Wrong Cake! (teamwork & passing)
// Ten students form a serving line and pass a cake from tray to tray; whoever balances it last and delivers it to the table is picked.
// Twist: the cake grows legs and runs off the first tray; the cat manager blocks it and pushes it onto another tray for a surprise winning delivery.
(() => {
  const XS = [230, 460, 690, 920, 1150];
  const LINE = [...XS.map(x => [x, 480]), ...[...XS].reverse().map(x => [x, 780])];   // serving order snakes back along the front row
  const TABLE = [1440, 640];

  // cake index along the serving line over time: hops between whoever is being teased
  function cakeIdx(r, t) {
    const keys = r.keys; if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; return lerp(a, b, ease(clamp((t - t0) / (t1 - t0)))); }
    return keys[keys.length - 1][1];
  }
  const at = (r, idx) => {
    const i = Math.min(r.players.length - 1, Math.floor(idx)), j = Math.min(r.players.length - 1, i + 1), k = idx - i, a = r.players[r.order[i]], b = r.players[r.order[j]];
    return [lerp(a.lx, b.lx, k), lerp(a.ly, b.ly, k) - 150 - Math.sin(k * Math.PI) * 40];
  };
  function cake(x, y, t, legs, w = 70) {
    if (legs) { ctx.save(); ctx.strokeStyle = '#7a4a24'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      [-14, 14].forEach((dx, i) => { const s = Math.sin(t * 22 + i * Math.PI) * 10; ctx.beginPath(); ctx.moveTo(x + dx, y + 18); ctx.lineTo(x + dx + s, y + 40); ctx.lineTo(x + dx + s + 8, y + 40); ctx.stroke(); }); ctx.restore(); }
    drawImg('p6', x, y, w);
  }

  GAME_IMPL.g17 = {
    id: 'g17', title: 'Oops, Wrong Cake!', base: 'assets/g17/', titleY: 270,
    assets: gAssets(['waiting', 'receive', 'pass', 'balance', 'runaway', 'redirect', 'win'], ['p0', 'p1', 'p3', 'p4', 'p6', 'p9', 'p11']),
    startBanner: '🍰 Pass the cake down the line — carefully!', mote: '#fff0d8', rayColor: '#fff2a8',

    setup(r) {
      const n = r.players.length, slots = spread(n);
      r.players.forEach((p, i) => { [p.lx, p.ly] = LINE[slots[i]]; p.x = p.lx; p.y = p.ly - 80; });
      r.order = [...r.players.keys()];                                          // serving order = line order
      const idx = p => r.players.indexOf(p);
      r.fakes = makeFakes(r, 1.4);
      r.keys = [[.8, 0]];
      for (const f of r.fakes) { r.keys.push([f.at, idx(f.p)]); r.keys.push([f.at + f.dur, idx(f.p)]); }
      r.keys.push([r.TW, idx(r.decoy || r.winner)]);
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      if (te < 0 && t > 1) { const i = Math.round(cakeIdx(r, t)); if (i !== r.lastI) { r.lastI = i; SFX.tone(1200, .06, { type: 'triangle', vol: .05 }); } }
      if (f && te < 0) cue('fk' + f.at, () => { r.banner = '🍰 ' + f.p.name + ' balances the cake…'; SFX.leader(); });
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🍰 ' + D.name + ' is about to deliver…'; });
        if (te > .5) cue('b', () => { outcome('wrong_turn', D); SFX.boing(); SFX.wheee(); r.banner = '🦵 The cake grows legs and RUNS AWAY!'; });
        if (te > 1.1) cue('c', () => { CAM.shake(r, 8); r.banner = '🐱 The cat manager blocks the way…'; });
        if (te > 1.6) cue('d', () => { outcome('selected', Wn); SFX.pop(); r.banner = '🐾 …and pushes it onto ' + Wn.name + "'s tray!"; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🍰 ' + (D || Wn).name + ' wobbles…'; });
        if (te > 1.1) cue('b', () => { outcome('selected', Wn); SFX.boing(); r.banner = '🍰 …and passes it to ' + Wn.name + '!'; });
      }
      if (te > 2.8) cue('del', () => { SFX.ding(); FX.sparkle(...TABLE, 20); r.banner = '☕ Delivered to the table!'; });
    },

    // the cake's position and whether it has legs
    cakePos(r, t) {
      const te = t - r.TW, D = r.decoy || r.winner, Wn = r.winner;
      if (te <= 0) return [...at(r, cakeIdx(r, t)), false];
      const dP = [D.lx, D.ly - 150], wP = [Wn.lx, Wn.ly - 150], tP = [TABLE[0], TABLE[1] - 70];
      if (!r.plain) {
        if (te < .5) return [dP[0], dP[1] + Math.sin(te * 40) * 3, false];
        const run = [dP[0] + (Wn.lx > D.lx ? -220 : 220), D.ly + 30];
        if (te < 1.1) { const k = ease((te - .5) / .6); return [lerp(dP[0], run[0], k), lerp(dP[1], run[1], k) + Math.abs(Math.sin(te * 20)) * -10, true]; }
        if (te < 1.6) return [run[0] + Math.sin(te * 30) * 6, run[1], true];
        if (te < 2.2) { const k = ease((te - 1.6) / .6); return [lerp(run[0], wP[0], k), lerp(run[1], wP[1], k) - Math.sin(k * Math.PI) * 80, false]; }
        const k = ease(clamp((te - 2.2) / .6)); return [lerp(wP[0], tP[0], k), lerp(wP[1], tP[1], k), false];
      }
      if (te < 1.1) return [dP[0], dP[1] + Math.sin(te * 30) * 4, false];
      if (te < 2) { const k = ease((te - 1.1) / .9); return [lerp(dP[0], wP[0], k), lerp(dP[1], wP[1], k) - Math.sin(k * Math.PI) * 60, false]; }
      const k = ease(clamp((te - 2) / .8)); return [lerp(wP[0], tP[0], k), lerp(wP[1], tP[1], k), false];
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      drawImg('p9', TABLE[0] - 50, TABLE[1] - 66, 54); drawImg('p11', TABLE[0] + 50, TABLE[1] - 64, 60);
      const [cx, cy, legs] = done ? [TABLE[0], TABLE[1] - 70, false] : this.cakePos(r, rt);
      const holder = te < 0 ? r.players[Math.round(cakeIdx(r, rt))] : null;
      const order = [...r.players].sort((a, b) => a.ly - b.ly);
      for (const p of order) {
        if (done && p === Wn) continue;
        let pose = 'waiting';
        if (holder === p) pose = f && f.p === p ? 'balance' : 'receive';
        else if (holder && Math.abs(r.players.indexOf(p) - cakeIdx(r, rt)) < 1.3) pose = 'pass';
        if (p === D && te > 0) pose = r.plain ? 'balance' : te < .5 ? 'balance' : 'runaway';
        if (p === Wn && te > (r.plain ? 1.1 : 1.6)) pose = 'redirect';
        charImg(p.av, pose, p.lx, p.ly, 160);
        tagC(p.name, p.lx, p.ly + 22, holder === p || (p === Wn && te > (r.plain ? 1.1 : 1.6)));
      }
      cake(cx, cy, rt, legs);
      if (legs) FX.every(r, 'crumb', .1, () => FX.smoke(cx, cy + 30, 1, '#ffe0c0'));
      // cat manager patrols the cafe floor and intercepts the runaway cake
      let mx = 1435 + Math.sin(rt * 1.7) * 55, my = 430 + Math.cos(rt * 1.3) * 80 - Math.abs(Math.sin(rt * 6)) * 14, mp = Math.floor(rt * 2.5) % 2 ? 'p0' : 'p1';
      if (!r.plain && te > 1.1 && te < 2.4 && !done) { const k = ease(clamp((te - 1.1) / .4)); mx = lerp(1435, cx + (cx > 800 ? 90 : -90), k); my = lerp(430, cy + 150, k); mp = 'p4'; }
      if (!r.plain && te > .5 && te < 1.1) mp = 'p1';
      if (done) { mp = 'p3'; mx = 1450; my = 420 - Math.abs(Math.sin(rt * 5)) * 10; }
      drawImg(mp, mx, my, 150, { anchor: 'bottom', flip: (mp === 'p4' && cx > mx) || (te < 0 && Math.cos(rt * 1.7) > 0) });
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', TABLE[0] - 110, TABLE[1] + 90, 220 * (.6 + .4 * ease(k)));
        tagC(Wn.name, TABLE[0] - 110, TABLE[1] + 114, true);
      }
      Wn.x = cx; Wn.y = cy;
    },

    idle(t) {
      drawImg('p9', TABLE[0] - 50, TABLE[1] - 66, 54); drawImg('p11', TABLE[0] + 50, TABLE[1] - 64, 60);
      const u = (t * .8) % 9, i = Math.floor(u), k = u - i, a = LINE[i], b = LINE[i + 1];
      LINE.forEach(([x, y], j) => charImg(j, j === Math.round(u) ? 'receive' : 'waiting', x, y, 160));
      cake(lerp(a[0], b[0], k), lerp(a[1], b[1], k) - 150 - Math.sin(k * Math.PI) * 40, t, false);
      drawImg(Math.floor(t * 2) % 2 ? 'p0' : 'p1', 1435 + Math.sin(t * 1.6) * 55, 430 + Math.cos(t * 1.2) * 75 - Math.abs(Math.sin(t * 5.5)) * 12, 150, { anchor: 'bottom' });
    },
    onFinish() { FX.sparkle(TABLE[0], TABLE[1] - 90, 30, ['#ffb3d6', '#ffd84a', '#ffffff']); },
    winBanner: r => '🍰 ' + r.winner.name + ' delivers the cake!',
    winPos: () => ({ x: TABLE[0] - 60, y: TABLE[1] - 80 })
  };
})();
