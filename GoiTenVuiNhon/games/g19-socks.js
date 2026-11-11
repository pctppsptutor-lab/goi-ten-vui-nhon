// Game 19 — The Sock Monster (matching & memory)
// Everyone shows their pair of socks, drops one in the washing machine, and the machine mixes them up and spits them out.
// The student whose missing sock flies back to them is picked.
// Twist: the first sock back is the same colour but the wrong pattern; the lost sock bursts out of the machine's sleeve and matches the real winner.
(() => {
  const XS = [190, 420, 650, 880, 1110];
  const SPOTS = [...XS.map(x => [x, 470]), ...XS.map(x => [x, 790])];
  const MACH = [1400, 520];
  const SOCKS = ['p8', 'p10', 'p12', 'p14', 'p20', 'p9', 'p11', 'p13', 'p21', 'p19'];
  const mouth = [MACH[0] - 50, MACH[1] - 40];

  // a sock flying from the machine to a student
  const arc = (a, b, k, lift) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * lift];

  GAME_IMPL.g19 = {
    id: 'g19', title: 'The Sock Monster', base: 'assets/g19/', titleY: 250,
    assets: gAssets(['observe', 'load', 'mixing', 'search', 'mismatch', 'lost', 'win'], [...SOCKS, 'p1', 'p2', 'p3', 'p4', 'p5', 'p51', 'p28']),
    startBanner: '🧦 Remember your socks!', mote: '#dff6ff', rayColor: '#e6f6ff',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { [p.sx, p.sy] = SPOTS[slots[i]]; p.sock = SOCKS[slots[i]]; p.x = p.sx; p.y = p.sy - 80; });
      r.show = clamp(r.TW * .25, 1.4, 3);                       // how long everyone shows their pair
      r.fakes = makeFakes(r, r.show + 1.6);
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      if (t > .4) cue('show', () => { r.banner = '👀 Look at everyone\'s socks…'; });
      if (t > r.show) cue('load', () => { SFX.swoosh(); r.banner = '🌀 One sock each goes into the washer!'; });
      if (t > r.show + 1) cue('mix', () => { r.banner = '🫧 Spin, spin, spin…'; });

      if (f && te < 0) cue('fk' + f.at, () => { SFX.pop(); r.banner = '🧦 A sock flies towards ' + f.p.name + '…'; });
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); SFX.pop(); r.banner = '🧦 A sock lands with ' + D.name + '!'; });
        if (te > .7) cue('b', () => { outcome('wrong_turn', D); SFX.sadTrombone(); r.banner = '❌ Same colour… wrong pattern!'; });
        if (te > 1.2) cue('c', () => { CAM.shake(r, 10); SFX.boing(); r.banner = '🫨 The washer hiccups…'; });
        if (te > 1.5) cue('d', () => { outcome('selected', Wn); SFX.wheee(); r.banner = '🧦 The lost sock shoots out of the sleeve!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); SFX.pop(); r.banner = '🧦 Is it ' + (D || Wn).name + "'s sock?"; });
        if (te > 1.2) cue('b', () => { outcome('selected', Wn); SFX.boing(); r.banner = '🧦 …no, it bounces on to its real owner!'; });
      }
      if (te > 2.8) cue('match', () => { SFX.ding(); FX.sparkle(Wn.sx, Wn.sy - 120, 20); r.banner = '✨ A perfect match!'; });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      const spinning = rt > r.show + .6 && te < 0;
      // washing machine chugs, hops and roams across the laundry floor
      let mp = 'p1';
      if (spinning) mp = Math.floor(rt * 5) % 2 ? 'p3' : 'p4';
      if (!r.plain && te > 1.2 && te < 1.6) mp = 'p2';
      if (done) mp = 'p5';
      const mx = MACH[0] - 35 + Math.sin(rt * (spinning ? 3.2 : 1.5)) * (spinning ? 55 : 25);
      const my = MACH[1] - Math.abs(Math.sin(rt * (spinning ? 12 : 5))) * (spinning ? 24 : 10);
      const mMouth = [mx - 50, my - 40];
      drawImg(mp, mx, my, 300, { rot: spinning ? Math.sin(rt * 22) * .085 : Math.sin(rt * 4) * .025 });
      if (spinning) { drawImg('p51', mMouth[0] + 10, mMouth[1] + 10, 125, { alpha: .7, rot: rt * 10 }); FX.every(r, 'bub', .12, () => FX.bubbles(mMouth[0], mMouth[1], 2, '#cfefff')); }
      for (const p of r.players) {
        if (done && p === Wn) continue;
        let pose = rt < r.show ? 'observe' : rt < r.show + 1 ? 'load' : 'mixing';
        if (f && f.p === p && te < 0) pose = 'search';
        if (p === D && te > 0) pose = !r.plain && te > .7 ? 'mismatch' : 'search';
        if (p === Wn && te > (r.plain ? 1.2 : 1.5)) pose = 'lost';
        charImg(p.av, pose, p.sx, p.sy, 150);
        // sock flies into the washer during the load phase; small badge on mat otherwise
        if (rt >= r.show && rt < r.show + .85) {
          const lk = ease(clamp((rt - r.show) / .8)), [sx, sy] = arc([p.sx + 20, p.sy - 80], mMouth, lk, 110);
          drawImg(p.sock, sx, sy, 38, { rot: lk * 10, alpha: 1 - lk * .3 });
        } else {
          drawImg(p.sock, p.sx + 48, p.sy - 14, 26, { rot: .15 });
        }
        tagC(p.name, p.sx, p.sy + 22, (f && f.p === p && te < 0) || (p === Wn && te > 1.5));
      }
      // practice socks flying out and bouncing back into the machine
      if (f && te < 0) {
        const k = clamp((rt - f.at) / f.dur), [x, y] = arc(mMouth, [f.p.sx + 44, f.p.sy - 110], k < .6 ? k / .6 : 1 - (k - .6) / .4, 140);
        drawImg(f.p.sock, x, y, 44, { rot: rt * 8 });
      }
      // the decoy's wrong sock and the winner's lost sock
      if (te > 0 && !done) {
        const tgt = D || Wn;
        if (te < (r.plain ? 1.2 : 1.6)) { const [x, y] = arc(mMouth, [tgt.sx + 56, tgt.sy - 64], clamp(te / .6), 160); drawImg(r.plain ? Wn.sock : SOCKS[(SOCKS.indexOf(tgt.sock) + 5) % 10], x, y, 44, { rot: te < .6 ? te * 12 : .35 }); }
        if (!r.plain && te > .7 && te < 1.6) drawImg('p28', tgt.sx, tgt.sy - 200, 60);
        if (te > (r.plain ? 1.2 : 1.5)) {
          const from = r.plain ? [tgt.sx + 56, tgt.sy - 64] : [mx + 90, my - 60];
          const k = ease(clamp((te - (r.plain ? 1.2 : 1.5)) / 1.1)), [x, y] = arc(from, [Wn.sx + 56, Wn.sy - 64], k, 220);
          drawImg(Wn.sock, x, y, 50, { rot: (1 - k) * 14 }); FX.every(r, 'st', .05, () => FX.glitter(x, y, 1));
          Wn.x = x; Wn.y = y;
        }
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', Wn.sx, Wn.sy, 220 * (.6 + .4 * ease(k)));
        drawImg(Wn.sock, Wn.sx + 74, Wn.sy - 90, 52, { rot: .2 });
        tagC(Wn.name, Wn.sx, Wn.sy + 24, true);
      }
    },

    idle(t) {
      const mx = MACH[0] - 35 + Math.sin(t * 2.4) * 45, my = MACH[1] - Math.abs(Math.sin(t * 9)) * 18, mMouth = [mx - 50, my - 40];
      drawImg(Math.floor(t * 4) % 2 ? 'p3' : 'p4', mx, my, 300, { rot: Math.sin(t * 18) * .07 });
      drawImg('p51', mMouth[0] + 10, mMouth[1] + 10, 115, { alpha: .55, rot: t * 8 });
      SPOTS.forEach(([x, y], i) => { charImg(i, 'observe', x, y, 150); drawImg(SOCKS[i], x + 48, y - 14, 26, { rot: .15 }); });
      for (let i = 0; i < 3; i++) { const k = (t * .5 + i / 3) % 1; drawImg(SOCKS[(Math.floor(t * .5) + i) % 10], ...arc(mMouth, [300 + i * 350, 200], k, 120), 40, { rot: t * 6 + i, alpha: 1 - k }); }
    },
    onFinish(r) { FX.bubbles(r.winner.sx, r.winner.sy - 100, 24, '#cfefff'); },
    winBanner: r => '🧦 ' + r.winner.name + "'s sock found its partner!",
    winPos: r => ({ x: r.winner.sx, y: r.winner.sy - 120 })
  };
})();
