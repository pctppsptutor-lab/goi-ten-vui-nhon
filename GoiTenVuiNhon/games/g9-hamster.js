// Game 09 — Hamster Wheels
// Ten hamsters run in see-through wheels; the spinning makes power that fills their jar and rings the finish bell.
// Twist: the first wheel spins far too fast and slips backwards; a sunflower seed rolls over a switch and lights the real winner's wheel.
(() => {
  const XS = [...Array(10).keys()].map(i => 162 + i * 132);
  const WHEEL_Y = 690, JAR_Y = 830, BELL = [800, 205], SWITCH = [1500, 560];
  const BULBS = ['p12', 'p13', 'p21'];

  // power level of a player at time t (0..1)
  function power(r, p, t) {
    const te = t - r.TW, base = clamp((t - 1) / (r.TW - 1)) * p.cap;
    let v = base + .08 * Math.sin(t * (1.5 + p.seed * 2) + p.seed * 9);
    const f = (r.fakes || []).find(f => f.p === p && t >= f.at && t < f.at + f.dur * 1.3);
    if (f && te < 0) v += .3 * Math.sin(clamp((t - f.at) / (f.dur * 1.3)) * Math.PI);
    if (te > 0) {
      const D = r.decoy, Wn = r.winner;
      if (p === D && !r.plain) v = te < .8 ? lerp(p.cap, .98, te / .8) : lerp(.98, .25, clamp((te - .8) / .8));
      else if (p === D && r.plain) v = te < 1 ? lerp(p.cap, .9, te) : lerp(.9, .6, clamp(te - 1));
      else if (p === Wn) v = lerp(p.cap, 1, clamp((te - (r.plain ? 1 : 1.8)) / 1.2));
      else v = p.cap;
    }
    return clamp(v);
  }

  function jar(x, k, t, glow) {
    ctx.save();
    ctx.fillStyle = '#ffffff33'; ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 3;
    roundRect(ctx, x - 30, JAR_Y - 70, 60, 70, 12); ctx.fill(); ctx.stroke();
    const h = 62 * k, gr = ctx.createLinearGradient(0, JAR_Y - 4 - h, 0, JAR_Y - 4);
    gr.addColorStop(0, glow ? '#fff3a0' : '#9ff3ff'); gr.addColorStop(1, glow ? '#ffb300' : '#2fb6e8');
    ctx.fillStyle = gr; roundRect(ctx, x - 26, JAR_Y - 4 - h, 52, h, 9); ctx.fill();
    if (k > .05) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffffff55'; ctx.fillRect(x - 20, JAR_Y - 4 - h + 4 + Math.sin(t * 8 + x) * 2, 8, Math.max(0, h - 10)); }
    ctx.restore();
    ctx.save(); ctx.fillStyle = '#b07a3a'; roundRect(ctx, x - 34, JAR_Y - 78, 68, 12, 5); ctx.fill(); ctx.restore();
  }

  GAME_IMPL.g9 = {
    id: 'g9', title: 'Hamster Wheels', base: 'assets/g9/', titleY: 470, animals: true,
    assets: gAssets(['idle', 'ready', 'run', 'near', 'false', 'reverse', 'win'], ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p11', 'p12', 'p13', 'p21', 'p20', 'p22', 'p30']),
    startBanner: '🐹 Ready… set… RUN!', mote: '#fff3c0', rayColor: '#fff2a8',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { p.x = XS[slots[i]]; p.y = WHEEL_Y - 70; p.cap = .45 + Math.random() * .3; });
      r.winner.cap = .7; if (r.decoy) r.decoy.cap = .78;
      r.fakes = makeFakes(r, 1.5);
    },

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner;
      if (f && te < 0) cue('fk' + f.at, () => { r.banner = '⚡ ' + f.p.name + "'s jar is charging fast!"; SFX.leader(); });

      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🌀 ' + D.name + "'s wheel is spinning WAY too fast!"; });
        if (te > .8) cue('b', () => { outcome('wrong_turn', D); CAM.shake(r, 10); SFX.swoosh(); SFX.sadTrombone(); r.banner = '😵 Whoa! It slips backwards!'; });
        if (te > 1.2) cue('c', () => { SFX.tone(300, .4, { type: 'triangle', vol: .12, to: 120 }); r.banner = '🌻 A sunflower seed rolls onto the switch…'; });
        if (te > 1.8) cue('d', () => { outcome('selected', Wn); FX.bolts(...SWITCH, 5, 90, '#ffe066'); SFX.sparkle(); r.banner = '💡 Click! ' + Wn.name + "'s wheel lights up!"; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '⚡ ' + (D || Wn).name + ' is almost at the bell…'; });
        if (te > 1) cue('b', () => { outcome('selected', Wn); SFX.boing(); r.banner = '🐹 …but another hamster puts on a burst of speed!'; });
      }
      if (te > 2.8) cue('ring', () => { [0, .18, .36].forEach(d => SFX.tone(1568, .6, { vol: .12, delay: d })); FX.ring(...BELL, '#ffd84a', 160); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      // wires from every jar to the bell
      ctx.save(); ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 3;
      for (const p of r.players) { ctx.beginPath(); ctx.moveTo(p.x, JAR_Y - 70); ctx.quadraticCurveTo(p.x, 420, BELL[0], BELL[1] + 40); ctx.stroke(); }
      ctx.restore();
      const ring = te > 2.8 || done;
      drawImg('p11', BELL[0], BELL[1] + (ring ? 0 : 0), 110, { rot: ring ? Math.sin(rt * 30) * .25 : 0 });
      if (ring) FX.halo(...BELL, 120, '#ffd84a', .6);
      // switch and seed for the twist
      drawImg('p20', ...SWITCH, 70, { anchor: 'bottom' });
      if (!r.plain && te > 1.1 && te < 2.4 && !done) {
        const k = ease(clamp((te - 1.1) / .7)), x = lerp(1150, SWITCH[0], k);
        drawImg('p22', x, SWITCH[1] - 10, 40, { rot: k * 12 });
      }
      for (const p of r.players) {
        const v = power(r, p, rt), lead = f && f.p === p && te < 0, isW = p === Wn && te > (r.plain ? 1 : 1.8);
        jar(p.x, v, rt, isW || (done && p === Wn));
        tagC(p.name, p.x, JAR_Y + 26, lead || isW);
        if (done && p === Wn) continue;
        let pose = rt < .8 ? 'ready' : 'run', rot = 0;
        if (lead) pose = 'near';
        if (p === D && !r.plain && te > 0) { pose = te < .8 ? 'run' : 'reverse'; }
        if (isW) { pose = 'false'; FX.halo(p.x, WHEEL_Y - 70, 90, '#ffe066', .45); }
        const bob = pose === 'run' ? Math.abs(Math.sin(rt * (12 + v * 20) + p.seed * 9)) * 4 : 0;
        if (p === D && !r.plain && te > 0 && te < .8) { rot = Math.sin(rt * 50) * .05; FX.every(r, 'sp', .05, () => FX.metal(p.x, WHEEL_Y - 20, 2)); }
        charImg(p.av, pose, p.x, WHEEL_Y - bob, 116, { rot });
        if (isW) FX.every(r, 'z' + p.av, .2, () => FX.bolts(p.x, WHEEL_Y - 70, 2, 70, '#ffe066'));
      }
      // referee mouse scurries along the sideline checking the jars
      let mp = Math.floor(rt * 3) % 2 ? 'p0' : 'p1', mx = 1485 + Math.sin(rt * 2.2) * 35, my = 430 + Math.cos(rt * 1.6) * 85 - Math.abs(Math.sin(rt * 7)) * 14;
      if (rt < 1.2) mp = 'p1';
      else if (!r.plain && te > .8 && te < 1.2) mp = 'p3';
      else if (!r.plain && te > 1.2 && te < 1.8) { mp = 'p5'; mx = SWITCH[0] - 20; my = SWITCH[1] - 10; }
      else if (te > 1.8) mp = 'p2';
      if (done) mp = 'p4';
      drawImg(mp, mx, my, 120, { anchor: 'bottom', flip: mp === 'p5' || Math.sin(rt * 1.6) > 0 });
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        drawImg('p30', 800, 520, 300, { alpha: .8 });
        charImg(Wn.av, 'win', 800, 560, 230 * (.6 + .4 * ease(k)));
        tagC(Wn.name, 800, 584, true);
      }
    },

    idle(t) {
      drawImg('p11', ...BELL, 110);
      drawImg('p20', ...SWITCH, 70, { anchor: 'bottom' });
      XS.forEach((x, i) => { jar(x, .3 + .25 * Math.sin(t * .8 + i), t, false); charImg(i, 'run', x, WHEEL_Y - Math.abs(Math.sin(t * 12 + i)) * 4, 116); });
      drawImg(Math.floor(t * 2.5) % 2 ? 'p0' : 'p1', 1485 + Math.sin(t * 2) * 35, 430 + Math.cos(t * 1.5) * 80 - Math.abs(Math.sin(t * 6.5)) * 12, 120, { anchor: 'bottom' });
    },
    onFinish() { FX.bolts(800, 470, 8, 160, '#ffe066'); },
    winBanner: r => '🔔 ' + r.winner.name + ' rings the bell!',
    winPos: () => ({ x: 800, y: 450 })
  };
})();
