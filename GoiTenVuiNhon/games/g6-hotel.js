// Game 06 — Thang máy khách sạn ma
// Ten lift doors open briefly to show ten room icons, then close; ghostly footprints lead to the chosen room.
// Twist: the first door hides a ghost holding a fake icon; the skeleton janitor spins the signpost and the footprints turn to the real room.
(() => {
  const XS = [451, 627, 804, 980, 1157];
  const DOORS = [...XS.map(x => [x, 307, 171]), ...XS.map(x => [x, 527, 380])];   // [x, door bottom, icon plate y]
  const DW = 80, DH = 112, SIGN = [178, 600], PED = [800, 735];
  const ICONS = ['p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16'];

  // open doorway (k = 0 closed … 1 open) with something inside
  function doorway(d, k, inside) {
    if (k <= 0) return;
    const [x, y] = d, w = DW * k;
    ctx.save(); ctx.fillStyle = '#140b24'; ctx.fillRect(x - w / 2, y - DH, w, DH);
    ctx.beginPath(); ctx.rect(x - w / 2, y - DH, w, DH); ctx.clip(); if (inside) inside(x, y); ctx.restore();
    ctx.save(); ctx.strokeStyle = '#f4c869'; ctx.lineWidth = 3; ctx.strokeRect(x - w / 2, y - DH, w, DH); ctx.restore();
  }
  // glowing ghost footprints along a curve from the signpost to a door
  function trail(to, k, alpha = 1) {
    const [sx, sy] = SIGN, [ex, ey] = [to[0], to[1] + 26], cx = (sx + ex) / 2, cy = Math.max(sy, ey) + 140, n = 16;
    ctx.save(); ctx.fillStyle = '#7ff6ff'; ctx.shadowColor = '#3fe0ff'; ctx.shadowBlur = 12;
    for (let i = 1; i <= Math.floor(n * k); i++) {
      const u = i / n, x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * cx + u * u * ex, y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * cy + u * u * ey;
      const u2 = Math.min(1, u + .01), x2 = (1 - u2) * (1 - u2) * sx + 2 * (1 - u2) * u2 * cx + u2 * u2 * ex, y2 = (1 - u2) * (1 - u2) * sy + 2 * (1 - u2) * u2 * cy + u2 * u2 * ey;
      const a = Math.atan2(y2 - y, x2 - x), side = i % 2 ? 1 : -1;
      ctx.globalAlpha = alpha * (.4 + .6 * u);
      ctx.save(); ctx.translate(x + Math.cos(a + Math.PI / 2) * 9 * side, y + Math.sin(a + Math.PI / 2) * 9 * side); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(10, 0, 4, 4, 0, 0, 7); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  const mem = r => [.5, .5 + r.M];                     // memorise window
  const openK = (t, a, b) => clamp((t - a) / .35) * (1 - clamp((t - b + .35) / .35));

  GAME_IMPL.g6 = {
    id: 'g6', title: 'Ghost in the Lift', base: 'assets/g6/', titleY: 650,
    assets: gAssets(['observe', 'follow', 'win'], [...ICONS, 'p0', 'p2', 'p4', 'p17', 'p26', 'p27']),
    startBanner: '🛎️ Remember each room\'s symbol!', mote: '#9ff7ff', rayColor: '#fff0b0',

    setup(r) {
      const slots = spread(r.players.length), icons = shuffle([...ICONS]);
      r.players.forEach((p, i) => { p.door = DOORS[slots[i]]; p.icon = icons[i]; p.x = p.door[0]; p.y = p.door[1] - 60; });
      r.fakeIcon = icons[10] || 'p16';
      r.M = clamp(r.TW * .3, 1.6, 3.5);
      r.fakes = makeFakes(r, mem(r)[1] + .3);
    },

    tick(r, t, te) {
      const [a, b] = mem(r), f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      if (t > a) cue('open', () => { SFX.ding(); r.players.forEach(p => FX.glitter(p.door[0], p.door[1] - 60, 3)); });
      if (t > b) cue('close', () => { SFX.tone(220, .3, { type: 'triangle', vol: .1 }); r.banner = '👣 Follow the ghostly footprints…'; });
      if (f && te < 0) cue('fk' + f.at, () => { r.banner = '👣 Do they lead to ' + f.p.name + "'s room?"; SFX.leader(); });
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); r.banner = '👣 The footprints stop at ' + D.name + "'s room!"; });
        if (te > .6) cue('b', () => { FX.ring(D.door[0], D.door[1] - 60, '#b48cff', 140); FX.smoke(D.door[0], D.door[1] - 50, 10, '#bfefff'); outcome('almost_selected', D); SFX.tone(140, .7, { type: 'sine', vol: .2, vib: 12, vibRate: 5 }); r.banner = '👻 BOO! A ghost holding a fake symbol!'; CAM.shake(r, 9); });
        if (te > 1) cue('c', () => { outcome('wrong_turn', D); SFX.sadTrombone(); });
        if (te > 1.2) cue('d', () => { FX.sparkle(SIGN[0], SIGN[1] - 70, 18, ['#ffd84a', '#ffffff']); FX.smoke(SIGN[0] + 60, SIGN[1] + 120, 6, '#d8d0e8'); SFX.swoosh(); r.banner = '💀 The skeleton janitor spins the signpost!'; });
        if (te > 1.6) cue('e', () => { outcome('selected', Wn); r.banner = '👣 The footprints change direction…'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '👣 Is it ' + (D || Wn).name + "'s room?"; });
        if (te > .8) cue('b', () => { SFX.boing(); r.banner = '🙅 …no! The footprints keep going…'; });
        if (te > 1.6) cue('e', () => { outcome('selected', Wn); });
      }
      if (te > (r.plain ? 2 : 2.4)) cue('door', () => { FX.sparkle(Wn.door[0], Wn.door[1] - 60, 24); FX.ring(Wn.door[0], Wn.door[1] - 60, '#fff0b0', 130); SFX.ding(); SFX.sparkle(); r.banner = '🚪 ' + Wn.name + "'s door swings open!"; });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', [a, b] = mem(r), f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      const mk = openK(rt, a, b), openW = r.plain ? 2 : 2.4;
      for (const p of r.players) {
        const d = p.door, iconA = mk;
        if (iconA > 0) drawImg(p.icon, d[0], d[2], 56, { alpha: iconA });
        let k = mk, inside = (x, y) => charImg(p.av, 'observe', x, y + 6, 100);
        if (f && f.p === p && te < 0) { const s = Math.sin(rt * 30) * 2; ctx.save(); ctx.translate(s, 0); doorway(d, .08, null); ctx.restore(); }
        if (p === D && !r.plain && te > .6 && !done) { k = clamp((te - .6) / .3); inside = (x, y) => { drawImg('p17', x, y - 45 + Math.sin(rt * 4) * 5, 70); drawImg(r.fakeIcon, x + 22, y - 70, 34); }; }
        if (p === Wn && te > openW) { k = clamp((te - openW) / .3); inside = null; }
        doorway(d, k, inside);
        tagC(p.name, d[0], d[1] + 24, (f && f.p === p && te < 0) || (p === Wn && te > 1.6));
      }
      // footprints
      if (f && te < 0) trail(f.p.door, clamp((rt - f.at) / (f.dur * .7)), 1 - clamp((rt - f.at - f.dur * .7) / (f.dur * .3)));
      if (!r.plain && D) {
        if (te > -.4 && te < 1.7) trail(D.door, clamp((te + .4) / .4), 1 - clamp((te - 1.3) / .4));
        if (te > 1.5) trail(Wn.door, clamp((te - 1.5) / .8));
      } else if (r.plain) {
        if (D && te > -.4 && te < 1.2) trail(D.door, clamp((te + .4) / .4), 1 - clamp((te - .8) / .4));
        if (te > 1) trail(Wn.door, clamp((te - 1) / .8));
      }
      // skeleton janitor patrols along the hotel corridor
      const spin = !r.plain && te > 1.2 && te < 2.2;
      const jx = spin || done ? SIGN[0] + 120 : SIGN[0] + 180 + Math.sin(rt * 1.4) * 120, jy = SIGN[1] + 150 - Math.abs(Math.sin(rt * 5.6)) * 10;
      if (spin) drawImg('p27', SIGN[0], SIGN[1] - 70, 120, { rot: rt * 8, alpha: .9 });
      drawImg(done ? 'p4' : spin ? 'p2' : 'p0', jx, jy, 170, { anchor: 'bottom', flip: !spin && !done && Math.cos(rt * 1.4) < 0 });
      // winner walks out to the pedestal
      if (te > openW + .3 && !done) {
        const k = ease(clamp((te - openW - .3) / (3.2 - openW - .3))), d = Wn.door, x = lerp(d[0], PED[0], k), y = lerp(d[1], PED[1], k);
        drawImg('p26', d[0], d[1] + 10, 140, { anchor: 'bottom', alpha: .7 * (1 - k) });
        FX.every(r, 'walk', .1, () => FX.glitter(x, y - 10, 1, ['#7ff6ff']));
        charImg(Wn.av, 'follow', x, y, lerp(100, 200, k)); Wn.x = x; Wn.y = y - 60;
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        drawImg('p26', PED[0], PED[1] + 20, 260, { anchor: 'bottom', alpha: .75 });
        charImg(Wn.av, 'win', PED[0], PED[1] + 10, 240 * (.6 + .4 * ease(k)));
        tagC(Wn.name, PED[0], PED[1] + 40, true);
      }
    },

    idle(t) {
      DOORS.forEach((d, i) => { const k = clamp(Math.sin(t * .8 + i * .7) * 2 - 1); if (k > 0) { drawImg(ICONS[i], d[0], d[2], 56, { alpha: k }); doorway(d, k, (x, y) => charImg(i, 'observe', x, y + 6, 100)); } });
      drawImg('p0', SIGN[0] + 180 + Math.sin(t * 1.3) * 120, SIGN[1] + 150 - Math.abs(Math.sin(t * 5.2)) * 10, 170, { anchor: 'bottom', flip: Math.cos(t * 1.3) < 0 });
    },
    onFinish() { FX.smoke(PED[0], PED[1] - 20, 10, '#bfefff'); },
    winBanner: r => '🗝️ The secret room belongs to ' + r.winner.name + '!',
    winPos: () => ({ x: PED[0], y: PED[1] - 120 })
  };
})();
