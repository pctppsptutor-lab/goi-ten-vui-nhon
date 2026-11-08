// Game 05 — Nhà máy robot lỗi nhẹ
// Student robots ride the conveyor under a scanner; the scanner stamps the chosen one.
// Twist: the stamp lands on the wrong robot and throws an error; the belt reverses and carries the last robot to the charging platform.
(() => {
  const X0 = 240, STEP = 130.6, BELT_Y = 650, KID_H = 150, SCAN_X = 763;
  const PAD = [1457, 432];
  const pose = (av, p) => p;   // every pose is usable since the source sprites were repaired

  GAME_IMPL.g5 = {
    id: 'g5', title: 'Faulty Robot Factory', base: 'assets/g5/', titleY: 470,
    assets: gAssets(['idle', 'action', 'almost', 'fake', 'twist', 'win'], ['p0', 'p1', 'p2', 'p3', 'p23', 'p28', 'p30', 'p31']),
    startBanner: '🤖 The conveyor belt starts up!', mote: '#9ff3ff', rayColor: '#a8fff0',

    setup(r) {
      const m = Math.max(3, Math.round((r.TW - .8) * 1.1));      // slots travelled before the reveal
      r.m = m;
      // slot k ends at index (k - m) mod 10: index 4 sits under the scanner, index 9 is the end of the line
      const at = idx => ((idx + m) % 10 + 10) % 10;
      const scanned = r.plain ? r.winner : r.decoy, last = r.plain ? r.decoy : r.winner;
      const free = shuffle([...Array(10).keys()].filter(k => k !== at(4) && k !== at(9)));
      r.players.forEach(p => { p.slot = p === scanned ? at(4) : p === last ? at(9) : free.pop(); });
      r.belt = t => m * ease(clamp((t - .8) / (r.TW - .8)));      // slots travelled so far
    },
    // continuous belt index of a player at time t (0 = left end, 9 = right end)
    idx(r, p, t) {
      const te = t - r.TW, back = te > 1.3 && !r.plain ? clamp((te - 1.3) / 1.2) * .9 : 0;
      return ((p.slot - r.belt(t)) % 10 + 10) % 10 + back;
    },

    tick(r, t, te) {
      if (te < 0) {
        const near = r.players.find(p => Math.abs(X0 + this.idx(r, p, t) * STEP - SCAN_X) < 40);
        if (near && near !== r.scanning && t > 1) { r.scanning = near; r.banner = '🔍 Scanning: ' + near.name; SFX.tone(1200, .15, { type: 'square', vol: .04, to: 1600 }); }
        if (Math.random() < .03) SFX.tone(90, .08, { type: 'square', vol: .04 });    // belt clank
      }
      const D = r.decoy, Wn = r.winner, S = r.plain ? Wn : D;
      if (te > 0) cue('a', () => { Music.play('tension'); r.banner = '🔍 The scanner stops at ' + S.name + '…'; });
      if (te > .4) cue('b', () => { CAM.shake(r, 8); FX.metal(X0 + 4 * STEP, BELT_Y - KID_H - 10, 22); FX.ring(X0 + 4 * STEP, BELT_Y - KID_H * .55, '#ffd84a', 120); SFX.heartbeat(); outcome(r.plain ? 'selected' : 'almost_selected', S); r.banner = '✅ Stamped: ' + S.name + '!'; });
      if (!r.plain) {
        if (te > .9) cue('c', () => { outcome('wrong_turn', D); [0, .25, .5, .75].forEach(d => SFX.tone(d % .5 ? 660 : 880, .22, { type: 'square', vol: .07, delay: d })); SFX.noise(.4, { vol: .2, f: 3000 }); r.banner = '🚨 ERROR! Wrong robot stamped!'; });
        if (te > 1.3) cue('d', () => { FX.metal(X0, BELT_Y + 10, 14); FX.metal(X0 + 9 * STEP, BELT_Y + 10, 14); SFX.swoosh(); r.banner = '⏪ The belt runs backwards!'; CAM.shake(r, 6); });
        if (te > 1.6) cue('e', () => { outcome('selected', Wn); SFX.wheee(); r.banner = '🔋 The last robot rolls onto the charger!'; });
      } else if (te > 1.1) cue('e', () => { SFX.wheee(); r.banner = '🔋 ' + Wn.name + ' heads for the charger!'; });
    },

    // the winner's trip from the end of the belt up the ramp to the charging pad
    toPad(r, te) {
      const from = r.plain ? 1.1 : 1.6, k = ease(clamp((te - from) / 1.2));
      const sx = X0 + this.idx(r, r.winner, r.TW + from) * STEP, sy = BELT_Y;
      const cx = 1560, cy = 600;
      return [(1 - k) * (1 - k) * sx + 2 * (1 - k) * k * cx + k * k * PAD[0], (1 - k) * (1 - k) * sy + 2 * (1 - k) * k * cy + k * k * PAD[1], k];
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', D = r.decoy, Wn = r.winner, S = r.plain ? Wn : D;
      // charging pad + scanner
      drawImg('p31', PAD[0], PAD[1] + 10, 190, { anchor: 'bottom', alpha: .6 + .4 * Math.sin(rt * 4) });
      const err = !r.plain && te > .9 && !done;
      if (te < .9 && !done) FX.beam(SCAN_X, BELT_Y - 330, BELT_Y + 4, 70, rt, err ? '#ff5d5d' : '#5dff9a');
      drawImg(err ? 'p0' : te > 0 && !done ? 'p2' : done ? 'p3' : 'p1', SCAN_X + 150, BELT_Y - 150, 170, { anchor: 'bottom', flip: true });
      if (err) { const on = Math.sin(rt * 14) > 0; drawImg('p23', SCAN_X + 150, BELT_Y - 330, 80, { anchor: 'bottom', alpha: on ? 1 : .35 }); }
      // robots on the belt
      const order = [...r.players].sort((a, b) => this.idx(r, a, rt) - this.idx(r, b, rt));
      for (const p of order) {
        let x = X0 + this.idx(r, p, rt) * STEP, y = BELT_Y, ps = 'action', rot = 0, alpha = 1, h = KID_H;
        if (x < 200) alpha = clamp((x - 150) / 50);                                  // into the tunnel
        if (Math.abs(x - SCAN_X) < 50 && te < .9) ps = 'almost';
        if (te > 0) ps = 'idle';
        if (p === S && te > .4) ps = r.plain ? 'fake' : te < .9 ? 'fake' : 'twist';
        if (!r.plain && te > 1.3 && p !== Wn) { ps = 'twist'; rot = Math.sin(rt * 12 + p.seed * 9) * .08; }
        if (p === Wn && te > (r.plain ? 1.1 : 1.6)) { const [px, py, k] = this.toPad(r, te); if (k > .6) FX.every(r, 'charge', .12, () => FX.bolts(PAD[0], PAD[1] - 60, 2, 90)); x = px; y = py; h = KID_H * (1 + k * .25); ps = 'idle'; }
        if (done && p === Wn) continue;
        const bob = te < 0 ? Math.abs(Math.sin(rt * 6 + p.seed * 5)) * 4 : 0;
        charImg(p.av, pose(p.av, ps), x, y - bob, h, { rot, alpha });
        p.x = x; p.y = y - 40;
        if (alpha > .5) tagC(p.name, x, y + 26, p === r.scanning && te < 0);
      }
      // the stamp
      if (te > 0 && !done && te < 2) {
        const sx = X0 + 4 * STEP, k = ease(clamp(te / .4)), lift = te > .5 ? ease(clamp((te - .5) / .3)) * 200 : 0;
        const y = lerp(260, BELT_Y - KID_H - 30, k) - lift;
        ctx.save(); ctx.fillStyle = '#7a4b2a'; ctx.fillRect(sx - 10, y - 90, 20, 70); ctx.fillStyle = '#c0392b';
        roundRect(ctx, sx - 42, y - 24, 84, 30, 8); ctx.fill(); ctx.restore();
        if (te > .4) {   // the mark on the robot: ✓ then ✗
          const bad = !r.plain && te > .9;
          ctx.save(); ctx.globalAlpha = clamp((te - .4) * 5); ctx.fillStyle = bad ? '#e63946' : '#2ecc71'; ctx.beginPath(); ctx.arc(sx, BELT_Y - KID_H * .55, 26, 0, 7); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '900 34px "Baloo 2","Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(bad ? '✗' : '✓', sx, BELT_Y - KID_H * .55 + 2); ctx.restore();
        }
      }
      if (err && te < 2) FX.every(r, 'zap', .16, () => { FX.bolts(SCAN_X + 150, BELT_Y - 230, 3, 120, '#ffe066'); FX.smoke(SCAN_X + 170, BELT_Y - 260, 2, '#9aa5b1'); });
      if (!r.plain && te > .9 && te < 2 && !done) {
        drawImg('p28', SCAN_X + 60, BELT_Y - 200, 120 * (.8 + .2 * Math.sin(rt * 20)), { alpha: .9 });
        drawImg('p30', SCAN_X + 180, BELT_Y - 260 - (te - .9) * 60, 200, { alpha: 1 - clamp((te - 1.4) / .6) });
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', PAD[0], PAD[1] + 30, 230 * (.6 + .4 * ease(k)));
        tagC(Wn.name, PAD[0], PAD[1] + 56, true);
      }
    },

    idle(t) {
      drawImg('p31', PAD[0], PAD[1] + 10, 190, { anchor: 'bottom', alpha: .7 });
      drawImg('p1', SCAN_X + 150, BELT_Y - 150, 170, { anchor: 'bottom', flip: true });
      for (let k = 0; k < 10; k++) {
        const x = X0 + (((k - t * .6) % 10 + 10) % 10) * STEP;
        charImg(k, 'idle', x, BELT_Y - Math.abs(Math.sin(t * 6 + k)) * 4, KID_H, { alpha: x < 200 ? clamp((x - 150) / 50) : 1 });
      }
    },
    onFinish() { FX.bolts(PAD[0], PAD[1] - 80, 8, 150); FX.ring(PAD[0], PAD[1], '#7cf7ff', 220); FX.metal(PAD[0], PAD[1] - 40, 30); },
    winBanner: r => '🔋 ' + r.winner.name + ' is fully charged!',
    winPos: () => ({ x: PAD[0], y: PAD[1] - 120 })
  };
})();
