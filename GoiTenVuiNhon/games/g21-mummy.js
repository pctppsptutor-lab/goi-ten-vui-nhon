// Game 21 — Toilet Paper Mummy (stage-by-stage transformation)
// Ten students are wrapped up as paper mummies. A fan blows in three levels; each level unrolls more paper,
// slowly revealing the colours and accessories of the one who is picked.
// Twist: the first mummy to unwrap is just a costume broom; the toilet-roll mascot rolls across the stage, tugs the last strip and finishes the real winner's reveal.
(() => {
  const XS = [210, 440, 670, 900, 1130];
  const SPOTS = [...XS.map(x => [x, 500]), ...XS.map(x => [x, 790])];
  const FAN = [1440, 470];

  function fan(x, y, power, t) {                                          // a simple desk fan, drawn in code
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#7f8c99'; ctx.fillRect(-8, 0, 16, 120); ctx.beginPath(); ctx.ellipse(0, 122, 60, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9d2dc'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.rotate(t * (2 + power * 14));
    for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.fillStyle = '#7cd0ff'; ctx.beginPath(); ctx.ellipse(36, 0, 36, 16, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#3d566e'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  GAME_IMPL.g21 = {
    id: 'g21', title: 'Toilet Paper Mummy', base: 'assets/g21/', titleY: 260,
    assets: gAssets(['wrapped', 'fan1', 'fan2', 'near', 'false', 'pull', 'win'], ['p0', 'p7', 'p23', 'p37', 'p38', 'p43']),
    startBanner: '🧻 Ten mystery mummies…', mote: '#f6f2ff', rayColor: '#fff2a8',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { [p.sx, p.sy] = SPOTS[slots[i]]; p.x = p.sx; p.y = p.sy - 90; });
      r.lv = [r.TW * .25, r.TW * .5, r.TW * .75];                            // when fan levels 1, 2 and 3 start
      r.fakes = makeFakes(r, r.lv[1] + .3);
    },
    level: (r, t) => t < r.lv[0] ? 0 : t < r.lv[1] ? 1 : t < r.lv[2] ? 2 : 3,

    tick(r, t, te) {
      const f = activeFake(r, t), D = r.decoy, Wn = r.winner, L = this.level(r, t);
      if (L > 0) cue('lv' + L, () => { SFX.swoosh(); r.banner = ['', '🌬️ Fan level 1 — the paper flutters…', '🌬️ Fan level 2 — loose ends fly!', '🌪️ Fan level 3 — FULL POWER!'][L]; });

      if (f && te < 0) cue('fk' + f.at, () => { SFX.leader(); r.banner = '🧻 ' + f.p.name + "'s wrapping starts to slip…"; });
      if (!r.plain) {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🧻 ' + D.name + ' unravels…'; });
        if (te > .6) cue('b', () => { outcome('wrong_turn', D); SFX.sadTrombone(); r.banner = '🧹 It\'s just a costume broom!'; });
        if (te > 1.1) cue('c', () => { SFX.wheee(); r.banner = '🧻 The toilet roll mascot rolls across the stage…'; });
        if (te > 1.8) cue('d', () => { outcome('selected', Wn); SFX.pop(); CAM.shake(r, 7); r.banner = '✂️ …and pulls the last strip from ' + Wn.name + '!'; });
      } else {
        if (te > 0) cue('a', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🧻 ' + (D || Wn).name + ' is nearly unwrapped…'; });
        if (te > 1.3) cue('d', () => { outcome('selected', Wn); SFX.pop(); r.banner = '🎉 The reveal is… ' + Wn.name + '!'; });
      }
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner, L = this.level(r, rt);
      fan(FAN[0], FAN[1], te < 0 ? L / 3 : 1, rt);
      if (L > 0 && !done) drawImg(L > 2 ? 'p38' : 'p37', FAN[0] - 170, FAN[1] + 10, 120 + L * 30, { alpha: .6, flip: true });
      for (const p of r.players) {
        if (done && p === Wn) continue;
        let pose = ['wrapped', 'fan1', 'fan2', 'fan2'][L], sway = Math.sin(rt * (2 + L * 3) + p.seed * 9) * .02 * L;
        if (f && f.p === p && te < 0) pose = 'near';
        if (p === D && te > 0) pose = !r.plain && te > .6 ? 'false' : 'near';
        if (p === Wn && te > (r.plain ? 1.3 : 1.8)) pose = 'pull';
        charImg(p.av, pose, p.sx, p.sy, 160, { rot: sway });
        if (L > 0 && te < 0) FX.every(r, 'str' + p.sx + p.sy, .6 / L, () => FX.glitter(p.sx + 20, p.sy - 100, 1, ['#ffffff']));
        tagC(p.name, p.sx, p.sy + 22, (f && f.p === p && te < 0) || (p === Wn && te > 1.8));
      }
      // the rolling mascot and its paper trail
      if (!r.plain && te > 1.1 && !done) {
        const k = ease(clamp((te - 1.1) / .8)), x = lerp(-80, Wn.sx + 60, k), y = Wn.sy - 20;
        if (k > 0) { ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 14; ctx.globalAlpha = .9; ctx.beginPath(); ctx.moveTo(-80, y + 10); ctx.quadraticCurveTo((x - 80) / 2, y + 40, x, y + 10); ctx.stroke(); ctx.restore(); }
        drawImg(te > 1.8 ? 'p7' : 'p0', x, y, 90, { rot: te < 1.8 ? te * 10 : 0 });
        Wn.x = x; Wn.y = y - 60;
      } else {
        drawImg(done ? 'p7' : 'p0', 800 + Math.sin(rt * 1.2) * 540, 645 - Math.abs(Math.sin(rt * 6)) * 14, 86, { rot: done ? 0 : rt * 5 });
        Wn.x = Wn.sx; Wn.y = Wn.sy - 90;
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        drawImg('p43', Wn.sx, Wn.sy - 110, 220, { alpha: .8 });
        charImg(Wn.av, 'win', Wn.sx, Wn.sy, 230 * (.6 + .4 * ease(k)));
        tagC(Wn.name, Wn.sx, Wn.sy + 24, true);
      }
    },

    idle(t) {
      fan(FAN[0], FAN[1], .3, t);
      SPOTS.forEach(([x, y], i) => charImg(i, 'wrapped', x, y, 160, { rot: Math.sin(t * 2 + i) * .02 }));
      drawImg('p0', 800 + Math.sin(t * .7) * 600, 640, 80, { rot: t * 4 });
    },
    onFinish(r) { FX.sparkle(r.winner.sx, r.winner.sy - 150, 40, ['#ffd84a', '#ff9fc4', '#7cf7ff']); },
    winBanner: r => '🎭 Ta-da! It\'s ' + r.winner.name + '!',
    winPos: r => ({ x: r.winner.sx, y: r.winner.sy - 130 })
  };
})();
