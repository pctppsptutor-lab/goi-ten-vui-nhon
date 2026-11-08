// Game 02 — Trứng khủng long siêu quậy
// Every student sits in an egg on a nest; eggs wobble, hop and crack; the last one to hatch is called.
// Twist: the first egg to hatch only holds a rubber chicken; the mother dinosaur rolls the real egg into the winner's nest.
(() => {
  const NESTS = [[387, 327], [620, 300], [1013, 300], [1240, 327], [227, 407], [1387, 407], [180, 513], [1433, 520], [320, 620], [1287, 620]];
  const WIN_NEST = [800, 748], EGG_H = 150;

  // an egg sprite rotated around its own centre, sitting on (x, y)
  function egg(av, pose, x, y, h, rot = 0, alpha = 1) {
    const im = IMG['c' + av + '_' + pose]; if (!im) return;
    const w = im.width * h / im.height;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y - h / 2); ctx.rotate(rot); ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
  }

  GAME_IMPL.g2 = {
    id: 'g2', title: 'Mischievous Dino Eggs', base: 'assets/g2/', titleY: 470,
    assets: gAssets(['egg', 'egg_ready', 'egg_crack', 'egg_almost', 'twist', 'win'], ['dino_idle', 'dino_thinking', 'dino_pointing', 'dino_shocked', 'dino_celebrate', 'dino_tail_roll_egg', 'winner_nest', 'cracked_eggshells', 'rubber_chicken', 'dust_puffs', 'hatch_sparkles']),
    startBanner: '🥚 The eggs start to wobble!', mote: '#fff1b8', rayColor: '#fff2a8',

    setup(r) {
      const slots = spread(r.players.length);
      r.players.forEach((p, i) => { [p.hx, p.hy] = NESTS[slots[i]]; p.hy += 22; p.x = p.hx; p.y = p.hy; });
      r.fakes = makeFakes(r, 1.2);
      // the dinosaur comes in from the side nearer the winner
      r.dinoFrom = r.winner.hx > 800 ? 1750 : -150;
    },

    tick(r, t, te) {
      const f = activeFake(r, t);
      if (f && te < 0) cue('fk' + f.at, () => { r.banner = '🥚 ' + f.p.name + "'s egg is shaking hard!"; SFX.leader(); addFx('dust_puffs', f.p.hx, f.p.hy + 6, 170, .8); FX.smoke(f.p.hx, f.p.hy, 6, '#e8d3a8'); });
      if (te < -.2 && Math.random() < .03) SFX.tone(160 + Math.random() * 80, .08, { type: 'triangle', vol: .05 });   // little knocks
      const D = r.decoy, Wn = r.winner;
      if (!r.plain) {
        if (te > 0) cue('d0', () => { Music.play('tension'); outcome('almost_selected', D); r.banner = '🥚 ' + D.name + "'s egg is about to hatch!"; });
        if (te > .7) cue('d1', () => { outcome('wrong_turn', D); SFX.pop(); SFX.quack(0, 2.4); SFX.quack(.18, 2.6); SFX.sadTrombone(); addFx('dust_puffs', D.hx, D.hy, 200, .7); FX.shards(D.hx, D.hy - 70, 20); r.banner = '🐔 Huh?! It is just a rubber chicken!'; });
        if (te > 1.1) cue('d2', () => { CAM.shake(r, 7); SFX.boing(); r.banner = '🦖 Mama dino rolls another egg with her tail…'; });
        if (te > 1.6) cue('d3', () => { outcome('selected', Wn); SFX.wheee(); });
      } else {
        if (te > 0) cue('p0', () => { Music.play('tension'); outcome('almost_selected', D || Wn); r.banner = '🥚 ' + (D || Wn).name + "'s egg rattles wildly…"; });
        if (te > 1) cue('p1', () => { outcome('selected', Wn); SFX.boing(); r.banner = '🦖 Mama dino picks this egg!'; });
      }
      if (te > 2.6) cue('crk', () => { FX.shards(WIN_NEST[0], WIN_NEST[1] - 80, 8); FX.glitter(WIN_NEST[0], WIN_NEST[1] - 80, 8); SFX.sparkle(); SFX.tone(900, .1, { type: 'square', vol: .06 }); });
    },

    // where the winner's egg is during the reveal
    winnerEgg(r, te) {
      const W = r.winner;
      if (r.plain) {
        if (te < 1.2) return [W.hx, W.hy, 0];
        const k = clamp((te - 1.2) / 1.2), hop = Math.abs(Math.sin(k * Math.PI * 3)) * 70 * (1 - k * .5);
        return [lerp(W.hx, WIN_NEST[0], ease(k)), lerp(W.hy, WIN_NEST[1], ease(k)) - hop, 0];
      }
      if (te < 1.6) return [W.hx, W.hy, 0];
      const k = ease(clamp((te - 1.6) / 1)), dx = WIN_NEST[0] - W.hx;
      return [W.hx + dx * k, lerp(W.hy, WIN_NEST[1], k) - Math.abs(Math.sin(k * Math.PI * 2)) * 10, k * dx / 45];
    },

    render(r, t) {
      const rt = r.now, te = rt - r.TW, done = r.phase === 'done', f = activeFake(r, rt), D = r.decoy, Wn = r.winner;
      drawImg('winner_nest', WIN_NEST[0], WIN_NEST[1] + 20, 230, { anchor: 'bottom' });
      // mother dinosaur
      let dx = 95, dy = 900, dpose = rt < 1 ? 'dino_pointing' : f ? 'dino_thinking' : 'dino_idle', flip = false;
      if (!r.plain && te > 1.1 && !done) {
        const [ex, ey] = this.winnerEgg(r, te), side = r.dinoFrom > 800 ? 1 : -1;
        dx = lerp(r.dinoFrom, ex + side * 130, ease(clamp((te - 1.1) / .5))); dy = ey + 40;
        dpose = te < 2.6 ? 'dino_tail_roll_egg' : 'dino_pointing'; flip = side < 0;
      } else if (r.plain && te > 1 && !done) dpose = 'dino_pointing';
      if (done) { dx = WIN_NEST[0] + 230; dy = WIN_NEST[1] + 30; dpose = 'dino_celebrate'; }
      if (te > .7 && te < 1.1 && !r.plain) dpose = 'dino_shocked';
      const order = [...r.players].sort((a, b) => a.hy - b.hy);
      for (const p of order) {
        const isW = p === Wn, isD = p === D;
        if (isW && (done || te > (r.plain ? 1.2 : 1.6))) continue;          // drawn separately while moving
        if (isD && !r.plain && te > .7) {                                      // hatched: rubber chicken
          drawImg('cracked_eggshells', p.hx, p.hy + 4, 130, { anchor: 'bottom' });
          const b = clamp((te - .7) / .35), bounce = Math.abs(Math.sin(rt * 7)) * 18;
          drawImg('rubber_chicken', p.hx - 30, p.hy - 20 - b * 60 - bounce, 70, { anchor: 'bottom', rot: Math.sin(rt * 9) * .3 });
          charImg(p.av, 'twist', p.hx + 34, p.hy + 4, 120, { fallback: 'egg' });
          tagC(p.name, p.hx, p.hy + 34, false);
          continue;
        }
        const u = rt / r.TW, crack = u + p.seed * .25;
        let pose = crack < .45 ? 'egg' : crack < .8 ? 'egg_ready' : 'egg_crack';
        let rot = Math.sin(rt * (3 + p.seed * 4) + p.seed * 9) * (.03 + crack * .05), hop = 0;
        const teased = (f && f.p === p && te < 0) || (te > 0 && te < (r.plain ? 1 : .7) && p === (D || Wn));
        if (teased) { pose = 'egg_almost'; rot = Math.sin(rt * 38) * .16; hop = Math.abs(Math.sin(rt * 11)) * 16; }
        else if (Math.sin(rt * 2.3 + p.seed * 20) > .93 && te < 0) hop = Math.abs(Math.sin(rt * 14)) * 22;   // random little hops
        egg(p.av, pose, p.hx, p.hy - hop, EGG_H, rot);
        tagC(p.name, p.hx, p.hy + 34, teased);
      }
      // the winner's egg on its way / cracking in the winner nest
      if (!done && te > (r.plain ? 1.2 : 1.6)) {
        const [x, y, rot] = this.winnerEgg(r, te), cr = te > 2.6;
        if (!cr) FX.every(r, 'roll', .07, () => FX.smoke(x, y, 1, '#e8d3a8'));
        if (cr) FX.every(r, 'crk', .25, () => FX.shards(x, y - 90, 2));
        egg(Wn.av, cr ? 'egg_crack' : 'egg_ready', x, y, EGG_H * 1.1, cr ? Math.sin(rt * 40) * .14 : rot);
        if (cr) drawImg('hatch_sparkles', x, y - 60, 170, { alpha: .5 + .5 * Math.sin(rt * 12) });
        tagC(Wn.name, x, y + 34, true);
      }
      if (done) {
        const k = clamp((rt - r.doneAt) / .4);
        drawImg('hatch_sparkles', WIN_NEST[0], WIN_NEST[1] - 140, 300, { alpha: .9 });
        charImg(Wn.av, 'win', WIN_NEST[0], WIN_NEST[1] + 10, 250 * (.6 + .4 * ease(k)));
        tagC(Wn.name, WIN_NEST[0], WIN_NEST[1] + 40, true);
      }
      drawImg(dpose, dx, dy, dpose === 'dino_tail_roll_egg' ? 330 : 220, { anchor: 'bottom', flip });
    },

    idle(t) {
      drawImg('winner_nest', WIN_NEST[0], WIN_NEST[1] + 20, 230, { anchor: 'bottom' });
      NESTS.forEach(([x, y], i) => egg(i, 'egg', x, y + 22, EGG_H, Math.sin(t * 2 + i) * .05));
      drawImg('dino_idle', 95, 900, 220, { anchor: 'bottom' });
    },
    onFinish() { FX.shards(WIN_NEST[0], WIN_NEST[1] - 90, 34); FX.smoke(WIN_NEST[0], WIN_NEST[1], 8, '#fff6dc'); },
    winBanner: r => '🐣 ' + r.winner.name + ' has hatched!',
    winPos: () => ({ x: WIN_NEST[0], y: WIN_NEST[1] - 100 })
  };
})();
