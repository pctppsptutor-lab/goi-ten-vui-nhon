// Game 16 — Wake Up, Monsters! (listening & memory)
// Ten sleepy monsters each have a bell with its own sound and light. The bells play in turn; then one bell rings again
// and its monster is the one picked.
// Twist: the first monster jumps up — but it is sleepwalking after a fake bell; a pillow bumps the real bell and wakes the winner.
(() => {
  const XS = [330, 565, 800, 1035, 1270];
  const BEDS = [...XS.map(x => [x, 470]), ...XS.map(x => [x, 760])];
  const NOTES = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];                       // a pentatonic run, one note per bed
  const LIGHTS = ['#ff6f6f', '#ffb347', '#ffe066', '#7cff9b', '#7cf7ff', '#6fa8ff', '#b48cff', '#ff7ad9', '#ffffff', '#c6ff6f'];
  const bellAt = p => [p.bx + 70, p.by - 110];
  const ring = (i, d = 0) => { if (store.settings.sound) AUD.duckMusic(.4, .4); SFX.tone(mtof(NOTES[i] + 12), .45, { type: 'triangle', vol: .14, delay: d }); };

  GAME_IMPL.g16 = {
    id: 'g16', title: 'Wake Up, Monsters!', base: 'assets/g16/', titleY: 260,
    assets: gAssets(['sleep', 'hear', 'remember', 'false', 'pillow', 'win'], ['p0', 'p1', 'p3', 'p7', 'p16', 'p18', 'p20']),
    startBanner: '🔔 Listen to each monster\'s bell!', mote: '#d6d0ff', rayColor: '#fff0b0',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { p.slot = slots[i]; [p.bx, p.by] = BEDS[slots[i]]; p.x = p.bx; p.y = p.by - 60; });
      r.step = clamp((r.TW * .35) / r.players.length, .22, .45);                   // time between bells in the listening round
      r.listenEnd = .6 + r.step * r.players.length;
      r.fakes = makeFakes(r, r.listenEnd + .4);
    },
    // which bell is ringing at time t (and how fresh the ring is)
    ringing(r, t) {
      const te = t - r.TW;
      if (t > .6 && t < r.listenEnd) { const i = Math.floor((t - .6) / r.step); return { p: r.players[i], k: ((t - .6) % r.step) / r.step }; }
      const f = activeFake(r, t);
      if (f && te < 0) return { p: f.p, k: clamp((t - f.at) / f.dur) };
      if (te > 1.6 && te < 3.2) return { p: r.winner, k: ((te - 1.6) % .5) / .5 };
      return null;
    },

    tick(r, t, te) {
      const D = r.decoy, Wn = r.winner;
      r.players.forEach((p, i) => { if (t > .6 + i * r.step && t < r.listenEnd) cue('l' + i, () => ring(p.slot)); });
      if (t > .6) cue('lis', () => { r.banner = '👂 Listen to each monster\'s bell…'; });
      if (t > r.listenEnd) cue('mem', () => { r.banner = '🔔 Which bell is ringing now?'; });
      const f = activeFake(r, t);
      if (f && te < 0) cue('fk' + f.at, () => { ring(f.p.slot); r.banner = '🔔 Is that ' + f.p.name + "'s bell?"; });
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); SFX.boing(); r.banner = '😴 ' + D.name + ' jumps out of bed…'; });
        if (te > .6) cue('b', () => { outcome('wrong_turn', D); SFX.tone(300, .8, { type: 'sine', vol: .1, vib: 15, vibRate: 4 }); r.banner = '💤 …but it\'s sleepwalking after a FAKE bell!'; });
        if (te > 1.1) cue('c', () => { SFX.swoosh(); r.banner = '🛏️ A pillow flies across the room…'; });
        if (te > 1.6) cue('d', () => { outcome('selected', Wn); ring(Wn.slot); ring(Wn.slot, .25); CAM.shake(r, 7); FX.glitter(...bellAt(Wn), 16); r.banner = '🔔 BONG! It hits the real bell!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); ring((D || Wn).slot); r.banner = '🔔 ' + (D || Wn).name + "'s bell…?"; });
        if (te > 1.6) cue('d', () => { outcome('selected', Wn); ring(Wn.slot); ring(Wn.slot, .25); r.banner = '🔔 No — this bell! Wake up, ' + Wn.name + '!'; });
      }
      if (te > 2.4) cue('wake', () => { SFX.ding(); FX.sparkle(Wn.bx, Wn.by - 80, 20); });
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', D = r.decoy, Wn = r.winner, rg = !done && this.ringing(r, rt);
      if (done) drawImg('p20', 800, 120, 520, { alpha: .45 });
      const order = [...r.players].sort((a, b) => a.by - b.by);
      for (const p of order) {
        const [bx, by] = bellAt(p), on = rg && rg.p === p;
        if (on) { FX.halo(bx, by, 70, LIGHTS[p.slot], .7 * (1 - rg.k * .6)); drawImg('p18', bx, by, 90 * (1 + rg.k), { alpha: 1 - rg.k }); }
        drawImg('p3', bx, by, 46, { rot: on ? Math.sin(rt * 30) * .35 : 0 });
        ctx.save(); ctx.fillStyle = LIGHTS[p.slot]; ctx.beginPath(); ctx.arc(bx, by + 34, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        if (done && p === Wn) continue;
        let pose = 'sleep', x = p.bx, y = p.by;
        if (on && te < 0) pose = 'hear';
        if (rt > r.listenEnd && te < 0 && !on) pose = 'remember';
        if (p === D && !r.plain && te > 0) {                                   // sleepwalking off the bed
          const k = ease(clamp(te / 1.4)); x = lerp(p.bx, p.bx + (p.bx < 800 ? 140 : -140), k) + Math.sin(rt * 3) * 10; y = p.by + 30 * k; pose = 'false';
        }
        if (p === D && r.plain && te > 0 && te < 1.6) pose = 'hear';
        if (p === Wn && te > 1.6) pose = te > 2.4 ? 'pillow' : 'hear';
        charImg(p.av, pose, x, y, 140);
        if (pose === 'sleep' && Math.sin(rt * 2 + p.seed * 6) > 0) drawImg('p16', x + 52, y - 125 - (rt * 18 + p.seed * 40) % 26, 42, { alpha: .75 });
        tagC(p.name, p.bx, p.by + 24, on);
      }
      // the flying pillow
      if (!r.plain && te > 1.1 && te < 1.8 && !done) {
        const k = clamp((te - 1.1) / .5), [bx, by] = bellAt(Wn), sx = D.bx, sy = D.by - 60;
        drawImg('p7', lerp(sx, bx, k), lerp(sy, by, k) - Math.sin(k * Math.PI) * 160, 80, { rot: k * 9 });
        if (k >= 1) FX.every(r, 'feath', .2, () => FX.glitter(bx, by, 4, ['#ffffff']));
      }
      // the big sleepy mascot tiptoes along the foreground
      drawImg(done ? 'p0' : (rg ? 'p0' : 'p1'), 155 + Math.sin(rt * 1.4) * 75, 860 - Math.abs(Math.sin(rt * 4.8)) * 12, 190, { anchor: 'bottom', flip: Math.cos(rt * 1.4) < 0 });
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        charImg(Wn.av, 'win', Wn.bx, Wn.by + 10, 220 * (.6 + .4 * ease(k)));
        tagC(Wn.name, Wn.bx, Wn.by + 34, true);
      }
      Wn.x = Wn.bx; Wn.y = Wn.by - 80;
    },

    idle(t) {
      BEDS.forEach(([x, y], i) => {
        const on = Math.floor(t * 1.6) % 10 === i;
        if (on) FX.halo(x + 70, y - 110, 60, LIGHTS[i], .6);
        drawImg('p3', x + 70, y - 110, 46, { rot: on ? Math.sin(t * 30) * .3 : 0 });
        charImg(i, 'sleep', x, y, 140);
      });
      drawImg(Math.floor(t * 1.6) % 2 ? 'p0' : 'p1', 155 + Math.sin(t * 1.3) * 75, 860 - Math.abs(Math.sin(t * 4.5)) * 10, 190, { anchor: 'bottom', flip: Math.cos(t * 1.3) < 0 });
    },
    onFinish(r) { FX.sparkle(r.winner.bx, r.winner.by - 120, 36, LIGHTS); },
    winBanner: r => '⏰ ' + r.winner.name + ' is finally awake!',
    winPos: r => ({ x: r.winner.bx, y: r.winner.by - 110 })
  };
})();
